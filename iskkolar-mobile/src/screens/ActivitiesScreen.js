import React, { useEffect, useState, useRef, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { getScholarActivities } from '../services/activityService';

// Match the web's styling for different statuses
const statusClasses = {
  Present: { bg: '#e6f7ef', text: '#0d7c47' },
  Upcoming: { bg: '#fff8e6', text: '#b5850a' },
  Missed: { bg: '#ffeaea', text: '#dc2626' },
};

export default function ActivitiesScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  
  // Animation values for screen entrance
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Data states
  const [scholarActivities, setScholarActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch activities from the API
  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getScholarActivities();
      setScholarActivities(data);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchActivities();
    
    // Header animations
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

  // Process data similarly to the web implementation
  const groupedByYear = scholarActivities.reduce((acc, activity) => {
    if (!acc[activity.year]) {
      acc[activity.year] = [];
    }
    acc[activity.year].push(activity);
    return acc;
  }, {});

  const years = Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a));

  const totalActivities = scholarActivities.length;
  const presentCount = scholarActivities.filter((a) => a.status === "Present").length;
  const upcomingCount = scholarActivities.filter((a) => a.status === "Upcoming").length;

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
          <TouchableOpacity 
            style={styles.bellBtnLanding} 
            activeOpacity={0.8} 
            onPress={() => navigation.navigate("Notifications")}
          >
            <Ionicons name="notifications-outline" size={22} color="#6472d9" />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView 
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]} 
        contentContainerStyle={{ paddingBottom: 60 }}
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
        ) : scholarActivities.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="calendar-outline" size={32} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>No activities found</Text>
            <Text style={styles.emptyText}>You don't have any activity records yet.</Text>
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
                  const statusStyle = statusClasses[activity.status] || { bg: '#f3f4f6', text: '#4b5563' };
                  
                  return (
                    <View key={activity.id} style={styles.activityCard}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>{activity.title}</Text>
                        <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                          <Text style={[styles.badgeText, { color: statusStyle.text }]}>
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
                    </View>
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
  }
});

