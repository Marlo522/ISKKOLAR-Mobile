import React, { useContext } from "react";
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";

const programs = [
  {
    title: "Tertiary Scholarship Program",
    amount: "Up to Php 30,000/year",
    metas: ["GWA: 85% and above", "Full Academic Year"],
    description: "Support for Filipino state university students to empower future leaders across the regions.",
    icon: "school",
  },
  {
    title: "KKFI Employee-Child Education Grant",
    amount: "Up to Php 30,000/year",
    metas: ["Staff and Family", "Tuition Support"],
    description: "Educational support for regular KKFI employees, a slot for personal professional growth or a relative's studies.",
    icon: "people",
  },
  {
    title: "VOCATIONAL AND TECHNOLOGY SCHOLARSHIP",
    amount: "Up to Php 65,000",
    metas: ["Skill Development", "Certification"],
    description: "Practical skills-based scholarship for Filipinos, to fast-track employment and sustainable livelihoods.",
    icon: "build",
  },
];

export default function HomeScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.userTitle}>{user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Dominic Madla"}</Text>
          <Text style={styles.userSubtitle}>Applicant</Text>
        </View>
        <View style={styles.iconBubble}>
          <Ionicons name="notifications-outline" size={22} color="#4c60d1" />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Programs</Text>
      <ScrollView contentContainerStyle={[styles.cardsContainer, { paddingBottom: 120 }]}>
        {programs.map((program, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.programIconCircle}>
                <Ionicons name={program.icon} size={18} color="#fff" />
              </View>
              <Text style={styles.openBadge}>OPEN</Text>
            </View>

            <Text style={styles.cardTitle}>{program.title}</Text>
            <Text style={styles.cardAmount}>{program.amount}</Text>

            <View style={styles.metaRow}>
              {program.metas.map((meta, idx) => (
                <View key={idx} style={styles.metaChip}>
                  <Ionicons name={idx === 0 ? "checkmark-circle" : "school"} size={14} color="#4068c8" />
                  <Text style={styles.metaText}>{meta}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.cardDescription}>{program.description}</Text>

            <TouchableOpacity style={styles.viewButton} activeOpacity={0.8} onPress={() => navigation.navigate("ProgramDetail", { program: "tertiary" })}>
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e5e8ff", padding: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  userTitle: { fontSize: 24, fontWeight: "900", color: "#1a1a1a" },
  userSubtitle: { fontSize: 14, color: "#5b5f97", marginTop: 2 },
  iconBubble: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  sectionTitle: { fontSize: 22, fontWeight: "800", color: "#1d2e57", marginBottom: 10 },
  cardsContainer: { paddingBottom: 20 },
  card: { backgroundColor: "#fff", borderRadius: 16, marginBottom: 16, overflow: "hidden", borderWidth: 1, borderColor: "#dbe0f5", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, backgroundColor: "#5562d8" },
  programIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#3248b1", justifyContent: "center", alignItems: "center" },
  openBadge: { backgroundColor: "rgba(255,255,255,0.25)", color: "#fff", fontWeight: "700", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, fontSize: 12 },
  cardTitle: { fontSize: 18, fontWeight: "800", color: "#1f2e57", marginTop: 14, marginHorizontal: 14 },
  cardAmount: { fontSize: 14, fontWeight: "700", color: "#5562d8", marginTop: 4, marginHorizontal: 14 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: 12, marginTop: 10 },
  metaChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#eef0ff", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, marginRight: 8, marginBottom: 6 },
  metaText: { marginLeft: 4, fontSize: 11, color: "#3b4f9b", fontWeight: "600" },
  cardDescription: { marginHorizontal: 14, marginTop: 10, marginBottom: 14, color: "#6873a6", fontSize: 13, lineHeight: 18 },
  viewButton: { marginHorizontal: 14, marginBottom: 16, backgroundColor: "#4d61d8", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  viewButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});