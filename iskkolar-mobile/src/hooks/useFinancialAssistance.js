import { useCallback, useState } from "react";
import { submitFinancialAssistance } from "../services/financialAssistanceService";

const REQUIRED_FIELDS = {
  itemDescription: "Item / Description is required.",
  subjectCourse: "Subject / Course is required.",
  whereToPurchase: "Where to purchase is required.",
  amountRequested: "Amount requested is required.",
  purpose: "Purpose / Justification is required.",
};

const isValidDateString = (value) => /^\d{2}\/\d{2}\/\d{4}$/.test(String(value || ""));

const toIsoDate = (value) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value || "").trim());
  if (!match) return value;
  const month = match[1];
  const day = match[2];
  const year = match[3];
  return `${year}-${month}-${day}`;
};

export const useFinancialAssistance = () => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const clearFieldError = useCallback((key) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const validateForm = useCallback((values, receiptItems) => {
    const nextErrors = {};
    let hasReceiptError = false;

    Object.entries(REQUIRED_FIELDS).forEach(([key, message]) => {
      if (!values?.[key]) {
        nextErrors[key] = message;
      }
    });

    if (values?.amountRequested && isNaN(Number(values.amountRequested.replace(/,/g, '')))) {
      nextErrors.amountRequested = "Amount must be numbers only.";
    }

    receiptItems.forEach((item, idx) => {
      if (!item.file) {
        nextErrors[`receipt_file_${idx}`] = "Receipt file is missing.";
        hasReceiptError = true;
      }
      if (!item.purchaseDate) {
        nextErrors[`receipt_date_${idx}`] = "Purchase Date is missing.";
        hasReceiptError = true;
      } else if (!isValidDateString(item.purchaseDate)) {
        nextErrors[`receipt_date_${idx}`] = "Use mm/dd/yyyy format.";
        hasReceiptError = true;
      }
    });

    setFieldErrors(nextErrors);
    setError("");
    return Object.keys(nextErrors).length === 0;
  }, []);

  const submitApplication = useCallback(async (values, receiptItems, supportingDocument) => {
    setSubmitting(true);
    setError("");
    setFieldErrors({});

    const formData = {
      itemDescription: values.itemDescription,
      subject: values.subjectCourse,
      purchasePlace: values.whereToPurchase,
      amount: values.amountRequested,
      purpose: values.purpose,
      defaultReason: "Study Needs",
      receipts: receiptItems.map(r => ({ purchaseDate: toIsoDate(r.purchaseDate), notes: r.additionalNotes }))
    };

    const files = {
      supportingDocument: supportingDocument,
      receipts: receiptItems.map(r => r.file)
    };

    try {
      const response = await submitFinancialAssistance(formData, files);
      return response;
    } catch (err) {
      if (err?.details && typeof err.details === "object") {
        const nextErrors = {};
        const mapField = (f) => {
           const normalized = String(f || "").toLowerCase();
           const FIELD_MAP = {
              itemdescription: "itemDescription",
              subject: "subjectCourse",
              purchaseplace: "whereToPurchase",
              amount: "amountRequested",
              purpose: "purpose",
           };
           return FIELD_MAP[normalized] || f || "_general";
        };

        if (Array.isArray(err.details)) {
           err.details.forEach(detail => {
              if (detail.field) nextErrors[mapField(detail.field)] = detail.message;
           });
        } else {
           Object.entries(err.details).forEach(([k, v]) => {
              nextErrors[mapField(k)] = Array.isArray(v) ? v[0] : String(v);
           });
        }
        setFieldErrors(nextErrors);
        
        // Suppress native throw for standard backend field validations to avoid alert toasts
        if (Object.keys(nextErrors).length > 0) {
           err.isValidationError = true;
        }
      }
      const message = err?.message || "Failed to submit financial assistance application.";
      setError(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    submitting,
    error,
    fieldErrors,
    clearFieldError,
    validateForm,
    submitApplication,
  };
};
