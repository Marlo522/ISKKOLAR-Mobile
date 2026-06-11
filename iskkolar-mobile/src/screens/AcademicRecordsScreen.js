import React, { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { AuthContext } from '../context/AuthContext';
import { getScholarAcademicRecords } from '../services/scholarDashboardService';

/* ─────────── Helpers ─────────── */
const formatDate = (d) => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return null;
  }
};

const formatGwa = (v) => {
  if (v == null || v === '') return '—';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : '—';
};

/* ─────────── Status Badge Styling ─────────── */
const STATUS_STYLES = {
  approved: {
    bg: '#e6f7ef',
    text: '#0d7c47',
    dot: '#10b981',
    border: '#a7f3d0',
    label: 'Approved',
  },
  compliant: {
    bg: '#e6f7ef',
    text: '#0d7c47',
    dot: '#10b981',
    border: '#a7f3d0',
    label: 'Compliant',
  },
  pending: {
    bg: '#fff8e6',
    text: '#b5850a',
    dot: '#f59e0b',
    border: '#fde68a',
    label: 'Pending',
  },
  under_review: {
    bg: '#eef2ff',
    text: '#3730a3',
    dot: '#6366f1',
    border: '#c7d2fe',
    label: 'Under Review',
  },
  rejected: {
    bg: '#ffe6e6',
    text: '#c00000',
    dot: '#ef4444',
    border: '#fca5a5',
    label: 'Rejected',
  },
  non_compliant: {
    bg: '#ffe6e6',
    text: '#c00000',
    dot: '#ef4444',
    border: '#fca5a5',
    label: 'Non-Compliant',
  },
};

const normalizeStatus = (raw) => {
  if (!raw) return 'pending';
  const s = raw.toLowerCase().replace(/[\s-]+/g, '_');
  if (s.includes('reject') || s.includes('non_compliant')) return 'rejected';
  if (s.includes('approv') || s.includes('compliant')) return 'approved';
  if (s.includes('review') || s.includes('submit')) return 'under_review';
  return s;
};

const StatusBadge = ({ status }) => {
  const norm = normalizeStatus(status);
  const style = STATUS_STYLES[norm] || STATUS_STYLES.pending;
  return (
    <View style={[styles.badge, { backgroundColor: style.bg, borderColor: style.border }]}>
      <View style={[styles.badgeDot, { backgroundColor: style.dot }]} />
      <Text style={[styles.badgeText, { color: style.text }]}>{style.label}</Text>
    </View>
  );
};

