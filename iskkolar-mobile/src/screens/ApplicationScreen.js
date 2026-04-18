import React, { useState, useRef, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// MOCK DATA for the new layout
const APPLICATIONS_DATA = [
  {
    id: "grade_compliance",
    title: "Grade Compliance",
    icon: "document-text-outline",
    color: "#10b981",
    lightBg: "#d1fae5",
    topColor: "#a7f3d0",
    status: "Submitted",
    statusColor: "#3b82f6", // blue dot
    statusBg: "#eff6ff",
    steps: ["Submitted", "Under Review", "Approved", "Completed"],
    currentStep: 0,
    routeName: "GradeCompliance"
  },
  {
    id: "transfer_school",
    title: "Transfer of School",
    icon: "swap-horizontal-outline",
    color: "#3b82f6",
    lightBg: "#dbeafe",
    topColor: "#bfdbfe",
    status: "Not Started",
    statusColor: "#9ca3af",
    statusBg: "#f3f4f6",
    routeName: "TransferSchool"
  },
  {
    id: "exam_assistance",
    title: "Exam Assistance",
    icon: "checkmark-circle-outline",
    color: "#8b5cf6",
    lightBg: "#ede9fe",
    topColor: "#ddd6fe",
    status: "Not Started",
    statusColor: "#9ca3af",
    statusBg: "#f3f4f6",
    routeName: "ExamAssistance"
  },
  {
    id: "scholarship_renewal",
    title: "Scholarship Renewal",
    icon: "refresh-outline",
    color: "#f59e0b",
    lightBg: "#fef3c7",
    topColor: "#fde68a",
    status: "Not Started",
    statusColor: "#9ca3af",
    statusBg: "#f3f4f6",
    submittedDate: "Submitted Apr 16, 2026",
    routeName: "ScholarshipRenewal"
  },
  {
    id: "receipt_submission",
    title: "Receipt Submission",
    icon: "receipt-outline",
    color: "#ec4899",
    lightBg: "#fce7f3",
    topColor: "#fbcfe8",
    status: "Not Started",
    statusColor: "#9ca3af",
    statusBg: "#f3f4f6",
    routeName: "FinancialRecords"
  }
];

export default function ApplicationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("All");

  const [expandedCards, setExpandedCards] = useState({ grade_compliance: true });
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  // Logical Stats
  const activeCount = useMemo(() => APPLICATIONS_DATA.filter((app) => app.status !== "Not Started" && app.status !== "Completed" && app.status !== "Approved").length, []);
  const completedCount = useMemo(() => APPLICATIONS_DATA.filter((app) => app.status === "Completed" || app.status === "Approved").length, []);
  const totalCount = APPLICATIONS_DATA.length;

  const filteredApps = useMemo(() => {
    return APPLICATIONS_DATA.filter(app => {
      if (filter === "All") return true;
      const isCompleted = app.status === "Completed" || app.status === "Approved";
      const isActive = app.status !== "Not Started" && !isCompleted;

      if (filter === "Active") return isActive;
      if (filter === "Completed") return isCompleted;
      return true;
    });
  }, [filter]);

  useEffect(() => {
    slideAnim.setValue(20);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const toggleCard = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDropdown = () => {
    if (dropdownVisible) {
      Animated.timing(dropdownAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setDropdownVisible(false));
    } else {
      setDropdownVisible(true);
      Animated.timing(dropdownAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  };

  const renderStepper = (app) => {
    return (
      <View style={styles.stepperContainer}>
        {app.steps.map((stepLabel, index) => {
          const isCompleted = index <= app.currentStep;
          const isCurrent = index === app.currentStep;
          const isLast = index === app.steps.length - 1;

          return (
            <View key={stepLabel} style={styles.stepWrapper}>
              <View style={styles.stepIndicator}>
                <View style={[styles.stepCircle, isCompleted ? styles.stepCircleActive : {}]}>
                  <Text style={[styles.stepCircleText, isCompleted ? styles.stepCircleTextActive : {}]}>
                    {index + 1}
                  </Text>
                </View>
                {!isLast && (
                  <View style={[styles.stepLine, isCompleted && !isCurrent ? styles.stepLineActive : {}]} />
                )}
              </View>
              <Text style={[styles.stepLabel, isCurrent ? styles.stepLabelCurrent : isCompleted ? styles.stepLabelActive : {}]}>
                {stepLabel}
              </Text>
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
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <View style={[styles.statDot, { backgroundColor: "#3b82f6" }]} />
            <Text style={styles.statText}>{activeCount} Active</Text>
          </View>
          <View style={styles.statPill}>
            <View style={[styles.statDot, { backgroundColor: "#10b981" }]} />
            <Text style={styles.statText}>{completedCount} Completed</Text>
          </View>
          <View style={styles.statPill}>
            <View style={[styles.statDot, { backgroundColor: "#9ca3af" }]} />
            <Text style={styles.statText}>{totalCount} Total</Text>
          </View>
        </View>

        {/* Filters Row */}
        <View style={styles.filterRow}>
          <View style={styles.segmentControl}>
            {["All", "Active", "Completed"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.segmentBtn, filter === tab && styles.segmentBtnActive]}
                onPress={() => setFilter(tab)}
              >
                <Text style={[styles.segmentText, filter === tab && styles.segmentTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ position: 'relative', zIndex: 100, elevation: 15 }}>
            <TouchableOpacity style={styles.dropdownBtn} onPress={toggleDropdown}>
              <Text style={styles.dropdownText}>All Applications</Text>
              <Ionicons name={dropdownVisible ? "chevron-up" : "chevron-down"} size={14} color="#6b7280" />
            </TouchableOpacity>

            {dropdownVisible && (
              <Animated.View style={[
                styles.dropdownMenu,
                { opacity: dropdownAnim, transform: [{ translateY: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] }
              ]}>
                <TouchableOpacity style={styles.dropdownMenuItem} onPress={toggleDropdown}>
                  <Text style={styles.dropdownMenuItemTextActive}>All Applications</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dropdownMenuItem} onPress={toggleDropdown}>
                  <Text style={styles.dropdownMenuItemText}>Primary Programs</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dropdownMenuItem} onPress={toggleDropdown}>
                  <Text style={styles.dropdownMenuItemText}>Post-Award Services</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], zIndex: 1, elevation: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredApps.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Ionicons name="documents-outline" size={48} color="#d1d5db" />
            <Text style={{ color: '#9ca3af', marginTop: 12, fontSize: 15, fontWeight: '500' }}>No specific records found.</Text>
          </View>
        ) : null}

        {filteredApps.map((app) => {
          const isStarted = app.status !== "Not Started";
          const isExpanded = !!expandedCards[app.id];

          return (
            <View key={app.id} style={styles.cardContainer}>
              {/* Colored Top Border effect */}
              <View style={[styles.cardTopBorder, { backgroundColor: app.topColor }]} />

              <View style={styles.card}>
                {/* Card Header Layer */}
                <TouchableOpacity
                  style={styles.cardHeader}
                  activeOpacity={0.7}
                  onPress={() => toggleCard(app.id)}
                >
                  <View style={styles.cardHeaderLeft}>
                    <View style={[styles.iconBox, { backgroundColor: app.lightBg }]}>
                      <Ionicons name={app.icon} size={20} color={app.color} />
                    </View>
                    <View>
                      <Text style={styles.cardTitle}>{app.title}</Text>
                      {!!app.submittedDate && (
                        <Text style={styles.cardSubtitle}>{app.submittedDate}</Text>
                      )}
                    </View>
                  </View>

                  {/* Status Badge */}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.statusBadge, { backgroundColor: app.statusBg, marginRight: 8 }]}>
                      <View style={[styles.statusBadgeDot, { backgroundColor: app.statusColor }]} />
                      <Text style={[styles.statusBadgeText, { color: app.statusColor }]}>{app.status}</Text>
                    </View>
                    <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color="#d1d5db" />
                  </View>
                </TouchableOpacity>

                {/* Card Content Layer - only shown if expanded */}
                {isExpanded && (
                  <View style={styles.cardBodyContainer}>
                    <View style={styles.divider} />
                    {isStarted ? (
                      renderStepper(app)
                    ) : (
                      <View style={styles.emptyStateBox}>
                        <Ionicons name="time-outline" size={16} color="#9ca3af" style={{ marginRight: 6 }} />
                        <Text style={styles.emptyStateText}>No application submitted yet</Text>
                      </View>
                    )}

                    {/* Navigation Action Button */}
                    <TouchableOpacity
                      style={[styles.startBtn, { backgroundColor: app.color }]}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate(app.routeName)}
                    >
                      <Text style={styles.startBtnText}>
                        {isStarted ? "View Progress" : "Start Application"}
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
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
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: "#f8f9fc",
    zIndex: 100,
    elevation: 10
  },
  title: { fontSize: 24, fontWeight: "900", color: "#111827", letterSpacing: -0.5, marginBottom: 16 },

  statsRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f3f4f6"
  },
  statDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statText: { fontSize: 13, fontWeight: "600", color: "#4b5563" },

  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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

  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6
  },
  dropdownText: { fontSize: 13, fontWeight: "600", color: "#111827" },

  dropdownMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    zIndex: 999
  },
  dropdownMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dropdownMenuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  dropdownMenuItemTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20
  },
  statusBadgeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },

  cardBodyContainer: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginBottom: 16,
    marginHorizontal: -20,
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

  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 8
  },
  startBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  stepperContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingHorizontal: 4, marginBottom: 20 },
  stepWrapper: { flex: 1, alignItems: "center", position: "relative" },
  stepIndicator: { flexDirection: "row", alignItems: "center", width: "100%" },
  stepCircle: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2
  },
  stepCircleActive: { backgroundColor: "#5b5f97" },
  stepCircleText: { fontSize: 12, fontWeight: "700", color: "#9ca3af" },
  stepCircleTextActive: { color: "#fff" },

  stepLine: {
    position: "absolute",
    left: "50%",
    right: "-50%",
    height: 2,
    backgroundColor: "#f3f4f6",
    zIndex: 1
  },
  stepLineActive: { backgroundColor: "#e5e7eb" },

  stepLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 8,
    width: "120%"
  },
  stepLabelCurrent: { color: "#9ca3af" }, // In mock, "Under Review", "Approved" etc are grey if not active
  stepLabelActive: { color: "#9ca3af" },
});
