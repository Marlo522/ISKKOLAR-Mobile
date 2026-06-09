import React, { useEffect, useState, useRef, useContext, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { getScholarActivities } from '../services/activityService';
import { getAttachmentDownloadUrl } from '../services/announcementService';
import { isVocationalScholar } from '../utils/scholarUtils';

const isScholarUser = (user) => {
  const values = [user?.userType, user?.role, user?.status, user?.scholarStatus, user?.program, user?.scholarshipType]
    .map((value) => String(value || '').toLowerCase())
    .join(' ');
  return values.includes('scholar');
};

const isActivityVisibleToScholar = (activity, user) => {
  const audienceValue = String(
    activity?.audience ||
    activity?.target_audience ||
    activity?.visibility ||
    activity?.launch_audience ||
    activity?.eligible_for ||
    activity?.eligibleFor ||
    activity?.scholar_only ||
    ''
  ).toLowerCase();

  if (audienceValue.includes('all')) return true;
  if (audienceValue.includes('non-scholar') || audienceValue.includes('applicant')) return false;
  if (audienceValue.includes('scholar')) return isScholarUser(user);

  const launchStatus = String(
    activity?.launch_scholar_status ||
    activity?.scholar_status_at_launch ||
    activity?.required_scholar_status ||
    ''
  ).toLowerCase();

  if (launchStatus) {
    const currentStatus = String(user?.scholarStatus || user?.status || user?.role || '').toLowerCase();
    return currentStatus.includes(launchStatus) || currentStatus.includes('scholar');
  }

  return isScholarUser(user);
};

// Match the web's styling for different statuses
export default function ActivitiesScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  
  // Animation values for screen entrance
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Data states
  const [scholarActivities, setScholarActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getScholarActivities();
      setScholarActivities(data);
    } catch (err) {
      setError(typeof err === 'string' ? err : (err?.message || 'Failed to load activities'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
    
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
  }, [fetchActivities, fadeAnim, slideAnim]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getScholarActivities();
      setScholarActivities(data);
      setError(null);
    } catch (err) {
      setError(typeof err === 'string' ? err : (err?.message || 'Failed to load activities'));
    } finally {
      setRefreshing(false);
    }
  }, []);

  const openAttachment = useCallback(async (url) => {
    if (!url) return;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.warn('Unsupported attachment URL:', url);
      }
    } catch (err) {
      console.warn('Failed to open attachment URL:', err);
    }
  }, []);

  const visibleActivities = useMemo(
    () => scholarActivities.filter((activity) => isActivityVisibleToScholar(activity, user)),
    [scholarActivities, user]
  );

  const groupedByYear = useMemo(() => {
    return visibleActivities.reduce((acc, activity) => {
      const year = String(activity.year || new Date(activity.dateLabel || activity.createdAt).getFullYear() || 'Unknown');
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(activity);
      return acc;
    }, {});
  }, [visibleActivities]);

  const years = useMemo(
    () => Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a)),
    [groupedByYear]
  );

  const totalActivities = visibleActivities.length;
  const presentCount = visibleActivities.filter((a) => a.status === 'Present').length;
  const upcomingCount = visibleActivities.filter((a) => a.status === 'Upcoming').length;

  const statusStyles = {
    Present: { badgeBg: '#e6f7ef', badgeText: '#0d7c47' },
    Upcoming: { badgeBg: '#fff8e6', badgeText: '#b5850a' },
    Missed: { badgeBg: '#ffeaea', badgeText: '#dc2626' },
  };

  const isVocational = isVocationalScholar(user);

  if (selectedActivity) {
    const statusStyle = statusStyles[selectedActivity.status] || { badgeBg: '#f3f4f6', badgeText: '#4b5563' };
    const accentColor = statusStyle.badgeText;

    return (
      <View style={styles.container}>
        <View style={[styles.landingHeaderTop, { paddingTop: insets.top + 16 }]}> 
          <View style={styles.profileRow}>
            <View style={styles.userIconWrapper}>
              <Ionicons name="person-outline" size={24} color="#6472d9" />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.userName}>
                {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Juan dela Cruz'}
              </Text>
              <Text style={styles.userRole}>Active Scholar</Text>
            </View>
            {!isVocational && (
              <TouchableOpacity
                style={styles.bellBtnLanding}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Ionicons name="notifications-outline" size={22} color="#6472d9" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.detailContent}>
          <TouchableOpacity style={styles.detailBackButton} onPress={() => setSelectedActivity(null)}>
            <Ionicons name="chevron-back" size={20} color="#1a1a2e" />
            <Text style={styles.detailBackText}>Back to activities</Text>
          </TouchableOpacity>

          <View style={styles.detailCard}>
            <View style={[styles.detailAccentBar, { backgroundColor: accentColor }]} />
            <View style={styles.detailCardBody}>
              <View style={styles.detailHeaderRow}>
                <View>
                  <View style={[styles.detailStatusBadge, { backgroundColor: statusStyle.badgeBg }]}> 
                    <Text style={[styles.detailStatusText, { color: statusStyle.badgeText }]}>
                      {selectedActivity.status}
                    </Text>
                  </View>
                  {selectedActivity.attendance_required && (
                    <View style={styles.detailMandatoryBadge}>
                      <Ionicons name="alert-circle-outline" size={14} color="#b91c1c" />
                      <Text style={styles.detailMandatoryText}>Mandatory</Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.detailTitle}>{selectedActivity.title}</Text>

              <View style={styles.detailMetaGrid}>
                <View style={styles.detailMetaItem}>
                  <Text style={styles.detailMetaLabel}>Date</Text>
                  <Text style={[styles.detailMetaValue, { color: '#1a1a2e' }]}>{selectedActivity.dateLabel}</Text>
                </View>
                <View style={styles.detailMetaItem}>
                  <Text style={styles.detailMetaLabel}>Time</Text>
                  <Text style={[styles.detailMetaValue, { color: '#1a1a2e' }]}>{selectedActivity.timeLabel}</Text>
                </View>
                <View style={styles.detailMetaItem}>
                  <Text style={styles.detailMetaLabel}>Location</Text>
                  <Text style={[styles.detailMetaValue, { color: '#1a1a2e' }]} numberOfLines={2}>
                    {selectedActivity.locationLabel || 'Not specified'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Activity Description</Text>
                <Text style={styles.detailParagraph}>
                  {selectedActivity.description || 'No description provided.'}
                </Text>
              </View>

              {selectedActivity.attachments && selectedActivity.attachments.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Attachments</Text>
                  {selectedActivity.attachments.map((file, index) => {
                    const downloadUrl = getAttachmentDownloadUrl(file.url, file.name);
                    return (
                      <TouchableOpacity
                        key={index}
                        style={styles.attachmentRow}
                        activeOpacity={0.8}
                        onPress={() => openAttachment(downloadUrl)}
                      >
                        <View style={styles.attachmentIconBox}>
                          <Ionicons name="document-text-outline" size={18} color="#4f5ec4" />
                        </View>
                        <View style={styles.attachmentMeta}>
                          <Text style={styles.attachmentName}>{file.name || 'Document'}</Text>
                          {file.size ? (
                            <Text style={styles.attachmentMetaText}>{(file.size / 1024).toFixed(1)} KB</Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Profile Header */}
      <View style={[styles.landingHeaderTop, { paddingTop: insets.top + 16 }]}>
        <View style={styles.profileRow}>
          <View style={styles.userIconWrapper}>
            <Ionicons name="person-outline" size={24} color="#6472d9" />
          </View>
          <View style={styles.headerTextCol}>
            <Text style={styles.userName}>
              {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Juan dela Cruz'}
            </Text>
            <Text style={styles.userRole}>Active Scholar</Text>
          </View>
          {!isVocational && (
            <TouchableOpacity 
              style={styles.bellBtnLanding} 
              activeOpacity={0.8} 
              onPress={() => navigation.navigate("Notifications")}
            >
              <Ionicons name="notifications-outline" size={22} color="#6472d9" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Animated.ScrollView 
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]} 
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a1a2e']} tintColor="#1a1a2e" />}
      >
        {/* Header equivalent to web */}
        <View style={styles.pageHeaderBox}>
          <Text style={styles.pageHeaderTitle}>Activity Records</Text>
          <Text style={styles.pageHeaderSub}>Scholar's Active Participation</Text>
        </View>

        {/* Loading State */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#1a1a2e" />
            <Text style={styles.loadingText}>Loading activity records...</Text>
          </View>
        ) : error ? (
          /* Error State */
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchActivities}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : visibleActivities.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="calendar-outline" size={32} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>No activities found</Text>
            <Text style={styles.emptyText}>You don't have any visible activity records yet.</Text>
          </View>
        ) : (
          /* Content State */
          <>
            {/* Stats Overview */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statNumberText}>{totalActivities}</Text>
                <Text style={styles.statLabelText}>Total</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumberText, { color: '#0d7c47' }]}>{presentCount}</Text>
                <Text style={styles.statLabelText}>Attended</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumberText, { color: '#b5850a' }]}>{upcomingCount}</Text>
                <Text style={styles.statLabelText}>Upcoming</Text>
              </View>
            </View>

            {/* Activities by Year */}
            {years.map((year) => (
              <View key={year} style={styles.yearSection}>
                <Text style={styles.yearTitle}>{year}</Text>

                {groupedByYear[year].map((activity) => {
                  const statusStyle = statusStyles[activity.status] || { badgeBg: '#f3f4f6', badgeText: '#4b5563' };
                  
                  return (
                    <TouchableOpacity
                      key={activity.id}
                      style={styles.activityCard}
                      activeOpacity={0.88}
                      onPress={() => setSelectedActivity(activity)}
                    >
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>{activity.title}</Text>
                        <View style={[styles.badge, { backgroundColor: statusStyle.badgeBg }] }>
                          <Text style={[styles.badgeText, { color: statusStyle.badgeText }]}>
                            {activity.status}
                          </Text>
                        </View>
                      </View>

                      {activity.description ? (
                        <Text style={styles.cardDesc} numberOfLines={2}>
                          {activity.description}
                        </Text>
                      ) : null}
                      
                      <View style={styles.divider} />
                      
                      <View style={styles.detailsRow}>
                        <View style={styles.detailCol}>
                          <Text style={styles.detailLabel}>Date</Text>
                          <Text style={styles.detailValue}>{activity.dateLabel}</Text>
                        </View>
                        <View style={[styles.detailCol, { flex: 0.6 }]}>
                          <Text style={styles.detailLabel}>Time</Text>
                          <Text style={styles.detailValue}>{activity.timeLabel}</Text>
                        </View>
                        <View style={styles.detailColRight}>
                          <Text style={styles.detailLabel}>Location</Text>
                          <Text style={styles.detailValue} numberOfLines={1}>
                            {activity.locationLabel}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb', // matching web's generally light bg or existing app bg
  },
  landingHeaderTop: { 
    paddingHorizontal: 24, 
    paddingBottom: 24, 
    backgroundColor: "#fff",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 10,
    zIndex: 10
  },
  profileRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  userIconWrapper: { 
    width: 50, 
    height: 50, 
    borderRadius: 14, 
    backgroundColor: '#fff', 
    borderWidth: 1.5, 
    borderColor: '#e8eAFD', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 14, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 10, 
    elevation: 3 
  },
  headerTextCol: { flex: 1 },
  userName: { 
    fontSize: 20, 
    fontWeight: '900', 
    color: '#080d19', 
    letterSpacing: -0.3, 
    marginBottom: 2 
  },
  userRole: { 
    fontSize: 13, 
    color: '#344054', 
    fontWeight: '600' 
  },
  bellBtnLanding: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    backgroundColor: '#fff', 
    borderWidth: 1.5, 
    borderColor: '#e8eaff', 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 10, 
    elevation: 3 
  },
  
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  pageHeaderBox: { 
    marginBottom: 20 
  },
  pageHeaderTitle: { 
    fontSize: 20, 
    fontWeight: "600", 
    color: "#111827" 
  },
  pageHeaderSub: { 
    fontSize: 14, 
    color: "#6b7280", 
    marginTop: 4 
  },
  
  // Center Loading/Error states
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
    fontWeight: '500'
  },
  errorText: {
    color: '#ef4444',
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center'
  },
  retryButton: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500'
  },

  // Empty State
  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#f9fafb',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center'
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },
  statNumberText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4
  },
  statLabelText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500'
  },

  // Activities
  yearSection: {
    marginBottom: 20
  },
  yearTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
    marginBottom: 12,
    marginLeft: 4
  },
  
  activityCard: {
    backgroundColor: "#fff", 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 8, 
    elevation: 2, 
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginRight: 10,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardDesc: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    flex: 1,
  },
  detailColRight: {
    alignItems: 'flex-start',
    flex: 0.8
  },
  detailLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a2e',
  },
  detailContent: {
    padding: 24,
    paddingBottom: 80,
  },
  detailBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  detailBackText: {
    color: '#1a1a2e',
    fontWeight: '700',
    fontSize: 15,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 8,
  },
  detailAccentBar: {
    height: 4,
    width: '100%',
  },
  detailCardBody: {
    padding: 24,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailStatusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  detailStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailMandatoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  detailMandatoryText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1a1a2e',
    marginBottom: 18,
  },
  detailMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  detailMetaItem: {
    flex: 1,
    minWidth: 120,
  },
  detailMetaLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  detailMetaValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 12,
  },
  detailParagraph: {
    fontSize: 15,
    lineHeight: 24,
    color: '#334155',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 18,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 18,
  },
  attachmentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentMeta: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  attachmentMetaText: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
  }
});

