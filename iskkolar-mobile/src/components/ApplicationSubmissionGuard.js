import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Removed unused helper functions

// Removed unused styles

export default function ApplicationSubmissionGuard({
  isChecking,
  ongoingApplication,
  title = "Application Already Submitted",
  cardTitle,
  message,
  secondaryMessage,
  onBack,
  onViewApplications,
}) {
  if (isChecking) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color="#5b5f97" />
        <Text style={styles.loadingText}>Checking your applications...</Text>
      </View>
    );
  }

  const hasCustomCopy = Boolean(message || secondaryMessage || cardTitle);

  if (!ongoingApplication && !hasCustomCopy) return null;

  const isExamAssistance = ongoingApplication?.application_type === "exam_assistance";
  const normalizedStatus = String(ongoingApplication?.status || "").toLowerCase();
  const isInterviewStage = normalizedStatus === "for_interview" || ongoingApplication?.guard_reason === "active_stage";
  const isRejectedCooldown =
    ongoingApplication?.guard_reason === "rejected_until_next_year" ||
    ongoingApplication?.guard_reason === "rejected_this_year" ||
    normalizedStatus === "rejected" ||
    normalizedStatus === "disapproved" ||
    normalizedStatus === "non_compliant";
  const examAssistanceMessage =
    "You have already submitted an Exam Assistance application. This is a one-time support program and only one application is allowed per user.";
  const examAssistanceSecondaryMessage =
    "You can view the details and AI feedback of your existing application in the Application tab.";
  const reapplyYear = ongoingApplication?.reapply_year || ongoingApplication?.reapplyYear || (new Date().getFullYear() + 1);
  const rejectedCardMessage =
    `Your recent application was rejected. You may apply again in ${reapplyYear}.`;
  const rejectedFooterMessage =
    "Please wait until the next application cycle before submitting again.";
  const interviewCardMessage =
    "You already have a scholarship application in For Interview status.";
  const interviewFooterMessage =
    "You cannot submit a new application at this time. Please wait until your application is processed.";

  const statusLabel = isExamAssistance
    ? "Exam Assistance Lock"
    : isRejectedCooldown
      ? "Reapplication Temporarily Locked"
      : isInterviewStage
        ? "Active Interview Lock"
        : "Application Access Restricted";

  const headline = isExamAssistance
    ? "Application Already Submitted"
    : isRejectedCooldown
      ? "Application Already Submitted"
      : isInterviewStage
        ? "Application Already Submitted"
        : title;

  const bodyTitle = isExamAssistance
    ? "You have an ongoing application"
    : isRejectedCooldown
      ? "You cannot apply again this year"
      : isInterviewStage
        ? "You have an active interview-stage application"
        : cardTitle || (hasCustomCopy ? "Application access is restricted" : "You have an ongoing application");

  const bodyMessage = isExamAssistance
    ? examAssistanceMessage
    : isRejectedCooldown
      ? rejectedCardMessage
      : isInterviewStage
        ? interviewCardMessage
        : message;

  const footerMessage = isExamAssistance
    ? examAssistanceSecondaryMessage
    : isRejectedCooldown
      ? rejectedFooterMessage
      : isInterviewStage
        ? interviewFooterMessage
        : secondaryMessage;

  return (
    <View style={styles.root}>
      <View style={styles.iconWrap}>
        <View style={styles.iconBadge}>
          <Ionicons name="alert-circle-outline" size={34} color="#d28f1f" />
        </View>
      </View>

      <Text style={styles.title}>{headline}</Text>
      <View style={styles.statusPill}>
        <Text style={styles.statusPillText}>{statusLabel}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{bodyTitle}</Text>
        <Text style={styles.cardText}>{bodyMessage}</Text>
        {footerMessage ? <Text style={[styles.cardText, styles.cardTextSecondary]}>{footerMessage}</Text> : null}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onBack}>
        <Text style={styles.primaryBtnText}>Return to Dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={onViewApplications}>
        <Text style={styles.secondaryBtnText}>View My Applications</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f6f7ff",
  },
  loadingText: {
    marginTop: 12,
    color: "#5b5f97",
    fontWeight: "600",
  },
  root: {
    flex: 1,
    backgroundColor: "#f6f7ff",
    paddingHorizontal: 18,
    paddingVertical: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrap: { alignItems: "center", marginBottom: 12 },
  iconBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#fff3d6",
    borderWidth: 1,
    borderColor: "#f6d59b",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "900",
    color: "#3d4076",
    marginBottom: 10,
  },
  statusPill: {
    alignSelf: "center",
    backgroundColor: "#fff0cf",
    borderWidth: 1,
    borderColor: "#f0d39a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 18,
  },
  statusPillText: {
    color: "#8b5a11",
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    borderWidth: 1,
    borderColor: "#f1d59d",
    backgroundColor: "#fff6df",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  cardTitle: {
    color: "#815b0b",
    fontWeight: "800",
    marginBottom: 8,
    fontSize: 14,
  },
  cardText: {
    color: "#7b5a20",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  cardTextSecondary: {
    marginTop: 8,
  },
  primaryBtn: {
    backgroundColor: "#5b5f97",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
    maxWidth: 520,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },
  secondaryBtn: {
    backgroundColor: "#dde0ef",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    width: "100%",
    maxWidth: 520,
  },
  secondaryBtnText: { color: "#40466f", fontWeight: "800" },
});