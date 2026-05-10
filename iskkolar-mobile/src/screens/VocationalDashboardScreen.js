import React, { useEffect, useRef, useContext, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { getScholarDashboardSummary } from '../services/scholarDashboardService';

export default function VocationalDashboardScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const vocData = dashboardSummary?.vocational;
  const vocSchool = vocData?.school || user?.vocationalSchoolName || user?.schoolName || '--';
  const vocProgram = vocData?.program || user?.program || user?.scholarshipType || '--';
  const vocDuration = vocData?.duration || user?.courseDuration || '--';
  const vocEndDate = vocData?.endDate || user?.endDate || '--';
  const completionStatus = vocData?.completion?.status || null;

  const fullName = [
    user?.firstName || user?.first_name,
    user?.middleName || user?.middle_name,
    user?.lastName || user?.last_name,
  ]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Scholar';

  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadData = async () => {
    try {
      const summary = await getScholarDashboardSummary();
      setDashboardSummary(summary?.data || summary || null);
    } catch (error) {
      console.warn('Failed to load vocational dashboard data', error);
    }
  };

  useEffect(() => {
    loadData();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true })
    ]).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getCompletionPercentage = () => {
    if (completionStatus === 'approved') return 100;
    if (completionStatus === 'pending') return 50;
    return 0;
  };

  const getStatusColor = () => {
    if (completionStatus === 'approved') return '#39a751';
    if (completionStatus === 'pending') return '#f39c12';
    if (completionStatus === 'rejected') return '#e74c3c';
    return '#8b93b0';
  };

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#727ab6']} />}
      >
        <View style={styles.heroBanner}>
          <View style={styles.heroHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroLabel}>VOCATIONAL DASHBOARD</Text>
              <Text style={styles.heroName}>{fullName}</Text>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>Vocational / Certification Scholar</Text>
              </View>
            </View>

            <View style={styles.progressCircle}>
              <Text style={styles.progressText}>{getCompletionPercentage()}%</Text>
              <Text style={styles.progressLabel}>READY</Text>
            </View>
          </View>

          <View style={styles.timelineSection}>
            <Text style={styles.timelineTitle}>
              {completionStatus === 'approved' ? 'Program Completed' : 'Program timeline available after approval'}
            </Text>
            <Text style={styles.timelineSub}>
              {completionStatus ? `Submission status: ${completionStatus.toUpperCase()}` : 'Completion proof not yet submitted'}
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${getCompletionPercentage()}%`, backgroundColor: getStatusColor() }]} />
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {[
            { label: 'PROGRAM', value: vocProgram, icon: 'book' },
            { label: 'SCHOOL / CENTER', value: vocSchool, icon: 'school' },
            { label: 'DURATION', value: vocDuration, icon: 'time' },
            { label: 'END DATE', value: vocEndDate, icon: 'calendar' }
          ].map((item, idx) => (
            <View key={idx} style={styles.statCard}>
              <View style={styles.statIconHeader}>
                <Ionicons name={item.icon} size={16} color="#727ab6" />
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
              <Text style={styles.statValue} numberOfLines={2}>{item.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionHeader}>Completion Actions</Text>
        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={() => navigation.navigate('VocationalCompletion')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#eefafc' }]}>
            <Ionicons name="ribbon-outline" size={28} color="#41b5bd" />
          </View>
          <View style={styles.actionTextCol}>
            <Text style={styles.actionTitle}>Submit Completion Proof</Text>
            <Text style={styles.actionSub}>Upload your certificate and TOR after finishing the program</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#d4dae8" />
        </TouchableOpacity>

        <Text style={styles.sectionHeader}>Quick Links</Text>
        <View style={styles.quickLinksGrid}>
          {[
            { title: "My Profile", route: "Profile", icon: "person-outline", bg: "#f4effe", color: "#7e52d8" },
            { title: "Notifications", route: "Notifications", icon: "notifications-outline", bg: "#eefafc", color: "#41b5bd" }
          ].map((link, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.quickLinkCard}
              onPress={() => navigation.navigate(link.route)}
            >
              <View style={[styles.qlIconBox, { backgroundColor: link.bg }]}>
                <Ionicons name={link.icon} size={24} color={link.color} />
              </View>
              <Text style={styles.qlTitle}>{link.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  heroBanner: {
    backgroundColor: '#727ab6',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#727ab6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLabel: { color: '#d0d4e9', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  heroName: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 12 },
  heroBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
  heroBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  progressCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 6, borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  progressText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  progressLabel: { color: '#b2b8d9', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  timelineSection: { marginTop: 24 },
  timelineTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  timelineSub: { color: '#d0d4e9', fontSize: 13, fontWeight: '500' },
  progressBarContainer: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, marginTop: 16, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  statCard: {
    backgroundColor: '#fff', width: '48%', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    borderWidth: 1, borderColor: '#edf0f8'
  },
  statIconHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statLabel: { color: '#8b93b0', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginLeft: 6 },
  statValue: { color: '#111', fontSize: 15, fontWeight: '800' },
  sectionHeader: { fontSize: 18, fontWeight: '800', color: '#343a40', marginBottom: 16, marginTop: 8 },
  actionCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    borderWidth: 1, borderColor: '#edf0f8'
  },
  actionIconBox: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  actionTextCol: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 4 },
  actionSub: { fontSize: 12, color: '#848baf', fontWeight: '500', lineHeight: 16 },
  quickLinksGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  quickLinkCard: {
    backgroundColor: '#fff', width: '48%', borderRadius: 16, padding: 20, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    borderWidth: 1, borderColor: '#edf0f8'
  },
  qlIconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  qlTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
});
