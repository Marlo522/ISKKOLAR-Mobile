import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ongoingApps = [
  {
    program: "Tertiary Scholarship Program",
    scholarType: "Manila Scholars",
    appDate: "March 1, 2026",
    preScreening: "Passed",
    fundType: "KKFI Funded",
    status: "Pending",
  },
];

export default function ApplicationScreen({ navigation }) {
  const hasOngoing = ongoingApps.length > 0;

  // Mount animation
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    slideAnim.setValue(20);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
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
      >
        <View style={styles.sectionTitleHeaderBox}>
          <Text style={styles.sectionTitleHeader}>Ongoing Application</Text>
        </View>

        {hasOngoing ? (
          ongoingApps.map((app, idx) => (
            <View key={idx} style={styles.appCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.txIconBox}>
                  <Ionicons name="document-text" size={28} color="#2cae57" />
                </View>
                <View style={styles.txHeaderTextCol}>
                  <Text style={styles.appProgram}>{app.program}</Text>
                  <Text style={styles.txHeaderSub}>View tracking details below</Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.badgeRow}>
                <Text style={styles.badgeLabel}>Status:</Text>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>{app.status}</Text>
                </View>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Scholar Type</Text>
                  <Text style={styles.value}>{app.scholarType}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Pre-Screening</Text>
                  <Text style={styles.valueHighlight}>{app.preScreening}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Applied On</Text>
                  <Text style={styles.value}>{app.appDate}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Fund Type</Text>
                  <Text style={styles.value}>{app.fundType}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#ccd1ed" style={{ marginBottom: 16 }} />
            <Text style={styles.emptyText}>No ongoing application yet.</Text>
            <Text style={styles.emptySubText}>Explore available scholarship programs.</Text>
          </View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fc" },
  header: { paddingTop: 16, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#dbe2f6" },
  headerTop: { flexDirection: "row", alignItems: "center" },
  headerTextContainer: { flex: 1 },
  title: { fontSize: 22, fontWeight: "900", color: "#4f5ec4", letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: "#7a82a0", marginTop: 2, fontWeight: "500" },
  bellBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#e4e8f6", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  content: { padding: 20, paddingBottom: 80 },
  sectionTitleHeaderBox: { marginBottom: 16 },
  sectionTitleHeader: { fontSize: 18, fontWeight: "900", color: "#111" },
  appCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2, borderWidth: 1, borderColor: "#e4e8f6" },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  txIconBox: { backgroundColor: "#daf3e1", width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 12 },
  txHeaderTextCol: { flex: 1 },
  appProgram: { fontSize: 16, fontWeight: "900", color: "#111", lineHeight: 22 },
  txHeaderSub: { fontSize: 12, fontWeight: "600", color: "#7a82a0", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#e4e8f6", marginBottom: 16 },
  badgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  badgeLabel: { fontSize: 13, fontWeight: "800", color: "#8a94b5" },
  pendingBadge: { backgroundColor: "#ffa7a7", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  pendingText: { color: "#d91e1e", fontSize: 11, fontWeight: "800" },
  detailsGrid: { backgroundColor: "#fbfbff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#eff1f8" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  label: { color: "#7a82a0", fontWeight: "700", fontSize: 13 },
  value: { color: "#111", fontSize: 13, fontWeight: "800" },
  valueHighlight: { color: "#2cae57", fontSize: 13, fontWeight: "900" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 60, paddingHorizontal: 40 },
  emptyText: { color: "#344054", fontSize: 18, fontWeight: "800", marginBottom: 8 },
  emptySubText: { fontSize: 14, color: "#6e7798", textAlign: "center", lineHeight: 22, fontWeight: "500" },
});
