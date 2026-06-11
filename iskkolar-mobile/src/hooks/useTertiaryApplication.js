import { useState, useCallback, useContext, useEffect } from "react";
import { getScholarshipFormAccess } from "../services/applicationGuardService";
import { AuthContext } from "../context/AuthContext";
import { getMyApplications as fetchMyApplications, validateTertiaryStep, submitTertiaryApplication } from "../services/tertiaryAppService";
import { validateGwa, INVALID_GWA_ERROR } from "../utils/gradeValidation";

const FIELD_MAP = {
  scholarship_type: "scholarshipType",
  incoming_freshman: "incomingFreshman",
  secondary_school: "secondarySchool",
  tertiary_school: "tertiarySchool",
  expected_graduation_year: "expectedGradYear",
  grade_scale: "gradeScale",
  term_type: "termType",
  year_level: "yearLevel",
  strand: "strand",
  program: "program",
  term: "term",
  year_graduated: "yearGraduated",
  secondary_gwa: "secondaryGwa",
  tertiary_gwa: "tertiaryGwa",
  term_start_date: "termStartDate",
  term_end_date: "termEndDate",
  grade_report: "gradeReport",
  current_term_report: "currentTermGradeReport",
  cor: "cor",
  certificate_of_indigency: "indigency",
  birth_certificate: "birthCert",
  essay: "essay",
  recommendation_letter: "recommendation",
  letter_of_intent_applicant: "letterOfIntentApplicant",
  letter_of_intent_parent: "letterOfIntentParent",
  letter_intent_applicant: "letterOfIntentApplicant",
  letter_intent_parent: "letterOfIntentParent",
  income_cert_father: "incomeFather",
  income_cert_mother: "incomeMother",
  indigency_cert_father: "indigencyFather",
  indigency_cert_mother: "indigencyMother",
  documents: "documents",
  family_members: "familyMembers",
  father_birthday: "fatherBirthday",
  mother_birthday: "motherBirthday",
  guardian_birthday: "guardianBirthday",
  general: "_general",
};

const normalizeFieldPath = (field) =>
  String(field || "").replace(/\[(\d+)\]/g, ".$1");

