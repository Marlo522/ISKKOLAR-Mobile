import React, { useEffect, useRef, useContext, useState, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  RefreshControl 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { getScholarDashboardSummary } from '../services/scholarDashboardService';
import { getMyVocationalCompletion } from '../services/vocationalDashboardService';

// Format display date helper matching the web implementation
const formatDisplayDate = (value) => {
  if (!value || value === '--') return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function VocationalDashboardScreen({ navigation }) {
  const { user, refreshSession } = useContext(AuthContext);
  const { unreadCount, fetchAnnouncements } = useContext(NotificationContext);
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [completionSubmission, setCompletionSubmission] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fetch summary and completion status
  const loadData = useCallback(async () => {
    try {
      const summary = await getScholarDashboardSummary();
      setDashboardSummary(summary?.data || summary || null);
      
      const completion = await getMyVocationalCompletion();
      setCompletionSubmission(completion?.data || completion || null);
    } catch (error) {
      console.warn('Failed to load vocational dashboard data', error);
    }
  }, []);

  useEffect(() => {
    if (!isFocused) return;

    const checkRoleAndLoad = async () => {
      const updatedUser = await refreshSession().catch(err => {
        console.warn("VocationalDashboard: Failed to refresh session on focus:", err);
        return null;
      });

      if (updatedUser && updatedUser.role !== "scholar") {
        navigation.replace("Main");
        return;
      }

      void loadData();
    };

    checkRoleAndLoad();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true })
    ]).start();
  }, [isFocused, loadData, refreshSession, navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const updatedUser = await refreshSession().catch(() => null);
    if (updatedUser && updatedUser.role !== "scholar") {
      navigation.replace("Main");
      setRefreshing(false);
      return;
    }
    await Promise.all([loadData(), fetchAnnouncements()]);
    setRefreshing(false);
  }, [loadData, fetchAnnouncements, refreshSession, navigation]);

  // ─────────── RESOLVE VALUES & TIMELINE (PARITY WITH WEB) ───────────
  const vocData = dashboardSummary?.vocational;
  const vocSchool = vocData?.school || user?.vocationalSchoolName || user?.schoolName || '--';
  const vocProgram = vocData?.program || user?.program || user?.scholarshipType || '--';
  const vocDuration = vocData?.duration || user?.courseDuration || '--';

  const completionStatus = completionSubmission?.status || vocData?.completion?.status || null;

  const latestVocationalApplication = dashboardSummary?.vocationalApplications?.[0] || null;
  const latestVocationalEducation = Array.isArray(latestVocationalApplication?.vocational_education)
    ? latestVocationalApplication.vocational_education[0]
    : latestVocationalApplication?.vocational_education || null;

  const vocEndDateRaw = completionSubmission?.completion_date || vocData?.endDate || user?.endDate || latestVocationalEducation?.completion_date || null;
  const vocEndDateFormatted = formatDisplayDate(vocEndDateRaw);

  const now = new Date();
  const completionDate = vocEndDateRaw ? new Date(vocEndDateRaw) : null;
  const daysLeft = completionDate && !Number.isNaN(completionDate.getTime())
    ? Math.ceil((completionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const startDateRaw = latestVocationalApplication?.created_at || latestVocationalEducation?.created_at || vocData?.startDate || null;
  const startDate = startDateRaw ? new Date(startDateRaw) : null;

  // Calculate readiness percentage matching the web exactly
  const readiness = useMemo(() => {
    if (completionStatus === 'approved') return 100;
    
    if (completionDate && startDate && !Number.isNaN(startDate.getTime()) && !Number.isNaN(completionDate.getTime())) {
      const totalDuration = completionDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      if (totalDuration > 0) {
        let pct = Math.round((elapsed / totalDuration) * 100);
        if (pct < 0) pct = 0;
        if (pct > 100) pct = 100;
        
        // Ensure pending status is at least 50%
        if (completionStatus === 'pending' && pct < 50) return 50;
        return pct;
      }
      return 100;
    } else if (completionDate && daysLeft !== null && daysLeft <= 0) {
      return 100;
    }
    
    if (completionStatus === 'pending') return 50;
    return 0;
  }, [completionStatus, completionDate, startDate, daysLeft]);

  // Dynamic colors for status bar
  const getStatusColor = () => {
    if (completionStatus === 'approved') return '#16a34a'; // Emerald
    if (completionStatus === 'pending') return '#d97706'; // Amber
    if (completionStatus === 'rejected') return '#dc2626'; // Red
    return '#8b93b0';
  };

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#727ab6']} />}
      >
        {/* Banner with Circle Progress (Mirroring Web) */}
        <View style={[styles.heroBanner, { position: 'relative' }]}>

          <View style={styles.heroHeader}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.heroLabel}>VOCATIONAL DASHBOARD</Text>
              <Text style={styles.heroName} numberOfLines={2}>{fullName}</Text>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>Vocational / Certification Scholar</Text>
              </View>
            </View>

            <View style={styles.progressCircle}>
              <Text style={styles.progressText}>{readiness}%</Text>
              <Text style={styles.progressLabel}>READY</Text>
            </View>
          </View>

          <View style={styles.timelineSection}>
            <Text style={styles.timelineTitle}>
              {daysLeft !== null
                ? (daysLeft >= 0 ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} until completion` : "Training completion date reached")
                : "Program timeline available after approval"}
            </Text>
            <Text style={styles.timelineSub}>
              {vocEndDateFormatted !== "--" ? `Estimated completion: ${vocEndDateFormatted}` : "Completion date not yet submitted"}
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${readiness}%`, backgroundColor: getStatusColor() }]} />
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { label: 'PROGRAM', value: vocProgram, icon: 'book', fullWidth: true },
            { label: 'SCHOOL / CENTER', value: vocSchool, icon: 'school', fullWidth: true },
            { label: 'DURATION', value: vocDuration, icon: 'time', fullWidth: false },
            { label: 'END DATE', value: vocEndDateFormatted, icon: 'calendar', fullWidth: false }
          ].map((item, idx) => (
            <View key={idx} style={[styles.statCard, item.fullWidth ? { width: '100%' } : { width: '48%' }]}>
              <View style={styles.statIconHeader}>
                <Ionicons name={item.icon} size={16} color="#727ab6" />
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
              <Text style={styles.statValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Action Card */}
        <Text style={styles.sectionHeader}>Completion Actions</Text>
        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={() => navigation.navigate('VocationalCompletion', {
            completionDate: vocEndDateRaw
          })}
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

        {/* Quick Links */}
        <Text style={styles.sectionHeader}>Quick Links</Text>
        <View style={styles.quickLinksGrid}>
          {[
            { title: "My Profile", route: "Profile", icon: "person-outline", bg: "#f4effe", color: "#7e52d8" },
            { title: "Application History", route: "Application", icon: "clipboard-outline", bg: "#eefafc", color: "#41b5bd" }
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
  bellButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#e96e5e',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#727ab6',
  },
  bellBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
  },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLabel: { color: '#d0d4e9', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  heroName: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 12 },
  heroBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
  heroBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  progressCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 6, borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 8,
  },
  progressText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  progressLabel: { color: '#b2b8d9', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  timelineSection: { marginTop: 24 },
  timelineTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  timelineSub: { color: '#d0d4e9', fontSize: 12, fontWeight: '500' },
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
  statValue: { color: '#111', fontSize: 14, fontWeight: '800' },
  sectionHeader: { fontSize: 17, fontWeight: '800', color: '#343a40', marginBottom: 16, marginTop: 8 },
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
  qlTitle: { fontSize: 13, fontWeight: '700', color: '#111', textAlign: 'center' },
});
