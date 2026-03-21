import React from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const eligibility = [
  "Filipino Citizen",
  "Incoming or Current College Student",
  "GWA 85% or 2.25 Above",
  "Public State University",
  "Family income should not exceed Thirty Thousand Pesos",
];

const forms = [
  { label: "Certificate of Indigency Form", button: "Download Form" },
  { label: "Recommendation Letter Form", button: "Download Form" },
  { label: "Essay Template", button: "Download Template" },
];

export default function ProgramDetailScreen({ navigation, route }) {
  const program = route.params?.program || "tertiary";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#4c60d1" />
        </TouchableOpacity>
        <Text style={styles.title}>Tertiary Scholarship Program</Text>
        <TouchableOpacity style={styles.bellBtn}>
          <Ionicons name="notifications-outline" size={22} color="#4c60d1" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={styles.sectionTitle}>KKFI Tertiary Program</Text>

        <View style={styles.card}>
          <View style={styles.cardIndicator}>
            <Ionicons name="information-circle" size={18} color="#4754c5" />
            <Text style={styles.cardIndicatorTitle}>BACKGROUND</Text>
          </View>
          <Text style={styles.cardText}>
            Supporting students across the Philippines to overcome financial barriers and reach higher education in public state universities.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardIndicator}>
            <Ionicons name="clipboard" size={18} color="#4754c5" />
            <Text style={styles.cardIndicatorTitle}>ELIGIBILITY</Text>
          </View>
          {eligibility.map((item, index) => {
            const iconMap = ["flag", "school", "ribbon", "business", "cash"];
            return (
              <View key={index} style={styles.listItem}>
                <Ionicons name={iconMap[index] || "checkmark-circle"} size={18} color="#4c60d1" style={styles.bullet} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.subTitle}>HOW TO APPLY</Text>
          <View style={styles.timeline}>
            {[
              "Download Required Forms",
              "Fill Out & Have Forms Signed",
              "Submit Application Online",
              "Wait for Review",
            ].map((step, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineIconRow}>
                  <View style={styles.stepCircle}><Text style={styles.stepNumber}>{index + 1}</Text></View>
                  {index < 3 && <View style={styles.stepLine} />}
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.subTitle}>DOWNLOAD FORMS</Text>
          {forms.map((item, index) => (
            <View key={index} style={styles.formRow}>
              <Text style={styles.formLabel}>{item.label}</Text>
              <TouchableOpacity style={styles.downloadBtn}>
                <Text style={styles.downloadBtnText}>{item.button}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.applyBtn} onPress={() => navigation.navigate("ProgramApply") }>
          <Text style={styles.applyBtnText}>Apply Now!</Text>
          <Text style={styles.applySub}>Make sure you've downloaded the forms first</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f5ff" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 16, paddingBottom: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderColor: "#ddd" },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  bellBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "900", color: "#4f5fc5", flex: 1, textAlign: "center" },
  content: { padding: 16 },
  sectionTitle: { color: "#1a1f55", fontWeight: "800", fontSize: 16, marginBottom: 12 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#e4e8f8", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  cardIndicator: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  cardIndicatorTitle: { marginLeft: 8, fontSize: 13, fontWeight: "800", color: "#3c4ea4" },
  cardText: { color: "#4a4f75", lineHeight: 20, fontSize: 14 },
  subTitle: { marginBottom: 12, color: "#3b4f9c", fontWeight: "800", fontSize: 14 },
  listItem: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  bullet: { marginRight: 8, marginTop: 4 },
  listText: { color: "#475199", fontSize: 13 },
  timeline: { marginTop: 4 },
  timelineItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  timelineIconRow: { width: 34, alignItems: "center" },
  stepCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#4f5fc5", justifyContent: "center", alignItems: "center", marginBottom: 4 },
  stepLine: { width: 2, flex: 1, backgroundColor: "#d4dae3", marginTop: 2 },
  stepNumber: { color: "#fff", fontSize: 12, fontWeight: "700" },
  stepText: { color: "#333e8f", fontSize: 13, flex: 1, marginTop: 2 },
  formRow: { marginBottom: 10 },
  formLabel: { color: "#2a346f", fontSize: 13, marginBottom: 6 },
  downloadBtn: { backgroundColor: "#4f5fc5", borderRadius: 10, paddingVertical: 9, alignItems: "center" },
  downloadBtnText: { color: "#fff", fontWeight: "700" },
  applyBtn: { marginTop: 6, borderRadius: 14, backgroundColor: "#4f5fc5", paddingVertical: 14, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  applyBtnText: { color: "#fff", fontSize: 16, fontWeight: "900" },
  applySub: { color: "#e4e8ff", fontSize: 12, marginTop: 4 }
});