import api from "./api";

// ─── HELPERS ──────────────────────────────────────────────────

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

  const family = [
    cleanMember({
      role: "father",
      full_name: values.fatherName || "",
      employment_status: values.fatherStatus || "",
      occupation: values.fatherOccupation || "",
      monthly_income: values.fatherIncome || "",
      contact_number: values.fatherContact || "",
    }),
    cleanMember({
      role: "mother",
      full_name: values.motherName || "",
      employment_status: values.motherStatus || "",
      occupation: values.motherOccupation || "",
      monthly_income: values.motherIncome || "",
      contact_number: values.motherContact || "",
    }),
  ];

  // Append any additional family members the user added dynamically
  (dynamicFamilyMembers || []).forEach((member) => {
    family.push(cleanMember({
      role: member.relationship || "",
      full_name: member.name || "",
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
const prepareFormData = (values, uploads, dynamicFamilyMembers) => {
  const formData = new FormData();

  // Scalar academic / school fields
  formData.append("scholarship_type", values.scholarshipType || "TESDA");
  formData.append("incoming_freshman", values.incomingFreshman === "Yes" ? "true" : "false");
  formData.append("secondary_school", values.schoolName || "");
  formData.append("strand", values.strand || "");
  formData.append("year_graduated", values.yearGraduated || "");
  
  if (values.incomingFreshman === "Yes") {
    formData.append("gwa", values.gwa || "");
  }
  
  // Vocational specific fields
  formData.append("vocational_school", values.vocationalSchoolName || "");
  formData.append("vocational_program", values.vocationalProgram || "");
  formData.append("course_duration", values.courseDuration || "");
  formData.append("completion_date", values.completionDate || "");

  // Family members must be serialised as JSON since FormData is flat
  const familyMembers = buildFamilyMembers(values, dynamicFamilyMembers);
  formData.append("family_members", JSON.stringify(familyMembers));

  // Document uploads — only attach fields that have a real file
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
  const formData = prepareFormData(values, uploads, dynamicFamilyMembers);
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

