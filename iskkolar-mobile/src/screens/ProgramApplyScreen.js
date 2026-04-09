import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Modal,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import useTertiaryApplication from "../hooks/useTertiaryApplication";

const infoFields = {
  educPath: "Tertiary",
  scholarshipType: "Manila Scholars",
  fundType: "",
  incomingFreshman: "No",
  schoolName: "",
  strand: "STEM",
  yearGraduated: "",
  universityName: "",
  program: "",
  termType: "Semester",
  gradeScale: "1.0 - 5.00 Grading System",
  yearLevel: "1st",
  term: "1st",
  secondaryYearGraduated: "",
  expectedGradYear: "",
  prevSchoolName: "",
  prevProgram: "",
  prevYearGraduated: "",
  staffId: "",
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "--",
  position: "Human Resource",
  fatherName: "",
  fatherStatus: "Employed",
  fatherOccupation: "",
  fatherIncome: "",
  fatherContact: "",
  motherName: "",
  motherStatus: "Employed",
  motherContact: "",
  motherOccupation: "",
  motherIncome: "",
  vocationalSchoolName: "",
  vocationalProgram: "",
  courseDuration: "5",
  completionDate: "May 22, 2026",
};

export default function ProgramApplyScreen({ navigation, route }) {
  const selectedProgram = route?.params?.program || "tertiary";
  const option = route?.params?.option || "Option 1";

  const [step, setStep] = useState(0);
  const [values, setValues] = useState(infoFields);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [uploadText, setUploadText] = useState({
    cor: null,
    gradeReport: null,
    currentTermGradeReport: null,
    indigency: null,
    birthCert: null,
    incomeFather: null,
    incomeMother: null,
    recommendation: null,
    essay: null,
  });
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [completeStage, setCompleteStage] = useState("none");
  const [selectVisible, setSelectVisible] = useState(false);
  const [selectContext, setSelectContext] = useState(null);
  const [declarations, setDeclarations] = useState({ agree1: false, agree2: false, agree3: false });

  const {
    submitting: apiSubmitting,
    error: apiError,
    fieldErrors,
    clearFieldError,
    qualificationOutcome,
    submitApplication: apiSubmitApp,
    validateStep,
  } = useTertiaryApplication();

  const isSubmittingNow = localSubmitting || apiSubmitting;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    stepAnim.setValue(0);
    Animated.timing(stepAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, [step, completeStage, localSubmitting]);

  useEffect(() => {
    if (isSubmittingNow) {
      spinAnim.setValue(0);
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ).start();
    }
  }, [isSubmittingNow, spinAnim]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  // tertiary: 4 steps (0=Academic, 1=Family, 2=Docs, 3=Review)
  // others:   3 steps (0, 1, 2=Review)
  const maxStep = selectedProgram === "employeeChild" ? 2 : 3;
  const isChildDesignation = selectedProgram === "employeeChild" && option === "Option 2";
  const requiresIncomeProof = (status) => ["Employed", "Self-Employed"].includes(status);

  const pickFile = async (key) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const file = result.assets[0];
        setUploadText((prev) => ({ ...prev, [key]: file }));
        clearFieldError(key);
        clearFieldError("documents");
      }
    } catch (err) {
      console.warn("Document picker error:", err);
    }
  };

  const updateValue = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    clearFieldError(key);
  };

  const updateContact = (key, value) => {
    let cleaned = value.replace(/[^0-9]/g, "");
    if (cleaned.length >= 1 && cleaned[0] !== "0") cleaned = "0";
    if (cleaned.length >= 2 && cleaned.substring(0, 2) !== "09") cleaned = "09";
    setValues((prev) => ({ ...prev, [key]: cleaned }));
    clearFieldError(key);
  };

  const addFamilyMember = () => {
    setFamilyMembers((prev) => [
      ...prev,
      { name: "", relationship: "", contactNo: "", status: "Unemployed", occupation: "", income: "" },
    ]);
  };

  const removeFamilyMember = (index) => {
    setFamilyMembers((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateFamilyMember = (index, field, value) => {
    setFamilyMembers((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
    clearFieldError("dynFamily_" + index + "_" + field);
    clearFieldError("familyMembers");
  };

  // advance() — for tertiary, validates steps 0, 1, 2 against the server.
  // Step 3 (Review/Declaration) has no server validation — just submit.
  // For other programs, no server validation — advance freely.
  const advance = async () => {
    if (selectedProgram === "tertiary") {
      // Steps 0, 1, 2 require server validation before advancing
      // Step 3 is Review — no validate call needed, handled by submitApplication
      if (step < maxStep) {
        const isValid = await validateStep(step, values, uploadText, familyMembers);
        if (isValid) setStep((s) => s + 1);
      }
      return;
    }
    if (step < maxStep) setStep((s) => s + 1);
  };

  const submitApplication = async () => {
    setLocalSubmitting(true);
    try {
      if (selectedProgram === "tertiary") {
        await apiSubmitApp(values, uploadText, familyMembers);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
      setCompleteStage("qualificationReport");
    } catch (err) {
      Alert.alert("Submission Failed", err?.message || apiError || "An error occurred.");
    } finally {
      setLocalSubmitting(false);
    }
  };

  const openSelect = (ctx) => { setSelectContext(ctx); setSelectVisible(true); };
  const closeSelect = () => { setSelectVisible(false); setSelectContext(null); };

  const applySelect = (value) => {
    if (!selectContext) return;
    if (selectContext.type === "value") updateValue(selectContext.key, value);
    if (selectContext.type === "member") updateFamilyMember(selectContext.index, selectContext.key, value);
    closeSelect();
  };

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderInput = (label, key, placeholder = null) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={values[key]}
        placeholder={placeholder || "Enter " + label}
        onChangeText={(text) => updateValue(key, text)}
        style={[styles.input, fieldErrors[key] && styles.errorInput]}
      />
      {fieldErrors[key] && <Text style={styles.errorText}>{fieldErrors[key]}</Text>}
    </View>
  );

  const renderContactInput = (label, key, placeholder = "09XXXXXXXXX") => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={values[key]}
        placeholder={placeholder}
        keyboardType="numeric"
        maxLength={11}
        onChangeText={(text) => updateContact(key, text)}
        style={[styles.input, fieldErrors[key] && styles.errorInput]}
      />
      {fieldErrors[key] && <Text style={styles.errorText}>{fieldErrors[key]}</Text>}
    </View>
  );

  const renderNumericInput = (label, key, placeholder = null) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={values[key]}
        placeholder={placeholder || "Enter " + label}
        keyboardType="numeric"
        onChangeText={(text) => updateValue(key, text.replace(/[^0-9]/g, ""))}
        style={[styles.input, fieldErrors[key] && styles.errorInput]}
      />
      {fieldErrors[key] && <Text style={styles.errorText}>{fieldErrors[key]}</Text>}
    </View>
  );

  const renderYearInput = (label, key, placeholder = "YYYY") => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={values[key]}
        placeholder={placeholder}
        keyboardType="numeric"
        maxLength={4}
        onChangeText={(text) => updateValue(key, text.replace(/[^0-9]/g, ""))}
        style={[styles.input, fieldErrors[key] && styles.errorInput]}
      />
      {fieldErrors[key] && <Text style={styles.errorText}>{fieldErrors[key]}</Text>}
    </View>
  );

  const renderSelect = (label, key, options) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.pickerInput, fieldErrors[key] && styles.errorInput]}
        onPress={() => openSelect({ type: "value", key, options })}
      >
        <Text style={styles.pickerText}>{values[key] || "Select"}</Text>
        <Ionicons name="chevron-down" size={20} color="#5b6095" />
      </TouchableOpacity>
      {fieldErrors[key] && <Text style={styles.errorText}>{fieldErrors[key]}</Text>}
    </View>
  );

  const renderMemberSelect = (label, field, idx, options) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.pickerInput, fieldErrors["dynFamily_" + idx + "_" + field] && styles.errorInput]}
        onPress={() => openSelect({ type: "member", index: idx, key: field, options })}
      >
        <Text style={styles.pickerText}>{familyMembers[idx]?.[field] || "Select"}</Text>
        <Ionicons name="chevron-down" size={20} color="#5b6095" />
      </TouchableOpacity>
      {fieldErrors["dynFamily_" + idx + "_" + field] && (
        <Text style={styles.errorText}>{fieldErrors["dynFamily_" + idx + "_" + field]}</Text>
      )}
    </View>
  );

  const renderUpload = (label, key) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.uploadBtn, fieldErrors[key] && styles.errorInput]}
        onPress={() => pickFile(key)}
      >
        <Text style={styles.uploadText} numberOfLines={1} ellipsizeMode="middle">
          {uploadText[key] ? uploadText[key].name || uploadText[key].fileName || "Selected File" : "File Upload"}
        </Text>
      </TouchableOpacity>
      {fieldErrors[key] && <Text style={styles.errorText}>{fieldErrors[key]}</Text>}
    </View>
  );

  const renderCommonFamilyMembers = () => (
    <>
      <TouchableOpacity onPress={addFamilyMember} style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
        <Ionicons name="add-circle-outline" size={20} color="#4c60d1" style={{ marginRight: 6 }} />
        <Text style={{ color: "#4c60d1", fontWeight: "700", fontSize: 15 }}>Add Family Member</Text>
      </TouchableOpacity>
      {fieldErrors.familyMembers && <Text style={styles.errorText}>{fieldErrors.familyMembers}</Text>}

      {familyMembers.map((member, idx) => (
        <View key={idx} style={styles.memberCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Text style={styles.memberTitle}>Family Member {idx + 1}</Text>
            <TouchableOpacity onPress={() => removeFamilyMember(idx)}>
              <Text style={{ color: "#d9534f", fontWeight: "700" }}>Remove</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={[styles.input, fieldErrors["dynFamily_" + idx + "_name"] && styles.errorInput]}
              value={member.name}
              placeholder="Enter Name"
              onChangeText={(text) => updateFamilyMember(idx, "name", text)}
            />
            {fieldErrors["dynFamily_" + idx + "_name"] && (
              <Text style={styles.errorText}>{fieldErrors["dynFamily_" + idx + "_name"]}</Text>
            )}
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Relationship</Text>
            <TextInput
              style={[styles.input, fieldErrors["dynFamily_" + idx + "_relationship"] && styles.errorInput]}
              value={member.relationship}
              placeholder="e.g. Brother, Sister, Guardian"
              onChangeText={(text) => updateFamilyMember(idx, "relationship", text)}
            />
            {fieldErrors["dynFamily_" + idx + "_relationship"] && (
              <Text style={styles.errorText}>{fieldErrors["dynFamily_" + idx + "_relationship"]}</Text>
            )}
          </View>

          {member.status !== "Deceased" && (
            <View style={styles.row}>
              <Text style={styles.label}>Contact No.</Text>
              <TextInput
                style={[styles.input, fieldErrors["dynFamily_" + idx + "_contactNo"] && styles.errorInput]}
                value={member.contactNo}
                placeholder="09XXXXXXXXX"
                keyboardType="numeric"
                maxLength={11}
                onChangeText={(text) => {
                  let cleaned = text.replace(/[^0-9]/g, "");
                  if (cleaned.length >= 1 && cleaned[0] !== "0") cleaned = "0";
                  if (cleaned.length >= 2 && cleaned.substring(0, 2) !== "09") cleaned = "09";
                  updateFamilyMember(idx, "contactNo", cleaned);
                }}
              />
              {fieldErrors["dynFamily_" + idx + "_contactNo"] && (
                <Text style={styles.errorText}>{fieldErrors["dynFamily_" + idx + "_contactNo"]}</Text>
              )}
            </View>
          )}

          {renderMemberSelect("Employment Status", "status", idx, ["Employed", "Unemployed", "Self-Employed", "Deceased"])}

          {requiresIncomeProof(member.status) && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Occupation</Text>
                <TextInput
                  style={[styles.input, fieldErrors["dynFamily_" + idx + "_occupation"] && styles.errorInput]}
                  value={member.occupation}
                  placeholder="Enter Occupation"
                  onChangeText={(text) => updateFamilyMember(idx, "occupation", text)}
                />
                {fieldErrors["dynFamily_" + idx + "_occupation"] && (
                  <Text style={styles.errorText}>{fieldErrors["dynFamily_" + idx + "_occupation"]}</Text>
                )}
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Monthly Income</Text>
                <TextInput
                  style={[styles.input, fieldErrors["dynFamily_" + idx + "_income"] && styles.errorInput]}
                  value={member.income}
                  placeholder="Enter Monthly Income"
                  keyboardType="numeric"
                  onChangeText={(text) => updateFamilyMember(idx, "income", text.replace(/[^0-9]/g, ""))}
                />
                {fieldErrors["dynFamily_" + idx + "_income"] && (
                  <Text style={styles.errorText}>{fieldErrors["dynFamily_" + idx + "_income"]}</Text>
                )}
              </View>
            </>
          )}
        </View>
      ))}
    </>
  );

  // ─── Flow renderers ───────────────────────────────────────────────────────

  const renderTertiaryFlow = () => {
    if (step === 0) {
      return (
        <View>
          <Text style={styles.sectionHeader}>Academic Information</Text>
          {renderSelect("Scholarship Type", "scholarshipType", ["Manila Scholars", "Bulacan Scholars", "Nationwide Scholars"])}
          {renderSelect("Incoming Freshman", "incomingFreshman", ["No", "Yes"])}

          <Text style={styles.sectionHeader}>| Secondary Education</Text>
          {renderInput("School Name", "schoolName", "Enter School Name")}
          {renderSelect("Strand", "strand", ["STEM", "ABM", "HUMMS", "GAS", "TVL"])}
          {renderYearInput("Year Graduated", "yearGraduated")}
          {renderUpload("Grade Report", "gradeReport")}

          <Text style={styles.sectionHeader}>| Current Tertiary Education</Text>
          {renderInput("University / College Name", "universityName", "Enter School Name")}
          {renderInput("Program", "program", "Enter Program")}
          {renderSelect("Term Type", "termType", ["Semester", "Trimester", "Quarter System"])}
          {renderSelect("Grade Scale", "gradeScale", ["1.0 - 5.00 Grading System", "4.00 GPA System", "Percentage System", "Letter Grade System"])}
          {renderSelect("Year Level", "yearLevel", ["1st", "2nd", "3rd", "4th", "5th"])}
          {renderSelect("Term", "term",
            values.termType === "Quarter System" ? ["1st", "2nd", "3rd", "4th"] :
            values.termType === "Trimester" ? ["1st", "2nd", "3rd"] : ["1st", "2nd"]
          )}
          {renderYearInput("Expected Year of Graduation", "expectedGradYear")}
          {renderUpload("COR", "cor")}
          {values.incomingFreshman === "No" && renderUpload("Current Term Grade Report", "currentTermGradeReport")}
        </View>
      );
    }

    if (step === 1) {
      return (
        <View>
          <Text style={styles.sectionHeader}>Family Information</Text>

          <Text style={styles.sectionHeader}>| Father's Information</Text>
          {renderInput("Father's Name", "fatherName", "Enter Father's Name")}
          {renderSelect("Employment Status", "fatherStatus", ["Employed", "Unemployed", "Self-Employed", "Deceased"])}
          {values.fatherStatus !== "Deceased" && renderContactInput("Contact Number", "fatherContact")}
          {requiresIncomeProof(values.fatherStatus) && (
            <>
              {renderInput("Occupation", "fatherOccupation", "Enter Occupation")}
              {renderNumericInput("Monthly Income", "fatherIncome", "Enter Monthly Income")}
            </>
          )}

          <Text style={styles.sectionHeader}>| Mother's Information</Text>
          {renderInput("Mother's Name", "motherName", "Enter Mother's Name")}
          {renderSelect("Employment Status", "motherStatus", ["Employed", "Unemployed", "Self-Employed", "Deceased"])}
          {values.motherStatus !== "Deceased" && renderContactInput("Contact Number", "motherContact")}
          {requiresIncomeProof(values.motherStatus) && (
            <>
              {renderInput("Occupation", "motherOccupation", "Enter Occupation")}
              {renderNumericInput("Monthly Income", "motherIncome", "Enter Monthly Income")}
            </>
          )}

          {renderCommonFamilyMembers()}
        </View>
      );
    }

    if (step === 2) {
      return (
        <View>
          <Text style={styles.sectionHeader}>| Supporting Documents</Text>
          <View style={{ backgroundColor: "#eaf2fe", padding: 13, borderRadius: 8, marginBottom: 18 }}>
            <Text style={{ color: "#305fce", fontSize: 13 }}>
              Upload clear and readable files only. Accepted formats: PDF, DOC, DOCX. Max file size: 10MB each.
            </Text>
          </View>

          {renderUpload("Certificate of Indigency (Applicant)", "indigency")}
          {renderUpload("Birth Certificate (Applicant)", "birthCert")}

          {requiresIncomeProof(values.fatherStatus)
            ? renderUpload("Income Certificate (Father)", "incomeFather")
            : <Text style={styles.skippedDoc}>Income certificate not required for Father ({values.fatherStatus}).</Text>}

          {requiresIncomeProof(values.motherStatus)
            ? renderUpload("Income Certificate (Mother)", "incomeMother")
            : <Text style={styles.skippedDoc}>Income certificate not required for Mother ({values.motherStatus}).</Text>}

          {familyMembers.map((member, idx) =>
            requiresIncomeProof(member.status) ? (
              <View key={"member-doc-" + idx}>
                {renderUpload(
                  "Income Certificate (" + (member.name || "Family Member " + (idx + 1)) + ")",
                  "incomeMember_" + idx
                )}
              </View>
            ) : null
          )}

          {renderUpload("Recommendation Letter (Optional)", "recommendation")}
          {renderUpload("Essay", "essay")}
        </View>
      );
    }

    return renderReview();
  };

  const renderVocationalFlow = () => {
    if (step === 0) {
      return (
        <View>
          <Text style={styles.sectionHeader}>Academic Information</Text>
          {renderSelect("Scholarship type", "scholarshipType", ["TESDA", "CHED", "Others"])}
          {renderSelect("Scholarship Fund type", "fundType", ["KKFI Funded", "Scrantron Funded"])}

          <Text style={styles.sectionHeader}>| Secondary Education</Text>
          {renderInput("School Name", "schoolName", "Enter School Name")}
          {renderSelect("Strand", "strand", ["STEM", "ABM", "HUMMS", "GAS", "TVL"])}
          {renderInput("Year Graduated", "yearGraduated", "YYYY")}
          {renderUpload("Report Card", "gradeReport")}

          <Text style={styles.sectionHeader}>| Vocational/Technical Education</Text>
          {renderInput("School Name", "vocationalSchoolName", "Enter School Name")}
          {renderInput("Program", "vocationalProgram", "Enter Program")}
          {renderSelect("Course Duration (months)", "courseDuration", ["3", "5", "6", "12"])}
          {renderSelect("Completion Date", "completionDate", ["May 22, 2026", "Dec 15, 2026"])}
          {renderUpload("COR", "cor")}
        </View>
      );
    }

    if (step === 1) {
      return (
        <View>
          <Text style={styles.sectionHeader}>Family Information</Text>
          <Text style={styles.sectionHeader}>| Parents Information</Text>

          {renderInput("Father's Name", "fatherName", "Enter Father's Name")}
          {renderSelect("Employment Status", "fatherStatus", ["Employed", "Unemployed", "Self-Employed", "Deceased"])}
          {requiresIncomeProof(values.fatherStatus) && (
            <>
              {renderInput("Occupation", "fatherOccupation", "Enter Occupation")}
              {renderNumericInput("Monthly Income", "fatherIncome", "Enter Monthly Income")}
            </>
          )}

          {renderInput("Mother's Name", "motherName", "Enter Mother's Name")}
          {renderSelect("Employment Status", "motherStatus", ["Employed", "Unemployed", "Self-Employed", "Deceased"])}
          {requiresIncomeProof(values.motherStatus) && (
            <>
              {renderInput("Occupation", "motherOccupation", "Enter Occupation")}
              {renderNumericInput("Monthly Income", "motherIncome", "Enter Monthly Income")}
            </>
          )}

          {renderCommonFamilyMembers()}
        </View>
      );
    }

    if (step === 2) {
      return (
        <View>
          <Text style={styles.sectionHeader}>| Supporting Documents</Text>
          {renderUpload("Barangay Certificate (Applicant)", "indigency")}
          {renderUpload("Birth Certificate (Applicant)", "birthCert")}
          {requiresIncomeProof(values.fatherStatus) && renderUpload("Income Certificate (Father)", "incomeFather")}
          {requiresIncomeProof(values.motherStatus) && renderUpload("Income Certificate (Mother)", "incomeMother")}
          {renderUpload("Income Certificate (Guardian)", "incomeGuardian")}
        </View>
      );
    }

    return renderReview();
  };

  const renderEmployeeChildFlow = () => {
    if (step === 0) {
      return (
        <View>
          <Text style={styles.sectionHeader}>Academic Information</Text>
          {renderSelect("Education Path", "educPath", ["Tertiary", "Masters"])}
          {renderSelect("Incoming Freshman?", "incomingFreshman", ["No", "Yes"])}

          <Text style={styles.sectionHeader}>| Secondary Education</Text>
          {renderInput("School Name", "schoolName", "Enter School Name")}
          {renderSelect("Strand", "strand", ["STEM", "ABM", "HUMMS", "GAS", "TVL"])}
          {renderInput("Year Graduated", "secondaryYearGraduated", "YYYY")}
          {renderUpload("Grade Report", "gradeReport")}

          {values.educPath === "Masters" && (
            <>
              <Text style={styles.sectionHeader}>| Previous Tertiary Education</Text>
              {renderInput("Previous School Name", "prevSchoolName", "Enter Previous School Name")}
              {renderInput("Previous Program", "prevProgram", "Enter Previous Program")}
              {renderInput("Previous Year Graduated", "prevYearGraduated", "YYYY")}
            </>
          )}

          <Text style={styles.sectionHeader}>| Current Tertiary Education</Text>
          {renderInput("University / College Name", "universityName", "Enter School Name")}
          {renderInput("Program", "program", "Enter Program")}
          {renderSelect("Term Type", "termType", ["Semester", "Trimester", "Quarter System"])}
          {renderSelect("Grade Scale", "gradeScale", ["1.0 - 5.00 Grading System", "4.00 GPA System", "Percentage System", "Letter Grade System"])}
          {renderSelect("Year Level", "yearLevel", ["1st", "2nd", "3rd", "4th", "5th"])}
          {renderSelect("Term", "term",
            values.termType === "Quarter System" ? ["1st", "2nd", "3rd", "4th"] :
            values.termType === "Trimester" ? ["1st", "2nd", "3rd"] : ["1st", "2nd"]
          )}
          {renderInput("Expected Year of Graduation", "expectedGradYear", "YYYY")}
          {renderUpload("COR", "cor")}
          {values.incomingFreshman === "No" && renderUpload("Current Term Grade Report", "currentTermGradeReport")}
        </View>
      );
    }

    if (step === 1) {
      return (
        <View>
          <Text style={styles.sectionHeader}>| Staff Details</Text>
          {renderInput("Staff ID", "staffId", "Enter Staff ID")}
          {renderInput("First Name", "firstName", "Enter First Name")}
          {renderInput("Middle Name (Optional)", "middleName", "Enter Middle Name")}
          {renderInput("Last Name", "lastName", "Enter Last Name")}
          {renderSelect("Suffix (Optional)", "suffix", ["--", "Jr.", "Sr.", "II", "III", "IV"])}
          {renderSelect("Position", "position", ["Human Resource", "Finance", "Operations", "Admin", "IT", "Sales", "Others"])}
          {values.position === "Others" && renderInput("Specify Position", "position", "Enter Position")}
        </View>
      );
    }

    return renderReview();
  };

  const renderReviewCard = (title, fields) => (
    <View style={styles.reviewCard}>
      <View style={{ borderBottomWidth: 1, borderBottomColor: "#eef0ff", paddingBottom: 8, marginBottom: 10 }}>
        <Text style={styles.reviewCardTitle}>{title}</Text>
      </View>
      {fields.map((item, idx) => (
        <View key={idx} style={styles.reviewRowCardItem}>
          <Text style={styles.reviewLabel}>{item.label}</Text>
          {item.icon ? (
            <Ionicons name={item.icon} size={20} color="#2dd1a3" />
          ) : item.dash ? (
            <Text style={{ color: "#aab0cc", fontSize: 16 }}>—</Text>
          ) : (
            <Text style={styles.reviewValueCard}>{item.value || "-"}</Text>
          )}
        </View>
      ))}
    </View>
  );

  const renderReview = () => (
    <View>
      <Text style={styles.sectionHeader}>Review & Declaration</Text>

      {selectedProgram === "tertiary" && (
        <>
          {renderReviewCard("| Scholarship Information", [
            { label: "Scholarship type", value: values.scholarshipType },
            { label: "Incoming Freshman?", value: values.incomingFreshman },
          ])}
          {renderReviewCard("| Secondary Education Information", [
            { label: "School Name", value: values.schoolName },
            { label: "Strand", value: values.strand },
            { label: "Year Graduated", value: values.yearGraduated },
          ])}
          {renderReviewCard("| Tertiary Education Information", [
            { label: "School Name", value: values.universityName },
            { label: "Program", value: values.program },
            { label: "Year Level", value: values.yearLevel },
            { label: "Term", value: values.term },
            { label: "Expected Year Series", value: values.expectedGradYear },
          ])}
          {renderReviewCard("| Parents Information", [
            { label: "Father's Name", value: values.fatherName },
            { label: "Employment Status", value: values.fatherStatus },
            ...(values.fatherStatus !== "Deceased" && requiresIncomeProof(values.fatherStatus) ? [
              { label: "Father Contact", value: values.fatherContact },
              { label: "Father Income", value: values.fatherIncome },
            ] : []),
            { label: "Mother's Name", value: values.motherName },
            { label: "Employment Status", value: values.motherStatus },
            ...(values.motherStatus !== "Deceased" && requiresIncomeProof(values.motherStatus) ? [
              { label: "Mother Contact", value: values.motherContact },
              { label: "Mother Income", value: values.motherIncome },
            ] : []),
          ])}
          {renderReviewCard("| Supporting Documents", [
            { label: "Certificate of Indigency", icon: uploadText.indigency ? "checkmark-circle-outline" : null, dash: !uploadText.indigency },
            { label: "Birth Certificate", icon: uploadText.birthCert ? "checkmark-circle-outline" : null, dash: !uploadText.birthCert },
            { label: "Essay", icon: uploadText.essay ? "checkmark-circle-outline" : null, dash: !uploadText.essay },
          ])}
        </>
      )}

      {selectedProgram === "vocational" && (
        <>
          {renderReviewCard("| Scholarship Information", [
            { label: "Scholarship type", value: values.scholarshipType },
            { label: "Fund type", value: values.fundType },
          ])}
          {renderReviewCard("| Secondary Education", [
            { label: "School Name", value: values.schoolName },
            { label: "Strand", value: values.strand },
          ])}
          {renderReviewCard("| Vocational Education", [
            { label: "School Name", value: values.vocationalSchoolName },
            { label: "Program", value: values.vocationalProgram },
          ])}
        </>
      )}

      {selectedProgram === "employeeChild" && (
        <>
          {renderReviewCard("| Academic Information", [
             { label: "Path", value: values.educPath },
             { label: "Incoming Freshman", value: values.incomingFreshman },
          ])}
          {renderReviewCard("| Staff Details", [
             { label: "Staff ID", value: values.staffId },
             { label: "First Name", value: values.firstName },
             { label: "Last Name", value: values.lastName },
             { label: "Position", value: values.position },
          ])}
        </>
      )}

      <View style={styles.reviewCard}>
        <Text style={styles.reviewCardTitle}>Declaration and Agreement</Text>

        <TouchableOpacity style={styles.declRow} onPress={() => setDeclarations((d) => ({ ...d, agree1: !d.agree1 }))}>
          <View style={[styles.checkbox, declarations.agree1 && styles.checkboxChecked]}>
            {declarations.agree1 && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.declarationText}>
            I certify that all information provided is true and correct. Any false information may result in denial or revocation of the scholarship.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.declRow} onPress={() => setDeclarations((d) => ({ ...d, agree2: !d.agree2 }))}>
          <View style={[styles.checkbox, declarations.agree2 && styles.checkboxChecked]}>
            {declarations.agree2 && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.declarationText}>
            I agree to provide additional documentation when requested and comply with all scholarship terms.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.declRow} onPress={() => setDeclarations((d) => ({ ...d, agree3: !d.agree3 }))}>
          <View style={[styles.checkbox, declarations.agree3 && styles.checkboxChecked]}>
            {declarations.agree3 && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.declarationText}>
            I have read and agree to the <Text style={{ color: "#3d4fa0", fontWeight: "700" }}>Data Privacy Notice</Text> and consent to processing of my personal data.
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderQualification = () => {
    const reportData = qualificationOutcome?.qualification_report;
    const rules = reportData?.rule_results
      ? Object.keys(reportData.rule_results).map((ruleKey) => {
          const res = reportData.rule_results[ruleKey];
          return {
            rule: ruleKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            status: res.status === "passed" ? "passed" : "failed",
            feedback: res.message,
          };
        })
      : [];

    const isQualified = reportData?.final_result === "qualified";
    const isReview = reportData?.final_result !== "qualified" && reportData?.final_result !== "not_qualified";

    const finalStatusText =
      isQualified ? "Qualified" :
      reportData?.final_result === "not_qualified" ? "Not Qualified" :
      "For Review of Staff";

    const statusColor = isQualified ? "#1a9e6a" : (isReview ? "#e8a030" : "#e03a3a");
    const statusBg = isQualified ? "#e6fff5" : (isReview ? "#fff7e6" : "#fff0f0");

    return (
      <View style={{ paddingBottom: 40 }}>
        {/* Success Banner */}
        <View style={{ backgroundColor: "#eef0ff", borderRadius: 12, padding: 16, marginBottom: 20, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#dbe2f6" }}>
          <View style={{ backgroundColor: "#4f5fc5", width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 14 }}>
            <Ionicons name="checkmark-done" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#2d3a7c", fontWeight: "900", fontSize: 16, marginBottom: 2 }}>Evaluation Complete</Text>
            <Text style={{ color: "#5b6095", fontSize: 13, lineHeight: 18 }}>Your application has been successfully parsed and evaluated by our AI.</Text>
          </View>
        </View>

        {/* AI Report Card */}
        <View style={[styles.reviewCard, { padding: 0, overflow: "hidden", borderWidth: 1, borderColor: "#dbe2f6" }]}>
          <View style={{ backgroundColor: "#fbfbff", padding: 18, borderBottomWidth: 1, borderBottomColor: "#eff1f8" }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <Ionicons name="sparkles" size={20} color="#4f5ec4" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#3d4fa0" }}>Qualification Report</Text>
            </View>
            <Text style={{ fontSize: 13, color: "#7a82a0", lineHeight: 20 }}>
              Below is the automated assessment against the scholarship's strict eligibility criteria.
            </Text>
          </View>

          <View style={{ padding: 18 }}>
            {rules.length === 0 && (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <Ionicons name="document-text-outline" size={48} color="#e4e8f6" />
                <Text style={{ color: "#8a94b5", marginTop: 10, fontWeight: "600" }}>Application submitted successfully.</Text>
              </View>
            )}
            
            {rules.map((item, idx) => {
              const passed = item.status === "passed";
              return (
                <View key={idx} style={{ marginBottom: idx === rules.length - 1 ? 0 : 16 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <Text style={{ color: "#2d3a7c", fontWeight: "800", fontSize: 14, flex: 1, paddingRight: 10 }}>{item.rule}</Text>
                    <View style={{ backgroundColor: passed ? "#e6fff5" : "#fff0f0", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                      <Text style={{ color: passed ? "#1a9e6a" : "#e03a3a", fontWeight: "800", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{item.status}</Text>
                    </View>
                  </View>
                  <Text style={{ color: "#6e7798", fontSize: 13, lineHeight: 18, backgroundColor: "#f8f9fc", padding: 10, borderRadius: 8, borderWidth: 1, borderColor: "#eff1f8" }}>
                    {item.feedback}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Final Status Footer */}
          <View style={{ backgroundColor: statusBg, padding: 18, borderTopWidth: 1, borderTopColor: "#eff1f8", flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#6b7280", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Final Status</Text>
              <Text style={{ color: statusColor, fontSize: 18, fontWeight: "900" }}>{finalStatusText}</Text>
            </View>
            <Ionicons name={isQualified ? "ribbon" : (isReview ? "time" : "close-circle")} size={36} color={statusColor} style={{ opacity: 0.8 }} />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: "#4f5fc5", marginTop: 10 }]}
          onPress={() => navigation?.navigate?.("Application")}
        >
          <Text style={styles.nextBtnText}>View My Applications</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStep = () => {
    if (isSubmittingNow) {
      return (
        <View style={styles.centered}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="sync-circle" size={110} color="#4f5fc5" />
          </Animated.View>
          <Text style={styles.completeText}>Evaluating Application...</Text>
          <Text style={styles.subText}>Please hold on while we securely process your documents.</Text>
        </View>
      );
    }

    if (completeStage === "qualificationReport") return renderQualification();

    if (selectedProgram === "tertiary") return renderTertiaryFlow();
    if (selectedProgram === "vocational") return renderVocationalFlow();
    if (selectedProgram === "employeeChild") return renderEmployeeChildFlow();

    return null;
  };

  const allDeclared = declarations.agree1 && declarations.agree2 && declarations.agree3;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressHeader}>
        <TouchableOpacity
          onPress={() => (step > 0 ? setStep(step - 1) : navigation?.goBack?.())}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#4c60d1" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {selectedProgram === "employeeChild"
            ? isChildDesignation ? "KKFI Employee-Child Education Grant" : "Employee Child Grant"
            : selectedProgram === "vocational"
            ? "VOCATIONAL AND TECHNOLOGY SCHOLARSHIP"
            : "Tertiary Scholarship Program"}
        </Text>
        <View style={styles.empty} />
      </View>

      <View style={styles.progressBarRow}>
        {[...Array(maxStep + 2)].map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.progressStep,
              completeStage === "qualificationReport" || idx <= step
                ? styles.progressStepActive
                : styles.progressStepInactive,
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
        <Animated.View
          style={{
            opacity: stepAnim,
            transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          }}
        >
          {renderStep()}
          {apiError ? <Text style={[styles.errorText, { marginTop: 8 }]}>{apiError}</Text> : null}
        </Animated.View>
      </ScrollView>

      {!isSubmittingNow && completeStage === "none" && step < maxStep && (
        <TouchableOpacity style={styles.nextBtn} onPress={advance}>
          <Text style={styles.nextBtnText}>Next Step →</Text>
        </TouchableOpacity>
      )}

      {!isSubmittingNow && completeStage === "none" && step === maxStep && (
        <TouchableOpacity
          style={[styles.nextBtn, !allDeclared && { backgroundColor: "#bcc1e8" }]}
          onPress={() => { if (allDeclared) submitApplication(); }}
          disabled={!allDeclared}
        >
          <Text style={styles.nextBtnText}>Submit Application</Text>
        </TouchableOpacity>
      )}

      <Modal visible={selectVisible} transparent animationType="slide" onRequestClose={closeSelect}>
        <View style={styles.modalRoot}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Option</Text>
              <TouchableOpacity onPress={closeSelect}>
                <Ionicons name="close" size={24} color="#4f5fc5" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              {(selectContext?.options || []).map((opt, idx) => {
                const isSelected =
                  selectContext?.type === "member"
                    ? familyMembers[selectContext.index]?.[selectContext.key] === opt
                    : values[selectContext?.key] === opt;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.modalOption, isSelected && styles.modalOptionActive]}
                    onPress={() => applySelect(opt)}
                  >
                    <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f5ff" },
  progressHeader: {
    flexDirection: "row", alignItems: "center",
    paddingTop: 16, paddingBottom: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderColor: "#ccd1ed",
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  empty: { width: 40 },
  title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", color: "#4f5fc5" },
  progressBarRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, marginTop: 12, marginBottom: 8 },
  progressStep: { height: 6, flex: 1, marginHorizontal: 2, borderRadius: 5 },
  progressStepActive: { backgroundColor: "#29d0a5" },
  progressStepInactive: { backgroundColor: "#d4dae3" },
  content: { flex: 1, padding: 14 },
  sectionHeader: { fontSize: 18, fontWeight: "800", color: "#3b4f9c", marginTop: 8, marginBottom: 12 },
  row: { marginBottom: 10 },
  label: { fontWeight: "700", color: "#5b6095", marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: "#d7def8", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 12 : 10,
    backgroundColor: "#ffffff", color: "#2f427f", fontSize: 16, fontWeight: "600",
  },
  pickerInput: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderWidth: 1, borderColor: "#d7def8", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 12 : 10,
    backgroundColor: "#ffffff",
  },
  pickerText: { color: "#2f427f", fontSize: 16, fontWeight: "600" },
  uploadBtn: {
    borderWidth: 1, borderColor: "#d7def8", borderRadius: 10,
    justifyContent: "center", paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10, backgroundColor: "#f7f9ff",
  },
  uploadText: { color: "#848baf", fontSize: 16, fontWeight: "600" },
  errorInput: { borderColor: "#e03a3a", borderWidth: 2 },
  errorText: { color: "#e03a3a", fontSize: 13, marginTop: 4, fontWeight: "600" },
  skippedDoc: { fontSize: 13, color: "#6b72aa", marginBottom: 18 },
  reviewCard: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#dbe2f6",
    borderRadius: 14, padding: 12, marginBottom: 12,
  },
  reviewCardTitle: { fontSize: 16, fontWeight: "900", color: "#3d4fa0", marginBottom: 12 },
  reviewRowCardItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8, alignItems: "flex-start" },
  reviewLabel: { color: "#6b72aa", fontSize: 13, fontWeight: "700" },
  reviewValueCard: { fontSize: 14, color: "#233873", fontWeight: "700" },
  nextBtn: { margin: 14, backgroundColor: "#4f5fc5", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  centered: { alignItems: "center", justifyContent: "center", marginTop: 120 },
  completeText: { fontSize: 22, fontWeight: "800", color: "#3f4ca8", marginTop: 16, marginBottom: 22 },
  subText: { textAlign: "center", color: "#848baf", paddingHorizontal: 40, fontSize: 15 },
  memberCard: { backgroundColor: "#f8f8ff", borderRadius: 10, padding: 10, marginTop: 10, borderWidth: 1, borderColor: "#d7def8" },
  memberTitle: { fontWeight: "700", color: "#33428b", marginBottom: 6 },
  modalRoot: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80%", paddingTop: 16, paddingHorizontal: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#e4e8f8" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#3d4fa0" },
  modalOption: { width: "100%", marginTop: 10, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: "#d7def8", backgroundColor: "#f8f9ff", alignItems: "center" },
  modalOptionActive: { backgroundColor: "#4f5fc5", borderColor: "#4f5fc5" },
  modalOptionText: { fontSize: 16, fontWeight: "700", color: "#4f5fc5" },
  modalOptionTextActive: { color: "#fff" },
  declRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "#4f5fc5", alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 1, backgroundColor: "#fff", flexShrink: 0 },
  checkboxChecked: { backgroundColor: "#4f5fc5", borderColor: "#4f5fc5" },
  declarationText: { flex: 1, color: "#5b6095", fontSize: 13, lineHeight: 20 },
});