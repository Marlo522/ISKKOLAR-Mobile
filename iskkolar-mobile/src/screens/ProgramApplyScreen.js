import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert, Modal, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const infoFields = {
  educPath: "Tertiary",
  scholarshipType: "",
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
  const [declarations, setDeclarations] = useState({ agree1: false, agree2: false, agree3: false });

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
    // Submit is handled separately on declaration step
  };

  const addFamilyMember = () => {
    setFamilyMembers((prev) => [...prev, { name: "", relationship: "", contactNo: "", status: "Employed", occupation: "", income: "" }]);
  };

  const removeFamilyMember = (index) => {
    setFamilyMembers((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateFamilyMember = (index, field, value) => {
    setFamilyMembers((prev) => prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)));
  };

  const submitApplication = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setCompleteStage("qualificationReport");
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

    if (completeStage === "qualificationReport") {
      const qualRules = [
        { rule: "Max Parent Income", status: "failed", feedback: "Income mismatch: Submitted income values do not match the uploaded document (Father income - Input: ₱2000, Extracted: ₱2025; Mother income - Input: ₱2000, Extracted: ₱2025)." },
        { rule: "Min Grade Average", status: "passed", feedback: "Rule satisfied." },
        { rule: "Filipino Citizen Only", status: "passed", feedback: "Rule satisfied." },
        { rule: "Valid Indigency Document", status: "failed", feedback: "Certificate of indigency must be submitted and include the applicant name." },
      ];
      return (
        <View style={{ paddingBottom: 30 }}>
          <View style={{ backgroundColor: "#eafff5", borderRadius: 10, padding: 13, marginBottom: 16, borderWidth: 1, borderColor: "#b2ecd6" }}>
            <Text style={{ color: "#1a9e6a", fontWeight: "700", fontSize: 13 }}>Application evaluated. Please review your qualification result.</Text>
          </View>

          <View style={styles.reviewCard}>
            <Text style={{ fontSize: 17, fontWeight: "900", color: "#3d4fa0", marginBottom: 6 }}>AI Qualification Report</Text>
            <Text style={{ fontSize: 13, color: "#6b72aa", marginBottom: 14 }}>Some qualification rules did not pass. Please review the feedback for each rule below.</Text>

            <View style={{ borderWidth: 1, borderColor: "#dbe2f6", borderRadius: 10, overflow: "hidden" }}>
              <View style={{ flexDirection: "row", backgroundColor: "#f4f5ff", paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#dbe2f6" }}>
                <Text style={{ flex: 1, fontWeight: "700", color: "#5b6095", fontSize: 13 }}>Rule</Text>
                <Text style={{ width: 70, fontWeight: "700", color: "#5b6095", fontSize: 13 }}>Status</Text>
                <Text style={{ flex: 2, fontWeight: "700", color: "#5b6095", fontSize: 13 }}>Feedback</Text>
              </View>
              {qualRules.map((item, idx) => (
                <View key={idx} style={{ flexDirection: "row", paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: idx < qualRules.length - 1 ? 1 : 0, borderBottomColor: "#eef0ff", alignItems: "flex-start" }}>
                  <Text style={{ flex: 1, fontWeight: "700", color: "#2d3a7c", fontSize: 13, lineHeight: 18 }}>{item.rule}</Text>
                  <View style={{ width: 70, alignItems: "flex-start" }}>
                    <View style={{ backgroundColor: item.status === "passed" ? "#e6fff5" : "#fff0f0", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ color: item.status === "passed" ? "#1a9e6a" : "#e03a3a", fontSize: 12, fontWeight: "700" }}>{item.status}</Text>
                    </View>
                  </View>
                  <Text style={{ flex: 2, color: item.status === "passed" ? "#5b6095" : "#3d4fa0", fontSize: 13, lineHeight: 18 }}>{item.feedback}</Text>
                </View>
              ))}
            </View>

            <View style={{ marginTop: 14, padding: 12, backgroundColor: "#fafbff", borderRadius: 10, borderWidth: 1, borderColor: "#dbe2f6" }}>
              <Text style={{ color: "#5b6095", fontSize: 14 }}>Status: <Text style={{ color: "#e8a030", fontWeight: "900" }}>For Review of Staff</Text></Text>
            </View>
          </View>

          <TouchableOpacity
            style={{ margin: 4, backgroundColor: "#29d0a5", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 10 }}
            onPress={() => navigation.navigate("Application")}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>View My Applications</Text>
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

              {renderSelect("Education Path", "educPath", ["Tertiary", "Masters"])}
              {renderYesNo("Incoming Freshman?", "incomingFreshman")}

              <Text style={styles.sectionHeader}>| Secondary Education</Text>
              {renderInput("School Name", "schoolName", "Enter School Name")}
              <View style={styles.rowTwoCol}>
                <View style={styles.colHalf}>
                  {renderSelect("Strand", "strand", ["STEM", "ABM", "HUMMS", "GAS", "TVL"])}
                </View>
                <View style={styles.colHalf}>
                  {renderYearPicker("Year Graduated", "secondaryYearGraduated")}
                </View>
              </View>
              {renderUpload("Grade Report", "gradeReport")}

              {values.educPath === "Masters" && (
                <>
                  <Text style={styles.sectionHeader}>| Previous Tertiary Education</Text>
                  {renderInput("Previous School Name", "prevSchoolName", "Enter Previous School Name")}
                  {renderInput("Previous Program", "prevProgram", "Enter Previous Program")}
                  {renderYearPicker("Previous Year Graduated", "prevYearGraduated")}
                </>
              )}

              <Text style={styles.sectionHeader}>| Current Tertiary Education</Text>
              {renderInput("University / College Name", "universityName", "Enter School Name")}
              {renderInput("Program", "program", "Enter Program")}
              {renderSelect("Term Type", "termType", ["Semester", "Trimester", "Quarter"])}
              {renderSelect("Grade Scale", "gradeScale", ["1.0 - 5.00 Grading System", "4.00 GPA System", "Percentage System", "Letter Grade System"])}

              <View style={styles.rowTwoCol}>
                <View style={styles.colHalf}>
                  {renderSelect("Year Level", "yearLevel", ["1st", "2nd", "3rd", "4th", "5th"])}
                </View>
                <View style={styles.colHalf}>
                  {renderSelect("Term", "term", values.termType === "Quarter" ? ["1st", "2nd", "3rd", "4th"] : values.termType === "Trimester" ? ["1st", "2nd", "3rd"] : ["1st", "2nd"])}
                </View>
              </View>

              {renderYearPicker("Expected Year of Graduation", "expectedGradYear")}
              {values.expectedGradYear && values.expectedGradYear.length === 4 && parseInt(values.expectedGradYear) < 2026 && (
                <Text style={{ color: "#e03a3a", fontSize: 12, marginTop: -6, marginBottom: 8 }}>Expected graduation year must be 2026 or later</Text>
              )}
              {renderUpload("COR", "cor")}
              {values.incomingFreshman === "No" && renderUpload("Current Term Report Card", "currentTermGradeReport")}
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
                { label: "Expected Year of Grad", value: values.expectedGradYear },
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
                  {renderSelect("Strand", "strand", ["STEM", "ABM", "HUMMS", "GAS", "TVL"])}
                </View>
                <View style={styles.colHalf}>
                  {renderYearPicker("Year Graduated", "yearGraduated")}
                </View>
              </View>

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
              {renderSelect("Employment Status", "fatherStatus", ["Employed", "Unemployed", "Self-Employed", "Deceased"])}
              {["Employed", "Self-Employed"].includes(values.fatherStatus) && (
                <>
                  {renderInput("Occupation", "fatherOccupation", "Enter Occupation")}
                  {renderNumericInput("Monthly Income", "fatherIncome", "Enter Monthly Income")}
                </>
              )}
              
              {renderInput("Mother's Name", "motherName", "Enter Mother's Name")}
              {renderSelect("Employment Status", "motherStatus", ["Employed", "Unemployed", "Self-Employed", "Deceased"])}
              {["Employed", "Self-Employed"].includes(values.motherStatus) && (
                <>
                  {renderInput("Occupation", "motherOccupation", "Enter Occupation")}
                  {renderNumericInput("Monthly Income", "motherIncome", "Enter Monthly Income")}
                </>
              )}
              
              <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", marginTop: 20, marginBottom: 10 }} onPress={addFamilyMember}>
                <Ionicons name="add-circle-outline" size={24} color="#33428b" style={{ marginRight: 6 }} />
                <Text style={{ color: "#33428b", fontWeight: "700", fontSize: 16 }}>Add Family Member</Text>
              </TouchableOpacity>

              {familyMembers.map((member, idx) => (
                <View key={idx} style={styles.memberCard}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <Text style={styles.memberTitle}>Family Member {idx + 1}</Text>
                    <TouchableOpacity onPress={() => removeFamilyMember(idx)}>
                      <Text style={{ color: "#d9534f", fontWeight: "700" }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.row}>
                    <Text style={styles.label}>Family Member Name</Text>
                    <TextInput
                      style={styles.input}
                      value={member.name}
                      placeholder="Enter Name"
                      onChangeText={(text) => updateFamilyMember(idx, "name", text)}
                    />
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.label}>Relationship</Text>
                    <TextInput
                      style={styles.input}
                      value={member.relationship}
                      placeholder="e.g. Brother, Sister, Guardian"
                      onChangeText={(text) => updateFamilyMember(idx, "relationship", text)}
                    />
                  </View>

                  {member.status !== "Deceased" && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Contact No.</Text>
                      <TextInput
                        style={styles.input}
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
                    </View>
                  )}

                  {renderMemberSelect("Employment Status", "status", idx, ["Employed", "Unemployed", "Self-Employed", "Deceased"])}
                  
                  {["Employed", "Self-Employed"].includes(member.status || "Employed") && (
                    <>
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
                          keyboardType="numeric"
                          onChangeText={(text) => updateFamilyMember(idx, "income", text.replace(/[^0-9]/g, ""))}
                        />
                      </View>
                    </>
                  )}
                </View>
              ))}
            </View>
          );

        case 2:
          return (
            <View>
              <Text style={{ fontSize: 18, fontWeight: "600", color: "#5b6095", marginBottom: 16 }}>Supporting Documents</Text>
              <Text style={styles.sectionHeader}>| Supporting Documents</Text>
              <View style={{ backgroundColor: "#eaf2fe", padding: 13, borderRadius: 8, marginBottom: 18 }}>
                <Text style={{ color: "#305fce", fontSize: 13 }}>Upload clear and readable files only. Accepted formats: PDF, DOC, DOCX. Max file size: 10MB each.</Text>
              </View>
              {renderUpload("Barangay Certificate (Applicant)", "barangayCert")}
              {renderUpload("Birth Certificate (Applicant)", "birthCert")}
              {["Employed", "Self-Employed"].includes(values.fatherStatus) ? (
                renderUpload("Income Certificate (Father)", "incomeFather")
              ) : (
                <Text style={{ fontSize: 13, color: "#6b72aa", marginBottom: 18 }}>Income certificate not required for Father ({values.fatherStatus}).</Text>
              )}
              {["Employed", "Self-Employed"].includes(values.motherStatus) ? (
                renderUpload("Income Certificate (Mother)", "incomeMother")
              ) : (
                <Text style={{ fontSize: 13, color: "#6b72aa", marginBottom: 18 }}>Income certificate not required for Mother ({values.motherStatus}).</Text>
              )}
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
            {renderSelect("Scholarship Type", "scholarshipType", ["Manila Scholars", "Bulacan Scholars", "Nationwide Scholars"])}
            {renderYesNo("Incoming Freshman", "incomingFreshman")}
            
            <Text style={styles.sectionHeader}>| Secondary Education</Text>
            {renderInput("School Name", "schoolName", "Enter School Name")}
            
            <View style={styles.rowTwoCol}>
              <View style={styles.colHalf}>
                {renderSelect("Strand", "strand", ["STEM", "ABM", "HUMMS", "GAS", "TVL"])}
              </View>
              <View style={styles.colHalf}>
                {renderYearPicker("Year Graduated", "yearGraduated")}
              </View>
            </View>

            {renderUpload("Grade Report", "gradeReport")}
            <Text style={styles.sectionHeader}>| Current Tertiary Education</Text>
            {renderInput("University / College Name", "universityName", "Enter School Name")}
            {renderInput("Program", "program")}
            {renderSelect("Term Type", "termType", ["Semester", "Trimester", "Quarter"])}
            {renderSelect("Grade Scale", "gradeScale", ["1.0 - 5.00 Grading System", "4.00 GPA System", "Percentage System", "Letter Grade System"])}

            <View style={styles.rowTwoCol}>
              <View style={styles.colHalf}>
                {renderSelect("Year Level", "yearLevel", ["1st", "2nd", "3rd", "4th", "5th"])}
              </View>
              <View style={styles.colHalf}>
                {renderSelect("Term", "term", values.termType === "Quarter" ? ["1st", "2nd", "3rd", "4th"] : values.termType === "Trimester" ? ["1st", "2nd", "3rd"] : ["1st", "2nd"])}
              </View>
            </View>

            {renderYearPicker("Expected Year of Graduation", "expectedGradYear")}
            {values.expectedGradYear && values.expectedGradYear.length === 4 && parseInt(values.expectedGradYear) < 2026 && (
              <Text style={{ color: "#e03a3a", fontSize: 12, marginTop: -6, marginBottom: 8 }}>Expected graduation year must be 2026 or later</Text>
            )}

            {renderUpload("COR", "cor")}
            {values.incomingFreshman === "No" && renderUpload("Current Term Grade Report", "currentTermGradeReport")}
          </View>
        );

      case 1:
        return (
          <View>
            <Text style={styles.sectionHeader}>Family Information</Text>
            
            <Text style={styles.sectionHeader}>| Father's Information</Text>
            {renderInput("Father's Name", "fatherName", "Enter Father's Name")}
            {renderSelect("Employment Status", "fatherStatus", ["Employed", "Unemployed", "Self-Employed", "Deceased"])}
            {values.fatherStatus !== "Deceased" && renderContactInput("Contact Number", "fatherContact")}
            {["Employed", "Self-Employed"].includes(values.fatherStatus) && (
              <>
                {renderInput("Occupation", "fatherOccupation", "Enter Occupation")}
                {renderNumericInput("Monthly Income", "fatherIncome", "Enter Monthly Income")}
              </>
            )}

            <View style={{ marginTop: 12 }}>
              <Text style={styles.sectionHeader}>| Mother's Information</Text>
              {renderInput("Mother's Name", "motherName", "Enter Mother's Name")}
              {renderSelect("Employment Status", "motherStatus", ["Employed", "Unemployed", "Self-Employed", "Deceased"])}
              {values.motherStatus !== "Deceased" && renderContactInput("Contact Number", "motherContact")}
              {["Employed", "Self-Employed"].includes(values.motherStatus) && (
                <>
                  {renderInput("Occupation", "motherOccupation", "Enter Occupation")}
                  {renderNumericInput("Monthly Income", "motherIncome", "Enter Monthly Income")}
                </>
              )}
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
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <Text style={styles.memberTitle}>Family Member {idx + 1}</Text>
                    <TouchableOpacity onPress={() => removeFamilyMember(idx)}>
                      <Text style={{ color: "#d9534f", fontWeight: "700" }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.row}>
                    <Text style={styles.label}>Family Member Name</Text>
                    <TextInput
                      style={styles.input}
                      value={member.name}
                      placeholder="Enter Name"
                      onChangeText={(text) => updateFamilyMember(idx, "name", text)}
                    />
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.label}>Relationship</Text>
                    <TextInput
                      style={styles.input}
                      value={member.relationship}
                      placeholder="e.g. Brother, Sister, Guardian"
                      onChangeText={(text) => updateFamilyMember(idx, "relationship", text)}
                    />
                  </View>

                  {member.status !== "Deceased" && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Contact No.</Text>
                      <TextInput
                        style={styles.input}
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
                    </View>
                  )}

                  {renderMemberSelect("Employment Status", "status", idx, ["Employed", "Unemployed", "Self-Employed", "Deceased"])}
                  
                  {["Employed", "Self-Employed"].includes(member.status || "Employed") && (
                    <>
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
                          keyboardType="numeric"
                          onChangeText={(text) => updateFamilyMember(idx, "income", text.replace(/[^0-9]/g, ""))}
                        />
                      </View>
                    </>
                  )}
                </View>
              ))}
            </View>
          </View>
        );

      case 2:
        return (
          <View>
            <Text style={styles.sectionHeader}>| Supporting Documents</Text>
            <View style={{ backgroundColor: "#eaf2fe", padding: 13, borderRadius: 8, marginBottom: 18 }}>
              <Text style={{ color: "#305fce", fontSize: 13 }}>Upload clear and readable files only. Accepted formats: PDF, DOC, DOCX. Max file size: 10MB each.</Text>
            </View>
            {renderUpload("Certificate of Indigency Form (Applicant)", "indigency")}
            {renderUpload("Birth Certificate (Applicant)", "birthCert")}
            {["Employed", "Self-Employed"].includes(values.fatherStatus) ? (
              renderUpload("Income Certificate (Father)", "incomeFather")
            ) : (
              <Text style={{ fontSize: 13, color: "#6b72aa", marginBottom: 18 }}>Income certificate not required for Father ({values.fatherStatus}).</Text>
            )}
            {["Employed", "Self-Employed"].includes(values.motherStatus) ? (
              renderUpload("Income Certificate (Mother)", "incomeMother")
            ) : (
              <Text style={{ fontSize: 13, color: "#6b72aa", marginBottom: 18 }}>Income certificate not required for Mother ({values.motherStatus}).</Text>
            )}
            {renderUpload("Recommendation Letter Form (Optional)", "recommendation")}
            {renderUpload("Essay", "essay")}
          </View>
        );

      case 3:
        return (
          <View>
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
              { label: "Expected Year of Graduation", value: values.expectedGradYear },
            ])}

            {renderReviewCard("| Parents Information", [
              { label: "Father's Name", value: values.fatherName },
              { label: "Employment Status", value: values.fatherStatus },
              ...(values.fatherStatus !== "Deceased" ? [{ label: "Contact No.", value: values.fatherContact }] : []),
              ...["Employed", "Self-Employed"].includes(values.fatherStatus) ? [
                { label: "Occupation", value: values.fatherOccupation },
                { label: "Monthly Income", value: values.fatherIncome },
              ] : [],
              { label: "Mother's Name", value: values.motherName },
              { label: "Employment Status", value: values.motherStatus },
              ...(values.motherStatus !== "Deceased" ? [{ label: "Contact No.", value: values.motherContact }] : []),
              ...["Employed", "Self-Employed"].includes(values.motherStatus) ? [
                { label: "Occupation", value: values.motherOccupation },
                { label: "Monthly Income", value: values.motherIncome },
              ] : [],
            ])}

            {renderReviewCard("| Supporting Documents", [
              { label: "Certificate of Indigency (Applicant)", icon: uploadText.indigency ? "checkmark-circle-outline" : null, dash: !uploadText.indigency },
              { label: "Birth Certificate (Applicant)", icon: uploadText.birthCert ? "checkmark-circle-outline" : null, dash: !uploadText.birthCert },
              ...["Employed", "Self-Employed"].includes(values.fatherStatus) ? [{ label: "Income Certificate (Father)", icon: uploadText.incomeFather ? "checkmark-circle-outline" : null, dash: !uploadText.incomeFather }] : [],
              ...["Employed", "Self-Employed"].includes(values.motherStatus) ? [{ label: "Income Certificate (Mother)", icon: uploadText.incomeMother ? "checkmark-circle-outline" : null, dash: !uploadText.incomeMother }] : [],
              { label: "Recommendation Letter (Optional)", icon: uploadText.recommendation ? "checkmark-circle-outline" : null, dash: !uploadText.recommendation },
              { label: "Essay", icon: uploadText.essay ? "checkmark-circle-outline" : null, dash: !uploadText.essay },
            ])}

            <View style={styles.reviewCard}>
              <View style={{ borderBottomWidth: 1, borderBottomColor: "#eef0ff", paddingBottom: 8, marginBottom: 14 }}>
                <Text style={styles.reviewCardTitle}>| Declaration and Agreement</Text>
              </View>

              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 14 }}
                onPress={() => setDeclarations((d) => ({ ...d, agree1: !d.agree1 }))}
              >
                <View style={[styles.checkbox, declarations.agree1 && styles.checkboxChecked]}>
                  {declarations.agree1 && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.declarationText}>
                  I certify that all information provided in this application is true and correct to the best of my knowledge.{" "}
                  <Text style={styles.declarationHighlight}>I understand that any false or misleading information may result in the denial or revocation of any scholarship granted.</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 14 }}
                onPress={() => setDeclarations((d) => ({ ...d, agree2: !d.agree2 }))}
              >
                <View style={[styles.checkbox, declarations.agree2 && styles.checkboxChecked]}>
                  {declarations.agree2 && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.declarationText}>
                  I agree to provide any additional documentation requested by{" "}
                  <Text style={styles.declarationHighlight}>KKFI</Text> and to comply with all scholarship terms and conditions.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "flex-start" }}
                onPress={() => setDeclarations((d) => ({ ...d, agree3: !d.agree3 }))}
              >
                <View style={[styles.checkbox, declarations.agree3 && styles.checkboxChecked]}>
                  {declarations.agree3 && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.declarationText}>
                  I have read and agree to the{" "}
                  <Text style={styles.declarationHighlight}>Data Privacy Notice</Text>. I consent to the collection, processing, and storage of my personal data for scholarship evaluation and related program administration.
                </Text>
              </TouchableOpacity>
            </View>
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

  const renderContactInput = (label, key, placeholder = "09XXXXXXXXX") => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={values[key]}
        placeholder={placeholder}
        keyboardType="numeric"
        maxLength={11}
        onChangeText={(text) => {
          let cleaned = text.replace(/[^0-9]/g, "");
          if (cleaned.length >= 1 && cleaned[0] !== "0") cleaned = "0";
          if (cleaned.length >= 2 && cleaned.substring(0, 2) !== "09") cleaned = "09";
          setValues({ ...values, [key]: cleaned });
        }}
      />
    </View>
  );

  const renderNumericInput = (label, key, placeholder = null) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={values[key]}
        placeholder={placeholder || `Enter ${label}`}
        keyboardType="numeric"
        onChangeText={(text) => {
          let cleaned = text.replace(/[^0-9]/g, "");
          setValues({ ...values, [key]: cleaned });
        }}
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
        <TextInput
          style={styles.input}
          value={values[key]}
          placeholder="YYYY"
          keyboardType="numeric"
          maxLength={4}
          onChangeText={(text) => setValues({ ...values, [key]: text.replace(/[^0-9]/g, "") })}
        />
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
          ) : item.dash ? (
            <Text style={{ color: "#aab0cc", fontSize: 16 }}>—</Text>
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
        {[...Array(maxStep + 2)].map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.progressStep,
              (completeStage === "qualificationReport" || idx <= step) ? styles.progressStepActive : styles.progressStepInactive,
            ]}
          />
        ))}
      </View>
      <Text style={{ color: "#95a0c5", fontSize: 12, paddingHorizontal: 14, marginBottom: 6 }}>
        {completeStage === "qualificationReport" ? "Qualification Report" : step === maxStep ? "Review Information" : step === 2 ? "Supporting Documents" : step === 1 ? "Family Information" : "Academic Information"}
      </Text>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
        <Animated.View style={{ opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          {renderStep()}
        </Animated.View>
      </ScrollView>

      {!submitting && completeStage === "none" && step < maxStep && (
        <TouchableOpacity style={styles.nextBtn} onPress={advance}>
          <Text style={styles.nextBtnText}>Next Step →</Text>
        </TouchableOpacity>
      )}
      {!submitting && completeStage === "none" && step === maxStep && (
        <TouchableOpacity
          style={[styles.nextBtn, !(declarations.agree1 && declarations.agree2 && declarations.agree3) && { backgroundColor: "#bcc1e8" }]}
          onPress={() => {
            if (declarations.agree1 && declarations.agree2 && declarations.agree3) submitApplication();
          }}
          disabled={!(declarations.agree1 && declarations.agree2 && declarations.agree3)}
        >
          <Text style={styles.nextBtnText}>Submit Application</Text>
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
  input: { borderWidth: 1, borderColor: "#d7def8", borderRadius: 10, paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 12 : 10, backgroundColor: "#ffffff", color: "#2f427f", fontSize: 16, fontWeight: "600" },
  addItemBtn: { marginTop: 10, backgroundColor: "#eef0ff", paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "#c7cffe", alignItems: "center" },
  addItemBtnText: { color: "#4f5fc5", fontWeight: "700" },
  memberCard: { backgroundColor: "#f8f8ff", borderRadius: 10, padding: 10, marginTop: 10, borderWidth: 1, borderColor: "#d7def8" },
  memberTitle: { fontWeight: "700", color: "#33428b", marginBottom: 6 },
  uploadBtn: { borderWidth: 1, borderColor: "#d7def8", borderRadius: 10, justifyContent: "center", paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 12 : 10, backgroundColor: "#f7f9ff" },
  uploadText: { color: "#848baf", fontSize: 16, fontWeight: "600" },
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
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "#4f5fc5", alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 1, backgroundColor: "#fff", flexShrink: 0 },
  checkboxChecked: { backgroundColor: "#4f5fc5", borderColor: "#4f5fc5" },
  declarationText: { flex: 1, color: "#5b6095", fontSize: 13, lineHeight: 20 },
  declarationHighlight: { color: "#3d4fa0", fontWeight: "700" },
});