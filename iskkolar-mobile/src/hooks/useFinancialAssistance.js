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

const hasReceiptContent = (item) => {
  return Boolean(
    item?.file ||
    item?.purchaseDate ||
    item?.amount ||
    item?.additionalNotes
  );
};

const toIsoDate = (value) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value || "").trim());
  if (!match) return value;
  const day = match[1];
  const month = match[2];
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
    const activeReceiptItems = (receiptItems || []).filter(hasReceiptContent);

    // 1. itemDescription
    if (!values?.itemDescription || !values.itemDescription.trim()) {
      nextErrors.itemDescription = "Item / Description is required.";
    } else if (values.itemDescription.trim().length < 5) {
      nextErrors.itemDescription = "Item description must be at least 5 characters to be descriptive.";
    }

    // 2. subject
    if (!values?.subject || !values.subject.trim()) {
      nextErrors.subject = "Subject / Course is required.";
    } else if (values.subject.trim().length < 3) {
      nextErrors.subject = "Subject / Course must be at least 3 characters.";
    }

    // 3. purchasePlace
    if (!values?.purchasePlace || !values.purchasePlace.trim()) {
      nextErrors.purchasePlace = "Where to purchase is required.";
    } else if (values.purchasePlace.trim().length < 4) {
      nextErrors.purchasePlace = "Purchase location must be at least 4 characters.";
    }

    // 4. academicYear
    if (!values?.academicYear || !values.academicYear.trim()) {
      nextErrors.academicYear = "Academic year is required.";
    } else if (!/^\d{4}-\d{4}$/.test(values.academicYear.trim())) {
      nextErrors.academicYear = "Use YYYY-YYYY format (e.g. 2025-2026).";
    }

    // 5. term
    if (!values?.term || !values.term.trim()) {
      nextErrors.term = "Term is required.";
    }

    // 6. purpose
    if (!values?.purpose || !values.purpose.trim()) {
      nextErrors.purpose = "Purpose / Justification is required.";
    } else if (values.purpose.trim().length < 15) {
      nextErrors.purpose = "Please provide a detailed purpose / justification (at least 15 characters).";
    }

    // 7. Receipts validation
    if (activeReceiptItems.length === 0) {
      nextErrors.receiptItems = "Add at least one receipt.";
    }

    activeReceiptItems.forEach((item, idx) => {
      if (!item.file) {
        nextErrors[`receipt_file_${idx}`] = `Receipt #${idx + 1} file upload is missing.`;
      }
      if (!item.purchaseDate) {
        nextErrors[`receipt_date_${idx}`] = `Receipt #${idx + 1} purchase date is missing.`;
      } else if (!isValidDateString(item.purchaseDate)) {
        nextErrors[`receipt_date_${idx}`] = `Receipt #${idx + 1} purchase date must use dd/mm/yyyy format.`;
      } else {
        const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(item.purchaseDate).trim());
        if (match) {
          const d = Number(match[1]);
          const m = Number(match[2]);
          const y = Number(match[3]);
          const purchaseDateObj = new Date(y, m - 1, d);
          
          const academicYearStart = parseInt(String(values?.academicYear || "").split("-")[0]);
          const currentYear = new Date().getFullYear();
          const limitYear = isNaN(academicYearStart) ? currentYear : Math.min(academicYearStart, currentYear);
          
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          
          if (purchaseDateObj.getFullYear() < limitYear) {
            nextErrors[`receipt_date_${idx}`] = `Receipt #${idx + 1} date cannot be in a past year (must be ${limitYear} or later).`;
          } else if (purchaseDateObj > today) {
            nextErrors[`receipt_date_${idx}`] = `Receipt #${idx + 1} date cannot be in the future.`;
          }
        }
      }
      
      const amountValue = Number(String(item.amount || "").replace(/,/g, ""));
      if (!item.amount) {
        nextErrors[`receipt_amount_${idx}`] = `Receipt #${idx + 1} amount is required.`;
      } else if (isNaN(amountValue) || amountValue <= 0) {
        nextErrors[`receipt_amount_${idx}`] = `Receipt #${idx + 1} amount must be a positive number greater than 0.`;
      }

      if (item.additionalNotes && item.additionalNotes.trim().length > 0 && item.additionalNotes.trim().length < 5) {
        nextErrors[`receipt_notes_${idx}`] = `Receipt #${idx + 1} notes must be at least 5 characters if provided.`;
      }
    });

    setFieldErrors(nextErrors);
    setError("");
    return {
      isValid: Object.keys(nextErrors).length === 0,
      errors: nextErrors,
    };
  }, []);

  const submitApplication = useCallback(async (values, receiptItems, supportingDocument) => {
    setSubmitting(true);
    setError("");
    setFieldErrors({});

    const activeReceiptItems = (receiptItems || []).filter(hasReceiptContent);

    const formData = {
      itemDescription: values.itemDescription,
      subject: values.subject,
      purchasePlace: values.purchasePlace,
      academicYear: values.academicYear,
      term: values.term,
      purpose: values.purpose,
      receipts: activeReceiptItems.map(r => ({ 
        purchaseDate: toIsoDate(r.purchaseDate), 
        amount: Number(String(r.amount || "").replace(/,/g, "")),
        notes: r.additionalNotes || "" 
      }))
    };

    const files = {
      supportingDocument: supportingDocument,
      receipts: activeReceiptItems.map(r => r.file)
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
