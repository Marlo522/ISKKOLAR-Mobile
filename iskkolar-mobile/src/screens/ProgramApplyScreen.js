import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,

  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Modal,
  Animated,
} from "react-native";
import SafeTextInput from "../components/SafeTextInput";
import { programOptions, vocationalProgramOptions, heiSchoolNames } from "../utils/programConstants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import FormDatePicker from "../components/FormDatePicker";
import useTertiaryApplication from "../hooks/useTertiaryApplication";
import useStaffApplication from "../hooks/useStaffApplication";
import useVocationalApplication from "../hooks/useVocationalApplication";
import ApplicationSubmissionGuard from "../components/ApplicationSubmissionGuard";
import { checkAnyOngoingApplication } from "../services/applicationGuardService";
import api from "../services/api";
import ApplicationsClosedScreen from "./ApplicationsClosedScreen";
import ApplicationResultState from "../components/ApplicationResultState";
import { getScholarshipFormAccess } from "../services/applicationGuardService";

const infoFields = {
  educPath: "Tertiary Education",
  scholarshipType: "", // set dynamically below based on the selected program
  incomingFreshman: "No",
  secondarySchool: "",
  strand: "Science, Technology, Engineering and Mathematics (STEM)",
  yearGraduated: "",
  secondaryGwa: "",
  tertiarySchool: "",
  program: "",
  termType: "Semester",
  gradeScale: "1.0 - 5.00 Grading System",
  yearLevel: "1st",
  term: "1st",
  secondaryYearGraduated: "",
  expectedGradYear: "",
  termStartDate: "",
  termEndDate: "",
  tertiaryGwa: "",
  prevSchoolName: "",
  prevProgram: "",
  prevYearGraduated: "",
  prevGwa: "",
  prevGradeScale: "1.0 - 5.00 Grading System",
  staffId: "",
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "--",
  position: "--",
  fatherName: "",
  fatherBirthday: "",
  fatherStatus: "--",
  fatherOccupation: "",
  fatherIncome: "",
  fatherContact: "",
  motherName: "",
  motherBirthday: "",
  motherStatus: "--",
  motherContact: "",
  motherOccupation: "",
  motherIncome: "",
  vocationalSchoolName: "",
  vocationalProgram: "",
  courseDuration: "3 months",
  completionDate: "",
  hasGuardian: false,
  guardianName: "",
  guardianBirthday: "",
  guardianStatus: "--",
  guardianContact: "",
  guardianOccupation: "",
  guardianIncome: "",
};

const isFatherEmpty = (vals) => {
  return (
    (!vals.fatherName || vals.fatherName.trim() === "") &&
    (!vals.fatherBirthday || vals.fatherBirthday.trim() === "") &&
    (!vals.fatherStatus || vals.fatherStatus === "--" || vals.fatherStatus.trim() === "") &&
    (!vals.fatherContact || vals.fatherContact.trim() === "" || vals.fatherContact === "09") &&
    (!vals.fatherOccupation || vals.fatherOccupation.trim() === "") &&
    (!vals.fatherIncome || vals.fatherIncome.trim() === "")
  );
};

const isMotherEmpty = (vals) => {
  return (
    (!vals.motherName || vals.motherName.trim() === "") &&
    (!vals.motherBirthday || vals.motherBirthday.trim() === "") &&
    (!vals.motherStatus || vals.motherStatus === "--" || vals.motherStatus.trim() === "") &&
    (!vals.motherContact || vals.motherContact.trim() === "" || vals.motherContact === "09") &&
    (!vals.motherOccupation || vals.motherOccupation.trim() === "") &&
    (!vals.motherIncome || vals.motherIncome.trim() === "")
  );
};

