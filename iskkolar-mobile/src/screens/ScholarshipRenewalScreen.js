import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import SafeTextInput from "../components/SafeTextInput";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import GraduationCelebration from '../components/GraduationCelebration';
import ApplicationResultState from '../components/ApplicationResultState';

// Import our new services that match the web backend calls
import {
  submitScholarshipRenewal,
  checkScholarEligibility,
  fetchScholarAcademicStatus
} from '../services/scholarshipRenewalService';

// Form Steps defining the flow of the renewal process
const steps = [
  { key: 'status', label: 'Scholar Status' },
  { key: 'review', label: 'Review & Submit' },
];

// Helper to calculate the next academic year based on a given string like "2024-2025"
const getNextAcademicYear = (value) => {
  const match = /^(\d{4})-(\d{4})$/.exec(value?.trim() || '');
  if (!match) return '';
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return '';
  return `${start + 1}-${end + 1}`;
};

// Helper to determine the current academic year based on the current date
const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startYear = month >= 6 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
};

// Helper to count words in a string
const countWords = (str) => {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
};

export default function ScholarshipRenewalScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [academicStatus, setAcademicStatus] = useState(null);

  const resolvedIsGraduate = user?.is_graduate || user?.isGraduate || academicStatus?.isGraduate || academicStatus?.is_graduate || false;

  // Auto-fill values from fetched academic status or user context
  const autoSchool = academicStatus?.school_name || user?.school || '';
  const autoProgram = academicStatus?.program || user?.course || user?.program || '';
  const autoGwa = academicStatus?.latest_gwa || user?.gwa || '';
  const autoAcademicYear = academicStatus?.academic_year || getCurrentAcademicYear();
  const autoTerm = academicStatus?.current_term || user?.term || '';

  // State management for the current step (1 or 2)
  const [currentStep, setCurrentStep] = useState(1);

  // Form fields state
  const [form, setForm] = useState({
    academicYear: autoAcademicYear,
    term: autoTerm,
    gwa: autoGwa ? String(autoGwa) : '',
    school: autoSchool,
    program: autoProgram,
    remarks: '',
    challenge_response: '',
    accomplishment_response: '',
    eap_reflection_response: '',
  });

  // State for the final confirmation checkbox
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [aiFeedback, setAiFeedback] = useState(null);
  const [aiCheckingEnabled, setAiCheckingEnabled] = useState(true);

  // Eligibility state from the AI checker backend
  const [eligibility, setEligibility] = useState(null);
  const [loadingEligibility, setLoadingEligibility] = useState(true);

  const hasFailedSubjects = Boolean(
    eligibility?.detailedData?.hasFailedSubjects ||
    eligibility?.tags?.some((tag) => tag.toLowerCase().includes('failed')) ||
    eligibility?.aiEvaluation?.recommended_action === 'Reject'
  );

  const alreadyRenewed = Boolean(
    eligibility?.alreadyRenewed ||
    eligibility?.detailedData?.alreadyRenewed
  );

  const isContinueDisabled = loadingEligibility || hasFailedSubjects || alreadyRenewed;

  useEffect(() => {
    console.log('Eligibility state:', eligibility);
    console.log('hasFailedSubjects:', hasFailedSubjects);
    console.log('alreadyRenewed:', alreadyRenewed);
    console.log('isContinueDisabled:', isContinueDisabled);
  }, [eligibility, hasFailedSubjects, alreadyRenewed, isContinueDisabled]);

  // Animations
  const stepAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (submitting) {
      spinAnim.setValue(0);
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.stopAnimation();
    }
  }, [submitting, spinAnim]);

  // Trigger step transition animation
  useEffect(() => {
    stepAnim.setValue(0);
    Animated.timing(stepAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [currentStep, success, submitting, stepAnim]);

  // Keep form auto-filled values in sync if user context changes
  useEffect(() => {
    setForm((prev) => {
      // Helper to determine if a term or year is more "advanced" than another
      // For academic year (e.g. "2025-2026" vs "2024-2025")
      const getYearVal = (yr) => {
        const match = /^(\d{4})/.exec(yr || '');
        return match ? parseInt(match[1], 10) : 0;
      };

      const getTermVal = (t) => {
        if (!t) return 0;
        const termLower = t.toLowerCase();
        if (termLower.includes('1st') || termLower.includes('first')) return 1;
        if (termLower.includes('2nd') || termLower.includes('second')) return 2;
        if (termLower.includes('3rd') || termLower.includes('third')) return 3;
        if (termLower.includes('summer')) return 4;
        return 0;
      };

      // Check if existing state has more advanced standing than incoming auto values
      const currentYearVal = getYearVal(prev.academicYear);
      const incomingYearVal = getYearVal(autoAcademicYear);

      const currentTermVal = getTermVal(prev.term);
      const incomingTermVal = getTermVal(autoTerm);

      const shouldKeepCurrentYear = currentYearVal > incomingYearVal;
      const shouldKeepCurrentTerm = currentYearVal === incomingYearVal && currentTermVal > incomingTermVal;

      return {
        ...prev,
        school: prev.school || autoSchool,
        program: prev.program || autoProgram,
        gwa: prev.gwa || (autoGwa ? String(autoGwa) : ''),
        academicYear: shouldKeepCurrentYear ? prev.academicYear : (autoAcademicYear || prev.academicYear),
        term: shouldKeepCurrentTerm ? prev.term : (autoTerm || prev.term),
      };
    });
  }, [autoSchool, autoProgram, autoGwa, autoAcademicYear, autoTerm]);

  // Fetch AI eligibility status on mount
  useEffect(() => {
    let mounted = true;
    const fetchEligibility = async () => {
      try {
        setLoadingEligibility(true);
        const res = await checkScholarEligibility();
        if (mounted && res?.success) {
          setEligibility(res.data);
        }
      } catch (err) {
        console.error('Eligibility check failed:', err);
      } finally {
        if (mounted) setLoadingEligibility(false);
      }
    };
    fetchEligibility();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch academic status snapshot on mount
  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      try {
        const res = await fetchScholarAcademicStatus();
        if (mounted && res?.success && res.data) {
          setAcademicStatus(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch academic status:", err);
      }
    };
    fetchStatus();
    return () => { mounted = false; };
  }, []);

  // Clear a specific field's error when it is updated
  const clearFieldError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Helper to update text form fields
  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  // Form validation per step
  const validate = (step) => {
    const nextErrors = {};
    if (step === 1) {
      if (hasFailedSubjects) {
        nextErrors.eligibility = 'Renewal blocked: You have failed subjects in your academic record.';
      } else if (alreadyRenewed) {
        nextErrors.eligibility = 'Renewal blocked: Scholarship renewal can only be submitted once a year.';
      }

      if (!form.academicYear.trim()) {
        nextErrors.academicYear = 'Auto-filled from current academic year.';
      } else if (!/^\d{4}-\d{4}$/.test(form.academicYear.trim())) {
        nextErrors.academicYear = 'Use YYYY-YYYY format';
      }

      if (!form.term.trim()) {
        nextErrors.term = 'Auto-filled from your latest term. Submit grade compliance to proceed.';
      }

      if (!form.school.trim() || form.school.trim().length < 2) {
        nextErrors.school = 'Auto-filled from your application. Complete application to proceed.';
      }

      if (!form.program.trim() || form.program.trim().length < 2) {
        nextErrors.program = 'Auto-filled from your application. Complete application to proceed.';
      }

      const gwaValue = Number(form.gwa);
      if (!form.gwa.trim() || Number.isNaN(gwaValue) || gwaValue <= 0 || gwaValue > 5) {
        nextErrors.gwa = 'Auto-filled from grade compliance. Submit grade compliance to proceed.';
      }

      // EAP Reflection Questions Validation
      if (!form.challenge_response || !form.challenge_response.trim()) {
        nextErrors.challenge_response = 'This question is required.';
      } else if (countWords(form.challenge_response) > 250) {
        nextErrors.challenge_response = 'Answer must not exceed 250 words.';
      }

      if (!form.accomplishment_response || !form.accomplishment_response.trim()) {
        nextErrors.accomplishment_response = 'This question is required.';
      } else if (countWords(form.accomplishment_response) > 250) {
        nextErrors.accomplishment_response = 'Answer must not exceed 250 words.';
      }

      if (!form.eap_reflection_response || !form.eap_reflection_response.trim()) {
        nextErrors.eap_reflection_response = 'This question is required.';
      } else if (countWords(form.eap_reflection_response) > 250) {
        nextErrors.eap_reflection_response = 'Answer must not exceed 250 words.';
      }
    }
    if (step === 2 && !agree) {
      nextErrors.agree = 'Please confirm the certification.';
    }
    return nextErrors;
  };

  // Move to next step if validation passes
  const goNext = () => {
    const nextErrors = validate(currentStep);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  // Move to previous step
  const goBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // Final submission handler
  const handleSubmit = async () => {
    const nextErrors = { ...validate(1), ...validate(2) };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        academicYear: form.academicYear,
        term: form.term,
        school: form.school,
        program: form.program,
        gwa: form.gwa,
        remarks: form.remarks,
        challenge_response: form.challenge_response,
        accomplishment_response: form.accomplishment_response,
        eap_reflection_response: form.eap_reflection_response,
      };

      // Call the API service to submit the form (JSON payload)
      const response = await submitScholarshipRenewal(payload);

      setSubmitting(false);
      setAiCheckingEnabled(response?.ai_checking_enabled ?? response?.data?.ai_checking_enabled ?? true);
      setSuccess(true);

      if (response?.ai_evaluation) {
        setAiFeedback(response.ai_evaluation);
      }

      // Trigger success animation
      scaleAnim.setValue(0.5);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }).start();

    } catch (error) {
      setSubmitting(false);
      setErrorMessage(error?.message || 'Failed to submit renewal.');
    }
  };

  const nextAcademicYear = getNextAcademicYear(form.academicYear);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (currentStep === 1 && !success ? navigation.goBack() : goBack())}
        >
          <Ionicons name="arrow-back" size={24} color="#4a4e7d" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.superTitle}>SCHOLARSHIP RENEWAL</Text>
          <Text style={styles.mainTitle}>
            {nextAcademicYear ? `AY ${nextAcademicYear} Renewal Form` : 'AY Renewal Form'}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      {!success && !resolvedIsGraduate && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            {steps.map((step, idx) => (
              <View
                key={step.key}
                style={[
                  styles.progressStep,
                  idx < currentStep ? styles.progressStepActive : styles.progressStepInactive,
                ]}
              />
            ))}
          </View>
          <Text style={styles.progressLabel}>{steps[currentStep - 1].label}</Text>
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 20 }}>
        {resolvedIsGraduate ? (
          <GraduationCelebration
            firstName={user?.firstName || user?.first_name}
            onBack={() => navigation.goBack()}
          />
        ) : (
          <>
            {/* Success Screen */}
            {success && (
              <ApplicationResultState
                aiCheckingEnabled={aiCheckingEnabled}
                successTitle="Success!"
                successMessage="Renewal submitted. We will review your details and notify you via email."
                aiSummary={aiFeedback?.summary}
                onViewApplications={() => navigation.goBack()}
                viewApplicationsText="Return to Dashboard"
              />
            )}

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}

            {submitting && !success && (
              <View style={styles.centered}>
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: spinAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                  }}
                >
                  <Ionicons name="sync-circle" size={110} color="#5b5f97" />
                </Animated.View>
                <Text style={styles.completeText}>Submitting Renewal...</Text>
              </View>
            )}

            {/* Step 1: Scholar Status */}
            {!success && !submitting && currentStep === 1 && (
              <Animated.View style={{ opacity: stepAnim }}>
                {alreadyRenewed ? (
                  <View style={styles.failedSubjectsBanner}>
                    <Ionicons name="alert-circle" size={24} color="#ef4444" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.failedSubjectsTitle}>Already Submitted</Text>
                      <Text style={styles.failedSubjectsText}>
                        Renewal blocked: Scholarship renewal can only be submitted once a year.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={styles.sectionHeaderRow}>
                      <View style={styles.verticalPill} />
                      <Text style={styles.sectionHeader}>Scholar Status Evaluation</Text>
                    </View>

                    {hasFailedSubjects && (
                      <View style={styles.failedSubjectsBanner}>
                        <Ionicons name="alert-circle" size={24} color="#ef4444" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.failedSubjectsTitle}>Renewal Blocked</Text>
                          <Text style={styles.failedSubjectsText}>
                            You have failed subjects in your academic record.
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* AI Eligibility Card */}
                    <View
                      style={[
                        styles.evalCard,
                        loadingEligibility
                          ? styles.evalCardLoading
                          : eligibility?.isQualified
                            ? styles.evalCardSuccess
                            : styles.evalCardWarning,
                      ]}
                    >
                      <View
                        style={[
                          styles.evalHeader,
                          loadingEligibility
                            ? styles.evalHeaderLoading
                            : eligibility?.isQualified
                              ? styles.evalHeaderSuccess
                              : styles.evalHeaderWarning,
                        ]}
                      >
                        <Text style={styles.evalHeaderIcon}>📋</Text>
                        <Text style={styles.evalHeaderTitle}>Status Evaluation</Text>
                        {!loadingEligibility && eligibility?.aiEvaluation && (
                          <View
                            style={[
                              styles.aiBadge,
                              eligibility.aiEvaluation.recommended_action === 'Approve'
                                ? styles.aiBadgeSuccess
                                : eligibility.aiEvaluation.recommended_action === 'Reject'
                                  ? styles.aiBadgeError
                                  : styles.aiBadgeWarning,
                            ]}
                          >
                            <Text
                              style={[
                                styles.aiBadgeText,
                                eligibility.aiEvaluation.recommended_action === 'Approve'
                                  ? styles.aiBadgeTextSuccess
                                  : eligibility.aiEvaluation.recommended_action === 'Reject'
                                    ? styles.aiBadgeTextError
                                    : styles.aiBadgeTextWarning,
                              ]}
                            >
                              {eligibility.aiEvaluation.recommended_action === 'Approve'
                                ? '✓ '
                                : eligibility.aiEvaluation.recommended_action === 'Reject'
                                  ? '✗ '
                                  : '⚠ '}
                              AI: {eligibility.aiEvaluation.recommended_action}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.evalBody}>
                        {loadingEligibility ? (
                          <Text style={styles.evalLoadingText}>Running smart eligibility checker...</Text>
                        ) : eligibility ? (
                          <>
                            <Text style={styles.evalSubHeader}>SYSTEM CHECKS</Text>
                            <View style={styles.tagList}>
                              {eligibility.tags?.map((tag, idx) => {
                                const isAttendance = tag.startsWith('Attendance:');
                                const isNoRecord = tag.includes('No records');
                                const isFlag =
                                  (!isNoRecord &&
                                    (tag.includes('Below') ||
                                      tag.includes('Late') ||
                                      tag.includes('Failed') ||
                                      tag.includes('INC'))) ||
                                  (!isAttendance && isNoRecord);
                                const isNeutral = isAttendance && isNoRecord;

                                return (
                                  <View
                                    key={idx}
                                    style={[
                                      styles.tagItem,
                                      isNeutral
                                        ? styles.tagItemNeutral
                                        : isFlag
                                          ? styles.tagItemError
                                          : styles.tagItemSuccess,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.tagIcon,
                                        isNeutral
                                          ? styles.tagTextNeutral
                                          : isFlag
                                            ? styles.tagTextError
                                            : styles.tagTextSuccess,
                                      ]}
                                    >
                                      {isNeutral ? '–' : isFlag ? '✗' : '✓'}
                                    </Text>
                                    <Text
                                      style={[
                                        styles.tagText,
                                        isNeutral
                                          ? styles.tagTextNeutral
                                          : isFlag
                                            ? styles.tagTextError
                                            : styles.tagTextSuccess,
                                        isFlag && { fontWeight: '700' },
                                      ]}
                                    >
                                      {tag}
                                    </Text>
                                  </View>
                                );
                              })}
                            </View>

                            <View
                              style={[
                                styles.verdictBox,
                                eligibility.isQualified
                                  ? styles.verdictSuccess
                                  : hasFailedSubjects
                                    ? styles.verdictError
                                    : styles.verdictWarning,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.verdictText,
                                  eligibility.isQualified
                                    ? styles.verdictTextSuccess
                                    : hasFailedSubjects
                                      ? styles.verdictTextError
                                      : styles.verdictTextWarning,
                                ]}
                              >
                                {eligibility.isQualified
                                  ? '✓ You meet the baseline requirements and may proceed.'
                                  : hasFailedSubjects
                                    ? '❌ Renewal blocked: You have failed subjects in your academic record.'
                                    : '⚠ You have flags on your record. You may still proceed, but your renewal is subject to admin review.'}
                              </Text>
                            </View>

                            {eligibility.aiEvaluation && (
                              <View style={styles.aiSummarySection}>
                                <Text style={styles.evalSubHeader}>🤖 AI SMART EVALUATION</Text>
                                <Text style={styles.aiSummaryText}>{eligibility.aiEvaluation.summary}</Text>
                                {eligibility.aiEvaluation.reasoning && (
                                  <Text style={styles.aiReasoningText}>
                                    <Text style={styles.aiReasoningLabel}>Basis: </Text>
                                    {eligibility.aiEvaluation.reasoning}
                                  </Text>
                                )}
                              </View>
                            )}
                          </>
                        ) : (
                          <Text style={styles.evalLoadingText}>Eligibility feedback unavailable right now.</Text>
                        )}
                      </View>
                    </View>
                  </>
                )}

                <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
                  <View style={styles.verticalPill} />
                  <Text style={styles.sectionHeader}>Academic Information</Text>
                </View>

                <View style={styles.readOnlyField}>
                  <Text style={styles.label}>Academic Year</Text>
                  <View style={styles.inputReadOnlyContainer}>
                    <Text style={styles.textReadOnly}>{form.academicYear || '--'}</Text>
                  </View>
                  {errors.academicYear && <Text style={styles.errorText}>{errors.academicYear}</Text>}
                </View>

                <View style={styles.readOnlyField}>
                  <Text style={styles.label}>Term</Text>
                  <View style={styles.inputReadOnlyContainer}>
                    <Text style={styles.textReadOnly}>{form.term || '--'}</Text>
                  </View>
                  {errors.term && <Text style={styles.errorText}>{errors.term}</Text>}
                </View>

                <View style={styles.readOnlyField}>
                  <Text style={styles.label}>School</Text>
                  <View style={styles.inputReadOnlyContainer}>
                    <Text style={styles.textReadOnly}>{form.school || '--'}</Text>
                  </View>
                  {errors.school && <Text style={styles.errorText}>{errors.school}</Text>}
                </View>

                <View style={styles.readOnlyField}>
                  <Text style={styles.label}>Program / Course</Text>
                  <View style={styles.inputReadOnlyContainer}>
                    <Text style={styles.textReadOnly}>{form.program || '--'}</Text>
                  </View>
                  {errors.program && <Text style={styles.errorText}>{errors.program}</Text>}
                </View>

                <View style={styles.readOnlyField}>
                  <Text style={styles.label}>Current GWA</Text>
                  <View style={styles.inputReadOnlyContainer}>
                    <Text style={styles.textReadOnly}>{form.gwa || '--'}</Text>
                  </View>
                  {errors.gwa && <Text style={styles.errorText}>{errors.gwa}</Text>}
                </View>

                {/* EAP Reflection Questions */}
                <View style={[styles.sectionHeaderRow, { marginTop: 24, marginBottom: 8 }]}>
                  <View style={styles.verticalPill} />
                  <Text style={styles.sectionHeader}>Educational Assistance Program (EAP) Reflection Questions</Text>
                </View>
                <Text style={styles.eapSectionSubtitle}>
                  All questions are required. Maximum of 250 words per answer.
                </Text>

                <View style={styles.eapQuestionCard}>
                  <Text style={styles.eapLabel}>
                    1. What is the most challenging aspect of the previous semester for you? What did you do to overcome the challenge?*
                  </Text>
                  <SafeTextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      errors.challenge_response && { borderColor: '#ef4444' }
                    ]}
                    placeholder="Type your answer here..."
                    placeholderTextColor="#848baf"
                    multiline
                    numberOfLines={4}
                    value={form.challenge_response}
                    onChangeText={(text) => setField('challenge_response', text)}
                  />
                  <View style={styles.eapFooterRow}>
                    {errors.challenge_response ? (
                      <Text style={[styles.errorText, { marginTop: 0, flex: 1, marginRight: 12 }]}>{errors.challenge_response}</Text>
                    ) : <View style={{ flex: 1 }} />}
                    <Text
                      style={[
                        styles.wordCountText,
                        countWords(form.challenge_response) > 250 && styles.wordCountError
                      ]}
                    >
                      {countWords(form.challenge_response)}/250 words
                    </Text>
                  </View>
                </View>

                <View style={styles.eapQuestionCard}>
                  <Text style={styles.eapLabel}>
                    2. What have you accomplished? Cite an example or situation and its lesson to you.*
                  </Text>
                  <SafeTextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      errors.accomplishment_response && { borderColor: '#ef4444' }
                    ]}
                    placeholder="Type your answer here..."
                    placeholderTextColor="#848baf"
                    multiline
                    numberOfLines={4}
                    value={form.accomplishment_response}
                    onChangeText={(text) => setField('accomplishment_response', text)}
                  />
                  <View style={styles.eapFooterRow}>
                    {errors.accomplishment_response ? (
                      <Text style={[styles.errorText, { marginTop: 0, flex: 1, marginRight: 12 }]}>{errors.accomplishment_response}</Text>
                    ) : <View style={{ flex: 1 }} />}
                    <Text
                      style={[
                        styles.wordCountText,
                        countWords(form.accomplishment_response) > 250 && styles.wordCountError
                      ]}
                    >
                      {countWords(form.accomplishment_response)}/250 words
                    </Text>
                  </View>
                </View>

                <View style={styles.eapQuestionCard}>
                  <Text style={styles.eapLabel}>
                    3. What have you learned about yourself through your accomplishments/challenges and how did Educational Assistance Program (EAP) helped you achieve it?*
                  </Text>
                  <SafeTextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      errors.eap_reflection_response && { borderColor: '#ef4444' }
                    ]}
                    placeholder="Type your answer here..."
                    placeholderTextColor="#848baf"
                    multiline
                    numberOfLines={4}
                    value={form.eap_reflection_response}
                    onChangeText={(text) => setField('eap_reflection_response', text)}
                  />
                  <View style={styles.eapFooterRow}>
                    {errors.eap_reflection_response ? (
                      <Text style={[styles.errorText, { marginTop: 0, flex: 1, marginRight: 12 }]}>{errors.eap_reflection_response}</Text>
                    ) : <View style={{ flex: 1 }} />}
                    <Text
                      style={[
                        styles.wordCountText,
                        countWords(form.eap_reflection_response) > 250 && styles.wordCountError
                      ]}
                    >
                      {countWords(form.eap_reflection_response)}/250 words
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Step 2: Review & Confirm */}
            {!success && !submitting && currentStep === 2 && (
              <Animated.View style={{ opacity: stepAnim }}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.verticalPill} />
                  <Text style={styles.sectionHeader}>Review & Confirm</Text>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoBoxText}>
                    Please review your details below. Ensure information reflects your
                    current academic standing.
                  </Text>
                </View>

                <View style={styles.reviewCard}>
                  <Text style={styles.reviewCardTitle}>Renewal Information</Text>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Academic Year</Text>
                    <Text style={styles.reviewValue}>{form.academicYear || '--'}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Term</Text>
                    <Text style={styles.reviewValue}>{form.term || '--'}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>School</Text>
                    <Text style={styles.reviewValue}>{form.school || '--'}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Program</Text>
                    <Text style={styles.reviewValue}>{form.program || '--'}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>GWA</Text>
                    <Text style={styles.reviewValue}>{form.gwa || '--'}</Text>
                  </View>
                  {form.challenge_response ? (
                    <View style={styles.remarksReviewSection}>
                      <Text style={styles.reviewLabel}>Challenge Response</Text>
                      <Text style={styles.remarksText}>{form.challenge_response}</Text>
                    </View>
                  ) : null}
                  {form.accomplishment_response ? (
                    <View style={styles.remarksReviewSection}>
                      <Text style={styles.reviewLabel}>Accomplishment Response</Text>
                      <Text style={styles.remarksText}>{form.accomplishment_response}</Text>
                    </View>
                  ) : null}
                  {form.eap_reflection_response ? (
                    <View style={styles.remarksReviewSection}>
                      <Text style={styles.reviewLabel}>EAP Reflection Response</Text>
                      <Text style={styles.remarksText}>{form.eap_reflection_response}</Text>
                    </View>
                  ) : null}
                  {form.remarks ? (
                    <View style={styles.remarksReviewSection}>
                      <Text style={styles.remarksText}>{form.remarks}</Text>
                    </View>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => {
                    setAgree(!agree);
                    clearFieldError('agree');
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, agree && styles.checkboxChecked]}>
                    {agree && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text style={styles.checkboxText}>
                    I confirm the details are correct and wish to submit my renewal.
                  </Text>
                </TouchableOpacity>
                {errors.agree && <Text style={styles.errorText}>{errors.agree}</Text>}
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>

      {/* Footer Navigation Buttons */}
      {!success && !submitting && !resolvedIsGraduate && (
        <View style={styles.footer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={goBack}>
              <Text style={styles.secondaryBtnText}>Previous</Text>
            </TouchableOpacity>
          )}

          {currentStep < steps.length ? (
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                (currentStep === 1 && isContinueDisabled) && styles.primaryBtnDisabled
              ]}
              onPress={goNext}
              disabled={currentStep === 1 && isContinueDisabled}
            >
              <Text style={styles.primaryBtnText}>
                {loadingEligibility ? 'Loading...' : 'Continue'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryBtn, !agree && styles.primaryBtnDisabled]}
              onPress={handleSubmit}
              disabled={!agree}
            >
              <Text style={styles.primaryBtnText}>Submit Renewal</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: { flex: 1 },
  superTitle: { fontSize: 10, fontWeight: '700', color: '#5b5f97', letterSpacing: 1 },
  mainTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginTop: 2 },
  progressContainer: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff' },
  progressBar: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  progressStep: { height: 6, flex: 1, borderRadius: 3 },
  progressStepActive: { backgroundColor: '#5b5f97' },
  progressStepInactive: { backgroundColor: '#e2e8f0' },
  progressLabel: { fontSize: 12, fontWeight: '600', color: '#4a4e7d' },
  content: { flex: 1, paddingTop: 16 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  verticalPill: { width: 4, height: 20, backgroundColor: '#5b5f97', borderRadius: 2, marginRight: 8 },
  sectionHeader: { fontSize: 16, fontWeight: '800', color: '#3d4076' },
  label: { fontSize: 13, fontWeight: '600', color: '#3d4076', marginBottom: 6 },
  readOnlyField: { marginBottom: 16 },
  inputReadOnlyContainer: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  textReadOnly: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
  field: { marginBottom: 16 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#0f172a',
    fontSize: 14,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  eapLabel: {
    fontSize: 13,
    color: '#3d4076',
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 18,
  },
  eapSectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 16,
    fontWeight: '500',
  },
  eapFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  wordCountText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  wordCountError: {
    color: '#ef4444',
  },
  eapQuestionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },

  // Evaluation Card Styles
  evalCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  evalCardLoading: { borderColor: '#e2e8f0' },
  evalCardSuccess: { borderColor: '#bbf7d0' },
  evalCardWarning: { borderColor: '#fef08a' },
  evalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  evalHeaderLoading: { backgroundColor: '#f8fafc', borderBottomColor: '#e2e8f0' },
  evalHeaderSuccess: { backgroundColor: '#f0fdf4', borderBottomColor: '#bbf7d0' },
  evalHeaderWarning: { backgroundColor: '#fefce8', borderBottomColor: '#fef08a' },
  evalHeaderIcon: { fontSize: 16, marginRight: 8 },
  evalHeaderTitle: { fontSize: 14, fontWeight: '700', color: '#3d4076', flex: 1 },
  aiBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  aiBadgeSuccess: { backgroundColor: '#dcfce7' },
  aiBadgeWarning: { backgroundColor: '#fef3c7' },
  aiBadgeError: { backgroundColor: '#fee2e2' },
  aiBadgeText: { fontSize: 11, fontWeight: '700' },
  aiBadgeTextSuccess: { color: '#15803d' },
  aiBadgeTextWarning: { color: '#b45309' },
  aiBadgeTextError: { color: '#b91c1c' },
  evalBody: { backgroundColor: '#fff', padding: 16 },
  evalLoadingText: { fontSize: 13, color: '#64748b', fontStyle: 'italic' },
  evalSubHeader: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 1, marginBottom: 8 },
  tagList: { marginBottom: 16, gap: 8 },
  tagItem: { flexDirection: 'row', alignItems: 'flex-start', padding: 10, borderRadius: 8 },
  tagItemNeutral: { backgroundColor: '#f8fafc' },
  tagItemSuccess: { backgroundColor: '#f0fdf4' },
  tagItemError: { backgroundColor: '#fef2f2' },
  tagIcon: { marginRight: 8, fontSize: 14, fontWeight: '700', marginTop: -2 },
  tagText: { fontSize: 13, flex: 1 },
  tagTextNeutral: { color: '#64748b' },
  tagTextSuccess: { color: '#15803d' },
  tagTextError: { color: '#b91c1c' },
  verdictBox: { padding: 12, borderRadius: 8, marginBottom: 16 },
  verdictSuccess: { backgroundColor: '#f0fdf4' },
  verdictWarning: { backgroundColor: '#fefce8' },
  verdictText: { fontSize: 13, fontWeight: '600' },
  verdictTextSuccess: { color: '#15803d' },
  verdictTextWarning: { color: '#a16207' },
  verdictError: { backgroundColor: '#fef2f2' },
  verdictTextError: { color: '#b91c1c' },
  aiSummarySection: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
  aiSummaryText: { fontSize: 13, color: '#334155', lineHeight: 20, marginBottom: 8 },
  aiReasoningText: { fontSize: 11, color: '#64748b', fontStyle: 'italic' },
  aiReasoningLabel: { fontWeight: '600', fontStyle: 'normal' },

  // Review & Confirm
  infoBox: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  infoBoxText: { fontSize: 13, color: '#475569', lineHeight: 18 },
  reviewCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  reviewCardTitle: { fontSize: 14, fontWeight: '700', color: '#3d4076', marginBottom: 12 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reviewLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginRight: 8 },
  reviewValue: { fontSize: 12, fontWeight: '700', color: '#1e293b', flex: 1, textAlign: 'right', marginLeft: 16 },
  remarksReviewSection: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8 },
  remarksText: { fontSize: 12, color: '#475569', marginTop: 4, lineHeight: 16 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#cbd5e1', marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#5b5f97', borderColor: '#5b5f97' },
  checkboxText: { fontSize: 13, fontWeight: '600', color: '#3d4076', flex: 1 },

  // Footer Actions
  footer: { flexDirection: 'row', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 12 },
  primaryBtn: { flex: 1, backgroundColor: '#5b5f97', paddingVertical: 14, borderRadius: 10, alignItems: 'center', shadowColor: '#5b5f97', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
  primaryBtnDisabled: { backgroundColor: '#94a3b8', shadowOpacity: 0 },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  secondaryBtn: { flex: 1, backgroundColor: '#fff', paddingVertical: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  secondaryBtnText: { color: '#4a4e7d', fontSize: 14, fontWeight: '700' },

  // Success / Status States
  successContainer: { paddingVertical: 10, width: '100%' },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  completeText: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginTop: 20, marginBottom: 8 },
  completeSubtext: { fontSize: 14, color: '#64748b', textAlign: 'center', paddingHorizontal: 16, lineHeight: 20 },
  errorBanner: { backgroundColor: '#fef2f2', borderColor: '#fca5a5', borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16 },
  errorBannerText: { color: '#b91c1c', fontSize: 13 },
  failedSubjectsBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5', borderRadius: 12, padding: 16, marginBottom: 20 },
  failedSubjectsTitle: { fontSize: 14, fontWeight: '700', color: '#991b1b', marginBottom: 4 },
  failedSubjectsText: { fontSize: 13, color: '#b91c1c', lineHeight: 18 },

  // Premium AI Evaluation Card (Success State)
  aiFeedbackCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
    marginBottom: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  aiFeedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  aiFeedbackIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiFeedbackTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 1,
  },
  aiFeedbackSummary: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  aiFeedbackFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiFeedbackFooterLeft: {
    fontSize: 10,
    color: '#64748b',
    flex: 1,
  },
  aiFeedbackFooterRight: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  returnBtn: {
    backgroundColor: '#5b5f97',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5b5f97',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  returnBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
