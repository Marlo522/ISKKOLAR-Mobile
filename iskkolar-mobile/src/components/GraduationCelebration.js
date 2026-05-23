import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function GraduationCelebration({ firstName, onBack }) {
  const displayName = firstName ? firstName.trim() : "Scholar";

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Floating Geometric Particles */}
        {/* Diamond 1 (Top/Mid Left) */}
        <View style={[styles.shape, styles.diamond, { top: "15%", left: "10%", transform: [{ rotate: "25deg" }] }]} />

        {/* Small Dot (Far Left) */}
        <View style={[styles.shape, styles.dot, { top: "42%", left: "7%", width: 8, height: 8, backgroundColor: "#c5cbe8" }]} />

        {/* Triangle 1 (Top Right) */}
        <View style={[styles.shape, styles.triangleDown, { top: "12%", right: "22%" }]} />

        {/* Medium Circle (Mid Right) */}
        <View style={[styles.shape, styles.dot, { top: "30%", right: "10%" }]} />

        {/* Triangle 2 (Bottom Left) */}
        <View style={[styles.shape, styles.triangleRight, { bottom: "25%", left: "15%" }]} />

        {/* Diamond 2 (Bottom Right) */}
        <View style={[styles.shape, styles.diamond, { bottom: "18%", right: "10%", transform: [{ rotate: "15deg" }] }]} />

        {/* Content Container */}
        <View style={styles.contentWrap}>
          {/* Graduation Cap Badge */}
          <View style={styles.capOuterCircle}>
            <View style={styles.capInnerCircle}>
              <Ionicons name="school" size={44} color="#45388a" />
            </View>
          </View>

          {/* Heading */}
          <Text style={styles.heading}>Congratulations, {displayName}!</Text>

          {/* Descriptive Text */}
          <Text style={styles.description}>
            You have successfully completed all your academic requirements and officially graduated!
            We are incredibly proud of your journey, dedication, and outstanding achievements as an Iskkolar.
          </Text>

          {/* Pill Badges Row */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name="sparkles" size={13} color="#5c6bb2" style={styles.badgeIcon} />
              <Text style={styles.badgeText}>Academic Excellence</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="sparkles" size={13} color="#5c6bb2" style={styles.badgeIcon} />
              <Text style={styles.badgeText}>Compliance Completed</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="sparkles" size={13} color="#5c6bb2" style={styles.badgeIcon} />
              <Text style={styles.badgeText}>Official Graduate</Text>
            </View>
          </View>


        </View>
      </View>

      {/* Return to Dashboard Button */}
      {onBack && (
        <TouchableOpacity style={styles.primaryBtn} onPress={onBack} activeOpacity={0.8}>
          <Ionicons name="home-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.primaryBtnText}>Return to Dashboard</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    width: "100%",
    paddingVertical: 32,
    paddingHorizontal: 24,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#edf0f8",
  },
  contentWrap: {
    alignItems: "center",
    zIndex: 10,
  },
  // Floating shapes
  shape: {
    position: "absolute",
    zIndex: 1,
  },
  diamond: {
    width: 12,
    height: 18,
    backgroundColor: "#8c94bf",
    borderRadius: 2,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#9ea6d0",
  },
  triangleDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 14,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#9ea6d0",
    transform: [{ rotate: "180deg" }],
  },
  triangleRight: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 14,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#d2d8f0",
    transform: [{ rotate: "90deg" }],
  },
  // Graduation Cap Badge
  capOuterCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#f2f4fd",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#7e52d8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },
  capInnerCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#7e52d8",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 1,
  },
  heading: {
    fontSize: 26,
    fontWeight: "900",
    color: "#181d36",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    color: "#546083",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  // Badges row
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f2fb",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#e3e7f7",
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    color: "#404a7b",
    fontSize: 11.5,
    fontWeight: "700",
  },
  // Primary Return Button
  primaryBtn: {
    flexDirection: "row",
    backgroundColor: "#5b5f97",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    shadowColor: "#2d3a7c",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
