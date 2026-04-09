import { useState, useCallback } from "react";
import api from "../services/api";

const FIELD_MAP = {
  scholarship_type: "scholarshipType",
  incoming_freshman: "incomingFreshman",
  secondary_school: "schoolName",
  tertiary_school: "universityName",
  expected_graduation_year: "expectedGradYear",
  grade_scale: "gradeScale",
  term_type: "termType",
  year_level: "yearLevel",
  strand: "strand",
  program: "program",
  term: "term",
  year_graduated: "yearGraduated",
  grade_report: "gradeReport",
  current_term_report: "currentTermGradeReport",
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

const normalizeFieldPath = (field) =>
  String(field || "").replace(/\[(\d+)\]/g, ".$1");

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

  const dynIndex = index - 2;
  if (prop === "full_name") return "dynFamily_" + dynIndex + "_name";
  if (prop === "role") return "dynFamily_" + dynIndex + "_relationship";
  if (prop === "employment_status") return "dynFamily_" + dynIndex + "_status";
  if (prop === "occupation") return "dynFamily_" + dynIndex + "_occupation";
  if (prop === "monthly_income") return "dynFamily_" + dynIndex + "_income";
  if (prop === "contact_number") return "dynFamily_" + dynIndex + "_contactNo";

  return null;
};

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

const normalizeApiErrorShape = (err) => {
  const fromWrapper = err || {};
  const fromResponse = err?.response?.data || {};
  return {
    status: fromWrapper.status ?? err?.response?.status,
    message:
      fromWrapper.message ||
      fromResponse.message ||
      "An unexpected error occurred.",
    errors:
      (Array.isArray(fromWrapper.errors) && fromWrapper.errors) ||
      (Array.isArray(fromResponse.errors) && fromResponse.errors) ||
      [],
  };
};

