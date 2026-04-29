import { useCallback, useState } from "react";
import { submitFinancialAssistance } from "../services/financialAssistanceService";

const REQUIRED_FIELDS = {
  itemDescription: "Item / Description is required.",
  subject: "Subject / Course is required.",
  purchasePlace: "Where to purchase is required.",
  academicYear: "Academic year is required.",
  term: "Term is required.",
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

    Object.entries(REQUIRED_FIELDS).forEach(([key, message]) => {
      if (!values?.[key]) {
        nextErrors[key] = message;
      }
    });

    receiptItems.forEach((item, idx) => {
      if (!item.file) {
        nextErrors[`receipt_file_${idx}`] = "Receipt file is missing.";
      }
      if (!item.purchaseDate) {
        nextErrors[`receipt_date_${idx}`] = "Purchase Date is missing.";
      } else if (!isValidDateString(item.purchaseDate)) {
        nextErrors[`receipt_date_${idx}`] = "Use mm/dd/yyyy format.";
      }
      
      const amountValue = Number(String(item.amount || "").replace(/,/g, ""));
      if (!item.amount || isNaN(amountValue) || amountValue <= 0) {
        nextErrors[`receipt_amount_${idx}`] = "Valid amount is required.";
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
      subject: values.subject,
      purchasePlace: values.purchasePlace,
      academicYear: values.academicYear,
      term: values.term,
      purpose: values.purpose,
      defaultReason: "Study Needs",
      receipts: receiptItems.map(r => ({ 
        purchaseDate: toIsoDate(r.purchaseDate), 
        amount: Number(String(r.amount || "").replace(/,/g, "")),
        notes: r.additionalNotes || "" 
      }))
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
              subject: "subject",
              purchaseplace: "purchasePlace",
              academicyear: "academicYear",
              term: "term",
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
