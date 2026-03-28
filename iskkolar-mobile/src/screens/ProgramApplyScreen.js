import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert, Modal, Animated } from "react-native";
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
  vocationalSchoolName: "",
  vocationalProgram: "",
  courseDuration: "5",
  completionDate: "May 22, 2026",
  scholarshipType: "TESDA",
  fundType: "KKFI Funded",
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
  const [selectVisible, setSelectVisible] = useState(false);
  const [selectKey, setSelectKey] = useState(null);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    stepAnim.setValue(0);
    Animated.timing(stepAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [step, completeStage, submitting]);

  useEffect(() => {
    if (submitting) {
      spinAnim.setValue(0);
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [submitting, spinAnim]);

  useEffect(() => {
    if (completeStage === "preAssessment") {
      scaleAnim.setValue(0.5);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }).start();
    }
  }, [completeStage, scaleAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

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
    }, 1500);
  };

  const renderStep = () => {
    if (completeStage === "assessment") {
      return (
        <View style={styles.centered}>
          <Ionicons name="checkmark-circle" size={86} color="#4f5fc5" />
          <Text style={styles.completeText}>Assessment Complete</Text>
          <TouchableOpacity style={styles.submitBtn} onPress={() => navigation.navigate("HomeMain")}>
            <Text style={styles.submitBtnText}>Return Home</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (completeStage === "preAssessment") {
      return (
        <View style={styles.centered}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons name="checkmark-circle" size={120} color="#29d0a5" />
          </Animated.View>
          <Text style={[styles.completeText, { marginTop: 8 }]}>Submission Successful!</Text>
          <Text style={{ textAlign: "center", color: "#6b72aa", paddingHorizontal: 30, marginBottom: 30, fontSize: 16, lineHeight: 22 }}>
            Your application has been pre-assessed and forwarded securely. Please wait for further announcements.
          </Text>
          <TouchableOpacity style={styles.submitBtn} onPress={() => navigation.navigate("HomeMain")}>
            <Text style={styles.submitBtnText}>Return Home</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (submitting) {
      return (
        <View style={styles.centered}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="sync-circle" size={110} color="#4f5fc5" />
          </Animated.View>
          <Text style={styles.completeText}>Evaluating Application...</Text>
          <Text style={{ textAlign: "center", color: "#848baf", paddingHorizontal: 40, fontSize: 15 }}>
            Please hold on while we securely process your documents.
          </Text>
        </View>
      );
    }

    if (program === "employeeChild") {
      switch (step) {
        case 0:
          return (
            <View>
              <Text style={styles.sectionHeader}>Academic Information</Text>
              {renderSelect("Scholarship Type", "scholarshipType", ["KKFI Employee-Child Education Grant", "KKFI Staff Grant"])}
              {renderSelect("Scholarship Fund Type", "fundType", ["Scrantron Funded", "KKFI Funded"])}
              {renderYesNo("Incoming Freshman", "incomingFreshman")}

              <Text style={styles.sectionHeader}>| Secondary Education</Text>
              {renderInput("School Name", "schoolName", "Enter School Name")}
              
              <View style={styles.rowTwoCol}>
                <View style={styles.colHalf}>
                  {renderSelect("Strand", "strand", ["STEM", "ABM", "HUMMS", "GAS", "Others"])}
                </View>
                <View style={styles.colHalf}>
                  {renderYearPicker("Year Graduated", "secondaryYearGraduated")}
                </View>
              </View>
              {values.strand === "Others" && renderInput("Specify Strand", "strand")}
              {renderUpload("Grade Report", "gradeReport")}

              <Text style={styles.sectionHeader}>| Current Tertiary Education</Text>
              {renderInput("University / College Name", "universityName", "Enter School Name")}
              {renderInput("Program", "program", "Enter Program")}
              {renderSelect("Term Type", "termType", ["Semester", "Trimester", "Quarter"])}
              {renderSelect("Grade Scale", "gradeScale", ["1.0 - Scale", "4.0 - Scale", "5.0 - Scale"])}

              <View style={styles.rowTwoCol}>
                <View style={styles.colHalf}>
                  {renderSelect("Year Level", "yearLevel", ["1st", "2nd", "3rd", "4th", "5th+"])}
                </View>
                <View style={styles.colHalf}>
                  {renderSelect("Term", "term", ["1st", "2nd", "3rd"])}
                </View>
              </View>

              {renderUpload("COR", "cor")}
              {renderUpload("Current Term Report Card", "currentTermGradeReport")}
            </View>
          );

        case 1:
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

        case 2:
          return (
            <View>
              <Text style={{ fontSize: 18, fontWeight: "600", color: "#5b6095", marginBottom: 16 }}>Review Information</Text>
              
              {renderReviewCard("| Scholarship Information", [
                { label: "Fund Type", value: values.fundType },
                { label: "Scholarship Type", value: values.scholarshipType },
                { label: "Incoming Freshman", value: values.incomingFreshman },
              ])}

              {renderReviewCard("| Secondary Education Information", [
                { label: "School Name", value: values.schoolName },
                { label: "Strand", value: values.strand },
                { label: "Year Graduated", value: values.secondaryYearGraduated },
              ])}

              {renderReviewCard("| Tertiary Education Information", [
                { label: "School Name", value: values.universityName },
                { label: "Program", value: values.program },
                { label: "Term Type", value: values.termType },
                { label: "Grade Scale", value: values.gradeScale },
                { label: "Year Level", value: values.yearLevel },
                { label: "Term", value: values.term },
              ])}

              {renderReviewCard("| Staff Information", [
                { label: "Staff ID", value: values.staffId },
                { label: "First Name", value: values.firstName },
                { label: "Middle Name", value: values.middleName },
                { label: "Last Name", value: values.lastName },
                { label: "Suffix", value: values.suffix },
                { label: "Position", value: values.position },
              ])}

              {renderReviewCard("| Supporting Documents", [
                { label: "Grade Report (Sec)", icon: "checkmark-circle-outline" },
                { label: "COR", icon: "checkmark-circle-outline" },
                { label: "Current Term Report Card", icon: "checkmark-circle-outline" },
              ])}
            </View>
          );

        default:
          return null;
      }
    }

    if (program === "vocational") {
      switch (step) {
        case 0:
          return (
            <View>
              <Text style={styles.sectionHeader}>Academic Information</Text>
              {renderSelect("Scholarship type", "scholarshipType", ["TESDA", "CHED", "Others"])}
              {renderSelect("Scholarship Fund type", "fundType", ["KKFI Funded", "Scrantron Funded"])}
              
              <Text style={styles.sectionHeader}>|Secondary Education</Text>
              {renderInput("School Name", "schoolName", "Enter School Name")}
              
              <View style={styles.rowTwoCol}>
                <View style={styles.colHalf}>
                  {renderSelect("Strand", "strand", ["STEM", "ABM", "HUMMS", "GAS", "Others"])}
                </View>
                <View style={styles.colHalf}>
                  {renderYearPicker("Year Graduated", "yearGraduated")}
                </View>
              </View>
              {values.strand === "Others" && renderInput("Specify Strand", "strand")}

              {renderUpload("Report Card", "gradeReport")}

              <Text style={styles.sectionHeader}>|Vocational/Technical Education</Text>
              {renderInput("School Name", "vocationalSchoolName", "Enter School Name")}
              {renderInput("Program", "vocationalProgram", "Enter School Name")}
              
              <View style={styles.rowTwoCol}>
                <View style={styles.colHalf}>
                  {renderSelect("Course Duration (months)", "courseDuration", ["3", "5", "6", "12"])}
                </View>
                <View style={styles.colHalf}>
                  {renderSelect("Completion Date", "completionDate", ["May 22, 2026", "Dec 15, 2026"])}
                </View>
              </View>

              {renderUpload("COR", "cor")}
            </View>
          );

        case 1:
          return (
            <View>
              <Text style={{ fontSize: 18, fontWeight: "600", color: "#5b6095", marginBottom: 16 }}>Family Information</Text>
              <Text style={styles.sectionHeader}>| Parents Information</Text>
              {renderInput("Father's Name", "fatherName", "Enter Father's Name")}
              {renderSelect("Employment Status", "fatherStatus", ["Employed", "Self-employed", "Business Owner", "Unemployed", "Student", "Retired", "OFW", "Others"])}
              {values.fatherStatus === "Others" && renderInput("Specify Employment Status", "fatherStatus", "Enter Status")}
              {renderInput("Occupation", "fatherOccupation", "Enter Occupation")}
              {renderInput("Monthly Income", "fatherIncome", "Enter Monthly Income")}
              
              {renderInput("Mother's Name", "motherName", "Enter Mother's Name")}
              {renderSelect("Employment Status", "motherStatus", ["Employed", "Self-employed", "Business Owner", "Unemployed", "Student", "Retired", "OFW", "Others"])}
              {values.motherStatus === "Others" && renderInput("Specify Employment Status", "motherStatus", "Enter Status")}
              {renderInput("Occupation", "motherOccupation", "Enter Occupation")}
              {renderInput("Monthly Income", "motherIncome", "Enter Monthly Income")}
              
              <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", marginTop: 20, marginBottom: 10 }} onPress={addFamilyMember}>
                <Ionicons name="add-circle-outline" size={24} color="#33428b" style={{ marginRight: 6 }} />
                <Text style={{ color: "#33428b", fontWeight: "700", fontSize: 16 }}>Add Family Member</Text>
              </TouchableOpacity>

              {familyMembers.map((member, idx) => (
                <View key={idx} style={{ marginTop: 10 }}>
                  <View style={styles.row}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                      style={styles.input}
                      value={member.name}
                      placeholder="Enter Guardian's Name"
                      onChangeText={(text) => updateFamilyMember(idx, "name", text)}
                    />
                  </View>
                  
                  {renderMemberSelect("Relationship to Applicant", "relationship", idx, ["Sibling", "Nephew", "Niece", "Grandparent", "Aunt", "Uncle", "Others"])}

                  <View style={styles.row}>
                    <Text style={styles.label}>Occupation</Text>
                    <TextInput
                      style={styles.input}
                      value={member.occupation}
                      placeholder="Enter Occupation"
                      onChangeText={(text) => updateFamilyMember(idx, "occupation", text)}
                    />
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.label}>Monthly Income</Text>
                    <TextInput
                      style={styles.input}
                      value={member.income}
                      placeholder="Enter Monthly Income"
                      onChangeText={(text) => updateFamilyMember(idx, "income", text)}
                    />
                  </View>
                </View>
              ))}
            </View>
          );

        case 2:
          return (
            <View>
              <Text style={{ fontSize: 18, fontWeight: "600", color: "#5b6095", marginBottom: 16 }}>Supporting Documents</Text>
              <Text style={styles.sectionHeader}>| Supporting Documents</Text>
              {renderUpload("Barangay Certificate (Applicant)", "barangayCert")}
              {renderUpload("Birth Certificate (Applicant)", "birthCert")}
              {renderUpload("Income Certificate (Father)", "incomeFather")}
              {renderUpload("Income Certificate (Mother)", "incomeMother")}
              {renderUpload("Income Certificate (Guardian)", "incomeGuardian")}
            </View>
          );

        case 3:
          return (
            <View>
              <Text style={{ fontSize: 18, fontWeight: "600", color: "#5b6095", marginBottom: 16 }}>Review Information</Text>
              
              {renderReviewCard("| Scholarship Information", [
                { label: "Scholarship type", value: values.scholarshipType },
                { label: "Scholarship Fund type", value: values.fundType },
              ])}

              {renderReviewCard("| Secondary Education Information", [
                { label: "School Name", value: values.schoolName },
                { label: "Strand", value: values.strand },
                { label: "Year Graduated", value: values.yearGraduated },
              ])}

              {renderReviewCard("| Vocational/Technical Education", [
                { label: "School Name", value: values.vocationalSchoolName },
                { label: "Program", value: values.vocationalProgram },
                { label: "Course Duration (in months)", value: values.courseDuration },
                { label: "Completion Date", value: values.completionDate },
              ])}

              {renderReviewCard("| Parents Information", [
                { label: "Father's Name", value: values.fatherName },
                { label: "Occupation", value: values.fatherOccupation },
                { label: "Monthly Income", value: values.fatherIncome },
                { label: "Mother's Name", value: values.motherName },
                { label: "Occupation", value: values.motherOccupation },
                { label: "Monthly Income", value: values.motherIncome },
              ])}

              {renderReviewCard("| Supporting Documents", [
                { label: "Barangay Certificate (Applicant)", icon: "checkmark-circle-outline" },
                { label: "Birth Certificate (Applicant)", icon: "checkmark-circle-outline" },
                { label: "Income Certificate (Father)", icon: "checkmark-circle-outline" },
                { label: "Income Certificate (Mother)", icon: "checkmark-circle-outline" },
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
            {renderSelect("Scholarship Type", "scholarshipType", ["Tertiary Scholarship Program", "CHED Scholarship", "DOST Scholarship", "Others"])}
            {renderSelect("Scholarship Fund Type", "fundType", ["KKFI Funded", "Scrantron Funded"])}
            {renderYesNo("Incoming Freshman", "incomingFreshman")}
            
            <Text style={styles.sectionHeader}>| Secondary Education</Text>
            {renderInput("School Name", "schoolName", "Enter School Name")}
            
            <View style={styles.rowTwoCol}>
              <View style={styles.colHalf}>
                {renderSelect("Strand", "strand", ["STEM", "ABM", "HUMMS", "GAS", "Others"])}
              </View>
              <View style={styles.colHalf}>
                {renderYearPicker("Year Graduated", "yearGraduated")}
              </View>
            </View>
            {values.strand === "Others" && renderInput("Specify Strand", "strand")}

            {renderUpload("Grade Report", "gradeReport")}
            <Text style={styles.sectionHeader}>| Current Tertiary Education</Text>
            {renderInput("University / College Name", "universityName", "Enter School Name")}
            {renderInput("Program", "program")}
            {renderSelect("Term Type", "termType", ["Semester", "Trimester", "Quarter"])}
            {renderSelect("Grade Scale", "gradeScale", ["1.0 - Scale", "4.0 - Scale", "5.0 - Scale"])}

            <View style={styles.rowTwoCol}>
              <View style={styles.colHalf}>
                {renderSelect("Year Level", "yearLevel", ["1st", "2nd", "3rd", "4th", "5th+"])}
              </View>
              <View style={styles.colHalf}>
                {renderSelect("Term", "term", ["1st", "2nd", "3rd"])}
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
            
            <Text style={styles.sectionHeader}>| Parents Information</Text>
            {renderInput("Father's Name", "fatherName", "Enter Father's Name")}
            {renderSelect("Employment Status", "fatherStatus", ["Employed — Full-time", "Employed — Part-time", "Self-employed", "Business Owner", "Unemployed", "Student", "Retired", "OFW", "Others"])}
            {values.fatherStatus === "Others" && renderInput("Specify Status", "fatherStatus")}
            {renderInput("Occupation", "fatherOccupation", "Enter Occupation")}
            {renderInput("Monthly Income", "fatherIncome", "Enter Monthly Income")}

            <View style={{ marginTop: 12 }}>
              {renderInput("Mother's Name", "motherName", "Enter Mother's Name")}
              {renderSelect("Employment Status", "motherStatus", ["Employed — Full-time", "Employed — Part-time", "Self-employed", "Business Owner", "Unemployed", "Student", "Retired", "OFW", "Others"])}
              {values.motherStatus === "Others" && renderInput("Specify Status", "motherStatus")}
              {renderInput("Occupation", "motherOccupation", "Enter Occupation")}
              {renderInput("Monthly Income", "motherIncome", "Enter Monthly Income")}
            </View>

            <View style={{ marginTop: 24 }}>
              <TouchableOpacity onPress={addFamilyMember} style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="add-circle-outline" size={20} color="#4c60d1" style={{ marginRight: 6 }} />
                <Text style={{ color: "#4c60d1", fontWeight: "700", fontSize: 15 }}>Add Family Member</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 16 }}>
              {familyMembers.map((member, idx) => (
                <View key={idx} style={styles.memberCard}>
                  <Text style={styles.memberTitle}>Family Member {idx + 1}</Text>
                  
                  <View style={styles.row}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                      style={styles.input}
                      value={member.name}
                      placeholder="Enter Member's Name"
                      onChangeText={(text) => updateFamilyMember(idx, "name", text)}
                    />
                  </View>

                  {renderMemberSelect("Relationship to Applicant", "relationship", idx, ["Sibling", "Grandparent", "Aunt/Uncle", "Guardian", "Cousin", "Others"])}
                  
                  <View style={styles.row}>
                    <Text style={styles.label}>Occupation</Text>
                    <TextInput
                      style={styles.input}
                      value={member.occupation}
                      placeholder="Enter Occupation"
                      onChangeText={(text) => updateFamilyMember(idx, "occupation", text)}
                    />
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.label}>Monthly Income</Text>
                    <TextInput
                      style={styles.input}
                      value={member.income}
                      placeholder="Enter Monthly Income"
                      onChangeText={(text) => updateFamilyMember(idx, "income", text)}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        );

      case 2:
        return (
          <View>
            <Text style={styles.sectionHeader}>| Supporting Documents</Text>
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
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#5b6095", marginBottom: 16 }}>Review Information</Text>
            
            {renderReviewCard("| Scholarship Information", [
              { label: "Scholarship type", value: values.scholarshipType },
              { label: "Scholarship Fund type", value: values.fundType },
              { label: "Incoming Freshman", value: values.incomingFreshman },
            ])}

            {renderReviewCard("| Secondary Education Information", [
              { label: "School Name", value: values.schoolName },
              { label: "Strand", value: values.strand },
              { label: "Year Graduated", value: values.yearGraduated },
            ])}

            {renderReviewCard("| Current Tertiary Education", [
              { label: "University / College Name", value: values.universityName },
              { label: "Program", value: values.program },
              { label: "Term Type", value: values.termType },
              { label: "Grade Scale", value: values.gradeScale },
              { label: "Year Level", value: values.yearLevel },
              { label: "Term", value: values.term },
            ])}

            {renderReviewCard("| Parents Information", [
              { label: "Father's Name", value: values.fatherName },
              { label: "Occupation", value: values.fatherOccupation },
              { label: "Monthly Income", value: values.fatherIncome },
              { label: "Mother's Name", value: values.motherName },
              { label: "Occupation", value: values.motherOccupation },
              { label: "Monthly Income", value: values.motherIncome },
            ])}

            {renderReviewCard("| Supporting Documents", [
              { label: "Certificate of Indigency Form", icon: "checkmark-circle-outline" },
              { label: "Birth Certificate (Applicant)", icon: "checkmark-circle-outline" },
              { label: "Income Certificate (Father)", icon: "checkmark-circle-outline" },
              { label: "Income Certificate (Mother)", icon: "checkmark-circle-outline" },
              { label: "Recommendation Letter Form", icon: "checkmark-circle-outline" },
              { label: "Essay", icon: "checkmark-circle-outline" },
            ])}
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

  const renderSelect = (label, key, options) => (
    <>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={styles.yearPickerInput}
          onPress={() => {
            setSelectKey(key);
            setSelectVisible(true);
          }}
        >
          <Text style={styles.yearPickerText}>{values[key] || "Select"}</Text>
          <Ionicons name="chevron-down" size={20} color="#5b6095" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={selectVisible && selectKey === key}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectVisible(false)}
      >
        <View style={styles.yearPickerModal}>
          <View style={styles.yearPickerContent}>
            <View style={styles.yearPickerHeader}>
              <Text style={styles.yearPickerTitle}>Select Option</Text>
              <TouchableOpacity onPress={() => setSelectVisible(false)}>
                <Ionicons name="close" size={24} color="#4f5fc5" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.yearPickerScroll} showsVerticalScrollIndicator={true}>
              <View style={{ flexDirection: "column", paddingBottom: 20 }}>
                {options.map((opt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.yearPickerOption,
                      { width: "100%", marginBottom: 8, paddingVertical: 14 },
                      values[key] === opt && styles.yearPickerOptionActive,
                    ]}
                    onPress={() => {
                      setValues({ ...values, [key]: opt });
                      setSelectVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.yearPickerOptionText,
                        values[key] === opt && styles.yearPickerOptionTextActive,
                      ]}
                    >
                      {opt}
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

  const renderMemberSelect = (label, fieldKey, idx, options) => {
    const modalKey = `member_${fieldKey}_${idx}`;
    return (
      <>
        <View style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          <TouchableOpacity
            style={styles.yearPickerInput}
            onPress={() => {
              setSelectKey(modalKey);
              setSelectVisible(true);
            }}
          >
            <Text style={styles.yearPickerText}>{familyMembers[idx]?.[fieldKey] || "Select"}</Text>
            <Ionicons name="chevron-down" size={20} color="#5b6095" />
          </TouchableOpacity>
        </View>

        <Modal
          visible={selectVisible && selectKey === modalKey}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectVisible(false)}
        >
          <View style={styles.yearPickerModal}>
            <View style={styles.yearPickerContent}>
              <View style={styles.yearPickerHeader}>
                <Text style={styles.yearPickerTitle}>Select Option</Text>
                <TouchableOpacity onPress={() => setSelectVisible(false)}>
                  <Ionicons name="close" size={24} color="#4f5fc5" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.yearPickerScroll} showsVerticalScrollIndicator={true}>
                <View style={{ flexDirection: "column", paddingBottom: 20 }}>
                  {options.map((opt, optIdx) => (
                    <TouchableOpacity
                      key={optIdx}
                      style={[
                        styles.yearPickerOption,
                        { width: "100%", marginBottom: 8, paddingVertical: 14 },
                        familyMembers[idx]?.[fieldKey] === opt && styles.yearPickerOptionActive,
                      ]}
                      onPress={() => {
                        updateFamilyMember(idx, fieldKey, opt);
                        setSelectVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.yearPickerOptionText,
                          familyMembers[idx]?.[fieldKey] === opt && styles.yearPickerOptionTextActive,
                        ]}
                      >
                        {opt}
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

  const renderYearPicker = (label, key) => {
    return (
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.yearPickerInput}>
          <TextInput
            style={{ flex: 1, color: "#2f427f", fontSize: 16, fontWeight: "600" }}
            value={values[key]}
            placeholder="YYYY"
            keyboardType="numeric"
            maxLength={4}
            onChangeText={(text) => setValues({ ...values, [key]: text })}
          />
          <Ionicons name="calendar-outline" size={20} color="#5b6095" />
        </View>
      </View>
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
      <View style={{ borderBottomWidth: 1, borderBottomColor: "#eef0ff", paddingBottom: 8, marginBottom: 10 }}>
        <Text style={styles.reviewCardTitle}>{title}</Text>
      </View>
      {fields.map((item, idx) => (
        <View key={idx} style={styles.reviewRowCardItem}>
          <Text style={styles.reviewLabel}>{item.label}</Text>
          {item.icon ? (
            <Ionicons name={item.icon} size={20} color="#2dd1a3" />
          ) : (
            <Text style={styles.reviewValueCard}>{item.value || "-"}</Text>
          )}
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
          {program === "employeeChild" 
            ? "KKFI Employee-Child Education Grant" 
            : program === "vocational" 
            ? "VOCATIONAL AND TECHNOLOGY SCHOLARSHIP" 
            : "Tertiary Scholarship Program"}
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
        <Animated.View style={{ opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          {renderStep()}
        </Animated.View>
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