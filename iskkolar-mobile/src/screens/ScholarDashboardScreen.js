import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ScholarDashboardScreen({ navigation }) {
  const quickActions = [
    {
      id: 1,
      title: "Renew scholarship",
      subtitle: "For AY 2026 -2027",
      icon: "sync",
      iconColor: "#41b5bd",
      bgColor: "#eefafc"
    },
    {
      id: 2,
      title: "Exam Assistance",
      subtitle: "Apply Now",
      icon: "clipboard-outline",
      iconColor: "#7e52d8",
      bgColor: "#f4effe"
    },
    {
      id: 3,
      title: "Grade Compliance",
      subtitle: "Submit Grades",
      icon: "document-text",
      iconColor: "#e96e5e",
      bgColor: "#fcefe9"
    },
    {
      id: 4,
      title: "Financial Records",
      subtitle: "View History",
      icon: "cash",
      iconColor: "#39a751",
      bgColor: "#e7f6ea"
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <View style={styles.userIconWrapper}>
            <Ionicons name="person-outline" size={24} color="#6472d9" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.userName}>Dominic Madla</Text>
            <Text style={styles.userRole}>Active Scholar</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8} onPress={() => navigation.navigate("Notifications")}>
            <Ionicons name="notifications-outline" size={22} color="#6472d9" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <Text style={styles.heroStatusText}>Scholarship Status</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>ACTIVE</Text>
            </View>
          </View>
          
          <Text style={styles.heroScholarType}>Nationwide Scholar</Text>
          
          <View style={styles.heroStatsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>2025-2026</Text>
              <Text style={styles.statLabel}>Academic Year</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>P1,500</Text>
              <Text style={styles.statLabel}>Total Grant</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>1.25</Text>
              <Text style={styles.statLabel}>Current GWA</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.grid}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.id} style={styles.gridItem} activeOpacity={0.8}>
              <View style={[styles.gridIconFrame, { backgroundColor: action.bgColor }]}>
                <Ionicons name={action.icon} size={32} color={action.iconColor} />
              </View>
              <Text style={styles.gridActionTitle}>{action.title}</Text>
              <Text style={styles.gridActionSub}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafbfc',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: '#fafbfc'
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e8eafd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerText: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#080d19',
    letterSpacing: -0.3,
    marginBottom: 2
  },
  userRole: {
    fontSize: 14,
    color: '#344054',
    fontWeight: '600'
  },
  bellBtn: {
    width: 48,
    height: 48,
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
    elevation: 3,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#6b73d6',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#4f55b1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  heroStatusText: {
    color: '#dbe0fd',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  activeBadge: {
    backgroundColor: '#3df38b',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroScholarType: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
    marginBottom: 24,
    letterSpacing: -0.2,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
    marginBottom: 4,
  },
  statLabel: {
    color: '#dbe0fd',
    fontSize: 11,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#080d19',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1d2e57',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#edf0f8'
  },
  gridIconFrame: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  gridActionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#080d19',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 18,
  },
  gridActionSub: {
    fontSize: 11,
    color: '#6873a6',
    fontWeight: '500',
    textAlign: 'center',
  }
});
