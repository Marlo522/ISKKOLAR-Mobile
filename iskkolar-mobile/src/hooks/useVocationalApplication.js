import { useState, useCallback } from "react";
import {
  getMyVocationalApplications as fetchMyApplications,
  validateVocationalStep,
  submitVocationalApplication,
} from "../services/vocationalAppService";

// ─── FIELD MAP ────────────────────────────────────────────────
// Maps backend API field names to their corresponding UI state keys.
// Used to attach server validation errors to the right input field.
const FIELD_MAP = {
  scholarship_type: "scholarshipType",
  secondary_school: "schoolName",
  vocational_school: "vocationalSchoolName",
  strand: "strand",
  vocational_program: "vocationalProgram",
  course_duration: "courseDuration",
  completion_date: "completionDate",
  year_graduated: "yearGraduated",
  grade_report: "gradeReport",
  cor: "cor",
  certificate_of_indigency: "indigency",
  birth_certificate: "birthCert",
  essay: "essay",
  recommendation_letter: "recommendation",
  income_cert_father: "incomeFather",
  income_cert_mother: "incomeMother",
  documents: "documents",
  family_members: "familyMembers",
  general: "_general",
};

// Converts bracket notation (family_members[0].full_name) → dot notation
const normalizeFieldPath = (field) =>
  String(field || "").replace(/\[(\d+)\]/g, ".$1");

// Maps a resolved family_members.N.prop path to a UI field key.
// Index 0 = father, index 1 = mother, index 2+ = dynamic members.
const mapFamilyFieldToUi = (normalizedField) => {
  const parts = normalizedField.split(".");
  if (parts.length < 3) return null;

  const index = Number(parts[1]);
  const prop = parts[2];

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

  // Dynamic member (index 2 maps to dynFamily_0, etc.)
  const dynIndex = index - 2;
  if (prop === "full_name") return "dynFamily_" + dynIndex + "_name";
  if (prop === "role") return "dynFamily_" + dynIndex + "_relationship";
  if (prop === "employment_status") return "dynFamily_" + dynIndex + "_status";
  if (prop === "occupation") return "dynFamily_" + dynIndex + "_occupation";
  if (prop === "monthly_income") return "dynFamily_" + dynIndex + "_income";
  if (prop === "contact_number") return "dynFamily_" + dynIndex + "_contactNo";

  return null;
};

// Resolves an API error field to the matching UI key.
const mapApiFieldToUiKey = (field) => {
  const normalized = normalizeFieldPath(field);
  if (!normalized) return "_general";

  if (normalized.startsWith("family_members.")) {
    return mapFamilyFieldToUi(normalized) || "familyMembers";
  }

  if (normalized.startsWith("income_cert_member_")) {
    const idx = normalized.replace("income_cert_member_", "");
    return "incomeMember_" + idx;
  }

  return FIELD_MAP[normalized] || normalized;
};

// Normalizes raw API error objects to a consistent {status, message, errors} shape.
const normalizeApiErrorShape = (err) => ({
  status: err?.status,
  message: err?.message || "An unexpected error occurred.",
  errors: Array.isArray(err?.errors) ? err.errors : [],
});

// ─── HOOK ────────────────────────────────────────────────────

