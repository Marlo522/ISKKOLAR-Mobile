import React, { useState, useEffect, useRef, useMemo, useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Animated, Alert, KeyboardAvoidingView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import SafeTextInput from "../components/SafeTextInput";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { validateAndSanitizeFile } from "../utils/fileSanitizer";
import FormDatePicker from "../components/FormDatePicker";
import GraduationCelebration from "../components/GraduationCelebration";
import { getGradeComplianceTerms, submitGradeCompliance, evaluateGradeCompliance } from "../services/gradeComplianceService";
import { AuthContext } from "../context/AuthContext";
import ApplicationResultState from "../components/ApplicationResultState";
import { useGradeCompliance } from "../hooks/useGradeCompliance";
import { validateGwa, INVALID_GWA_ERROR } from "../utils/gradeValidation";
import ApplicationSubmissionGuard from "../components/ApplicationSubmissionGuard";
import LoadingOverlay from "../components/LoadingOverlay";

const statusColors = {
  Pending: { bg: "#fff8e6", text: "#b5850a" },
  Submitted: { bg: "#e6f7ef", text: "#0d7c47" },
  Approved: { bg: "#e6f0ff", text: "#2563eb" },
  Rejected: { bg: "#ffeaea", text: "#dc2626" },
  default: { bg: "#f0f0f0", text: "#666" },
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const parseDateOnly = (value) => {
  if (!value) return null;

  const text = String(value).trim();

  // Try matching ISO format YYYY-MM-DD
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }

  // Try matching slash format MM/DD/YYYY
  const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    return new Date(Number(slashMatch[3]), Number(slashMatch[1]) - 1, Number(slashMatch[2]));
  }

  // Fallback
  const date = new Date(text);
  return Number.isNaN(date.getTime())
    ? null
    : new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const getTodayDateOnly = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const addOneMonth = (date) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
};

const addSixMonths = (date) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 6);
  return next;
};

const getSubmissionWindowState = (term) => {
  const deadline = parseDateOnly(term?.deadline);

  if (!deadline) {
    return {
      deadline: null,
      isTooEarly: false,
      isLate: false,
      message: "",
    };
  }

  const today = getTodayDateOnly();
  const opensAt = parseDateOnly(term?.currentTermEndDate)
    || new Date(deadline.getTime() - (14 * MS_PER_DAY));

  if (today < opensAt) {
    return {
      deadline,
      isTooEarly: true,
      isLate: false,
      message: `Grade compliance submission opens on the term end date: ${opensAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}.`,
    };
  }

  if (today > deadline) {
    return {
      deadline,
      isTooEarly: false,
      isLate: true,
      message: `The deadline passed on ${deadline.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}. You can still submit, but it will be marked late.`,
    };
  }

  return {
    deadline,
    isTooEarly: false,
    isLate: false,
    message: "",
  };
};

const validateNextTermDates = (currentTermEndDate, startDateValue, endDateValue) => {
  const issues = [];
  const startDate = parseDateOnly(startDateValue);
  const endDate = parseDateOnly(endDateValue);
  const currentEndDate = parseDateOnly(currentTermEndDate);

  if (startDate && currentEndDate && startDate <= currentEndDate) {
    issues.push({
      field: "nextTermStartDate",
      message: `Start date must be after the current term ends on ${currentEndDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}.`,
    });
  }

  if (startDate && endDate) {
    const minimumEndDate = addOneMonth(startDate);
    if (endDate < minimumEndDate) {
      issues.push({
        field: "nextTermEndDate",
        message: `End date must be at least 1 month after start date (${minimumEndDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })} or later).`,
      });
    }

    const maximumEndDate = addSixMonths(startDate);
    if (endDate > maximumEndDate) {
      issues.push({
        field: "nextTermEndDate",
        message: `End date must be at most 6 months after start date (${maximumEndDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })} or earlier).`,
      });
    }
  }

  return issues;
};

