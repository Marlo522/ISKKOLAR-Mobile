import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert, Modal, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function ScholarshipRenewalScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({
    scholarshipType: "Nationwide Scholarship Program",
    academicYear: "2025 - 2026",
    renewingFor: "2026 - 2027",
    yearLevel: "4th",
    schoolName: "PUP",
    program: "BSBA",
    currentYearLevel: "3rd",
    currentTerm: "2nd", // Corrected from Filipino as per likely intent
  });
  
  const [uploadText, setUploadText] = useState({ cor: "", currentTermReportCard: "" });
  const [submitting, setSubmitting] = useState(false);
  const [completeStage, setCompleteStage] = useState("none");
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

  const maxStep = 2;

  const advance = () => {
    if (step < maxStep) setStep((s) => s + 1);
    else submitApplication();
  };

  const submitApplication = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setCompleteStage("preAssessment");
    }, 1500);
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
          <Ionicons name="arrow-down" size={20} color="#000" />
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

  const renderReviewCard = (title, fields) => (
    <View style={styles.reviewCard}>
      <View style={{ borderBottomWidth: 1, borderBottomColor: "#eef0ff", paddingBottom: 8, marginBottom: 10 }}>
        <Text style={styles.reviewCardTitle}>{title}</Text>
      </View>
      {fields.map((item, idx) => (
        <View key={idx} style={styles.reviewRowCardItem}>
          <Text style={styles.reviewLabel}>{item.label}</Text>
          {item.icon ? (
            <Ionicons name={item.icon} size={22} color="#29d0a5" />
          ) : (
            <Text style={styles.reviewValueCard}>{item.value || "-"}</Text>
          )}
        </View>
      ))}
    </View>
  );

  const renderStep = () => {
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
          <TouchableOpacity style={styles.submitBtn} onPress={() => navigation.navigate("ScholarDashboardMain")}>
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

    switch (step) {
      case 0:
        return (
          <View>
            <View style={styles.topSectionHeaderContainer}>
              <Text style={styles.topSectionHeader}>Renewal Information</Text>
            </View>
            <View style={styles.formContainer}>
              <Text style={styles.sectionHeader}>|Academic Year 2026-2027</Text>
              {renderInput("Current Scholarship", "scholarshipType")}
              {renderInput("Current Academic Year", "academicYear")}
              
              <View style={styles.rowTwoCol}>
                <View style={styles.colHalf}>
                  {renderSelect("Renewing For", "renewingFor", ["2026 - 2027", "2027 - 2028"])}
                </View>
                <View style={styles.colHalf}>
                  {renderSelect("Year Level", "yearLevel", ["1st", "2nd", "3rd", "4th", "5th+"])}
                </View>
              </View>

              {renderUpload("COR (This Coming Academic Year)", "cor")}
            </View>
          </View>
        );
      case 1:
        return (
          <View>
            <View style={styles.topSectionHeaderContainer}>
              <Text style={styles.topSectionHeader}>Current School Information</Text>
            </View>
            <View style={styles.formContainer}>
              <Text style={styles.sectionHeader}>|Academic Year 2026-2027</Text>
              
              {renderInput("School Name", "schoolName")}
              {renderInput("Program", "program")}

              <View style={styles.rowTwoCol}>
                <View style={styles.colHalf}>
                  {renderSelect("Current Year Level", "currentYearLevel", ["1st", "2nd", "3rd", "4th", "5th+"])}
                </View>
                <View style={styles.colHalf}>
                  {renderSelect("Current Term", "currentTerm", ["1st", "2nd", "3rd", "Summer"])}
                </View>
              </View>

              {renderUpload("Current Report Card", "currentTermReportCard")}
            </View>
          </View>
        );
      case 2:
        return (
          <View>
            <View style={styles.topSectionHeaderContainer}>
              <Text style={styles.topSectionHeader}>Review Information</Text>
            </View>
            <View style={styles.formContainer}>
              {renderReviewCard("| Renewal Information", [
                { label: "Current Scholarship", value: values.scholarshipType },
                { label: "Current Academic", value: values.academicYear },
                { label: "Renewing For", value: values.renewingFor },
                { label: "Year Level (This Academic Year)", value: values.yearLevel },
              ])}

              {renderReviewCard("| Current School Information", [
                { label: "School Name", value: values.schoolName },
                { label: "Program", value: values.program },
                { label: "Current Year Level", value: values.currentYearLevel },
                { label: "Current Term", value: values.currentTerm },
              ])}

              {renderReviewCard("| Supporting Documents", [
                { label: "COR (This Academic Year)", icon: "checkmark-circle-outline" },
                { label: "Current Term Report Card", icon: "checkmark-circle-outline" },
              ])}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.progressHeader, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => (step > 0 ? setStep(step - 1) : navigation.goBack())} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#5b6095" />
        </TouchableOpacity>
        <Text style={styles.title}>Scholarship Renewal</Text>
        <View style={styles.empty} />
      </View>

      {completeStage === "none" && !submitting && (
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
      )}

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 60 }}>
        <Animated.View style={{ opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          {renderStep()}
        </Animated.View>
      </ScrollView>

      {!submitting && completeStage === "none" && (
        <View style={{ paddingHorizontal: 24, paddingBottom: 30 }}>
          <TouchableOpacity style={styles.nextBtn} onPress={advance}>
            <Text style={styles.nextBtnText}>{step < maxStep ? "Next Step →" : "Submit Application"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fbfbfe" },
  progressHeader: { flexDirection: "row", alignItems: "center", paddingBottom: 16, paddingHorizontal: 24 },
  backBtn: { width: 42, height: 42, borderRadius: 10, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#dbe2f6" },
  empty: { width: 42 },
  title: { flex: 1, textAlign: "center", fontSize: 22, fontWeight: "900", color: "#4f5fc5" },
  progressBarRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 24, marginTop: 4, marginBottom: 12 },
  progressStep: { height: 5, flex: 1, marginHorizontal: 6, borderRadius: 5 },
  progressStepActive: { backgroundColor: "#29d0a5" },
  progressStepInactive: { backgroundColor: "#dde2ee" },
  topSectionHeaderContainer: { borderBottomWidth: 1, borderColor: "#ccd1ed", paddingHorizontal: 24, paddingBottom: 16, marginBottom: 20 },
  topSectionHeader: { fontSize: 18, fontWeight: "600", color: "#5b6095" },
  formContainer: { paddingHorizontal: 24 },
  content: { flex: 1 },
  sectionHeader: { fontSize: 19, fontWeight: "900", color: "#4f5fc5", marginBottom: 16 },
  row: { marginBottom: 16 },
  label: { fontWeight: "600", color: "#1c2131", fontSize: 13, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#a9b1c0", borderRadius: 12, paddingHorizontal: 16, paddingVertical: Platform.OS === "ios" ? 14 : 12, backgroundColor: "#ffffff", color: "#555", fontSize: 15 },
  uploadBtn: { borderWidth: 1, borderColor: "#a9b1c0", borderRadius: 12, height: 50, justifyContent: "center", paddingHorizontal: 16, backgroundColor: "#ffffff" },
  uploadText: { color: "#777", fontSize: 15, alignSelf: "center" },
  reviewRow: { padding: 10, borderColor: "#dbe2f6", borderWidth: 1, borderRadius: 10, marginBottom: 8, backgroundColor: "#fff" },
  reviewLabel: { color: "#848baf", fontSize: 13, fontWeight: "600" },
  reviewValue: { color: "#2d3a7c", fontSize: 14, marginTop: 2 },
  reviewCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#dbe2f6", borderRadius: 10, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  reviewCardTitle: { fontSize: 17, fontWeight: "900", color: "#4f5fc5", marginBottom: 4 },
  reviewRowCardItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8, alignItems: "center" },
  reviewValueCard: { fontSize: 12, color: "#1c2131", fontWeight: "700" },
  rowTwoCol: { flexDirection: "row", gap: 12, marginBottom: 0 }, // no bottom margin since elements inside have row margin
  colHalf: { flex: 1 },
  yearPickerInput: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#a9b1c0", borderRadius: 12, paddingHorizontal: 16, paddingVertical: Platform.OS === "ios" ? 14 : 12, backgroundColor: "#ffffff", height: 50 },
  yearPickerText: { color: "#555", fontSize: 15, fontWeight: "500" },
  yearPickerModal: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  yearPickerContent: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80%", paddingTop: 16 },
  yearPickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#e4e8f8" },
  yearPickerTitle: { fontSize: 18, fontWeight: "800", color: "#3d4fa0" },
  yearPickerScroll: { paddingHorizontal: 16, paddingVertical: 12 },
  yearPickerOption: { width: "100%", paddingVertical: 12, marginBottom: 8, borderRadius: 10, borderWidth: 1, borderColor: "#d7def8", backgroundColor: "#f8f9ff", alignItems: "center" },
  yearPickerOptionActive: { backgroundColor: "#4f5fc5", borderColor: "#4f5fc5" },
  yearPickerOptionText: { fontSize: 16, fontWeight: "700", color: "#4f5fc5" },
  yearPickerOptionTextActive: { color: "#fff" },
  nextBtn: { backgroundColor: "#5b61a7", borderRadius: 14, paddingVertical: 16, alignItems: "center", shadowColor: "#2d3a7c", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 4 },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  centered: { alignItems: "center", justifyContent: "center", marginTop: 120 },
  completeText: { fontSize: 22, fontWeight: "800", color: "#3f4ca8", marginTop: 16, marginBottom: 8 },
  submitBtn: { borderRadius: 12, backgroundColor: "#4f5fc5", paddingVertical: 14, paddingHorizontal: 30, marginTop: 10 },
  submitBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
