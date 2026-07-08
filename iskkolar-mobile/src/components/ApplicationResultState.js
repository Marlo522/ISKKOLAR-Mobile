import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function ApplicationResultState({
  onViewApplications,
  viewApplicationsText = "View My Applications",
}) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Purple Top Header */}
      <LinearGradient
        colors={["#3d4076", "#5b5f97"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBackground}
      >
        <View style={styles.logoCapsule}>
          <Image
            source={require("../../assets/images/logo_symbol.png")}
            style={styles.capsuleLogoSymbol}
            resizeMode="contain"
          />
          <Image
            source={require("../../assets/images/logo_text.png")}
            style={styles.capsuleLogoText}
            resizeMode="contain"
          />
        </View>
      </LinearGradient>

      {/* Main Body with Card */}
      <View style={styles.body}>
        <View style={styles.card}>
          {/* Envelope Icon */}
          <View style={styles.iconCircle}>
            <Ionicons name="mail-open-outline" size={32} color="#5b5f97" />
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitleText}>APPLICATION SUBMITTED</Text>

          {/* Main Heading */}
          <Text style={styles.headingText}>Please check your email</Text>

          {/* Description */}
          <Text style={styles.descriptionText}>
            Your application has been submitted. Please wait for KKFI to evaluate your application. An email notification will be sent to the applicant once the review is complete.
          </Text>

          {/* CTA Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onViewApplications}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>
              {viewApplicationsText || "View My Applications"}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={16}
              color="#fff"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        </View>

        {/* Footer text below the card */}
        <Text style={styles.footerText}>
          The email notification may take a few moments to arrive.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  contentContainer: {
    flexGrow: 1,
    backgroundColor: "#f8fafc",
    paddingBottom: 40,
  },
  headerBackground: {
    height: 180,
    backgroundColor: "#5b5f97",
    justifyContent: "center",
    alignItems: "center",
  },
  logoCapsule: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  capsuleLogoSymbol: {
    width: 22,
    height: 22,
    marginRight: 8,
  },
  capsuleLogoText: {
    width: 90,
    height: 18,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: -40,
    alignItems: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#f0f2fa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#5b5f97",
    letterSpacing: 2,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  headingText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 16,
    textAlign: "center",
  },
  descriptionText: {
    fontSize: 13,
    color: "#555b70",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 28,
  },
  actionBtn: {
    backgroundColor: "#5b5f97",
    borderRadius: 12,
    paddingVertical: 14,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#5b5f97",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  actionBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  footerText: {
    fontSize: 12,
    color: "#9aa0b0",
    textAlign: "center",
    marginTop: 24,
  },
});