export default function GradeComplianceScreen({ navigation }) {
  const { user, refreshSession } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const { isCheckingGuard, ongoingApplication } = useGradeCompliance();
  const [completeStage, setCompleteStage] = useState("none");
  const [termRequirements, setTermRequirements] = useState([]);
  const [academicYear, setAcademicYear] = useState("");
  const [currentScholarship, setCurrentScholarship] = useState("");
  const [isLoadingTerms, setIsLoadingTerms] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ gradeReport: "", cor: "", term: "", nextTermStartDate: "", nextTermEndDate: "", gwa: "" });
  const [submissionStep, setSubmissionStep] = useState("cor");
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [selectedTermId, setSelectedTermId] = useState(null);
  const [gradeReportFile, setGradeReportFile] = useState(null);
  const [corFile, setCorFile] = useState(null);
  const [nextTermStartDate, setNextTermStartDate] = useState("");
  const [nextTermEndDate, setNextTermEndDate] = useState("");
  const [gwa, setGwa] = useState("");
  const [lastAiSummary, setLastAiSummary] = useState("");
  const [aiCheckingEnabled, setAiCheckingEnabled] = useState(true);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [submissionStep, completeStage, selectedTermId]);

  const [isGraduate, setIsGraduate] = useState(false);

  const resolvedIsGraduate = isGraduate || user?.is_graduate || user?.isGraduate || false;

  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;

  const selectedTerm = useMemo(
    () => termRequirements.find((item) => item.id === selectedTermId) || null,
    [termRequirements, selectedTermId]
  );

  const currentTermEndDate = selectedTerm?.currentTermEndDate || selectedTerm?.endDate || "";
  const isBusy = isEvaluating || isSubmitting;

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
  }, [selectedTermId, completeStage, isBusy, submissionStep, stepAnim]);

  useEffect(() => {
    if (selectedTerm?.isLastSemesterBeforeGraduation) {
      setSubmissionStep("grade");
    } else {
      setSubmissionStep("cor");
    }
  }, [selectedTerm]);

  useEffect(() => {
    if (isBusy) {
      spinAnim.setValue(0);
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [isBusy, spinAnim]);

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

  if (isCheckingGuard) {
    return (
      <ApplicationSubmissionGuard
        isChecking={true}
        ongoingApplication={null}
        onBack={() => navigation.goBack()}
        onViewApplications={() => navigation.navigate("Application")}
      />
    );
  }

  if (ongoingApplication) {
    return (
      <ApplicationSubmissionGuard
        isChecking={false}
        ongoingApplication={ongoingApplication}
        onBack={() => navigation.goBack()}
        onViewApplications={() => navigation.navigate("Application")}
      />
    );
  }

  const resetFormState = () => {
    setSelectedTermId(null);
    setGradeReportFile(null);
    setCorFile(null);
    setNextTermStartDate("");
    setNextTermEndDate("");
    setGwa("");
    setLastAiSummary("");
    setSubmissionStep("cor");
    setEvaluationResult(null);
    setIsEvaluating(false);
    setIsSubmitting(false);
    setFieldErrors({ gradeReport: "", cor: "", term: "", nextTermStartDate: "", nextTermEndDate: "", gwa: "" });
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
        const sanitized = validateAndSanitizeFile(file);
        if (!sanitized) return;
        setEvaluationResult(null);
        if (type === "gradeReport") {
          setGradeReportFile(sanitized);
          clearFieldError("gradeReport");
        } else if (type === "cor") {
          setCorFile(sanitized);
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
            } catch (_err) {
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
            } catch (_err) {
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



  const validateCorStep = () => {
    const nextFieldErrors = {
      cor: corFile ? "" : "Certificate of Registration is required.",
      nextTermStartDate: nextTermStartDate ? "" : "Next term start date is required.",
      nextTermEndDate: nextTermEndDate ? "" : "Next term end date is required.",
    };

    const dateIssues = validateNextTermDates(currentTermEndDate, nextTermStartDate, nextTermEndDate);

    dateIssues.forEach(({ field, message }) => {
      nextFieldErrors[field] = message;
    });

    setFieldErrors((current) => ({
      ...current,
      ...nextFieldErrors,
    }));

    if (!corFile || !nextTermStartDate || !nextTermEndDate || dateIssues.length > 0) {
      return false;
    }

    return true;
  };

  const handleContinueToGrade = () => {
    if (!validateCorStep()) return;

    setSubmissionStep("grade");
  };

  const validateGradeStep = () => {
    const submissionWindowState = getSubmissionWindowState(selectedTerm);
    const nextFieldErrors = {
      gradeReport: gradeReportFile ? "" : "Grade report is required.",
      term: submissionWindowState.isTooEarly ? submissionWindowState.message : (selectedTerm ? "" : "Please select a term."),
      gwa: !gwa ? "GWA is required." : (!validateGwa(gwa) ? INVALID_GWA_ERROR : ""),
    };

    setFieldErrors((current) => ({
      ...current,
      ...nextFieldErrors,
    }));

    if (
      !selectedTerm ||
      submissionWindowState.isTooEarly ||
      !gradeReportFile ||
      !gwa ||
      nextFieldErrors.gwa
    ) {
      return false;
    }

    if (selectedTerm.status === "Submitted") {
      setFieldErrors((current) => ({
        ...current,
        term: "This term has already been submitted and cannot be submitted again.",
      }));
      return false;
    }

    return true;
  };

  const applyApiFieldErrors = (error) => {
    const rawErrors =
      (Array.isArray(error?.errors) && error.errors.length > 0 ? error.errors : null) ||
      (Array.isArray(error?.data?.errors) && error.data.errors.length > 0 ? error.data.errors : null) ||
      [];

    if (rawErrors.length > 0) {
      const FIELD_MAP = {
        gradeReport: "gradeReport",
        grade_report: "gradeReport",
        cor: "cor",
        nextTermStartDate: "nextTermStartDate",
        next_term_start_date: "nextTermStartDate",
        nextTermEndDate: "nextTermEndDate",
        next_term_end_date: "nextTermEndDate",
        gwa: "gwa",
        term: "term",
        scholarshipName: "term",
        scholarship_name: "term",
      };

      const mappedErrors = {};
      let termMessage = "";

      rawErrors.forEach((e) => {
        const rawField = Array.isArray(e?.path)
          ? e.path[0]
          : (e?.field || e?.param || "");
        const key = String(rawField).trim();
        const uiKey = FIELD_MAP[key] || FIELD_MAP[key.toLowerCase()];
        const msg = e?.message || e?.msg || "Invalid value.";

        if (uiKey) {
          mappedErrors[uiKey] = msg;
        } else {
          termMessage = termMessage ? `${termMessage} ${msg}` : msg;
        }
      });

      if (termMessage) {
        mappedErrors.term = termMessage;
      }

      setFieldErrors((current) => ({
        ...current,
        ...mappedErrors,
      }));
      return true;
    }
    return false;
  };

  const hasCorStepApiErrors = (error) => {
    const rawErrors =
      (Array.isArray(error?.errors) && error.errors.length > 0 ? error.errors : null) ||
      (Array.isArray(error?.data?.errors) && error.data.errors.length > 0 ? error.data.errors : null) ||
      [];

    const corStepFields = new Set([
      "cor",
      "nextTermStartDate",
      "next_term_start_date",
      "nextTermEndDate",
      "next_term_end_date",
    ]);

    return rawErrors.some((e) => {
      const rawField = Array.isArray(e?.path)
        ? e.path[0]
        : (e?.field || e?.param || "");

      return corStepFields.has(String(rawField).trim());
    });
  };

  const buildSubmissionPayload = () => {
    const isGraduating = selectedTerm?.isLastSemesterBeforeGraduation;

    const payload = {
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
    };

    if (evaluationResult) {
      const getVal = (paths) => {
        for (const path of paths) {
          let curr = evaluationResult;
          for (const key of path) {
            curr = curr?.[key];
          }
          if (curr !== undefined) return curr;
        }
        return undefined;
      };

      const aiSummary = getVal([['ai_summary'], ['grade_analysis', 'ai_summary'], ['data', 'ai_summary'], ['data', 'grade_analysis', 'ai_summary']]);
      const extractedGwa = getVal([['grade_analysis', 'extracted_gwa'], ['data', 'grade_analysis', 'extracted_gwa']]);
      const gwaDiscrepancy = getVal([['grade_analysis', 'gwa_discrepancy'], ['data', 'grade_analysis', 'gwa_discrepancy']]);
      const hasInc = getVal([['grade_analysis', 'has_inc_subjects'], ['data', 'grade_analysis', 'has_inc_subjects']]);
      const hasFailed = getVal([['grade_analysis', 'has_failed_subjects'], ['data', 'grade_analysis', 'has_failed_subjects']]);
      const isGwaQualified = getVal([['grade_analysis', 'is_gwa_qualified'], ['data', 'grade_analysis', 'is_gwa_qualified']]);
      const notes = getVal([['grade_analysis', 'grade_deficiency_notes'], ['data', 'grade_analysis', 'grade_deficiency_notes']]);

      payload.preEvaluated = true;
      payload.aiSummary = aiSummary !== undefined ? aiSummary : "";
      payload.extractedGwa = extractedGwa;
      payload.gwaDiscrepancy = gwaDiscrepancy;
      payload.hasInc = hasInc;
      payload.hasFailed = hasFailed;
      payload.isGwaQualified = isGwaQualified;
      payload.gradeDeficiencyNotes = notes ? JSON.stringify(notes) : "[]";
    }

    return payload;
  };

  const getAiSummary = (payload) => (
    payload?.grade_analysis?.ai_summary ||
    payload?.ai_summary ||
    payload?.data?.grade_analysis?.ai_summary ||
    payload?.data?.ai_summary ||
    ""
  );

  const handleEvaluate = async () => {
    if (!selectedTerm?.isLastSemesterBeforeGraduation && !validateCorStep()) {
      setSubmissionStep("cor");
      return;
    }

    if (!validateGradeStep()) return;

    setIsEvaluating(true);
    setEvaluationResult(null);

    try {
      const evaluateResponse = await evaluateGradeCompliance(buildSubmissionPayload());

      const resData = evaluateResponse?.data || evaluateResponse || {};
      setEvaluationResult(resData);
      setLastAiSummary(getAiSummary(resData));
      setIsEvaluating(false);
      setSubmissionStep("review");
    } catch (error) {
      if (applyApiFieldErrors(error)) {
        if (hasCorStepApiErrors(error)) {
          setSubmissionStep("cor");
        }
        return;
      }

      setFieldErrors((current) => ({
        ...current,
        term: error?.message || "Failed to evaluate grade compliance.",
      }));
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSubmit = async () => {
    if (!evaluationResult && !validateGradeStep()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await submitGradeCompliance(buildSubmissionPayload());

      setAiCheckingEnabled(response?.ai_checking_enabled ?? response?.data?.ai_checking_enabled ?? true);
      setLastAiSummary(getAiSummary(response));
      setCompleteStage("preAssessment");
      setIsSubmitting(false);
      await Promise.all([
        loadTerms(),
        refreshSession?.().catch(() => null),
      ]);
    } catch (error) {
      if (applyApiFieldErrors(error)) return;

      const raw = error?.message || "";
      const isGenericValidation = /validation|invalid|bad request/i.test(raw);
      setFieldErrors((current) => ({
        ...current,
        term: isGenericValidation
          ? "Some fields could not be validated. Please review your form and try again."
          : raw || "Failed to submit grade compliance.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTodoCard = (termItem, idx) => {
    const statusColor = statusColors[termItem.status] || statusColors.default;
    const previousTerm = idx > 0 ? termRequirements[idx - 1] : null;
    const isPreviousPending = previousTerm && previousTerm.status === "Pending";
    const isSubmittedOrApproved = ["Submitted", "Approved", "Compliant"].includes(termItem.status);
    const submissionWindowState = getSubmissionWindowState(termItem);
    const isTooEarly = submissionWindowState.isTooEarly;
    const isLate = submissionWindowState.isLate;
    const isDisabled = isSubmittedOrApproved || isPreviousPending || isTooEarly;
    const deadlineStr = termItem.deadline ? new Date(termItem.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "Not set";

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
            {termItem.submission.analysis.isGwaQualified === false && (
              <View style={[styles.flagBadge, styles.flagRose]}>
                <Text style={styles.flagTextRose}>GWA Below 85%</Text>
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
            <Text style={[styles.gridValue, isLate && { color: "#dc2626" }]}>
              {deadlineStr} {isLate ? "(Late)" : ""}
            </Text>
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

        <TouchableOpacity
          style={[
            styles.submitBtnAction,
            isDisabled && { backgroundColor: '#b8bbd9' }
          ]}
          disabled={isDisabled}
          onPress={() => {
            setSelectedTermId(termItem.id);
            clearFieldError("term");
          }}
        >
          <Text style={styles.submitBtnActionText}>
            {isSubmittedOrApproved
              ? "Already Submitted"
              : isPreviousPending
                ? "Complete previous term first"
                : isTooEarly
                  ? "Submission not yet open"
                  : isLate
                    ? "Start Submission (Late)"
                    : "Start Submission"}
          </Text>
        </TouchableOpacity>

        {(isTooEarly || isLate) && (
          <Text style={[styles.windowMessageText, isLate && styles.lateMessageText]}>
            {submissionWindowState.message}
          </Text>
        )}
      </View>
    );
  };

  const renderUpload = (label, fileObj, type, errorMsg) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={[styles.unifiedUploadContainer, errorMsg && styles.errorInput]} onPress={() => pickFile(type)}>
        <Ionicons
          name="share-outline"
          size={18}
          color={fileObj ? "#4f5fc5" : "#848baf"}
          style={{ marginRight: 8 }}
        />
        <Text
          style={[
            styles.unifiedUploadText,
            fileObj ? styles.unifiedUploadTextActive : styles.unifiedUploadTextInactive
          ]}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {fileObj ? fileObj.name || "Selected File" : "No file chosen"}
        </Text>
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
          onViewApplications={() => {
            setCompleteStage("none");
            resetFormState();
            navigation.navigate("ScholarDashboardMain");
          }}
          viewApplicationsText="Return to Dashboard"
        />
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
          <Text style={[styles.landingHeader, { marginBottom: 4 }]}>Certificate of Registration & Grade Compliance</Text>
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
            termRequirements.map((term, idx) => renderTodoCard(term, idx))
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

        {getSubmissionWindowState(selectedTerm).isLate && (
          <View style={styles.lateBanner}>
            <Ionicons name="warning-outline" size={16} color="#b45309" style={{ marginRight: 8 }} />
            <Text style={styles.lateBannerText}>
              {getSubmissionWindowState(selectedTerm).message}
            </Text>
          </View>
        )}

        {!selectedTerm?.isLastSemesterBeforeGraduation && (
          <View style={styles.progressBarWrapper}>
            <View style={styles.progressBarRow}>
              <View style={[styles.progressStep, styles.progressStepActive]} />
              <View style={[styles.progressStep, (submissionStep === "grade" || submissionStep === "review") ? styles.progressStepActive : styles.progressStepInactive]} />
              <View style={[styles.progressStep, submissionStep === "review" ? styles.progressStepActive : styles.progressStepInactive]} />
            </View>
            <View style={styles.progressBarLabelRow}>
              <Text style={styles.progressTextActive}>COR Submission</Text>
              <Text style={(submissionStep === "grade" || submissionStep === "review") ? styles.progressTextActive : styles.progressTextInactive}>Grade Submission</Text>
              <Text style={submissionStep === "review" ? styles.progressTextActive : styles.progressTextInactive}>AI Review</Text>
            </View>
          </View>
        )}

        <View style={styles.stepHeaderRow}>
          <Text style={styles.termTitle}>{selectedTerm?.termLabel}</Text>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>
              {selectedTerm?.isLastSemesterBeforeGraduation
                ? (submissionStep === "review" ? "AI Review" : "Grade Submission (Final Semester)")
                : submissionStep === "cor"
                  ? "Step 1: COR Submission"
                  : submissionStep === "grade"
                    ? "Step 2: Grade Submission"
                    : "Step 3: AI Review"}
            </Text>
          </View>
        </View>

        {submissionStep !== "review" && (
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
        )}

        {submissionStep === "cor" && (
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
                  dateFormat="yyyy-mm-dd"
                  minimumDate={(() => {
                    const termEnd = selectedTerm?.currentTermEndDate || selectedTerm?.endDate;
                    if (termEnd) {
                      const d = parseDateOnly(termEnd);
                      if (d) {
                        const next = new Date(d);
                        next.setDate(next.getDate() + 1);
                        return next;
                      }
                    }
                    const today = new Date();
                    today.setDate(today.getDate() - 1);
                    return today;
                  })()}
                  onDateChange={(val) => {
                    setNextTermStartDate(val);
                    setEvaluationResult(null);
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
                  dateFormat="yyyy-mm-dd"
                  minimumDate={(() => {
                    const startD = parseDateOnly(nextTermStartDate);
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
                    setEvaluationResult(null);
                    clearFieldError("nextTermEndDate");
                  }}
                  error={fieldErrors.nextTermEndDate}
                  required
                />
              </View>
            </View>
          </>
        )}

        {submissionStep === "grade" && (
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
                  setEvaluationResult(null);
                  clearFieldError("gwa");
                }}
              />
              <Text style={styles.helperText}>Provide your GWA from your most recent term.</Text>
              {fieldErrors.gwa ? <Text style={styles.errorText}>{fieldErrors.gwa}</Text> : null}
            </View>
          </>
        )}

        {submissionStep === "review" && (
          <View style={styles.reviewContainer}>
            <View style={styles.reviewHeader}>
              <View style={styles.sparklesCircle}>
                <Ionicons name="sparkles" size={18} color="#fff" />
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.reviewHeaderTitle}>AI Evaluation</Text>
                <Text style={styles.reviewHeaderSubtitle}>Review the evaluation before final submission.</Text>
              </View>
            </View>

            {evaluationResult?.grade_analysis?.ai_summary || evaluationResult?.ai_summary ? (
              <View style={styles.aiSummaryBubble}>
                <Text style={styles.aiSummaryText}>
                  {`"${evaluationResult.grade_analysis?.ai_summary || evaluationResult.ai_summary}"`}
                </Text>
              </View>
            ) : (
              <View style={styles.aiSummaryBubble}>
                <Text style={[styles.aiSummaryText, { color: '#64748b', fontStyle: 'normal' }]}>
                  AI checking did not return a written summary, but the submission can still be reviewed below.
                </Text>
              </View>
            )}

            <View style={styles.reviewGrid}>
              <View style={styles.reviewGridCol}>
                <View style={styles.reviewGridItem}>
                  <Text style={styles.reviewGridLabel}>Declared GWA</Text>
                  <Text style={styles.reviewGridValue}>{evaluationResult?.grade_analysis?.declared_gwa ?? gwa ?? "--"}</Text>
                </View>
              </View>
              <View style={styles.reviewGridCol}>
                <View style={styles.reviewGridItem}>
                  <Text style={styles.reviewGridLabel}>Extracted GWA</Text>
                  <Text style={styles.reviewGridValue}>{evaluationResult?.grade_analysis?.extracted_gwa ?? "Not detected"}</Text>
                </View>
              </View>
              <View style={styles.reviewGridCol}>
                <View style={styles.reviewGridItem}>
                  <Text style={styles.reviewGridLabel}>GWA Status</Text>
                  <Text style={[
                    styles.reviewGridValue,
                    evaluationResult?.grade_analysis?.is_gwa_qualified === false ? { color: '#e11d48' } : { color: '#059669' }
                  ]}>
                    {evaluationResult?.grade_analysis?.is_gwa_qualified === false ? "Below requirement" : "Qualified"}
                  </Text>
                </View>
              </View>
              <View style={styles.reviewGridCol}>
                <View style={styles.reviewGridItem}>
                  <Text style={styles.reviewGridLabel}>Document Flags</Text>
                  <Text style={styles.reviewGridValue}>
                    {[
                      evaluationResult?.grade_analysis?.has_inc_subjects ? "INC detected" : null,
                      evaluationResult?.grade_analysis?.has_failed_subjects ? "Failed subject detected" : null,
                      evaluationResult?.grade_analysis?.gwa_discrepancy ? "GWA mismatch" : null,
                    ].filter(Boolean).join(", ") || "No flags"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={['#ffffff', '#f1f2fa']}
        style={[styles.container, { backgroundColor: 'transparent' }]}
      >
        {selectedTermId && submissionStep !== "cor" && completeStage === "none" ? (
          <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 10 }}>
            <TouchableOpacity
              onPress={() => {
                if (submissionStep === "review") {
                  setSubmissionStep("grade");
                } else if (submissionStep === "grade") {
                  if (selectedTerm?.isLastSemesterBeforeGraduation) {
                    resetFormState();
                  } else {
                    setSubmissionStep("cor");
                  }
                }
              }}
              style={styles.textBackBtn}
            >
              <Ionicons name="arrow-back" size={16} color="#5b6095" style={{ marginRight: 8 }} />
              <Text style={styles.textBackBtnText}>
                {submissionStep === "review"
                  ? "Back to Grade Submission"
                  : selectedTerm?.isLastSemesterBeforeGraduation
                    ? "Back to Terms Overview"
                    : "Back to COR Submission"}
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
              <Text style={styles.titleLanding}>Certificate of Registration & Grade Compliance</Text>
              <Text style={styles.subtitleLanding} numberOfLines={1}>
                {selectedTerm ? `Submit grades for ${selectedTerm.termLabel}` : "Track your academic standing"}
              </Text>
            </View>

            <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8}>
              <Ionicons name="notifications-outline" size={24} color="#6a72b2" />
            </TouchableOpacity>
          </View>
        )}

        {selectedTermId && submissionStep !== "cor" && completeStage === "none" && (
          <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
            <Text style={styles.titleLanding}>Certificate of Registration & Grade Compliance</Text>
          </View>
        )}

        <ScrollView ref={scrollViewRef} style={styles.content} contentContainerStyle={{ paddingBottom: 60, paddingTop: (!selectedTermId || submissionStep === "cor") ? 20 : 0 }}>
          <Animated.View style={{ opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
            {renderContent()}
          </Animated.View>
        </ScrollView>

        {completeStage === "none" && selectedTermId && (
          <View style={styles.footerActionRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              disabled={isBusy}
              onPress={() => {
                setCompleteStage("none");
                resetFormState();
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            {submissionStep === "cor" && (
              <TouchableOpacity
                style={{ flex: 1, borderRadius: 10, overflow: "hidden" }}
                onPress={handleContinueToGrade}
                disabled={isBusy}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#5b5f97', '#727ab6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.nextBtn, { width: "100%", backgroundColor: 'transparent' }]}
                >
                  <Text style={styles.nextBtnText}>Continue to Grade Submission</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {submissionStep === "grade" && (
              <TouchableOpacity
                style={{ flex: 1, borderRadius: 10, overflow: "hidden" }}
                onPress={handleEvaluate}
                disabled={isBusy}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#5b5f97', '#727ab6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.nextBtn, { width: "100%", backgroundColor: 'transparent' }]}
                >
                  <Text style={styles.nextBtnText}>{isEvaluating ? "Evaluating..." : "Next: AI Evaluation"}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {submissionStep === "review" && (
              <TouchableOpacity
                style={{ flex: 1, borderRadius: 10, overflow: "hidden" }}
                onPress={handleSubmit}
                disabled={isBusy}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#5b5f97', '#727ab6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.nextBtn, { width: "100%", backgroundColor: 'transparent' }]}
                >
                  <Text style={styles.nextBtnText}>{isSubmitting ? "Submitting..." : "Submit Grade Compliance"}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}
        <LoadingOverlay
          visible={isBusy}
          message={isEvaluating ? "Evaluating documents..." : "Uploading documents..."}
        />
      </LinearGradient>
    </KeyboardAvoidingView>
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
  lateBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  lateBannerText: {
    color: "#b45309",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    lineHeight: 18,
  },
  disabledBtnAction: {
    backgroundColor: "#e2e5f1",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  windowMessageText: {
    marginTop: 8,
    color: "#b5850a",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  lateMessageText: {
    color: "#b45309",
  },
  flagRose: { backgroundColor: '#fff1f2', borderColor: '#ffe4e6' },
  flagTextRose: { color: '#e11d48', fontSize: 11, fontWeight: '600' },
  reviewContainer: {
    backgroundColor: "#f7f8ff",
    borderColor: "#d8def8",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sparklesCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#5b5f97",
    justifyContent: "center",
    alignItems: "center",
  },
  reviewHeaderTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3d4076",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  reviewHeaderSubtitle: {
    fontSize: 11,
    color: "#667085",
    marginTop: 2,
  },
  aiSummaryBubble: {
    backgroundColor: "#fff",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  aiSummaryText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
    fontStyle: "italic",
    fontWeight: "500",
  },
  reviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  reviewGridCol: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  reviewGridItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  reviewGridLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#667085",
    textTransform: "uppercase",
  },
  reviewGridValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a2e",
    marginTop: 4,
  },
});