const mapFamilyFieldToUi = (normalizedField, rolesArray) => {
  const parts = normalizedField.split(".");
  if (parts.length < 3) return null;

  const index = Number(parts[1]);
  const prop = parts[2];

  // If we don't have rolesArray, fallback to legacy index mapping
  if (!rolesArray) {
    if (index === 0) {
      if (prop === "full_name") return "fatherName";
      if (prop === "birthday") return "fatherBirthday";
      if (prop === "employment_status") return "fatherStatus";
      if (prop === "occupation") return "fatherOccupation";
      if (prop === "monthly_income") return "fatherIncome";
      if (prop === "contact_number") return "fatherContact";
      return null;
    }
    if (index === 1) {
      if (prop === "full_name") return "motherName";
      if (prop === "birthday") return "motherBirthday";
      if (prop === "employment_status") return "motherStatus";
      if (prop === "occupation") return "motherOccupation";
      if (prop === "monthly_income") return "motherIncome";
      if (prop === "contact_number") return "motherContact";
      return null;
    }
    const dynIndex = index - 2;
    if (prop === "full_name") return "dynFamily_" + dynIndex + "_name";
    if (prop === "birthday") return "dynFamily_" + dynIndex + "_birthday";
    if (prop === "role") return "dynFamily_" + dynIndex + "_relationship";
    if (prop === "employment_status") return "dynFamily_" + dynIndex + "_status";
    if (prop === "occupation") return "dynFamily_" + dynIndex + "_occupation";
    if (prop === "monthly_income") return "dynFamily_" + dynIndex + "_income";
    if (prop === "contact_number") return "dynFamily_" + dynIndex + "_contactNo";
    return null;
  }

  const role = rolesArray[index];
  
  if (role === "father") {
    if (prop === "full_name") return "fatherName";
    if (prop === "birthday") return "fatherBirthday";
    if (prop === "employment_status") return "fatherStatus";
    if (prop === "occupation") return "fatherOccupation";
    if (prop === "monthly_income") return "fatherIncome";
    if (prop === "contact_number") return "fatherContact";
    return null;
  }

  if (role === "mother") {
    if (prop === "full_name") return "motherName";
    if (prop === "birthday") return "motherBirthday";
    if (prop === "employment_status") return "motherStatus";
    if (prop === "occupation") return "motherOccupation";
    if (prop === "monthly_income") return "motherIncome";
    if (prop === "contact_number") return "motherContact";
    return null;
  }

  if (role === "guardian") {
    if (prop === "full_name") return "guardianName";
    if (prop === "birthday") return "guardianBirthday";
    if (prop === "employment_status") return "guardianStatus";
    if (prop === "occupation") return "guardianOccupation";
    if (prop === "monthly_income") return "guardianIncome";
    if (prop === "contact_number") return "guardianContact";
    return null;
  }

  // Dynamic members
  let dynCount = 0;
  for (let i = 0; i < index; i++) {
    if (rolesArray[i] !== "father" && rolesArray[i] !== "mother" && rolesArray[i] !== "guardian") {
      dynCount++;
    }
  }
  
  if (prop === "full_name") return "dynFamily_" + dynCount + "_name";
  if (prop === "birthday") return "dynFamily_" + dynCount + "_birthday";
  if (prop === "role") return "dynFamily_" + dynCount + "_relationship";
  if (prop === "employment_status") return "dynFamily_" + dynCount + "_status";
  if (prop === "occupation") return "dynFamily_" + dynCount + "_occupation";
  if (prop === "monthly_income") return "dynFamily_" + dynCount + "_income";
  if (prop === "contact_number") return "dynFamily_" + dynCount + "_contactNo";

  return null;
};

