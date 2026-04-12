import { useCallback, useState } from "react";
import { submitExamAssistance } from "../services/examAssistanceService";

const REQUIRED_FIELDS = {
  assistanceType: "Type of assistance is required.",
  examType: "Exam/certification type is required.",
  examDate: "Exam date is required.",
  testingCenter: "Testing center/location is required.",
  takenBefore: "Please select if you already took the exam.",
};

const isValidDateString = (value) => /^\d{2}\/\d{2}\/\d{4}$/.test(String(value || ""));

const FIELD_MAP = {
  assistancetype: "assistanceType",
  examtype: "examType",
  examdate: "examDate",
  testingcenter: "testingCenter",
  takenbefore: "takenBefore",
  additionalnotes: "additionalNotes",
  exam_registration: "examRegistration",
  review_enrollment: "reviewCourse",
  firstattempt: "takenBefore",
  location: "testingCenter",
  notes: "additionalNotes",
};

const mapApiFieldToUiKey = (field) => {
  const normalized = String(field || "").toLowerCase();
  return FIELD_MAP[normalized] || field || "_general";
};

const toDetailsArray = (details) => {
  if (Array.isArray(details)) return details;
  if (!details) return [];

  if (typeof details === "object") {
    return Object.entries(details).flatMap(([field, value]) => {
      if (Array.isArray(value)) {
        return value.map((msg) => ({ field, message: String(msg) }));
      }
      return [{ field, message: String(value) }];
    });
  }

  if (typeof details === "string") {
    return [{ field: "_general", message: details }];
  }

  return [];
};

const buildReadableDetailMessage = (details) => {
  const list = toDetailsArray(details);
  if (!list.length) return "";
  return list
    .map((item) => {
      const field = item?.field ? `${item.field}: ` : "";
      return `${field}${item?.message || "Invalid value."}`;
    })
    .join("\n");
};

const normalizeAssistanceType = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  if (raw.includes("review")) return "Review Support";
  if (raw.includes("cash")) return "Cash Incentive";
  return value;
};

const normalizeTakenBefore = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  if (raw.includes("first attempt")) return "Yes, this is my first attempt";
  if (raw.includes("taken it before")) return "No, I have taken it before";
  if (raw.startsWith("yes")) return "Yes, this is my first attempt";
  if (raw.startsWith("no")) return "No, I have taken it before";
  return value;
};

const toIsoDate = (value) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value || "").trim());
  if (!match) return value;
  const month = match[1];
  const day = match[2];
  const year = match[3];
  return `${year}-${month}-${day}`;
};

export const useExamAssistance = () => {
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

  const validateStep = useCallback((step, values, uploads) => {
    const nextErrors = {};

    if (step === 0) {
      Object.entries(REQUIRED_FIELDS).forEach(([key, message]) => {
        if (!values?.[key]) {
          nextErrors[key] = message;
        }
      });

      if (values?.examDate && !isValidDateString(values.examDate)) {
        nextErrors.examDate = "Exam date must use mm/dd/yyyy format.";
      }
    }

    if (step === 1 && !uploads?.examRegistration) {
      nextErrors.examRegistration = "Exam registration/confirmation is required.";
    }

    setFieldErrors(nextErrors);
    setError("");
    return Object.keys(nextErrors).length === 0;
  }, []);

  const submitApplication = useCallback(async (values, uploads) => {
    setSubmitting(true);
    setError("");
    setFieldErrors({});

    // Keep submit payload aligned with the web form contract.
    const normalizedAssistanceType = normalizeAssistanceType(values.assistanceType);
    const normalizedTakenBefore = normalizeTakenBefore(values.takenBefore);
    const normalizedExamDate = toIsoDate(values.examDate);

    const payload = {
      assistanceType: normalizedAssistanceType,
      examType: values.examType,
      examDate: normalizedExamDate,
      location: values.testingCenter,
      firstAttempt: normalizedTakenBefore,
      notes: values.additionalNotes,
    };

    try {
      const response = await submitExamAssistance(payload, {
        exam_registration: uploads.examRegistration,
        review_enrollment: uploads.reviewCourse,
      });
      return response;
    } catch (err) {
      // Map backend validation details to per-field UI errors.
      const detailItems = toDetailsArray(err?.details);

      if (detailItems.length > 0) {
        const mappedErrors = {};
        detailItems.forEach((issue) => {
          const key = mapApiFieldToUiKey(issue?.field);
          if (!mappedErrors[key]) {
            mappedErrors[key] = issue?.message || "Invalid value.";
          }
        });
        setFieldErrors(mappedErrors);
      }

      const message = err?.message || "Failed to submit exam assistance application.";
      const detailMessage = buildReadableDetailMessage(err?.details);
      const composedMessage = detailMessage ? `${message}\n${detailMessage}` : message;

      setError(composedMessage);
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
    validateStep,
    submitApplication,
  };
};