export const useTertiaryApplication = () => {
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

  // All family member fields sent as empty strings — never null/undefined.
  // Server decides what is required based on employment_status.
  const buildFamilyMembers = (values, dynamicFamilyMembers) => {
    const family = [
      {
        role: "father",
        full_name: values.fatherName || "",
        employment_status: values.fatherStatus || "",
        occupation: values.fatherOccupation || "",
        monthly_income: values.fatherIncome || "",
        contact_number: values.fatherContact || "",
      },
      {
        role: "mother",
        full_name: values.motherName || "",
        employment_status: values.motherStatus || "",
        occupation: values.motherOccupation || "",
        monthly_income: values.motherIncome || "",
        contact_number: values.motherContact || "",
      },
    ];

    (dynamicFamilyMembers || []).forEach((member) => {
      family.push({
        role: member.relationship || "",
        full_name: member.name || "",
        employment_status: member.status || "",
        occupation: member.occupation || "",
        monthly_income: member.income || "",
        contact_number: member.contactNo || "",
      });
    });

    return family;
  };

  const appendFile = (formData, apiField, file) => {
    if (!file?.uri) return;
    formData.append(apiField, {
      uri: file.uri,
      type: file.mimeType || file.type || "application/pdf",
      name: file.name || file.fileName || apiField + ".pdf",
    });
  };

  // All files appended unconditionally — server validates which are required.
  const prepareFormData = (values, uploads, dynamicFamilyMembers) => {
    const formData = new FormData();

    formData.append("scholarship_type", values.scholarshipType || "");
    formData.append("incoming_freshman", values.incomingFreshman === "Yes" ? "true" : "false");
    formData.append("secondary_school", values.schoolName || "");
    formData.append("strand", values.strand || "");
    formData.append("year_graduated", values.yearGraduated || "");
    formData.append("tertiary_school", values.universityName || "");
    formData.append("program", values.program || "");
    formData.append("term_type", values.termType || "");
    formData.append("grade_scale", values.gradeScale || "");
    formData.append("year_level", values.yearLevel || "");
    formData.append("term", values.term || "");
    formData.append("expected_graduation_year", values.expectedGradYear || "");

    const familyMembers = buildFamilyMembers(values, dynamicFamilyMembers);
    formData.append("family_members", JSON.stringify(familyMembers));

    // Documents — all appended, server decides what's required per step
    appendFile(formData, "cor", uploads.cor);
    appendFile(formData, "grade_report", uploads.gradeReport);
    appendFile(formData, "current_term_report", uploads.currentTermGradeReport);
    appendFile(formData, "certificate_of_indigency", uploads.indigency);
    appendFile(formData, "birth_certificate", uploads.birthCert);
    appendFile(formData, "essay", uploads.essay);
    appendFile(formData, "recommendation_letter", uploads.recommendation);
    appendFile(formData, "income_cert_father", uploads.incomeFather);
    appendFile(formData, "income_cert_mother", uploads.incomeMother);

    // Dynamic member income certs — append all that exist in uploads
    (dynamicFamilyMembers || []).forEach((_, idx) => {
      const file = uploads["incomeMember_" + idx];
      if (file) appendFile(formData, "income_cert_member_" + idx, file);
    });

    return formData;
  };

  const handleApiError = (rawError) => {
    const err = normalizeApiErrorShape(rawError);

    if (err.status === 400 && err.errors.length > 0) {
      const mappedErrors = {};
      err.errors.forEach((e) => {
        const key = mapApiFieldToUiKey(e.field);
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
    try {
      const response = await api("/scholarships/tertiary/my-applications", { method: "GET" });
      return response?.data || [];
    } catch {
      return [];
    }
  }, []);

  // uiStep is the current 0-based step shown in the UI.
  // The Backend schema combines Academic and Family into step=1, and Documents into step=2.
  const validateStep = useCallback(async (uiStep, values, uploads, dynamicFamilyMembers) => {
    setError(null);
    setFieldErrors({});

    const apiStep = uiStep === 2 ? 2 : 1;

    // --- SUPPLEMENTAL FRONTEND PRE-FLIGHT VALIDATION ---
    // Why this exists: The backend Zod schema allows empty strings for family fields and completely ignores `req.files` during `/validate-step`.
    // If we rely purely on the server, the user could advance to step 3 with blank fields and missing documents, then crash upon final submit.
    // This pre-flight validation rigorously checks those gaps natively *before* asking the server.
    let preFlightErrors = {};

    if (uiStep === 0) {
      // Step 0: Ensure graduation years aren't just partially typed (e.g., "20")
      if (values.yearGraduated && values.yearGraduated.length < 4) {
        preFlightErrors.yearGraduated = "Year must be exactly 4 digits.";
      }
      if (values.expectedGradYear && values.expectedGradYear.length < 4) {
        preFlightErrors.expectedGradYear = "Year must be exactly 4 digits.";
      }
    }

    if (uiStep === 1) {
      // Step 1: Specifically block empty strings on the Family inputs missing from backend rules
      const requiresProof = (status) => ["Employed", "Self-Employed"].includes(status);
      
      const checkMember = (name, status, occ, inc, prefix, niceName) => {
        if (!name || name.trim() === "") preFlightErrors[prefix + "Name"] = `${niceName} Name is required.`;
        if (requiresProof(status)) {
          if (!occ || occ.trim() === "") preFlightErrors[prefix + "Occupation"] = `${niceName} Occupation is required.`;
          if (!inc || inc.trim() === "") preFlightErrors[prefix + "Income"] = `${niceName} Income is required.`;
        }
      };

      if (values.fatherStatus !== "Deceased") {
        checkMember(values.fatherName, values.fatherStatus, values.fatherOccupation, values.fatherIncome, "father", "Father's");
        if (!values.fatherContact || values.fatherContact.length < 11) preFlightErrors.fatherContact = "Contact Number must be 11 digits.";
      }
      
      if (values.motherStatus !== "Deceased") {
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
      // Step 2: Validate essential files because server doesn't parse req.files during step 2 endpoint verification.
      if (!uploads.indigency) preFlightErrors.indigency = "Certificate of indigency is required.";
      if (!uploads.birthCert) preFlightErrors.birthCert = "Birth certificate is required.";
      if (!uploads.essay) preFlightErrors.essay = "Essay is required.";

      const requiresProof = (status) => ["Employed", "Self-Employed"].includes(status);
      if (requiresProof(values.fatherStatus) && !uploads.incomeFather) preFlightErrors.incomeFather = "Income certificate required.";
      if (requiresProof(values.motherStatus) && !uploads.incomeMother) preFlightErrors.incomeMother = "Income certificate required.";

      (dynamicFamilyMembers || []).forEach((mem, idx) => {
        if (requiresProof(mem.status) && !uploads[`incomeMember_${idx}`]) {
          preFlightErrors[`dynFamily_${idx}_income`] = "Income certificate required.";
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
      const formData = prepareFormData(values, uploads, dynamicFamilyMembers);
      await api("/scholarships/tertiary/validate-step?step=" + apiStep, {
        method: "POST",
        body: formData,
      });
      return true;
    } catch (err) {
      handleApiError(err);
      return false;
    }
  }, []);

  const submitApplication = useCallback(async (values, uploads, dynamicFamilyMembers) => {
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    setQualificationOutcome(null);

    try {
      const formData = prepareFormData(values, uploads, dynamicFamilyMembers);
      const response = await api("/scholarships/tertiary/apply", {
        method: "POST",
        body: formData,
      });
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

export default useTertiaryApplication;