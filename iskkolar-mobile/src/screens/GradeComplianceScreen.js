import React, { useState, useEffect, useRef, useMemo, useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Animated, Alert } from "react-native";
import SafeTextInput from "../components/SafeTextInput";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import FormDatePicker from "../components/FormDatePicker";
import GraduationCelebration from "../components/GraduationCelebration";
import { getGradeComplianceTerms, submitGradeCompliance } from "../services/gradeComplianceService";
import { AuthContext } from "../context/AuthContext";
import ApplicationResultState from "../components/ApplicationResultState";

const statusColors = {
  Pending: { bg: "#fff8e6", text: "#b5850a" },
  Submitted: { bg: "#e6f7ef", text: "#0d7c47" },
  Approved: { bg: "#e6f0ff", text: "#2563eb" },
  Rejected: { bg: "#ffeaea", text: "#dc2626" },
  default: { bg: "#f0f0f0", text: "#666" },
};

export default function GradeComplianceScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [completeStage, setCompleteStage] = useState("none");
  const [termRequirements, setTermRequirements] = useState([]);
  const [academicYear, setAcademicYear] = useState("");
  const [currentScholarship, setCurrentScholarship] = useState("");
  const [isLoadingTerms, setIsLoadingTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ gradeReport: "", cor: "", term: "" });
  const [step, setStep] = useState(1);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [step, completeStage, selectedTermId]);
  const [isGraduate, setIsGraduate] = useState(false);

  const resolvedIsGraduate = isGraduate || user?.is_graduate || user?.isGraduate || false;

  const [selectedTermId, setSelectedTermId] = useState(null);
  const [gradeReportFile, setGradeReportFile] = useState(null);
  const [corFile, setCorFile] = useState(null);
  const [nextTermStartDate, setNextTermStartDate] = useState("");
  const [nextTermEndDate, setNextTermEndDate] = useState("");
  const [gwa, setGwa] = useState("");
  const [lastAiSummary, setLastAiSummary] = useState("");
  const [aiCheckingEnabled, setAiCheckingEnabled] = useState(true);



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
      setIsGraduate(payload.isGraduate || false);
      setAcademicYear(payload.academicYear || "");
      setCurrentScholarship(payload.currentScholarship || "");
      setTermRequirements(payload.terms || []);
      setFieldErrors((current) => ({ ...current, term: "" }));
    } catch (error) {
      setIsGraduate(false);
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
    if (selectedTerm?.isLastSemesterBeforeGraduation) {
      setStep(2);
    } else {
      setStep(1);
    }
  }, [selectedTerm]);

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
    setNextTermStartDate("");
    setNextTermEndDate("");
    setGwa("");
    setLastAiSummary("");
    setStep(1);
    setIsSubmitting(false);
    setFieldErrors({ gradeReport: "", cor: "", term: "", nextTermStartDate: "", nextTermEndDate: "", gwa: "" });
    if (clearFeedback) setSuccessMessage("");
  };

  const clearFieldError = (fieldName) => {
    setFieldErrors((current) => ({ ...current, [fieldName]: "" }));
  };

  const pickFile = async (type) => {
    const handleResult = (result) => {
      if (!result.canceled && result.assets && result.assets.length > 0) {
        let file = result.assets[0];
        if (!file.name) {
          file = { ...file, name: file.uri.split('/').pop(), type: file.mimeType || 'image/jpeg' };
        }
        if (type === "gradeReport") {
          setGradeReportFile(file);
          clearFieldError("gradeReport");
        } else if (type === "cor") {
          setCorFile(file);
          clearFieldError("cor");
        }
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
                copyToCacheDirectory: false,
              });
              handleResult(result);
            } catch (err) {
              Alert.alert("Error", "Could not pick a file.");
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

  const handleSubmit = async () => {
    const isGraduating = selectedTerm?.isLastSemesterBeforeGraduation;
    const nextFieldErrors = {
      gradeReport: gradeReportFile ? "" : "Grade report is required.",
      cor: isGraduating || corFile ? "" : "COR is required.",
      term: selectedTerm ? "" : "Please select a term.",
      nextTermStartDate: isGraduating || nextTermStartDate ? "" : "Next term start date is required.",
      nextTermEndDate: isGraduating || nextTermEndDate ? "" : "Next term end date is required.",
      gwa: gwa ? "" : "GWA is required.",
    };

    if (!isGraduating) {
      const startD = nextTermStartDate ? parseStringToDate(nextTermStartDate) : null;
      const endD = nextTermEndDate ? parseStringToDate(nextTermEndDate) : null;
      
      const today = new Date();
      today.setDate(today.getDate() - 1); // 1-day lag buffer
      today.setHours(0, 0, 0, 0);

      if (startD && startD < today) {
        nextFieldErrors.nextTermStartDate = "Start date cannot be in the past.";
      }
      if (startD && endD) {
        const limit = new Date(startD);
        limit.setMonth(limit.getMonth() + 1);
        if (endD < limit) {
          nextFieldErrors.nextTermEndDate = "End date must be at least 1 month after start date.";
        }
      }

      // Validate dates against the Academic Year
      const acadYearStr = academicYear || "2025-2026";
      const years = acadYearStr.match(/\d{4}/g);
      if (years && years.length >= 1) {
        const startYear = parseInt(years[0], 10);
        const endYear = years.length >= 2 ? parseInt(years[1], 10) : startYear;

        if (startD && !nextFieldErrors.nextTermStartDate) {
          const sYear = startD.getFullYear();
          if (sYear < startYear || sYear > endYear) {
            nextFieldErrors.nextTermStartDate = `Start date must be between ${startYear} and ${endYear} (${acadYearStr} academic year).`;
          }
        }
        if (endD && !nextFieldErrors.nextTermEndDate) {
          const eYear = endD.getFullYear();
          if (eYear < startYear || eYear > endYear) {
            nextFieldErrors.nextTermEndDate = `End date must be between ${startYear} and ${endYear} (${acadYearStr} academic year).`;
          }
        }
      }
    }

    setFieldErrors(nextFieldErrors);

    if (
      !selectedTerm ||
      !gradeReportFile ||
      (!isGraduating && (!corFile || !nextTermStartDate || !nextTermEndDate || nextFieldErrors.nextTermStartDate || nextFieldErrors.nextTermEndDate)) ||
      !gwa
    ) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      const response = await submitGradeCompliance({
        term: selectedTerm.term,
        scholarshipName: currentScholarship,
        remarks: "",
        nextTermStartDate: isGraduating ? null : nextTermStartDate,
        nextTermEndDate: isGraduating ? null : nextTermEndDate,
        gwa,
        files: {
          gradeReport: gradeReportFile,
          cor: isGraduating ? null : corFile,
        },
      });

      setAiCheckingEnabled(response?.ai_checking_enabled ?? response?.data?.ai_checking_enabled ?? true);
      setLastAiSummary(response?.data?.ai_summary || "");
      setCompleteStage("preAssessment");
      await loadTerms();
      setIsSubmitting(false);
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
    const isLate = termItem.isLate || false;
    const deadlineStr = termItem.deadline ? new Date(termItem.deadline).toLocaleDateString() : "Not set";

    return (
      <View style={styles.todoCard} key={termItem.id}>
        <View style={styles.todoHeader}>
          <Text style={styles.todoTitle}>{termItem.termLabel}</Text>
          <View style={[styles.badgeBase, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.badgeText, { color: statusColor.text }]}>{termItem.status}</Text>
          </View>
        </View>

        {termItem.submission?.analysis && (
          <View style={styles.analysisFlags}>
            {termItem.submission.analysis.hasInc && (
              <View style={[styles.flagBadge, styles.flagAmber]}>
                <Text style={styles.flagTextAmber}>INC Detected</Text>
              </View>
            )}
            {termItem.submission.analysis.hasFailed && (
              <View style={[styles.flagBadge, styles.flagRed]}>
                <Text style={styles.flagTextRed}>Failed Grade Detected</Text>
              </View>
            )}
            {termItem.submission.analysis.gwaDiscrepancy && (
              <View style={[styles.flagBadge, styles.flagOrange]}>
                <Text style={styles.flagTextOrange}>GWA Mismatch</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.todoGrid}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Academic Year</Text>
            <Text style={styles.gridValue}>{academicYear || "--"}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Deadline</Text>
            <Text style={[styles.gridValue, isLate && { color: "#dc2626" }]}>{deadlineStr}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Documents</Text>
            <Text style={styles.gridValue}>COR • Grades</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Submission</Text>
            <Text style={[styles.gridValue, { color: termItem.status === "Submitted" ? "#0d7c47" : "#b5850a" }]}>
              {termItem.status === "Submitted" ? "Submitted" : "Not Submitted"}
            </Text>
          </View>
        </View>

        {termItem.status === "Submitted" || termItem.status === "Approved" || termItem.status === "Rejected" ? (
          <View style={[styles.submitBtnAction, { backgroundColor: '#b6bdd9' }]}>
            <Text style={[styles.submitBtnActionText, { color: '#ffffff' }]}>Already Submitted</Text>
          </View>
        ) : (() => {
          const currentIdx = termRequirements.findIndex(t => t.id === termItem.id);
          const hasPendingPreviousTerm = termRequirements.slice(0, currentIdx).some(t => t.status === "Pending");
          
          if (hasPendingPreviousTerm) {
            return (
              <View style={[styles.submitBtnAction, { backgroundColor: '#e2e5f1', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="lock-closed-outline" size={15} color="#8c95b7" style={{ marginRight: 6 }} />
                <Text style={[styles.submitBtnActionText, { color: '#8c95b7' }]}>Locked (Submit Previous Term First)</Text>
              </View>
            );
          }
          
          return (
            <TouchableOpacity
              style={styles.submitBtnAction}
              onPress={() => {
                setSelectedTermId(termItem.id);
                clearFieldError("term");
              }}
            >
              <Text style={styles.submitBtnActionText}>Start Submission</Text>
            </TouchableOpacity>
          );
        })()}
      </View>
    );
  };

  const renderUpload = (label, fileObj, type, errorMsg) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={[styles.uploadWrapper, errorMsg && styles.errorInput]} onPress={() => pickFile(type)}>
        <View style={styles.chooseFileBtn}>
          <Text style={styles.chooseFileText}>Choose File</Text>
        </View>
        <View style={styles.fileNameBox}>
          <Text style={[styles.fileNameText, fileObj && { color: "#111" }]} numberOfLines={1}>
            {fileObj ? fileObj.name || "Selected File" : "No file chosen"}
          </Text>
        </View>
      </TouchableOpacity>
      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
    </View>
  );

  const renderContent = () => {
    if (completeStage === "preAssessment") {
      return (
        <ApplicationResultState
          aiCheckingEnabled={aiCheckingEnabled}
          successTitle="Submission Successful!"
          successMessage="Your grade report has been submitted securely."
          aiSummary={lastAiSummary}
          onViewApplications={() => { setCompleteStage("none"); resetFormState(); }}
          viewApplicationsText="Return to List"
        />
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
          {resolvedIsGraduate ? null : (
            <Text style={{ fontSize: 13, color: '#6870a3', marginBottom: 20, marginLeft: 2, fontWeight: '500' }}>
              Academic Year: {academicYear || "2025-2026"}
            </Text>
          )}

          {fieldErrors.term ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{fieldErrors.term}</Text>
            </View>
          ) : null}

          {resolvedIsGraduate ? (
            <GraduationCelebration
              firstName={user?.firstName || user?.first_name}
              onBack={() => navigation.goBack()}
            />
          ) : termRequirements.length === 0 ? (
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
      <View style={styles.formCard}>
        {fieldErrors.term ? (
          <View style={[styles.errorBanner, { marginBottom: 20 }]}>
            <Text style={styles.errorBannerText}>{fieldErrors.term}</Text>
          </View>
        ) : null}
        {!selectedTerm?.isLastSemesterBeforeGraduation && (
          <View style={styles.progressBarWrapper}>
            <View style={styles.progressBarRow}>
              <View style={[styles.progressStep, styles.progressStepActive]} />
              <View style={[styles.progressStep, step === 2 ? styles.progressStepActive : styles.progressStepInactive]} />
            </View>
            <View style={styles.progressBarLabelRow}>
              <Text style={styles.progressTextActive}>COR Submission</Text>
              <Text style={step === 2 ? styles.progressTextActive : styles.progressTextInactive}>Grade Submission</Text>
            </View>
          </View>
        )}

        <View style={styles.stepHeaderRow}>
          <Text style={styles.termTitle}>{selectedTerm?.termLabel}</Text>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>
              {selectedTerm?.isLastSemesterBeforeGraduation
                ? "Grade Submission (Final Semester)"
                : `Step ${step}: ${step === 1 ? "COR Submission" : "Grade Submission"}`}
            </Text>
          </View>
        </View>

        <View style={styles.twoColRow}>
          <View style={styles.col}>
            <Text style={styles.label}>Current Scholarship</Text>
            <View style={[styles.inputReadOnly, { flex: 1 }]}>
              <Text style={styles.inputReadOnlyText}>{currentScholarship || "--"}</Text>
            </View>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Academic Year</Text>
            <View style={[styles.inputReadOnly, { flex: 1 }]}>
              <Text style={styles.inputReadOnlyText}>{academicYear || "2025-2026"}</Text>
            </View>
          </View>
        </View>

        {step === 1 && (
          <>
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>
                <Text style={{ fontWeight: "700" }}>Note:</Text> Please upload the Certificate of Registration (COR) for your <Text style={{ fontWeight: "700" }}>NEXT</Text> upcoming academic term, along with its expected start and end dates.
              </Text>
            </View>
            {renderUpload("Next Term Certificate of Registration (COR)", corFile, "cor", fieldErrors.cor)}
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <FormDatePicker
                  label="Next Term Start Date"
                  value={nextTermStartDate}
                  minimumDate={(() => {
                    const today = new Date();
                    today.setDate(today.getDate() - 1); // 1-day safety buffer
                    return today;
                  })()}
                  onDateChange={(val) => {
                    setNextTermStartDate(val);
                    clearFieldError("nextTermStartDate");
                  }}
                  error={fieldErrors.nextTermStartDate}
                  required
                />
              </View>
              <View style={styles.col}>
                <FormDatePicker
                  label="Next Term End Date"
                  value={nextTermEndDate}
                  minimumDate={(() => {
                    const startD = parseStringToDate(nextTermStartDate);
                    if (startD) {
                      const minEnd = new Date(startD);
                      minEnd.setMonth(minEnd.getMonth() + 1);
                      return minEnd;
                    }
                    const today = new Date();
                    today.setDate(today.getDate() - 1);
                    return today;
                  })()}
                  onDateChange={(val) => {
                    setNextTermEndDate(val);
                    clearFieldError("nextTermEndDate");
                  }}
                  error={fieldErrors.nextTermEndDate}
                  required
                />
              </View>
            </View>
          </>
        )}
        {step === 2 && (
          <>
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>
                {selectedTerm?.isLastSemesterBeforeGraduation ? (
                  <Text>
                    <Text style={{ fontWeight: "700" }}>Note:</Text> This is your <Text style={{ fontWeight: "700" }}>FINAL SEMESTER</Text> before graduation! You only need to upload your Official Grades or Report Card and provide your final GWA. No COR or next term details are required.
                  </Text>
                ) : (
                  <Text>
                    <Text style={{ fontWeight: "700" }}>Note:</Text> Please upload the Official Grades or Report Card for your <Text style={{ fontWeight: "700" }}>RECENTLY COMPLETED</Text> academic term.
                  </Text>
                )}
              </Text>
            </View>
            {renderUpload("Grade Report", gradeReportFile, "gradeReport", fieldErrors.gradeReport)}
            <View style={styles.row}>
              <Text style={styles.label}>General Weighted Average (GWA)</Text>
              <SafeTextInput
                style={[styles.input, fieldErrors.gwa && styles.errorInput]}
                placeholder="e.g., 1.75 or 88.50"
                keyboardType="numeric"
                value={gwa}
                onChangeText={(val) => {
                  setGwa(val);
                  clearFieldError("gwa");
                }}
              />
              <Text style={styles.helperText}>Provide your GWA from your most recent term.</Text>
              {fieldErrors.gwa ? <Text style={styles.errorText}>{fieldErrors.gwa}</Text> : null}
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {selectedTermId && step === 2 && completeStage === "none" ? (
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 10 }}>
          <TouchableOpacity
            onPress={() => {
              if (selectedTerm?.isLastSemesterBeforeGraduation) {
                resetFormState();
              } else {
                setStep(1);
              }
            }}
            style={styles.textBackBtn}
          >
            <Ionicons name="arrow-back" size={16} color="#5b6095" style={{ marginRight: 8 }} />
            <Text style={styles.textBackBtnText}>
              {selectedTerm?.isLastSemesterBeforeGraduation ? "Back to Terms Overview" : "Back to COR Submission"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
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
      )}

      {selectedTermId && step === 2 && completeStage === "none" && (
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          <Text style={styles.titleLanding}>COR & Grade Compliance</Text>
        </View>
      )}

      <ScrollView ref={scrollViewRef} style={styles.content} contentContainerStyle={{ paddingBottom: 60, paddingTop: (!selectedTermId || step === 1) ? 20 : 0 }}>
        <Animated.View style={{ opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          {renderContent()}
        </Animated.View>
      </ScrollView>

      {!isSubmitting && completeStage === "none" && selectedTermId && (
        <View style={styles.footerActionRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => {
              setCompleteStage("none");
              resetFormState();
            }}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          {step === 1 ? (
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={() => {
                const nextFieldErrors = {
                  cor: corFile ? "" : "COR is required.",
                  nextTermStartDate: nextTermStartDate ? "" : "Next term start date is required.",
                  nextTermEndDate: nextTermEndDate ? "" : "Next term end date is required.",
                };
                setFieldErrors(prev => ({ ...prev, ...nextFieldErrors }));

                if (!corFile || !nextTermStartDate || !nextTermEndDate) {
                  return;
                }
                setStep(2);
              }}
            >
              <Text style={styles.nextBtnText}>Continue to Grade Submission</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={handleSubmit}
            >
              <Text style={styles.nextBtnText}>Submit Grade Compliance</Text>
            </TouchableOpacity>
          )}
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
  formCard: { backgroundColor: "#fff", borderRadius: 12, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 3, marginHorizontal: 20, marginBottom: 20 },
  stepHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24, marginTop: 10 },
  termTitle: { flex: 1, fontSize: 18, fontWeight: "900", color: "#1a1a2e", marginRight: 12 },
  stepBadge: { backgroundColor: "#f4effe", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  stepBadgeText: { color: "#7e52d8", fontSize: 12, fontWeight: "700" },
  twoColRow: { flexDirection: "row", gap: 16, marginBottom: 20 },
  col: { flex: 1 },
  progressBarWrapper: { marginBottom: 20 },
  progressBarLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressTextActive: { fontSize: 11, color: '#3d4fa0', fontWeight: '800' },
  progressTextInactive: { fontSize: 11, color: '#6a72b2', fontWeight: '500' },
  progressBarRow: { flexDirection: "row", justifyContent: "space-between" },
  progressStep: { height: 6, flex: 1, marginHorizontal: 2, borderRadius: 3 },
  progressStepActive: { backgroundColor: '#5b5f97' },
  progressStepInactive: { backgroundColor: '#e4e8f6' },
  textBackBtn: { flexDirection: 'row', alignItems: 'center', borderColor: '#dbe2f6', borderWidth: 1, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#fff' },
  textBackBtnText: { fontSize: 13, fontWeight: '700', color: '#5b6095' },
  landingContainer: { paddingHorizontal: 20, paddingTop: 20 },
  landingHeader: { fontSize: 18, fontWeight: "900", color: "#111", marginBottom: 16, marginLeft: 2 },

  todoCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2, borderWidth: 1, borderColor: "#f0f0f0" },
  todoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  todoTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a2e" },
  badgeBase: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  badgeText: { fontSize: 12, fontWeight: "700" },

  todoGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6, marginBottom: 12 },
  gridItem: { width: '50%', paddingHorizontal: 6, marginBottom: 12 },
  gridLabel: { color: "#888", fontSize: 12, marginBottom: 4 },
  gridValue: { color: "#1a1a2e", fontSize: 13, fontWeight: "600" },

  submitBtnAction: { backgroundColor: "#5b5f97", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  submitBtnActionText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  content: { flex: 1 },
  underlinedTitleWrapper: { alignSelf: "flex-start", marginBottom: 20 },
  underlinedTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a2e", borderBottomWidth: 2, borderBottomColor: "#1a1a2e", paddingBottom: 4 },

  row: { marginBottom: 16 },
  label: { fontWeight: "500", color: "#555", fontSize: 14, marginBottom: 8 },
  inputReadOnly: { borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 12, paddingHorizontal: 16, minHeight: 50, paddingVertical: 12, backgroundColor: "#fafafa", justifyContent: 'center' },
  inputReadOnlyText: { color: "#666", fontSize: 14, lineHeight: 20 },

  uploadWrapper: { flexDirection: "row", borderWidth: 1, borderStyle: "dashed", borderColor: "#ccc", borderRadius: 8, backgroundColor: "#fff", overflow: "hidden" },
  chooseFileBtn: { backgroundColor: "#5b5f97", paddingHorizontal: 16, paddingVertical: 12, justifyContent: "center", alignItems: "center", borderRightWidth: 1, borderRightColor: '#ccc' },
  chooseFileText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  fileNameBox: { flex: 1, paddingHorizontal: 12, justifyContent: "center" },
  fileNameText: { color: "#888", fontSize: 13 },
  errorInput: { borderColor: "#dc2626", borderWidth: 2 },
  errorText: { color: "#dc2626", fontSize: 12, marginTop: 4, fontWeight: "500" },

  errorBanner: { backgroundColor: "#fff1f2", borderColor: "#fecaca", borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 },
  errorBannerText: { color: "#b91c1c", fontSize: 14 },
  emptyCard: { backgroundColor: "#fff", borderColor: "#f0f0f0", borderWidth: 1, borderRadius: 12, padding: 24, alignItems: "center" },
  emptyCardText: { color: "#666", fontSize: 14, textAlign: "center", lineHeight: 20 },

  loadingText: { color: "#666", fontSize: 16 },

  footerActionRow: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 30, gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#ccc", borderRadius: 10, paddingVertical: 14, alignItems: "center", justifyContent: 'center' },
  cancelBtnText: { color: "#333", fontSize: 14, fontWeight: "600", textAlign: "center" },
  nextBtn: { flex: 1, backgroundColor: "#5b5f97", borderRadius: 10, paddingVertical: 14, alignItems: "center", justifyContent: 'center', shadowColor: "#2d3a7c", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 4 },
  nextBtnText: { color: "#fff", fontSize: 14, fontWeight: "700", textAlign: "center" },

  centered: { alignItems: "center", justifyContent: "center", marginTop: 40, paddingHorizontal: 20 },
  completeText: { fontSize: 22, fontWeight: "800", color: "#3f4ca8", marginTop: 16, marginBottom: 8 },
  submitBtnOk: { borderRadius: 12, backgroundColor: "#4f5fc5", paddingVertical: 14, paddingHorizontal: 30, marginTop: 20, width: '100%', alignItems: 'center' },
  submitBtnOkText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  infoBanner: { backgroundColor: "#eff6ff", borderColor: "#bfdbfe", borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 16 },
  infoBannerText: { color: "#1e3a8a", fontSize: 13, lineHeight: 18 },

  input: { borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 10, paddingHorizontal: 16, height: 50, backgroundColor: "#fff", color: "#333", fontSize: 14 },
  dateInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { fontSize: 14, color: "#333" },
  helperText: { fontSize: 11, color: "#888", marginTop: 4 },

  aiSummaryCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, width: '100%', borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 3, marginVertical: 10 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  aiIconWrapper: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  aiTitle: { fontSize: 12, fontWeight: '800', color: '#475569', letterSpacing: 1 },
  aiText: { fontSize: 15, color: '#334155', lineHeight: 22, fontStyle: 'italic', fontWeight: '500' },
  aiFooter: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aiFooterText: { fontSize: 10, color: '#64748b' },
  aiFooterBadge: { fontSize: 9, fontWeight: '800', color: '#94a3b8' },

  analysisFlags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  flagBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  flagAmber: { backgroundColor: '#fffbeb', borderColor: '#fef3c7' },
  flagRed: { backgroundColor: '#fef2f2', borderColor: '#fee2e2' },
  flagOrange: { backgroundColor: '#fff7ed', borderColor: '#ffedd5' },
  flagTextAmber: { color: '#b45309', fontSize: 11, fontWeight: '600' },
  flagTextRed: { color: '#b91c1c', fontSize: 11, fontWeight: '600' },
  flagTextOrange: { color: '#c2410c', fontSize: 11, fontWeight: '600' },
  gradCard: {
    backgroundColor: "#1e1b4b",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#1e1b4b",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    overflow: "hidden",
    position: "relative",
    marginBottom: 20,
  },
  gradOuterCircle: {
    position: "absolute",
    top: -50,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
  },
  gradHeaderContainer: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    paddingVertical: 12,
  },
  gradCapCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fbbf24",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#fbbf24",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  gradCapEmoji: {
    fontSize: 40,
  },
  gradTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fef08a",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  gradText: {
    fontSize: 15,
    color: "#ddd6fe",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  gradBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  gradBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  gradBadgeText: {
    color: "#fde047",
    fontSize: 11,
    fontWeight: "700",
  },
  gradNextStepsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    padding: 16,
    width: "100%",
  },
  gradNextStepsTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fbbf24",
    marginBottom: 6,
    letterSpacing: 1,
  },
  gradNextStepsText: {
    fontSize: 13,
    color: "#cbd5e1",
    lineHeight: 18,
  },
});
