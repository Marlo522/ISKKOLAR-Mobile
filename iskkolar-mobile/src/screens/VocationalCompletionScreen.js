import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { AuthContext } from '../context/AuthContext';
import { submitVocationalCompletion, getMyVocationalCompletion } from '../services/vocationalDashboardService';
import { getScholarDashboardSummary } from '../services/scholarDashboardService';

// Format display date helper matching the web implementation
const formatDisplayDate = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// Status styles for badges
const STATUS_COLORS = {
  pending: { bg: "#fef3c7", text: "#b45309", border: "#fef08a" },
  approved: { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0" },
  rejected: { bg: "#fee2e2", text: "#b91c1c", border: "#fca5a5" },
};

export default function VocationalCompletionScreen({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [existingSubmission, setExistingSubmission] = useState(undefined); // undefined = loading
  const [form, setForm] = useState({ completionDate: "", certificateNumber: "" });
  const [files, setFiles] = useState({ completion_certificate: null, transcript_of_records: null, other: null });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // 1. Fetch existing submission status
  useEffect(() => {
    let mounted = true;
    getMyVocationalCompletion()
      .then((res) => {
        if (mounted) {
          setExistingSubmission(res?.data || null);
        }
      })
      .catch(() => {
        if (mounted) {
          setExistingSubmission(null);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Fetch and prefill completion date dynamically from params or dashboard summary
  useEffect(() => {
    const loadCompletionDate = async () => {
      // Check navigation params first
      let dateVal = route.params?.completionDate;
      if (dateVal && dateVal !== '--') {
        const dateStr = dateVal.split('T')[0];
        setForm(p => ({ ...p, completionDate: dateStr }));
        return;
      }

      // Fetch from dashboard summary if not passed
      try {
        const summary = await getScholarDashboardSummary();
        const vocData = summary?.data?.vocational || summary?.vocational;
        const fallbackDate = vocData?.endDate || user?.endDate;
        if (fallbackDate && fallbackDate !== '--') {
          const dateStr = fallbackDate.split('T')[0];
          setForm(p => ({ ...p, completionDate: dateStr }));
        }
      } catch (err) {
        console.warn('Failed to load completion date', err);
      }
    };
    
    loadCompletionDate();
  }, [route.params?.completionDate]);

  // Handle document picking safely
  const pickDocument = async (key) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Validate file size (10 MB limit matching web)
        const maxSize = 10 * 1024 * 1024;
        if (file.size && file.size > maxSize) {
          setError("File size must be less than 10 MB.");
          return;
        }

        const formattedFile = {
          uri: file.uri,
          name: file.name || file.uri.split('/').pop(),
          type: file.mimeType || file.type || 'application/pdf',
        };
        
        setFiles(prev => ({ ...prev, [key]: formattedFile }));
        setError('');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to select document');
    }
  };

  // Submit proof of completion
  const handleSubmit = async () => {
    setError("");
    setFieldErrors({});
    
    const errs = {};
    if (!form.completionDate) errs.completionDate = "Completion date is required.";
    if (!files.completion_certificate) errs.completion_certificate = "Please upload your completion certificate.";
    
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        completion_date: form.completionDate,
        certificate_number: form.certificateNumber || undefined,
      };

      const res = await submitVocationalCompletion(payload, files);
      setExistingSubmission(res?.data || res);
      setSubmitted(true);
    } catch (err) {
      setError(err?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderFilePicker = (key, label, isOptional = false) => {
    const hasFile = !!files[key];
    const hasError = !!fieldErrors[key];
    
    return (
      <View style={styles.filePickerContainer}>
        <Text style={styles.fieldLabel}>
          {label} {isOptional ? <Text style={styles.optionalText}>(Optional)</Text> : <Text style={styles.requiredAsterisk}>*</Text>}
        </Text>
        <TouchableOpacity 
          style={[
            styles.filePicker, 
            hasFile && styles.filePicked, 
            hasError && styles.filePickerError
          ]} 
          onPress={() => pickDocument(key)}
        >
          <Ionicons 
            name={hasFile ? "checkmark-circle" : "cloud-upload-outline"} 
            size={22} 
            color={hasFile ? "#15803d" : "#727ab6"} 
          />
          <Text style={[styles.filePickerText, hasFile && styles.filePickedText]}>
            {hasFile ? files[key].name : `Select File`}
          </Text>
        </TouchableOpacity>
        {hasError && <Text style={styles.errorText}>{fieldErrors[key]}</Text>}
      </View>
    );
  };

  // ── 1. LOADING STATE ──
  if (existingSubmission === undefined) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verification Status</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#5b5f97" />
          <Text style={styles.loadingText}>Fetching verification status...</Text>
        </View>
      </View>
    );
  }

  // ── 2. ALREADY SUBMITTED STATE ──
  if (existingSubmission && !submitted) {
    const sub = existingSubmission;
    const status = sub.status?.toLowerCase() || 'pending';
    const badgeColors = STATUS_COLORS[status] || STATUS_COLORS.pending;
    
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verification Status</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.infoCardSubmitted}>
            <View style={styles.submittedIconBox}>
              <Ionicons name="ribbon" size={22} color="#5b5f97" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeaderTitle}>Certification of Completion</Text>
              <Text style={styles.sectionHeaderSubtitle}>Your submission is under review</Text>
            </View>
          </View>

          <View style={styles.reviewCard}>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: badgeColors.bg, borderColor: badgeColors.border }]}>
                <Text style={[styles.statusBadgeText, { color: badgeColors.text }]}>{status.toUpperCase()}</Text>
              </View>
            </View>
            
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Completion Date</Text>
              <Text style={styles.reviewValue}>{formatDisplayDate(sub.completion_date)}</Text>
            </View>

            {sub.certificate_number ? (
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Certificate No.</Text>
                <Text style={styles.reviewValue}>{sub.certificate_number}</Text>
              </View>
            ) : null}

            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Submitted</Text>
              <Text style={styles.reviewValue}>{formatDisplayDate(sub.submitted_at)}</Text>
            </View>

            {sub.vocational_completion_documents?.length > 0 && (
              <View style={styles.docsReviewSection}>
                <Text style={styles.docsReviewTitle}>Uploaded Documents</Text>
                <View style={styles.docsList}>
                  {sub.vocational_completion_documents.map((doc) => (
                    <View key={doc.id} style={styles.docItem}>
                      <Ionicons name="document-attach-outline" size={16} color="#64748b" />
                      <Text style={styles.docType} numberOfLines={1}>
                        {doc.document_type.replace(/_/g, " ").toUpperCase()}
                      </Text>
                      <Text style={styles.docName} numberOfLines={1}>
                        {doc.file_name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.returnBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.returnBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── 3. SUCCESS STATE (JUST SUBMITTED) ──
  if (submitted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verification Status</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.successCentered}>
          <View style={styles.successIconOuter}>
            <Ionicons name="checkmark-circle" size={80} color="#16a34a" />
          </View>
          <Text style={styles.successTitle}>Submitted Successfully</Text>
          <Text style={styles.successSubtitle}>
            Your certification of completion has been submitted for staff review.
          </Text>
          <TouchableOpacity style={styles.returnBtnLarge} onPress={() => navigation.goBack()}>
            <Text style={styles.returnBtnText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── 4. SUBMISSION FORM STATE ──
  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Completion</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <View style={styles.infoIconBox}>
            <Ionicons name="ribbon-outline" size={26} color="#5b5f97" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoCardTitle}>Certification of Completion</Text>
            <Text style={styles.infoCardSub}>Submit proof of program completion for staff review</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          {/* Completion Date */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Completion Date <Text style={styles.requiredAsterisk}>*</Text></Text>
            <TextInput
              style={styles.inputReadOnly}
              value={form.completionDate ? formatDisplayDate(form.completionDate) : 'Fetching date...'}
              editable={false}
              placeholder="Auto-filled completion date"
            />
            <Text style={styles.hintText}>Auto-filled from program record details.</Text>
            {fieldErrors.completionDate && <Text style={styles.errorText}>{fieldErrors.completionDate}</Text>}
          </View>

          {/* Certificate Number */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Certificate Number <Text style={styles.optionalText}>(Optional)</Text></Text>
            <TextInput
              style={styles.input}
              value={form.certificateNumber}
              onChangeText={(val) => setForm(p => ({ ...p, certificateNumber: val }))}
              placeholder="e.g. NC-2024-00123"
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Documents */}
          {renderFilePicker('completion_certificate', 'Completion Certificate / Diploma')}
          {renderFilePicker('transcript_of_records', 'Transcript of Records (TOR)', true)}
          {renderFilePicker('other', 'Other Supporting Document', true)}

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#dc2626" />
              <Text style={styles.errorBoxText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity 
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} 
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
            ) : null}
            <Text style={styles.submitBtnText}>
              {submitting ? "Submitting..." : "Submit Verification Proof"}
            </Text>
          </TouchableOpacity>

          <View style={styles.tipBox}>
            <Ionicons name="information-circle-outline" size={18} color="#5b5f97" style={{ marginTop: 2 }} />
            <Text style={styles.tipBoxText}>
              Upload your certificate, diploma, or any official document proving program completion. Accepted formats: JPG, PNG, PDF (max 10 MB each).
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  // Info Cards
  infoCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1
  },
  infoIconBox: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0f1ff',
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  infoCardTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  infoCardSub: { fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: '500' },
  
  infoCardSubmitted: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: '#e2e8f0'
  },
  submittedIconBox: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#f0f1ff',
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  sectionHeaderSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },

  // Forms
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#edf0f8' },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#3d4076', marginBottom: 8 },
  requiredAsterisk: { color: '#ef4444' },
  optionalText: { color: '#94a3b8', fontWeight: '500' },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12,
    color: '#1e293b', fontSize: 14, fontWeight: '600'
  },
  inputReadOnly: {
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12,
    color: '#64748b', fontSize: 14, fontWeight: '600'
  },
  hintText: { fontSize: 11, color: '#94a3b8', marginTop: 6, fontWeight: '500' },
  errorText: { color: '#ef4444', fontSize: 11, marginTop: 4, fontWeight: '600' },

  // Document Pickers
  filePickerContainer: { marginBottom: 16 },
  filePicker: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc',
    borderRadius: 10, padding: 16, borderWidth: 1, borderColor: '#cbd5e1',
    borderStyle: 'dashed'
  },
  filePicked: { borderColor: '#16a34a', borderStyle: 'solid', backgroundColor: '#f0fdf4' },
  filePickerError: { borderColor: '#fca5a5', backgroundColor: '#fef2f2' },
  filePickerText: { marginLeft: 10, fontSize: 14, color: '#5b5f97', fontWeight: '700', flex: 1 },
  filePickedText: { color: '#15803d' },

  // Buttons
  submitBtn: {
    backgroundColor: '#5b5f97', borderRadius: 10, height: 50,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 8, shadowColor: '#5b5f97', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 2
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  returnBtn: {
    backgroundColor: '#5b5f97', borderRadius: 10, height: 50,
    justifyContent: 'center', alignItems: 'center', marginTop: 12,
    shadowColor: '#5b5f97', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 2
  },
  returnBtnLarge: {
    backgroundColor: '#5b5f97', borderRadius: 10, height: 50,
    width: '100%', justifyContent: 'center', alignItems: 'center',
    marginTop: 20, shadowColor: '#5b5f97', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 2
  },
  returnBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Submitted Details Card
  reviewCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12
  },
  reviewRow: {
    flexDirection: 'row', justifyContent: 'space-between', 
    alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9'
  },
  reviewLabel: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  reviewValue: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },

  docsReviewSection: { marginTop: 16 },
  docsReviewTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 0.5, marginBottom: 8 },
  docsList: { gap: 8 },
  docItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc',
    borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#e2e8f0'
  },
  docType: { fontSize: 10, fontWeight: '800', color: '#475569', width: 140, marginLeft: 8 },
  docName: { fontSize: 11, color: '#727ab6', flex: 1, fontWeight: '600' },

  // General States
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748b', fontWeight: '500' },
  successCentered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, paddingVertical: 80 },
  successIconOuter: { marginBottom: 24 },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#16a34a', marginBottom: 8 },
  successSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 },
  
  errorBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2',
    borderColor: '#fca5a5', borderWidth: 1, borderRadius: 10,
    padding: 12, marginBottom: 16, marginTop: 8
  },
  errorBoxText: { color: '#dc2626', fontSize: 13, fontWeight: '600', marginLeft: 8, flex: 1 },

  tipBox: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#f0f1ff',
    borderColor: '#e0e2ff', borderWidth: 1, borderRadius: 10,
    padding: 12, marginTop: 16
  },
  tipBoxText: { color: '#5b5f97', fontSize: 12, lineHeight: 18, marginLeft: 8, flex: 1, fontWeight: '500' }
});
