import React, { useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const infoFields = {
  scholarshipType: "Manila Scholars",
  fundType: "KKFI Funded",
  incomingFreshman: "No",
  schoolName: "",
  strand: "STEM",
  yearGraduated: "2023",
  universityName: "",
  program: "",
  termType: "Semester",
  gradeScale: "1.0 - Scale",
  yearLevel: "3rd",
  term: "1st",
  fatherName: "",
  fatherStatus: "Employed",
  fatherOccupation: "",
  fatherIncome: "",
  motherName: "",
  motherStatus: "Employed",
  motherOccupation: "",
  motherIncome: "",
};

export default function ProgramApplyScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(infoFields);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [uploadText, setUploadText] = useState({ cor: "", gradeReport: "", currentTermGradeReport: "", indigency: "", birthCert: "", incomeFather: "", incomeMother: "", recommendation: "", essay: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const advance = () => {
    if (step < 3) setStep((s) => s + 1);
    else submitApplication();
  };

  const addFamilyMember = () => {
    setFamilyMembers((prev) => [...prev, { name: "", relationship: "", occupation: "", income: "" }]);
  };

  const updateFamilyMember = (index, field, value) => {
    setFamilyMembers((prev) => prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)));
  };

  const submitApplication = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  const renderStep = () => {
    if (submitted) {
      return (
        <View style={styles.centered}>
          <Ionicons name="checkmark-circle" size={86} color="#4f5fc5" />
          <Text style={styles.completeText}>Pre-Assessment Complete</Text>
          <TouchableOpacity style={styles.submitBtn} onPress={() => navigation.navigate("HomeMain") }>
            <Text style={styles.submitBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (submitting) {
      return (
        <View style={styles.centered}>
          <Ionicons name="refresh" size={86} color="#4f5fc5" style={{ transform: [{ rotate: "0deg" }] }} />
          <Text style={styles.completeText}>Evaluating Application</Text>
        </View>
      );
    }

    switch (step) {
      case 0:
        return (
          <View>
            <Text style={styles.sectionHeader}>Academic Information</Text>
            {renderInput("Scholarship type", "scholarshipType")}
            {renderInput("Scholarship Fund type", "fundType")}
            {renderYesNo("Incoming Freshman", "incomingFreshman")}
            <Text style={styles.sectionHeader}>Secondary Education</Text>
            {renderInput("School Name", "schoolName")}
            {renderDropdown("Strand", "strand", ["STEM", "ABM", "HUMMS", "GAS", "Others"])}
            {values.strand === "Others" && renderInput("Specify Strand", "strand")}
            {renderInput("Year Graduated", "yearGraduated")}
            {renderUpload("Grade Report", "gradeReport")}
            <Text style={styles.sectionHeader}>Current Tertiary Education</Text>
            {renderInput("University / College Name", "universityName")}
            {renderInput("Program", "program")}
            {renderInput("Term Type", "termType")}
            {renderInput("Grade Scale", "gradeScale")}
            {renderDropdown("Year Level", "yearLevel", ["1st", "2nd", "3rd", "4th", "5th+"])}
            {renderDropdown("Term", "term", ["1st", "2nd"])}
            {renderUpload("COR", "cor")}
            {renderUpload("Current Term Grade Report", "currentTermGradeReport")}
          </View>
        );

      case 1:
        return (
          <View>
            <Text style={styles.sectionHeader}>Family Information</Text>
            {renderInput("Father's Name", "fatherName")}
            {renderDropdown("Father Employment Status", "fatherStatus", ["Employed — Full-time", "Employed — Part-time", "Self-employed", "Business Owner", "Unemployed", "Student", "Retired", "OFW", "Others"])}
            {values.fatherStatus === "Others" && renderInput("Specify Father Status", "fatherStatus")}
            {renderInput("Occupation", "fatherOccupation")}
            {renderInput("Monthly Income", "fatherIncome")}
            {renderInput("Mother's Name", "motherName")}
            {renderDropdown("Mother Employment Status", "motherStatus", ["Employed — Full-time", "Employed — Part-time", "Self-employed", "Business Owner", "Unemployed", "Student", "Retired", "OFW", "Others"])}
            {values.motherStatus === "Others" && renderInput("Specify Mother Status", "motherStatus")}
            {renderInput("Occupation", "motherOccupation")}
            {renderInput("Monthly Income", "motherIncome")}
            <TouchableOpacity style={styles.addItemBtn} onPress={addFamilyMember}>
              <Text style={styles.addItemBtnText}>+ Add Family Member</Text>
            </TouchableOpacity>

            {familyMembers.map((member, idx) => (
              <View key={idx} style={styles.memberCard}>
                <Text style={styles.memberTitle}>Family Member {idx + 1}</Text>
                <TextInput
                  style={styles.input}
                  value={member.name}
                  placeholder="Name"
                  onChangeText={(text) => updateFamilyMember(idx, "name", text)}
                />
                <TextInput
                  style={styles.input}
                  value={member.relationship}
                  placeholder="Relationship to Applicant"
                  onChangeText={(text) => updateFamilyMember(idx, "relationship", text)}
                />
                <TextInput
                  style={styles.input}
                  value={member.occupation}
                  placeholder="Occupation"
                  onChangeText={(text) => updateFamilyMember(idx, "occupation", text)}
                />
                <TextInput
                  style={styles.input}
                  value={member.income}
                  placeholder="Monthly Income"
                  onChangeText={(text) => updateFamilyMember(idx, "income", text)}
                />
              </View>
            ))}
          </View>
        );

      case 2:
        return (
          <View>
            <Text style={styles.sectionHeader}>Supporting Documents</Text>
            {renderUpload("Certificate of Indigency Form (Applicant)", "indigency")}
            {renderUpload("Birth Certificate (Applicant)", "birthCert")}
            {renderUpload("Income Certificate (Father)", "incomeFather")}
            {renderUpload("Income Certificate (Mother)", "incomeMother")}
            {renderUpload("Recommendation Letter Form (Optional)", "recommendation")}
            {renderUpload("Essay", "essay")}
          </View>
        );

      case 3:
        return (
          <View>
            <Text style={styles.sectionHeader}>Review Information</Text>
            {renderReview("Scholarship type", values.scholarshipType)}
            {renderReview("Scholarship Fund type", values.fundType)}
            {renderReview("Incoming Freshman", values.incomingFreshman)}
            {renderReview("School Name", values.schoolName)}
            {renderReview("Strand", values.strand)}
            {renderReview("Year Graduated", values.yearGraduated)}
            {renderReview("University", values.universityName)}
            {renderReview("Program", values.program)}
            {renderReview("Year Level", values.yearLevel)}
            {renderReview("Father's Name", values.fatherName)}
            {renderReview("Mother's Name", values.motherName)}
            {renderReview("Supporting Documents", "See uploads above")}
          </View>
        );
      default:
        return null;
    }
  };

  const renderInput = (label, key, placeholder = null) => (
    <View style={styles.row}> 
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={values[key]}
        placeholder={placeholder || `Enter ${label}`}
        onChangeText={(text) => setValues({ ...values, [key]: text })}
        style={styles.input}
      />
    </View>
  );

  const renderDropdown = (label, key, options) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.dropdownWrapper}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.dropdownOption, values[key] === opt && styles.dropdownOptionActive]}
            onPress={() => setValues({ ...values, [key]: opt })}
          >
            <Text style={[styles.dropdownText, values[key] === opt && styles.dropdownTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderYesNo = (label, key) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.yesNoWrapper}>
        {['Yes', 'No'].map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.yesNoBtn, values[key] === opt && styles.yesNoBtnActive]}
            onPress={() => setValues({ ...values, [key]: opt })}
          >
            <Text style={[styles.yesNoText, values[key] === opt && styles.yesNoTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderUpload = (label, key) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.uploadBtn}
        onPress={() => Alert.alert("File upload", "File picker stub (implement with expo-document-picker).")}
      >
        <Text style={styles.uploadText}>{uploadText[key] || "File Upload"}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReview = (label, value) => (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressHeader}>
        <TouchableOpacity onPress={() => (step > 0 ? setStep(step - 1) : navigation.goBack())} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#4c60d1" />
        </TouchableOpacity>
        <Text style={styles.title}>Tertiary Scholarship Program</Text>
        <View style={styles.empty} />
      </View>

      <View style={styles.progressBarRow}>
        {[...Array(4)].map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.progressStep,
              idx <= step ? styles.progressStepActive : styles.progressStepInactive,
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
        {renderStep()}
      </ScrollView>

      {!submitting && !submitted && (
        <TouchableOpacity style={styles.nextBtn} onPress={advance}>
          <Text style={styles.nextBtnText}>{step < 5 ? "Next Step →" : "Submit Application"}</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f5ff" },
  progressHeader: { flexDirection: "row", alignItems: "center", paddingTop: 16, paddingBottom: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderColor: "#ccd1ed" },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  empty: { width: 40 },
  title: { flex: 1, textAlign: "center", fontSize: 20, fontWeight: "800", color: "#4f5fc5" },
  progressBarRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, marginTop: 12, marginBottom: 8 },
  progressStep: { height: 6, flex: 1, marginHorizontal: 2, borderRadius: 5 },
  progressStepActive: { backgroundColor: "#29d0a5" },
  progressStepInactive: { backgroundColor: "#d4dae3" },
  content: { flex: 1, padding: 14 },
  sectionHeader: { fontSize: 18, fontWeight: "800", color: "#3b4f9c", marginTop: 8, marginBottom: 12 },
  row: { marginBottom: 10 },
  label: { fontWeight: "700", color: "#5b6095", marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#d7def8", borderRadius: 10, paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 12 : 8, backgroundColor: "#ffffff", color: "#2f427f", marginBottom: 8 },
  addItemBtn: { marginTop: 10, backgroundColor: "#eef0ff", paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "#c7cffe", alignItems: "center" },
  addItemBtnText: { color: "#4f5fc5", fontWeight: "700" },
  memberCard: { backgroundColor: "#f8f8ff", borderRadius: 10, padding: 10, marginTop: 10, borderWidth: 1, borderColor: "#d7def8" },
  memberTitle: { fontWeight: "700", color: "#33428b", marginBottom: 6 },
  uploadBtn: { borderWidth: 1, borderColor: "#d7def8", borderRadius: 10, height: 42, justifyContent: "center", paddingHorizontal: 12, backgroundColor: "#f7f9ff" },
  uploadText: { color: "#848baf" },
  reviewRow: { padding: 10, borderColor: "#dbe2f6", borderWidth: 1, borderRadius: 10, marginBottom: 8, backgroundColor: "#fff" },
  reviewLabel: { color: "#6b72aa", fontSize: 13, fontWeight: "700" },
  reviewValue: { color: "#2d3a7c", fontSize: 14, marginTop: 2 },
  dropdownWrapper: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dropdownOption: { paddingVertical: 8, paddingHorizontal: 9, borderWidth: 1, borderColor: "#d7def8", borderRadius: 10, marginRight: 8, marginBottom: 8, backgroundColor: "#fff" },
  dropdownOptionActive: { backgroundColor: "#4f5fc5", borderColor: "#4f5fc5" },
  dropdownText: { color: "#5b6096", fontSize: 13, fontWeight: "600" },
  dropdownTextActive: { color: "#fff" },
  yesNoWrapper: { flexDirection: "row", marginTop: 4 },
  yesNoBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: "#d7def8", marginRight: 10, backgroundColor: "#fff" },
  yesNoBtnActive: { borderColor: "#4f5fc5", backgroundColor: "#4f5fc5" },
  yesNoText: { color: "#5b6096", fontWeight: "700" },
  yesNoTextActive: { color: "#fff" },
  nextBtn: { margin: 14, backgroundColor: "#4f5fc5", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  centered: { alignItems: "center", justifyContent: "center", marginTop: 120 },
  completeText: { fontSize: 22, fontWeight: "800", color: "#3f4ca8", marginTop: 16, marginBottom: 22 },
  submitBtn: { borderRadius: 12, backgroundColor: "#4f5fc5", paddingVertical: 14, paddingHorizontal: 30 },
  submitBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});