const mapApiFieldToUiKey = (field, rolesArray) => {
  const normalized = normalizeFieldPath(field);
  if (!normalized) return "_general";
  if (normalized.startsWith("family_members.")) {
    return mapFamilyFieldToUi(normalized, rolesArray) || "familyMembers";
  }
  if (normalized.startsWith("income_cert_member_")) {
    const idx = normalized.replace("income_cert_member_", "");
    return "incomeMember_" + idx;
  }
  if (normalized.startsWith("indigency_cert_member_")) {
    const idx = normalized.replace("indigency_cert_member_", "");
    return "indigencyMember_" + idx;
  }
  if (normalized.startsWith("additional_") && normalized.endsWith("_birthday")) {
    const idx = normalized.split("_")[1];
    return `dynFamily_${idx}_birthday`;
  }
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

const normalizeApiErrorShape = (err) => {
  return {
    status: err?.status,
    message: err?.message || "An unexpected error occurred.",
    errors: Array.isArray(err?.errors) ? err.errors : [],
  };
};

const isFatherEmpty = (vals) => {
  return (
    (!vals.fatherName || vals.fatherName.trim() === "") &&
    (!vals.fatherBirthday || vals.fatherBirthday.trim() === "") &&
    (!vals.fatherStatus || vals.fatherStatus === "--" || vals.fatherStatus.trim() === "") &&
    (!vals.fatherContact || vals.fatherContact.trim() === "" || vals.fatherContact === "09") &&
    (!vals.fatherOccupation || vals.fatherOccupation.trim() === "") &&
    (!vals.fatherIncome || vals.fatherIncome.trim() === "")
  );
};

const isMotherEmpty = (vals) => {
  return (
    (!vals.motherName || vals.motherName.trim() === "") &&
    (!vals.motherBirthday || vals.motherBirthday.trim() === "") &&
    (!vals.motherStatus || vals.motherStatus === "--" || vals.motherStatus.trim() === "") &&
    (!vals.motherContact || vals.motherContact.trim() === "" || vals.motherContact === "09") &&
    (!vals.motherOccupation || vals.motherOccupation.trim() === "") &&
    (!vals.motherIncome || vals.motherIncome.trim() === "")
  );
};

export const useTertiaryApplication = () => {
  const { user } = useContext(AuthContext);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [qualificationOutcome, setQualificationOutcome] = useState(null);

  const clearFieldError = useCallback((key) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);



  const handleApiError = (rawError, rolesArray) => {
    const err = normalizeApiErrorShape(rawError);

    if (err.status === 400 && err.errors.length > 0) {
      const mappedErrors = {};
      err.errors.forEach((e) => {
        const key = mapApiFieldToUiKey(e.field, rolesArray);
        let msg = e.message || "Invalid value.";

        // Rewrite generic Zod minimum length messages to native phrasing
        if (msg.toLowerCase().includes("least 1 character") || msg.toLowerCase().includes("too short")) {
          // If we can figure out exactly what it is, use specific text, otherwise generic:
          // e.g. "fatherName" -> "Father Name", "expectedGradYear" -> "Expected Grad Year"
          // This generates specific, polite UI error messages instead of a blanket "This field is required"
          const humanLabel = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
          msg = `${humanLabel} is required.`;
        }

        if (!mappedErrors[key]) mappedErrors[key] = msg;

        // Restore mapping for generic parent exclusivity requirements
        if (msg.toLowerCase().includes("mother or father")) {
          mappedErrors["fatherName"] = msg;
          mappedErrors["motherName"] = msg;
        }
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
  };

  const getMyApplications = useCallback(async () => {
    return await fetchMyApplications();
  }, []);

  const [isCheckingGuard, setIsCheckingGuard] = useState(true);
  const [ongoingApplication, setOngoingApplication] = useState(null);

  const checkGuard = useCallback(async () => {
    setIsCheckingGuard(true);
    try {
      const access = await getScholarshipFormAccess({ program: "tertiary" });
      setOngoingApplication(access?.blockedApplication || null);
    } catch {
      setOngoingApplication(null);
    } finally {
      setIsCheckingGuard(false);
    }
  }, [getMyApplications]);

  useEffect(() => {
    checkGuard();
  }, [checkGuard]);

  // --- Preflight validators extracted per step so we can run them cumulatively ---

  const getStep0PreflightErrors = useCallback((values, uploads) => {
    const errors = {};

    if (!values.secondarySchool || values.secondarySchool.trim() === "")
      errors.secondarySchool = "Secondary School Name is required.";
    if (!values.tertiarySchool || values.tertiarySchool.trim() === "")
      errors.tertiarySchool = "University / College Name is required.";
    if (!values.program || values.program.trim() === "")
      errors.program = "Degree Program is required.";

    if (!values.yearGraduated || values.yearGraduated.trim() === "")
      errors.yearGraduated = "Year graduated is required.";
    else if (values.yearGraduated.length < 4)
      errors.yearGraduated = "Year must be exactly 4 digits.";

    if (!values.expectedGradYear || values.expectedGradYear.trim() === "")
      errors.expectedGradYear = "Expected graduation year is required.";
    else if (values.expectedGradYear.length < 4)
      errors.expectedGradYear = "Year must be exactly 4 digits.";

    // Secondary GWA is always required regardless of freshman status
    if (!values.secondaryGwa || values.secondaryGwa.trim() === "") {
      errors.secondaryGwa = "Secondary GWA is required.";
    } else if (!validateGwa(values.secondaryGwa)) {
      errors.secondaryGwa = INVALID_GWA_ERROR;
    }

    if (values.incomingFreshman === "Yes") {
      if (!uploads.gradeReport)
        errors.gradeReport = "Grade report is required.";
    } else {
      if (!values.tertiaryGwa || values.tertiaryGwa.trim() === "") {
        errors.tertiaryGwa = "Tertiary GWA is required.";
      } else if (!validateGwa(values.tertiaryGwa)) {
        errors.tertiaryGwa = INVALID_GWA_ERROR;
      }
      if (!uploads.currentTermGradeReport)
        errors.currentTermGradeReport = "Current term report card is required.";
    }

    if (!uploads.cor)
      errors.cor = "Certificate of Registration is required.";

    if (!values.termStartDate || values.termStartDate.trim() === "") {
      errors.termStartDate = "Term Start Date is required.";
    } else {
      const start = parseDateString(values.termStartDate);
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear, 11, 31);
      if (start && (start < yearStart || start > yearEnd))
        errors.termStartDate = "Start date must be within the current year.";
    }

    if (!values.termEndDate || values.termEndDate.trim() === "") {
      errors.termEndDate = "Term End Date is required.";
    }

    if (values.termStartDate && values.termEndDate) {
      const start = parseDateString(values.termStartDate);
      const end = parseDateString(values.termEndDate);
      if (start && end) {
        const minEnd = new Date(start.getFullYear(), start.getMonth() + 1, 1);
        const daysInTargetMonth = new Date(minEnd.getFullYear(), minEnd.getMonth() + 1, 0).getDate();
        minEnd.setDate(Math.min(start.getDate(), daysInTargetMonth));
        if (end < minEnd)
          errors.termEndDate = "Term End Date must be at least 1 month after Term Start Date.";
      }
    }

    return errors;
  }, []);

  const getStep1PreflightErrors = useCallback((values, dynamicFamilyMembers, scholarBirth) => {
    const errors = {};
    const requiresProof = (status) => ["Employed", "Self-Employed"].includes(status);

    if (scholarBirth && scholarBirth.getFullYear() >= 1990) {
      if (values.fatherBirthday && values.fatherStatus !== "Deceased") {
        const fatherBirth = parseDateString(values.fatherBirthday);
        if (fatherBirth && fatherBirth >= scholarBirth)
          errors.fatherBirthday = "Father should be older than the applicant.";
      }
      if (values.motherBirthday && values.motherStatus !== "Deceased") {
        const motherBirth = parseDateString(values.motherBirthday);
        if (motherBirth && motherBirth >= scholarBirth)
          errors.motherBirthday = "Mother should be older than the applicant.";
      }
      if (values.hasGuardian && values.guardianBirthday && values.guardianStatus !== "Deceased") {
        const guardianBirth = parseDateString(values.guardianBirthday);
        if (guardianBirth && guardianBirth >= scholarBirth)
          errors.guardianBirthday = "Guardian should be older than the applicant.";
      }
    }

    const checkMember = (name, status, occ, inc, prefix, niceName) => {
      if (!name || name.trim() === "") errors[prefix + "Name"] = `${niceName} Name is required.`;
      if (!status || status === "--")
        errors[prefix + "Status"] = `${niceName} Employment Status is required.`;
      if (requiresProof(status)) {
        if (!occ || occ.trim() === "") errors[prefix + "Occupation"] = `${niceName} Occupation is required.`;
        if (!inc || inc.trim() === "") errors[prefix + "Income"] = `${niceName} Income is required.`;
      }
    };

    const isFatherStarted = !isFatherEmpty(values);
    const isMotherStarted = !isMotherEmpty(values);

    if (values.hasGuardian) {
      if (values.guardianStatus !== "Deceased") {
        checkMember(values.guardianName, values.guardianStatus, values.guardianOccupation, values.guardianIncome, "guardian", "Guardian's");
        if (!values.guardianContact || values.guardianContact.length < 11)
          errors.guardianContact = "Contact Number must be 11 digits.";
      }
      if (isFatherStarted && isMotherStarted) {
        errors.fatherName = "If you have a guardian, you can only provide either Father's or Mother's information, not both.";
        errors.motherName = "If you have a guardian, you can only provide either Father's or Mother's information, not both.";
      }
    } else {
      if (!isFatherStarted && !isMotherStarted) {
        errors.fatherName = "You must fill out either Father's or Mother's information.";
        errors.motherName = "You must fill out either Father's or Mother's information.";
      }

      const fatherIsDeceased = isFatherStarted && values.fatherStatus === "Deceased";
      const motherIsDeceased = isMotherStarted && values.motherStatus === "Deceased";

      if (fatherIsDeceased && motherIsDeceased) {
        errors.hasGuardian = "Guardian is required because both parents are deceased.";
      } else if (fatherIsDeceased && !isMotherStarted) {
        errors.hasGuardian = "Guardian is required because Father is deceased and Mother's information is not provided.";
      } else if (motherIsDeceased && !isFatherStarted) {
        errors.hasGuardian = "Guardian is required because Mother is deceased and Father's information is not provided.";
      }
    }

    if (isFatherStarted && values.fatherStatus !== "Deceased") {
      checkMember(values.fatherName, values.fatherStatus, values.fatherOccupation, values.fatherIncome, "father", "Father's");
      if (!values.fatherContact || values.fatherContact.length < 11)
        errors.fatherContact = "Contact Number must be 11 digits.";
    } else if (isFatherStarted && values.fatherStatus === "Deceased") {
      if (!values.fatherName || values.fatherName.trim() === "")
        errors.fatherName = "Father's Name is required.";
    }

    if (isMotherStarted && values.motherStatus !== "Deceased") {
      checkMember(values.motherName, values.motherStatus, values.motherOccupation, values.motherIncome, "mother", "Mother's");
      if (!values.motherContact || values.motherContact.length < 11)
        errors.motherContact = "Contact Number must be 11 digits.";
    } else if (isMotherStarted && values.motherStatus === "Deceased") {
      if (!values.motherName || values.motherName.trim() === "")
        errors.motherName = "Mother's Name is required.";
    }

    (dynamicFamilyMembers || []).forEach((mem, idx) => {
      if (!mem.name || mem.name.trim() === "") errors[`dynFamily_${idx}_name`] = "Member Name is required.";
      if (!mem.relationship || mem.relationship.trim() === "") errors[`dynFamily_${idx}_relationship`] = "Relationship is required.";
      if (!mem.status || mem.status === "--")
        errors[`dynFamily_${idx}_status`] = "Employment Status is required.";
      if (mem.status !== "Deceased") {
        if (!mem.contactNo || mem.contactNo.length < 11)
          errors[`dynFamily_${idx}_contactNo`] = "Contact Number must be 11 digits.";
      }
      if (requiresProof(mem.status)) {
        if (!mem.occupation || mem.occupation.trim() === "") errors[`dynFamily_${idx}_occupation`] = "Occupation is required.";
        if (!mem.income || mem.income.trim() === "") errors[`dynFamily_${idx}_income`] = "Monthly Income is required.";
      }
    });

    return errors;
  }, []);

  const getStep2PreflightErrors = useCallback((values, uploads, dynamicFamilyMembers) => {
    const errors = {};
    const requiresProof = (status) => ["Employed", "Self-Employed"].includes(status);
    const requiresIndigency = (status) => status === "Unemployed";

    if (!uploads.birthCert) errors.birthCert = "Birth certificate is required.";
    if (!uploads.essay) errors.essay = "Essay is required.";
    if (!uploads.letterOfIntentApplicant) errors.letterOfIntentApplicant = "Letter of Intent (Applicant) is required.";
    if (!uploads.letterOfIntentParent) errors.letterOfIntentParent = "Letter of Intent (Parent) is required.";

    if (values.hasGuardian) {
      if (requiresProof(values.guardianStatus) && !uploads.incomeGuardian) errors.incomeGuardian = "Income certificate required.";
      if (requiresIndigency(values.guardianStatus) && !uploads.indigencyGuardian) errors.indigencyGuardian = "Certificate of indigency required.";
    }

    const hasFatherDoc = !isFatherEmpty(values);
    if (hasFatherDoc) {
      if (requiresProof(values.fatherStatus) && !uploads.incomeFather) errors.incomeFather = "Income certificate required.";
      if (requiresIndigency(values.fatherStatus) && !uploads.indigencyFather) errors.indigencyFather = "Certificate of indigency required.";
    }

    const hasMotherDoc = !isMotherEmpty(values);
    if (hasMotherDoc) {
      if (requiresProof(values.motherStatus) && !uploads.incomeMother) errors.incomeMother = "Income certificate required.";
      if (requiresIndigency(values.motherStatus) && !uploads.indigencyMother) errors.indigencyMother = "Certificate of indigency required.";
    }

    (dynamicFamilyMembers || []).forEach((mem, idx) => {
      if (requiresProof(mem.status) && !uploads[`incomeMember_${idx}`])
        errors[`incomeMember_${idx}`] = "Income certificate required.";
      if (requiresIndigency(mem.status) && !uploads[`indigencyMember_${idx}`])
        errors[`indigencyMember_${idx}`] = "Certificate of indigency required.";
    });

    return errors;
  }, []);

  // uiStep is the current 0-based step shown in the UI.
  // The Backend schema combines Academic and Family into step=1, and Documents into step=2.
  // We run ALL steps' preflight checks up to and including the current step so that
  // ALL validation errors are shown at once (matching the web behaviour).
  const validateStep = useCallback(async (uiStep, values, uploads, dynamicFamilyMembers) => {
    setError(null);
    setFieldErrors({});

    const apiStep = uiStep + 1;

    // --- CUMULATIVE SUPPLEMENTAL FRONTEND PRE-FLIGHT VALIDATION ---
    // Always re-run every prior step's checks so no error goes silently undetected.
    let preFlightErrors = {};

    const scholarBirth = parseDateString(user?.birthday || user?.birthDate || user?.birthdate);

    // Step 0 checks always run (required for steps 0, 1, and 2)
    Object.assign(preFlightErrors, getStep0PreflightErrors(values, uploads));

    // Step 1 checks run when on step 1 or beyond
    if (uiStep >= 1) {
      Object.assign(preFlightErrors, getStep1PreflightErrors(values, dynamicFamilyMembers, scholarBirth));
    }

    // Step 2 checks run only when on step 2
    if (uiStep >= 2) {
      Object.assign(preFlightErrors, getStep2PreflightErrors(values, uploads, dynamicFamilyMembers));
    }

    if (Object.keys(preFlightErrors).length > 0) {
      setFieldErrors(preFlightErrors);
      setError(null);
      return false;
    }
    // ---------------------------------------------------

    try {
      await validateTertiaryStep(apiStep, values, uploads, dynamicFamilyMembers);
      return true;
    } catch (err) {
      const rolesArray = [];
      if (!isFatherEmpty(values)) rolesArray.push("father");
      if (!isMotherEmpty(values)) rolesArray.push("mother");
      if (values.hasGuardian) rolesArray.push("guardian");
      (dynamicFamilyMembers || []).forEach(m => rolesArray.push(m.relationship));

      handleApiError(err, rolesArray);
      return false;
    }
  }, []);

  const submitApplication = useCallback(async (values, uploads, dynamicFamilyMembers) => {
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    setQualificationOutcome(null);

    try {
      const response = await submitTertiaryApplication(values, uploads, dynamicFamilyMembers);
      if (response?.success && response?.data) {
        setQualificationOutcome(response.data);
      }
      return response;
    } catch (err) {
      const rolesArray = [];
      if (!isFatherEmpty(values)) rolesArray.push("father");
      if (!isMotherEmpty(values)) rolesArray.push("mother");
      if (values.hasGuardian) rolesArray.push("guardian");
      (dynamicFamilyMembers || []).forEach(m => rolesArray.push(m.relationship));

      handleApiError(err, rolesArray);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    submitting,
    error,
    fieldErrors,
    qualificationOutcome,
    submitApplication,
    validateStep,
    clearFieldError,
    getMyApplications,
    isCheckingGuard,
    ongoingApplication,
    recheckGuard: checkGuard,
  };
};

export default useTertiaryApplication;