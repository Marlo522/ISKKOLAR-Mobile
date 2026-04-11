import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const formatStatusLabel = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "initial_passed" || normalized === "for_review") return "Review";
  return normalized || "Unknown";
};

const formatApplicationType = (applicationType) => {
  const label = String(applicationType || "")
    .replace(/_/g, " ")
    .trim();

  if (!label) return "scholarship";

  return label
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function ApplicationSubmissionGuard({ isChecking, ongoingApplication, onBack, onViewApplications }) {
  if (isChecking) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color="#5b5f97" />
        <Text style={styles.loadingText}>Checking your applications...</Text>
      </View>
    );
  }

  if (!ongoingApplication) return null;

  return (
    <View style={styles.root}>
      <View style={styles.iconWrap}>
        <Ionicons name="alert-circle-outline" size={68} color="#d28f1f" />
      </View>

      <Text style={styles.title}>Application Already Submitted</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>You have an ongoing application</Text>
        <Text style={styles.cardText}>
          You already have a {formatApplicationType(ongoingApplication.application_type)} scholarship application in {" "}
          {formatStatusLabel(ongoingApplication.status)} status.
        </Text>
        <Text style={styles.cardText}>You cannot submit a new application at this time.</Text>
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
  },
  iconWrap: { alignItems: "center", marginBottom: 12 },
  title: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "900",
    color: "#3d4076",
    marginBottom: 18,
  },
  card: {
    borderWidth: 1,
    borderColor: "#f1d59d",
    backgroundColor: "#fff6df",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  cardTitle: {
    color: "#815b0b",
    fontWeight: "800",
    marginBottom: 8,
  },
  cardText: {
    color: "#7b5a20",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  primaryBtn: {
    backgroundColor: "#5b5f97",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },
  secondaryBtn: {
    backgroundColor: "#dde0ef",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  secondaryBtnText: { color: "#40466f", fontWeight: "800" },
});