/* ─────────── Chip ─────────── */
const Chip = ({ label, color = 'gray' }) => {
  const colors = {
    red: { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
    orange: { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },
    amber: { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' },
    green: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
    gray: { bg: '#f3f4f6', text: '#4b5563', border: '#d1d5db' },
  };
  const activeColor = colors[color] || colors.gray;
  return (
    <View style={[styles.chip, { backgroundColor: activeColor.bg, borderColor: activeColor.border }]}>
      <Text style={[styles.chipText, { color: activeColor.text }]}>{label}</Text>
    </View>
  );
};

/* ─────────── Record Card ─────────── */
const AcademicRecordCard = ({ record, onPreview, hideYear = false }) => {
  const [aiExpanded, setAiExpanded] = useState(false);
  const hasFile = !!record.gradeReportUrl;
  const norm = normalizeStatus(record.status);
  const isApproved = norm === 'approved' || norm === 'compliant';
  const isRejected = norm === 'rejected' || norm === 'non_compliant';

  // Accent bar color on the left
  const accentColor = isApproved
    ? '#10b981'
    : isRejected
      ? '#ef4444'
      : '#727ab6';

  const displayGwa = record.displayGwa ?? record.extractedGwa ?? record.gwa;

  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
      
      <View style={styles.cardContent}>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleCol}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTermText}>{record.term}</Text>
              {!hideYear && (
                <Text style={styles.cardYearText}>AY {record.academicYear}</Text>
              )}
            </View>
            {record.scholarshipName ? (
              <Text style={styles.cardScholarshipText}>{record.scholarshipName}</Text>
            ) : null}
          </View>
          <StatusBadge status={record.status} />
        </View>

        {/* GWA + flags row */}
        <View style={styles.gwaRow}>
          {/* GWA Box */}
          <View style={[
            styles.gwaBox,
            isApproved ? styles.gwaBoxApproved : isRejected ? styles.gwaBoxRejected : styles.gwaBoxDefault
          ]}>
            <Text style={styles.gwaLabel}>GWA</Text>
            <Text style={[
              styles.gwaValue,
              isApproved ? styles.gwaTextApproved : isRejected ? styles.gwaTextRejected : styles.gwaTextDefault
            ]}>
              {formatGwa(displayGwa)}
            </Text>
            {record.extractedGwa != null && record.gwa != null && (
              <Text style={styles.gwaMetaText}>AI extracted</Text>
            )}
            {record.extractedGwa == null && record.gwa != null && (
              <Text style={styles.gwaMetaText}>Declared</Text>
            )}
          </View>

          {/* Chips */}
          <View style={styles.chipsContainer}>
            {record.isGwaQualified ? (
              <Chip label="✓ GWA Qualified" color="green" />
            ) : (
              <Chip label="✗ GWA Not Qualified" color="red" />
            )}
            {record.gwaDiscrepancy ? (
              <Chip label="⚠ GWA Discrepancy" color="amber" />
            ) : null}
            {record.hasInc ? (
              <Chip label="INC Subjects" color="orange" />
            ) : null}
            {record.hasFailed ? (
              <Chip label="Failed Subjects" color="red" />
            ) : null}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Actions Row */}
        <View style={styles.actionsRow}>
          <View style={styles.actionsLeft}>
            {hasFile ? (
              <TouchableOpacity
                style={styles.actionBtn}
                activeOpacity={0.8}
                onPress={() => onPreview(record)}
              >
                <Ionicons name="eye-outline" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Grade Report</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.noFileBadge}>
                <Ionicons name="document-outline" size={14} color="#848baf" />
                <Text style={styles.noFileText}>No File</Text>
              </View>
            )}

            {record.aiSummary ? (
              <TouchableOpacity
                style={[
                  styles.aiToggleBtn,
                  aiExpanded ? styles.aiToggleBtnActive : null
                ]}
                activeOpacity={0.8}
                onPress={() => setAiExpanded(!aiExpanded)}
              >
                <Ionicons 
                  name="bulb-outline" 
                  size={16} 
                  color={aiExpanded ? '#fff' : '#6366f1'} 
                />
                <Text style={[
                  styles.aiToggleText,
                  aiExpanded ? styles.aiToggleTextActive : null
                ]}>
                  AI Summary
                </Text>
                <Ionicons 
                  name={aiExpanded ? 'chevron-up' : 'chevron-down'} 
                  size={14} 
                  color={aiExpanded ? '#fff' : '#6366f1'} 
                  style={{ marginLeft: 2 }}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {record.submittedAt ? (
            <Text style={styles.dateText}>
              Sub: {formatDate(record.submittedAt)}
            </Text>
          ) : null}
        </View>

        {/* Expanded AI Summary */}
        {record.aiSummary && aiExpanded ? (
          <View style={styles.aiSummaryContainer}>
            <View style={styles.aiSummaryHeader}>
              <Ionicons name="sparkles" size={14} color="#6366f1" />
              <Text style={styles.aiSummaryTitle}>AI ANALYSIS SUMMARY</Text>
            </View>
            <Text style={styles.aiSummaryText}>{record.aiSummary}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

/* ─────────── Main Component ─────────── */
export default function AcademicRecordsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const [records, setRecords] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [termLabels, setTermLabels] = useState([]);
  
  const [yearFilter, setYearFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('all');
  const [activePicker, setActivePicker] = useState(null); // 'year' | 'term' | null

  const fetchRecords = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const res = await getScholarAcademicRecords();
      if (res.success) {
        setRecords(res.data?.records || []);
        setAcademicYears(res.data?.academicYears || []);
        setTermLabels(res.data?.termLabels || []);
      } else {
        setError(res.message || 'Failed to load academic records.');
      }
    } catch (err) {
      setError(err?.message || 'Failed to load academic records. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecords(true);
  };

  // Combine user academic year dynamically to avoid hardcoding
  const allAcademicYears = useMemo(() => {
    const yearsSet = new Set(academicYears);
    const userYear = user?.academicYear;
    if (userYear) {
      yearsSet.add(userYear);
    }
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [academicYears, user]);

  const filteredRecords = useMemo(() => {
    let result = records;
    if (yearFilter !== 'all') {
      result = result.filter((r) => r.academicYear === yearFilter);
    }
    if (termFilter !== 'all') {
      result = result.filter((r) => r.term === termFilter);
    }
    return result;
  }, [records, yearFilter, termFilter]);

  // Group records by academic year for the "All Years" view
  const groupedByYear = useMemo(() => {
    if (yearFilter !== 'all') return null; // flat list when a specific year is selected
    const groups = [];
    for (const year of allAcademicYears) {
      const yearRecords = filteredRecords.filter((r) => r.academicYear === year);
      if (yearRecords.length > 0) {
        groups.push({ year, records: yearRecords });
      }
    }
    return groups;
  }, [yearFilter, allAcademicYears, filteredRecords]);

  const hasActiveFilters = yearFilter !== 'all' || termFilter !== 'all';

  // Preview / Download PDF action sheet
  const handlePreview = async (record) => {
    const url = record.gradeReportUrl;
    if (!url) {
      Alert.alert('Error', 'The file URL could not be resolved.');
      return;
    }

    Alert.alert(
      'Grade Report File',
      `Grade compliance report for ${record.term} AY ${record.academicYear}. Choose an option:`,
      [
        {
          text: 'Preview / Open',
          onPress: async () => {
            try {
              await WebBrowser.openBrowserAsync(url);
            } catch (err) {
              try {
                await Linking.openURL(url);
              } catch (linkErr) {
                Alert.alert('Error', 'Unable to open file in-browser.');
              }
            }
          }
        },
        {
          text: 'Download & Share',
          onPress: async () => {
            const ext = record.gradeReportMimeType === 'application/pdf' ? 'pdf' : 'jpg';
            const fileName = record.gradeReportFileName || `grade_report_${record.id}.${ext}`;
            
            if (!FileSystem.documentDirectory) {
              try {
                await Linking.openURL(url);
              } catch (err) {
                Alert.alert('Error', 'No local file system available. Opening URL instead.');
              }
              return;
            }

            const localUri = `${FileSystem.documentDirectory}${fileName}`;
            try {
              const downloadResult = await FileSystem.downloadAsync(url, localUri);
              if (downloadResult.status !== 200) {
                throw new Error(`Download status: ${downloadResult.status}`);
              }

              const canShare = await Sharing.isAvailableAsync();
              if (canShare) {
                await Sharing.shareAsync(downloadResult.uri, {
                  mimeType: record.gradeReportMimeType || 'application/pdf',
                  dialogTitle: `Share Grade Report - ${record.term}`,
                });
              } else {
                await Linking.openURL(url);
              }
            } catch (err) {
              console.warn('File download failed, opening browser instead:', err);
              try {
                await Linking.openURL(url);
              } catch (linkErr) {
                Alert.alert('Error', 'Unable to open or download the grade report.');
              }
            }
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1c2131" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Academic Records</Text>
          <Text style={styles.headerSubtitle}>Grade compliance history</Text>
        </View>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#5b5f97" />
          <Text style={styles.loadingText}>Fetching academic records...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={50} color="#ef4444" style={{ marginBottom: 12 }} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchRecords()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : records.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5b5f97']} />}
        >
          <Ionicons name="school-outline" size={80} color="#a2aab8" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>No Academic Records Yet</Text>
          <Text style={styles.emptySubtitle}>
            Your grade compliance submissions will appear here once you submit them.
          </Text>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Filters Bar */}
          <View style={styles.filterBar}>
            <TouchableOpacity
              style={[styles.filterDropdown, yearFilter !== 'all' && styles.filterDropdownActive]}
              onPress={() => setActivePicker('year')}
            >
              <Text style={[styles.filterDropdownText, yearFilter !== 'all' && styles.filterDropdownTextActive]} numberOfLines={1}>
                {yearFilter === 'all' ? 'All Years' : `AY ${yearFilter}`}
              </Text>
              <Ionicons name="chevron-down" size={14} color={yearFilter !== 'all' ? '#fff' : '#6b72aa'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterDropdown, termFilter !== 'all' && styles.filterDropdownActive]}
              onPress={() => setActivePicker('term')}
            >
              <Text style={[styles.filterDropdownText, termFilter !== 'all' && styles.filterDropdownTextActive]} numberOfLines={1}>
                {termFilter === 'all' ? 'All Terms' : termFilter}
              </Text>
              <Ionicons name="chevron-down" size={14} color={termFilter !== 'all' ? '#fff' : '#6b72aa'} />
            </TouchableOpacity>

            {hasActiveFilters ? (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => {
                  setYearFilter('all');
                  setTermFilter('all');
                }}
              >
                <Ionicons name="close-circle" size={20} color="#ef4444" />
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Submissions List */}
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5b5f97']} />}
          >
            {filteredRecords.length === 0 ? (
              <View style={styles.noMatchContainer}>
                <Ionicons name="funnel-outline" size={48} color="#a2aab8" style={{ marginBottom: 12 }} />
                <Text style={styles.noMatchText}>No records match your filters</Text>
                <TouchableOpacity
                  onPress={() => {
                    setYearFilter('all');
                    setTermFilter('all');
                  }}
                >
                  <Text style={styles.clearFiltersLink}>Reset Filter Settings</Text>
                </TouchableOpacity>
              </View>
            ) : groupedByYear ? (
              /* Grouped by academic year */
              groupedByYear.map(({ year, records: yearRecords }) => (
                <View key={year} style={styles.yearSection}>
                  <View style={styles.yearHeaderRow}>
                    <View style={styles.yearIndicator} />
                    <Text style={styles.yearHeading}>Academic Year {year}</Text>
                    <View style={styles.yearHeadingLine} />
                  </View>
                  <View style={styles.yearCards}>
                    {yearRecords.map((record) => (
                      <AcademicRecordCard
                        key={record.id}
                        record={record}
                        onPreview={handlePreview}
                        hideYear
                      />
                    ))}
                  </View>
                </View>
              ))
            ) : (
              /* Flat list of specific year */
              <View style={styles.flatCards}>
                {filteredRecords.map((record) => (
                  <AcademicRecordCard
                    key={record.id}
                    record={record}
                    onPreview={handlePreview}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Dynamic Filter Modal (Bottom Sheet Style) */}
      <Modal
        visible={activePicker !== null}
        transparent
        animationType="slide"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setActivePicker(null)}
          />
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activePicker === 'year' ? 'Select Academic Year' : 'Select Academic Term'}
              </Text>
              <TouchableOpacity onPress={() => setActivePicker(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#1c2131" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              {/* All Option */}
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  (activePicker === 'year' ? yearFilter : termFilter) === 'all' && styles.optionItemActive
                ]}
                onPress={() => {
                  if (activePicker === 'year') setYearFilter('all');
                  else setTermFilter('all');
                  setActivePicker(null);
                }}
              >
                <Text style={[
                  styles.optionText,
                  (activePicker === 'year' ? yearFilter : termFilter) === 'all' && styles.optionTextActive
                ]}>
                  {activePicker === 'year' ? 'All Academic Years' : 'All Terms'}
                </Text>
                {(activePicker === 'year' ? yearFilter : termFilter) === 'all' && (
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                )}
              </TouchableOpacity>

              {/* Dynamic Items */}
              {(activePicker === 'year' ? allAcademicYears : termLabels).map((option) => {
                const isSelected = activePicker === 'year' ? yearFilter === option : termFilter === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionItem,
                      isSelected && styles.optionItemActive
                    ]}
                    onPress={() => {
                      if (activePicker === 'year') setYearFilter(option);
                      else setTermFilter(option);
                      setActivePicker(null);
                    }}
                  >
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextActive
                    ]}>
                      {activePicker === 'year' ? `AY ${option}` : option}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#848baf',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 15,
    color: '#ef4444',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#5b5f97',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eff1f8',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1c2131',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#848baf',
    fontWeight: '500',
    marginTop: 1,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#edf0f8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  filterDropdownActive: {
    backgroundColor: '#5b5f97',
    borderColor: '#5b5f97',
  },
  filterDropdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b72aa',
    marginRight: 4,
  },
  filterDropdownTextActive: {
    color: '#fff',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ef4444',
    marginLeft: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#343a40',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#848baf',
    textAlign: 'center',
    lineHeight: 18,
  },
  noMatchContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  noMatchText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#848baf',
    marginBottom: 8,
  },
  clearFiltersLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5b5f97',
    textDecorationLine: 'underline',
  },
  yearSection: {
    marginTop: 20,
  },
  yearHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  yearIndicator: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: '#5b5f97',
    marginRight: 8,
  },
  yearHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1c2131',
  },
  yearHeadingLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
    marginLeft: 12,
  },
  yearCards: {
    gap: 12,
  },
  flatCards: {
    marginTop: 12,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#edf0f8',
    flexDirection: 'row',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1d2e57',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardAccent: {
    width: 5,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitleCol: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardTermText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1c2131',
  },
  cardYearText: {
    fontSize: 12,
    color: '#848baf',
    fontWeight: '500',
  },
  cardScholarshipText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  gwaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  gwaBox: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  gwaBoxApproved: {
    backgroundColor: '#ecfdf5',
  },
  gwaBoxRejected: {
    backgroundColor: '#fef2f2',
  },
  gwaBoxDefault: {
    backgroundColor: '#f0f2fb',
  },
  gwaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#848baf',
    textTransform: 'uppercase',
  },
  gwaValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 1,
  },
  gwaTextApproved: {
    color: '#10b981',
  },
  gwaTextRejected: {
    color: '#ef4444',
  },
  gwaTextDefault: {
    color: '#5b5f97',
  },
  gwaMetaText: {
    fontSize: 8,
    color: '#94a3b8',
    marginTop: 2,
  },
  chipsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#edf0f8',
    marginVertical: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5b5f97',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  noFileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  noFileText: {
    color: '#848baf',
    fontSize: 11,
    fontWeight: '700',
  },
  aiToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    borderColor: '#c7d2fe',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  aiToggleBtnActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  aiToggleText: {
    color: '#6366f1',
    fontSize: 11,
    fontWeight: '700',
  },
  aiToggleTextActive: {
    color: '#fff',
  },
  dateText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  aiSummaryContainer: {
    marginTop: 12,
    backgroundColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  aiSummaryTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366f1',
    letterSpacing: 0.5,
  },
  aiSummaryText: {
    fontSize: 12,
    color: '#4c1d95',
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eff1f8',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1c2131',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eff1f8',
    backgroundColor: '#fff',
  },
  optionItemActive: {
    backgroundColor: '#5b5f97',
    borderColor: '#5b5f97',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3d4076',
  },
  optionTextActive: {
    color: '#fff',
  },
});
