import React, { useState, useEffect, useMemo, useRef, useContext } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  ScrollView, 
  RefreshControl, 
  ActivityIndicator 
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { getScholarApplicationHistory } from "../services/scholarDashboardService";
import { getMyVocationalCompletion } from "../services/vocationalDashboardService";

/* ─────────── Status / Step metadata ─────────── */
const STATUS_TO_STEP = {
  under_review: 0,
  reviewing: 0,
  approved: 1,
  released: 1,
  compliant: 1,
  rejected: -1,
  disapproved: -1,
  non_compliant: -1,
  not_started: -2,
};

const CATEGORY_ICONS = {
  grade_compliance: { icon: "document-text-outline", color: "#16a34a", lightBg: "#dcfce7", topColor: "#bbf7d0" },
  transfer_school: { icon: "swap-horizontal-outline", color: "#0284c7", lightBg: "#e0f2fe", topColor: "#bae6fd" },
  exam_assistance: { icon: "checkmark-circle-outline", color: "#7c3aed", lightBg: "#ede9fe", topColor: "#ddd6fe" },
  renewal: { icon: "refresh-outline", color: "#d97706", lightBg: "#fef3c7", topColor: "#fde68a" },
  receipt_submission: { icon: "receipt-outline", color: "#db2777", lightBg: "#fce7f3", topColor: "#fbcfe8" },
  vocational_completion: { icon: "ribbon-outline", color: "#41b5bd", lightBg: "#eefafc", topColor: "#bae6fd" },
};

const CATEGORY_FILTERS = [
  { key: "all", label: "All Applications" },
  { key: "grade_compliance", label: "Grade Compliance" },
  { key: "exam_assistance", label: "Exam Assistance" },
  { key: "renewal", label: "Renewal" },
  { key: "receipt_submission", label: "Receipt Submission" },
];

const normalizeStatus = (raw) => {
  if (!raw) return "not_started";
  const s = raw.toLowerCase().replace(/[\s-]+/g, "_");
  
  if (s.includes("reject") || s.includes("disapprov") || s.includes("non_compliant")) return "rejected";
  if (s.includes("approv") || s.includes("complet") || s.includes("releas") || s.includes("compliant")) return "approved";
  if (s.includes("review") || s.includes("submit") || s.includes("pending")) return "under_review";
  
  if (STATUS_TO_STEP[s] !== undefined) return s;
  return "under_review";
};

const formatDate = (d) => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return null;
  }
};

const STATUS_BADGE = {
  under_review: { bg: "#eef2ff", text: "#4338ca", dot: "#4f46e5" },
  approved: { bg: "#f0fdf4", text: "#15803d", dot: "#16a34a" },
  rejected: { bg: "#fef2f2", text: "#dc2626", dot: "#ef4444" },
  not_started: { bg: "#f9fafb", text: "#6b7280", dot: "#9ca3af" },
};

const extractApplicationItems = (response) => {
  if (!response) return [];

  if (Array.isArray(response)) return response;

  if (Array.isArray(response.applicationItems)) return response.applicationItems;

  if (Array.isArray(response.data?.applicationItems)) return response.data.applicationItems;

  if (Array.isArray(response.data)) return response.data;

  return [];
};

const extractVocationalSubmission = (response) => {
  if (!response) return null;

  return response.data || response;
};

