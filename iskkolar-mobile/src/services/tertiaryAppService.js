import api from "./api";

// ─── HELPERS ──────────────────────────────────────────────────
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

const prepareFormData = (values, uploads, dynamicFamilyMembers) => {
  const formData = new FormData();

  formData.append("scholarship_type", values.scholarshipType || "");
  formData.append("incoming_freshman", values.incomingFreshman === "Yes" ? "true" : "false");
  formData.append("secondary_school", values.schoolName || "");
  formData.append("strand", values.strand || "");
  formData.append("year_graduated", values.yearGraduated || "");
  
  if (values.incomingFreshman === "Yes") {
    formData.append("gwa", values.gwa || "");
  }

  formData.append("tertiary_school", values.universityName || "");
  formData.append("program", values.program || "");
  formData.append("term_type", values.termType || "");
  formData.append("grade_scale", values.gradeScale || "");
  formData.append("year_level", values.yearLevel || "");
  formData.append("term", values.term || "");
  formData.append("expected_graduation_year", values.expectedGradYear || "");

  const familyMembers = buildFamilyMembers(values, dynamicFamilyMembers);
  formData.append("family_members", JSON.stringify(familyMembers));

  if (uploads) {
    appendFile(formData, "cor", uploads.cor);
    appendFile(formData, "grade_report", uploads.gradeReport);
    appendFile(formData, "current_term_report", uploads.currentTermGradeReport);
    appendFile(formData, "certificate_of_indigency", uploads.indigency);
    appendFile(formData, "birth_certificate", uploads.birthCert);
    appendFile(formData, "essay", uploads.essay);
    appendFile(formData, "recommendation_letter", uploads.recommendation);
    appendFile(formData, "income_cert_father", uploads.incomeFather);
    appendFile(formData, "income_cert_mother", uploads.incomeMother);
    appendFile(formData, "indigency_cert_father", uploads.indigencyFather);
    appendFile(formData, "indigency_cert_mother", uploads.indigencyMother);

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
  const formData = prepareFormData(values, uploads, dynamicFamilyMembers);
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

