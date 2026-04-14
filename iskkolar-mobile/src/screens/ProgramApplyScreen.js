import React, { useEffect, useRef, useState } from "react";
import {
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import useTertiaryApplication from "../hooks/useTertiaryApplication";
import useStaffApplication from "../hooks/useStaffApplication";
import useVocationalApplication from "../hooks/useVocationalApplication";
import ApplicationSubmissionGuard from "../components/ApplicationSubmissionGuard";
import { checkAnyOngoingApplication } from "../services/applicationGuardService";

const infoFields = {
  educPath: "Tertiary",
  scholarshipType: "", // set dynamically below based on the selected program
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
  courseDuration: "3 months",
  completionDate: "",
};

function DatePickerModal({ visible, dateStr, onConfirm, onClose }) {
  const initialDate = dateStr ? new Date(dateStr) : new Date();
  const [year, setYear] = useState(isNaN(initialDate.getTime()) ? new Date().getFullYear() : initialDate.getFullYear());
  const [month, setMonth] = useState(isNaN(initialDate.getTime()) ? new Date().getMonth() : initialDate.getMonth());
  const [day, setDay] = useState(isNaN(initialDate.getTime()) ? new Date().getDate() : initialDate.getDate());

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    if (visible && dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        setYear(d.getFullYear());
        setMonth(d.getMonth());
        setDay(d.getDate());
      }
    }
  }, [visible, dateStr]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={[styles.modalCard, { paddingBottom: 30 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Completion Date</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#4f5fc5" />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", height: 200, marginTop: 16 }}>
            <ScrollView style={{ flex: 1.2 }} showsVerticalScrollIndicator={false}>
              {months.map((m, idx) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.modalOption, idx === month && styles.modalOptionActive, { marginVertical: 4, paddingVertical: 10 }]}
                  onPress={() => { setMonth(idx); const max = daysInMonth(year, idx); if (day > max) setDay(max); }}
                >
                  <Text style={[styles.modalOptionText, idx === month && styles.modalOptionTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.modalOption, d === day && styles.modalOptionActive, { marginVertical: 4, paddingVertical: 10 }]}
                  onPress={() => setDay(d)}
                >
                  <Text style={[styles.modalOptionText, d === day && styles.modalOptionTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {years.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[styles.modalOption, y === year && styles.modalOptionActive, { marginVertical: 4, paddingVertical: 10 }]}
                  onPress={() => setYear(y)}
                >
                  <Text style={[styles.modalOptionText, y === year && styles.modalOptionTextActive]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity
            style={[styles.nextBtn, { marginHorizontal: 0, marginTop: 24 }]}
            onPress={() => {
              const d = new Date(year, month, day);
              const formatted = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
              onConfirm(formatted);
            }}
          >
            <Text style={styles.nextBtnText}>Confirm Selection</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function ProgramApplyScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const selectedProgram = route?.params?.program || "tertiary";
  const option = route?.params?.option || "Option 1";
  const isChildDesignation = selectedProgram === "employeeChild" && option === "Option 2";

  const [step, setStep] = useState(0);
  const [values, setValues] = useState({
    ...infoFields,
    // Tertiary → "Manila Scholars", vocational → "TESDA", everything else → blank
    scholarshipType:
      selectedProgram === "tertiary" ? "Manila Scholars" :
      selectedProgram === "vocational" ? "TESDA" : "",
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
    recommendation: null,
    essay: null,
  });
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [completeStage, setCompleteStage] = useState("none");
  const [selectVisible, setSelectVisible] = useState(false);
  const [selectContext, setSelectContext] = useState(null);
  const [declarations, setDeclarations] = useState({ agree1: false, agree2: false, agree3: false });
  const [verifiedStaffId, setVerifiedStaffId] = useState("");
  const [isCheckingApplication, setIsCheckingApplication] = useState(true);
  const [ongoingApplication, setOngoingApplication] = useState(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const {
    submitting: tertiarySubmitting,
    error: tertiaryError,
    fieldErrors: tertiaryFieldErrors,
    clearFieldError: clearTertiaryFieldError,
    qualificationOutcome: tertiaryQualificationOutcome,
    submitApplication: submitTertiary,
    validateStep: validateTertiaryStep,
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
  } = useStaffApplication(isChildDesignation);

  const {
    submitting: vocationalSubmitting,
    error: vocationalError,
    fieldErrors: vocationalFieldErrors,
    clearFieldError: clearVocationalFieldError,
    qualificationOutcome: vocationalQualificationOutcome,
    submitApplication: submitVocational,
    validateStep: validateVocationalStep,
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
        const ongoing = await checkAnyOngoingApplication();
        if (!mounted) return;
        setOngoingApplication(ongoing);
      } catch (err) {
        if (!mounted) return;
        setOngoingApplication(null);
      } finally {
        if (mounted) setIsCheckingApplication(false);
      }
    };

    runCheck();

    return () => {
      mounted = false;
    };
  }, []);

  // tertiary: 4 steps (0=Academic, 1=Family, 2=Docs, 3=Review)
  // others:   3 steps (0, 1, 2=Review)
  const maxStep = selectedProgram === "employeeChild" ? 2 : 3;
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
    setValues((prev) => {
      if (key !== "staffId") return { ...prev, [key]: value };

      // Reset auto-filled profile when the staff ID changes.
      if (value === prev.staffId) return prev;
      return {
        ...prev,
        staffId: value,
        firstName: "",
        middleName: "",
        lastName: "",
        suffix: "",
        position: "",
      };
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
        "Human Resource",
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

  const renderInput = (label, key, placeholder = null, inputProps = {}) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={values[key]}
        placeholder={placeholder || "Enter " + label}
        onChangeText={(text) => updateValue(key, text)}
        {...inputProps}
        style={[styles.input, fieldErrors[key] && styles.errorInput]}
      />
      {fieldErrors[key] && <Text style={styles.errorText}>{fieldErrors[key]}</Text>}
    </View>
  );

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
      <TextInput
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
      <TextInput
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
      <TextInput
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
        onPress={() => pickFile(key)}
        style={[styles.newUploadContainer, fieldErrors[key] && styles.errorInput]}
      >
        <View style={styles.chooseFileBtn}>
          <Text style={styles.chooseFileText}>Choose File</Text>
        </View>
        <View style={styles.fileNameBox}>
          <Text style={styles.fileNameText} numberOfLines={1} ellipsizeMode="middle">
            {uploadText[key] ? uploadText[key].name || uploadText[key].fileName || "Selected File" : "No file chosen"}
          </Text>
        </View>
      </TouchableOpacity>
      {fieldErrors[key] && <Text style={styles.errorText}>{fieldErrors[key]}</Text>}
    </View>
  );

  const renderDatePicker = (label, key) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.pickerInput, fieldErrors[key] && styles.errorInput]}
        onPress={() => setDatePickerVisible(true)}
      >
        <Text style={styles.pickerText}>{values[key] || "Select Date"}</Text>
        <Ionicons name="calendar-outline" size={20} color="#5b6095" />
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
          {renderSelect("Scholarship type", "scholarshipType", ["TESDA"])}

          <Text style={styles.sectionHeader}>| Secondary Education</Text>
          {renderInput("School Name", "schoolName", "Enter School Name")}
          {renderSelect("Strand", "strand", ["STEM", "ABM", "HUMMS", "GAS", "TVL"])}
          {renderYearInput("Year Graduated", "yearGraduated")}
          {renderUpload("Report Card", "gradeReport")}

          <Text style={styles.sectionHeader}>| Vocational/Technical Education</Text>
          {renderInput("School Name", "vocationalSchoolName", "Enter School Name")}
          {renderInput("Program", "vocationalProgram", "Enter Program")}
          {renderSelect("Course Duration", "courseDuration", ["3 months", "6 months", "9 months", "12 months", "18 months", "24 months"])}
          {renderDatePicker("Completion Date", "completionDate")}
          {renderUpload("COR", "cor")}
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

          {renderUpload("Certificate of Indigency Form (Applicant)", "indigency")}
          {renderUpload("Birth Certificate (Applicant)", "birthCert")}

          {requiresIncomeProof(values.fatherStatus)
            ? renderUpload("Income Certificate (Father)", "incomeFather")
            : <Text style={styles.skippedDoc}>Income certificate not required for Father ({values.fatherStatus}).</Text>}

          {requiresIncomeProof(values.motherStatus)
            ? renderUpload("Income Certificate (Mother)", "incomeMother")
            : <Text style={styles.skippedDoc}>Income certificate not required for Mother ({values.motherStatus}).</Text>}

          {renderUpload("Recommendation Letter Form (Optional)", "recommendation")}
          {renderUpload("Essay", "essay")}
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
          {!isChildDesignation && renderSelect("Education Path", "educPath", ["Tertiary", "Masters"])}
          {renderSelect("Incoming Freshman?", "incomingFreshman", ["No", "Yes"])}

          <Text style={styles.sectionHeader}>| Secondary Education</Text>
          {renderInput("School Name", "schoolName", "Enter School Name")}
          {renderSelect("Strand", "strand", ["STEM", "ABM", "HUMMS", "GAS", "TVL"])}
          {renderYearInput("Year Graduated", "secondaryYearGraduated")}
          {renderUpload("Grade Report", "gradeReport")}

          {!isChildDesignation && values.educPath === "Masters" && (
            <>
              <Text style={styles.sectionHeader}>| Previous Tertiary Education</Text>
              {renderInput("Previous School Name", "prevSchoolName", "Enter Previous School Name")}
              {renderInput("Previous Program", "prevProgram", "Enter Previous Program")}
              {renderYearInput("Previous Year Graduated", "prevYearGraduated")}
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
          {renderYearInput("Expected Year of Graduation", "expectedGradYear")}
          {renderUpload("COR", "cor")}
          {values.incomingFreshman === "No" && renderUpload("Current Term Grade Report", "currentTermGradeReport")}
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
                <Text style={styles.reviewValue}>{item.value || "-"}</Text>
              </View>
            </View>
            {idx < items.length - 1 && <View style={styles.reviewDivider} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );

  const renderReview = () => (
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
            { label: "High School Name", value: values.schoolName, icon: "business-outline" },
            { label: "Strand", value: values.strand, icon: "bookmarks-outline" },
            { label: "Year Graduated", value: values.yearGraduated, icon: "calendar-outline" },
          ])}

          {renderReviewSection("Higher Education", "medal-outline", [
            { label: "University / College", value: values.universityName, icon: "location-outline" },
            { label: "Degree Program", value: values.program, icon: "school-outline" },
            { label: "Current Year Level", value: values.yearLevel, icon: "layers-outline" },
            { label: "Term System", value: values.term, icon: "time-outline" },
          ])}

          {renderReviewSection("Family Background", "people-outline", [
            { label: "Father's Name", value: values.fatherName, icon: "man-outline" },
            { label: "Father Status", value: values.fatherStatus, icon: "information-circle-outline" },
            ...(values.fatherStatus !== "Deceased" && requiresIncomeProof(values.fatherStatus) ? [
              { label: "Father Income", value: values.fatherIncome, icon: "cash-outline" }
            ] : []),
            { label: "Mother's Name", value: values.motherName, icon: "woman-outline" },
            { label: "Mother Status", value: values.motherStatus, icon: "information-circle-outline" },
            ...(values.motherStatus !== "Deceased" && requiresIncomeProof(values.motherStatus) ? [
              { label: "Mother Income", value: values.motherIncome, icon: "cash-outline" }
            ] : []),
          ])}

          {renderReviewSection("Supporting Documents", "document-text-outline", [
            { label: "Certificate of Indigency", value: uploadText.indigency ? "Attached" : "Not Attached", icon: uploadText.indigency ? "checkmark-circle" : "close-circle" },
            { label: "Birth Certificate", value: uploadText.birthCert ? "Attached" : "Not Attached", icon: uploadText.birthCert ? "checkmark-circle" : "close-circle" },
            { label: "Personal Essay", value: uploadText.essay ? "Attached" : "Not Attached", icon: uploadText.essay ? "checkmark-circle" : "close-circle" },
          ])}
        </>
      )}

      {selectedProgram === "vocational" && (
        <>
          {renderReviewSection("Program Assignment", "construct-outline", [
            { label: "Scholarship Type", value: values.scholarshipType, icon: "ribbon-outline" },
            { label: "Fund Source", value: values.fundType, icon: "wallet-outline" },
          ])}
          {renderReviewSection("Educational History", "school-outline", [
            { label: "HS School Name", value: values.schoolName, icon: "business-outline" },
            { label: "Strand / Track", value: values.strand, icon: "bookmarks-outline" },
          ])}
          {renderReviewSection("Vocational Details", "flask-outline", [
            { label: "Technical School", value: values.vocationalSchoolName, icon: "business-outline" },
            { label: "Technical Program", value: values.vocationalProgram, icon: "list-outline" },
          ])}
        </>
      )}

      {selectedProgram === "employeeChild" && (
        <>
          {renderReviewSection("Academic Path", "trail-sign-outline", [
            ...(!isChildDesignation ? [{ label: "Education Path", value: values.educPath, icon: "map-outline" }] : []),
            { label: "New Freshman", value: values.incomingFreshman, icon: "sparkles-outline" },
          ])}
          {renderReviewSection("Staff Information", "id-card-outline", [
            { label: "Staff ID", value: values.staffId, icon: "barcode-outline" },
            { label: "Staff Employee", value: `${values.firstName} ${values.lastName}`, icon: "person-outline" },
            { label: "Position", value: values.position, icon: "briefcase-outline" },
          ])}
        </>
      )}

      <View style={styles.premiumReviewCard}>
        <View style={styles.declarationHeader}>
          <Ionicons name="document-text-outline" size={20} color="#3d4fa0" />
          <Text style={styles.declarationTitle}>Declaration & Agreement</Text>
        </View>

        <View style={styles.declarationItems}>
          <TouchableOpacity style={styles.declRow} activeOpacity={0.7} onPress={() => setDeclarations((d) => ({ ...d, agree1: !d.agree1 }))}>
            <View style={[styles.modernCheckbox, declarations.agree1 && styles.modernCheckboxChecked]}>
              {declarations.agree1 && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.declarationText}>
              I certify that all information provided in this application is true and correct to the best of my knowledge. I understand that any false or misleading information may result in the denial or revocation of any scholarship granted.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.declRow} activeOpacity={0.7} onPress={() => setDeclarations((d) => ({ ...d, agree2: !d.agree2 }))}>
            <View style={[styles.modernCheckbox, declarations.agree2 && styles.modernCheckboxChecked]}>
              {declarations.agree2 && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.declarationText}>
              I agree to provide any additional documentation requested by KKFI and to comply with all scholarship terms and conditions.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.declRow} activeOpacity={0.7} onPress={() => setDeclarations((d) => ({ ...d, agree3: !d.agree3 }))}>
            <View style={[styles.modernCheckbox, declarations.agree3 && styles.modernCheckboxChecked]}>
              {declarations.agree3 && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.declarationText}>
              I have read and agree to the <Text style={{ color: "#3d4fa0", fontWeight: "700" }}>Data Privacy Notice</Text>. I consent to the collection, processing, and storage of my personal data for scholarship evaluation and related program administration.
            </Text>
          </TouchableOpacity>
        </View>
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

  if (isCheckingApplication || ongoingApplication) {
    return (
      <ApplicationSubmissionGuard
        isChecking={isCheckingApplication}
        ongoingApplication={ongoingApplication}
        onBack={() => navigation?.goBack?.()}
        onViewApplications={() => navigation?.navigate?.("Application")}
      />
    );
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
                      { flexDirection: 'row', justifyContent: 'center' },
                      isSelected && styles.modalOptionActive
                    ]}
                    onPress={() => applySelect(opt)}
                  >
                    <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextActive]}>{opt}</Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ position: 'absolute', right: 16 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <DatePickerModal
        visible={datePickerVisible}
        dateStr={values.completionDate}
        onConfirm={(formatted) => {
          updateValue("completionDate", formatted);
          setDatePickerVisible(false);
        }}
        onClose={() => setDatePickerVisible(false)}
      />
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
  pickerText: { color: "#2f427f", fontSize: 16, fontWeight: "600" },
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
  modalOption: { width: "100%", marginTop: 10, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: "#d7def8", backgroundColor: "#f8f9ff", alignItems: "center" },
  modalOptionActive: { backgroundColor: "#4f5fc5", borderColor: "#4f5fc5" },
  modalOptionText: { fontSize: 16, fontWeight: "700", color: "#4f5fc5" },
  modalOptionTextActive: { color: "#fff" },
  declRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  lookupStatus: { marginTop: -6, marginBottom: 10, fontSize: 12, fontWeight: "600" },
  lookupStatusBusy: { color: "#6b7280" },
  lookupStatusOk: { color: "#1a9e6a" },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "#4f5fc5", alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 1, backgroundColor: "#fff", flexShrink: 0 },
  checkboxChecked: { backgroundColor: "#4f5fc5", borderColor: "#4f5fc5" },
  declarationText: { flex: 1, color: "#5b6095", fontSize: 13, lineHeight: 20 },
  newUploadContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#d7def8",
    borderRadius: 8,
    backgroundColor: "#fff",
    height: 48,
    overflow: "hidden",
  },
  chooseFileBtn: {
    backgroundColor: "#f1f3f9",
    borderRightWidth: 1,
    borderRightColor: "#d7def8",
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  chooseFileText: {
    color: "#5b6095",
    fontSize: 14,
    fontWeight: "700",
  },
  fileNameBox: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  fileNameText: {
    color: "#848baf",
    fontSize: 14,
    fontWeight: "500",
  },
});