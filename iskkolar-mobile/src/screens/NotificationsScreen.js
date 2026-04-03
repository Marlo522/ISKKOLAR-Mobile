import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen({ navigation }) {
  const notifications = [
    {
      id: 1,
      title: 'Welcome to iSKKOLAR Portal',
      message: 'Thank you for registering! Start your scholarship application journey today by exploring our available programs.',
      timestamp: 'Jan 28, 2026, 10:30 AM',
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#5b6095" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>Stay updated with announcements</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {notifications.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.iconBox}>
              <Text style={styles.iconText}>i</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMessage}>{item.message}</Text>
              <Text style={styles.cardTimestamp}>{item.timestamp}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#dbe2f6',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbe2f6',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#4f5ec4',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#7a82a0',
    marginTop: 2,
    fontWeight: '500'
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e4e8f6'
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#5b6095',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    backgroundColor: '#fff',
    marginTop: 2
  },
  iconText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#5b6095',
    marginBottom: 1
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  cardMessage: {
    fontSize: 13,
    color: '#7a82a0',
    lineHeight: 18,
    marginBottom: 12,
    fontWeight: '500'
  },
  cardTimestamp: {
    fontSize: 10,
    color: '#9aa1be',
    fontWeight: '600'
  }
});
