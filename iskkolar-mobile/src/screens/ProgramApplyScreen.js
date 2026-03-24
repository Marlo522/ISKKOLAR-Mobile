import React, { useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const infoFields = {
  scholarshipType: "KKFI Employee-Child Education Grant",
  fundType: "Scrantron Funded",
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
  secondaryYearGraduated: "2023",
  tertiaryYearGraduated: "2027",
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
  motherName: "",
  motherStatus: "Employed",
  motherOccupation: "",
  motherIncome: "",
};

export default function ProgramApplyScreen({ navigation, route }) {
  const program = route?.params?.program || "tertiary";
  const option = route?.params?.option || "Option 1";
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(infoFields);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [uploadText, setUploadText] = useState({ cor: "", gradeReport: "", currentTermGradeReport: "", indigency: "", birthCert: "", incomeFather: "", incomeMother: "", recommendation: "", essay: "" });
  const [submitting, setSubmitting] = useState(false);
  const [completeStage, setCompleteStage] = useState("none");
  const [yearPickerVisible, setYearPickerVisible] = useState(false);
  const [yearPickerKey, setYearPickerKey] = useState(null);

  const maxStep = program === "employeeChild" ? 2 : 3;
  const isChildDesignation = program === "employeeChild" && option === "Option 2";

  const advance = () => {
    if (step < maxStep) setStep((s) => s + 1);
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
      setCompleteStage("preAssessment");
      setTimeout(() => setCompleteStage("assessment"), 1200);
    }, 1500);
  };

  const renderStep = () => {
    if (completeStage === "assessment") {
      return (
        <View style={styles.centered}>
          <Ionicons name="checkmark-circle" size={86} color="#4f5fc5" />
          <Text style={styles.completeText}>Assessment Complete</Text>
          <TouchableOpacity style={styles.submitBtn} onPress={() => navigation.navigate("HomeMain") }>
            <Text style={styles.submitBtnText}>Return Home</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (completeStage === "preAssessment") {
      return (
        <View style={styles.centered}>
          <Ionicons name="checkmark-circle" size={86} color="#4f5fc5" />
          <Text style={styles.completeText}>Pre-Assessment Complete</Text>
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

    if (program === "employeeChild") {
      switch (step) {
        case 0:
          return (
            <View>
              <Text style={styles.sectionHeader}>Academic Information</Text>
              {renderDropdown("Scholarship Type", "scholarshipType", ["KKFI Employee-Child Education Grant", "KKFI Staff Grant"])}
              {renderDropdown("Scholarship Fund Type", "fundType", ["Scrantron Funded", "KKFI Funded"])}
              {renderYesNo("Incoming Freshman", "incomingFreshman")}

              <Text style={styles.sectionHeader}>Secondary Education</Text>
              {renderInput("School Name", "schoolName", "Enter School Name")}
              {renderDropdown("Strand", "strand", ["STEM", "ABM", "HUMMS", "GAS", "Others"])}
              {values.strand === "Others" && renderInput("Specify Strand", "strand")}
              {renderYearPicker("Year Graduated", "secondaryYearGraduated")}
              {renderUpload("Grade Report", "gradeReport")}

              <Text style={styles.sectionHeader}>Current Tertiary Education</Text>
              {renderInput("University / College Name", "universityName", "Enter School Name")}
              {renderInput("Program", "program", "Enter Program")}
              {renderDropdown("Term Type", "termType", ["Semester", "Trimester", "Quarter"])}
              {renderDropdown("Grade Scale", "gradeScale", ["1.0 - Scale", "4.0 - Scale", "5.0 - Scale"])}
              
              <View style={styles.rowTwoCol}>
                <View style={styles.colHalf}>
                  {renderDropdown("Year Level", "yearLevel", ["1st", "2nd", "3rd", "4th", "5th+"])}
                </View>
                <View style={styles.colHalf}>
                  {renderDropdown("Term", "term", ["1st", "2nd", "3rd"])}
                </View>
              </View>

              {renderUpload("COR", "cor")}
              {renderUpload("Current Term Report Card", "currentTermGradeReport")}
            </View>
          );

        case 1:
          return (
            <View>
              <Text style={styles.sectionHeader}>Staff Details</Text>
              {renderInput("Staff ID", "staffId", "Enter Staff ID")}
              {renderInput("First Name", "firstName", "Enter First Name")}
              {renderInput("Middle Name (Optional)", "middleName", "Enter Middle Name")}
              {renderInput("Last Name", "lastName", "Enter Last Name")}
              {renderDropdown("Suffix (Optional)", "suffix", ["--", "Jr.", "Sr.", "II", "III", "IV"])}
              {renderDropdown("Position", "position", ["Human Resource", "Finance", "Operations", "Admin", "IT", "Sales", "Others"])}
              {values.position === "Others" && renderInput("Specify Position", "position", "Enter Position")}
            </View>
          );

        case 2:
          return (
            <View>
              <Text style={styles.sectionHeader}>Review Information</Text>
              {renderReviewCard("Scholarship Information", [
                { label: "Fund Type", value: values.fundType },
                { label: "Scholarship Type", value: values.scholarshipType },
                { label: "Incoming Freshman", value: values.incomingFreshman },
              ])}

              {renderReviewCard("Secondary Education Information", [
                { label: "School Name", value: values.schoolName },
                { label: "Strand", value: values.strand },
                { label: "Year Graduated", value: values.secondaryYearGraduated },
              ])}

              {renderReviewCard("Tertiary Education Information", [
                { label: "School Name", value: values.universityName },
                { label: "Program", value: values.program },
                { label: "Year Graduated", value: values.tertiaryYearGraduated },
              ])}

              {renderReviewCard("Staff Information", [
                { label: "Staff ID", value: values.staffId },
                { label: "First Name", value: values.firstName },
                { label: "Middle Name", value: values.middleName },
                { label: "Last Name", value: values.lastName },
                { label: "Suffix", value: values.suffix },
                { label: "Position", value: values.position },
              ])}
            </View>
          );

        default:
          return null;
      }
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
            {renderYearPicker("Year Graduated", "yearGraduated")}
            {renderUpload("Grade Report", "gradeReport")}
            <Text style={styles.sectionHeader}>Current Tertiary Education</Text>
            {renderInput("University / College Name", "universityName")}
            {renderInput("Program", "program")}
            {renderDropdown("Term Type", "termType", ["Semester", "Trimester", "Quarter"])}
            {renderDropdown("Grade Scale", "gradeScale", ["1.0 - Scale", "4.0 - Scale", "5.0 - Scale"])}
            
            <View style={styles.rowTwoCol}>
              <View style={styles.colHalf}>
                {renderDropdown("Year Level", "yearLevel", ["1st", "2nd", "3rd", "4th", "5th+"])}
              </View>
              <View style={styles.colHalf}>
                {renderDropdown("Term", "term", ["1st", "2nd", "3rd"])}
              </View>
            </View>

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

  const renderYearPicker = (label, key) => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 50 }, (_, i) => (currentYear - 40 + i).toString());

    return (
      <>
        <View style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          <TouchableOpacity
            style={styles.yearPickerInput}
            onPress={() => {
              setYearPickerKey(key);
              setYearPickerVisible(true);
            }}
          >
            <Text style={styles.yearPickerText}>{values[key]}</Text>
            <Ionicons name="chevron-down" size={20} color="#5b6095" />
          </TouchableOpacity>
        </View>

        <Modal
          visible={yearPickerVisible && yearPickerKey === key}
          transparent
          animationType="slide"
          onRequestClose={() => setYearPickerVisible(false)}
        >
          <View style={styles.yearPickerModal}>
            <View style={styles.yearPickerContent}>
              <View style={styles.yearPickerHeader}>
                <Text style={styles.yearPickerTitle}>Select Year</Text>
                <TouchableOpacity onPress={() => setYearPickerVisible(false)}>
                  <Ionicons name="close" size={24} color="#4f5fc5" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.yearPickerScroll} showsVerticalScrollIndicator={true}>
                <View style={styles.yearPickerGrid}>
                  {years.map((year, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.yearPickerOption,
                        values[key] === year && styles.yearPickerOptionActive,
                      ]}
                      onPress={() => {
                        setValues({ ...values, [key]: year });
                        setYearPickerVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.yearPickerOptionText,
                          values[key] === year && styles.yearPickerOptionTextActive,
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </>
    );
  };

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

  const renderReviewCard = (title, fields) => (
    <View style={styles.reviewCard}>
      <Text style={styles.reviewCardTitle}>{title}</Text>
      {fields.map((item, idx) => (
        <View key={idx} style={styles.reviewRowCardItem}>
          <Text style={styles.reviewLabel}>{item.label}</Text>
          <Text style={styles.reviewValueCard}>{item.value || "-"}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressHeader}>
        <TouchableOpacity onPress={() => (step > 0 ? setStep(step - 1) : navigation.goBack())} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#4c60d1" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {program === "employeeChild" ? "KKFI Employee-Child Education Grant" : "Tertiary Scholarship Program"}
        </Text>
        <View style={styles.empty} />
      </View>

      <View style={styles.progressBarRow}>
        {[...Array(maxStep + 1)].map((_, idx) => (
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

      {!submitting && completeStage === "none" && (
        <TouchableOpacity style={styles.nextBtn} onPress={advance}>
          <Text style={styles.nextBtnText}>{step < maxStep ? "Next Step →" : "Submit Application"}</Text>
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
  reviewCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#dbe2f6", borderRadius: 14, padding: 12, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  reviewCardTitle: { fontSize: 16, fontWeight: "900", color: "#3d4fa0", marginBottom: 8 },
  reviewRowCardItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  reviewValueCard: { fontSize: 14, color: "#233873", fontWeight: "700" },
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
  rowTwoCol: { flexDirection: "row", gap: 10, marginBottom: 10 },
  colHalf: { flex: 1 },
  yearPickerWrapper: { marginTop: 2 },
  yearPickerInput: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#d7def8", borderRadius: 10, paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 12 : 10, backgroundColor: "#ffffff" },
  yearPickerText: { color: "#2f427f", fontSize: 16, fontWeight: "600" },
  yearPickerModal: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  yearPickerContent: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80%", paddingTop: 16 },
  yearPickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#e4e8f8" },
  yearPickerTitle: { fontSize: 18, fontWeight: "800", color: "#3d4fa0" },
  yearPickerScroll: { paddingHorizontal: 16, paddingVertical: 12 },
  yearPickerGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  yearPickerOption: { width: "30%", paddingVertical: 12, marginBottom: 8, borderRadius: 10, borderWidth: 1, borderColor: "#d7def8", backgroundColor: "#f8f9ff", alignItems: "center" },
  yearPickerOptionActive: { backgroundColor: "#4f5fc5", borderColor: "#4f5fc5" },
  yearPickerOptionText: { fontSize: 16, fontWeight: "700", color: "#4f5fc5" },
  yearPickerOptionTextActive: { color: "#fff" },
  nextBtn: { margin: 14, backgroundColor: "#4f5fc5", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  centered: { alignItems: "center", justifyContent: "center", marginTop: 120 },
  completeText: { fontSize: 22, fontWeight: "800", color: "#3f4ca8", marginTop: 16, marginBottom: 22 },
  submitBtn: { borderRadius: 12, backgroundColor: "#4f5fc5", paddingVertical: 14, paddingHorizontal: 30 },
  submitBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});