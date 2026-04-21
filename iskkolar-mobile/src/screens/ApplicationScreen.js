import React, { useState, useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getScholarApplicationHistory } from "../services/scholarDashboardService";

/* ─────────── Status / Step metadata ─────────── */
const STEPS = ["Under Review", "Approved"];

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
};

const CATEGORY_FILTERS = [
  { key: "all", label: "All Applications" },
  { key: "grade_compliance", label: "Grade Compliance" },
  { key: "transfer_school", label: "Transfer of School" },
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

export default function ApplicationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [applicationItems, setApplicationItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [expandedCards, setExpandedCards] = useState({});

  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await getScholarApplicationHistory();
      if (res.success) {
        setApplicationItems(res.data.applicationItems || []);
      }
    } catch (error) {
      console.error("Failed to fetch application history", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const filteredItems = useMemo(() => {
    let result = applicationItems;

    if (categoryFilter === "all") {
      result = result.filter(i => i.status !== "not_started");
    } else {
      result = result.filter(i => i.category === categoryFilter);
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
  }, [applicationItems, statusFilter, categoryFilter]);

  const validItems = applicationItems.filter(i => i.status !== "not_started");

  const underReviewCount = validItems.filter(i => {
    const s = normalizeStatus(i.status);
    return s === "under_review" || s === "submitted";
  }).length;

  const approvedCount = validItems.filter(i => normalizeStatus(i.status) === "approved").length;
  const disapprovedCount = validItems.filter(i => normalizeStatus(i.status) === "rejected").length;
  const totalCount = validItems.length;

  const toggleCard = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderStepper = (currentStep, isRejected, category) => {
    const steps = category === "grade_compliance"
      ? ["Under Review", isRejected ? "Non-Compliant" : "Compliant"]
      : ["Under Review", isRejected ? "Disapproved" : "Approved"];

    const isApproved = currentStep === 1 && !isRejected;

    return (
      <View style={styles.stepperContainer}>
        {steps.map((label, idx) => {
          let state = "pending";
          if (isRejected) {
            state = "rejected";
          } else if (isApproved) {
            state = "completed";
          } else {
            state = idx === 0 ? "active" : "pending";
          }
          
          const isCompleted = state === "completed";
          const isActive = state === "active";
          const isRejectedState = state === "rejected";
          const isLast = idx === steps.length - 1;

          return (
            <View key={label} style={[styles.stepRow, !isLast && { flex: 1 }]}>
              <View style={styles.stepColumn}>
                <View style={[
                  styles.stepCircle, 
                  isActive && styles.stepCircleActive,
                  isCompleted && styles.stepCircleCompleted,
                  isRejectedState && styles.stepCircleRejected
                ]}>
                  {isCompleted || (isRejectedState && idx === 0) ? (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  ) : isRejectedState && idx === 1 ? (
                    <Ionicons name="close" size={16} color="#fff" />
                  ) : (
                    <Text style={styles.stepCircleText}>
                      {idx + 1}
                    </Text>
                  )}
                </View>
                <Text style={[
                  styles.stepLabel, 
                  isActive && styles.stepLabelActive,
                  isCompleted && styles.stepLabelCompleted,
                  isRejectedState && styles.stepLabelRejected
                ]}>
                  {label}
                </Text>
              </View>

              {!isLast && (
                <View style={[
                  styles.stepLine, 
                  isApproved && styles.stepLineCompleted,
                  isRejected && styles.stepLineRejected
                ]} />
              )}
            </View>
          );
        })}
      </View>
    );
  };

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
              { key: "approved", label: "Approved" },
              { key: "disapproved", label: "Disapproved" },
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
                onPress={() => setCategoryFilter(opt.key)}
              >
                <Text style={[styles.categoryPillText, categoryFilter === opt.key && styles.categoryPillTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
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
          const isRestrictedCategory = ["exam_assistance", "transfer_school", "renewal", "grade_compliance"].includes(item.category);
          const currentStatus = normalizeStatus(item.status);
          const blockNavigation = isRestrictedCategory && item.hasActiveApplication && currentStatus !== "rejected";
          
          const isStarted = currentStatus !== "not_started";
          const isRejected = currentStatus === "rejected";
          const isExpanded = !!expandedCards[item.id];
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
              style={[styles.cardContainer, blockNavigation && styles.cardDisabled]}
            >
              <View style={[styles.cardTopBorder, { backgroundColor: theme.topColor }]} />

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={[styles.iconBox, { backgroundColor: theme.lightBg }]}>
                      <Ionicons name={theme.icon} size={20} color={theme.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
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

  stepperContainer: { flexDirection: "row", alignItems: "flex-start", marginTop: 10, marginBottom: 12 },
  stepRow: { flexDirection: "row", alignItems: "flex-start" },
  stepColumn: { alignItems: "center", width: 70 },
  stepCircle: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
  },
  stepCircleActive: { backgroundColor: "#5b5f97" },
  stepCircleCompleted: { backgroundColor: "#16a34a" },
  stepCircleRejected: { backgroundColor: "#ef4444" },
  stepCircleText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: "#e5e7eb",
    marginTop: 12.5,
    marginHorizontal: 8,
    borderRadius: 2,
  },
  stepLineCompleted: { backgroundColor: "#16a34a" },
  stepLineRejected: { backgroundColor: "#ef4444" },

  stepLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 8,
  },
  stepLabelActive: { color: "#5b5f97" },
  stepLabelCompleted: { color: "#16a34a" },
  stepLabelRejected: { color: "#ef4444" },
});