export default function ProgramApplyScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const selectedProgram = route?.params?.program || "tertiary";
  const option = route?.params?.option || "Option 1";
  const isChildDesignation = selectedProgram === "employeeChild" && option === "Option 2";

  const [step, setStep] = useState(0);
  const [activePredictiveKey, setActivePredictiveKey] = useState(null);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [step, completeStage]);
  const [values, setValues] = useState({
    ...infoFields,
    // Tertiary → "Manila Scholars", vocational → "TESDA", everything else → blank
    scholarshipType:
      selectedProgram === "tertiary" ? "Manila Scholars" :
        selectedProgram === "vocational" ? "TECHNICAL EDUCATION AND SKILLS DEVELOPMENT AUTHORITY (TESDA)" : "",
  });
  const [familyMembers, setFamilyMembers] = useState([]);
  const [uploadText, setUploadText] = useState({
    cor: null,
    gradeReport: null,
    currentTermGradeReport: null,
    indigency: null,
    birthCert: null,
    incomeFather: null,
    incomeMother: null,
    indigencyFather: null,
    indigencyMother: null,
    incomeGuardian: null,
    indigencyGuardian: null,
    recommendation: null,
    essay: null,
    letterOfIntentApplicant: null,
    letterOfIntentParent: null,
  });
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [completeStage, setCompleteStage] = useState("none");
  const [selectVisible, setSelectVisible] = useState(false);
  const [selectContext, setSelectContext] = useState(null);
  const [declarations, setDeclarations] = useState({ agree1: false, agree2: false, agree3: false });
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [verifiedStaffId, setVerifiedStaffId] = useState("");
  const [isCheckingApplication, setIsCheckingApplication] = useState(true);
  const [formAccess, setFormAccess] = useState({ allowed: true, reason: null, message: "", blockedApplication: null });
  const [isApplicationsClosed, setIsApplicationsClosed] = useState(false);
  const [closedYear, setClosedYear] = useState(new Date().getFullYear());
  const [examplesModalVisible, setExamplesModalVisible] = useState(false);

  const {
    submitting: tertiarySubmitting,
    error: tertiaryError,
    fieldErrors: tertiaryFieldErrors,
    clearFieldError: clearTertiaryFieldError,
    qualificationOutcome: tertiaryQualificationOutcome,
    submitApplication: submitTertiary,
    validateStep: validateTertiaryStep,
    isCheckingGuard: tertiaryIsCheckingGuard,
    ongoingApplication: tertiaryOngoingApplication,
  } = useTertiaryApplication();

  const {
    submitting: staffSubmitting,
    error: staffError,
    fieldErrors: staffFieldErrors,
    clearFieldError: clearStaffFieldError,
    qualificationOutcome: staffQualificationOutcome,
    staffLookupLoading,
    staffLookupMessage,
    submitApplication: submitStaff,
    validateStep: validateStaffStep,
    verifyStaffById,
    isCheckingGuard: staffIsCheckingGuard,
    ongoingApplication: staffOngoingApplication,
  } = useStaffApplication(isChildDesignation);

  const {
    submitting: vocationalSubmitting,
    error: vocationalError,
    fieldErrors: vocationalFieldErrors,
    clearFieldError: clearVocationalFieldError,
    qualificationOutcome: vocationalQualificationOutcome,
    submitApplication: submitVocational,
    validateStep: validateVocationalStep,
    isCheckingGuard: vocationalIsCheckingGuard,
    ongoingApplication: vocationalOngoingApplication,
  } = useVocationalApplication();

  const isEmployeeChildFlow = selectedProgram === "employeeChild";
  const isVocationalFlow = selectedProgram === "vocational";

  // Pick the active set of state based on the current program
  const apiSubmitting =
    selectedProgram === "tertiary" ? tertiarySubmitting :
      isVocationalFlow ? vocationalSubmitting :
        isEmployeeChildFlow ? staffSubmitting : false;

  const apiError =
    selectedProgram === "tertiary" ? tertiaryError :
      isVocationalFlow ? vocationalError :
        isEmployeeChildFlow ? staffError : null;

  const fieldErrors =
    selectedProgram === "tertiary" ? tertiaryFieldErrors :
      isVocationalFlow ? vocationalFieldErrors :
        isEmployeeChildFlow ? staffFieldErrors : {};

  const clearFieldError =
    selectedProgram === "tertiary" ? clearTertiaryFieldError :
      isVocationalFlow ? clearVocationalFieldError :
        clearStaffFieldError;

  const qualificationOutcome =
    selectedProgram === "tertiary" ? tertiaryQualificationOutcome :
      isVocationalFlow ? vocationalQualificationOutcome :
        isEmployeeChildFlow ? staffQualificationOutcome : null;

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

  useEffect(() => {
    let mounted = true;

    const runCheck = async () => {
      try {
        setIsCheckingApplication(true);
        const access = await getScholarshipFormAccess({ program: selectedProgram, option });
        if (!mounted) return;
        setFormAccess(access);

        // Fetch application settings from Supabase (via the backend API)
        let settingsData = null;
        let fetchedFromUrl = null;
        const urlsToTry = [
          "/applications/settings",
          "/applications/status",
          "/scholarships/application-settings",
          "/application-settings",
          "/scholarships/application_settings",
          "/application_settings",
          "/scholarships/status",
          "/status"
        ];

        for (const url of urlsToTry) {
          try {
            console.log(`[Supabase Check] Probing: ${url}...`);
            const res = await api.get(url);
            const data = res.data?.data || res.data;
            if (data && (data.is_open !== undefined || data.isOpen !== undefined)) {
              settingsData = data;
              fetchedFromUrl = url;
              console.log(`[Supabase Check] SUCCESS from ${url}:`, data);
              break;
            }
          } catch (e) {
            console.log(`[Supabase Check] FAILED from ${url}:`, e?.message || e);
          }
        }

        if (settingsData) {
          const isOpen = settingsData.is_open !== undefined ? settingsData.is_open : settingsData.isOpen;
          if (isOpen === false) {
            setIsApplicationsClosed(true);
            setClosedYear(settingsData.year || settingsData.current_year || new Date().getFullYear());
          } else {
            setIsApplicationsClosed(false);
          }
        } else {
          console.warn("[Supabase Check] Could not verify application settings status from any standard endpoint. Defaulting to OPEN.");
          setIsApplicationsClosed(false);
        }
      } catch (err) {
        if (!mounted) return;
      } finally {
        if (mounted) setIsCheckingApplication(false);
      }
    };

    runCheck();

    return () => {
      mounted = false;
    };
  }, []);

  const maxStep = 3;
  const requiresIncomeProof = (status) => ["Employed", "Self-Employed"].includes(status);

  const parseStringToDate = (str) => {
    if (!str) return null;
    const cleaned = String(str).trim();
    if (!cleaned) return null;

    // 1. ISO format (e.g. "YYYY-MM-DD" or with time)
    if (cleaned.includes("-")) {
      const parts = cleaned.split("T")[0].split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          return new Date(y, m - 1, d);
        }
      }
    }

    // 2. Slash format (e.g. "MM/DD/YYYY" or "M/D/YYYY")
    if (cleaned.includes("/")) {
      const parts = cleaned.split("/");
      if (parts.length === 3) {
        const m = parseInt(parts[0], 10);
        const d = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        if (!isNaN(m) && !isNaN(d) && !isNaN(y)) {
          return new Date(y, m - 1, d);
        }
      }
    }

    // 3. Fallback to standard JS parsing
    const fallback = new Date(cleaned);
    return isNaN(fallback.getTime()) ? null : fallback;
  };

  const pickFile = async (key) => {
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
              if (!result.canceled && result.assets?.length > 0) {
                const asset = result.assets[0];
                const file = {
                  name: asset.uri.split('/').pop(),
                  uri: asset.uri,
                  type: asset.mimeType || 'image/jpeg',
                  size: asset.fileSize || 0
                };
                setUploadText((prev) => ({ ...prev, [key]: file }));
                clearFieldError(key);
                clearFieldError("documents");
              }
            } catch (err) {
              console.warn("Image picker error:", err);
            }
          }
        },
        {
          text: "Choose File",
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: [
                  "application/pdf",
                  "application/msword",
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  "image/*"
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
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const updateValue = (key, value) => {
    setValues((prev) => {
      let next = { ...prev, [key]: value };
      if (key === "staffId") {
        if (value === prev.staffId) return prev;
        return {
          ...next,
          staffId: value,
          firstName: "",
          middleName: "",
          lastName: "",
          suffix: "",
          position: "",
        };
      }
      return next;
    });

    if (key === "staffId") {
      setVerifiedStaffId("");
    }

    clearFieldError(key);
  };

  const applyStaffRecordToForm = (record) => {
    const valueOf = (...keys) => {
      for (const key of keys) {
        const value = record?.[key];
        if (value !== undefined && value !== null && String(value).trim() !== "") {
          return String(value).trim();
        }
      }
      return "";
    };

    setValues((prev) => ({
      ...prev,
      firstName: valueOf("first_name", "firstName", "firstname"),
      middleName: valueOf("middle_name", "middleName", "middlename"),
      lastName: valueOf("last_name", "lastName", "lastname"),
      suffix: valueOf("suffix") || "--",
      position:
        valueOf("position", "job_position", "jobPosition", "designation") ||
        prev.position ||
        "--",
    }));
  };

  const lookupAndFillStaff = async (staffId = values.staffId) => {
    const normalizedId = String(staffId || "").trim();
    if (!normalizedId) {
      setVerifiedStaffId("");
      return false;
    }

    const staffRecord = await verifyStaffById(normalizedId);
    if (!staffRecord) {
      setVerifiedStaffId("");
      return false;
    }

    applyStaffRecordToForm(staffRecord);
    setVerifiedStaffId(normalizedId);
    return true;
  };

  useEffect(() => {
    if (selectedProgram !== "employeeChild" || step !== 1) return;

    const normalizedId = String(values.staffId || "").trim();
    if (!normalizedId) {
      setVerifiedStaffId("");
      return;
    }

    const timer = setTimeout(() => {
      if (normalizedId !== verifiedStaffId) {
        lookupAndFillStaff(normalizedId);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [selectedProgram, step, values.staffId, verifiedStaffId]);

  const updateContact = (key, value) => {
    let digits = value.replace(/[^0-9]/g, "");
    // Always enforce "09" prefix
    if (!digits.startsWith("09")) {
      if (digits.startsWith("0")) {
        digits = "09" + digits.slice(1);
      } else {
        digits = "09" + digits;
      }
    }
    // Limit to 11 digits
    setValues((prev) => ({ ...prev, [key]: digits.slice(0, 11) }));
    clearFieldError(key);
  };

  const focusContact = (key) => {
    if (!values[key]) setValues((prev) => ({ ...prev, [key]: "09" }));
  };

  const addFamilyMember = () => {
    setFamilyMembers((prev) => [
      ...prev,
      { name: "", relationship: "", contactNo: "", status: "--", occupation: "", income: "", birthday: "" },
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

  // advance() — validates the current step before moving to the next.
  // Tertiary and Vocational both run server-side + pre-flight validation.
  // EmployeeChild runs staff-specific validation.
  const advance = async () => {
    if (selectedProgram === "tertiary") {
      // Steps 0, 1, 2 validate against server; step 3 is Review with no validate call
      if (step < maxStep) {
        const isValid = await validateTertiaryStep(step, values, uploadText, familyMembers);
        if (isValid) setStep((s) => s + 1);
      }
      return;
    }

    if (isVocationalFlow) {
      // Same step structure as tertiary — steps 0, 1, 2 validate; step 3 is Review
      if (step < maxStep) {
        const isValid = await validateVocationalStep(step, values, uploadText, familyMembers);
        if (isValid) setStep((s) => s + 1);
      }
      return;
    }

    if (selectedProgram === "employeeChild") {
      if (step < maxStep) {
        if (step === 1) {
          if (staffLookupLoading) return;

          const normalizedId = String(values.staffId || "").trim();
          if (!normalizedId || normalizedId !== verifiedStaffId) {
            const lookupOk = await lookupAndFillStaff(normalizedId);
            if (!lookupOk) return;
          }
        }

        const isValid = await validateStaffStep(step, values, uploadText);
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
        await submitTertiary(values, uploadText, familyMembers);
      } else if (isVocationalFlow) {
        await submitVocational(values, uploadText, familyMembers);
      } else if (selectedProgram === "employeeChild") {
        await submitStaff(values, uploadText);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
      setCompleteStage("qualificationReport");
    } catch (err) {
      Alert.alert(
        "Submission Failed",
        err?.message || apiError || "An error occurred.",
        [{ text: "OK", style: "default" }]
      );
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

  const isPredictiveField = (key) => ["program", "vocationalProgram", "prevProgram", "tertiarySchool", "prevSchoolName"].includes(key);

  const renderInput = (label, key, placeholder = null, inputProps = {}) => {
    const isPredictive = isPredictiveField(key);
    const query = values[key] || "";
    const optionsSource =
      key === "vocationalProgram"
        ? vocationalProgramOptions
        : ["tertiarySchool", "prevSchoolName"].includes(key)
          ? heiSchoolNames
          : programOptions;
    const suggestions = isPredictive && query.trim().length >= 1
      ? optionsSource.filter(opt => opt.toLowerCase().includes(query.toLowerCase()))
      : [];

    return (
      <View style={[styles.row, { position: "relative", zIndex: isPredictive && activePredictiveKey === key && suggestions.length > 0 ? 99 : 1 }]}>
        <Text style={styles.label}>{label}</Text>
        <SafeTextInput placeholderTextColor="#888"
          value={values[key]}
          placeholder={placeholder || "Enter " + label}
          onChangeText={(text) => updateValue(key, text)}
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
          {...inputProps}
          style={[styles.input, fieldErrors[key] && styles.errorInput]}
        />
        {isPredictive && activePredictiveKey === key && suggestions.length > 0 && (
          <View style={styles.predictionsContainer}>
            <ScrollView keyboardShouldPersistTaps="handled" style={styles.predictionsScroll}>
              {suggestions.slice(0, 6).map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.predictionItem}
                  onPress={() => {
                    updateValue(key, item);
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

  const renderReadonlyValue = (label, value) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.readonlyField}>
        <Text style={styles.readonlyText}>{value || "--"}</Text>
      </View>
    </View>
  );

  const renderContactInput = (label, key, placeholder = "09XXXXXXXXX") => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <SafeTextInput placeholderTextColor="#888"
        value={values[key]}
        placeholder={placeholder}
        keyboardType="phone-pad"
        maxLength={11}
        onFocus={() => focusContact(key)}
        onChangeText={(text) => updateContact(key, text)}
        style={[styles.input, fieldErrors[key] && styles.errorInput]}
      />
      {fieldErrors[key] && <Text style={styles.errorText}>{fieldErrors[key]}</Text>}
    </View>
  );

  const renderNumericInput = (label, key, placeholder = null) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <SafeTextInput placeholderTextColor="#888"
        value={values[key]}
        placeholder={placeholder || "Enter " + label}
        keyboardType="number-pad"
        onChangeText={(text) => updateValue(key, text.replace(/[^0-9]/g, ""))}
        style={[styles.input, fieldErrors[key] && styles.errorInput]}
      />
      {fieldErrors[key] && <Text style={styles.errorText}>{fieldErrors[key]}</Text>}
    </View>
  );

  const renderYearInput = (label, key, placeholder = "YYYY") => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <SafeTextInput placeholderTextColor="#888"
        value={values[key]}
        placeholder={placeholder}
        keyboardType="number-pad"
        maxLength={4}
        onChangeText={(text) => updateValue(key, text.replace(/[^0-9]/g, ""))}
        style={[styles.input, fieldErrors[key] && styles.errorInput]}
      />
      {fieldErrors[key] && <Text style={styles.errorText}>{fieldErrors[key]}</Text>}
    </View>
  );

  const renderSelect = (label, key, options, customPlaceholder = null) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.pickerInput, fieldErrors[key] && styles.errorInput]}
        onPress={() => openSelect({ type: "value", key, options })}
      >
        <Text style={[styles.pickerText, !values[key] && { color: "#888" }]}>{values[key] || customPlaceholder || `Select ${label}`}</Text>
        <Ionicons name="chevron-down" size={20} color="#5b6095" style={{ flexShrink: 0 }} />
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
        <Text style={[styles.pickerText, !familyMembers[idx]?.[field] && { color: "#888" }]}>{familyMembers[idx]?.[field] || `Select ${label}`}</Text>
        <Ionicons name="chevron-down" size={20} color="#5b6095" style={{ flexShrink: 0 }} />
      </TouchableOpacity>
      {fieldErrors["dynFamily_" + idx + "_" + field] && (
        <Text style={styles.errorText}>{fieldErrors["dynFamily_" + idx + "_" + field]}</Text>
      )}
    </View>
  );

  const renderUpload = (label, key, isHalfWidth = false) => (
    <View style={isHalfWidth ? styles.uploadRowItemHalf : styles.uploadRowItemFull}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        onPress={() => pickFile(key)}
        style={[styles.unifiedUploadContainer, fieldErrors[key] && styles.errorInput]}
      >
        <Ionicons
          name="share-outline"
          size={18}
          color={uploadText[key] ? "#4f5fc5" : "#848baf"}
          style={{ marginRight: 8 }}
        />
        <Text
          style={[
            styles.unifiedUploadText,
            uploadText[key] ? styles.unifiedUploadTextActive : styles.unifiedUploadTextInactive
          ]}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {uploadText[key] ? uploadText[key].name || uploadText[key].fileName || "Selected File" : "No file chosen"}
        </Text>
      </TouchableOpacity>
      {fieldErrors[key] && <Text style={styles.errorText}>{fieldErrors[key]}</Text>}
    </View>
  );

  const renderDatePicker = (label, key, extraProps = {}) => (
    <View style={styles.row}>
      <FormDatePicker
        label={label}
        value={values[key]}
        error={fieldErrors[key]}
        onDateChange={(date) => updateValue(key, date)}
        {...extraProps}
      />
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
            <SafeTextInput placeholderTextColor="#888"
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
            <FormDatePicker
              label="Birthday"
              value={member.birthday}
              error={fieldErrors["dynFamily_" + idx + "_birthday"]}
              onDateChange={(date) => updateFamilyMember(idx, "birthday", date)}
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Relationship</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6, marginBottom: 6 }}>
              {(() => {
                const standardOptions = ["Siblings", "Aunt/Uncle", "Grandparents", "Cousin"];
                const isStandard = standardOptions.includes(member.relationship);
                const isOthersActive = !isStandard && member.relationship !== "";

                return (
                  <>
                    {standardOptions.map((rel) => {
                      const isSelected = member.relationship === rel;
                      return (
                        <TouchableOpacity
                          key={rel}
                          activeOpacity={0.7}
                          onPress={() => updateFamilyMember(idx, "relationship", rel)}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 8,
                            borderWidth: 1.5,
                            borderColor: isSelected ? "#4f5fc5" : "#d7def8",
                            backgroundColor: isSelected ? "rgba(79, 95, 197, 0.08)" : "#fff",
                            marginBottom: 4,
                          }}
                        >
                          <View
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 8,
                              borderWidth: 2,
                              borderColor: isSelected ? "#4f5fc5" : "#848baf",
                              justifyContent: "center",
                              alignItems: "center",
                              marginRight: 8,
                            }}
                          >
                            {isSelected && (
                              <View
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: 4,
                                  backgroundColor: "#4f5fc5",
                                }}
                              />
                            )}
                          </View>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "600",
                              color: isSelected ? "#4f5fc5" : "#5b6095",
                            }}
                          >
                            {rel}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => updateFamilyMember(idx, "relationship", "Others")}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                        borderWidth: 1.5,
                        borderColor: isOthersActive ? "#4f5fc5" : "#d7def8",
                        backgroundColor: isOthersActive ? "rgba(79, 95, 197, 0.08)" : "#fff",
                        marginBottom: 4,
                      }}
                    >
                      <View
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          borderWidth: 2,
                          borderColor: isOthersActive ? "#4f5fc5" : "#848baf",
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 8,
                        }}
                      >
                        {isOthersActive && (
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: "#4f5fc5",
                            }}
                          />
                        )}
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: isOthersActive ? "#4f5fc5" : "#5b6095",
                        }}
                      >
                        Others
                      </Text>
                    </TouchableOpacity>

                    {isOthersActive && (
                      <View style={{ width: "100%", marginTop: 8 }}>
                        <SafeTextInput placeholderTextColor="#888"
                          style={[styles.input, fieldErrors["dynFamily_" + idx + "_relationship"] && styles.errorInput]}
                          value={member.relationship === "Others" ? "" : member.relationship}
                          placeholder="Specify Relationship (e.g. Nephew)"
                          onChangeText={(text) => updateFamilyMember(idx, "relationship", text)}
                        />
                      </View>
                    )}
                  </>
                );
              })()}
            </View>
            {fieldErrors["dynFamily_" + idx + "_relationship"] && (
              <Text style={styles.errorText}>{fieldErrors["dynFamily_" + idx + "_relationship"]}</Text>
            )}
          </View>

          {member.status !== "Deceased" && (
            <View style={styles.row}>
              <Text style={styles.label}>Contact No.</Text>
              <SafeTextInput placeholderTextColor="#888"
                style={[styles.input, fieldErrors["dynFamily_" + idx + "_contactNo"] && styles.errorInput]}
                value={member.contactNo}
                placeholder="09XXXXXXXXX"
                keyboardType="phone-pad"
                maxLength={11}
                onFocus={() => {
                  if (!member.contactNo) updateFamilyMember(idx, "contactNo", "09");
                }}
                onChangeText={(text) => {
                  let digits = text.replace(/[^0-9]/g, "");
                  if (!digits.startsWith("09")) {
                    digits = digits.startsWith("0") ? "09" + digits.slice(1) : "09" + digits;
                  }
                  updateFamilyMember(idx, "contactNo", digits.slice(0, 11));
                }}
              />
              {fieldErrors["dynFamily_" + idx + "_contactNo"] && (
                <Text style={styles.errorText}>{fieldErrors["dynFamily_" + idx + "_contactNo"]}</Text>
              )}
            </View>
          )}

          {renderMemberSelect("Employment Status", "status", idx, ["--", "Employed", "Unemployed", "Self-Employed", "Deceased"])}

          {requiresIncomeProof(member.status) && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Occupation</Text>
                <SafeTextInput placeholderTextColor="#888"
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
                <SafeTextInput placeholderTextColor="#888"
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
          {renderInput("School Name", "secondarySchool", "Enter School Name")}
          {renderSelect("Strand", "strand", [
            "Science, Technology, Engineering and Mathematics (STEM)",
            "Accountancy, Business and Management (ABM)",
            "Humanities and Social Sciences (HUMSS)",
            "General Academic Strand (GAS)",
            "Technical-Vocational Livelihood (TVL)",
            "Information and Communications Technology (ICT)",
            "PRE-K-12 CURRICULUM"
          ])}
          {renderYearInput("Year Graduated", "yearGraduated")}
          {renderInput("Secondary GWA (General Weighted Average)", "secondaryGwa", "e.g. 88.50", { keyboardType: "numeric" })}
          <Text style={{ color: '#6b7280', fontSize: 13, marginTop: -10, marginBottom: 16 }}>Provide your final general average from your high school report card.</Text>
          {values.incomingFreshman === "Yes" && (
            <View style={styles.uploadsGridContainer}>
              {renderUpload("Grade Report", "gradeReport", false)}
              <View style={{ width: "100%" }}>
                <Text style={{ color: '#6b7280', fontSize: 13, marginTop: -6, marginBottom: 16, fontStyle: 'italic' }}>
                  Guide: Please upload your latest grade report. Having a clearly displayed GWA in the report is an advantage.
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.sectionHeader}>| Current Tertiary Education</Text>
          {renderInput("University / College Name", "tertiarySchool", "Enter School Name")}
          {renderInput("Program", "program", "Enter Program")}
          {renderSelect("Term Type", "termType", ["Semester", "Trimester", "Quarter System"])}
          {renderSelect("Grade Scale", "gradeScale", ["1.0 - 5.00 Grading System", "4.00 GPA System"])}
          <Text style={{ color: '#6b7280', fontSize: 13, marginTop: -10, marginBottom: 4 }}>{"Note: Choose the grading system used by your school records to avoid incorrect evaluation."}</Text>
          <TouchableOpacity onPress={() => setExamplesModalVisible(true)} style={{ marginTop: 0, marginBottom: 16 }}>
            <Text style={{ color: "#4f5fc5", fontSize: 13, fontWeight: "600", textDecorationLine: "underline" }}>
              View grading scale examples
            </Text>
          </TouchableOpacity>
          {renderSelect("Year Level", "yearLevel", ["1st", "2nd", "3rd", "4th", "5th"])}
          {renderSelect("Term", "term",
            values.termType === "Quarter System" ? ["1st", "2nd", "3rd", "4th"] :
              values.termType === "Trimester" ? ["1st", "2nd", "3rd"] : ["1st", "2nd"]
          )}
          {renderDatePicker("Term Start Date", "termStartDate")}
          {renderDatePicker("Term End Date", "termEndDate", {
            minimumDate: (() => {
              if (values.termStartDate) {
                const startD = parseStringToDate(values.termStartDate);
                if (startD) {
                  const minEnd = new Date(startD);
                  minEnd.setMonth(minEnd.getMonth() + 1);
                  return minEnd;
                }
              }
              return undefined;
            })()
          })}
          {renderYearInput("Expected Year of Graduation", "expectedGradYear")}

          {values.incomingFreshman === "No" && (
            <>
              {renderInput("Current Tertiary GWA", "tertiaryGwa", "e.g. 1.75 or 88.00", { keyboardType: "numeric" })}
              <Text style={{ color: '#6b7280', fontSize: 13, marginTop: -10, marginBottom: 16 }}>Provide your GWA from your most recent semester/term.</Text>
            </>
          )}

          <View style={styles.uploadsGridContainer}>
            {values.incomingFreshman === "No" && (
              <>
                {renderUpload("Current Term Report Card", "currentTermGradeReport", false)}
                <View style={{ width: "100%" }}>
                  <Text style={{ color: '#6b7280', fontSize: 13, marginTop: -6, marginBottom: 16, fontStyle: 'italic' }}>
                    Guide: Please upload your latest grade report. Having a clearly displayed GWA in the report is an advantage.
                  </Text>
                </View>
              </>
            )}
            {renderUpload("Certificate of Registration", "cor", false)}
          </View>
        </View>
      );
    }

    if (step === 1) {
      return (
        <View>
          <Text style={styles.sectionHeader}>Family Information</Text>

          <TouchableOpacity
            style={[styles.declRow, { backgroundColor: "#f8f9fc", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#dce3f1", marginBottom: 20 }]}
            onPress={() => updateValue("hasGuardian", !values.hasGuardian)}
          >
            <View style={[styles.checkbox, values.hasGuardian && styles.checkboxChecked]}>
              {values.hasGuardian && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#3d4fa0" }}>I have a Guardian (instead of or in addition to parents)</Text>
              <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Check this if you are under the care of a legal guardian. You may still fill in parent information below.</Text>
            </View>
          </TouchableOpacity>

          {fieldErrors.hasGuardian ? (
            <Text style={{ color: "#ef4444", fontSize: 13, fontWeight: "600", marginBottom: 15, marginTop: -10 }}>
              {fieldErrors.hasGuardian}
            </Text>
          ) : null}

          {values.hasGuardian && (
            <View>
              <Text style={styles.sectionHeader}>{"| Guardian's Information"}</Text>
              {renderInput("Guardian's Name", "guardianName", "Enter Guardian's Name")}
              {renderDatePicker("Birthday", "guardianBirthday")}
              {renderSelect("Employment Status", "guardianStatus", ["--", "Employed", "Unemployed", "Self-Employed"])}
              {renderContactInput("Contact Number", "guardianContact")}
              {requiresIncomeProof(values.guardianStatus) && (
                <>
                  {renderInput("Occupation", "guardianOccupation", "Enter Occupation")}
                  {renderNumericInput("Monthly Income", "guardianIncome", "Enter Monthly Income")}
                </>
              )}
            </View>
          )}

          <Text style={styles.sectionHeader}>{"| Father's Information"}{values.hasGuardian ? " (Optional)" : ""}</Text>
          {renderInput("Father's Name", "fatherName", "Enter Father's Name")}
          {renderDatePicker("Birthday", "fatherBirthday")}
          {renderSelect("Employment Status", "fatherStatus", ["--", "Employed", "Unemployed", "Self-Employed", "Deceased"])}
          {values.fatherStatus !== "Deceased" && renderContactInput("Contact Number", "fatherContact")}
          {requiresIncomeProof(values.fatherStatus) && (
            <>
              {renderInput("Occupation", "fatherOccupation", "Enter Occupation")}
              {renderNumericInput("Monthly Income", "fatherIncome", "Enter Monthly Income")}
            </>
          )}

          <Text style={styles.sectionHeader}>{"| Mother's Information"}{values.hasGuardian ? " (Optional)" : ""}</Text>
          {renderInput("Mother's Name", "motherName", "Enter Mother's Name")}
          {renderDatePicker("Birthday", "motherBirthday")}
          {renderSelect("Employment Status", "motherStatus", ["--", "Employed", "Unemployed", "Self-Employed", "Deceased"])}
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
              Upload clear and readable files only. Accepted formats: PDF, PNG, JPEG. Max file size: 10MB each.
            </Text>
          </View>

          <View style={styles.uploadsGridContainer}>
            {renderUpload("Birth Certificate (Applicant)", "birthCert")}
            {renderUpload("Letter of Intent (Applicant)", "letterOfIntentApplicant")}
            {renderUpload("Letter of Intent (Parent)", "letterOfIntentParent")}
            {renderUpload("Recommendation Letter Form (Optional)", "recommendation")}
            {renderUpload("Essay", "essay")}

            {values.hasGuardian && (
              <>
                {requiresIncomeProof(values.guardianStatus)
                  ? renderUpload("Income Certificate (Guardian)", "incomeGuardian")
                  : values.guardianStatus === "Unemployed"
                    ? renderUpload("Certificate of Indigency (Guardian)", "indigencyGuardian")
                    : <View style={{ width: "100%" }}><Text style={styles.skippedDoc}>{"Income/indigency document not required for Guardian (" + values.guardianStatus + ")."}</Text></View>}
              </>
            )}

            {!isFatherEmpty(values) && (
              requiresIncomeProof(values.fatherStatus)
                ? renderUpload("Income Certificate (Father)", "incomeFather")
                : values.fatherStatus === "Unemployed"
                  ? renderUpload("Certificate of Indigency (Father)", "indigencyFather")
                  : <View style={{ width: "100%" }}><Text style={styles.skippedDoc}>{"Income/indigency document not required for Father (" + values.fatherStatus + ")."}</Text></View>
            )}

            {!isMotherEmpty(values) && (
              requiresIncomeProof(values.motherStatus)
                ? renderUpload("Income Certificate (Mother)", "incomeMother")
                : values.motherStatus === "Unemployed"
                  ? renderUpload("Certificate of Indigency (Mother)", "indigencyMother")
                  : <View style={{ width: "100%" }}><Text style={styles.skippedDoc}>{"Income/indigency document not required for Mother (" + values.motherStatus + ")."}</Text></View>
            )}

            {familyMembers.map((member, idx) => {
              if (requiresIncomeProof(member.status)) {
                return (
                  <View key={"member-doc-inc-" + idx} style={{ width: "100%" }}>
                    {renderUpload("Income Certificate (" + (member.name || "Family Member " + (idx + 1)) + ")", "incomeMember_" + idx, false)}
                  </View>
                );
              }
              if (member.status === "Unemployed") {
                return (
                  <View key={"member-doc-ind-" + idx} style={{ width: "100%" }}>
                    {renderUpload("Certificate of Indigency (" + (member.name || "Family Member " + (idx + 1)) + ")", "indigencyMember_" + idx, false)}
                  </View>
                );
              }
              return null;
            })}
          </View>
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
          {renderSelect("Scholarship type", "scholarshipType", [
            "TECHNICAL EDUCATION AND SKILLS DEVELOPMENT AUTHORITY (TESDA)",
            "DUALTECH (DUALTECH IN FOCUS)"
          ], "TECHNICAL EDUCATION AND SKILLS DEVELOPMENT AUTHORITY (TESDA)")}


          <Text style={styles.sectionHeader}>| Secondary Education</Text>
          {renderInput("School Name", "secondarySchool", "Enter School Name")}
          {renderSelect("Strand", "strand", [
            "Science, Technology, Engineering and Mathematics (STEM)",
            "Accountancy, Business and Management (ABM)",
            "Humanities and Social Sciences (HUMSS)",
            "General Academic Strand (GAS)",
            "Technical-Vocational Livelihood (TVL)",
            "Information and Communications Technology (ICT)",
            "PRE-K-12 CURRICULUM"
          ])}
          {renderYearInput("Year Graduated", "yearGraduated")}
          {renderInput("Secondary GWA (General Weighted Average)", "secondaryGwa", "e.g. 88.50", { keyboardType: "numeric" })}
          <Text style={{ color: '#6b7280', fontSize: 13, marginTop: -10, marginBottom: 16 }}>Provide your final general average from your high school report card.</Text>
          <View style={styles.uploadsGridContainer}>
            {renderUpload("Grade Report", "gradeReport", false)}
            <View style={{ width: "100%" }}>
              <Text style={{ color: '#6b7280', fontSize: 13, marginTop: -6, marginBottom: 16, fontStyle: 'italic' }}>
                Guide: Please upload your latest grade report. Having a clearly displayed GWA in the report is an advantage.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>| Vocational/Technical Education</Text>
          {renderInput("School Name", "vocationalSchoolName", "Enter School Name")}
          {renderInput("Program", "vocationalProgram", "Enter Program")}
          {renderSelect("Course Duration", "courseDuration", ["3 months", "6 months", "9 months", "12 months", "18 months", "24 months"])}
          {renderDatePicker("Completion Date", "completionDate")}
          <View style={styles.uploadsGridContainer}>
            {renderUpload("Certificate of Registration", "cor", false)}
          </View>
        </View>
      );
    }

    if (step === 1) {
      return (
        <View>
          <Text style={styles.sectionHeader}>Family Information</Text>

          <TouchableOpacity
            style={[styles.declRow, { backgroundColor: "#f8f9fc", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#dce3f1", marginBottom: 20 }]}
            onPress={() => updateValue("hasGuardian", !values.hasGuardian)}
          >
            <View style={[styles.checkbox, values.hasGuardian && styles.checkboxChecked]}>
              {values.hasGuardian && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#3d4fa0" }}>I have a Guardian (instead of or in addition to parents)</Text>
              <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Check this if you are under the care of a legal guardian. You may still fill in parent information below.</Text>
            </View>
          </TouchableOpacity>

          {fieldErrors.hasGuardian ? (
            <Text style={{ color: "#ef4444", fontSize: 13, fontWeight: "600", marginBottom: 15, marginTop: -10 }}>
              {fieldErrors.hasGuardian}
            </Text>
          ) : null}

          {values.hasGuardian && (
            <View>
              <Text style={styles.sectionHeader}>{"| Guardian's Information"}</Text>
              {renderInput("Guardian's Name", "guardianName", "Enter Guardian's Name")}
              {renderDatePicker("Birthday", "guardianBirthday")}
              {renderSelect("Employment Status", "guardianStatus", ["--", "Employed", "Unemployed", "Self-Employed"])}
              {renderContactInput("Contact Number", "guardianContact")}
              {requiresIncomeProof(values.guardianStatus) && (
                <>
                  {renderInput("Occupation", "guardianOccupation", "Enter Occupation")}
                  {renderNumericInput("Monthly Income", "guardianIncome", "Enter Monthly Income")}
                </>
              )}
            </View>
          )}

          <Text style={styles.sectionHeader}>{"| Father's Information"}{values.hasGuardian ? " (Optional)" : ""}</Text>
          {renderInput("Father's Name", "fatherName", "Enter Father's Name")}
          {renderDatePicker("Birthday", "fatherBirthday")}
          {renderSelect("Employment Status", "fatherStatus", ["--", "Employed", "Unemployed", "Self-Employed", "Deceased"])}
          {values.fatherStatus !== "Deceased" && renderContactInput("Contact Number", "fatherContact")}
          {requiresIncomeProof(values.fatherStatus) && (
            <>
              {renderInput("Occupation", "fatherOccupation", "Enter Occupation")}
              {renderNumericInput("Monthly Income", "fatherIncome", "Enter Monthly Income")}
            </>
          )}

          <Text style={styles.sectionHeader}>{"| Mother's Information"}{values.hasGuardian ? " (Optional)" : ""}</Text>
          {renderInput("Mother's Name", "motherName", "Enter Mother's Name")}
          {renderDatePicker("Birthday", "motherBirthday")}
          {renderSelect("Employment Status", "motherStatus", ["--", "Employed", "Unemployed", "Self-Employed", "Deceased"])}
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
              Upload clear and readable files only. Accepted formats: PDF, DOC, DOCX. Max file size: 5MB each.
            </Text>
          </View>

          <View style={styles.uploadsGridContainer}>
            {renderUpload("Birth Certificate (Applicant)", "birthCert")}
            {renderUpload("Letter of Intent (Applicant)", "letterOfIntentApplicant")}
            {renderUpload("Letter of Intent (Parent)", "letterOfIntentParent")}
            {renderUpload("Recommendation Letter Form (Optional)", "recommendation")}
            {renderUpload("Essay", "essay")}

            {values.hasGuardian && (
              <>
                {requiresIncomeProof(values.guardianStatus)
                  ? renderUpload("Income Certificate (Guardian)", "incomeGuardian")
                  : values.guardianStatus === "Unemployed"
                    ? renderUpload("Certificate of Indigency (Guardian)", "indigencyGuardian")
                    : <View style={{ width: "100%" }}><Text style={styles.skippedDoc}>{"Income/indigency document not required for Guardian (" + values.guardianStatus + ")."}</Text></View>}
              </>
            )}

            {!isFatherEmpty(values) && (
              requiresIncomeProof(values.fatherStatus)
                ? renderUpload("Income Certificate (Father)", "incomeFather")
                : values.fatherStatus === "Unemployed"
                  ? renderUpload("Certificate of Indigency (Father)", "indigencyFather")
                  : <View style={{ width: "100%" }}><Text style={styles.skippedDoc}>{"Income/indigency document not required for Father (" + values.fatherStatus + ")."}</Text></View>
            )}

            {!isMotherEmpty(values) && (
              requiresIncomeProof(values.motherStatus)
                ? renderUpload("Income Certificate (Mother)", "incomeMother")
                : values.motherStatus === "Unemployed"
                  ? renderUpload("Certificate of Indigency (Mother)", "indigencyMother")
                  : <View style={{ width: "100%" }}><Text style={styles.skippedDoc}>{"Income/indigency document not required for Mother (" + values.motherStatus + ")."}</Text></View>
            )}

            {familyMembers.map((member, idx) => {
              if (requiresIncomeProof(member.status)) {
                return (
                  <View key={"member-doc-inc-" + idx} style={{ width: "100%" }}>
                    {renderUpload("Income Certificate (" + (member.name || "Family Member " + (idx + 1)) + ")", "incomeMember_" + idx, false)}
                  </View>
                );
              }
              if (member.status === "Unemployed") {
                return (
                  <View key={"member-doc-ind-" + idx} style={{ width: "100%" }}>
                    {renderUpload("Certificate of Indigency (" + (member.name || "Family Member " + (idx + 1)) + ")", "indigencyMember_" + idx, false)}
                  </View>
                );
              }
              return null;
            })}
          </View>
        </View>
      );
    }

    return renderReview();
  };

  const renderEmployeeChildFlow = () => {
    const isMasters = !isChildDesignation && String(values.educPath).toLowerCase().includes("masters");

    if (step === 0) {
      return (
        <View>
          <Text style={styles.sectionHeader}>Academic Information</Text>
          {!isChildDesignation && renderSelect("Education Path", "educPath", ["Tertiary Education", "Masters Education"])}
          {renderSelect("Incoming Freshman?", "incomingFreshman", ["No", "Yes"])}

          <Text style={styles.sectionHeader}>| Secondary Education</Text>
          {renderInput("School Name", "secondarySchool", "Enter School Name")}
          {renderSelect("Strand", "strand", [
            "Science, Technology, Engineering and Mathematics (STEM)",
            "Accountancy, Business and Management (ABM)",
            "Humanities and Social Sciences (HUMSS)",
            "General Academic Strand (GAS)",
            "Technical-Vocational Livelihood (TVL)",
            "Information and Communications Technology (ICT)",
            "PRE-K-12 CURRICULUM"
          ])}
          {renderYearInput("Year Graduated", "yearGraduated")}
          {!isMasters && (
            <>
              {renderInput("Secondary GWA (General Weighted Average)", "secondaryGwa", "e.g. 88.50", { keyboardType: "numeric" })}
              <Text style={{ color: '#6b7280', fontSize: 13, marginTop: -10, marginBottom: 16 }}>Provide your final general average from your high school report card.</Text>
            </>
          )}
          {values.incomingFreshman === "Yes" && !isMasters && (
            <>
              {renderUpload("Grade Report", "gradeReport")}
              <Text style={{ color: '#6b7280', fontSize: 13, marginTop: -10, marginBottom: 16, fontStyle: 'italic' }}>
                Guide: Please upload your latest grade report. Having a clearly displayed GWA in the report is an advantage.
              </Text>
            </>
          )}

          {isMasters && (
            <>
              <Text style={styles.sectionHeader}>| Previous Tertiary Education</Text>
              {renderInput("Previous School Name", "prevSchoolName", "Enter Previous School Name")}
              {renderInput("Previous Program", "prevProgram", "Enter Previous Program")}
              {renderYearInput("Previous Year Graduated", "prevYearGraduated")}
              {renderInput("Previous Tertiary GWA", "prevGwa", "e.g. 1.75 or 88.50", { keyboardType: "numeric" })}
              <Text style={{ color: '#6b7280', fontSize: 13, marginTop: -10, marginBottom: 16 }}>Provide the GWA from your previous tertiary transcript.</Text>
              {values.incomingFreshman === "Yes" && (
                <>
                  {renderSelect("Grade Scale", "prevGradeScale", ["1.0 - 5.00 Grading System", "4.00 GPA System"])}
                  <TouchableOpacity onPress={() => setExamplesModalVisible(true)} style={{ marginTop: -10, marginBottom: 14 }}>
                    <Text style={{ color: "#4f5fc5", fontSize: 13, fontWeight: "600", textDecorationLine: "underline" }}>
                      View grading scale examples
                    </Text>
                  </TouchableOpacity>
                  {renderUpload("Grade Report", "gradeReport")}
                  <Text style={{ color: '#6b7280', fontSize: 13, marginTop: -10, marginBottom: 16, fontStyle: 'italic' }}>
                    Guide: Please upload your final grade report for the previous tertiary program.
                  </Text>
                </>
              )}
            </>
          )}

          <Text style={styles.sectionHeader}>
            {isMasters ? "| Current Masters Education" : "| Current Tertiary Education"}
          </Text>
          {renderInput("University / College Name", "tertiarySchool", "Enter School Name")}
          {renderInput("Program", "program", "Enter Program")}
          {renderSelect("Term Type", "termType", ["Semester", "Trimester", "Quarter System"])}
          {renderSelect("Grade Scale", "gradeScale", ["1.0 - 5.00 Grading System", "4.00 GPA System"])}
          <Text style={{ color: '#6b7280', fontSize: 13, marginTop: -10, marginBottom: 4 }}>{"Note: Choose the grading system used by your school records to avoid incorrect evaluation."}</Text>
          <TouchableOpacity onPress={() => setExamplesModalVisible(true)} style={{ marginTop: 0, marginBottom: 16 }}>
            <Text style={{ color: "#4f5fc5", fontSize: 13, fontWeight: "600", textDecorationLine: "underline" }}>
              View grading scale examples
            </Text>
          </TouchableOpacity>
          {renderSelect("Year Level", "yearLevel", ["1st", "2nd", "3rd", "4th", "5th"])}
          {renderSelect("Term", "term",
            values.termType === "Quarter System" ? ["1st", "2nd", "3rd", "4th"] :
              values.termType === "Trimester" ? ["1st", "2nd", "3rd"] : ["1st", "2nd"]
          )}
          {renderDatePicker("Term Start Date", "termStartDate")}
          {renderDatePicker("Term End Date", "termEndDate", {
            minimumDate: (() => {
              if (values.termStartDate) {
                const startD = parseStringToDate(values.termStartDate);
                if (startD) {
                  const minEnd = new Date(startD);
                  minEnd.setMonth(minEnd.getMonth() + 1);
                  return minEnd;
                }
              }
              return undefined;
            })()
          })}
          {renderYearInput("Expected Year of Graduation", "expectedGradYear")}

          {values.incomingFreshman === "No" && (
            <>
              {renderInput(isMasters ? "Current Masters GWA" : "Current Tertiary GWA", "tertiaryGwa", "e.g. 1.75 or 88.00", { keyboardType: "numeric" })}
              <Text style={{ color: '#6b7280', fontSize: 13, marginTop: -10, marginBottom: 16 }}>
                {isMasters ? "Provide your GWA from your most recent masters semester/term." : "Provide your GWA from your most recent semester/term."}
              </Text>
            </>
          )}

          <View style={styles.uploadsGridContainer}>
            {renderUpload("Certificate of Registration", "cor")}
            {values.incomingFreshman === "No" && (
              <>
                {renderUpload("Current Term Report Card", "currentTermGradeReport")}
                <View style={{ width: "100%" }}>
                  <Text style={{ color: '#6b7280', fontSize: 13, marginTop: -6, marginBottom: 16, fontStyle: 'italic' }}>
                    Guide: Please upload your latest grade report. Having a clearly displayed GWA in the report is an advantage.
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      );
    }

    if (step === 1) {
      return (
        <View>
          <Text style={styles.sectionHeader}>| Staff Details</Text>
          {renderInput("Staff ID", "staffId", "Enter Staff ID", {
            autoCapitalize: "characters",
            autoCorrect: false,
            onBlur: () => lookupAndFillStaff(values.staffId),
          })}
          {!fieldErrors.staffId && !!staffLookupMessage && (
            <Text style={[styles.lookupStatus, staffLookupLoading ? styles.lookupStatusBusy : styles.lookupStatusOk]}>
              {staffLookupLoading ? "Looking up staff record..." : staffLookupMessage}
            </Text>
          )}
          {renderReadonlyValue("First Name", values.firstName)}
          {renderReadonlyValue("Middle Name", values.middleName)}
          {renderReadonlyValue("Last Name", values.lastName)}
          {renderReadonlyValue("Suffix", values.suffix)}
          {renderReadonlyValue("Position", values.position)}
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

          <View style={styles.uploadsGridContainer}>
            {renderUpload("Birth Certificate (Applicant)", "birthCert")}
            {renderUpload(
              isChildDesignation ? "Letter of Intent (Applicant)" : "Letter of Intent",
              "letterOfIntentApplicant"
            )}
            {isChildDesignation && renderUpload("Letter of Intent (Parent)", "letterOfIntentParent")}
          </View>
        </View>
      );
    }

    return renderReview();
  };

  const renderReviewSection = (title, icon, items) => (
    <View style={styles.newReviewSection}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionIconWrapper}>
          <Ionicons name={icon} size={18} color="#3d4076" />
        </View>
        <Text style={styles.newReviewHeading}>{title}</Text>
      </View>
      <View style={styles.newReviewCard}>
        {items.map((item, idx) => (
          <React.Fragment key={idx}>
            <View style={styles.reviewDataRow}>
              <View style={styles.reviewRowIconWrapper}>
                <Ionicons name={item.icon || "receipt-outline"} size={16} color="#5b6095" />
              </View>
              <View style={styles.reviewDataContent}>
                <Text style={styles.reviewLabel}>{item.label}</Text>
                <Text style={styles.reviewValue}>
                  {item.value === "Attached" ? "Uploaded" : item.value === "Not Attached" ? "Not Uploaded" : item.value || "-"}
                </Text>
              </View>
            </View>
            {idx < items.length - 1 && <View style={styles.reviewDivider} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );

  const renderReview = () => {
    const familyItems = [];

    // Guardian (highest priority, only if hasGuardian is true and guardianName is entered)
    if (values.hasGuardian && values.guardianName && values.guardianName.trim() !== "") {
      familyItems.push(
        { label: "Guardian's Name", value: values.guardianName, icon: "person-outline" },
        { label: "Guardian Status", value: values.guardianStatus, icon: "information-circle-outline" },
        ...(requiresIncomeProof(values.guardianStatus) ? [
          { label: "Guardian Income", value: values.guardianIncome, icon: "cash-outline" }
        ] : [])
      );
    }

    // Father (only if fatherName is entered)
    if (values.fatherName && values.fatherName.trim() !== "") {
      familyItems.push(
        { label: "Father's Name", value: values.fatherName, icon: "man-outline" },
        { label: "Father Status", value: values.fatherStatus, icon: "information-circle-outline" },
        ...(values.fatherStatus !== "Deceased" && requiresIncomeProof(values.fatherStatus) ? [
          { label: "Father Income", value: values.fatherIncome, icon: "cash-outline" }
        ] : [])
      );
    }

    // Mother (only if motherName is entered)
    if (values.motherName && values.motherName.trim() !== "") {
      familyItems.push(
        { label: "Mother's Name", value: values.motherName, icon: "woman-outline" },
        { label: "Mother Status", value: values.motherStatus, icon: "information-circle-outline" },
        ...(values.motherStatus !== "Deceased" && requiresIncomeProof(values.motherStatus) ? [
          { label: "Mother Income", value: values.motherIncome, icon: "cash-outline" }
        ] : [])
      );
    }

    // Dynamic family members
    const hasCoreFamilyData =
      (values.hasGuardian && values.guardianName && values.guardianName.trim() !== "") ||
      (values.fatherName && values.fatherName.trim() !== "") ||
      (values.motherName && values.motherName.trim() !== "");

    if (hasCoreFamilyData) {
      familyMembers.forEach((member, idx) => {
        familyItems.push({
          label: `Family Member ${idx + 1} (${member.name || 'Unnamed'})`,
          value: `${member.relationship} - ${member.status}`,
          icon: "person-outline"
        });
      });
    }

    return (
      <View style={{ paddingBottom: 20 }}>
        <Text style={styles.sectionTitle}>Review Information</Text>
        <Text style={styles.sectionSubtitle}>Please double-check all details below before submitting your application.</Text>

        {selectedProgram === "tertiary" && (
          <>
            {renderReviewSection("Scholarship Fund Details", "card-outline", [
              { label: "Scholarship Type", value: values.scholarshipType, icon: "ribbon-outline" },
              { label: "Incoming Freshman", value: values.incomingFreshman, icon: "sparkles-outline" },
            ])}

            {renderReviewSection("Secondary Education", "school-outline", [
              { label: "High School Name", value: values.secondarySchool, icon: "business-outline" },
              { label: "Strand", value: values.strand, icon: "bookmarks-outline" },
              { label: "Year Graduated", value: values.yearGraduated, icon: "calendar-outline" },
              { label: "Secondary GWA", value: values.secondaryGwa, icon: "analytics-outline" },
            ])}

            {renderReviewSection("Tertiary Education Information", "medal-outline", [
              { label: "University / College", value: values.tertiarySchool, icon: "location-outline" },
              { label: "Degree Program", value: values.program, icon: "school-outline" },
              { label: "Current Year Level", value: values.yearLevel, icon: "layers-outline" },
              { label: "Term System", value: values.term, icon: "time-outline" },
              { label: "Term Start Date", value: values.termStartDate, icon: "calendar-outline" },
              { label: "Term End Date", value: values.termEndDate, icon: "calendar-outline" },
              { label: "Expected Graduation Year", value: values.expectedGradYear, icon: "calendar-outline" },
              ...(values.incomingFreshman === "No" ? [{ label: "Tertiary GWA", value: values.tertiaryGwa, icon: "analytics-outline" }] : []),
            ])}

            {familyItems.length > 0 && renderReviewSection("Family / Guardian Information", "people-outline", familyItems)}

            {renderReviewSection("Supporting Documents", "document-text-outline", [
              ...(values.incomingFreshman === "Yes" ? [
                { label: "Grade Report", value: uploadText.gradeReport ? "Attached" : "Not Attached", icon: uploadText.gradeReport ? "checkmark-circle" : "close-circle" }
              ] : []),
              { label: "Certificate of Registration", value: uploadText.cor ? "Attached" : "Not Attached", icon: uploadText.cor ? "checkmark-circle" : "close-circle" },
              ...(values.incomingFreshman === "No" ? [
                { label: "Current Term Report Card", value: uploadText.currentTermGradeReport ? "Attached" : "Not Attached", icon: uploadText.currentTermGradeReport ? "checkmark-circle" : "close-circle" }
              ] : []),
              { label: "Certificate of Indigency", value: uploadText.indigency ? "Attached" : "Not Attached", icon: uploadText.indigency ? "checkmark-circle" : "close-circle" },
              { label: "Birth Certificate", value: uploadText.birthCert ? "Attached" : "Not Attached", icon: uploadText.birthCert ? "checkmark-circle" : "close-circle" },
              ...(values.hasGuardian ? [
                ...(requiresIncomeProof(values.guardianStatus) ? [
                  { label: "Income Certificate (Guardian)", value: uploadText.incomeGuardian ? "Attached" : "Not Attached", icon: uploadText.incomeGuardian ? "checkmark-circle" : "close-circle" }
                ] : values.guardianStatus === "Unemployed" ? [
                  { label: "Certificate of Indigency (Guardian)", value: uploadText.indigencyGuardian ? "Attached" : "Not Attached", icon: uploadText.indigencyGuardian ? "checkmark-circle" : "close-circle" }
                ] : [])
              ] : []),
              ...(requiresIncomeProof(values.fatherStatus) ? [
                { label: "Income Certificate (Father)", value: uploadText.incomeFather ? "Attached" : "Not Attached", icon: uploadText.incomeFather ? "checkmark-circle" : "close-circle" }
              ] : values.fatherStatus === "Unemployed" ? [
                { label: "Indigency (Father)", value: uploadText.indigencyFather ? "Attached" : "Not Attached", icon: uploadText.indigencyFather ? "checkmark-circle" : "close-circle" }
              ] : []),
              ...(requiresIncomeProof(values.motherStatus) ? [
                { label: "Income Certificate (Mother)", value: uploadText.incomeMother ? "Attached" : "Not Attached", icon: uploadText.incomeMother ? "checkmark-circle" : "close-circle" }
              ] : values.motherStatus === "Unemployed" ? [
                { label: "Indigency (Mother)", value: uploadText.indigencyMother ? "Attached" : "Not Attached", icon: uploadText.indigencyMother ? "checkmark-circle" : "close-circle" }
              ] : []),
              ...familyMembers.filter(m => requiresIncomeProof(m.status) || m.status === "Unemployed").map((member, idx) => {
                const isUnemp = member.status === "Unemployed";
                const key = isUnemp ? `indigencyMember_${idx}` : `incomeMember_${idx}`;
                const label = isUnemp ? `Indigency Certificate (${member.name || `Member ${idx + 1}`})` : `Income Certificate (${member.name || `Member ${idx + 1}`})`;
                return {
                  label,
                  value: uploadText[key] ? "Attached" : "Not Attached",
                  icon: uploadText[key] ? "checkmark-circle" : "close-circle"
                };
              }),
              { label: "Recommendation Letter Form (Optional)", value: uploadText.recommendation ? "Attached" : "Not Attached", icon: uploadText.recommendation ? "checkmark-circle" : "close-circle" },
              { label: "Personal Essay", value: uploadText.essay ? "Attached" : "Not Attached", icon: uploadText.essay ? "checkmark-circle" : "close-circle" },
              { label: "Letter of Intent (Applicant)", value: uploadText.letterOfIntentApplicant ? "Attached" : "Not Attached", icon: uploadText.letterOfIntentApplicant ? "checkmark-circle" : "close-circle" },
              { label: "Letter of Intent (Parent)", value: uploadText.letterOfIntentParent ? "Attached" : "Not Attached", icon: uploadText.letterOfIntentParent ? "checkmark-circle" : "close-circle" },
            ])}
          </>
        )}

        {selectedProgram === "vocational" && (
          <>
            {renderReviewSection("Program Assignment", "construct-outline", [
              { label: "Scholarship Type", value: values.scholarshipType, icon: "ribbon-outline" },
              { label: "Incoming Freshman", value: values.incomingFreshman, icon: "sparkles-outline" },
            ])}
            {renderReviewSection("Educational History", "school-outline", [
              { label: "HS School Name", value: values.secondarySchool, icon: "business-outline" },
              { label: "Strand / Track", value: values.strand, icon: "bookmarks-outline" },
              { label: "Year Graduated", value: values.yearGraduated, icon: "calendar-outline" },
            ])}
            {renderReviewSection("Vocational Details", "flask-outline", [
              { label: "Technical School", value: values.vocationalSchoolName, icon: "business-outline" },
              { label: "Technical Program", value: values.vocationalProgram, icon: "list-outline" },
              { label: "Course Duration", value: values.courseDuration, icon: "time-outline" },
              { label: "Completion Date", value: values.completionDate, icon: "calendar-outline" },
            ])}
            {familyItems.length > 0 && renderReviewSection("Family / Guardian Information", "people-outline", familyItems)}

            {renderReviewSection("Supporting Documents", "document-text-outline", [
              ...(values.incomingFreshman === "Yes" ? [
                { label: "Grade Report", value: uploadText.gradeReport ? "Attached" : "Not Attached", icon: uploadText.gradeReport ? "checkmark-circle" : "close-circle" }
              ] : []),
              { label: "Certificate of Registration", value: uploadText.cor ? "Attached" : "Not Attached", icon: uploadText.cor ? "checkmark-circle" : "close-circle" },
              { label: "Certificate of Indigency", value: uploadText.indigency ? "Attached" : "Not Attached", icon: uploadText.indigency ? "checkmark-circle" : "close-circle" },
              { label: "Birth Certificate", value: uploadText.birthCert ? "Attached" : "Not Attached", icon: uploadText.birthCert ? "checkmark-circle" : "close-circle" },
              ...(requiresIncomeProof(values.fatherStatus) ? [
                { label: "Income Certificate (Father)", value: uploadText.incomeFather ? "Attached" : "Not Attached", icon: uploadText.incomeFather ? "checkmark-circle" : "close-circle" }
              ] : values.fatherStatus === "Unemployed" ? [
                { label: "Indigency (Father)", value: uploadText.indigencyFather ? "Attached" : "Not Attached", icon: uploadText.indigencyFather ? "checkmark-circle" : "close-circle" }
              ] : []),
              ...(requiresIncomeProof(values.motherStatus) ? [
                { label: "Income Certificate (Mother)", value: uploadText.incomeMother ? "Attached" : "Not Attached", icon: uploadText.incomeMother ? "checkmark-circle" : "close-circle" }
              ] : values.motherStatus === "Unemployed" ? [
                { label: "Indigency (Mother)", value: uploadText.indigencyMother ? "Attached" : "Not Attached", icon: uploadText.indigencyMother ? "checkmark-circle" : "close-circle" }
              ] : []),
              ...familyMembers.filter(m => requiresIncomeProof(m.status) || m.status === "Unemployed").map((member, idx) => {
                const isUnemp = member.status === "Unemployed";
                const key = isUnemp ? `indigencyMember_${idx}` : `incomeMember_${idx}`;
                const label = isUnemp ? `Indigency Certificate (${member.name || `Member ${idx + 1}`})` : `Income Certificate (${member.name || `Member ${idx + 1}`})`;
                return {
                  label,
                  value: uploadText[key] ? "Attached" : "Not Attached",
                  icon: uploadText[key] ? "checkmark-circle" : "close-circle"
                };
              }),
              { label: "Recommendation Letter Form (Optional)", value: uploadText.recommendation ? "Attached" : "Not Attached", icon: uploadText.recommendation ? "checkmark-circle" : "close-circle" },
              { label: "Essay", value: uploadText.essay ? "Attached" : "Not Attached", icon: uploadText.essay ? "checkmark-circle" : "close-circle" },
              { label: "Letter of Intent (Applicant)", value: uploadText.letterOfIntentApplicant ? "Attached" : "Not Attached", icon: uploadText.letterOfIntentApplicant ? "checkmark-circle" : "close-circle" },
              { label: "Letter of Intent (Parent)", value: uploadText.letterOfIntentParent ? "Attached" : "Not Attached", icon: uploadText.letterOfIntentParent ? "checkmark-circle" : "close-circle" },
            ])}
          </>
        )}

        {selectedProgram === "employeeChild" && (() => {
          const isMasters = !isChildDesignation && String(values.educPath).toLowerCase().includes("masters");
          return (
            <>
              {renderReviewSection("Academic Information", "school-outline", [
                ...(!isChildDesignation ? [{ label: "Education Path", value: values.educPath, icon: "map-outline" }] : []),
                { label: "Incoming Freshman", value: values.incomingFreshman, icon: "sparkles-outline" },
                ...(isMasters ? [
                  { label: "Previous School Name", value: values.prevSchoolName, icon: "business-outline" },
                  { label: "Previous Program", value: values.prevProgram, icon: "school-outline" },
                  { label: "Previous Year Graduated", value: values.prevYearGraduated, icon: "calendar-outline" },
                  { label: "Previous Tertiary GWA", value: values.prevGwa, icon: "analytics-outline" },
                  ...(values.incomingFreshman === "Yes" ? [
                    { label: "Grade Scale", value: values.prevGradeScale, icon: "ribbon-outline" },
                  ] : []),
                ] : [
                  { label: "Secondary School", value: values.secondarySchool, icon: "business-outline" },
                  { label: "Strand", value: values.strand, icon: "bookmarks-outline" },
                  { label: "Year Graduated", value: values.yearGraduated, icon: "calendar-outline" },
                  ...(values.incomingFreshman === "Yes" ? [{ label: "Secondary GWA", value: values.secondaryGwa, icon: "analytics-outline" }] : []),
                ]),
                { label: isMasters ? "University / College Name" : "Tertiary School", value: values.tertiarySchool, icon: "location-outline" },
                { label: "Program", value: values.program, icon: "school-outline" },
                { label: "Term Type", value: values.termType, icon: "receipt-outline" },
                { label: "Grade Scale", value: values.gradeScale, icon: "ribbon-outline" },
                { label: "Year Level", value: values.yearLevel, icon: "ribbon-outline" },
                { label: "Term", value: values.term, icon: "time-outline" },
                { label: "Term Start Date", value: values.termStartDate, icon: "calendar-outline" },
                { label: "Term End Date", value: values.termEndDate, icon: "calendar-outline" },
                { label: "Expected Graduation Year", value: values.expectedGradYear, icon: "calendar-outline" },
                ...(values.incomingFreshman === "No" ? [{ label: isMasters ? "Current Masters GWA" : "Current GWA", value: values.tertiaryGwa, icon: "analytics-outline" }] : []),
              ])}
              {renderReviewSection("Staff Information", "id-card-outline", [
                { label: "Staff ID", value: values.staffId, icon: "barcode-outline" },
                { label: "First Name", value: values.firstName, icon: "person-outline" },
                { label: "Middle Name", value: values.middleName || "--", icon: "person-outline" },
                { label: "Last Name", value: values.lastName, icon: "person-outline" },
                { label: "Suffix", value: values.suffix || "--", icon: "person-outline" },
                { label: "Position", value: values.position, icon: "briefcase-outline" },
              ])}
              {renderReviewSection("Supporting Documents", "document-text-outline", [
                ...(values.incomingFreshman === "Yes" ? [
                  {
                    label: isMasters ? "Previous Tertiary Grade Report" : "Grade Report",
                    value: uploadText.gradeReport ? "Attached" : "Not Attached",
                    icon: uploadText.gradeReport ? "checkmark-circle" : "close-circle"
                  }
                ] : []),
                { label: "Certificate of Registration", value: uploadText.cor ? "Attached" : "Not Attached", icon: uploadText.cor ? "checkmark-circle" : "close-circle" },
                { label: "Birth Certificate (Applicant)", value: uploadText.birthCert ? "Attached" : "Not Attached", icon: uploadText.birthCert ? "checkmark-circle" : "close-circle" },
                ...(values.incomingFreshman === "No" ? [
                  {
                    label: "Current Term Report Card",
                    value: uploadText.currentTermGradeReport ? "Attached" : "Not Attached",
                    icon: uploadText.currentTermGradeReport ? "checkmark-circle" : "close-circle"
                  }
                ] : []),
                {
                  label: isChildDesignation ? "Letter of Intent (Applicant)" : "Letter of Intent",
                  value: uploadText.letterOfIntentApplicant ? "Attached" : "Not Attached",
                  icon: uploadText.letterOfIntentApplicant ? "checkmark-circle" : "close-circle"
                },
                ...(isChildDesignation ? [
                  {
                    label: "Letter of Intent (Parent)",
                    value: uploadText.letterOfIntentParent ? "Attached" : "Not Attached",
                    icon: uploadText.letterOfIntentParent ? "checkmark-circle" : "close-circle"
                  }
                ] : []),
              ])}
            </>
          );
        })()}

        <View style={styles.premiumReviewCard}>
          <View style={styles.declarationHeader}>
            <Ionicons name="document-text-outline" size={20} color="#3d4fa0" />
            <Text style={styles.declarationTitle}>Declaration & Agreement</Text>
          </View>

          <View style={styles.declarationItems}>
            <View style={styles.declRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setDeclarations((d) => {
                  const nextVal = !d.agree1;
                  return { agree1: nextVal, agree2: nextVal, agree3: nextVal };
                })}
                style={[styles.modernCheckbox, declarations.agree1 && styles.modernCheckboxChecked, { marginTop: 2 }]}
              >
                {declarations.agree1 && <Ionicons name="checkmark" size={14} color="#fff" />}
              </TouchableOpacity>

              <Text style={[styles.declarationText, { marginLeft: 10 }]}>
                <Text onPress={() => setDeclarations((d) => {
                  const nextVal = !d.agree1;
                  return { agree1: nextVal, agree2: nextVal, agree3: nextVal };
                })}>
                  By ticking, you are confirming that you have read, understood and agree to KKFI{" "}
                </Text>
                <Text
                  style={{ color: "#3d4fa0", fontWeight: "700", textDecorationLine: "underline" }}
                  onPress={() => setTermsModalVisible(true)}
                >
                  declaration and agreement terms.
                </Text>
              </Text>
            </View>
          </View>
        </View>

        <Modal
          visible={termsModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setTermsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentCard}>
              {/* Modal Header */}
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitleText}>Declaration and Agreement Terms</Text>
                <TouchableOpacity onPress={() => setTermsModalVisible(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Separator line */}
              <View style={styles.modalDivider} />

              {/* Modal Body */}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBodyContainer}>
                {/* Term 1 */}
                <View style={styles.modalTermRow}>
                  <View style={styles.modalNumberCircle}>
                    <Text style={styles.modalNumberText}>1</Text>
                  </View>
                  <Text style={styles.modalTermText}>
                    I certify that all information provided in this application is true and correct to the best of my knowledge. I understand that any false or misleading information may result in the denial or revocation of any scholarship granted.
                  </Text>
                </View>

                {/* Term 2 */}
                <View style={styles.modalTermRow}>
                  <View style={styles.modalNumberCircle}>
                    <Text style={styles.modalNumberText}>2</Text>
                  </View>
                  <Text style={styles.modalTermText}>
                    I agree to provide any additional documentation requested by KKFI and to comply with all scholarship terms and conditions.
                  </Text>
                </View>

                {/* Term 3 */}
                <View style={styles.modalTermRow}>
                  <View style={styles.modalNumberCircle}>
                    <Text style={styles.modalNumberText}>3</Text>
                  </View>
                  <Text style={styles.modalTermText}>
                    I have read and agree to the Data Privacy Notice. I consent to the collection, processing, and storage of my personal data for scholarship evaluation and related program administration.
                  </Text>
                </View>
              </ScrollView>

              {/* Modal Footer Button */}
              <TouchableOpacity
                style={styles.modalAgreeBtn}
                activeOpacity={0.85}
                onPress={() => {
                  setDeclarations({ agree1: true, agree2: true, agree3: true });
                  setTermsModalVisible(false);
                }}
              >
                <Text style={styles.modalAgreeBtnText}>I Agree</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const renderQualification = () => {
    const aiCheckingEnabled = qualificationOutcome?.ai_checking_enabled ?? true;

    return (
      <ApplicationResultState
        aiCheckingEnabled={aiCheckingEnabled}
        successTitle={aiCheckingEnabled ? "Evaluation Complete" : "Submission Successful!"}
        successMessage={
          aiCheckingEnabled
            ? "Your application has been successfully parsed and evaluated by our AI."
            : "Your documents have been submitted securely."
        }
        qualificationReport={qualificationOutcome}
        onViewApplications={() => navigation?.navigate?.("Application")}
        viewApplicationsText="View My Applications"
      />
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

  if (isCheckingApplication) {
    return (
      <ApplicationSubmissionGuard
        isChecking={true}
        ongoingApplication={null}
        onBack={() => navigation?.goBack?.()}
        onViewApplications={() => navigation?.navigate?.("Application")}
      />
    );
  }

  if (isApplicationsClosed) {
    return (
      <ApplicationsClosedScreen
        year={closedYear}
        onBack={() => navigation?.goBack?.()}
        onNavigateToNotifications={() => {
          navigation?.navigate?.("Notifications");
        }}
        onNavigateToAccount={() => {
          navigation?.navigate?.("Profile");
        }}
      />
    );
  }

  if (!formAccess.allowed) {
    return (
      <ApplicationSubmissionGuard
        isChecking={false}
        ongoingApplication={formAccess.reason === "active_stage" ? formAccess.blockedApplication : null}
        title={formAccess.reason === "rejected_this_year" ? "Application Locked" : "Application Restricted"}
        cardTitle={formAccess.reason === "rejected_this_year" ? "You cannot apply again" : undefined}
        message={formAccess.message}
        secondaryMessage={formAccess.reason === "rejected_this_year" ? "Please review your application history for details." : undefined}
        onBack={() => navigation?.goBack?.()}
        onViewApplications={() => navigation?.navigate?.("Application")}
      />
    );
  }

  // Per-program guard checks (show the full UI guard instead of toasts)
  if (selectedProgram === "tertiary") {
    if (tertiaryIsCheckingGuard) {
      return (
        <ApplicationSubmissionGuard
          isChecking={true}
          ongoingApplication={null}
          onBack={() => navigation?.goBack?.()}
          onViewApplications={() => navigation?.navigate?.("Application")}
        />
      );
    }
    if (tertiaryOngoingApplication && completeStage !== "qualificationReport") {
      return (
        <ApplicationSubmissionGuard
          isChecking={false}
          ongoingApplication={tertiaryOngoingApplication}
          onBack={() => navigation?.goBack?.()}
          onViewApplications={() => navigation?.navigate?.("Application")}
        />
      );
    }
  }

  if (isVocationalFlow) {
    if (vocationalIsCheckingGuard) {
      return (
        <ApplicationSubmissionGuard
          isChecking={true}
          ongoingApplication={null}
          onBack={() => navigation?.goBack?.()}
          onViewApplications={() => navigation?.navigate?.("Application")}
        />
      );
    }
    if (vocationalOngoingApplication && completeStage !== "qualificationReport") {
      return (
        <ApplicationSubmissionGuard
          isChecking={false}
          ongoingApplication={vocationalOngoingApplication}
          onBack={() => navigation?.goBack?.()}
          onViewApplications={() => navigation?.navigate?.("Application")}
        />
      );
    }
  }

  if (isEmployeeChildFlow) {
    if (staffIsCheckingGuard) {
      return (
        <ApplicationSubmissionGuard
          isChecking={true}
          ongoingApplication={null}
          onBack={() => navigation?.goBack?.()}
          onViewApplications={() => navigation?.navigate?.("Application")}
        />
      );
    }
    if (staffOngoingApplication && completeStage !== "qualificationReport") {
      return (
        <ApplicationSubmissionGuard
          isChecking={false}
          ongoingApplication={staffOngoingApplication}
          onBack={() => navigation?.goBack?.()}
          onViewApplications={() => navigation?.navigate?.("Application")}
        />
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.progressHeader, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => (step > 0 ? setStep(step - 1) : navigation?.goBack?.())}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#4c60d1" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {selectedProgram === "employeeChild"
            ? isChildDesignation ? "Child Designation Application" : "Staff Advancement Application"
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

      <ScrollView ref={scrollViewRef} style={styles.content} contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
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

      <Modal visible={selectVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={closeSelect}>
        <View style={styles.modalRoot}>
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={closeSelect} />
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Option</Text>
              <TouchableOpacity onPress={closeSelect}>
                <Ionicons name="close" size={24} color="#4f5fc5" />
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {(selectContext?.options || []).map((opt, idx) => {
                const isSelected =
                  selectContext?.type === "member"
                    ? familyMembers[selectContext.index]?.[selectContext.key] === opt
                    : values[selectContext?.key] === opt;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.modalOption,
                      isSelected && styles.modalOptionActive
                    ]}
                    onPress={() => applySelect(opt)}
                  >
                    <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextActive]}>{opt}</Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color="#fff" style={{ marginLeft: 10, flexShrink: 0 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ExamplesModal visible={examplesModalVisible} onClose={() => setExamplesModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f5ff" },
  progressHeader: {
    flexDirection: "row", alignItems: "center",
    paddingBottom: 12, paddingHorizontal: 14,
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
  pickerText: { flex: 1, color: "#2f427f", fontSize: 16, fontWeight: "600", paddingRight: 8 },
  uploadBtn: {
    borderWidth: 1, borderColor: "#d7def8", borderRadius: 10,
    justifyContent: "center", paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10, backgroundColor: "#f7f9ff",
  },
  uploadText: { color: "#848baf", fontSize: 16, fontWeight: "600" },
  readonlyField: {
    borderWidth: 1,
    borderColor: "#d7def8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    backgroundColor: "#f5f7ff",
  },
  readonlyText: { color: "#2f427f", fontSize: 16, fontWeight: "600" },
  errorInput: { borderColor: "#e03a3a", borderWidth: 2 },
  errorText: { color: "#e03a3a", fontSize: 13, marginTop: 4, fontWeight: "600" },
  skippedDoc: { fontSize: 13, color: "#6b72aa", marginBottom: 18 },
  reviewCard: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#dbe2f6",
    borderRadius: 14, padding: 12, marginBottom: 12,
  },
  reviewCardTitle: { fontSize: 16, fontWeight: "900", color: "#3d4fa0", marginBottom: 12 },
  reviewRowCardItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8, alignItems: "flex-start" },
  reviewLabel: { color: "#6b7280", fontSize: 13, fontWeight: "600" },
  reviewValueCard: { fontSize: 13, color: "#2d3a7c", fontWeight: "800", textAlign: "right" },

  // New Premium Review Styles
  sectionTitle: { fontSize: 22, fontWeight: "900", color: "#1c2131", marginBottom: 6 },
  sectionSubtitle: { fontSize: 13, color: "#6b7280", lineHeight: 18, marginBottom: 24 },
  newReviewSection: { marginBottom: 24 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, paddingLeft: 4 },
  sectionIconWrapper: { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(91,95,151,0.1)", justifyContent: "center", alignItems: "center", marginRight: 10 },
  newReviewHeading: { fontSize: 16, fontWeight: "800", color: "#3d4076", letterSpacing: 0.3 },
  newReviewCard: { backgroundColor: "#fff", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#eff1f8" },
  reviewDataRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  reviewRowIconWrapper: { width: 30, height: 30, borderRadius: 8, backgroundColor: "rgba(91,95,151,0.06)", justifyContent: "center", alignItems: "center", marginRight: 12 },
  reviewDataContent: { flex: 1 },
  reviewDivider: { height: 1, backgroundColor: "#f1f3f9", marginLeft: 42 },

  premiumReviewCard: { backgroundColor: "rgba(91,95,151,0.04)", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "rgba(91,95,151,0.1)", marginTop: 10 },
  declarationHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  declarationTitle: { fontSize: 16, fontWeight: "800", color: "#3d4fa0", marginLeft: 10 },
  declarationItems: { gap: 12 },
  modernCheckbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "#5b6095", justifyContent: "center", alignItems: "center", marginRight: 12, backgroundColor: "#fff" },
  modernCheckboxChecked: { backgroundColor: "#5b6095", borderColor: "#5b6095" },
  declarationText: { flex: 1, fontSize: 13, color: "#4b5563", lineHeight: 18, fontWeight: "500" },
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
  modalOption: { width: "100%", marginTop: 10, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: "#d7def8", backgroundColor: "#f8f9ff", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalOptionActive: { backgroundColor: "#4f5fc5", borderColor: "#4f5fc5" },
  modalOptionText: { flex: 1, fontSize: 15, fontWeight: "700", color: "#4f5fc5", textAlign: "left" },
  modalOptionTextActive: { color: "#fff" },
  declRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  lookupStatus: { marginTop: -6, marginBottom: 10, fontSize: 12, fontWeight: "600" },
  lookupStatusBusy: { color: "#6b7280" },
  lookupStatusOk: { color: "#1a9e6a" },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "#4f5fc5", alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 1, backgroundColor: "#fff", flexShrink: 0 },
  checkboxChecked: { backgroundColor: "#4f5fc5", borderColor: "#4f5fc5" },
  uploadsGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
  },
  uploadRowItemHalf: {
    width: "48.5%",
    marginBottom: 14,
  },
  uploadRowItemFull: {
    width: "100%",
    marginBottom: 14,
  },
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
  predictionsContainer: {
    position: "absolute",
    top: 76,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccd1ed",
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
    borderBottomColor: "#f0f2fb",
  },
  predictionText: {
    fontSize: 14,
    color: "#2f427f",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContentCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    maxHeight: "85%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    flex: 1,
    paddingRight: 10,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 14,
  },
  modalBodyContainer: {
    paddingBottom: 15,
  },
  modalTermRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  modalNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    marginTop: 2,
  },
  modalNumberText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#3d4fa0",
  },
  modalTermText: {
    flex: 1,
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 22,
    fontWeight: "500",
  },
  modalAgreeBtn: {
    backgroundColor: "#5b5f97",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  modalAgreeBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  gridCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
  },
  gridHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  gridHeaderBar: {
    width: 4,
    height: 18,
    backgroundColor: '#3d4fa0',
    borderRadius: 2,
    marginRight: 8,
  },
  gridHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3d4fa0',
  },
  gridContent: {
    marginTop: 4,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridCol: {
    flex: 1,
    paddingRight: 8,
  },
  gridField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
    paddingRight: 4,
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'right',
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