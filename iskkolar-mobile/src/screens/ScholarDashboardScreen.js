import React, { useEffect, useRef, useContext, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { getScholarDashboardSummary, getScholarApplicationHistory } from '../services/scholarDashboardService';
import { getGradeComplianceTerms } from '../services/gradeComplianceService';
import { getApplicationSettings } from '../services/settingsService';

const getNextAcademicYear = (value) => {
  const match = /^(\d{4})-(\d{4})$/.exec((value || '').trim());
  if (!match) return '';

  const start = Number(match[1]);
  const end = Number(match[2]);

  if (!Number.isFinite(start) || !Number.isFinite(end)) return '';

  return `${start + 1}-${end + 1}`;
};

export default function ScholarDashboardScreen({ navigation }) {
  const { user, refreshSession } = useContext(AuthContext);
  const { unreadCount, fetchAnnouncements } = useContext(NotificationContext);
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [applicationHistory, setApplicationHistory] = useState([]);
  const [gradeComplianceSummary, setGradeComplianceSummary] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [renewalsOpen, setRenewalsOpen] = useState(true);

  const currentYearLevel = dashboardSummary?.academicStatus?.yearLevel || user?.yearLevel || 'Not set';
  const currentProgram = dashboardSummary?.academicStatus?.program || user?.program || user?.scholarshipType || '--';
  const currentGwaValue = dashboardSummary?.academicStatus?.latestGwa;
  const currentGwa = Number.isFinite(Number(currentGwaValue)) ? Number(currentGwaValue).toFixed(2) : '--';
  
  const sourceSummary = dashboardSummary?.sourceSummary;
  const historyItems = applicationHistory || [];
  
  // Exclude empty placeholders from count if they exist
  const actualApplications = historyItems.filter(item => item.id && !item.id.includes('_empty') && item.status !== 'not_started');
  
  // Total applications submitted (Renewal, Tertiary, Vocational, KKFI, Exam Assistance, Financial Assistance, etc.)
  const submittedApplicationsCount = (sourceSummary ? (
    (sourceSummary.renewalsCount || 0) +
    (sourceSummary.tertiaryApplicationsCount || 0) +
    (sourceSummary.vocationalApplicationsCount || 0) +
    (sourceSummary.kkfiChildApplicationsCount || 0) +
    (sourceSummary.kkfiStaffApplicationsCount || 0)
  ) : 0) + actualApplications.filter(a => ['exam_assistance', 'receipt_submission'].includes(a.category)).length;

  const applicationsSubmitted = String(submittedApplicationsCount);
  
  const gradeComplianceLatest = gradeComplianceSummary?.latestSubmission || null;
  const gradeComplianceTerms = gradeComplianceSummary?.terms || [];
  const nextPendingGradeComplianceTerm = gradeComplianceTerms.find(
    (item) => String(item?.status || '').toLowerCase() === 'pending'
  )?.term;
  
  const currentTerm = nextPendingGradeComplianceTerm || gradeComplianceLatest?.term || dashboardSummary?.academicStatus?.term || user?.term || '--';

  const latestApp = actualApplications[0];
  const appsSubText = latestApp
    ? `Latest: ${latestApp.title || latestApp.category || 'Application'} (${latestApp.status ? latestApp.status.split(/[_ -]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") : 'Under Review'})`
    : 'View and track your submitted applications';

  const stats = useMemo(
    () => [
      { title: currentYearLevel, sub: currentProgram, icon: 'book-outline', iconBg: '#f4effe', iconColor: '#7e52d8', fullWidth: true },
      { title: currentGwa, sub: 'Current GWA', icon: 'checkmark-circle-outline', iconBg: '#e7f6ea', iconColor: '#39a751', fullWidth: false },
      { title: currentTerm, sub: 'Current Term', icon: 'book-outline', iconBg: '#f4effe', iconColor: '#7e52d8', fullWidth: false },
      {
        title: applicationsSubmitted,
        sub: 'Applications Submitted',
        desc: appsSubText,
        icon: 'calendar-outline',
        iconBg: '#eefafc',
        iconColor: '#41b5bd',
        fullWidth: true,
        interactive: true,
        onPress: () => navigation.navigate('Application')
      },
    ],
    [applicationsSubmitted, currentGwa, currentProgram, currentTerm, currentYearLevel, appsSubText, navigation]
  );

  const quickLinks = [
    { title: "Certificate of Registration & Grade Compliance", route: "GradeCompliance", icon: "clipboard-outline", iconBg: "#e7f6ea", iconColor: "#39a751" },
    { title: "Financial Records", route: "FinancialRecords", icon: "receipt-outline", iconBg: "#fcefe9", iconColor: "#e96e5e" },
    { title: "My Profile", route: "Profile", icon: "person-outline", iconBg: "#f4effe", iconColor: "#7e52d8" },
    { title: "Activities", route: "Activities", icon: "calendar-outline", iconBg: "#eefafc", iconColor: "#41b5bd" }
  ];

  const baseAcademicYear = dashboardSummary?.currentAcademicYear || user?.academicYear || '';
  const nextAcademicYear = getNextAcademicYear(baseAcademicYear);

  const resolvedIsGraduate =
    user?.is_graduate ||
    user?.isGraduate ||
    dashboardSummary?.academicStatus?.isGraduate ||
    dashboardSummary?.academicStatus?.is_graduate ||
    false;

  const services = [
    {
      title: 'Scholarship Renewal',
      sub: renewalsOpen
        ? (nextAcademicYear ? `Renew for AY ${nextAcademicYear}` : 'Renew for next academic year')
        : 'Renewals are currently closed by the administrator.',
      route: 'ScholarshipRenewal',
      icon: 'sync',
      iconBg: '#f4effe',
      iconColor: '#7e52d8',
      isLocked: !renewalsOpen,
      lockMessage: 'Closed',
    },
    {
      title: 'Exam Financial Assistance',
      sub: 'Apply for board exam financial assistance.',
      route: 'ExamAssistance',
      icon: 'shield-checkmark-outline',
      iconBg: '#e8f4fd',
      iconColor: '#2196f3',
      isLocked: !resolvedIsGraduate,
      lockMessage: 'Locked (Graduates Only)',
    }
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

  const loadDashboardMeta = useCallback(async () => {
    try {
      const [summary, history, gradeCompliance, settings] = await Promise.all([
        getScholarDashboardSummary(),
        getScholarApplicationHistory(),
        getGradeComplianceTerms(),
        getApplicationSettings(),
      ]);

      setDashboardSummary(summary?.data || summary || null);
      setApplicationHistory(history?.data?.applicationItems || history?.applicationItems || []);
      setGradeComplianceSummary(gradeCompliance?.data || gradeCompliance || null);
      setRenewalsOpen(settings?.renewals_open ?? true);
    } catch (error) {
      if (__DEV__) {
        console.warn('Failed to load scholar dashboard data', error?.message || error);
      }
    }
  }, []);

  useEffect(() => {
    if (!isFocused) return;

    const checkRoleAndLoad = async () => {
      const updatedUser = await refreshSession().catch(err => {
        console.warn("ScholarDashboard: Failed to refresh session on focus:", err);
        return null;
      });

      if (updatedUser && updatedUser.role !== "scholar") {
        navigation.replace("Main");
        return;
      }

      void loadDashboardMeta();
    };

    checkRoleAndLoad();
  }, [isFocused, loadDashboardMeta, refreshSession, navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const updatedUser = await refreshSession().catch(() => null);
    if (updatedUser && updatedUser.role !== "scholar") {
      navigation.replace("Main");
      setRefreshing(false);
      return;
    }
    await Promise.all([loadDashboardMeta(), fetchAnnouncements()]);
    setRefreshing(false);
  }, [loadDashboardMeta, fetchAnnouncements, refreshSession, navigation]);

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#727ab6']} tintColor="#727ab6" />}
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
          
          {/* Bell Notification Button */}
          <TouchableOpacity 
            style={styles.bellButton} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications" size={22} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          {stats.map((stat, idx) => {
            const CardComponent = stat.interactive ? TouchableOpacity : View;
            return (
              <CardComponent
                key={idx}
                style={[styles.statCard, stat.fullWidth ? { width: '100%' } : { width: '48%' }]}
                onPress={stat.interactive ? stat.onPress : undefined}
                activeOpacity={0.8}
              >
                <View style={[styles.statIconBox, { backgroundColor: stat.iconBg }]}>
                  <Ionicons name={stat.icon} size={20} color={stat.iconColor} />
                </View>
                <View style={styles.statTextCol}>
                  <Text style={styles.statTitle}>{stat.title}</Text>
                  <Text style={styles.statSub}>{stat.sub}</Text>
                  {stat.desc ? (
                    <Text style={styles.statDesc} numberOfLines={1}>{stat.desc}</Text>
                  ) : null}
                </View>
                {stat.interactive && (
                  <Ionicons name="chevron-forward" size={18} color="#b2b9c9" style={{ marginLeft: 8 }} />
                )}
              </CardComponent>
            );
          })}
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
          {services.map((svc, idx) => {
            const isLocked = svc.isLocked;
            return (
              <TouchableOpacity
                key={idx}
                style={styles.serviceCard}
                activeOpacity={isLocked ? 1 : 0.8}
                onPress={() => {
                  if (isLocked) return;
                  navigation.navigate(svc.route);
                }}
                disabled={isLocked}
              >
                <View style={[styles.svcIconBox, { backgroundColor: svc.iconBg }]}>
                  <Ionicons name={svc.icon} size={28} color={svc.iconColor} />
                </View>
                <View style={styles.svcTextCol}>
                  <View style={styles.titleContainer}>
                    <Text style={[styles.svcTitle, isLocked && styles.disabledSvcTitle]}>{svc.title}</Text>
                    {isLocked && svc.lockMessage && (
                      <View style={styles.lockBadge}>
                        <Text style={styles.lockBadgeText}>{svc.lockMessage}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.svcSub, isLocked && styles.disabledSvcSub]}>{svc.sub}</Text>
                </View>
                {!isLocked && <Ionicons name="chevron-forward" size={24} color="#d4dae8" />}
              </TouchableOpacity>
            );
          })}
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
  bellButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  bellBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#e96e5e',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#727ab6',
  },
  bellBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
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
  statDesc: {
    fontSize: 12,
    color: '#727ab6',
    fontWeight: '600',
    marginTop: 4,
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
    flexShrink: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  disabledSvcTitle: {
    color: '#8e94a6',
  },
  lockBadge: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  lockBadgeText: {
    fontSize: 10,
    color: '#8e94a6',
    fontWeight: '600',
  },
  svcSub: {
    fontSize: 12,
    color: '#848baf',
    fontWeight: '500',
  },
  disabledSvcSub: {
    color: '#b2b9c9',
  }
});
