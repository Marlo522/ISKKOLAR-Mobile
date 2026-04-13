import React, { useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

export default function ScholarDashboardScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const stats = [
    { title: "1st", sub: "BSIT", icon: "book-outline", iconBg: "#f4effe", iconColor: "#7e52d8" },
    { title: "--", sub: "Current GWA", icon: "checkmark-circle-outline", iconBg: "#e7f6ea", iconColor: "#39a751" },
    { title: "0", sub: "Applications Submitted", icon: "calendar-outline", iconBg: "#eefafc", iconColor: "#41b5bd" },
    { title: "1st", sub: "Current Term", icon: "book-outline", iconBg: "#f4effe", iconColor: "#7e52d8" }
  ];

  const quickLinks = [
    { title: "COR & Grade Compliance", route: "GradeCompliance", icon: "clipboard-outline", iconBg: "#e7f6ea", iconColor: "#39a751" },
    { title: "Financial Records", route: "FinancialRecords", icon: "receipt-outline", iconBg: "#fcefe9", iconColor: "#e96e5e" },
    { title: "My Profile", route: "Profile", icon: "person-outline", iconBg: "#f4effe", iconColor: "#7e52d8" },
    { title: "Activities", route: "Activities", icon: "calendar-outline", iconBg: "#eefafc", iconColor: "#41b5bd" }
  ];

  const services = [
    { title: "Scholarship Renewal", sub: "Renew for AY 2026-2027", route: "ScholarshipRenewal", icon: "sync", iconBg: "#f4effe", iconColor: "#7e52d8" },
    { title: "Transfer School", sub: "Update your school or program", route: "TransferSchool", icon: "swap-horizontal", iconBg: "#fff0f0", iconColor: "#e96e5e" },
    { title: "Board Exam/Certification Assistance", sub: "Up to P12,000 support", route: "ExamAssistance", icon: "checkmark-circle-outline", iconBg: "#eefafc", iconColor: "#41b5bd" }
  ];

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

  const fullName = [
    user?.firstName || user?.first_name,
    user?.middleName || user?.middle_name,
    user?.lastName || user?.last_name,
  ]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Scholar';

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Header Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTextContent}>
            <Text style={styles.heroGreeting}>Good day,</Text>
            <Text style={styles.heroName}>{fullName}</Text>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Active Scholar</Text>
            </View>
          </View>
          <View style={styles.heroIconWatermark}>
            <Ionicons name="school" size={100} color="rgba(255,255,255,0.15)" />
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          {stats.map((stat, idx) => (
            <View key={idx} style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: stat.iconBg }]}>
                <Ionicons name={stat.icon} size={20} color={stat.iconColor} />
              </View>
              <View style={styles.statTextCol}>
                <Text style={styles.statTitle}>{stat.title}</Text>
                <Text style={styles.statSub}>{stat.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Links */}
        <Text style={styles.sectionHeader}>Quick Links</Text>
        <View style={styles.quickLinksGrid}>
          {quickLinks.map((link, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.quickLinkCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(link.route)}
            >
              <View style={[styles.qlIconBox, { backgroundColor: link.iconBg }]}>
                <Ionicons name={link.icon} size={24} color={link.iconColor} />
              </View>
              <Text style={styles.qlTitle}>{link.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Scholar Services */}
        <Text style={styles.sectionHeader}>Scholar Services</Text>
        <View style={styles.servicesContainer}>
          {services.map((svc, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.serviceCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(svc.route)}
            >
              <View style={[styles.svcIconBox, { backgroundColor: svc.iconBg }]}>
                <Ionicons name={svc.icon} size={28} color={svc.iconColor} />
              </View>
              <View style={styles.svcTextCol}>
                <Text style={styles.svcTitle}>{svc.title}</Text>
                <Text style={styles.svcSub}>{svc.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#d4dae8" />
            </TouchableOpacity>
          ))}
        </View>

      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // Hero Banner
  heroBanner: {
    backgroundColor: '#727ab6',
    borderRadius: 16,
    padding: 24,
    paddingBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#4f5fc5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  heroTextContent: {
    flex: 1,
    zIndex: 2,
  },
  heroGreeting: {
    color: '#e2e5fc',
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  heroName: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  heroIconWatermark: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    zIndex: 1,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statCard: {
    backgroundColor: '#fff',
    width: '48%',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#edf0f8'
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statTextCol: {
    flex: 1,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
    lineHeight: 20,
  },
  statSub: {
    fontSize: 11,
    color: '#848baf',
    fontWeight: '500',
  },

  // Sections
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#343a40',
    marginBottom: 12,
    marginTop: 8,
    paddingLeft: 4,
  },

  // Quick Links
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickLinkCard: {
    backgroundColor: '#fff',
    width: '48%',
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#edf0f8'
  },
  qlIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  qlTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
  },

  // Services
  servicesContainer: {
    marginBottom: 40,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#edf0f8'
  },
  svcIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  svcTextCol: {
    flex: 1,
  },
  svcTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111',
    marginBottom: 4,
  },
  svcSub: {
    fontSize: 12,
    color: '#848baf',
    fontWeight: '500',
  }
});
