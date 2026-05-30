import { useState, useCallback, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getMyApplications as fetchMyApplications, validateTertiaryStep, submitTertiaryApplication } from "../services/tertiaryAppService";

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
  income_cert_father: "incomeFather",
  income_cert_mother: "incomeMother",
  indigency_cert_father: "indigencyFather",
  indigency_cert_mother: "indigencyMother",
  documents: "documents",
  family_members: "familyMembers",
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
      if (prop === "employment_status") return "fatherStatus";
      if (prop === "occupation") return "fatherOccupation";
      if (prop === "monthly_income") return "fatherIncome";
      if (prop === "contact_number") return "fatherContact";
      return null;
    }
    if (index === 1) {
      if (prop === "full_name") return "motherName";
      if (prop === "employment_status") return "motherStatus";
      if (prop === "occupation") return "motherOccupation";
      if (prop === "monthly_income") return "motherIncome";
      if (prop === "contact_number") return "motherContact";
      return null;
    }
    const dynIndex = index - 2;
    if (prop === "full_name") return "dynFamily_" + dynIndex + "_name";
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
    if (prop === "employment_status") return "fatherStatus";
    if (prop === "occupation") return "fatherOccupation";
    if (prop === "monthly_income") return "fatherIncome";
    if (prop === "contact_number") return "fatherContact";
    return null;
  }

  if (role === "mother") {
    if (prop === "full_name") return "motherName";
    if (prop === "employment_status") return "motherStatus";
    if (prop === "occupation") return "motherOccupation";
    if (prop === "monthly_income") return "motherIncome";
    if (prop === "contact_number") return "motherContact";
    return null;
  }

  if (role === "guardian") {
    if (prop === "full_name") return "guardianName";
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

  // uiStep is the current 0-based step shown in the UI.
  // The Backend schema combines Academic and Family into step=1, and Documents into step=2.
  const validateStep = useCallback(async (uiStep, values, uploads, dynamicFamilyMembers) => {
    setError(null);
    setFieldErrors({});

    const apiStep = uiStep + 1;

    // --- SUPPLEMENTAL FRONTEND PRE-FLIGHT VALIDATION ---
    let preFlightErrors = {};

    if (uiStep === 0) {
      // Required text fields
      if (!values.secondarySchool || values.secondarySchool.trim() === "")
        preFlightErrors.secondarySchool = "Secondary School Name is required.";
      if (!values.tertiarySchool || values.tertiarySchool.trim() === "")
        preFlightErrors.tertiarySchool = "University / College Name is required.";
      if (!values.program || values.program.trim() === "")
        preFlightErrors.program = "Degree Program is required.";

      // Step 0: Ensure graduation years aren't just partially typed (e.g., "20")
      if (values.yearGraduated && values.yearGraduated.length < 4) {
        preFlightErrors.yearGraduated = "Year must be exactly 4 digits.";
      }
      if (values.expectedGradYear && values.expectedGradYear.length < 4) {
        preFlightErrors.expectedGradYear = "Year must be exactly 4 digits.";
      }

      if (!values.secondaryGwa || values.secondaryGwa.trim() === "") {
        preFlightErrors.secondaryGwa = "Secondary GWA is required.";
      }

      if (values.incomingFreshman === "No") {
        if (!values.tertiaryGwa || values.tertiaryGwa.trim() === "") {
          preFlightErrors.tertiaryGwa = "Tertiary GWA is required.";
        }
      }

      if (!values.termStartDate || values.termStartDate.trim() === "") {
        preFlightErrors.termStartDate = "Term Start Date is required.";
      } else {
        const start = parseDateString(values.termStartDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (start && start < today) {
          preFlightErrors.termStartDate = "Term Start Date cannot be in the past.";
        }
      }
      if (!values.termEndDate || values.termEndDate.trim() === "") {
        preFlightErrors.termEndDate = "Term End Date is required.";
      }

      if (values.termStartDate && values.termEndDate) {
        const start = parseDateString(values.termStartDate);
        const end = parseDateString(values.termEndDate);
        if (start && end) {
          const limit = new Date(start);
          limit.setMonth(limit.getMonth() + 1);
          if (end < limit) {
            preFlightErrors.termEndDate = "Term End Date must be at least 1 month after Term Start Date.";
          }
        }
      }
    }

    if (uiStep === 1) {
      // Validate that parents and guardians are older than the applicant/scholar
      const scholarBirth = parseDateString(user?.birthday || user?.birthDate || user?.birthdate);
      if (scholarBirth && scholarBirth.getFullYear() >= 1990) {
        if (values.fatherBirthday && values.fatherStatus !== "Deceased") {
          const fatherBirth = parseDateString(values.fatherBirthday);
          if (fatherBirth && fatherBirth >= scholarBirth) {
            preFlightErrors.fatherBirthday = "Father should be older than the applicant.";
          }
        }
        if (values.motherBirthday && values.motherStatus !== "Deceased") {
          const motherBirth = parseDateString(values.motherBirthday);
          if (motherBirth && motherBirth >= scholarBirth) {
            preFlightErrors.motherBirthday = "Mother should be older than the applicant.";
          }
        }
        if (values.hasGuardian && values.guardianBirthday && values.guardianStatus !== "Deceased") {
          const guardianBirth = parseDateString(values.guardianBirthday);
          if (guardianBirth && guardianBirth >= scholarBirth) {
            preFlightErrors.guardianBirthday = "Guardian should be older than the applicant.";
          }
        }
      }

      // Step 1: Specifically block empty strings on the Family inputs missing from backend rules
      const requiresProof = (status) => ["Employed", "Self-Employed"].includes(status);
      
      const checkMember = (name, status, occ, inc, prefix, niceName) => {
        if (!name || name.trim() === "") preFlightErrors[prefix + "Name"] = `${niceName} Name is required.`;
        if (requiresProof(status)) {
          if (!occ || occ.trim() === "") preFlightErrors[prefix + "Occupation"] = `${niceName} Occupation is required.`;
          if (!inc || inc.trim() === "") preFlightErrors[prefix + "Income"] = `${niceName} Income is required.`;
        }
      };

      if (values.fatherStatus === "Deceased" && values.motherStatus === "Deceased") {
        if (!values.hasGuardian) {
          preFlightErrors.hasGuardian = "Guardian is required because both parents are deceased.";
        }
      }

      if (values.hasGuardian) {
        if (values.guardianStatus !== "Deceased") {
          checkMember(values.guardianName, values.guardianStatus, values.guardianOccupation, values.guardianIncome, "guardian", "Guardian's");
          if (!values.guardianContact || values.guardianContact.length < 11) preFlightErrors.guardianContact = "Contact Number must be 11 digits.";
        }

        // Only allow either Father or Mother information, not both
        const hasFather = values.fatherName && values.fatherName.trim() !== "";
        const hasMother = values.motherName && values.motherName.trim() !== "";
        if (hasFather && hasMother) {
          preFlightErrors.fatherName = "If you have a guardian, you can only provide either Father's or Mother's information, not both.";
          preFlightErrors.motherName = "If you have a guardian, you can only provide either Father's or Mother's information, not both.";
        }
      }

      const hasFather = values.fatherName && values.fatherName.trim() !== "";
      if (hasFather && values.fatherStatus !== "Deceased") {
        checkMember(values.fatherName, values.fatherStatus, values.fatherOccupation, values.fatherIncome, "father", "Father's");
        if (!values.fatherContact || values.fatherContact.length < 11) preFlightErrors.fatherContact = "Contact Number must be 11 digits.";
      }
      
      const hasMother = values.motherName && values.motherName.trim() !== "";
      if (hasMother && values.motherStatus !== "Deceased") {
        checkMember(values.motherName, values.motherStatus, values.motherOccupation, values.motherIncome, "mother", "Mother's");
        if (!values.motherContact || values.motherContact.length < 11) preFlightErrors.motherContact = "Contact Number must be 11 digits.";
      }

      // Automatically validate all dynamically injected family members
      (dynamicFamilyMembers || []).forEach((mem, idx) => {
        if (!mem.name || mem.name.trim() === "") preFlightErrors[`dynFamily_${idx}_name`] = "Member Name is required.";
        if (!mem.relationship || mem.relationship.trim() === "") preFlightErrors[`dynFamily_${idx}_relationship`] = "Relationship is required.";
        if (mem.status !== "Deceased") {
          if (!mem.contactNo || mem.contactNo.length < 11) preFlightErrors[`dynFamily_${idx}_contactNo`] = "Contact Number must be 11 digits.";
        }
        if (requiresProof(mem.status)) {
          if (!mem.occupation || mem.occupation.trim() === "") preFlightErrors[`dynFamily_${idx}_occupation`] = "Occupation is required.";
          if (!mem.income || mem.income.trim() === "") preFlightErrors[`dynFamily_${idx}_income`] = "Monthly Income is required.";
        }
      });
    }

    if (uiStep === 2) {
      // Step 2: Validate essential files
      if (!uploads.birthCert) preFlightErrors.birthCert = "Birth certificate is required.";
      if (!uploads.essay) preFlightErrors.essay = "Essay is required.";

      const fatherIsOptional = values.hasGuardian;
      const motherIsOptional = values.hasGuardian;

      const requiresProof = (status) => ["Employed", "Self-Employed"].includes(status);
      const requiresIndigency = (status) => status === "Unemployed";
      
      if (values.hasGuardian) {
        if (requiresProof(values.guardianStatus) && !uploads.incomeGuardian) preFlightErrors.incomeGuardian = "Income certificate required.";
        if (requiresIndigency(values.guardianStatus) && !uploads.indigencyGuardian) preFlightErrors.indigencyGuardian = "Certificate of indigency required.";
      }

      const hasFatherDoc = values.fatherName && values.fatherName.trim() !== "";
      if (hasFatherDoc) {
        if (requiresProof(values.fatherStatus) && !uploads.incomeFather) preFlightErrors.incomeFather = "Income certificate required.";
        if (requiresIndigency(values.fatherStatus) && !uploads.indigencyFather) preFlightErrors.indigencyFather = "Certificate of indigency required.";
      }

      const hasMotherDoc = values.motherName && values.motherName.trim() !== "";
      if (hasMotherDoc) {
        if (requiresProof(values.motherStatus) && !uploads.incomeMother) preFlightErrors.incomeMother = "Income certificate required.";
        if (requiresIndigency(values.motherStatus) && !uploads.indigencyMother) preFlightErrors.indigencyMother = "Certificate of indigency required.";
      }

      if (values.incomingFreshman === "No" && !uploads.currentTermGradeReport) {
        preFlightErrors.currentTermGradeReport = "Current term report card is required.";
      }

      (dynamicFamilyMembers || []).forEach((mem, idx) => {
        if (requiresProof(mem.status) && !uploads[`incomeMember_${idx}`]) {
          preFlightErrors[`incomeMember_${idx}`] = "Income certificate required.";
        }
        if (requiresIndigency(mem.status) && !uploads[`indigencyMember_${idx}`]) {
          preFlightErrors[`indigencyMember_${idx}`] = "Certificate of indigency required.";
        }
      });
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
      if (!values.hasGuardian || values.fatherName) rolesArray.push("father");
      if (!values.hasGuardian || values.motherName) rolesArray.push("mother");
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
      if (!values.hasGuardian || values.fatherName) rolesArray.push("father");
      if (!values.hasGuardian || values.motherName) rolesArray.push("mother");
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
  };
};

export default useTertiaryApplication;