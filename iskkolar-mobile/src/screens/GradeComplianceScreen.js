import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Animated, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { getGradeComplianceTerms, submitGradeCompliance } from "../services/gradeComplianceService";

const statusColors = {
  Pending: { bg: "#fff8e6", text: "#b5850a" },
  Submitted: { bg: "#e6f7ef", text: "#0d7c47" },
  Approved: { bg: "#e6f0ff", text: "#2563eb" },
  Rejected: { bg: "#ffeaea", text: "#dc2626" },
  default: { bg: "#f0f0f0", text: "#666" },
};

export default function GradeComplianceScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [completeStage, setCompleteStage] = useState("none");
  const [termRequirements, setTermRequirements] = useState([]);
  const [academicYear, setAcademicYear] = useState("");
  const [currentScholarship, setCurrentScholarship] = useState("");
  const [isLoadingTerms, setIsLoadingTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ gradeReport: "", cor: "", term: "" });

  const [selectedTermId, setSelectedTermId] = useState(null);
  const [gradeReportFile, setGradeReportFile] = useState(null);
  const [corFile, setCorFile] = useState(null);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;

  const selectedTerm = useMemo(
    () => termRequirements.find((item) => item.id === selectedTermId) || null,
    [termRequirements, selectedTermId]
  );

  const loadTerms = async () => {
    setIsLoadingTerms(true);
    try {
      const response = await getGradeComplianceTerms();
      const payload = response?.data || response || {};
      setAcademicYear(payload.academicYear || "");
      setCurrentScholarship(payload.currentScholarship || "");
      setTermRequirements(payload.terms || []);
      setFieldErrors((current) => ({ ...current, term: "" }));
    } catch (error) {
      setFieldErrors((current) => ({
        ...current,
        term: error?.message || "Failed to load grade compliance terms.",
      }));
      setTermRequirements([]);
    } finally {
      setIsLoadingTerms(false);
    }
  };

  useEffect(() => {
    loadTerms();
  }, []);

  useEffect(() => {
    stepAnim.setValue(0);
    Animated.timing(stepAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [selectedTermId, completeStage, isSubmitting]);

  useEffect(() => {
    if (isSubmitting) {
      spinAnim.setValue(0);
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [isSubmitting, spinAnim]);

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

  const resetFormState = ({ clearFeedback = true } = {}) => {
    setSelectedTermId(null);
    setGradeReportFile(null);
    setCorFile(null);
    setFieldErrors({ gradeReport: "", cor: "", term: "" });
    if (clearFeedback) setSuccessMessage("");
  };

  const clearFieldError = (fieldName) => {
    setFieldErrors((current) => ({ ...current, [fieldName]: "" }));
  };

  const pickFile = async (type) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        if (type === "gradeReport") {
          setGradeReportFile(file);
          clearFieldError("gradeReport");
        } else if (type === "cor") {
          setCorFile(file);
          clearFieldError("cor");
        }
      }
    } catch (err) {
      Alert.alert("Error", "Could not pick a file.");
    }
  };

  const handleSubmit = async () => {
    const nextFieldErrors = {
      gradeReport: gradeReportFile ? "" : "Grade report is required.",
      cor: corFile ? "" : "COR is required.",
      term: selectedTerm ? "" : "Please select a term.",
    };

    setFieldErrors(nextFieldErrors);

    if (!selectedTerm || !gradeReportFile || !corFile) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      await submitGradeCompliance({
        term: selectedTerm.term,
        scholarshipName: currentScholarship,
        remarks: "",
        files: {
          gradeReport: gradeReportFile,
          cor: corFile,
        },
      });

      setCompleteStage("preAssessment");
      await loadTerms();
    } catch (error) {
      setFieldErrors((current) => ({
        ...current,
        term: error?.message || "Failed to submit grade compliance.",
      }));
      setIsSubmitting(false);
    }
  };

  const renderTodoCard = (termItem) => {
    const statusColor = statusColors[termItem.status] || statusColors.default;
    return (
      <View style={styles.todoCard} key={termItem.id}>
        <View style={styles.todoHeader}>
          <Text style={styles.todoTitle}>{termItem.termLabel}</Text>
          <View style={[styles.badgeBase, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.badgeText, { color: statusColor.text }]}>{termItem.status}</Text>
          </View>
        </View>
        
        <View style={styles.todoContentRow}>
          <View style={styles.todoCol}>
            <Text style={styles.todoLabel}>Academic Year</Text>
            <Text style={styles.todoValue}>{academicYear || "2025-2026"}</Text>
          </View>
          <View style={styles.todoCol}>
            <Text style={styles.todoLabel}>Requirement</Text>
            <Text style={styles.todoValue}>Official Grades</Text>
          </View>
          <View style={[styles.todoCol, { flex: 1.5 }]}>
            <Text style={styles.todoLabel}>Documents</Text>
            <Text style={[styles.todoValue, { lineHeight: 20 }]}>Step 1: COR •{"\n"}Step 2: Grades</Text>
          </View>
          <View style={styles.todoCol}>
            <Text style={styles.todoLabel}>Submission</Text>
            <Text style={[styles.todoValue, { color: termItem.status === "Submitted" ? "#0d7c47" : "#b5850a" }]}>
              {termItem.status === "Submitted" ? "Submitted" : termItem.status}
            </Text>
          </View>
        </View>

        {termItem.status === "Submitted" || termItem.status === "Approved" || termItem.status === "Rejected" ? (
          <View style={[styles.submitBtnAction, { backgroundColor: '#b6bdd9' }]}>
            <Text style={[styles.submitBtnActionText, { color: '#ffffff' }]}>Already Submitted</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.submitBtnAction} 
            onPress={() => {
              setSelectedTermId(termItem.id);
              clearFieldError("term");
            }}
          >
            <Text style={styles.submitBtnActionText}>Submit Grades</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderUpload = (label, fileObj, type, errorMsg) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.uploadBtn} onPress={() => pickFile(type)}>
        <Text style={[styles.uploadText, fileObj ? { color: "#111" } : null]} numberOfLines={1}>
          {fileObj ? fileObj.name : "Choose File"}
        </Text>
      </TouchableOpacity>
      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
    </View>
  );

  const renderInput = (label, val) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputReadOnly}>
        <Text style={styles.inputReadOnlyText}>{val || "--"}</Text>
      </View>
    </View>
  );

  const renderContent = () => {
    if (completeStage === "preAssessment") {
      return (
        <View style={styles.centered}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons name="checkmark-circle" size={120} color="#29d0a5" />
          </Animated.View>
          <Text style={[styles.completeText, { marginTop: 8 }]}>Submission Successful!</Text>
          <Text style={{ textAlign: "center", color: "#6b72aa", paddingHorizontal: 30, marginBottom: 30, fontSize: 16, lineHeight: 22 }}>
            Your grade report has been submitted securely. Please wait for the admin to verify your compliance.
          </Text>
          <TouchableOpacity style={styles.submitBtnOk} onPress={() => { setCompleteStage("none"); resetFormState(); }}>
            <Text style={styles.submitBtnOkText}>Return to List</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isSubmitting) {
      return (
        <View style={styles.centered}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="sync-circle" size={110} color="#4f5fc5" />
          </Animated.View>
          <Text style={styles.completeText}>Uploading Documents...</Text>
          <Text style={{ textAlign: "center", color: "#848baf", paddingHorizontal: 40, fontSize: 15 }}>
            Please hold on while we securely process your grade report.
          </Text>
        </View>
      );
    }

    if (isLoadingTerms) {
      return (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading term requirements...</Text>
        </View>
      );
    }

    if (!selectedTermId) {
      return (
        <View style={styles.landingContainer}>
          <Text style={[styles.landingHeader, { marginBottom: 4 }]}>COR & Grade Compliance</Text>
          <Text style={{ fontSize: 13, color: '#6870a3', marginBottom: 20, marginLeft: 2, fontWeight: '500' }}>
            Academic Year: {academicYear || "2025-2026"}
          </Text>
          
          {fieldErrors.term ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{fieldErrors.term}</Text>
            </View>
          ) : null}

          {termRequirements.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No grade compliance terms available yet. Complete a scholarship application first.</Text>
            </View>
          ) : (
            termRequirements.map(renderTodoCard)
          )}
        </View>
      );
    }

    return (
      <View style={styles.formContainer}>
        <View style={styles.underlinedTitleWrapper}>
          <Text style={styles.underlinedTitle}>{selectedTerm?.termLabel}</Text>
        </View>
        {renderInput("Current Scholarship", currentScholarship)}
        {renderInput("Current Academic Year", academicYear)}
        {renderUpload("Grade Report", gradeReportFile, "gradeReport", fieldErrors.gradeReport)}
        {renderUpload("Certificate of Registration (COR)", corFile, "cor", fieldErrors.cor)}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.progressHeader, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity 
          onPress={() => {
            if (completeStage === "preAssessment") {
              setCompleteStage("none");
              resetFormState();
            } else if (selectedTermId) {
              resetFormState();
            } else {
              navigation.goBack();
            }
          }} 
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#5b6095" />
        </TouchableOpacity>
        
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={styles.titleLanding}>COR & Grade Compliance</Text>
          <Text style={styles.subtitleLanding} numberOfLines={1}>
            {selectedTerm ? `Submit grades for ${selectedTerm.termLabel}` : "Track your academic standing"}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8}>
          <Ionicons name="notifications-outline" size={24} color="#6a72b2" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 60 }}>
        <Animated.View style={{ opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          {renderContent()}
        </Animated.View>
      </ScrollView>

      {!isSubmitting && completeStage === "none" && selectedTermId && (
        <View style={{ paddingHorizontal: 24, paddingBottom: 30 }}>
          <TouchableOpacity style={styles.nextBtn} onPress={handleSubmit}>
            <Text style={styles.nextBtnText}>Submit Application</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fc" },
  progressHeader: { flexDirection: "row", alignItems: "center", paddingBottom: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderColor: "#ccd1ed", backgroundColor: "#fff" },
  backBtn: { width: 42, height: 42, borderRadius: 10, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#dbe2f6" },
  titleLanding: { fontSize: 18, fontWeight: "900", color: "#1a1a2e" },
  subtitleLanding: { fontSize: 13, color: "#666", marginTop: 2 },
  bellBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e4e8f6", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  formContainer: { paddingHorizontal: 24, paddingTop: 20 },
  landingContainer: { paddingHorizontal: 20, paddingTop: 20 },
  landingHeader: { fontSize: 18, fontWeight: "900", color: "#111", marginBottom: 16, marginLeft: 2 },
  
  todoCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2, borderWidth: 1, borderColor: "#f0f0f0" },
  todoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  todoTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a2e" },
  badgeBase: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  
  todoContentRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  todoCol: { flex: 1 },
  todoLabel: { color: "#888", fontSize: 12, marginBottom: 4 },
  todoValue: { color: "#1a1a2e", fontSize: 14, fontWeight: "500" },
  
  submitBtnAction: { backgroundColor: "#5b5f97", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  submitBtnActionText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  
  content: { flex: 1 },
  underlinedTitleWrapper: { alignSelf: "flex-start", marginBottom: 20 },
  underlinedTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a2e", borderBottomWidth: 2, borderBottomColor: "#1a1a2e", paddingBottom: 4 },
  
  row: { marginBottom: 16 },
  label: { fontWeight: "500", color: "#555", fontSize: 14, marginBottom: 8 },
  inputReadOnly: { borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 12, paddingHorizontal: 16, height: 50, backgroundColor: "#fafafa", justifyContent: 'center' },
  inputReadOnlyText: { color: "#666", fontSize: 14 },
  
  uploadBtn: { borderWidth: 1, borderStyle: "dashed", borderColor: "#ccc", borderRadius: 12, height: 50, justifyContent: "center", paddingHorizontal: 16, backgroundColor: "#fafafa" },
  uploadText: { color: "#888", fontSize: 14 },
  errorText: { color: "#dc2626", fontSize: 12, marginTop: 4, fontWeight: "500" },
  
  errorBanner: { backgroundColor: "#fff1f2", borderColor: "#fecaca", borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 },
  errorBannerText: { color: "#b91c1c", fontSize: 14 },
  emptyCard: { backgroundColor: "#fff", borderColor: "#f0f0f0", borderWidth: 1, borderRadius: 12, padding: 24, alignItems: "center" },
  emptyCardText: { color: "#666", fontSize: 14, textAlign: "center", lineHeight: 20 },
  
  loadingText: { color: "#666", fontSize: 16 },
  
  nextBtn: { backgroundColor: "#5b5f97", borderRadius: 14, paddingVertical: 16, alignItems: "center", shadowColor: "#2d3a7c", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 4 },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  
  centered: { alignItems: "center", justifyContent: "center", marginTop: 120 },
  completeText: { fontSize: 22, fontWeight: "800", color: "#3f4ca8", marginTop: 16, marginBottom: 8 },
  submitBtnOk: { borderRadius: 12, backgroundColor: "#4f5fc5", paddingVertical: 14, paddingHorizontal: 30, marginTop: 10 },
  submitBtnOkText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
