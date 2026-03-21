import React, { useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, ScrollView } from "react-native";
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

const notifList = [
  {
    title: "Welcome to iSKKOLAR Portal",
    message: "Thank you for registering! Start your scholarship application journey today by exploring our available programs.",
    date: "Jan 28, 2026, 10:30 AM",
  },
  {
    title: "New Scholarship Opening",
    message: "KKFI now accepts applications for Vocational & Technology Scholarship. Submit before April 30.",
    date: "Mar 15, 2026, 8:00 AM",
  },
];

export default function ApplicationScreen() {
  const [showNotif, setShowNotif] = useState(false);
  const hasOngoing = ongoingApps.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Application History</Text>
        <TouchableOpacity onPress={() => setShowNotif(true)} style={styles.bellButton}>
          <Ionicons name="notifications-outline" size={22} color="#4a4f9f" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Ongoing Application</Text>

      {hasOngoing ? (
        ongoingApps.map((app, idx) => (
          <View key={idx} style={styles.appCard}>
            <View style={styles.cardRowTop}>
              <Text style={styles.appProgram}>{app.program}</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>{app.status}</Text>
              </View>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailGroup}>
                <Text style={styles.label}>Scholar Type</Text>
                <Text style={styles.value}>{app.scholarType}</Text>
                <Text style={styles.label}>Pre-Screening Status</Text>
                <Text style={styles.value}>{app.preScreening}</Text>
              </View>
              <View style={styles.detailGroup}>
                <Text style={styles.label}>Application Date</Text>
                <Text style={styles.value}>{app.appDate}</Text>
                <Text style={styles.label}>Fund type</Text>
                <Text style={styles.value}>{app.fundType}</Text>
              </View>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No ongoing application yet.</Text>
        </View>
      )}

      <Modal visible={showNotif} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <Pressable onPress={() => setShowNotif(false)} style={styles.closeButton}>
                <Ionicons name="close" size={18} color="#fff" />
              </Pressable>
            </View>
            <ScrollView style={styles.notificationList}>
              {notifList.map((item, i) => (
                <View key={i} style={styles.notificationCard}>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  <Text style={styles.notificationMessage}>{item.message}</Text>
                  <Text style={styles.notificationDate}>{item.date}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f5ff", paddingTop: 16, paddingHorizontal: 16 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  pageTitle: { fontSize: 24, fontWeight: "800", color: "#3a3f8e" },
  bellButton: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#1f2f72", marginBottom: 12 },
  appCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 14, borderColor: "#e1e5f7", borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 7, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  cardRowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  appProgram: { fontSize: 18, fontWeight: "800", color: "#202659", flex: 1, marginRight: 12 },
  pendingBadge: { backgroundColor: "#ffe291", borderRadius: 12, paddingVertical: 5, paddingHorizontal: 12 },
  pendingText: { color: "#7e6500", fontWeight: "700", fontSize: 12 },
  detailsGrid: { flexDirection: "row", justifyContent: "space-between" },
  detailGroup: { width: "48%" },
  label: { color: "#6a6f91", fontWeight: "700", fontSize: 12 },
  value: { color: "#202659", fontSize: 14, marginBottom: 8 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 40 },
  emptyText: { color: "#7f84b6", fontSize: 16, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderColor: "#e5e5ee", backgroundColor: "#5b5f97" },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#3f4ca5", justifyContent: "center", alignItems: "center" },
  notificationList: { padding: 16 },
  notificationCard: { backgroundColor: "#f7f8ff", borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#e1e4f7" },
  notificationTitle: { fontWeight: "800", color: "#1f2f86", marginBottom: 4 },
  notificationMessage: { fontSize: 13, color: "#5c628c" },
  notificationDate: { marginTop: 8, fontSize: 11, color: "#8f94b8" },
});
