import api from "./api";

// ─── HELPERS ──────────────────────────────────────────────────
const mapRelationshipToBackendRole = (rel) => {
  if (!rel) return "Other";
  const trimmed = rel.trim();
  if (trimmed === "Siblings" || trimmed === "Sibling" || trimmed === "Brother" || trimmed === "Sister") {
    return "Brother";
  }
  const standardBackend = ["Brother", "Sister", "Guardian", "Spouse", "Child", "Other"];
  if (standardBackend.includes(trimmed)) {
    return trimmed;
  }
  return "Other";
};

const buildFamilyMembers = (values, dynamicFamilyMembers) => {
  const cleanMember = (member) => {
    if (member.employment_status === "Unemployed" || member.employment_status === "Deceased") {
      delete member.occupation;
      delete member.monthly_income;
    }
    return member;
  };

  const family = [];

  if (!values.hasGuardian || values.fatherName) {
    family.push(cleanMember({
      role: "father",
      full_name: values.fatherName || "",
      birthday: values.fatherBirthday || "",
      employment_status: values.fatherStatus || "",
      occupation: values.fatherOccupation || "",
      monthly_income: values.fatherIncome || "",
      contact_number: values.fatherContact || "",
    }));
  }

  if (!values.hasGuardian || values.motherName) {
    family.push(cleanMember({
      role: "mother",
      full_name: values.motherName || "",
      birthday: values.motherBirthday || "",
      employment_status: values.motherStatus || "",
      occupation: values.motherOccupation || "",
      monthly_income: values.motherIncome || "",
      contact_number: values.motherContact || "",
    }));
  }

  if (values.hasGuardian) {
    family.push(cleanMember({
      role: "guardian",
      full_name: values.guardianName || "",
      birthday: values.guardianBirthday || "",
      employment_status: values.guardianStatus || "",
      occupation: values.guardianOccupation || "",
      monthly_income: values.guardianIncome || "",
      contact_number: values.guardianContact || "",
    }));
  }

  (dynamicFamilyMembers || []).forEach((member) => {
    family.push(cleanMember({
      role: mapRelationshipToBackendRole(member.relationship),
      full_name: member.name || "",
      birthday: member.birthday || "",
      employment_status: member.status || "",
      occupation: member.occupation || "",
      monthly_income: member.income || "",
      contact_number: member.contactNo || "",
    }));
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

const appendTertiaryAcademicFields = (formData, values, uploads) => {
  formData.append("scholarship_type", values.scholarshipType || "");
  formData.append("incoming_freshman", values.incomingFreshman === "Yes" ? "true" : "false");
  formData.append("secondary_school", values.secondarySchool || "");
  formData.append("strand", values.strand || "");
  formData.append("year_graduated", values.yearGraduated || "");
  formData.append("secondary_gwa", values.secondaryGwa || "");
  formData.append("tertiary_school", values.tertiarySchool || "");
  formData.append("program", values.program || "");
  formData.append("term_type", values.termType || "");
  formData.append("grade_scale", values.gradeScale || "");
  formData.append("year_level", values.yearLevel || "");
  formData.append("term", values.term || "");
  formData.append("term_start_date", values.termStartDate || "");
  formData.append("term_end_date", values.termEndDate || "");
  formData.append("expected_graduation_year", values.expectedGradYear || "");
  formData.append("tertiary_gwa", values.tertiaryGwa || "");

  if (uploads) {
    appendFile(formData, "cor", uploads.cor);
    if (values.incomingFreshman === "Yes") {
      appendFile(formData, "grade_report", uploads.gradeReport);
    } else {
      appendFile(formData, "current_term_report", uploads.currentTermGradeReport);
    }
  }
};

const appendTertiaryFamilyFields = (formData, values, dynamicFamilyMembers) => {
  const familyMembers = buildFamilyMembers(values, dynamicFamilyMembers);
  formData.append("has_guardian", values.hasGuardian ? "true" : "false");
  formData.append("family_members", JSON.stringify(familyMembers));
};

const appendTertiaryDocumentFields = (formData, uploads, values, dynamicFamilyMembers) => {
  if (!uploads) return;

  formData.append("incoming_freshman", values.incomingFreshman === "Yes" ? "true" : "false");
  appendTertiaryFamilyFields(formData, values, dynamicFamilyMembers);
  appendFile(formData, "birth_certificate", uploads.birthCert);
  appendFile(formData, "essay", uploads.essay);
  appendFile(formData, "recommendation_letter", uploads.recommendation);
  appendFile(formData, "letter_intent_applicant", uploads.letterOfIntentApplicant);
  appendFile(formData, "letter_intent_parent", uploads.letterOfIntentParent);

  appendFile(formData, "income_cert_father", uploads.incomeFather);
  appendFile(formData, "income_cert_mother", uploads.incomeMother);
  appendFile(formData, "indigency_cert_father", uploads.indigencyFather);
  appendFile(formData, "indigency_cert_mother", uploads.indigencyMother);

  if (values.hasGuardian) {
    appendFile(formData, "income_cert_guardian", uploads.incomeGuardian);
    appendFile(formData, "indigency_cert_guardian", uploads.indigencyGuardian);
  }

  (dynamicFamilyMembers || []).forEach((_, idx) => {
    const incFile = uploads["incomeMember_" + idx];
    if (incFile) appendFile(formData, "income_cert_member_" + idx, incFile);

    const indFile = uploads["indigencyMember_" + idx];
    if (indFile) appendFile(formData, "indigency_cert_member_" + idx, indFile);
  });
};

const prepareTertiaryStepFormData = (step, values, uploads, dynamicFamilyMembers) => {
  const formData = new FormData();

  if (step === 1) {
    appendTertiaryAcademicFields(formData, values, uploads);
  } else if (step === 2) {
    appendTertiaryFamilyFields(formData, values, dynamicFamilyMembers);
  } else if (step === 3) {
    appendTertiaryDocumentFields(formData, uploads, values, dynamicFamilyMembers);
  }

  return formData;
};

const prepareFormData = (values, uploads, dynamicFamilyMembers) => {
  const formData = new FormData();

  formData.append("scholarship_type", values.scholarshipType || "");
  formData.append("incoming_freshman", values.incomingFreshman === "Yes" ? "true" : "false");
  formData.append("secondary_school", values.secondarySchool || "");
  formData.append("strand", values.strand || "");
  formData.append("year_graduated", values.yearGraduated || "");
  formData.append("secondary_gwa", values.secondaryGwa || "");
  
  formData.append("tertiary_school", values.tertiarySchool || "");
  formData.append("program", values.program || "");
  formData.append("term_type", values.termType || "");
  formData.append("grade_scale", values.gradeScale || "");
  formData.append("year_level", values.yearLevel || "");
  formData.append("term", values.term || "");
  formData.append("term_start_date", values.termStartDate || "");
  formData.append("term_end_date", values.termEndDate || "");
  formData.append("expected_graduation_year", values.expectedGradYear || "");
  formData.append("tertiary_gwa", values.tertiaryGwa || "");

  const familyMembers = buildFamilyMembers(values, dynamicFamilyMembers);
  formData.append("has_guardian", values.hasGuardian ? "true" : "false");
  formData.append("family_members", JSON.stringify(familyMembers));

  if (uploads) {
    appendFile(formData, "cor", uploads.cor);
    appendFile(formData, "grade_report", uploads.gradeReport);
    appendFile(formData, "current_term_report", uploads.currentTermGradeReport);
    appendFile(formData, "birth_certificate", uploads.birthCert);
    appendFile(formData, "essay", uploads.essay);
    appendFile(formData, "recommendation_letter", uploads.recommendation);
    appendFile(formData, "letter_intent_applicant", uploads.letterOfIntentApplicant);
    appendFile(formData, "letter_intent_parent", uploads.letterOfIntentParent);
    appendFile(formData, "income_cert_father", uploads.incomeFather);
    appendFile(formData, "income_cert_mother", uploads.incomeMother);
    appendFile(formData, "indigency_cert_father", uploads.indigencyFather);
    appendFile(formData, "indigency_cert_mother", uploads.indigencyMother);

    if (values.hasGuardian) {
      if (uploads.incomeGuardian) appendFile(formData, "income_cert_guardian", uploads.incomeGuardian);
      if (uploads.indigencyGuardian) appendFile(formData, "indigency_cert_guardian", uploads.indigencyGuardian);
    }

    (dynamicFamilyMembers || []).forEach((_, idx) => {
      const incFile = uploads["incomeMember_" + idx];
      if (incFile) appendFile(formData, "income_cert_member_" + idx, incFile);

      const indFile = uploads["indigencyMember_" + idx];
      if (indFile) appendFile(formData, "indigency_cert_member_" + idx, indFile);
    });
  }

  return formData;
};

// ─── API ENDPOINTS ───────────────────────────────────────────
export const getMyApplications = async () => {
  try {
    const response = await api.get("/scholarships/tertiary/my-applications");
    return response.data?.data || response.data || [];
  } catch (err) {
    return [];
  }
};

export const validateTertiaryStep = async (apiStep, values, uploads, dynamicFamilyMembers) => {
  const formData = prepareTertiaryStepFormData(apiStep, values, uploads, dynamicFamilyMembers);
  await api.post("/scholarships/tertiary/validate-step?step=" + apiStep, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return true;
};

export const submitTertiaryApplication = async (values, uploads, dynamicFamilyMembers) => {
  const formData = prepareFormData(values, uploads, dynamicFamilyMembers);
  const response = await api.post("/scholarships/tertiary/apply", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