export const useVocationalApplication = () => {
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
  const handleApiError = (rawError) => {
    const err = normalizeApiErrorShape(rawError);

    // 400 with field-level errors → show inline field errors, hide general banner
    if (err.status === 400 && err.errors.length > 0) {
      const mappedErrors = {};
      err.errors.forEach((e) => {
        const key = mapApiFieldToUiKey(e.field);
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
      setError("Network error. Please check your connection and try again.");
      return;
    }

    setError(err.message || "An unexpected error occurred.");
  };

  // Fetches the current user's vocational applications history.
  const getMyApplications = useCallback(async () => {
    return await fetchMyApplications();
  }, []);

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
      if (!values.schoolName || values.schoolName.trim() === "")
        preFlightErrors.schoolName = "Secondary School Name is required.";
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
      if (!uploads.gradeReport)
        preFlightErrors.gradeReport = "Report Card is required.";
      if (!uploads.cor)
        preFlightErrors.cor = "COR is required.";
    }

    if (uiStep === 1) {
      // Income proof is only required for employed / self-employed members
      const requiresProof = (status) =>
        ["Employed", "Self-Employed"].includes(status);

      const checkMember = (name, status, occ, inc, prefix, niceName) => {
        if (!name || name.trim() === "")
          preFlightErrors[prefix + "Name"] = `${niceName} Name is required.`;
        if (requiresProof(status)) {
          if (!occ || occ.trim() === "")
            preFlightErrors[prefix + "Occupation"] = `${niceName} Occupation is required.`;
          if (!inc || inc.trim() === "")
            preFlightErrors[prefix + "Income"] = `${niceName} Income is required.`;
        }
      };

      if (values.fatherStatus !== "Deceased") {
        checkMember(
          values.fatherName, values.fatherStatus,
          values.fatherOccupation, values.fatherIncome,
          "father", "Father's"
        );
        if (!values.fatherContact || values.fatherContact.length < 11)
          preFlightErrors.fatherContact = "Contact Number must be 11 digits.";
      }

      if (values.motherStatus !== "Deceased") {
        checkMember(
          values.motherName, values.motherStatus,
          values.motherOccupation, values.motherIncome,
          "mother", "Mother's"
        );
        if (!values.motherContact || values.motherContact.length < 11)
          preFlightErrors.motherContact = "Contact Number must be 11 digits.";
      }

      // Validate each dynamically added family member
      (dynamicFamilyMembers || []).forEach((mem, idx) => {
        if (!mem.name || mem.name.trim() === "")
          preFlightErrors[`dynFamily_${idx}_name`] = "Member Name is required.";
        if (!mem.relationship || mem.relationship.trim() === "")
          preFlightErrors[`dynFamily_${idx}_relationship`] = "Relationship is required.";
        if (mem.status !== "Deceased") {
          if (!mem.contactNo || mem.contactNo.length < 11)
            preFlightErrors[`dynFamily_${idx}_contactNo`] = "Contact Number must be 11 digits.";
        }
        if (requiresProof(mem.status)) {
          if (!mem.occupation || mem.occupation.trim() === "")
            preFlightErrors[`dynFamily_${idx}_occupation`] = "Occupation is required.";
          if (!mem.income || mem.income.trim() === "")
            preFlightErrors[`dynFamily_${idx}_income`] = "Monthly Income is required.";
        }
      });
    }

    if (uiStep === 2) {
      // Required documents — backend does not validate files during step-check
      if (!uploads.indigency)
        preFlightErrors.indigency = "Certificate of Indigency is required.";
      if (!uploads.birthCert)
        preFlightErrors.birthCert = "Birth Certificate is required.";
      if (!uploads.essay)
        preFlightErrors.essay = "Essay is required.";

      const requiresProof = (status) =>
        ["Employed", "Self-Employed"].includes(status);

      if (requiresProof(values.fatherStatus) && !uploads.incomeFather)
        preFlightErrors.incomeFather = "Income certificate required.";
      if (requiresProof(values.motherStatus) && !uploads.incomeMother)
        preFlightErrors.incomeMother = "Income certificate required.";

      (dynamicFamilyMembers || []).forEach((mem, idx) => {
        if (requiresProof(mem.status) && !uploads[`incomeMember_${idx}`]) {
          preFlightErrors[`incomeMember_${idx}`] = "Income certificate required.";
        }
      });
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
      // DEBUG: Log the exact error to terminal so I can extract it!
      console.log("VOCATIONAL_VALIDATION_ERROR", JSON.stringify(err, null, 2));
      require("react-native").Alert.alert("Backend Validation Error", JSON.stringify(err));
      
      // Only hard-block on 400 (field validation errors from the server).
      if (err?.status === 400 && Array.isArray(err?.errors) && err.errors.length > 0) {
        handleApiError(err);
        return false;
      }
      // For any other server error, show a soft warning banner but still advance
      setError("Could not reach server for validation. Proceeding with local checks.");
      return true;
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
      handleApiError(err);
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

export default useVocationalApplication;
