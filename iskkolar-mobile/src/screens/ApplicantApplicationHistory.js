import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Animated, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getApplicantHistory } from "../services/applicationGuardService";

const APPLICATION_STEPS = [
  { key: "under_review", label: "Under Review" },
  { key: "for_interview", label: "For Interview" },
  { key: "approved", label: "Approved" },
];

const STATUS_LABEL = {
  pending: "Under Review",
  submitted: "For Review",
  initial_passed: "Under Review",
  for_review: "Under Review",
  under_review: "Under Review",
  for_interview: "For Interview",
  approved: "Approved",
  rejected: "For Review",
};

const STATUS_BADGE_LABEL = {
  pending: "Submitted",
  submitted: "Submitted",
  initial_passed: "For Review",
  for_review: "For Review",
  under_review: "Under Review",
  for_interview: "For Interview",
  approved: "Approved",
  rejected: "Rejected",
};

const PROGRAM_META = {
  tertiary: {
    tag: "Tertiary Program",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop",
    title: "Tertiary Scholarship",
  },
  vocational: {
    tag: "Vocational Program",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
    title: "Vocational and Technology Scholarship",
  },
  child_designation: {
    tag: "KKFI Staff Program",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200&auto=format&fit=crop",
    title: "Child Designation Grant",
  },
  staff_advancement: {
    tag: "KKFI Staff Program",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200&auto=format&fit=crop",
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

const normalizeApplicationStatus = (status) => {
  return STATUS_LABEL[status] || "submitted";
};

const ApplicationCard = ({ application }) => {
  const isRejected = application.rawStatus === "rejected";
  const normalizedStatus = normalizeApplicationStatus(application.rawStatus);
  const currentStepIndex = APPLICATION_STEPS.findIndex((s) => s.key === normalizedStatus || s.label === normalizedStatus);
  const safeStepIndex = currentStepIndex >= 0 ? currentStepIndex : 0;
  const progressPercent = ((safeStepIndex + 1) / APPLICATION_STEPS.length) * 100;

  return (
    <View style={styles.card}>
      {/* Card Header with Image */}
      <ImageBackground 
        source={{ uri: application.image }} 
        style={styles.cardHeader}
        imageStyle={{ borderRadius: 16 }}
      >
        <View style={styles.cardHeaderOverlay}>
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{application.tag}</Text>
          </View>
          <Text style={styles.cardTitle}>{application.title}</Text>
        </View>
      </ImageBackground>

      {/* Card Body */}
      <View style={styles.cardBody}>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, isRejected && styles.rejectedBadge]}>
            <Text style={[styles.statusBadgeText, isRejected && styles.rejectedBadgeText]}>
              {STATUS_BADGE_LABEL[application.rawStatus] || "Submitted"}
            </Text>
          </View>
          <Text style={styles.dateText}>Submitted: {application.submittedAt}</Text>
        </View>

        <Text style={styles.description}>
          {isRejected
            ? "Your application was not approved. You may review your details and submit a new application if allowed."
            : "Your scholarship application is currently in progress. Please wait for further updates."}
        </Text>

        {/* Status Tracker */}
        <View style={styles.trackerContainer}>
          <View style={styles.stepsRow}>
            {APPLICATION_STEPS.map((step, i) => {
              const isCompleted = i <= safeStepIndex;
              const isCurrent = i === safeStepIndex;
              return (
                <View key={step.key} style={styles.stepItem}>
                  <View style={[styles.stepCircle, isCompleted ? styles.completedCircle : styles.pendingCircle]}>
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    ) : (
                      <Text style={styles.stepNumber}>{i + 1}</Text>
                    )}
                  </View>
                  <Text style={[styles.stepLabel, isCurrent ? styles.currentStepLabel : isCompleted ? styles.completedStepLabel : styles.pendingStepLabel]}>
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${progressPercent}%` },
                isRejected && { backgroundColor: "#ef4444" }
              ]} 
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export default function ApplicantApplicationHistory({ navigation }) {
  const insets = useSafeAreaInsets();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getApplicantHistory();
      setApplications(data);
    } catch (err) {
      console.error("Failed to load applications:", err);
      setError(err?.message || "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const mappedApplications = useMemo(() => {
    return applications.map((app) => {
      const type = app.application_type || app.type || 'tertiary';
      const meta = PROGRAM_META[type] || PROGRAM_META.tertiary;
      
      let title = meta.title;
      if (type === 'tertiary' && app.tertiary_application_details) {
        const details = Array.isArray(app.tertiary_application_details) ? app.tertiary_application_details[0] : app.tertiary_application_details;
        title = details?.scholarship_type || title;
      } else if (type === 'vocational' && app.vocational_application_details) {
        const details = Array.isArray(app.vocational_application_details) ? app.vocational_application_details[0] : app.vocational_application_details;
        title = details?.scholarship_type || title;
      }

      return {
        id: app.id,
        rawStatus: app.status || "submitted",
        title: title,
        tag: meta.tag,
        image: meta.image,
        submittedAt: formatDate(app.submitted_at || app.created_at),
      };
    });
  }, [applications]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#5b5f97" />
        <Text style={styles.loadingText}>Loading your applications...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Applications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={60} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadApplications}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : mappedApplications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="document-text-outline" size={44} color="#5b5f97" />
            </View>
            <Text style={styles.emptyTitle}>Nothing to see here... Yet!</Text>
            <Text style={styles.emptyDesc}>
              You haven't submitted a scholarship application. Start your application now to be considered.
            </Text>
            <TouchableOpacity 
              style={styles.browseBtn}
              onPress={() => navigation.navigate("HomeScreen")}
            >
              <Text style={styles.browseBtnText}>Browse Scholarships</Text>
            </TouchableOpacity>
          </View>
        ) : (
          mappedApplications.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fc" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#f0f2fb", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#1a1a2e" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  card: { backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 15, shadowOffset: { width: 0, height: 10 }, elevation: 5 },
  cardHeader: { height: 140, justifyContent: "flex-end" },
  cardHeaderOverlay: { padding: 16, backgroundColor: "rgba(0,0,0,0.3)", height: "100%", justifyContent: "flex-end" },
  tagBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, marginBottom: 8 },
  tagText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  cardTitle: { color: "#fff", fontSize: 20, fontWeight: "900" },
  
  cardBody: { padding: 20 },
  statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "#eef0fb", borderRadius: 20 },
  statusBadgeText: { fontSize: 12, fontWeight: "700", color: "#4f568e" },
  rejectedBadge: { backgroundColor: "#fee2e2" },
  rejectedBadgeText: { color: "#b91c1c" },
  dateText: { fontSize: 12, color: "#6b7280" },
  
  description: { fontSize: 14, color: "#6b7280", lineHeight: 20, marginBottom: 20 },
  
  trackerContainer: { marginTop: 10 },
  stepsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  stepItem: { alignItems: "center", flex: 1 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 6 },
  completedCircle: { backgroundColor: "#5b5f97" },
  pendingCircle: { backgroundColor: "#e5e7eb" },
  stepNumber: { fontSize: 12, fontWeight: "800", color: "#9ca3af" },
  stepLabel: { fontSize: 10, fontWeight: "700", textAlign: "center" },
  completedStepLabel: { color: "#3d4076" },
  currentStepLabel: { color: "#5b5f97" },
  pendingStepLabel: { color: "#9ca3af" },
  
  progressBarBg: { height: 6, backgroundColor: "#e5e7eb", borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: "#5b5f97" },
  
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8f9fc" },
  loadingText: { marginTop: 12, fontSize: 15, color: "#6b7280", fontWeight: "600" },
  
  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#f0eef9", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: "900", color: "#1a1a2e", marginBottom: 10 },
  emptyDesc: { fontSize: 14, color: "#6b7280", textAlign: "center", paddingHorizontal: 40, lineHeight: 22, marginBottom: 30 },
  browseBtn: { paddingVertical: 14, paddingHorizontal: 32, backgroundColor: "#5b5f97", borderRadius: 14 },
  browseBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  
  errorContainer: { alignItems: "center", marginTop: 60 },
  errorText: { fontSize: 15, color: "#ef4444", fontWeight: "600", marginTop: 16, textAlign: "center" },
  retryBtn: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 24, backgroundColor: "#5b5f97", borderRadius: 10 },
  retryBtnText: { color: "#fff", fontWeight: "700" },
});
