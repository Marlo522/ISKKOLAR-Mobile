import api from "./api";

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

// Builds the family_members array that the backend expects.
// Index 0 = father, index 1 = mother, index 2+ = dynamic members.
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

  // Append any additional family members the user added dynamically
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

// Appends a single file to FormData. Skips silently if no URI exists.
const appendFile = (formData, apiField, file) => {
  if (!file?.uri) return;
  formData.append(apiField, {
    uri: file.uri,
    type: file.mimeType || file.type || "application/pdf",
    name: file.name || file.fileName || apiField + ".pdf",
  });
};

// Builds the full multipart FormData payload for all vocational endpoints.
const appendVocationalAcademicFields = (formData, values, uploads) => {
  formData.append("scholarship_type", values.scholarshipType || "TECHNICAL EDUCATION AND SKILLS DEVELOPMENT AUTHORITY (TESDA)");
  formData.append("secondary_school", values.secondarySchool || "");
  formData.append("strand", values.strand || "");
  formData.append("year_graduated", values.yearGraduated || "");
  formData.append("secondary_gwa", values.secondaryGwa || "");
  formData.append("vocational_school", values.vocationalSchoolName || "");
  formData.append("vocational_program", values.vocationalProgram || "");
  formData.append("course_duration", values.courseDuration || "");
  formData.append("completion_date", values.completionDate || "");

  if (uploads) {
    appendFile(formData, "cor", uploads.cor);
    appendFile(formData, "grade_report", uploads.gradeReport);
  }
};

const appendVocationalFamilyFields = (formData, values, dynamicFamilyMembers) => {
  const familyMembers = buildFamilyMembers(values, dynamicFamilyMembers);
  formData.append("has_guardian", values.hasGuardian ? "true" : "false");
  formData.append("family_members", JSON.stringify(familyMembers));
};

const appendVocationalDocumentFields = (formData, uploads, values, dynamicFamilyMembers) => {
  if (!uploads) return;

  appendVocationalFamilyFields(formData, values, dynamicFamilyMembers);
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

const prepareVocationalStepFormData = (step, values, uploads, dynamicFamilyMembers) => {
  const formData = new FormData();

  if (step === 1) {
    appendVocationalAcademicFields(formData, values, uploads);
  } else if (step === 2) {
    appendVocationalFamilyFields(formData, values, dynamicFamilyMembers);
  } else if (step === 3) {
    appendVocationalDocumentFields(formData, uploads, values, dynamicFamilyMembers);
  }

  return formData;
};

const prepareFormData = (values, uploads, dynamicFamilyMembers) => {
  const formData = new FormData();

  // Scalar academic / school fields
  formData.append("scholarship_type", values.scholarshipType || "TECHNICAL EDUCATION AND SKILLS DEVELOPMENT AUTHORITY (TESDA)");
  formData.append("secondary_school", values.secondarySchool || "");
  formData.append("strand", values.strand || "");
  formData.append("year_graduated", values.yearGraduated || "");
  formData.append("secondary_gwa", values.secondaryGwa || "");
  
  // Vocational specific fields
  formData.append("vocational_school", values.vocationalSchoolName || "");
  formData.append("vocational_program", values.vocationalProgram || "");
  formData.append("course_duration", values.courseDuration || "");
  formData.append("completion_date", values.completionDate || "");

  // Family members must be serialised as JSON since FormData is flat
  const familyMembers = buildFamilyMembers(values, dynamicFamilyMembers);
  formData.append("has_guardian", values.hasGuardian ? "true" : "false");
  formData.append("family_members", JSON.stringify(familyMembers));

  // Document uploads — only attach fields that have a real file
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

    // Dynamic member income/indigency certs use index-based keys
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

// Returns all vocational applications belonging to the current user.
export const getMyVocationalApplications = async () => {
  try {
    const response = await api.get("/scholarships/vocational/my-applications");
    return response.data?.data || response.data || [];
  } catch (err) {
    return [];
  }
};

// Sends form data to the backend step-validator before allowing the user to advance.
export const validateVocationalStep = async (apiStep, values, uploads, dynamicFamilyMembers) => {
  const formData = prepareVocationalStepFormData(apiStep, values, uploads, dynamicFamilyMembers);
  await api.post("/scholarships/vocational/validate-step?step=" + apiStep, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return true;
};

// Final submission — sends the complete application payload.
export const submitVocationalApplication = async (values, uploads, dynamicFamilyMembers) => {
  const formData = prepareFormData(values, uploads, dynamicFamilyMembers);
  const response = await api.post("/scholarships/vocational/apply", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Returns the first active (non-terminal) vocational application, or null.
export const checkOngoingVocationalApplication = async () => {
  try {
    const applications = await getMyVocationalApplications();
    const ongoing = applications.find(
      (app) =>
        app.status === "pending" ||
        app.status === "under_review" ||
        app.status === "initial_passed" ||
        app.status === "for_review"
    );
    return ongoing || null;
  } catch (err) {
    return null;
  }
};

