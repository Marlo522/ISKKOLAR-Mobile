import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';

// Import our new services that match the web backend calls
import {
  submitScholarshipRenewal,
  checkScholarEligibility,
  fetchScholarAcademicStatus
} from '../services/scholarshipRenewalService';

// Form Steps defining the flow of the renewal process
const steps = [
  { key: 'status', label: 'Scholar Status' },
  { key: 'documents', label: 'Documents' },
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

export default function ScholarshipRenewalScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [academicStatus, setAcademicStatus] = useState(null);

  // Auto-fill values from fetched academic status or user context
  const autoSchool = academicStatus?.school_name || user?.school || '';
  const autoProgram = academicStatus?.program || user?.course || user?.program || '';
  const autoGwa = academicStatus?.latest_gwa || user?.gwa || '';
  const autoAcademicYear = getCurrentAcademicYear();
  const autoTerm = academicStatus?.current_term || user?.term || '';

  // State management for the current step (1, 2, or 3)
  const [currentStep, setCurrentStep] = useState(1);

  // Form fields state
  const [form, setForm] = useState({
    academicYear: autoAcademicYear,
    term: autoTerm,
    gwa: autoGwa ? String(autoGwa) : '',
    school: autoSchool,
    program: autoProgram,
    remarks: '',
  });

  // State for file uploads
  const [files, setFiles] = useState({
    gradeReport: null,
    cor: null,
    receipts: null,
  });

  // State for the final confirmation checkbox
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Eligibility state from the AI checker backend
  const [eligibility, setEligibility] = useState(null);
  const [loadingEligibility, setLoadingEligibility] = useState(true);

  // Animations
  const stepAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

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
    setForm((prev) => ({
      ...prev,
      school: autoSchool,
      program: autoProgram,
      gwa: autoGwa ? String(autoGwa) : '',
      academicYear: autoAcademicYear,
      term: autoTerm,
    }));
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

  // Helper to update file fields
  const setFileField = (field, fileObj) => {
    setFiles((prev) => ({ ...prev, [field]: fileObj }));
    clearFieldError(field);
  };

  // Handle file selection using ImagePicker or DocumentPicker
  const handleFileUpload = async (key) => {
    const handleResult = (result) => {
      if (result.canceled) return;
      if (result.assets && result.assets.length > 0) {
        let file = result.assets[0];
        // Ensure the file object has the properties expected by our multipart uploader
        if (!file.name) {
          file = {
            ...file,
            name: file.uri.split('/').pop(),
            type: file.mimeType || 'image/jpeg',
          };
        }
        setFileField(key, file);
      }
    };

    Alert.alert('Upload Document', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: async () => {
          try {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (permission.status !== 'granted') {
              Alert.alert('Permission Required', 'Camera permission is required to take photos.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: false,
              quality: 0.8,
            });
            handleResult(result);
          } catch (err) {
            Alert.alert('Error', 'Could not capture image.');
          }
        },
      },
      {
        text: 'Choose File',
        onPress: async () => {
          try {
            const result = await DocumentPicker.getDocumentAsync({
              type: ['application/pdf', 'image/*'],
              copyToCacheDirectory: true,
            });
            handleResult(result);
          } catch (error) {
            console.log('Error picking file:', error);
            Alert.alert('Error', 'Failed to select document.');
          }
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  // Form validation per step
  const validate = (step) => {
    const nextErrors = {};
    if (step === 1) {
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
    }
    if (step === 2) {
      if (!files.gradeReport) nextErrors.gradeReport = 'Upload grade report';
      if (!files.cor) nextErrors.cor = 'Upload certificate of registration';
    }
    if (step === 3 && !agree) {
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
    const nextErrors = validate(3);
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
      };

      // Call the API service to submit the form and files
      await submitScholarshipRenewal(payload, files);

      setSubmitting(false);
      setSuccess(true);
      
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

  // Reusable File Upload Field Component inside React Native
  const renderFileUploadBox = (label, subtext, key) => {
    const hasError = !!errors[key];
    const hasFile = !!files[key];
    
    return (
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={[
            styles.uploadBoxDashed,
            hasError ? styles.uploadBoxError : hasFile ? styles.uploadBoxSuccess : {},
          ]}
          onPress={() => handleFileUpload(key)}
        >
          <Text
            style={[
              styles.uploadBoxTitle,
              hasError ? styles.textError : hasFile ? styles.textSuccess : {},
            ]}
          >
            {hasFile ? files[key].name : 'Tap to upload'}
          </Text>
          <Text style={styles.uploadBoxSubtext} numberOfLines={1} ellipsizeMode="middle">
            {hasFile ? 'File selected ✓' : subtext}
          </Text>
        </TouchableOpacity>
        {hasError && <Text style={styles.errorText}>{errors[key]}</Text>}
      </View>
    );
  };

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
      {!success && (
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
        {/* Alerts */}
        {success && (
          <View style={styles.centered}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Ionicons name="checkmark-circle" size={120} color="#2cae57" />
            </Animated.View>
            <Text style={styles.completeText}>Renewal submitted.</Text>
            <Text style={styles.completeSubtext}>
              We will review your documents and notify you via email.
            </Text>
            <TouchableOpacity style={styles.submitBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.submitBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
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
                    rotate: stepAnim.interpolate({
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
            <View style={styles.sectionHeaderRow}>
              <View style={styles.verticalPill} />
              <Text style={styles.sectionHeader}>Scholar Status Evaluation</Text>
            </View>

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
                        eligibility.isQualified ? styles.verdictSuccess : styles.verdictWarning,
                      ]}
                    >
                      <Text
                        style={[
                          styles.verdictText,
                          eligibility.isQualified
                            ? styles.verdictTextSuccess
                            : styles.verdictTextWarning,
                        ]}
                      >
                        {eligibility.isQualified
                          ? '✓ You meet the baseline requirements and may proceed.'
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

            <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
              <View style={styles.verticalPill} />
              <Text style={styles.sectionHeader}>Academic Information</Text>
            </View>

            <View style={styles.readOnlyField}>
              <Text style={styles.label}>Academic Year</Text>
              <TextInput
                style={styles.inputReadOnly}
                value={form.academicYear}
                editable={false}
                placeholder="Auto-filled from current academic year"
              />
              {errors.academicYear && <Text style={styles.errorText}>{errors.academicYear}</Text>}
            </View>

            <View style={styles.readOnlyField}>
              <Text style={styles.label}>Term</Text>
              <TextInput
                style={styles.inputReadOnly}
                value={form.term}
                editable={false}
                placeholder="Auto-filled from latest term"
              />
              {errors.term && <Text style={styles.errorText}>{errors.term}</Text>}
            </View>

            <View style={styles.readOnlyField}>
              <Text style={styles.label}>School</Text>
              <TextInput
                style={styles.inputReadOnly}
                value={form.school}
                editable={false}
                placeholder="Auto-filled from application"
              />
              {errors.school && <Text style={styles.errorText}>{errors.school}</Text>}
            </View>

            <View style={styles.readOnlyField}>
              <Text style={styles.label}>Program / Course</Text>
              <TextInput
                style={styles.inputReadOnly}
                value={form.program}
                editable={false}
                placeholder="Auto-filled from application"
              />
              {errors.program && <Text style={styles.errorText}>{errors.program}</Text>}
            </View>

            <View style={styles.readOnlyField}>
              <Text style={styles.label}>Current GWA</Text>
              <TextInput
                style={styles.inputReadOnly}
                value={form.gwa}
                editable={false}
                placeholder="Auto-filled from grade compliance"
              />
              {errors.gwa && <Text style={styles.errorText}>{errors.gwa}</Text>}
            </View>
          </Animated.View>
        )}

        {/* Step 2: Supporting Documents */}
        {!success && !submitting && currentStep === 2 && (
          <Animated.View style={{ opacity: stepAnim }}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.verticalPill} />
              <Text style={styles.sectionHeader}>Supporting Documents</Text>
            </View>

            {renderFileUploadBox('Grade Report', 'PDF or clear image of grades', 'gradeReport')}
            {renderFileUploadBox('Certificate of Registration', 'Latest term COR', 'cor')}
            {renderFileUploadBox('Official Receipts (Optional)', 'Upload tuition or fee receipts', 'receipts')}

            <View style={styles.field}>
              <Text style={styles.label}>Additional Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                value={form.remarks}
                onChangeText={(val) => setField('remarks', val)}
                placeholder="Share context on grades, delays, or special circumstances."
                placeholderTextColor="#9ca3af"
              />
            </View>
          </Animated.View>
        )}

        {/* Step 3: Review & Confirm */}
        {!success && !submitting && currentStep === 3 && (
          <Animated.View style={{ opacity: stepAnim }}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.verticalPill} />
              <Text style={styles.sectionHeader}>Review & Confirm</Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoBoxText}>
                Please review your details below. Ensure information and documents reflect your
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
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewCardTitle}>Supporting Documents</Text>
              <View style={styles.reviewDocRow}>
                <Ionicons
                  name={files.gradeReport ? 'checkmark-circle' : 'alert-circle'}
                  size={16}
                  color={files.gradeReport ? '#16a34a' : '#dc2626'}
                />
                <Text style={styles.reviewDocLabel}>Grade Report</Text>
                <Text style={styles.reviewDocStatus}>
                  {files.gradeReport ? 'Attached' : 'Missing'}
                </Text>
              </View>
              <View style={styles.reviewDocRow}>
                <Ionicons
                  name={files.cor ? 'checkmark-circle' : 'alert-circle'}
                  size={16}
                  color={files.cor ? '#16a34a' : '#dc2626'}
                />
                <Text style={styles.reviewDocLabel}>Certificate of Registration</Text>
                <Text style={styles.reviewDocStatus}>{files.cor ? 'Attached' : 'Missing'}</Text>
              </View>
              <View style={styles.reviewDocRow}>
                <Ionicons
                  name={files.receipts ? 'checkmark-circle' : 'remove-circle'}
                  size={16}
                  color={files.receipts ? '#16a34a' : '#9ca3af'}
                />
                <Text style={styles.reviewDocLabel}>Official Receipts</Text>
                <Text style={styles.reviewDocStatus}>
                  {files.receipts ? 'Attached' : 'Optional'}
                </Text>
              </View>
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
      </ScrollView>

      {/* Footer Navigation Buttons */}
      {!success && !submitting && (
        <View style={styles.footer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={goBack}>
              <Text style={styles.secondaryBtnText}>Previous</Text>
            </TouchableOpacity>
          )}

          {currentStep < steps.length ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={goNext}>
              <Text style={styles.primaryBtnText}>Continue</Text>
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
  inputReadOnly: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#64748b',
    fontSize: 14,
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
  aiSummarySection: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
  aiSummaryText: { fontSize: 13, color: '#334155', lineHeight: 20, marginBottom: 8 },
  aiReasoningText: { fontSize: 11, color: '#64748b', fontStyle: 'italic' },
  aiReasoningLabel: { fontWeight: '600', fontStyle: 'normal' },

  // Upload Box
  uploadBoxDashed: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBoxError: { borderColor: '#fca5a5', backgroundColor: '#fef2f2' },
  uploadBoxSuccess: { borderColor: '#69b486', backgroundColor: '#f0fdf4', borderStyle: 'solid' },
  uploadBoxTitle: { fontSize: 14, fontWeight: '700', color: '#4a4e7d', marginBottom: 4 },
  uploadBoxSubtext: { fontSize: 12, color: '#94a3b8' },
  textError: { color: '#ef4444' },
  textSuccess: { color: '#15803d' },

  // Review & Confirm
  infoBox: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  infoBoxText: { fontSize: 13, color: '#475569', lineHeight: 18 },
  reviewCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  reviewCardTitle: { fontSize: 14, fontWeight: '700', color: '#3d4076', marginBottom: 12 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reviewLabel: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  reviewValue: { fontSize: 12, fontWeight: '700', color: '#1e293b' },
  reviewDocRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewDocLabel: { fontSize: 12, fontWeight: '600', color: '#1e293b', flex: 1, marginLeft: 8 },
  reviewDocStatus: { fontSize: 12, color: '#64748b' },
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
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  completeText: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginTop: 24, marginBottom: 8 },
  completeSubtext: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 32 },
  submitBtn: { backgroundColor: '#5b5f97', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 10 },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  errorBanner: { backgroundColor: '#fef2f2', borderColor: '#fca5a5', borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16 },
  errorBannerText: { color: '#b91c1c', fontSize: 13 },
});
