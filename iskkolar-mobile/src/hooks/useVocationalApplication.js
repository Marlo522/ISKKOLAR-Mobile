import { useState, useCallback, useContext, useEffect } from "react";
import { getScholarshipFormAccess } from "../services/applicationGuardService";
import { AuthContext } from "../context/AuthContext";
import {
  getMyVocationalApplications as fetchMyApplications,
  validateVocationalStep,
  submitVocationalApplication,
} from "../services/vocationalAppService";
import { validateGwa, INVALID_GWA_ERROR } from "../utils/gradeValidation";

// ─── FIELD MAP ────────────────────────────────────────────────
// Maps backend API field names to their corresponding UI state keys.
// Used to attach server validation errors to the right input field.
const FIELD_MAP = {
  scholarship_type: "scholarshipType",
  secondary_school: "secondarySchool",
  vocational_school: "vocationalSchoolName",
  strand: "strand",
  vocational_program: "vocationalProgram",
  course_duration: "courseDuration",
  completion_date: "completionDate",
  year_graduated: "yearGraduated",
  secondary_gwa: "secondaryGwa",
  grade_report: "gradeReport",
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

// Converts bracket notation (family_members[0].full_name) → dot notation
const normalizeFieldPath = (field) =>
  String(field || "").replace(/\[(\d+)\]/g, ".$1");

// Maps a resolved family_members.N.prop path to a UI field key.
// Index 0 = father, index 1 = mother, index 2+ = dynamic members.
const mapFamilyFieldToUi = (normalizedField, rolesArray) => {
  const parts = normalizedField.split(".");
  if (parts.length < 3) return null;

  const index = Number(parts[1]);
  const prop = parts[2];

  if (!rolesArray) {
    if (index === 0) {
      if (prop === "full_name") return "fatherName";
      if (prop === "birthday") return "fatherBirthday";
      if (prop === "employment_status") return "fatherStatus";
      if (prop === "occupation") return "fatherOccupation";
      if (prop === "monthly_income") return "fatherIncome";
      if (prop === "contact_number") return "fatherContact";
      if (prop === "street") return "fatherStreet";
      if (prop === "province") return "fatherProvince";
      if (prop === "city") return "fatherCity";
      if (prop === "barangay") return "fatherBarangay";
      if (prop === "country") return "fatherCountry";
      if (prop === "zip_code") return "fatherZip";
      return null;
    }
    if (index === 1) {
      if (prop === "full_name") return "motherName";
      if (prop === "birthday") return "motherBirthday";
      if (prop === "employment_status") return "motherStatus";
      if (prop === "occupation") return "motherOccupation";
      if (prop === "monthly_income") return "motherIncome";
      if (prop === "contact_number") return "motherContact";
      if (prop === "street") return "motherStreet";
      if (prop === "province") return "motherProvince";
      if (prop === "city") return "motherCity";
      if (prop === "barangay") return "motherBarangay";
      if (prop === "country") return "motherCountry";
      if (prop === "zip_code") return "motherZip";
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
    if (prop === "street") return "fatherStreet";
    if (prop === "province") return "fatherProvince";
    if (prop === "city") return "fatherCity";
    if (prop === "barangay") return "fatherBarangay";
    if (prop === "country") return "fatherCountry";
    if (prop === "zip_code") return "fatherZip";
    return null;
  }

  if (role === "mother") {
    if (prop === "full_name") return "motherName";
    if (prop === "birthday") return "motherBirthday";
    if (prop === "employment_status") return "motherStatus";
    if (prop === "occupation") return "motherOccupation";
    if (prop === "monthly_income") return "motherIncome";
    if (prop === "contact_number") return "motherContact";
    if (prop === "street") return "motherStreet";
    if (prop === "province") return "motherProvince";
    if (prop === "city") return "motherCity";
    if (prop === "barangay") return "motherBarangay";
    if (prop === "country") return "motherCountry";
    if (prop === "zip_code") return "motherZip";
    return null;
  }

  if (role === "guardian") {
    if (prop === "full_name") return "guardianName";
    if (prop === "birthday") return "guardianBirthday";
    if (prop === "employment_status") return "guardianStatus";
    if (prop === "occupation") return "guardianOccupation";
    if (prop === "monthly_income") return "guardianIncome";
    if (prop === "contact_number") return "guardianContact";
    if (prop === "street") return "guardianStreet";
    if (prop === "province") return "guardianProvince";
    if (prop === "city") return "guardianCity";
    if (prop === "barangay") return "guardianBarangay";
    if (prop === "country") return "guardianCountry";
    if (prop === "zip_code") return "guardianZip";
    return null;
  }

  let dynCount = 0;
  for (let i = 0; i < index; i++) {
    if (rolesArray[i] !== "father" && rolesArray[i] !== "mother" && rolesArray[i] !== "guardian") dynCount++;
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

// Resolves an API error field to the matching UI key.
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

// Normalizes raw API error objects to a consistent {status, message, errors} shape.
const normalizeApiErrorShape = (err) => ({
  status: err?.status,
  message: err?.message || "An unexpected error occurred.",
  errors: Array.isArray(err?.errors) ? err.errors : [],
});

const FRIENDLY_NETWORK_VALIDATION_MESSAGE =
  "We could not verify your application right now because the connection was interrupted. Please check your internet connection and try again.";

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

export const useVocationalApplication = () => {
  const { user } = useContext(AuthContext);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);          // General banner error
  const [fieldErrors, setFieldErrors] = useState({}); // Per-field inline errors
  const [qualificationOutcome, setQualificationOutcome] = useState(null);

  // Call this from an input's onChange/onChangeText so the error
  // disappears immediately as soon as the user starts correcting the field.
  const clearFieldError = useCallback((key) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev; // Nothing to clear, skip re-render
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  // Parses server errors and maps them to UI field keys or the general banner.
  const handleApiError = (rawError, rolesArray) => {
    const err = normalizeApiErrorShape(rawError);

    // 400 with field-level errors → show inline field errors, hide general banner
    if (err.status === 400 && err.errors.length > 0) {
      const mappedErrors = {};
      err.errors.forEach((e) => {
        const key = mapApiFieldToUiKey(e.field, rolesArray);
        let msg = e.message || "Invalid value.";

        // Convert Zod's "at least 1 character" messages to friendlier phrasing
        if (
          msg.toLowerCase().includes("least 1 character") ||
          msg.toLowerCase().includes("too short")
        ) {
          const humanLabel = key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (s) => s.toUpperCase());
          msg = `${humanLabel} is required.`;
        }

        if (key === "_general") {
          setError(msg);
        } else {
          if (!mappedErrors[key]) mappedErrors[key] = msg;
        }

        // When backend says "mother or father" required, tag both fields
        if (msg.toLowerCase().includes("mother or father")) {
          mappedErrors["fatherName"] = msg;
          mappedErrors["motherName"] = msg;
        }
      });
      setFieldErrors(mappedErrors);
      
      // If we didn't get any field-specific errors but got a general one, we don't return here.
      // Wait, we do return, but we shouldn't clear setError if there's a general error.
      if (!error && Object.keys(mappedErrors).length === 0) {
        // keep general error
      } else if (!error) {
        // clear general error if only field errors
      }
      return;
    }

    if (err.status === 429) {
      setError("Rate limit exceeded. Please wait a moment before trying again.");
      return;
    }

    if (err.status === 0) {
      setError(FRIENDLY_NETWORK_VALIDATION_MESSAGE);
      return;
    }

    setError(err.message || "An unexpected error occurred.");
  };

  // Fetches the current user's vocational applications history.
  const getMyApplications = useCallback(async () => {
    return await fetchMyApplications();
  }, []);

  const [isCheckingGuard, setIsCheckingGuard] = useState(true);
  const [ongoingApplication, setOngoingApplication] = useState(null);

  const checkGuard = useCallback(async () => {
    setIsCheckingGuard(true);
    try {
      const access = await getScholarshipFormAccess({ program: "vocational" });
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

  // Validates a single step before the user can advance.
  // uiStep is 0-based (step 0 = academic, step 1 = family, step 2 = documents).
  // The backend treats academic + family as step=1, and documents as step=2.
  const validateStep = useCallback(async (uiStep, values, uploads, dynamicFamilyMembers) => {
    setError(null);
    setFieldErrors({});

    const apiStep = uiStep + 1; // Backend endpoints are 1-indexed (1=Academic, 2=Family, 3=Docs)

    // ── PRE-FLIGHT FRONTEND VALIDATION ──────────────────────
    // The backend Zod schema does not enforce all UI constraints
    // (e.g. minimum year digits, contact length, required doc files).
    // We catch those here before ever hitting the network.
    const preFlightErrors = {};

    if (uiStep === 0) {
      // Required text fields — must not be blank
      if (!values.secondarySchool || values.secondarySchool.trim() === "")
        preFlightErrors.secondarySchool = "Secondary School Name is required.";
      if (!values.vocationalSchoolName || values.vocationalSchoolName.trim() === "")
        preFlightErrors.vocationalSchoolName = "School / Training Center Name is required.";
      if (!values.vocationalProgram || values.vocationalProgram.trim() === "")
        preFlightErrors.vocationalProgram = "Program is required.";
      if (!values.completionDate || values.completionDate.trim() === "")
        preFlightErrors.completionDate = "Completion Date is required.";

      // Year fields must be fully typed — reject partial inputs like "20"
      if (!values.yearGraduated || values.yearGraduated.trim() === "")
        preFlightErrors.yearGraduated = "Year Graduated is required.";
      else if (values.yearGraduated.length < 4)
        preFlightErrors.yearGraduated = "Year must be exactly 4 digits.";

      // Required uploads on step 0 — backend doesn't validate files here
      if (!values.secondaryGwa || values.secondaryGwa.trim() === "") {
        preFlightErrors.secondaryGwa = "GWA is required.";
      } else if (!validateGwa(values.secondaryGwa)) {
        preFlightErrors.secondaryGwa = INVALID_GWA_ERROR;
      }
      if (!uploads.gradeReport) preFlightErrors.gradeReport = "Grade Report is required.";
      if (!uploads.cor)
        preFlightErrors.cor = "COR is required.";
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

      // Income proof is only required for employed / self-employed members
      const requiresProof = (status) =>
        ["Employed", "Self-Employed"].includes(status);

      const isAddressStarted = (prefix) => {
        const street = values[prefix + "Street"];
        const province = values[prefix + "Province"];
        const city = values[prefix + "City"];
        const barangay = values[prefix + "Barangay"];
        const zip = values[prefix + "Zip"];
        return !!(
          (street && street.trim() !== "") ||
          (province && province.trim() !== "") ||
          (city && city.trim() !== "") ||
          (barangay && barangay.trim() !== "") ||
          (zip && zip.trim() !== "")
        );
      };

      const checkMember = (name, status, occ, inc, prefix, niceName, validateAddress) => {
        if (!name || name.trim() === "")
          preFlightErrors[prefix + "Name"] = `${niceName} Name is required.`;
        if (!status || status === "--") {
          preFlightErrors[prefix + "Status"] = `${niceName} Employment Status is required.`;
        }
        if (status !== "Deceased" && validateAddress) {
          if (!values[prefix + "Street"] || values[prefix + "Street"].trim() === "") preFlightErrors[prefix + "Street"] = "Street/Unit is required.";
          if (!values[prefix + "Province"] || values[prefix + "Province"].trim() === "") preFlightErrors[prefix + "Province"] = "Province is required.";
          if (!values[prefix + "City"] || values[prefix + "City"].trim() === "") preFlightErrors[prefix + "City"] = "City/Municipality is required.";
          if (!values[prefix + "Barangay"] || values[prefix + "Barangay"].trim() === "") preFlightErrors[prefix + "Barangay"] = "Barangay is required.";
          if (!values[prefix + "Zip"] || values[prefix + "Zip"].trim() === "") {
            preFlightErrors[prefix + "Zip"] = "Zip Code is required.";
          } else if (!/^\d{4}$/.test(values[prefix + "Zip"])) {
            preFlightErrors[prefix + "Zip"] = "Zip Code must contain exactly 4 digits.";
          }
        }
        if (requiresProof(status)) {
          if (!occ || occ.trim() === "")
            preFlightErrors[prefix + "Occupation"] = `${niceName} Occupation is required.`;
          if (!inc || inc.trim() === "")
            preFlightErrors[prefix + "Income"] = `${niceName} Income is required.`;
        }
      };

      const isFatherStarted = !isFatherEmpty(values);
      const isMotherStarted = !isMotherEmpty(values);
      const fatherAddressStarted = isAddressStarted("father");
      const motherAddressStarted = isAddressStarted("mother");

      let validateFatherAddress = false;
      let validateMotherAddress = false;
      let validateGuardianAddress = false;

      if (values.hasGuardian) {
        if (values.guardianStatus !== "Deceased") {
          validateGuardianAddress = true;
        }
        if (isFatherStarted && values.fatherStatus !== "Deceased" && fatherAddressStarted) {
          validateFatherAddress = true;
        }
        if (isMotherStarted && values.motherStatus !== "Deceased" && motherAddressStarted) {
          validateMotherAddress = true;
        }
      } else {
        const fatherAlive = isFatherStarted && values.fatherStatus !== "Deceased";
        const motherAlive = isMotherStarted && values.motherStatus !== "Deceased";

        if (fatherAlive && motherAlive) {
          if (fatherAddressStarted && motherAddressStarted) {
            validateFatherAddress = true;
            validateMotherAddress = true;
          } else if (fatherAddressStarted) {
            validateFatherAddress = true;
          } else if (motherAddressStarted) {
            validateMotherAddress = true;
          } else {
            validateFatherAddress = true;
          }
        } else if (fatherAlive) {
          validateFatherAddress = true;
        } else if (motherAlive) {
          validateMotherAddress = true;
        }
      }

      if (values.hasGuardian) {
        if (values.guardianStatus !== "Deceased") {
          checkMember(values.guardianName, values.guardianStatus, values.guardianOccupation, values.guardianIncome, "guardian", "Guardian's", validateGuardianAddress);
          if (!values.guardianContact || values.guardianContact.length < 11) preFlightErrors.guardianContact = "Contact Number must be 11 digits.";
        }

        // Only allow either Father or Mother information, not both
        if (isFatherStarted && isMotherStarted) {
          preFlightErrors.fatherName = "If you have a guardian, you can only provide either Father's or Mother's information, not both.";
          preFlightErrors.motherName = "If you have a guardian, you can only provide either Father's or Mother's information, not both.";
        }
      } else {
        // If they do not have a guardian, both parent sections cannot be empty
        if (!isFatherStarted && !isMotherStarted) {
          preFlightErrors.fatherName = "You must fill out either Father's or Mother's information.";
          preFlightErrors.motherName = "You must fill out either Father's or Mother's information.";
        }

        // Also check if both parents are deceased and no guardian is set
        const fatherIsDeceased = isFatherStarted && values.fatherStatus === "Deceased";
        const motherIsDeceased = isMotherStarted && values.motherStatus === "Deceased";

        if (fatherIsDeceased && motherIsDeceased) {
          preFlightErrors.hasGuardian = "Guardian is required because both parents are deceased.";
        } else if (fatherIsDeceased && !isMotherStarted) {
          preFlightErrors.hasGuardian = "Guardian is required because Father is deceased and Mother's information is not provided.";
        } else if (motherIsDeceased && !isFatherStarted) {
          preFlightErrors.hasGuardian = "Guardian is required because Mother is deceased and Father's information is not provided.";
        }
      }

      if (isFatherStarted && values.fatherStatus !== "Deceased") {
        checkMember(
          values.fatherName, values.fatherStatus,
          values.fatherOccupation, values.fatherIncome,
          "father", "Father's", validateFatherAddress
        );
        if (!values.fatherContact || values.fatherContact.length < 11)
          preFlightErrors.fatherContact = "Contact Number must be 11 digits.";
      } else if (isFatherStarted && values.fatherStatus === "Deceased") {
        if (!values.fatherName || values.fatherName.trim() === "") {
          preFlightErrors.fatherName = "Father's Name is required.";
        }
      }

      if (isMotherStarted && values.motherStatus !== "Deceased") {
        checkMember(
          values.motherName, values.motherStatus,
          values.motherOccupation, values.motherIncome,
          "mother", "Mother's", validateMotherAddress
        );
        if (!values.motherContact || values.motherContact.length < 11)
          preFlightErrors.motherContact = "Contact Number must be 11 digits.";
      } else if (isMotherStarted && values.motherStatus === "Deceased") {
        if (!values.motherName || values.motherName.trim() === "") {
          preFlightErrors.motherName = "Mother's Name is required.";
        }
      }

      // Validate each dynamically added family member
      (dynamicFamilyMembers || []).forEach((mem, idx) => {
        if (!mem.name || mem.name.trim() === "")
          preFlightErrors[`dynFamily_${idx}_name`] = "Member Name is required.";
        if (!mem.relationship || mem.relationship.trim() === "")
          preFlightErrors[`dynFamily_${idx}_relationship`] = "Relationship is required.";
        if (!mem.contactNo || mem.contactNo.length < 11)
          preFlightErrors[`dynFamily_${idx}_contactNo`] = "Contact Number must be 11 digits.";
      });
    }

    if (uiStep === 2) {
      // Required documents — backend does not validate files during step-check
      if (!uploads.birthCert)
        preFlightErrors.birthCert = "Birth Certificate is required.";
      if (!uploads.essay)
        preFlightErrors.essay = "Essay is required.";
      if (!uploads.letterOfIntentApplicant)
        preFlightErrors.letterOfIntentApplicant = "Letter of Intent (Applicant) is required.";
      if (!uploads.letterOfIntentParent)
        preFlightErrors.letterOfIntentParent = "Letter of Intent (Parent) is required.";

      const fatherIsOptional = values.hasGuardian;
      const motherIsOptional = values.hasGuardian;

      const requiresProof = (status) =>
        ["Employed", "Self-Employed"].includes(status);
      const requiresIndigency = (status) => status === "Unemployed";

      if (values.hasGuardian) {
        if (requiresProof(values.guardianStatus) && !uploads.incomeGuardian) preFlightErrors.incomeGuardian = "Income certificate required.";
        if (requiresIndigency(values.guardianStatus) && !uploads.indigencyGuardian) preFlightErrors.indigencyGuardian = "Certificate of indigency required.";
      }

      const hasFatherDoc = !isFatherEmpty(values);
      if (hasFatherDoc) {
        if (requiresProof(values.fatherStatus) && !uploads.incomeFather)
          preFlightErrors.incomeFather = "Income certificate required.";
        if (requiresIndigency(values.fatherStatus) && !uploads.indigencyFather)
          preFlightErrors.indigencyFather = "Certificate of indigency required.";
      }

      const hasMotherDoc = !isMotherEmpty(values);
      if (hasMotherDoc) {
        if (requiresProof(values.motherStatus) && !uploads.incomeMother)
          preFlightErrors.incomeMother = "Income certificate required.";
        if (requiresIndigency(values.motherStatus) && !uploads.indigencyMother)
          preFlightErrors.indigencyMother = "Certificate of indigency required.";
      }

    }

    // If any pre-flight errors were found, surface them immediately without a network call
    if (Object.keys(preFlightErrors).length > 0) {
      setFieldErrors(preFlightErrors);
      setError(null);
      return false;
    }
    // ─────────────────────────────────────────────────────────

    try {
      await validateVocationalStep(apiStep, values, uploads, dynamicFamilyMembers);
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

  // Submits the completed application to the backend.
  const submitApplication = useCallback(async (values, uploads, dynamicFamilyMembers) => {
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    setQualificationOutcome(null);

    try {
      const response = await submitVocationalApplication(values, uploads, dynamicFamilyMembers);
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

export default useVocationalApplication;
