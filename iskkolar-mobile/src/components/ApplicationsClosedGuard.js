import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ApplicationsClosedGuard({ onBack, year = new Date().getFullYear() }) {
  return (
    <View style={styles.container}>
      <View style={styles.illustrationWrapper}>
        <View style={styles.outerCircle}>
          <View style={styles.innerCircle}>
            <Ionicons name="lock-closed-outline" size={40} color="#5b5f97" />
          </View>
        </View>
        <View style={styles.dotRed} />
        <View style={styles.dotPurple} />
      </View>
      <View style={styles.badge}>
        <View style={styles.badgeDot} />
        <Text style={styles.badgeText}>Applications Closed</Text>
      </View>
      <Text style={styles.title}>Applications are currently closed</Text>
      
      <Text style={styles.description}>
        The scholarship application window for the year{" "}
        <Text style={styles.highlight}>{year}</Text> is not yet open. 
        Please check back later or follow our announcements for updates on when applications will be accepted.
      </Text>
      <View style={styles.suggestionCard}>
        <Text style={styles.suggestionTitle}>What you can do now</Text>
        
        <View style={styles.suggestionRow}>
          <Text style={styles.suggestionEmoji}>🔔</Text>
          <Text style={styles.suggestionText}>
            Check the <Text style={{ fontWeight: "700" }}>Notifications</Text> tab regularly for official calendar updates.
          </Text>
        </View>
        <View style={styles.suggestionRow}>
          <Text style={styles.suggestionEmoji}>👤</Text>
          <Text style={styles.suggestionText}>
            Keep your <Text style={{ fontWeight: "700" }}>Account Profile</Text> fully updated so you are ready when registration opens.
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={onBack}>
        <Text style={styles.backBtnText}>Return to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8fb",
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  illustrationWrapper: {
    position: "relative",
    marginBottom: 28,
  },
  outerCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "rgba(91, 95, 151, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(91, 95, 151, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  dotRed: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(233, 78, 78, 0.2)",
  },
  dotPurple: {
    position: "absolute",
    bottom: -4,
    left: -12,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(91, 95, 151, 0.2)",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffebee",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    marginBottom: 16,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e94e4e",
    marginRight: 6,
  },
  badgeText: {
    color: "#c62828",
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#131b3e",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    color: "#6e7798",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 12,
    marginBottom: 28,
  },
  highlight: {
    fontWeight: "700",
    color: "#5b5f97",
  },
  suggestionCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 32,
    shadowColor: "#1d2e57",
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  suggestionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#5b5f97",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  suggestionEmoji: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 1,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: "#4a4f75",
    lineHeight: 18,
  },
  backBtn: {
    width: "100%",
    backgroundColor: "#5b5f97",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#5b5f97",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  backBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
