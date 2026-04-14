import { useCallback, useState } from "react";
import { submitTransferRequest } from "../services/schoolTransferService";

const REQUIRED_FIELDS = {
  newSchool: "New school is required.",
  newProgram: "New program / course is required.",
  yearLevel: "Year level is required.",
  expectedGraduationYear: "Expected graduation year is required.",
  termType: "Term type is required.",
  gradingSystem: "Grading system is required.",
  academicYear: "Effective academic year is required.",
  term: "Effective term is required.",
  reason: "Reason for transfer is required.",
};

const FIELD_MAP = {
  newschool: "newSchool",
  newprogram: "newProgram",
  yearlevel: "yearLevel",
  expectedgraduationyear: "expectedGraduationYear",
  termtype: "termType",
  gradingsystem: "gradingSystem",
  academicyear: "academicYear",
  term: "term",
  reason: "reason",
  cornewschool: "corNewSchool",
};

const mapApiField = (f) => {
  const normalized = String(f || "").toLowerCase();
  return FIELD_MAP[normalized] || f || "_general";
};

export const useSchoolTransfer = () => {
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

  const validateForm = useCallback((values, corFile) => {
    const nextErrors = {};

    // Check all required text fields
    Object.entries(REQUIRED_FIELDS).forEach(([key, message]) => {
      if (!values?.[key] || !String(values[key]).trim()) {
        nextErrors[key] = message;
      }
    });

    // Graduation year must be a valid 4-digit number
    if (values?.expectedGraduationYear) {
      const yearVal = String(values.expectedGraduationYear).trim();
      if (!/^\d{4}$/.test(yearVal)) {
        nextErrors.expectedGraduationYear = "Enter a valid 4-digit year.";
      }
    }

    // Academic year format: YYYY-YYYY
    if (values?.academicYear) {
      const ayVal = String(values.academicYear).trim();
      if (!/^\d{4}-\d{4}$/.test(ayVal)) {
        nextErrors.academicYear = "Use YYYY-YYYY format (e.g. 2026-2027).";
      }
    }

    // COR file is required
    if (!corFile) {
      nextErrors.corNewSchool = "Certificate of Registration is required.";
    }

    setFieldErrors(nextErrors);
    setError("");
    return Object.keys(nextErrors).length === 0;
  }, []);

  const submitApplication = useCallback(async (values, corFile) => {
    setSubmitting(true);
    setError("");
    setFieldErrors({});

    try {
      const response = await submitTransferRequest(values, corFile);
      return response;
    } catch (err) {
      // Map backend validation details to per-field UI errors
      if (err?.details && typeof err.details === "object") {
        const nextErrors = {};
        if (Array.isArray(err.details)) {
          err.details.forEach((detail) => {
            if (detail.field) nextErrors[mapApiField(detail.field)] = detail.message;
          });
        } else {
          Object.entries(err.details).forEach(([k, v]) => {
            nextErrors[mapApiField(k)] = Array.isArray(v) ? v[0] : String(v);
          });
        }
        if (Object.keys(nextErrors).length > 0) {
          setFieldErrors(nextErrors);
          err.isValidationError = true;
        }
      }

      // Also handle the older `errors` array format
      if (err?.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const nextErrors = {};
        err.errors.forEach((issue) => {
          if (issue.field) nextErrors[mapApiField(issue.field)] = issue.message;
        });
        if (Object.keys(nextErrors).length > 0) {
          setFieldErrors(nextErrors);
          err.isValidationError = true;
        }
      }

      const message = err?.message || "Failed to submit transfer request.";
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
