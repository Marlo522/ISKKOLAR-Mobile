import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert, Modal, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useExamAssistance } from "../hooks/useExamAssistance";

export default function ExamAssistanceScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(-1); // -1 is the initial landing page
  const [values, setValues] = useState({
    assistanceType: "",
    examType: "",
    examDate: "",
    testingCenter: "",
    takenBefore: "",
    additionalNotes: "",
  });

  const [uploadText, setUploadText] = useState({
    examRegistration: "",
    certOfGraduation: "",
    reviewCourse: ""
  });
  const [uploadFiles, setUploadFiles] = useState({
    examRegistration: null,
    reviewCourse: null,
  });

  const [completeStage, setCompleteStage] = useState("none");
  const [confirmed, setConfirmed] = useState(false);

  const [selectorVisible, setSelectorVisible] = useState(false);
  const [selectorTitle, setSelectorTitle] = useState("");
  const [selectorOptions, setSelectorOptions] = useState([]);
  const [selectorKey, setSelectorKey] = useState("");

  const [dateVisible, setDateVisible] = useState(false);
  const [dateKey, setDateKey] = useState(null);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const {
    submitting,
    error,
    fieldErrors,
    clearFieldError,
    validateStep,
    submitApplication: submitExamAssistanceApplication,
  } = useExamAssistance();

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

  const maxStep = 2; // Step 0, Step 1, Step 2

  const advance = async () => {
    if (step < maxStep) {
      const isValid = validateStep(step, values, uploadFiles);
      if (!isValid) return;
      setStep((s) => s + 1);
      return;
    }

    await submitApplication();
  };

  const submitApplication = async () => {
    const isValid = validateStep(1, values, uploadFiles);
    if (!isValid) {
      Alert.alert("Missing Requirement", "Please complete required fields before submitting.");
      return;
    }

    try {
      await submitExamAssistanceApplication(values, uploadFiles);
      setCompleteStage("preAssessment");
    } catch (error) {
      const message = error?.message || "Failed to submit exam assistance application.";
      Alert.alert("Submission Failed", message);
    }
  };

  const renderInput = (label, key, placeholder = null) => (
    <View style={[styles.inputGroup, fieldErrors[key] && styles.rowWithError]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#888"
        value={values[key]}
        placeholder={placeholder || `Enter ${label}`}
        onChangeText={(text) => {
          setValues({ ...values, [key]: text });
          clearFieldError(key);
        }}
        style={styles.input}
      />
      {fieldErrors[key] ? <Text style={styles.errorText}>{fieldErrors[key]}</Text> : null}
    </View>
  );

  const renderSelect = (label, key, options) => (
    <View style={[styles.inputGroup, fieldErrors[key] && styles.rowWithError]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.pickerInput}
        onPress={() => {
          setSelectorTitle(label);
          setSelectorOptions(options);
          setSelectorKey(key);
          setSelectorVisible(true);
        }}
      >
        <Text style={[styles.pickerText, !values[key] && { color: "#a9b1c0" }]}>{values[key] || "Select"}</Text>
        <Ionicons name="chevron-down" size={20} color="#6b72aa" />
      </TouchableOpacity>
      {fieldErrors[key] ? <Text style={styles.errorText}>{fieldErrors[key]}</Text> : null}
    </View>
  );

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(selectedYear - 1); }
    else setSelectedMonth(selectedMonth - 1);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(selectedYear + 1); }
    else setSelectedMonth(selectedMonth + 1);
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    let days = [];
    for (let i = 0; i < firstDay; i++) days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(
        <TouchableOpacity
          key={`day-${i}`}
          style={styles.calendarDay}
          onPress={() => {
            const m = selectedMonth + 1;
            const d = i < 10 ? `0${i}` : i;
            const dateStr = `${m < 10 ? '0' + m : m}/${d}/${selectedYear}`;
            setValues({ ...values, [dateKey]: dateStr });
            clearFieldError(dateKey);
            setDateVisible(false);
          }}
        >
          <Text style={styles.calendarDayText}>{i}</Text>
        </TouchableOpacity>
      );
    }
    return days;
  };

  const renderDatePickerField = (label, key) => (
    <>
      <View style={[styles.inputGroup, fieldErrors[key] && styles.rowWithError]}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={styles.yearPickerInput}
          onPress={() => { setDateKey(key); setDateVisible(true); }}
        >
          <Text style={[styles.yearPickerText, !values[key] && { color: "#a9b1c0" }]}>{values[key] || "mm/dd/yyyy"}</Text>
          <Ionicons name="calendar-outline" size={20} color="#555" />
        </TouchableOpacity>
      </View>
      <Modal visible={dateVisible && dateKey === key} transparent animationType="fade">
        <View style={styles.calendarModalOverlay}>
          <View style={styles.calendarModalContent}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 4 }}>
                <Ionicons name="chevron-back" size={24} color="#4f5fc5" />
              </TouchableOpacity>
              <Text style={styles.calendarHeaderText}>{months[selectedMonth]} {selectedYear}</Text>
              <TouchableOpacity onPress={handleNextMonth} style={{ padding: 4 }}>
                <Ionicons name="chevron-forward" size={24} color="#4f5fc5" />
              </TouchableOpacity>
            </View>
            <View style={styles.calendarWeekDaysRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <Text key={i} style={styles.calendarWeekDay}>{d}</Text>)}
            </View>
            <View style={styles.calendarDaysGrid}>
              {renderCalendarGrid()}
            </View>
            <TouchableOpacity onPress={() => setDateVisible(false)} style={styles.calendarCloseBtn}>
              <Text style={styles.calendarCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {fieldErrors[key] ? <Text style={styles.errorText}>{fieldErrors[key]}</Text> : null}
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
    const handleResult = (result) => {
      if (result.canceled) return;
      if (result.assets && result.assets.length > 0) {
        let selectedFile = result.assets[0];
        if (!selectedFile.name) {
          selectedFile = { ...selectedFile, name: selectedFile.uri.split('/').pop(), type: selectedFile.mimeType || 'image/jpeg' };
        }
        setUploadText(prev => ({ ...prev, [key]: selectedFile.name }));
        setUploadFiles((prev) => ({ ...prev, [key]: selectedFile }));
        clearFieldError(key);
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
            } catch (error) {
              console.log("Error picking file:", error);
              Alert.alert("Error", "Failed to select document.");
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

  const renderFileUploadBox = (label, subtext, key) => (
    <View style={[styles.uploadRow, fieldErrors[key] && styles.rowWithError]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.uploadBoxDashed} onPress={() => handleFileUpload(key)}>
        <Text style={[styles.uploadBoxTitle, uploadText[key] && { color: "#2cae57" }]}>
          {uploadText[key] ? "File selected ✓" : "Tap to upload"}
        </Text>
        <Text style={styles.uploadBoxSubtext} numberOfLines={1} ellipsizeMode="middle">
          {uploadText[key] || subtext}
        </Text>
      </TouchableOpacity>
      {fieldErrors[key] ? <Text style={styles.errorText}>{fieldErrors[key]}</Text> : null}
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
          <Text style={[styles.completeText, { marginTop: 8 }]}>Application submitted.</Text>
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
      case -1:
        return null; // Handled directly in the main return

      case 0:
        return (
          <View>
            <View style={styles.formContainer}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.verticalPill} />
                <Text style={styles.sectionHeader}>Examination Information</Text>
              </View>

              <View style={styles.rowTwoCol}>
                <View style={styles.colHalf}>
                  {renderSelect("Type of Assistance", "assistanceType", ["Review Support", "Cash Incentive"])}
                </View>
                <View style={styles.colHalf}>
                  {renderInput("Exam / Certification Type", "examType", "Licensure Exam")}
                </View>
              </View>

              <View style={styles.rowTwoCol}>
                <View style={styles.colHalf}>
                  {renderDatePickerField("Exam Date", "examDate")}
                </View>
                <View style={styles.colHalf}>
                  {renderInput("Testing Center / Location", "testingCenter", "City / Testing center")}
                </View>
              </View>

              {renderSelect("Have you taken this exam/certification before?", "takenBefore", ["Yes, this is my first attempt", "No, I have taken it before"])}
            </View>
          </View>
        );
      case 1:
        return (
          <View>
            <View style={styles.formContainer}>
              <Text style={styles.subtextAboveHeader}>Supporting Documents</Text>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.verticalPill} />
                <Text style={styles.sectionHeader}>Supporting Documents</Text>
              </View>

              <View style={styles.rowTwoCol}>
                <View style={styles.colHalf}>
                  {renderFileUploadBox("Exam Registration / Confirmation", "PDF or clear image", "examRegistration")}
                </View>
                <View style={styles.colHalf}>
                  {renderFileUploadBox("Review Course Enrollment (optional)", "Upload if applicable", "reviewCourse")}
                </View>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput placeholderTextColor="#888"
                  style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                  multiline
                  placeholder="Add context about your exam, timelines, or special circumstances."
                  value={values.additionalNotes}
                  onChangeText={(text) => setValues({ ...values, additionalNotes: text })}
                />
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
                <Text style={styles.infoBoxText}>Please review your details below. Ensure information and documents reflect your exam application.</Text>
              </View>
              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{error}</Text>
                </View>
              ) : null}

              {renderReviewCard("| Exam Information", [
                { label: "Assistance Type", value: values.assistanceType },
                { label: "Board Exam Type", value: values.examType },
                { label: "Exam Date", value: values.examDate || "Not provided" },
                { label: "Testing Center/Location", value: values.testingCenter },
                { label: "Taken Before", value: values.takenBefore },
              ])}

              {renderReviewCard("| Supporting Documents", [
                { label: "Exam Registration", icon: "checkmark-circle", iconColor: "#2cae57" },
                { label: "Review Course Enrollment", icon: "remove-circle", iconColor: "#dce1f0" },
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
                  I confirm the details are correct and wish to submit my application.
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  if (step === -1) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f4f6fa' }}>
        <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
          {/* Header Area */}
          <View style={[styles.landingHero, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.heroBackBtn}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Board Exam / Certification</Text>
            </View>
            <Text style={styles.heroTitle}>Board Exam & Certification Assistance</Text>
            <Text style={styles.heroSub}>From graduation to licensure, we cover review needs and exam costs so you can focus on passing.</Text>
          </View>

          {/* Main Content Area */}
          <View style={styles.landingBodyCard}>
            <View style={styles.pathwayBadge}>
              <Text style={styles.pathwayBadgeText}>KKFI Exam Pathway</Text>
            </View>

            <Text style={styles.landingSectionTitle}>Background</Text>
            <View style={styles.landingSectionDivider} />
            <Text style={styles.landingParagraph}>
              Assistance is available for review programs, official exam fees, and a one-time incentive after you pass. Funds are limited per cycle, so make sure your documents are ready when you apply.
            </Text>

            <Text style={styles.landingSectionTitle}>Eligibility</Text>
            <View style={styles.landingSectionDivider} />
            {[
              "Filipino citizen graduating or graduate from the program",
              "Targeting a licensure board exam or industry certification within 12 months",
              "GWA meets program threshold or with clearance from scholar coordinator",
              "Can submit proof of exam schedule or review enrollment"
            ].map((text, idx) => (
              <View style={styles.checkListItem} key={idx}>
                <Ionicons name="checkmark-circle" size={20} color="#2cae57" />
                <Text style={styles.checkListText}>{text}</Text>
              </View>
            ))}

            <Text style={styles.landingSectionTitle}>What we cover</Text>
            <View style={styles.landingSectionDivider} />
            <View style={styles.pillContainer}>
              {["Review center fees", "Exam application fees", "Study materials and mock exams", "One-time cash incentive after passing"].map((text, idx) => (
                <View style={styles.coverPill} key={idx}>
                  <Text style={styles.coverPillText}>{text}</Text>
                </View>
              ))}
            </View>

            <View style={styles.optionCard}>
              <Text style={styles.optionTitle}>Option 1: Review Support</Text>
              <Text style={styles.optionSubtitle}>Subject for Liquidation</Text>
              {[
                "Covers review fees, exam applications, and study materials.",
                "Requires submission of Official Receipts for all expenses.",
                "Best for those needing fund before the exam."
              ].map((text, idx, arr) => (
                <View style={[styles.optionItem, idx === arr.length - 1 && { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]} key={"opt1"+idx}>
                  <Ionicons name="checkmark-circle" size={18} color="#2cae57" />
                  <Text style={styles.optionItemText}>{text}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.optionCard, { marginBottom: 30 }]}>
              <Text style={styles.optionTitle}>Option 2: Cash Incentive</Text>
              <Text style={styles.optionSubtitle}>Achievement Award</Text>
              {[
                "Granted after successfully passing the board exam.",
                "Requires submission of board rating and proof of passing.",
                "No liquidation of receipts needed."
              ].map((text, idx, arr) => (
                <View style={[styles.optionItem, idx === arr.length - 1 && { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]} key={"opt2"+idx}>
                  <Ionicons name="checkmark-circle" size={18} color="#2cae57" />
                  <Text style={styles.optionItemText}>{text}</Text>
                </View>
              ))}
            </View>

            <View style={styles.landingFooter}>
              <Text style={styles.footerNote}>Double-check your exam schedule before applying</Text>
              <TouchableOpacity style={styles.landingApplyBtn} onPress={() => setStep(0)}>
                <Text style={styles.landingApplyBtnText}>Apply Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => (step > 0 ? setStep(step - 1) : navigation.goBack())} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#5b6095" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.superTitle}>BOARD EXAM/CERTIFICATION ASSISTANCE</Text>
          <Text style={styles.mainTitle}>Application Form</Text>
          <Text style={styles.subTitle}>Choose your support option and provide exam details with required documents.</Text>
        </View>
      </View>

      {completeStage === "none" && !submitting && step > -1 && (
        <View style={{ marginBottom: 20 }}>
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
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 60 }}>
        <Animated.View style={{ opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          {renderStep()}
        </Animated.View>
      </ScrollView>

      {!submitting && completeStage === "none" && step > -1 && (
        <View style={styles.footerRow}>
          <TouchableOpacity 
            style={styles.backButtonFooter} 
            onPress={() => step > 0 ? setStep(step - 1) : navigation.goBack()}
          >
            <Text style={styles.backButtonFooterText}>{step > 0 ? "Previous" : "Back to Home"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.nextButtonFooter,
              step === maxStep && !confirmed && { backgroundColor: '#aeb4d2', elevation: 0 }
            ]}
            onPress={advance}
            disabled={step === maxStep && !confirmed}
          >
            <Text style={styles.nextButtonFooterText}>{step < maxStep ? "Next Step" : "Submit Application"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Global generic selector modal */}
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
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {selectorOptions.map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.modalOption, values[selectorKey] === opt && styles.modalOptionActive]}
                  onPress={() => {
                    setValues({ ...values, [selectorKey]: opt });
                    clearFieldError(selectorKey);
                    setSelectorVisible(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, values[selectorKey] === opt && styles.modalOptionTextActive]}>{opt}</Text>
                  {values[selectorKey] === opt && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fc" },
  header: { paddingHorizontal: 24, paddingBottom: 16, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ccd1ed", backgroundColor: "#fff" },
  backBtn: { width: 42, height: 42, borderRadius: 10, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#dbe2f6" },
  headerTitles: { flex: 1, paddingLeft: 16 },
  superTitle: { fontSize: 11, fontWeight: "700", color: "#5b61aa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  mainTitle: { fontSize: 20, fontWeight: "900", color: "#1c2131", letterSpacing: -0.3, marginBottom: 2 },
  subTitle: { fontSize: 12, color: "#6e7798", fontWeight: "500" },

  progressBarRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 24, marginTop: 16, marginBottom: 8 },
  progressStep: { height: 5, flex: 1, marginHorizontal: 6, borderRadius: 5 },
  progressStepActive: { backgroundColor: "#5b61a7" },
  progressStepInactive: { backgroundColor: "#dde2ee" },

  formContainer: { paddingHorizontal: 24 },
  inputGroup: { flex: 1, marginBottom: 16 },
  pickerInput: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#a9b1c0", borderRadius: 12, paddingHorizontal: 16, backgroundColor: "#ffffff", height: 48 },
  pickerText: { color: "#1c2131", fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "50%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#e4e8f8" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1c2131" },
  modalScroll: { paddingHorizontal: 16, paddingTop: 16 },
  modalOption: { paddingVertical: 16, paddingHorizontal: 16, borderRadius: 12, marginBottom: 8, backgroundColor: "#f8f9ff", borderWidth: 1, borderColor: "#e4e8f8", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalOptionActive: { backgroundColor: "#4f5fc5", borderColor: "#4f5fc5" },
  modalOptionText: { fontSize: 15, color: "#4f5fc5", fontWeight: "700" },
  modalOptionTextActive: { color: "#fff" },

  titleLanding: { flex: 1, marginLeft: 16, fontSize: 20, fontWeight: "900", color: "#4f5fc5", lineHeight: 22 },
  bellBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e4e8f6", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },

  landingHero: { backgroundColor: "#505786", paddingHorizontal: 24, paddingBottom: 40 },
  heroBackBtn: { width: 42, height: 42, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center", marginBottom: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  heroBadge: { backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12 },
  heroBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  heroTitle: { fontSize: 26, fontWeight: "800", color: "#fff", marginBottom: 10, letterSpacing: -0.5 },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 20, paddingRight: 20 },

  landingBodyCard: { backgroundColor: "#fff", borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -20, paddingHorizontal: 24, paddingTop: 30, paddingBottom: 40 },
  pathwayBadge: { backgroundColor: "#f3f5fa", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 24 },
  pathwayBadgeText: { color: "#5b61aa", fontSize: 11, fontWeight: "700" },
  landingSectionTitle: { fontSize: 18, fontWeight: "800", color: "#2d3a7c", marginBottom: 10 },
  landingSectionDivider: { height: 1, backgroundColor: "#f0f2fb", marginBottom: 16 },
  landingParagraph: { fontSize: 13, color: "#6e7798", lineHeight: 22, marginBottom: 30 },

  checkListItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  checkListText: { fontSize: 13, color: "#4f5ec4", lineHeight: 20, flex: 1, marginLeft: 10, fontWeight: "500" },

  pillContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 30 },
  coverPill: { borderWidth: 1, borderColor: "#e4e8f6", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#fff" },
  coverPillText: { fontSize: 12, color: "#3d4076", fontWeight: "600" },

  optionCard: { borderWidth: 1, borderColor: "#e4e8f6", borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: "#fff" },
  optionTitle: { fontSize: 16, fontWeight: "800", color: "#1c2131" },
  optionSubtitle: { fontSize: 12, color: "#5b61aa", fontWeight: "600", marginBottom: 12 },
  optionItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#f0f2fb" },
  optionItemText: { marginLeft: 10, fontSize: 13, color: "#2c354a", flex: 1, lineHeight: 20, fontWeight: "500" },

  landingFooter: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 24 },
  footerNote: { fontSize: 10, color: "#7a84a1", marginRight: 14 },
  landingApplyBtn: { backgroundColor: "#5b61aa", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  landingApplyBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  content: { flex: 1 },
  row: { marginBottom: 16 },
  uploadRow: { marginBottom: 16 },
  rowWithError: { marginBottom: 3 },
  label: { fontWeight: "600", color: "#1c2131", fontSize: 13, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#a9b1c0", borderRadius: 12, paddingHorizontal: 16, paddingVertical: Platform.OS === "ios" ? 13 : 11, minHeight: 48, backgroundColor: "#ffffff", color: "#555", fontSize: 15 },
  uploadBtn: { borderWidth: 1, borderColor: "#a9b1c0", borderRadius: 12, height: 48, justifyContent: "center", paddingHorizontal: 16, backgroundColor: "#ffffff" },
  uploadText: { color: "#777", fontSize: 15, alignSelf: "center" },
  reviewCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#dbe2f6", borderRadius: 10, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  reviewCardTitle: { fontSize: 17, fontWeight: "900", color: "#4f5fc5", marginBottom: 4 },
  reviewRowCardItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8, alignItems: "center" },
  reviewLabel: { color: "#848baf", fontSize: 13, fontWeight: "600" },
  reviewValueCard: { fontSize: 12, color: "#1c2131", fontWeight: "700" },
  yearPickerInput: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#a9b1c0", borderRadius: 12, paddingHorizontal: 16, paddingVertical: Platform.OS === "ios" ? 13 : 11, backgroundColor: "#ffffff", height: 48 },
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
  calendarModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  calendarModalContent: { backgroundColor: "#fff", width: "85%", borderRadius: 16, padding: 20 },
  calendarHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  calendarHeaderText: { fontSize: 18, fontWeight: "700", color: "#4f5fc5" },
  calendarWeekDaysRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 8 },
  calendarWeekDay: { color: "#848baf", fontSize: 13, fontWeight: "800", width: 40, textAlign: "center" },
  calendarDaysGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start" },
  calendarDay: { width: "14.28%", height: 40, justifyContent: "center", alignItems: "center", marginVertical: 2 },
  calendarDayText: { color: "#1c2131", fontSize: 16, fontWeight: "600" },
  calendarCloseBtn: { marginTop: 16, alignSelf: "flex-end", padding: 8, paddingBottom: 0 },
  calendarCloseText: { color: "#4f5ec4", fontSize: 15, fontWeight: "700" },

  subtextAboveHeader: { fontSize: 11, fontWeight: "700", color: "#5b61a7", textTransform: "uppercase", marginBottom: 6 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  verticalPill: { width: 4, height: 20, backgroundColor: "#5b61a7", borderRadius: 2, marginRight: 8 },
  sectionHeader: { fontSize: 17, fontWeight: "900", color: "#2d3a7c" },
  rowTwoCol: { flexDirection: "row", gap: 12, marginBottom: 0 },
  colHalf: { flex: 1 },
  uploadBoxDashed: { borderWidth: 1, borderColor: "#c2c9d6", borderStyle: "dashed", borderRadius: 10, backgroundColor: "#f8f9fc", width: "100%", height: 75, paddingHorizontal: 12, justifyContent: "center" },
  uploadBoxTitle: { fontSize: 13, fontWeight: "600", color: "#4f5ec4", marginBottom: 2 },
  uploadBoxSubtext: { fontSize: 11, color: "#6e7798" },

  footerRow: { flexDirection: "row", paddingHorizontal: 24, paddingBottom: 30, marginTop: 10 },
  backButtonFooter: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: "#dce1f0", marginRight: 12, backgroundColor: "#fff" },
  backButtonFooterText: { color: "#4f5fc5", fontSize: 15, fontWeight: "700" },
  nextButtonFooter: { flex: 1, backgroundColor: "#5b61a7", borderRadius: 12, paddingVertical: 14, alignItems: "center", justifyContent: "center", shadowColor: "#2d3a7c", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 4 },
  nextButtonFooterText: { color: "#fff", fontSize: 15, fontWeight: "800" },

  infoBox: { backgroundColor: "#f8f9fc", padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#e4e8f6", marginBottom: 16 },
  infoBoxText: { fontSize: 12, color: "#3d4076", lineHeight: 18, fontWeight: "500" },
  errorText: { color: "#dc2626", fontSize: 12, marginTop: 2, marginBottom: 0, fontWeight: "600", lineHeight: 14 },
  errorBanner: { backgroundColor: "#fee2e2", borderWidth: 1, borderColor: "#fecaca", padding: 12, borderRadius: 10, marginBottom: 14 },
  errorBannerText: { color: "#b91c1c", fontSize: 12, fontWeight: "600" },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginTop: 8, marginBottom: 20 },
  checkboxText: { marginLeft: 10, fontSize: 13, color: "#2d3a7c", fontWeight: "700" },
});
