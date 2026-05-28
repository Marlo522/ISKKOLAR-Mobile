import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ImageBackground, RefreshControl, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { useIsFocused } from "@react-navigation/native";
import { getApplicationSettings } from "../services/settingsService";
import ApplicationsClosedGuard from "../components/ApplicationsClosedGuard";

const programs = [
  {
    title: "TERTIARY SCHOLARSHIP\nPROGRAM",
    amount: "Up to P30,000/year",
    metas: ["GWA: 85% and above", "Full Academic Year"],
    description: "Support for Filipino students in public state universities to empower future leaders across the regions.",
    image: require("../../assets/images/tertiary.jpg"),
  },
  {
    title: "KKFI EMPLOYEE-CHILD\nEDUCATION GRANT",
    amount: "Up to P30,000/year",
    metas: ["Staff and Family", "Tuition Support"],
    description: "Educational support for regular KKFI employees, a slot for personal professional growth or a relative's studies.",
    image: require("../../assets/images/employee_child.jpg"),
  },
  {
    title: "VOCATIONAL AND\nTECHNOLOGY SCHOLARSHIP",
    amount: "Up to P65,000",
    metas: ["Certification", "Skill Development"],
    description: "Practical skills-based scholarship for Filipinos, to fast-track employment and sustainable livelihoods.",
    image: require("../../assets/images/vocational.jpg"),
  },
];

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const [refreshing, setRefreshing] = useState(false);

  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(programs.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!isFocused) return;

    const checkSettings = async () => {
      setLoading(true);
      const settings = await getApplicationSettings();
      const open = settings.is_open && !settings.is_limit_reached;
      setIsOpen(open);
      setLoading(false);
    };
    checkSettings();
  }, [isFocused]);

  const runEntryAnimations = useCallback(() => {
    if (loading || !isOpen) return;

    headerAnim.setValue(0);
    cardsAnim.forEach(anim => anim.setValue(0));

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
  }, [headerAnim, cardsAnim, loading, isOpen]);

  const handleRefresh = async () => {
    setLoading(true);
    const settings = await getApplicationSettings();
    const open = settings.is_open && !settings.is_limit_reached;
    setIsOpen(open);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f6f8fb" }}>
        <ActivityIndicator size="large" color="#5b5f97" />
      </View>
    );
  }

  if (!isOpen) {
    return (
      <ApplicationsClosedGuard onBack={handleRefresh} />
    );
  }

  useEffect(() => {
    runEntryAnimations();
  }, [runEntryAnimations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Re-trigger entry animations for visual feedback
    runEntryAnimations();
    // Brief delay so the spinner is visible
    await new Promise(resolve => setTimeout(resolve, 600));
    setRefreshing(false);
  }, [runEntryAnimations]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.headerRow, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }], paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.userSubtitle}>Hello,</Text>
          <Text style={styles.userTitle}>{user?.firstName || user?.first_name || (user?.name ? user.name.split(' ')[0] : "User")}</Text>
        </View>
        <TouchableOpacity style={styles.iconBubble} activeOpacity={0.8} onPress={() => navigation.navigate("Notifications")}>
          <Ionicons name="notifications-outline" size={24} color="#1d2e57" />
          <View style={styles.notifyDot} />
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.sectionTitle}>Programs</Text>
      <ScrollView contentContainerStyle={[styles.cardsContainer, { paddingBottom: 120 }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5b5f97']} tintColor="#5b5f97" />}>
        {programs.map((program, index) => (
          <Animated.View key={index} style={[styles.card, { opacity: cardsAnim[index], transform: [{ translateY: cardsAnim[index].interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] }]}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                const routeMap = ["tertiary", "employeeChild", "vocational"];
                navigation.navigate("ProgramDetail", { program: routeMap[index] });
              }}
            >
              <ImageBackground source={program.image} style={styles.cardImage} imageStyle={styles.cardImageStyle}>
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageTitle}>{program.title}</Text>
                </View>
              </ImageBackground>

              <View style={styles.cardBody}>
                <View style={styles.amountRow}>
                  <Text style={styles.cardAmount}>{program.amount}</Text>
                  <Text style={styles.metaRight}>{program.metas[1]}</Text>
                </View>
                
                <Text style={styles.metaLeft}>{program.metas[0]}</Text>
                
                <Text style={styles.cardDescription}>{program.description}</Text>
              </View>
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
  cardsContainer: { paddingHorizontal: 18, paddingBottom: 20 },
  card: { backgroundColor: "#fff", borderRadius: 12, marginBottom: 22, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  cardImage: { height: 160, justifyContent: 'flex-end' },
  cardImageStyle: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(19, 27, 62, 0.45)', justifyContent: 'flex-end', padding: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  imageTitle: { color: '#fff', fontSize: 22, fontWeight: '900', lineHeight: 28 },
  cardBody: { padding: 18 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardAmount: { fontSize: 17, fontWeight: '900', color: '#131b3e' },
  metaRight: { fontSize: 13, color: '#9ea6bd', fontWeight: '500' },
  metaLeft: { fontSize: 13, color: '#6e7798', marginBottom: 16, fontWeight: '500' },
  cardDescription: { fontSize: 14, color: '#6e7798', lineHeight: 22 },
});