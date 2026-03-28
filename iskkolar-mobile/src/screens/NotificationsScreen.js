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
      icon: 'information-outline', // Note: use 'information' or 'information-outline' in Expo Ionicons
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#5562d8" />
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
              <Ionicons name="information" size={24} color="#5562d8" style={{ fontWeight: 'bold' }} />
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
    backgroundColor: '#fafbfc',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#dce1f0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#5562d8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#fff'
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#5562d8',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#7a82a0',
    marginTop: 2,
    fontWeight: '500' // matches the light feel
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#f6f6f6', // matches the slightly greyish box in the screenshot
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, // stronger shadow from the screenshot
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e8e8e8'
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#5562d8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    backgroundColor: '#fff'
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#131b3e',
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
    color: '#7a82a0',
    fontWeight: '600'
  }
});
