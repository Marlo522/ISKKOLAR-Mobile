import React, { useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

export default function ActivitiesScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
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

  return (
    <View style={styles.container}>
      {/* Top Profile Header */}
      <View style={[styles.landingHeaderTop, { paddingTop: insets.top + 16 }]}>
        <View style={styles.profileRow}>
          <View style={styles.userIconWrapper}>
            <Ionicons name="person-outline" size={24} color="#6472d9" />
          </View>
          <View style={styles.headerTextCol}>
            <Text style={styles.userName}>{user?.firstName ? `${user.firstName} ${user.lastName}` : 'Juan dela Cruz'}</Text>
            <Text style={styles.userRole}>Active Scholar</Text>
          </View>
          <TouchableOpacity style={styles.bellBtnLanding} activeOpacity={0.8} onPress={() => navigation.navigate("Notifications")}>
            <Ionicons name="notifications-outline" size={22} color="#6472d9" />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView 
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]} 
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <View style={styles.pageHeaderBox}>
          <Text style={styles.pageHeaderTitle}>Activity Records</Text>
          <Text style={styles.pageHeaderSub}>Scholar's Active Participation</Text>
        </View>

        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Ionicons name="pie-chart-outline" size={20} color="#5b61a7" />
            <Text style={styles.overviewTitle}>Participation Summary</Text>
          </View>
          
          <View style={styles.overviewStatsRow}>
            <View style={styles.overviewStatCol}>
              <View style={[styles.iconWrapper, { backgroundColor: '#eff1fa' }]}>
                <Ionicons name="calendar" size={18} color="#5b61a7" />
              </View>
              <Text style={styles.overviewStatNum}>3</Text>
              <Text style={styles.overviewStatLabel}>Total</Text>
            </View>
            
            <View style={styles.dividerVertical} />
            
            <View style={styles.overviewStatCol}>
              <View style={[styles.iconWrapper, { backgroundColor: '#daf3e1' }]}>
                <Ionicons name="checkmark-done" size={18} color="#2cae57" />
              </View>
              <Text style={[styles.overviewStatNum, { color: '#2cae57' }]}>2</Text>
              <Text style={styles.overviewStatLabel}>Attended</Text>
            </View>
            
            <View style={styles.dividerVertical} />
            
            <View style={styles.overviewStatCol}>
              <View style={[styles.iconWrapper, { backgroundColor: '#fdf0d5' }]}>
                <Ionicons name="time" size={18} color="#f0a500" />
              </View>
              <Text style={[styles.overviewStatNum, { color: '#f0a500' }]}>1</Text>
              <Text style={styles.overviewStatLabel}>Upcoming</Text>
            </View>
          </View>
        </View>

        <Text style={styles.yearTitle}>2026</Text>

        {/* Activity Card 1 */}
        <View style={styles.activityCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Quarterly General Assembly</Text>
            <View style={styles.badgePresent}>
              <Text style={styles.badgePresentText}>Present</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>
            A mandatory gathering for all scholars to discuss program updates, leadership values, and community projects.
          </Text>
          
          <View style={styles.divider} />
          
          <View style={styles.detailsRow}>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>January 15, 2026</Text>
            </View>
            <View style={[styles.detailCol, { flex: 0.6 }]}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>9 AM</Text>
            </View>
            <View style={styles.detailColRight}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>KKFI Hall</Text>
            </View>
          </View>
        </View>
        
        {/* Activity Card 2 */}
        <View style={styles.activityCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Quarterly General Assembly</Text>
            <View style={styles.badgePresent}>
              <Text style={styles.badgePresentText}>Present</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>
            A mandatory gathering for all scholars to discuss program updates, leadership values, and community projects.
          </Text>
          
          <View style={styles.divider} />
          
          <View style={styles.detailsRow}>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>February 6, 2026</Text>
            </View>
            <View style={[styles.detailCol, { flex: 0.6 }]}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>9 AM</Text>
            </View>
            <View style={styles.detailColRight}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>KKFI Hall</Text>
            </View>
          </View>
        </View>

      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eff2f9',
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
    paddingTop: 20,
  },
  pageHeaderBox: { 
    marginBottom: 16 
  },
  pageHeaderTitle: { 
    fontSize: 20, 
    fontWeight: "900", 
    color: "#4f5ec4" 
  },
  pageHeaderSub: { 
    fontSize: 13, 
    color: "#222", 
    fontWeight: "600", 
    marginTop: 2 
  },
  yearTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111",
    marginBottom: 12
  },
  
  overviewCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f8'
  },
  overviewTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#3d4076',
    marginLeft: 8
  },
  overviewStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  overviewStatCol: {
    flex: 1,
    alignItems: 'center'
  },
  dividerVertical: {
    width: 1,
    height: 40,
    backgroundColor: '#f0f2f8'
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  overviewStatNum: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111',
    marginBottom: 2
  },
  overviewStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#848baf'
  },
  
  activityCard: {
    backgroundColor: "#fff", 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 16, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 12, 
    elevation: 3, 
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    color: '#111',
    lineHeight: 22,
    marginRight: 10,
  },
  badgePresent: {
    backgroundColor: '#2ce491',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgePresentText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111',
  },
  cardDesc: {
    fontSize: 13,
    color: '#7f88a3',
    lineHeight: 20,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#dce1f0',
    marginVertical: 14,
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
    fontWeight: '600',
    color: '#8a94b5',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111',
  }
});
