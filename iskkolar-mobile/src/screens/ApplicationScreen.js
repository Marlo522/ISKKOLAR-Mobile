import React, { useState, useRef, useMemo, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, ImageBackground, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";

const APPLICATION_STEPS = [
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under Review" },
  { key: "approved", label: "Approved" },
];

const STATUS_LABEL = {
  pending: "submitted",
  submitted: "submitted",
  under_review: "under_review",
  approved: "approved",
  rejected: "submitted",
};

const STATUS_BADGE_LABEL = {
  pending: "Submitted",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
};

const TERTIARY_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=600&auto=format&fit=crop";
const EMPLOYEE_CHILD_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=600&auto=format&fit=crop";

const PROGRAM_META = {
  tertiary: {
    tag: "Tertiary Program",
    image: TERTIARY_FALLBACK_IMAGE,
  },
  employeeChild: {
    tag: "KKFI Staff Program",
    image: EMPLOYEE_CHILD_FALLBACK_IMAGE,
    title: "Employee Child Grant",
  },
  staffAdvancement: {
    tag: "KKFI Staff Program",
    image: EMPLOYEE_CHILD_FALLBACK_IMAGE,
    title: "Staff Advancement Grant",
  },
};

const formatDate = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const normalizeApplicationStatus = (status) => {
  return STATUS_LABEL[status] || "submitted";
};

const toApplicationCardData = (app) => {
  const isChildDesignation = Boolean(app.kkfi_grant_details);
  
  if (isChildDesignation) {
    const details = Array.isArray(app.kkfi_grant_details)
      ? app.kkfi_grant_details[0]
      : app.kkfi_grant_details;
    const isSelfAdvancement = details?.applicant_category === "self_advancement";
    const meta = isSelfAdvancement ? PROGRAM_META.staffAdvancement : PROGRAM_META.employeeChild;

    return {
      id: "child-" + app.id,
      status: normalizeApplicationStatus(app.status),
      rawStatus: app.status || "submitted",
      title: meta.title,
      tag: meta.tag,
      image: meta.image,
      submittedAt: formatDate(app.submitted_at || app.created_at),
    };
  }

  const details = Array.isArray(app.tertiary_application_details)
    ? app.tertiary_application_details[0]
    : app.tertiary_application_details;

  return {
    id: "tert-" + app.id,
    status: normalizeApplicationStatus(app.status),
    rawStatus: app.status || "submitted",
    title: details?.scholarship_type || "Tertiary Scholarship",
    tag: PROGRAM_META.tertiary.tag,
    image: PROGRAM_META.tertiary.image,
    submittedAt: formatDate(app.submitted_at || app.created_at),
  };
};

export default function ApplicationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadApplications = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError("");

      const [tertiaryResult, employeeChildResult, staffAdvancementResult] = await Promise.allSettled([
        api("/scholarships/tertiary/my-applications", { method: "GET" }).catch(() => ({ data: [] })),
        api("/scholarships/child-designation/my-applications", { method: "GET" }).catch(() => ({ data: [] })),
        api("/scholarships/staff-advancement/my-applications", { method: "GET" }).catch(() => ({ data: [] })),
      ]);

      const tertApps = tertiaryResult.status === "fulfilled" && tertiaryResult.value?.data ? ensureArray(tertiaryResult.value.data) : [];
      const childApps = employeeChildResult.status === "fulfilled" && employeeChildResult.value?.data ? ensureArray(employeeChildResult.value.data) : [];
      const staffApps =
        staffAdvancementResult.status === "fulfilled" && staffAdvancementResult.value?.data
          ? ensureArray(staffAdvancementResult.value.data)
          : [];

      setApplications([...tertApps, ...childApps, ...staffApps]);
    } catch (err) {
      setError(err?.message || "Failed to load applications.");
    } finally {
      if (isRefresh) setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadApplications();
      slideAnim.setValue(20);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, [loadApplications])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadApplications(true);
  };

  const mappedApplications = useMemo(() => applications.map(toApplicationCardData), [applications]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBox}>
        <Ionicons name="document-text-outline" size={48} color="#5b5f97" />
      </View>
      <Text style={styles.emptyTitle}>Nothing to see here... Yet!</Text>
      <Text style={styles.emptySubText}>
        You haven't submitted a scholarship application. Start your application now to be considered for the KKFI scholarship program.
      </Text>
      <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate("HomeMain")}>
        <Text style={styles.browseBtnText}>Browse Scholarships</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCard = (app) => {
    const isRejected = app.rawStatus === "rejected";
    const currentStepIndex = APPLICATION_STEPS.findIndex((s) => s.key === app.status);
    const safeStepIndex = currentStepIndex >= 0 ? currentStepIndex : 0;
    const progressWidth = ((safeStepIndex + 1) / APPLICATION_STEPS.length) * 100;

    return (
      <View key={app.id} style={styles.card}>
        <ImageBackground source={{ uri: app.image }} style={styles.cardHeader} imageStyle={{ opacity: 0.85 }}>
          <View style={styles.cardHeaderOverlay}>
            <View style={styles.tagWrap}>
              <Text style={styles.tagText}>{app.tag}</Text>
            </View>
            <Text style={styles.cardTitle}>{app.title}</Text>
          </View>
        </ImageBackground>

        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <View style={[styles.statusBadge, isRejected ? { backgroundColor: "#fee2e2" } : {}]}>
              <Text style={[styles.statusBadgeText, isRejected ? { color: "#b91c1c" } : {}]}>
                {STATUS_BADGE_LABEL[app.rawStatus] || "Submitted"}
              </Text>
            </View>
            <Text style={styles.submittedDate}>Submitted: {app.submittedAt}</Text>
          </View>

          <Text style={styles.cardDesc}>
            {isRejected
              ? "Your application was not approved. You may review your details and submit a new application if allowed."
              : "Your scholarship application is currently in progress. Please wait for further updates."}
          </Text>

          {/* Stepper */}
          <View style={styles.stepperContainer}>
            {APPLICATION_STEPS.map((step, i) => {
              const isCompleted = i <= safeStepIndex;
              const isCurrent = i === safeStepIndex;
              return (
                <View key={step.key} style={styles.stepItem}>
                  <View style={[styles.stepCircle, isCompleted ? styles.stepCircleActive : {}]}>
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    ) : (
                      <Text style={styles.stepCircleTextInactive}>{i + 1}</Text>
                    )}
                  </View>
                  <Text style={[styles.stepLabel, isCurrent ? styles.stepLabelCurrent : isCompleted ? styles.stepLabelActive : {}]}>
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressWidth}%`, backgroundColor: isRejected ? "#ef4444" : "#5b5f97" }]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Application History</Text>
            <Text style={styles.subtitle}>Track your submissions</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("Notifications")} style={styles.bellBtn} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={24} color="#5b6095" />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={{ marginTop: 60, alignItems: "center" }}>
            <Text style={{ color: "#8a94b5", fontSize: 16 }}>Loading applications...</Text>
          </View>
        ) : error ? (
          <View style={{ marginTop: 60, alignItems: "center" }}>
            <Text style={{ color: "#d91e1e", fontSize: 16, marginBottom: 12 }}>{error}</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => loadApplications()}>
              <Text style={styles.browseBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : mappedApplications.length === 0 ? (
          renderEmpty()
        ) : (
          <View>
            <Text style={styles.sectionTitleHeader}>My Applications</Text>
            {mappedApplications.map((app) => renderCard(app))}
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eff2f9" },
  header: { paddingBottom: 24, paddingHorizontal: 24, backgroundColor: "#fff", borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4, marginBottom: 10, zIndex: 10 },
  headerTop: { flexDirection: "row", alignItems: "center" },
  headerTextContainer: { flex: 1 },
  title: { fontSize: 22, fontWeight: "900", color: "#4f5ec4", letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: "#7a82a0", marginTop: 2, fontWeight: "500" },
  bellBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#f5f7fc", justifyContent: "center", alignItems: "center" },
  content: { padding: 20, paddingBottom: 120 },
  sectionTitleHeader: { fontSize: 18, fontWeight: "900", color: "#4f568e", marginBottom: 16 },

  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 80 },
  emptyIconBox: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#f0eef9", justifyContent: "center", alignItems: "center", marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: "#1a1a2e", marginBottom: 8 },
  emptySubText: { fontSize: 14, color: "#6e7798", textAlign: "center", lineHeight: 22, paddingHorizontal: 20, marginBottom: 32 },
  browseBtn: { backgroundColor: "#5b5f97", paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  browseBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  card: { backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  cardHeader: { minHeight: 120, backgroundColor: "#25364f" },
  cardHeaderOverlay: { flex: 1, backgroundColor: "rgba(91, 95, 151, 0.5)", padding: 24, justifyContent: "flex-end" },
  tagWrap: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
  tagText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  cardTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },

  cardBody: { padding: 24 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  statusBadge: { backgroundColor: "#eef0fb", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusBadgeText: { color: "#4f568e", fontSize: 12, fontWeight: "800" },
  submittedDate: { fontSize: 12, color: "#8a94b5", fontWeight: "600" },
  cardDesc: { color: "#6b7280", fontSize: 14, lineHeight: 22, marginBottom: 24 },

  stepperContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16, paddingHorizontal: 8 },
  stepItem: { alignItems: "center", flex: 1 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  stepCircleActive: { backgroundColor: "#5b5f97" },
  stepCircleTextInactive: { color: "#9ca3af", fontSize: 13, fontWeight: "bold" },
  stepLabel: { fontSize: 12, fontWeight: "600", color: "#9ca3af", textAlign: "center" },
  stepLabelCurrent: { color: "#5b5f97" },
  stepLabelActive: { color: "#3d4076" },

  progressBarTrack: { height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 4 },
});
