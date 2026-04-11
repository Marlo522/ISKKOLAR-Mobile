import { useCallback, useMemo, useState } from "react";
import {
  lookupStaffByStaffId,
  submitChildDesignationApplication,
  submitStaffAdvancementApplication,
  validateChildDesignationStep,
  validateStaffAdvancementStep,
} from "../services/StaffApplication";

const FIELD_MAP = {
  educ_path: "educPath",
  incoming_freshman: "incomingFreshman",
  secondary_school: "schoolName",
  year_graduated: "secondaryYearGraduated",
  secondary_year_graduated: "secondaryYearGraduated",
  tertiary_school: "universityName",
  program: "program",
  term_type: "termType",
  grade_scale: "gradeScale",
  year_level: "yearLevel",
  term: "term",
  expected_graduation_year: "expectedGradYear",
  prev_school_name: "prevSchoolName",
  prev_program: "prevProgram",
  prev_year_graduated: "prevYearGraduated",
  staff_id: "staffId",
  first_name: "firstName",
  middle_name: "middleName",
  last_name: "lastName",
  suffix: "suffix",
  position: "position",
  cor: "cor",
  grade_report: "gradeReport",
  current_term_report: "currentTermGradeReport",
  general: "_general",
};

const normalizeFieldPath = (field) => String(field || "").replace(/\[(\d+)\]/g, ".$1");

const mapApiFieldToUiKey = (field) => {
  const normalized = normalizeFieldPath(field);
  if (!normalized) return "_general";
  return FIELD_MAP[normalized] || normalized;
};

const normalizeApiErrorShape = (err) => ({
  status: err?.status,
  message: err?.message || "An unexpected error occurred.",
  errors: Array.isArray(err?.errors) ? err.errors : [],
});

const buildPayload = (values, isChildDesignation) => ({
  applicant_category: isChildDesignation ? "child_designation" : "self_advancement",
  educ_path: isChildDesignation ? "Tertiary" : values.educPath || "",
  incoming_freshman: values.incomingFreshman === "Yes" ? "true" : "false",
  secondary_school: values.schoolName || "",
  strand: values.strand || "",
  year_graduated: values.secondaryYearGraduated || "",
  secondary_year_graduated: values.secondaryYearGraduated || "",
  tertiary_school: values.universityName || "",
  program: values.program || "",
  term_type: values.termType || "",
  grade_scale: values.gradeScale || "",
  year_level: values.yearLevel || "",
  term: values.term || "",
  expected_graduation_year: values.expectedGradYear || "",
  prev_school_name: values.prevSchoolName || "",
  prev_program: values.prevProgram || "",
  prev_year_graduated: values.prevYearGraduated || "",
  staff_id: values.staffId || "",
  first_name: values.firstName || "",
  middle_name: values.middleName || "",
  last_name: values.lastName || "",
  suffix: values.suffix || "",
  position: values.position || "",
});

const buildFiles = (uploads = {}) => {
  const files = {};
  if (uploads.gradeReport) files.grade_report = uploads.gradeReport;
  if (uploads.cor) files.cor = uploads.cor;
  if (uploads.currentTermGradeReport) files.current_term_report = uploads.currentTermGradeReport;
  return files;
};

