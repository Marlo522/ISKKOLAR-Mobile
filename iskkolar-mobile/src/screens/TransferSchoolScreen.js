import React, { useState, useEffect, useRef, useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert, Modal, Animated } from "react-native";
import SafeTextInput from "../components/SafeTextInput";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { programOptions, vocationalProgramOptions, heiSchoolNames } from "../utils/programConstants";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { AuthContext } from "../context/AuthContext";
import { useSchoolTransfer } from "../hooks/useSchoolTransfer";
import { getMyApplications as getMyTertiaryApplications } from "../services/tertiaryAppService";
import { getMyVocationalApplications } from "../services/vocationalAppService";
import {
  getMyChildDesignationApplications,
  getMyStaffAdvancementApplications,
} from "../services/StaffApplication";
import { getGradeComplianceTerms } from "../services/gradeComplianceService";
import { getScholarDashboardSummary } from "../services/scholarDashboardService";

const YEAR_LEVELS = ["1st", "2nd", "3rd", "4th", "5th"];
const TERM_TYPES = ["Semester", "Trimester", "Quarter System"];
const GRADING_SYSTEMS = ["1.0 - 5.0 Grading System", "4.0 GPA System"];
const TERMS = ["1st Semester", "2nd Semester", "Summer"];

export default function TransferSchoolScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [educationProfile, setEducationProfile] = useState(null);
  const [gradeComplianceSummary, setGradeComplianceSummary] = useState(null);
  const [dashboardSummary, setDashboardSummary] = useState(null);

  const [values, setValues] = useState({
    newSchool: "",
    newProgram: "",
    yearLevel: "1st",
    expectedGraduationYear: "",
    termType: "Semester",
    gradingSystem: "1.0 - 5.0 Grading System",
    academicYear: "2026-2027",
    term: "1st Semester",
    reason: "",
  });

  const [corFile, setCorFile] = useState(null);
  const [completeStage, setCompleteStage] = useState("none");
  const [activePredictiveKey, setActivePredictiveKey] = useState(null);

  // Selector modal state
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [selectorTitle, setSelectorTitle] = useState("");
  const [selectorOptions, setSelectorOptions] = useState([]);
  const [selectorKey, setSelectorKey] = useState("");
  const [examplesModalVisible, setExamplesModalVisible] = useState(false);

  const {
    submitting,
    error,
    fieldErrors,
    clearFieldError,
    validateForm,
    submitApplication,
  } = useSchoolTransfer();

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
  }, [completeStage, submitting]);

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
    if (completeStage === "success") {
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

  const getFirstItem = (value) => (Array.isArray(value) ? value[0] : value);

  const buildEducationProfileFromTables = (sources) => {
    const sortedByDateDesc = (items) =>
      [...(items || [])].sort(
        (a, b) => new Date(b.submitted_at || b.created_at || 0) - new Date(a.submitted_at || a.created_at || 0)
      );

    const tertiary = getFirstItem(sortedByDateDesc(sources.tertiaryApplications));
    const vocational = getFirstItem(sortedByDateDesc(sources.vocationalApplications));
    const kkfiChild = getFirstItem(sortedByDateDesc(sources.kkfiChildApplications));
    const kkfiStaff = getFirstItem(sortedByDateDesc(sources.kkfiStaffApplications));

    const tertiaryEducation =
      getFirstItem(tertiary?.tertiary_education) ||
      getFirstItem(kkfiChild?.tertiary_education) ||
      getFirstItem(kkfiStaff?.tertiary_education);

    const vocationalEducation = getFirstItem(vocational?.vocational_education);
    const mastersEducation = getFirstItem(kkfiStaff?.masters_education);

    const selected = tertiaryEducation || vocationalEducation || mastersEducation || null;

    if (!selected) {
      return null;
    }

    return {
      school: selected.school_name || null,
      program: selected.program || null,
      yearLevel: selected.year_level || null,
      term: selected.term || null,
      termType: selected.term_type || null,
      gradeScale: selected.grade_scale || null,
      gwa: selected.gwa || null,
    };
  };

  useEffect(() => {
    let mounted = true;

    const loadAutofillSources = async () => {
      const [
        summaryRes,
        gradeComplianceRes,
        tertiaryRes,
        vocationalRes,
        childRes,
        staffRes,
      ] = await Promise.allSettled([
        getScholarDashboardSummary(),
        getGradeComplianceTerms(),
        getMyTertiaryApplications(),
        getMyVocationalApplications(),
        getMyChildDesignationApplications(),
        getMyStaffAdvancementApplications(),
      ]);

      if (!mounted) return;

      if (summaryRes.status === "fulfilled") {
        setDashboardSummary(summaryRes.value?.data || summaryRes.value || null);
      }

      if (gradeComplianceRes.status === "fulfilled") {
        setGradeComplianceSummary(gradeComplianceRes.value?.data || gradeComplianceRes.value || null);
      }

      const profileFromTables = buildEducationProfileFromTables({
        tertiaryApplications: tertiaryRes.status === "fulfilled" ? tertiaryRes.value || [] : [],
        vocationalApplications: vocationalRes.status === "fulfilled" ? vocationalRes.value || [] : [],
        kkfiChildApplications: childRes.status === "fulfilled" ? childRes.value || [] : [],
        kkfiStaffApplications: staffRes.status === "fulfilled" ? staffRes.value || [] : [],
      });

      if (profileFromTables) {
        setEducationProfile(profileFromTables);
      }

      if (__DEV__) {
        const rejectedSources = [
          ["dashboardSummary", summaryRes],
          ["gradeCompliance", gradeComplianceRes],
          ["tertiaryApplications", tertiaryRes],
          ["vocationalApplications", vocationalRes],
          ["childDesignationApplications", childRes],
          ["staffAdvancementApplications", staffRes],
        ]
          .filter(([, result]) => result.status === "rejected")
          .map(([name]) => name);

        if (rejectedSources.length > 0) {
          console.warn("Transfer autofill partially loaded. Failed sources:", rejectedSources.join(", "));
        }
      }
    };

    void loadAutofillSources();

    return () => {
      mounted = false;
    };
  }, []);

  const gradeComplianceLatest = gradeComplianceSummary?.latestSubmission || null;
  const currentSchool = dashboardSummary?.currentSchool || dashboardSummary?.school || educationProfile?.school || user?.school || user?.university || "";
  const currentProgram = dashboardSummary?.currentProgram || dashboardSummary?.program || educationProfile?.program || user?.course || user?.program || "";
  const currentGwa = dashboardSummary?.currentGwa ?? dashboardSummary?.gwa ?? gradeComplianceLatest?.gwa ?? educationProfile?.gwa ?? user?.gwa ?? "";
  const currentAcademicYear = dashboardSummary?.currentAcademicYear || dashboardSummary?.academicYear || educationProfile?.academicYear || user?.academicYear || "2025-2026";

  // ─── Field helpers ──────────────────────────────────────────
  const setField = (key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    clearFieldError(key);
  };

  const openSelector = (title, options, key) => {
    setSelectorTitle(title);
    setSelectorOptions(options);
    setSelectorKey(key);
    setSelectorVisible(true);
  };

  const pickCorFile = async () => {
    const handleResult = (result) => {
      if (!result.canceled && result.assets && result.assets.length > 0) {
        let file = result.assets[0];
        if (!file.name) {
          file = { ...file, name: file.uri.split('/').pop(), type: file.mimeType || 'image/jpeg' };
        }
        setCorFile(file);
        clearFieldError("corNewSchool");
      }
    };

    Alert.alert(
      "Upload Document",
      "Choose an option",
      [
        {
          text: "Take Photo",
          onPress: async () => {
            try {
              const permission = await ImagePicker.requestCameraPermissionsAsync();
              if (permission.status !== "granted") {
                Alert.alert("Permission Required", "Camera permission is required to take photos.");
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.8,
              });
              handleResult(result);
            } catch (err) {
              Alert.alert("Error", "Could not capture image.");
            }
          }
        },
        {
          text: "Choose File",
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: ["application/pdf", "image/*"],
                copyToCacheDirectory: true,
              });
              handleResult(result);
            } catch (err) {
              Alert.alert("Error", "Failed to pick document.");
            }
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  // ─── Submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    const prevSchool = currentSchool;
    const prevProgram = currentProgram;

    const payload = {
      ...values,
      prevSchool,
      prevProgram,
    };

    if (!validateForm(payload, corFile)) return;

    try {
      await submitApplication(payload, corFile);
      setCompleteStage("success");
    } catch (err) {
      if (!err?.isValidationError) {
        Alert.alert(
          "Submission Failed",
          err?.message || "An error occurred.",
          [{ text: "OK", style: "default" }]
        );
      }
    }
  };

  // ─── Render helpers ─────────────────────────────────────────
  const renderReadOnly = (label, value) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.input, styles.readOnlyInput]}>
        <Text style={styles.readOnlyText}>{value || "—"}</Text>
      </View>
    </View>
  );

  const isPredictiveField = (key) => ["newProgram", "newSchool"].includes(key);

  const renderInput = (label, key, placeholder, keyboardType = "default") => {
    const isPredictive = isPredictiveField(key);
    const query = values[key] || "";
    const isVocational = vocationalProgramOptions.some(opt => opt.toLowerCase() === currentProgram.toLowerCase());
    const optionsSource =
      key === "newSchool"
        ? heiSchoolNames
        : isVocational
        ? vocationalProgramOptions
        : programOptions;
    const suggestions = isPredictive && query.trim().length >= 1
      ? optionsSource.filter(opt => opt.toLowerCase().includes(query.toLowerCase()))
      : [];

    return (
      <View style={[styles.row, fieldErrors[key] && styles.rowWithError, { position: "relative", zIndex: isPredictive && activePredictiveKey === key && suggestions.length > 0 ? 99 : 1 }]}>
        <Text style={styles.label}>{label} <Text style={{ color: "red" }}>*</Text></Text>
        <SafeTextInput
          style={[styles.input, fieldErrors[key] && { borderColor: "red" }]}
          placeholder={placeholder}
          placeholderTextColor="#888"
          keyboardType={keyboardType}
          value={values[key]}
          onChangeText={(text) => {
            const sanitized = keyboardType === "numeric" ? text.replace(/[^0-9]/g, "") : text;
            setField(key, sanitized);
          }}
          onFocus={() => {
            if (isPredictive) {
              setActivePredictiveKey(key);
            }
          }}
          onBlur={() => {
            if (isPredictive) {
              setTimeout(() => {
                setActivePredictiveKey(null);
              }, 200);
            }
          }}
        />
        {isPredictive && activePredictiveKey === key && suggestions.length > 0 && (
          <View style={styles.predictionsContainer}>
            <ScrollView keyboardShouldPersistTaps="handled" style={styles.predictionsScroll}>
              {suggestions.slice(0, 6).map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.predictionItem}
                  onPress={() => {
                    setField(key, item);
                    setActivePredictiveKey(null);
                  }}
                >
                  <Ionicons name="school-outline" size={14} color="#5b5f97" style={{ marginRight: 8 }} />
                  <Text style={styles.predictionText} numberOfLines={1}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {fieldErrors[key] && <Text style={styles.errorText}>{fieldErrors[key]}</Text>}
      </View>
    );
  };

  const renderTextArea = (label, key, placeholder) => (
    <View style={[styles.row, fieldErrors[key] && styles.rowWithError]}>
      <Text style={styles.label}>{label} <Text style={{ color: "red" }}>*</Text></Text>
      <SafeTextInput
        style={[styles.input, styles.textArea, fieldErrors[key] && { borderColor: "red" }]}
        placeholder={placeholder}
        placeholderTextColor="#888"
        multiline
        numberOfLines={4}
        value={values[key]}
        onChangeText={(text) => setField(key, text)}
      />
      {fieldErrors[key] && <Text style={styles.errorText}>{fieldErrors[key]}</Text>}
    </View>
  );

  const renderSelector = (label, key, title, options) => (
    <View style={[styles.row, fieldErrors[key] && styles.rowWithError]}>
      <Text style={styles.label}>{label} <Text style={{ color: "red" }}>*</Text></Text>
      <TouchableOpacity
        style={[styles.pickerInput, fieldErrors[key] && { borderColor: "red" }]}
        onPress={() => openSelector(title, options, key)}
      >
        <Text style={styles.pickerText}>{values[key]}</Text>
        <Ionicons name="chevron-down" size={20} color="#6b72aa" />
      </TouchableOpacity>
      {fieldErrors[key] && <Text style={styles.errorText}>{fieldErrors[key]}</Text>}
    </View>
  );

  // ─── Success state ──────────────────────────────────────────
  if (completeStage === "success") {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons name="checkmark-circle" size={120} color="#29d0a5" />
          </Animated.View>
          <Text style={styles.completeText}>Request Submitted!</Text>
          <Text style={styles.completeSub}>{"Your transfer school request has been sent for approval. We will notify you once it's processed."}</Text>
          <TouchableOpacity style={styles.submitBtnOk} onPress={() => navigation.navigate("ScholarDashboardMain")}>
            <Text style={styles.submitBtnOkText}>Return Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Loading state ──────────────────────────────────────────
  if (submitting) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="sync-circle" size={110} color="#4f5fc5" />
          </Animated.View>
          <Text style={styles.completeText}>Processing Request...</Text>
          <Text style={styles.completeSub}>Please wait while we securely transmit your transfer details.</Text>
        </View>
      </View>
    );
  }

  // ─── Form ───────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#5b6095" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.superTitle}>TRANSFER SCHOOL REQUEST</Text>
          <Text style={styles.mainTitle}>Submit a Transfer Update</Text>
          <Text style={styles.subTitle}>Your current details are auto-filled from your application and grade compliance.</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>

          {/* Global error banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          {/* Current Academic Information */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.verticalPill} />
              <Text style={styles.sectionTitle}>Current Academic Information</Text>
            </View>

            <View style={styles.rowTwoCol}>
              <View style={styles.colHalf}>
                {renderReadOnly("Current School", currentSchool || "Auto-filled")}
              </View>
              <View style={styles.colHalf}>
                {renderReadOnly("Current Program", currentProgram || "Auto-filled")}
              </View>
            </View>

            {renderReadOnly("Current GWA", currentGwa || "Auto-filled from grade compliance")}
          </View>

          {/* Transfer Details */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.verticalPill} />
              <Text style={styles.sectionTitle}>Transfer Details</Text>
            </View>

            <View style={styles.rowTwoCol}>
              <View style={styles.colHalf}>
                {renderInput("New School", "newSchool", "Target university or college")}
              </View>
              <View style={styles.colHalf}>
                {renderInput("New Program / Course", "newProgram", "Program you are transferring to")}
              </View>
            </View>

            <View style={styles.rowTwoCol}>
              <View style={styles.colHalf}>
                {renderSelector("Year Level", "yearLevel", "Select Year Level", YEAR_LEVELS)}
              </View>
              <View style={styles.colHalf}>
                {renderSelector("Term Type", "termType", "Select Term Type", TERM_TYPES)}
              </View>
            </View>

            <View style={styles.rowTwoCol}>
              <View style={styles.colHalf}>
                {renderSelector("Grading System", "gradingSystem", "Select Grading System", GRADING_SYSTEMS)}
              </View>
              <View style={styles.colHalf}>
                {renderReadOnly("Effective Academic Year", currentAcademicYear)}
              </View>
            </View>
            <TouchableOpacity onPress={() => setExamplesModalVisible(true)} style={{ marginTop: -4, marginBottom: 16 }}>
              <Text style={{ color: "#4f5fc5", fontSize: 13, fontWeight: "600", textDecorationLine: "underline" }}>
                View grading scale examples
              </Text>
            </TouchableOpacity>

            <View style={styles.rowTwoCol}>
              <View style={styles.colHalf}>
                {renderSelector("Effective Term", "term", "Select Term", TERMS)}
              </View>
              <View style={styles.colHalf}>
                {renderInput("Expected Graduation Year", "expectedGraduationYear", "YYYY", "numeric")}
              </View>
            </View>

            {renderTextArea("Reason for Transfer", "reason", "Provide a short explanation for the transfer request.")}
          </View>

          {/* Supporting Documents */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.verticalPill} />
              <Text style={styles.sectionTitle}>Supporting Documents</Text>
            </View>
            <Text style={[styles.label, { marginBottom: 4 }]}>Certificate of Registration (New School) <Text style={{ color: "red" }}>*</Text></Text>
            <View style={fieldErrors.corNewSchool && styles.rowWithError}>
              <TouchableOpacity
                style={[styles.unifiedUploadContainer, fieldErrors.corNewSchool && styles.errorInput]}
                onPress={pickCorFile}
              >
                <Ionicons
                  name="share-outline"
                  size={18}
                  color={corFile ? "#4f5fc5" : "#848baf"}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[
                    styles.unifiedUploadText,
                    corFile ? styles.unifiedUploadTextActive : styles.unifiedUploadTextInactive
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {corFile ? corFile.name : "Latest COR from the receiving school"}
                </Text>
              </TouchableOpacity>
              {fieldErrors.corNewSchool && <Text style={[styles.errorText, { marginTop: 4 }]}>{fieldErrors.corNewSchool}</Text>}
            </View>
          </View>

        </Animated.View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate("ScholarDashboardMain")}>
          <Text style={styles.btnSecondaryText}>Back to Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit}>
          <Text style={styles.btnPrimaryText}>Submit Transfer Request</Text>
        </TouchableOpacity>
      </View>

      {/* Generic Selector Modal */}
      <Modal visible={selectorVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setSelectorVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setSelectorVisible(false)} />
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectorTitle}</Text>
              <TouchableOpacity onPress={() => setSelectorVisible(false)}>
                <Ionicons name="close" size={24} color="#4f5fc5" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {selectorOptions.map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.modalOption, values[selectorKey] === opt && styles.modalOptionActive]}
                  onPress={() => {
                    setField(selectorKey, opt);
                    setSelectorVisible(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, values[selectorKey] === opt && styles.modalOptionTextActive]}>{opt}</Text>
                  {values[selectorKey] === opt && (
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ExamplesModal visible={examplesModalVisible} onClose={() => setExamplesModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fbfbfe" },
  header: { paddingHorizontal: 24, paddingBottom: 16, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ccd1ed", backgroundColor: "#fff" },
  backBtn: { width: 42, height: 42, borderRadius: 10, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#dbe2f6" },
  headerTitles: { flex: 1, paddingLeft: 16 },
  superTitle: { fontSize: 11, fontWeight: "700", color: "#5b61aa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  mainTitle: { fontSize: 20, fontWeight: "900", color: "#1c2131", letterSpacing: -0.3, marginBottom: 2 },
  subTitle: { fontSize: 12, color: "#6e7798", fontWeight: "500" },

  content: { flex: 1 },
  formSection: { paddingHorizontal: 24, paddingTop: 24 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  verticalPill: { width: 4, height: 20, backgroundColor: "#5b61aa", borderRadius: 2, marginRight: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#2d3a7c" },

  row: { marginBottom: 16 },
  rowWithError: { marginBottom: 4 },
  label: { fontWeight: "600", color: "#1c2131", fontSize: 13, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#eaecf0", borderRadius: 10, paddingHorizontal: 16, backgroundColor: "#ffffff", color: "#1c2131", fontSize: 13, height: 50 },
  readOnlyInput: { backgroundColor: "#f4f5f8", borderColor: "#eaecf0", justifyContent: "center" },
  readOnlyText: { color: "#8a94b5", fontSize: 13 },
  textArea: { height: 100, textAlignVertical: "top", paddingTop: 12 },
  errorText: { color: "#dc2626", fontSize: 12, marginTop: 2, fontWeight: "600", lineHeight: 14 },

  errorBanner: { marginHorizontal: 24, marginTop: 16, borderRadius: 10, borderWidth: 1, borderColor: "#fca5a5", backgroundColor: "#fef2f2", paddingHorizontal: 16, paddingVertical: 12 },
  errorBannerText: { color: "#b91c1c", fontSize: 13, fontWeight: "600" },

  rowTwoCol: { flexDirection: "row", gap: 12 },
  colHalf: { flex: 1 },

  pickerInput: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#eaecf0", borderRadius: 10, paddingHorizontal: 16, backgroundColor: "#ffffff", height: 50 },
  pickerText: { color: "#1c2131", fontSize: 13 },

  unifiedUploadContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    backgroundColor: "#fff",
    height: 48,
    paddingHorizontal: 12,
  },
  unifiedUploadText: {
    fontSize: 14,
    flex: 1,
  },
  unifiedUploadTextActive: {
    color: "#4f5fc5",
    fontWeight: "700",
  },
  unifiedUploadTextInactive: {
    color: "#848baf",
    fontWeight: "500",
  },
  errorInput: { borderColor: "#dc2626", borderWidth: 1.5 },

  footer: { flexDirection: "row", paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#f0f2fb", backgroundColor: "#fff" },
  btnSecondary: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: "#dce1f0", marginRight: 12, flex: 1, alignItems: "center" },
  btnSecondaryText: { color: "#4f5ec4", fontWeight: "700", fontSize: 14 },
  btnPrimary: { backgroundColor: "#5b61a7", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, flex: 1.5, alignItems: "center", shadowColor: "#2d3a7c", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 4 },
  btnPrimaryText: { color: "#fff", fontSize: 14, fontWeight: "800" },

  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  completeText: { fontSize: 22, fontWeight: "900", color: "#1c2131", marginTop: 24, marginBottom: 12, textAlign: "center" },
  completeSub: { textAlign: "center", color: "#6e7798", fontSize: 15, lineHeight: 22, marginBottom: 32 },
  submitBtnOk: { borderRadius: 12, backgroundColor: "#5b61a7", paddingVertical: 14, paddingHorizontal: 40 },
  submitBtnOkText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "50%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#e4e8f8" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1c2131" },
  modalScroll: { paddingHorizontal: 16, paddingTop: 16 },
  modalOption: { paddingVertical: 16, paddingHorizontal: 16, borderRadius: 12, marginBottom: 8, backgroundColor: "#f8f9ff", borderWidth: 1, borderColor: "#e4e8f8", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalOptionActive: { backgroundColor: "#4f5fc5", borderColor: "#4f5fc5" },
  modalOptionText: { fontSize: 15, color: "#4f5fc5", fontWeight: "700" },
  modalOptionTextActive: { color: "#fff" },
  predictionsContainer: {
    position: "absolute",
    top: 76,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eaecf0",
    maxHeight: 200,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  predictionsScroll: {
    maxHeight: 200,
  },
  predictionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eaecf0",
  },
  predictionText: {
    fontSize: 14,
    color: "#1c2131",
    fontWeight: "600",
  },
});

const ExamplesModal = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}>
        <View style={{
          width: "100%",
          backgroundColor: "#fff",
          borderRadius: 20,
          padding: 20,
          maxHeight: "85%",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 5,
        }}>
          {/* Header */}
          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#e5e7eb",
            marginBottom: 16,
          }}>
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#1f2937" }}>
              Grading Scale Examples
            </Text>
            <TouchableOpacity onPress={onClose} style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#f3f4f6",
              justifyContent: "center",
              alignItems: "center",
            }}>
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 1.0 - 5.00 System */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 15, fontWeight: "800", color: "#4f5fc5", marginBottom: 10 }}>
                {"1.0 - 5.00 Grading System"}
              </Text>
              
              <View style={{ backgroundColor: "#f8fafc", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
                  <Text style={{ fontWeight: "700", color: "#334155", fontSize: 13 }}>1.00 - 1.75</Text>
                  <Text style={{ fontWeight: "600", color: "#16a34a", fontSize: 13 }}>Excellent</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
                  <Text style={{ fontWeight: "700", color: "#334155", fontSize: 13 }}>2.00 - 2.50</Text>
                  <Text style={{ fontWeight: "600", color: "#2563eb", fontSize: 13 }}>Very Good</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
                  <Text style={{ fontWeight: "700", color: "#334155", fontSize: 13 }}>2.75 - 3.00</Text>
                  <Text style={{ fontWeight: "600", color: "#4f46e5", fontSize: 13 }}>Satisfactory</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 }}>
                  <Text style={{ fontWeight: "700", color: "#334155", fontSize: 13 }}>5.00</Text>
                  <Text style={{ fontWeight: "700", color: "#dc2626", fontSize: 13 }}>Failed</Text>
                </View>
              </View>
            </View>

            {/* 4.00 GPA System */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 15, fontWeight: "800", color: "#4f5fc5", marginBottom: 10 }}>
                {"4.00 GPA System"}
              </Text>
              
              <View style={{ backgroundColor: "#f8fafc", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
                  <Text style={{ fontWeight: "700", color: "#334155", fontSize: 13 }}>4.00</Text>
                  <Text style={{ fontWeight: "700", color: "#16a34a", fontSize: 13 }}>A</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
                  <Text style={{ fontWeight: "700", color: "#334155", fontSize: 13 }}>3.00</Text>
                  <Text style={{ fontWeight: "600", color: "#2563eb", fontSize: 13 }}>B</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
                  <Text style={{ fontWeight: "700", color: "#334155", fontSize: 13 }}>2.00</Text>
                  <Text style={{ fontWeight: "600", color: "#475569", fontSize: 13 }}>C</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
                  <Text style={{ fontWeight: "700", color: "#334155", fontSize: 13 }}>1.00</Text>
                  <Text style={{ fontWeight: "600", color: "#b45309", fontSize: 13 }}>D</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 }}>
                  <Text style={{ fontWeight: "700", color: "#334155", fontSize: 13 }}>0.00</Text>
                  <Text style={{ fontWeight: "700", color: "#dc2626", fontSize: 13 }}>F</Text>
                </View>
              </View>
            </View>

            {/* Footer note */}
            <Text style={{
              fontSize: 12,
              color: "#64748b",
              textAlign: "center",
              fontStyle: "italic",
              lineHeight: 18,
              marginTop: 4,
              marginBottom: 10,
            }}>
              {"Examples may vary by school. Follow your official transcript format."}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
