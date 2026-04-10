import React, { useContext, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(programs.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const animations = cardsAnim.map((anim) =>
      Animated.spring(anim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      })
    );
    Animated.stagger(150, animations).start();
  }, [headerAnim, cardsAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.headerRow, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }], paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.userSubtitle}>Hello,</Text>
          <Text style={styles.userTitle}>Dominic</Text>
        </View>
        <TouchableOpacity style={styles.iconBubble} activeOpacity={0.8} onPress={() => navigation.navigate("Notifications")}>
          <Ionicons name="notifications-outline" size={24} color="#1d2e57" />
          <View style={styles.notifyDot} />
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.sectionTitle}>Programs</Text>
      <ScrollView contentContainerStyle={[styles.cardsContainer, { paddingBottom: 120 }]}>
        {programs.map((program, index) => (
          <Animated.View key={index} style={[styles.card, { opacity: cardsAnim[index], transform: [{ translateY: cardsAnim[index].interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] }]}>
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

            <TouchableOpacity
              style={styles.viewButton}
              activeOpacity={0.8}
              onPress={() => {
                const routeMap = ["tertiary", "employeeChild", "vocational"];
                navigation.navigate("ProgramDetail", { program: routeMap[index] });
              }}
            >
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8fb" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingHorizontal: 18 },
  userSubtitle: { fontSize: 16, color: "#7a82a0", fontWeight: "600", marginBottom: 2 },
  userTitle: { fontSize: 32, fontWeight: "900", color: "#131b3e", letterSpacing: -0.5 },
  iconBubble: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4 },
  notifyDot: { position: "absolute", top: 14, right: 14, width: 10, height: 10, backgroundColor: "#e94e4e", borderRadius: 5, borderWidth: 2, borderColor: "#fff" },
  sectionTitle: { fontSize: 22, fontWeight: "800", color: "#1d2e57", marginBottom: 16, paddingHorizontal: 18 },
  cardsContainer: { paddingBottom: 20 },
  card: { backgroundColor: "#fff", borderRadius: 18, marginBottom: 22, borderWidth: 1, borderColor: "#dce1f0", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#5562d8", borderTopLeftRadius: 17, borderTopRightRadius: 17 },
  programIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#3a47b1", justifyContent: "center", alignItems: "center" },
  openBadge: { backgroundColor: "rgba(255, 255, 255, 0.25)", color: "#fff", fontWeight: "800", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, fontSize: 11 },
  cardTitle: { fontSize: 20, fontWeight: "900", color: "#131b3e", marginTop: 20, marginHorizontal: 18, lineHeight: 26 },
  cardAmount: { fontSize: 15, fontWeight: "800", color: "#2ecb9b", marginTop: 8, marginHorizontal: 18 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: 16, marginTop: 14 },
  metaChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#f5f7fa", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  metaText: { marginLeft: 6, fontSize: 11, color: "#6e7798", fontWeight: "700" },
  cardDescription: { marginHorizontal: 18, marginTop: 8, marginBottom: 20, color: "#6873a6", fontSize: 14, lineHeight: 22 },
  viewButton: { marginHorizontal: 18, marginBottom: 18, backgroundColor: "#1e2646", borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  viewButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});