import React, { useState, useEffect, useRef, useContext } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert, Modal, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import * as DocumentPicker from "expo-document-picker";

export default function ScholarshipRenewalScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({
    academicYear: "2026-2027",
    term: "2nd Semester",
    school: user?.school || "FEU Tech",
    program: user?.course || "BSIT",
    gwa: "",
    additionalNotes: "",
  });

  const [confirmed, setConfirmed] = useState(false);

  const academicCalendar = (user?.academicCalendar || "").toLowerCase();
  let termOptions = ["1st Semester", "2nd Semester", "Summer"];

  if (academicCalendar.includes("tri")) {
    termOptions = ["1st Trimester", "2nd Trimester", "3rd Trimester", "Summer"];
  } else if (academicCalendar.includes("quad")) {
    termOptions = ["1st Term", "2nd Term", "3rd Term", "4th Term", "Summer"];
  }


  const [uploadText, setUploadText] = useState({ cor: "", gradeReport: "", receipts: "" });
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

  const isPreFilled = !!user; // Logic for "already passed a form"

  const renderReadOnly = (label, value) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.input, { backgroundColor: '#f4f5f8', borderColor: '#eaecf0', justifyContent: 'center' }]}>
        <Text style={{ color: '#8a94b5', fontSize: 13 }}>{value}</Text>
      </View>
    </View>
  );

  const renderGwaField = () => {
    const hasGwa = !!user?.gwa;
    const val = hasGwa ? user.gwa : "Auto-filled from grade compliance";
    return (
      <View style={[styles.row, { marginBottom: 8 }]}>
        <Text style={styles.label}>Current GWA</Text>
        <View style={[styles.input, { backgroundColor: '#f4f5f8', borderColor: '#eaecf0', justifyContent: 'center' }]}>
          <Text style={{ color: '#8a94b5', fontSize: 13 }}>{val}</Text>
        </View>
        {!hasGwa && (
          <Text style={{ color: '#dc2626', fontSize: 11, marginTop: 6, fontWeight: '500' }}>
            Auto-filled from grade compliance. Submit grade compliance to proceed.
          </Text>
        )}
      </View>
    );
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
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setSelectVisible(false)}
      >
        <View style={styles.yearPickerModal}>
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setSelectVisible(false)} />
          <View style={[styles.yearPickerContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.yearPickerHeader}>
              <Text style={styles.yearPickerTitle}>Select Option</Text>
              <TouchableOpacity onPress={() => setSelectVisible(false)}>
                <Ionicons name="close" size={24} color="#4f5fc5" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.yearPickerScroll} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {options.map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.yearPickerOption,
                    { width: "100%", marginBottom: 8, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center' },
                    values[key] === opt && styles.yearPickerOptionActive,
                  ]}
                  onPress={() => {
                    setValues({ ...values, [key]: opt });
                    setSelectVisible(false);
                  }}
                >
                  <Text style={[styles.yearPickerOptionText, values[key] === opt && { color: "#fff" }]}>
                    {opt}
                  </Text>
                  {values[key] === opt && (
                    <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ position: 'absolute', right: 16 }} />
                  )}
                </TouchableOpacity>
              ))}
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
        onPress={() => handleFileUpload(key)}
      >
        <Text style={styles.uploadText}>{uploadText[key] || "File Upload"}</Text>
      </TouchableOpacity>
    </View>
  );

  const handleFileUpload = async (key) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      if (result.assets && result.assets.length > 0) {
        setUploadText(prev => ({ ...prev, [key]: result.assets[0].name }));
      }
    } catch (error) {
      console.log("Error picking file:", error);
      Alert.alert("Error", "Failed to select document.");
    }
  };

  const renderFileUploadBox = (label, subtext, key) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.uploadBoxDashed} onPress={() => handleFileUpload(key)}>
        <Text style={[styles.uploadBoxTitle, uploadText[key] && { color: "#2cae57" }]}>
          {uploadText[key] ? "File selected ✓" : "Tap to upload"}
        </Text>
        <Text style={styles.uploadBoxSubtext} numberOfLines={1} ellipsizeMode="middle">
          {uploadText[key] || subtext}
        </Text>
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
            <Ionicons name={item.icon} size={22} color={item.iconColor || "#2cae57"} />
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
          <Text style={[styles.completeText, { marginTop: 8 }]}>Renewal submitted.</Text>
          <Text style={{ textAlign: "center", color: "#6b72aa", paddingHorizontal: 30, marginBottom: 30, fontSize: 16, lineHeight: 22 }}>
            We will review your documents and notify you via email.
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
            <View style={styles.formContainer}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.verticalPill} />
                <Text style={styles.sectionHeader}>Academic Information</Text>
              </View>

              {isPreFilled ? (
                <>
                  <View style={styles.rowTwoCol}>
                    <View style={styles.colHalf}>
                      {renderReadOnly("Academic Year", "2025-2026")}
                    </View>
                    <View style={styles.colHalf}>
                      {renderReadOnly("Term", "Auto-filled from latest term")}
                    </View>
                  </View>

                  <View style={styles.rowTwoCol}>
                    <View style={styles.colHalf}>
                      {renderReadOnly("School", "Auto-filled from application")}
                    </View>
                    <View style={styles.colHalf}>
                      {renderReadOnly("Program / Course", "Auto-filled from application")}
                    </View>
                  </View>

                  {renderGwaField()}
                </>
              ) : (
                <>
                  <View style={styles.rowTwoCol}>
                    <View style={styles.colHalf}>
                      {renderInput("Academic Year", "academicYear")}
                    </View>
                    <View style={styles.colHalf}>
                      {renderSelect("Term", "term", termOptions)}
                    </View>
                  </View>

                  <View style={styles.rowTwoCol}>
                    <View style={styles.colHalf}>
                      {renderInput("School", "school")}
                    </View>
                    <View style={styles.colHalf}>
                      {renderInput("Program / Course", "program")}
                    </View>
                  </View>

                  <View style={styles.rowTwoCol}>
                    <View style={styles.colHalf}>
                      {renderInput("Current GWA", "gwa", "e.g. 1.75")}
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        );
      case 1:
        return (
          <View>
            <View style={styles.formContainer}>
              <Text style={styles.subtextAboveHeader}>Documents</Text>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.verticalPill} />
                <Text style={styles.sectionHeader}>Supporting Documents</Text>
              </View>

              <View style={styles.rowTwoCol}>
                <View style={styles.colHalf}>
                  {renderFileUploadBox("Grade Report", "PDF or clear image of grades", "gradeReport")}
                </View>
                <View style={styles.colHalf}>
                  {renderFileUploadBox("Certificate of Registration", "Latest term COR", "cor")}
                </View>
              </View>

              <View style={styles.rowTwoCol}>
                <View style={styles.colHalf}>
                  {renderFileUploadBox("Official Receipts (Optional)", "Upload tuition or fee receipts", "receipts")}
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.label}>Additional Notes</Text>
                  <TextInput
                    style={[styles.input, { height: 75, textAlignVertical: 'top', paddingTop: 10 }]}
                    multiline
                    placeholder="Share context on grades, delays, or special circumstances."
                    value={values.additionalNotes}
                    onChangeText={(text) => setValues({ ...values, additionalNotes: text })}
                  />
                </View>
              </View>

            </View>
          </View>
        );
      case 2:
        return (
          <View>
            <View style={styles.formContainer}>
              <Text style={styles.subtextAboveHeader}>Review & Submit</Text>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.verticalPill} />
                <Text style={styles.sectionHeader}>Review & Confirm</Text>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoBoxText}>Please review your details below. Ensure information and documents reflect your current academic standing.</Text>
              </View>

              {renderReviewCard("| Renewal Information", [
                { label: "Academic Year", value: values.academicYear },
                { label: "Term", value: values.term },
                { label: "School", value: values.school },
                { label: "Program", value: values.program },
                { label: "GWA", value: values.gwa || "N/A" },
              ])}

              {renderReviewCard("| Supporting Documents", [
                { label: "Grade Report", icon: "checkmark-circle", iconColor: "#2cae57" },
                { label: "Certificate of Registration", icon: "checkmark-circle", iconColor: "#2cae57" },
                { label: "Official Receipts (Optional)", icon: "remove-circle", iconColor: "#dce1f0" },
              ])}

              <TouchableOpacity
                style={styles.checkboxRow}
                activeOpacity={0.8}
                onPress={() => setConfirmed(!confirmed)}
              >
                <Ionicons
                  name={confirmed ? "checkbox" : "square-outline"}
                  size={20}
                  color={confirmed ? "#5b61aa" : "#848baf"}
                />
                <Text style={styles.checkboxText}>
                  I confirm the details are correct and wish to submit my renewal.
                </Text>
              </TouchableOpacity>

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
        <View style={styles.headerTitles}>
          <Text style={styles.superTitle}>SCHOLARSHIP RENEWAL</Text>
          <Text style={styles.mainTitle}>AY 2026-2027 Renewal Form</Text>
          <Text style={styles.subTitle}>Submit grades and receipts to renew your assistance.</Text>
        </View>
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
        <View style={styles.footerRow}>
          {step === 0 ? (
            <TouchableOpacity style={styles.backToHomeBtn} onPress={() => navigation.navigate("ScholarDashboardMain")}>
              <Text style={styles.backToHomeText}>Back to Home</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.backToHomeBtn} onPress={() => setStep(step - 1)}>
              <Text style={styles.backToHomeText}>Previous</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, step === maxStep && !confirmed && { backgroundColor: '#aeb4d2', elevation: 0 }]}
            onPress={advance}
            disabled={step === maxStep && !confirmed}
          >
            <Text style={styles.nextBtnText}>{step < maxStep ? "Continue" : "Submit Renewal"}</Text>
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
  headerTitles: { flex: 1, paddingLeft: 14 },
  superTitle: { fontSize: 11, fontWeight: "700", color: "#5b61aa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  mainTitle: { fontSize: 20, fontWeight: "900", color: "#111", letterSpacing: -0.3, marginBottom: 2 },
  subTitle: { fontSize: 12, color: "#6e7798", fontWeight: "500" },
  progressBarRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 24, marginTop: 4, marginBottom: 16 },
  progressStep: { height: 6, flex: 1, marginHorizontal: 4, borderRadius: 5 },
  progressStepActive: { backgroundColor: "#5b61aa" },
  progressStepInactive: { backgroundColor: "#dde2ee" },
  formContainer: { paddingHorizontal: 24, paddingTop: 10 },
  subtextAboveHeader: { fontSize: 11, color: "#6d78a8", fontWeight: "600", marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  verticalPill: { width: 4, height: 20, backgroundColor: '#5b61aa', borderRadius: 2, marginRight: 8 },
  content: { flex: 1 },
  sectionHeader: { fontSize: 17, fontWeight: "800", color: "#2d3a7c" },
  row: { marginBottom: 16 },
  label: { fontWeight: "600", color: "#1c2131", fontSize: 13, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#dce1f0", borderRadius: 10, paddingHorizontal: 12, backgroundColor: "#ffffff", color: "#555", fontSize: 13, height: 50 },
  uploadBtn: { borderWidth: 1, borderColor: "#a9b1c0", borderRadius: 12, height: 50, justifyContent: "center", paddingHorizontal: 16, backgroundColor: "#ffffff" },
  uploadText: { color: "#777", fontSize: 15, alignSelf: "center" },
  uploadBoxDashed: { borderWidth: 1, borderColor: "#c2c9d6", borderStyle: "dashed", borderRadius: 10, backgroundColor: "#f8f9fc", width: "100%", height: 75, paddingHorizontal: 12, justifyContent: "center" },
  uploadBoxTitle: { fontSize: 13, fontWeight: "600", color: "#4f5ec4", marginBottom: 2 },
  uploadBoxSubtext: { fontSize: 11, color: "#6e7798" },
  reviewRow: { padding: 10, borderColor: "#dbe2f6", borderWidth: 1, borderRadius: 10, marginBottom: 8, backgroundColor: "#fff" },
  reviewLabel: { color: "#848baf", fontSize: 13, fontWeight: "600" },
  reviewValue: { color: "#2d3a7c", fontSize: 14, marginTop: 2 },
  reviewCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#dbe2f6", borderRadius: 10, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  reviewCardTitle: { fontSize: 17, fontWeight: "900", color: "#4f5fc5", marginBottom: 4 },
  reviewRowCardItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8, alignItems: "center" },
  reviewValueCard: { fontSize: 12, color: "#1c2131", fontWeight: "700" },
  infoBox: { backgroundColor: "#f8f9fc", padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#e4e8f6", marginBottom: 16 },
  infoBoxText: { fontSize: 12, color: "#3d4076", lineHeight: 18, fontWeight: "500" },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginTop: 8, marginBottom: 20 },
  checkboxText: { marginLeft: 10, fontSize: 13, color: "#2d3a7c", fontWeight: "700" },
  rowTwoCol: { flexDirection: "row", gap: 12, marginBottom: 0 }, // no bottom margin since elements inside have row margin
  colHalf: { flex: 1 },
  yearPickerInput: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#a9b1c0", borderRadius: 12, paddingHorizontal: 16, backgroundColor: "#ffffff", height: 50 },
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
  footerRow: { flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 30, justifyContent: 'flex-end', alignItems: 'center' },
  backToHomeBtn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: '#dce1f0', marginRight: 12 },
  backToHomeText: { color: '#4f5ec4', fontWeight: '700', fontSize: 14 },
  nextBtn: { backgroundColor: "#5b61a7", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 26, alignItems: "center", shadowColor: "#2d3a7c", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 4 },
  nextBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  centered: { alignItems: "center", justifyContent: "center", marginTop: 120 },
  completeText: { fontSize: 22, fontWeight: "800", color: "#3f4ca8", marginTop: 16, marginBottom: 8 },
  submitBtn: { borderRadius: 12, backgroundColor: "#4f5fc5", paddingVertical: 14, paddingHorizontal: 30, marginTop: 10 },
  submitBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