export default function ApplicationScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("");

  const [applicationItems, setApplicationItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const academicYears = useMemo(
    () =>
      [...new Set(applicationItems.filter(item => item.category !== "exam_assistance").map((item) => item.academicYear).filter(Boolean))]
        .sort((a, b) => b.localeCompare(a)),
    [applicationItems]
  );

  // Vocational specific states (Mirroring web's VocationalScholarApplicationTab)
  const [vocSubmission, setVocSubmission] = useState(undefined);
  const [vocLoading, setVocLoading] = useState(true);

  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Detect if user is a vocational scholar
  const hasVocationalValue = (obj) => {
    if (!obj) return false;
    return Object.values(obj).some(val => {
      if (typeof val === 'string') return val.toLowerCase().includes('vocational');
      if (typeof val === 'object') return hasVocationalValue(val);
      return false;
    });
  };
  const isVocational = hasVocationalValue(user) || String(user?.program || '').toLowerCase().includes('vocational');

  // Fetch standard tertiary history
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await getScholarApplicationHistory();
      const rawItems = extractApplicationItems(res) || [];
      const filteredItems = rawItems.filter(i => i.category !== "transfer_school" && i.category !== "vocational_completion");
      setApplicationItems(filteredItems);
      const years = [...new Set(filteredItems.filter(item => item.category !== "exam_assistance").map((item) => item.academicYear).filter(Boolean))]
        .sort((a, b) => b.localeCompare(a));
      if (years.length > 0) {
        setYearFilter(prev => prev || years[0]);
      }
    } catch (error) {
      console.error("Failed to fetch application history", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch vocational completion proof details
  const fetchVocSubmission = async () => {
    try {
      setVocLoading(true);
      const res = await getMyVocationalCompletion();
      setVocSubmission(extractVocationalSubmission(res));
    } catch (error) {
      console.warn("Failed to fetch vocational submission", error);
      setVocSubmission(null);
    } finally {
      setVocLoading(false);
    }
  };

  useEffect(() => {
    if (isVocational) {
      fetchVocSubmission();
    } else {
      fetchHistory();
    }

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [isVocational]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (isVocational) {
      await fetchVocSubmission();
    } else {
      await fetchHistory();
    }
    setRefreshing(false);
  };

  const filteredItems = useMemo(() => {
    let result = applicationItems;

    if (categoryFilter === "all") {
      result = result.filter(i => i.status !== "not_started");
    } else {
      result = result.filter(i => i.category === categoryFilter);
    }

    if (yearFilter) {
      result = result.filter((item) => item.category === "exam_assistance" || item.academicYear === yearFilter);
    }

    if (statusFilter === "under_review") {
      result = result.filter(i => {
        const s = normalizeStatus(i.status);
        return s === "under_review" || s === "submitted";
      });
    } else if (statusFilter === "approved") {
      result = result.filter(i => normalizeStatus(i.status) === "approved");
    } else if (statusFilter === "disapproved") {
      result = result.filter(i => normalizeStatus(i.status) === "rejected");
    }

    return result;
  }, [applicationItems, statusFilter, categoryFilter, yearFilter]);

  const validItems = useMemo(() => {
    let result = applicationItems.filter(i => i.status !== "not_started");
    if (yearFilter) {
      result = result.filter((item) => item.category === "exam_assistance" || item.academicYear === yearFilter);
    }
    return result;
  }, [applicationItems, yearFilter]);

  const underReviewCount = validItems.filter(i => {
    const s = normalizeStatus(i.status);
    return s === "under_review" || s === "submitted";
  }).length;

  const approvedCount = validItems.filter(i => normalizeStatus(i.status) === "approved").length;
  const disapprovedCount = validItems.filter(i => normalizeStatus(i.status) === "rejected").length;
  const totalCount = validItems.length;

  // Dynamic counts for vocational completeness
  const vocTotalCount = vocSubmission ? 1 : 0;
  const vocIsApproved = vocSubmission?.status === 'approved';
  const vocIsRejected = vocSubmission?.status === 'rejected';
  const vocIsUnderReview = vocSubmission?.status === 'pending';

  const renderStepper = (currentStep, isRejected, category) => {
    const steps = category === "grade_compliance"
      ? ["Under Review", isRejected ? "Non-Compliant" : "Compliant"]
      : ["Under Review", isRejected ? "Disapproved" : "Approved"];

    const isApproved = currentStep === 1 && !isRejected;

    // Define the states for step 1 and step 2
    let step1State = "active";
    let step2State = "pending";

    if (isRejected) {
      step1State = "rejected";
      step2State = "rejected";
    } else if (isApproved) {
      step1State = "completed";
      step2State = "completed";
    }

    return (
      <View style={styles.stepperContainer}>
        {/* Step 1 */}
        <View style={styles.stepItem}>
          <View style={[
            styles.stepCircle,
            step1State === "active" && styles.stepCircleActive,
            step1State === "completed" && styles.stepCircleCompleted,
            step1State === "rejected" && styles.stepCircleRejected
          ]}>
            {step1State === "completed" || step1State === "rejected" ? (
              <Ionicons name="checkmark" size={12} color="#fff" />
            ) : (
              <Text style={styles.stepCircleText}>1</Text>
            )}
          </View>
          <Text style={[
            styles.stepLabel,
            step1State === "active" && styles.stepLabelActive,
            step1State === "completed" && styles.stepLabelCompleted,
            step1State === "rejected" && styles.stepLabelRejected
          ]}>
            {steps[0]}
          </Text>
        </View>

        {/* Connecting Line */}
        <View style={[
          styles.stepLine,
          isApproved && styles.stepLineCompleted,
          isRejected && styles.stepLineRejected
        ]} />

        {/* Step 2 */}
        <View style={styles.stepItem}>
          <View style={[
            styles.stepCircle,
            step2State === "active" && styles.stepCircleActive,
            step2State === "completed" && styles.stepCircleCompleted,
            step2State === "rejected" && styles.stepCircleRejected
          ]}>
            {step2State === "completed" ? (
              <Ionicons name="checkmark" size={12} color="#fff" />
            ) : step2State === "rejected" ? (
              <Ionicons name="close" size={12} color="#fff" />
            ) : (
              <Text style={styles.stepCircleText}>2</Text>
            )}
          </View>
          <Text style={[
            styles.stepLabel,
            step2State === "active" && styles.stepLabelActive,
            step2State === "completed" && styles.stepLabelCompleted,
            step2State === "rejected" && styles.stepLabelRejected
          ]}>
            {steps[1]}
          </Text>
        </View>
      </View>
    );
  };

  // ── BRANCH: VOCATIONAL SCHOLAR VIEW (Mirroring web exactly) ──
  if (isVocational) {
    const vocNormalized = vocSubmission ? normalizeStatus(vocSubmission.status) : "not_started";
    const vocBadgeStyle = STATUS_BADGE[vocNormalized] || STATUS_BADGE.not_started;
    
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16, zIndex: 100, elevation: 15 }]}>
          <Text style={styles.title}>Application</Text>
          <Text style={styles.subtitle}>Track the progress of your certification completion submission.</Text>

          {/* Stats pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
            <View style={styles.statPill}>
              <View style={[styles.statDot, { backgroundColor: "#5b5f97" }]} />
              <Text style={styles.statText}>{vocIsUnderReview ? 1 : 0} Under Review</Text>
            </View>
            <View style={styles.statPill}>
              <View style={[styles.statDot, { backgroundColor: "#10b981" }]} />
              <Text style={styles.statText}>{vocIsApproved ? 1 : 0} Approved</Text>
            </View>
            <View style={styles.statPill}>
              <View style={[styles.statDot, { backgroundColor: "#ef4444" }]} />
              <Text style={styles.statText}>{vocIsRejected ? 1 : 0} Disapproved</Text>
            </View>
            <View style={styles.statPill}>
              <View style={[styles.statDot, { backgroundColor: "#d1d5db" }]} />
              <Text style={styles.statText}>{vocTotalCount} Total</Text>
            </View>
          </ScrollView>
        </View>

        <Animated.ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], zIndex: 1, elevation: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {vocLoading ? (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <ActivityIndicator size="large" color="#5b5f97" />
              <Text style={{ color: '#9ca3af', marginTop: 12, fontSize: 15, fontWeight: '500' }}>Loading submission status...</Text>
            </View>
          ) : !vocSubmission ? (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Ionicons name="clipboard-outline" size={48} color="#d1d5db" />
              <Text style={{ color: '#9ca3af', marginTop: 12, fontSize: 15, fontWeight: '500' }}>No completion submission found</Text>
            </View>
          ) : (
            <View style={styles.cardContainer}>
              <View style={[styles.cardTopBorder, { backgroundColor: "#ddd6fe" }]} />
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={[styles.iconBox, { backgroundColor: "#eefafc" }]}>
                      <Ionicons name="ribbon-outline" size={20} color="#41b5bd" />
                    </View>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.cardTitle}>Certification of Completion</Text>
                      {!!(vocSubmission.submitted_at || vocSubmission.submittedAt) && (
                        <Text style={styles.cardSubtitle}>
                          Submitted {formatDate(vocSubmission.submitted_at || vocSubmission.submittedAt)}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: vocBadgeStyle.bg }]}>
                    <View style={[styles.statusBadgeDot, { backgroundColor: vocBadgeStyle.dot }]} />
                    <Text style={[styles.statusBadgeText, { color: vocBadgeStyle.text }]} numberOfLines={1}>
                      {vocSubmission.status ? vocSubmission.status.charAt(0).toUpperCase() + vocSubmission.status.slice(1).toLowerCase() : "Under Review"}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBodyContainer}>
                  {renderStepper(
                    STATUS_TO_STEP[vocNormalized] ?? -2, 
                    vocNormalized === "rejected", 
                    "vocational_completion"
                  )}

                  {!!(vocSubmission.updated_at || vocSubmission.updatedAt) && (
                    <Text style={styles.updatedText}>
                      Last updated {formatDate(vocSubmission.updated_at || vocSubmission.updatedAt)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </Animated.ScrollView>
      </View>
    );
  }

  // ── BRANCH: STANDARD TERTIARY SCHOLAR VIEW ──
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, zIndex: 100, elevation: 15 }]}>
        <Text style={styles.title}>Application</Text>

        {/* Stats Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
          <View style={styles.statPill}>
            <View style={[styles.statDot, { backgroundColor: "#5b5f97" }]} />
            <Text style={styles.statText}>{underReviewCount} Under Review</Text>
          </View>
          <View style={styles.statPill}>
            <View style={[styles.statDot, { backgroundColor: "#10b981" }]} />
            <Text style={styles.statText}>{approvedCount} Approved</Text>
          </View>
          <View style={styles.statPill}>
            <View style={[styles.statDot, { backgroundColor: "#ef4444" }]} />
            <Text style={styles.statText}>{disapprovedCount} Disapproved</Text>
          </View>
          <View style={styles.statPill}>
            <View style={[styles.statDot, { backgroundColor: "#d1d5db" }]} />
            <Text style={styles.statText}>{totalCount} Total</Text>
          </View>
        </ScrollView>

        {/* Status Filters */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmentControl}>
            {[
              { key: "all", label: "All" },
              { key: "under_review", label: "Under Review" },
              { key: "approved", label: categoryFilter === "grade_compliance" ? "Compliant" : "Approved" },
              ...(categoryFilter === "grade_compliance" ? [] : [{ key: "disapproved", label: "Disapproved" }]),
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.segmentBtn, statusFilter === tab.key && styles.segmentBtnActive]}
                onPress={() => setStatusFilter(tab.key)}
              >
                <Text style={[styles.segmentText, statusFilter === tab.key && styles.segmentTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Category Filters */}
        <View style={styles.categoryRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORY_FILTERS.map((opt) => (
              <TouchableOpacity 
                key={opt.key} 
                style={[styles.categoryPill, categoryFilter === opt.key && styles.categoryPillActive]} 
                onPress={() => {
                  setCategoryFilter(opt.key);
                  if (opt.key === "grade_compliance" && statusFilter === "disapproved") {
                    setStatusFilter("all");
                  }
                }}
              >
                <Text style={[styles.categoryPillText, categoryFilter === opt.key && styles.categoryPillTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Academic Year Filters */}
        {academicYears.length > 0 && (
          <View style={styles.yearRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearScroll}>
              {academicYears.map((year) => (
                <TouchableOpacity 
                  key={year} 
                  style={[styles.yearPill, yearFilter === year && styles.yearPillActive]} 
                  onPress={() => setYearFilter(year)}
                >
                  <Text style={[styles.yearPillText, yearFilter === year && styles.yearPillTextActive]}>{year}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], zIndex: 1, elevation: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
           <View style={{ alignItems: 'center', marginTop: 40 }}>
             <ActivityIndicator size="large" color="#5b5f97" />
             <Text style={{ color: '#9ca3af', marginTop: 12, fontSize: 15, fontWeight: '500' }}>Loading applications...</Text>
           </View>
        ) : filteredItems.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Ionicons name="documents-outline" size={48} color="#d1d5db" />
            <Text style={{ color: '#9ca3af', marginTop: 12, fontSize: 15, fontWeight: '500' }}>No applications found.</Text>
          </View>
        ) : null}

        {filteredItems.map((item) => {
          const isRestrictedCategory = ["exam_assistance", "renewal", "grade_compliance"].includes(item.category);
          const currentStatus = normalizeStatus(item.status);
          const blockNavigation = isRestrictedCategory && item.hasActiveApplication && currentStatus !== "rejected";
          
          const isStarted = currentStatus !== "not_started";
          const isRejected = currentStatus === "rejected";
          const stepIdx = STATUS_TO_STEP[currentStatus] ?? -2;

          const theme = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.grade_compliance;
          const badgeStyle = STATUS_BADGE[currentStatus] || STATUS_BADGE.not_started;
          let badgeLabel = currentStatus === "not_started" ? "Not Started" 
            : item.status ? item.status.split(/[_ -]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") : "Unknown";

          if (item.category === "grade_compliance") {
            if (currentStatus === "approved") badgeLabel = "Compliant";
            if (currentStatus === "rejected") badgeLabel = "Non-Compliant";
          }

          return (
            <View 
              key={item.id} 
              style={[styles.cardContainer, (!isStarted && blockNavigation) && styles.cardDisabled]}
            >
              <View style={[styles.cardTopBorder, { backgroundColor: theme.topColor }]} />

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={[styles.iconBox, { backgroundColor: theme.lightBg }]}>
                      <Ionicons name={theme.icon} size={20} color={theme.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      {!!item.submittedDate && (
                        <Text style={styles.cardSubtitle}>Submitted {formatDate(item.submittedDate)}</Text>
                      )}
                    </View>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: badgeStyle.bg }]}>
                    <View style={[styles.statusBadgeDot, { backgroundColor: badgeStyle.dot }]} />
                    <Text style={[styles.statusBadgeText, { color: badgeStyle.text }]} numberOfLines={1}>{badgeLabel}</Text>
                  </View>
                </View>

                <View style={styles.cardBodyContainer}>
                  {!isStarted ? (
                    <View style={styles.emptyStateBox}>
                      <Ionicons name="time-outline" size={16} color="#9ca3af" style={{ marginRight: 6 }} />
                      <Text style={styles.emptyStateText}>No application submitted yet</Text>
                    </View>
                  ) : (
                    renderStepper(stepIdx, isRejected, item.category)
                  )}

                  {!!item.updatedDate && isStarted && (
                    <Text style={styles.updatedText}>Last updated {formatDate(item.updatedDate)}</Text>
                  )}

                  {!blockNavigation && !isStarted && (
                    <TouchableOpacity
                      style={[styles.startBtn, { backgroundColor: theme.color }]}
                      activeOpacity={0.8}
                      onPress={() => {
                         if (item.navigateTo) {
                           navigation.navigate(item.navigateTo);
                         }
                      }}
                    >
                      <Text style={styles.startBtnText}>
                        Start Application
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fc" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#f8f9fc",
    zIndex: 100,
    elevation: 10
  },
  title: { fontSize: 24, fontWeight: "900", color: "#111827", letterSpacing: -0.5, marginBottom: 16 },
  subtitle: { fontSize: 13, color: "#6b7280", marginTop: -10, marginBottom: 16, fontWeight: "500", lineHeight: 18 },

  statsRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    marginRight: 8
  },
  statDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statText: { fontSize: 13, fontWeight: "600", color: "#4b5563" },

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 100,
    elevation: 10
  },
  segmentControl: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: "#f3f4f6"
  },
  segmentBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  segmentBtnActive: { backgroundColor: "#f3f4f6" },
  segmentText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  segmentTextActive: { color: "#111827" },

  categoryRow: {
    marginTop: 12,
  },
  categoryScroll: {
    flexDirection: "row",
    gap: 8,
  },
  categoryPill: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: "#5b5f97",
    borderColor: "#5b5f97",
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  categoryPillTextActive: {
    color: "#fff",
  },

  content: { padding: 20, paddingBottom: 100 },

  cardContainer: {
    marginBottom: 20,
    position: 'relative'
  },
  cardTopBorder: {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    height: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  cardDisabled: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 10 },
  iconBox: {
    width: 40, height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1f2937" },
  cardSubtitle: { fontSize: 12, color: "#6b7280", marginTop: 2, fontWeight: "500" },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: 120,
  },
  statusBadgeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusBadgeText: { fontSize: 11, fontWeight: "700", flexShrink: 1 },

  cardBodyContainer: {
    marginTop: 16,
  },

  emptyStateBox: {
    flexDirection: 'row',
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16
  },
  emptyStateText: { fontSize: 13, color: "#9ca3af", fontWeight: "500" },

  updatedText: {
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "right",
    marginBottom: 12,
    marginTop: 4,
  },

  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  startBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 8,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
  },
  stepCircleActive: { backgroundColor: "#5b5f97" },
  stepCircleCompleted: { backgroundColor: "#16a34a" },
  stepCircleRejected: { backgroundColor: "#ef4444" },
  stepCircleText: { fontSize: 10, fontWeight: "800", color: "#fff" },

  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 12,
    borderRadius: 1,
  },
  stepLineCompleted: { backgroundColor: "#16a34a" },
  stepLineRejected: { backgroundColor: "#ef4444" },

  stepLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#848baf",
    marginLeft: 8,
  },
  stepLabelActive: { color: "#5b5f97" },
  stepLabelCompleted: { color: "#16a34a" },
  stepLabelRejected: { color: "#ef4444" },
  yearRow: {
    marginTop: 12,
  },
  yearScroll: {
    flexDirection: "row",
    gap: 8,
  },
  yearPill: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  yearPillActive: {
    backgroundColor: "#5b5f97",
    borderColor: "#5b5f97",
  },
  yearPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  yearPillTextActive: {
    color: "#fff",
  },
});