export const useStaffApplication = (isChildDesignation) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [qualificationOutcome, setQualificationOutcome] = useState(null);
  const [staffLookupLoading, setStaffLookupLoading] = useState(false);
  const [staffLookupMessage, setStaffLookupMessage] = useState("");

  const stepValidator = useMemo(
    () => (isChildDesignation ? validateChildDesignationStep : validateStaffAdvancementStep),
    [isChildDesignation]
  );

  const submitter = useMemo(
    () => (isChildDesignation ? submitChildDesignationApplication : submitStaffAdvancementApplication),
    [isChildDesignation]
  );

  const clearFieldError = useCallback((key) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleApiError = useCallback((rawError) => {
    const err = normalizeApiErrorShape(rawError);

    if (err.status === 400 && err.errors.length > 0) {
      const mappedErrors = {};

      err.errors.forEach((e) => {
        const key = mapApiFieldToUiKey(e.field);
        if (!mappedErrors[key]) mappedErrors[key] = e.message || "Invalid value.";
      });

      setFieldErrors(mappedErrors);
      setError(null);
      return;
    }

    if (err.status === 429) {
      setError("Rate limit exceeded. Please wait a moment before trying again.");
      return;
    }

    if (err.status === 0) {
      setError("Network error. Please check your connection and try again.");
      return;
    }

    setError(err.message || "An unexpected error occurred.");
  }, []);

  const verifyStaffById = useCallback(async (staffId) => {
    const trimmedId = String(staffId || "").trim();

    if (!trimmedId) {
      setStaffLookupMessage("");
      setFieldErrors((prev) => ({ ...prev, staffId: "Staff ID is required." }));
      return null;
    }

    setStaffLookupLoading(true);
    setStaffLookupMessage("");

    try {
      const staffRecord = await lookupStaffByStaffId(trimmedId);
      if (!staffRecord) {
        setFieldErrors((prev) => ({ ...prev, staffId: "Staff not found." }));
        setStaffLookupMessage("Staff not found.");
        return null;
      }

      setFieldErrors((prev) => {
        if (!prev.staffId) return prev;
        const next = { ...prev };
        delete next.staffId;
        return next;
      });
      setStaffLookupMessage("Staff record found.");
      return staffRecord;
    } catch (err) {
      const lookupError = err?.message || "Failed to look up staff record.";
      setFieldErrors((prev) => ({ ...prev, staffId: lookupError }));
      setStaffLookupMessage(lookupError);
      return null;
    } finally {
      setStaffLookupLoading(false);
    }
  }, []);

  const validateStep = useCallback(
    async (uiStep, values, uploads) => {
      setError(null);
      setFieldErrors({});

      if (uiStep === 0) {
        const currentYear = new Date().getFullYear();
        const preflightErrors = {};

        const checkYear = (val, key, label) => {
          if (!val) return;
          if (!/^\d{4}$/.test(String(val))) {
            preflightErrors[key] = `${label} must be 4 digits.`;
            return;
          }

          const numericYear = Number(val);
          if (numericYear > currentYear) {
            preflightErrors[key] = `${label} cannot be in the future.`;
          }
        };

        checkYear(values.secondaryYearGraduated, "secondaryYearGraduated", "Year Graduated");
        checkYear(values.prevYearGraduated, "prevYearGraduated", "Previous Year Graduated");

        if (Object.keys(preflightErrors).length > 0) {
          setFieldErrors(preflightErrors);
          return false;
        }
      }

      try {
        const payload = buildPayload(values, isChildDesignation);
        const files = buildFiles(uploads);

        // Backend KKFI step numbering is 1-based.
        await stepValidator(uiStep + 1, payload, files);
        return true;
      } catch (err) {
        handleApiError(err);
        return false;
      }
    },
    [handleApiError, isChildDesignation, stepValidator]
  );

  const submitApplication = useCallback(
    async (values, uploads) => {
      setSubmitting(true);
      setError(null);
      setFieldErrors({});
      setQualificationOutcome(null);

      try {
        const payload = buildPayload(values, isChildDesignation);
        const files = buildFiles(uploads);
        const response = await submitter(payload, files);

        if (response?.data) {
          setQualificationOutcome(response.data);
        }

        return response;
      } catch (err) {
        handleApiError(err);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [handleApiError, isChildDesignation, submitter]
  );

  return {
    submitting,
    error,
    fieldErrors,
    qualificationOutcome,
    staffLookupLoading,
    staffLookupMessage,
    validateStep,
    submitApplication,
    clearFieldError,
    verifyStaffById,
  };
};

export default useStaffApplication;