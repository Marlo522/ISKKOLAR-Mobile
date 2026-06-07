import { useCallback, useMemo, useState, useEffect } from "react";
import {
  lookupStaffByStaffId,
  submitChildDesignationApplication,
  submitStaffAdvancementApplication,
  validateChildDesignationStep,
  validateStaffAdvancementStep,
  getMyChildDesignationApplications,
  getMyStaffAdvancementApplications,
} from "../services/StaffApplication";
import { getScholarshipFormAccess } from "../services/applicationGuardService";

const FIELD_MAP = {
  educ_path: "educPath",
  incoming_freshman: "incomingFreshman",
  secondary_school: "secondarySchool",
  year_graduated: "yearGraduated",
  secondary_year_graduated: "yearGraduated",
  tertiary_school: "tertiarySchool",
  program: "program",
  term_type: "termType",
  grade_scale: "gradeScale",
  year_level: "yearLevel",
  term: "term",
  expected_graduation_year: "expectedGradYear",
  term_start_date: "termStartDate",
  term_end_date: "termEndDate",
  secondary_gwa: "secondaryGwa",
  tertiary_gwa: "tertiaryGwa",
  prev_school_name: "prevSchoolName",
  prev_program: "prevProgram",
  prev_year_graduated: "prevYearGraduated",
  prev_grade_scale: "prevGradeScale",
  staff_id: "staffId",
  first_name: "firstName",
  middle_name: "middleName",
  last_name: "lastName",
  suffix: "suffix",
  position: "position",
  cor: "cor",
  grade_report: "gradeReport",
  current_term_report: "currentTermGradeReport",
  birth_certificate: "birthCert",
  letter_intent_applicant: "letterOfIntentApplicant",
  letter_intent_parent: "letterOfIntentParent",
  letter_of_intent: "letterOfIntentApplicant",
  letter_of_intent_applicant: "letterOfIntentApplicant",
  letter_of_intent_parent: "letterOfIntentParent",
  general: "_general",
};

const normalizeFieldPath = (field) => String(field || "").replace(/\[(\d+)\]/g, ".$1");

const mapApiFieldToUiKey = (field) => {
  const normalized = normalizeFieldPath(field);
  if (!normalized) return "_general";
  return FIELD_MAP[normalized] || normalized;
};

const parseDateString = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue instanceof Date && !Number.isNaN(dateValue.getTime())) {
    return dateValue;
  }
  
  const text = String(dateValue).trim();
  
  // 1. Check for ISO or YYYY-MM-DD format (optionally with time/timezone)
  const isoMatch = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})([ T]|$)/.exec(text);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    return new Date(year, month, day);
  }
  
  // 2. Check for DD/MM/YYYY or MM/DD/YYYY format
  const slashMatch = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(text);
  if (slashMatch) {
    const p1 = Number(slashMatch[1]);
    const p2 = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);
    
    let month = p1 - 1;
    let day = p2;
    
    // Auto-detect DD/MM vs MM/DD if one of them is greater than 12
    if (p1 > 12 && p2 <= 12) {
      month = p2 - 1;
      day = p1;
    }
    
    return new Date(year, month, day);
  }
  
  // 3. Fallback to native JS Date parsing if it yields a valid date
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }
  
  return null;
};

const normalizeApiErrorShape = (err) => ({
  status: err?.status,
  message: err?.message || "An unexpected error occurred.",
  errors: Array.isArray(err?.errors) ? err.errors : [],
});

const buildPayload = (values, isChildDesignation) => {
  let mappedEducPath = "";
  if (!isChildDesignation && values.educPath) {
    if (values.educPath.startsWith("Tertiary")) {
      mappedEducPath = "Tertiary";
    } else if (values.educPath.startsWith("Masters")) {
      mappedEducPath = "Masters";
    } else {
      mappedEducPath = values.educPath;
    }
  }

  return {
    applicant_category: isChildDesignation ? "child_designation" : "self_advancement",
    educ_path: isChildDesignation ? "Tertiary" : mappedEducPath,
    incoming_freshman: values.incomingFreshman === "Yes" ? "true" : "false",
    secondary_school: values.secondarySchool || "",
    strand: values.strand || "",
    year_graduated: values.yearGraduated || "",
    secondary_year_graduated: values.yearGraduated || "",
    secondary_gwa: (values.incomingFreshman === "Yes" || values.educPath === "Masters Education") ? values.secondaryGwa || "" : "",
    tertiary_school: values.tertiarySchool || "",
    program: values.program || "",
    term_type: values.termType || "",
    grade_scale: values.gradeScale || "",
    year_level: values.yearLevel || "",
    term: values.term || "",
    term_start_date: values.termStartDate || "",
    term_end_date: values.termEndDate || "",
    tertiary_gwa: values.tertiaryGwa || "",
    expected_graduation_year: values.expectedGradYear || "",
    prev_school_name: values.prevSchoolName || "",
    prev_program: values.prevProgram || "",
    prev_year_graduated: values.prevYearGraduated || "",
    prev_grade_scale: values.prevGradeScale || "",
    staff_id: values.staffId || "",
    first_name: values.firstName || "",
    middle_name: values.middleName || "",
    last_name: values.lastName || "",
    suffix: values.suffix || "",
    position: values.position || "",
  };
};

const buildFiles = (uploads = {}) => {
  const files = {};
  if (uploads.gradeReport) files.grade_report = uploads.gradeReport;
  if (uploads.cor) files.cor = uploads.cor;
  if (uploads.currentTermGradeReport) files.current_term_report = uploads.currentTermGradeReport;
  if (uploads.birthCert) files.birth_certificate = uploads.birthCert;
  if (uploads.essay) files.essay = uploads.essay;
  if (uploads.letterOfIntentApplicant) files.letter_intent_applicant = uploads.letterOfIntentApplicant;
  if (uploads.letterOfIntentParent) files.letter_intent_parent = uploads.letterOfIntentParent;
  if (uploads.incomeGuardian) files.income_cert_guardian = uploads.incomeGuardian;
  if (uploads.indigencyGuardian) files.indigency_cert_guardian = uploads.indigencyGuardian;
  if (uploads.incomeFather) files.income_cert_father = uploads.incomeFather;
  if (uploads.indigencyFather) files.indigency_cert_father = uploads.indigencyFather;
  if (uploads.incomeMother) files.income_cert_mother = uploads.incomeMother;
  if (uploads.indigencyMother) files.indigency_cert_mother = uploads.indigencyMother;

  Object.entries(uploads).forEach(([key, file]) => {
    if (!file) return;
    const memberIncomeMatch = /^incomeMember_(\d+)$/.exec(key);
    if (memberIncomeMatch) {
      files[`income_cert_member_${memberIncomeMatch[1]}`] = file;
      return;
    }
    const memberIndigencyMatch = /^indigencyMember_(\d+)$/.exec(key);
    if (memberIndigencyMatch) {
      files[`indigency_cert_member_${memberIndigencyMatch[1]}`] = file;
    }
  });

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

  const [isCheckingGuard, setIsCheckingGuard] = useState(true);
  const [ongoingApplication, setOngoingApplication] = useState(null);

  const checkGuard = useCallback(async () => {
    setIsCheckingGuard(true);
    try {
      const access = await getScholarshipFormAccess({ program: "employeeChild", option: isChildDesignation ? "Option 2" : "Option 1" });
      setOngoingApplication(access?.blockedApplication || null);
    } catch {
      setOngoingApplication(null);
    } finally {
      setIsCheckingGuard(false);
    }
  }, [isChildDesignation]);

  useEffect(() => {
    checkGuard();
  }, [checkGuard]);

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

        // Required text fields
        if (!values.secondarySchool || values.secondarySchool.trim() === "")
          preflightErrors.secondarySchool = "Secondary School Name is required.";
        if (!values.tertiarySchool || values.tertiarySchool.trim() === "")
          preflightErrors.tertiarySchool = "University / College Name is required.";
        if (!values.program || values.program.trim() === "")
          preflightErrors.program = "Degree Program is required.";

        if (values.educPath === "Masters Education") {
          if (!values.prevSchoolName || values.prevSchoolName.trim() === "")
            preflightErrors.prevSchoolName = "Previous School Name is required.";
          if (!values.prevProgram || values.prevProgram.trim() === "")
            preflightErrors.prevProgram = "Previous Program is required.";
          if (!values.prevYearGraduated || values.prevYearGraduated.trim() === "")
            preflightErrors.prevYearGraduated = "Previous Year Graduated is required.";
        }

        if (values.educPath === "Masters Education") {
          if (!values.secondaryGwa || values.secondaryGwa.trim() === "") {
            preflightErrors.secondaryGwa = "Previous Tertiary GWA is required.";
          }
        } else {
          if (values.incomingFreshman === "Yes") {
            if (!values.secondaryGwa || values.secondaryGwa.trim() === "") {
              preflightErrors.secondaryGwa = "Secondary GWA is required.";
            }
          }
        }
        
        if (values.incomingFreshman === "No") {
          if (!values.tertiaryGwa || values.tertiaryGwa.trim() === "") {
            preflightErrors.tertiaryGwa = values.educPath === "Masters Education"
              ? "Current Masters GWA is required."
              : "Tertiary GWA is required.";
          }
        }

        if (!values.termStartDate || values.termStartDate.trim() === "") {
          preflightErrors.termStartDate = "Term Start Date is required.";
        } else {
          const start = parseDateString(values.termStartDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (start && start < today) {
            preflightErrors.termStartDate = "Term Start Date cannot be in the past.";
          }
        }
        if (!values.termEndDate || values.termEndDate.trim() === "") {
          preflightErrors.termEndDate = "Term End Date is required.";
        }

        if (values.termStartDate && values.termEndDate) {
          const start = parseDateString(values.termStartDate);
          const end = parseDateString(values.termEndDate);
          if (start && end) {
            const limit = new Date(start);
            limit.setMonth(limit.getMonth() + 1);
            if (end < limit) {
              preflightErrors.termEndDate = "Term End Date must be at least 1 month after Term Start Date.";
            }
          }
        }

        const checkYear = (val, key, label, allowFuture = false) => {
          if (!val) return;
          if (!/^\d{4}$/.test(String(val))) {
            preflightErrors[key] = `${label} must be 4 digits.`;
            return;
          }

          const numericYear = Number(val);
          if (!allowFuture && numericYear > currentYear) {
            preflightErrors[key] = `${label} cannot be in the future.`;
          }
        };

        checkYear(values.yearGraduated, "yearGraduated", "Year Graduated");
        checkYear(values.prevYearGraduated, "prevYearGraduated", "Previous Year Graduated");
        checkYear(values.expectedGradYear, "expectedGradYear", "Expected Graduation Year", true);

        if ((values.educPath === "Tertiary Education" || values.educPath === "Masters Education") && values.incomingFreshman === "No") {
          if (!uploads.cor) {
            preflightErrors.cor = "Certificate of Registration is required.";
          }
          if (!uploads.currentTermGradeReport) {
            preflightErrors.currentTermGradeReport = "Current Term Report Card is required.";
          }
        } else if ((values.educPath === "Tertiary Education" || values.educPath === "Masters Education") && values.incomingFreshman === "Yes") {
          if (!uploads.cor) {
            preflightErrors.cor = "Certificate of Registration is required.";
          }
        } else {
          // This is for Child Designation
          if (isChildDesignation) {
            if (!uploads.cor) {
              preflightErrors.cor = "Certificate of Registration is required.";
            }
            if (values.incomingFreshman === "No") {
              if (!uploads.currentTermGradeReport) {
                preflightErrors.currentTermGradeReport = "Current Term Report Card is required.";
              }
            } else {
              // Freshman
              if (!uploads.gradeReport) {
                preflightErrors.gradeReport = "Grade Report is required.";
              }
            }
          } else {
            // Fallback
            if (!uploads.cor) {
              preflightErrors.cor = "Certificate of Registration is required.";
            }
          }
        }

        if (Object.keys(preflightErrors).length > 0) {
          setFieldErrors(preflightErrors);
          return false;
        }
      }

      if (uiStep === 2 && isChildDesignation) {
        if (values.incomingFreshman === "Yes") {
          const preflightErrors = {};
          if (!uploads.birthCert) {
            preflightErrors.birthCert = "Birth Certificate is required.";
          }
          if (!uploads.letterOfIntentApplicant) {
            preflightErrors.letterOfIntentApplicant = "Letter of Intent (Applicant) is required.";
          }
          if (!uploads.letterOfIntentParent) {
            preflightErrors.letterOfIntentParent = "Letter of Intent (Parent) is required.";
          }
          if (Object.keys(preflightErrors).length > 0) {
            setFieldErrors(preflightErrors);
            return false;
          }
        }
      }

      try {
        const payload = buildPayload(values, isChildDesignation);
        const files = buildFiles(uploads);

        // Backend KKFI step numbering is 1-based.
        if (uiStep === 2 && isChildDesignation) {
          return true;
        }
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
    isCheckingGuard,
    ongoingApplication,
    recheckGuard: checkGuard,
  };
};

export default useStaffApplication;