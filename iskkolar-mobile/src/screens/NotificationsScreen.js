import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const notifications = [
    {
      id: 1,
      title: 'Welcome to iSKKOLAR Portal',
      message: 'Thank you for registering! Start your scholarship application journey today by exploring our available programs.',
      timestamp: 'Jan 28, 2026, 10:30 AM',
    }
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
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
              <Ionicons name="notifications" size={20} color="#4f5ec4" />
            </View>
            <View style={styles.cardContent}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={styles.unreadDot} />
              </View>
              <Text style={styles.cardMessage}>{item.message}</Text>
              <Text style={styles.cardTimestamp}>{item.timestamp}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eff2f9', // distinct soft background so it's obvious to the user
  },
  header: {
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 10,
    zIndex: 10
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1a1d2d',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6e7798',
    marginTop: 4,
    fontWeight: '500'
  },
  content: {
    padding: 20,
    paddingTop: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ebedfa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e96e5e',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1d2d',
    flex: 1,
    letterSpacing: -0.2,
  },
  cardMessage: {
    fontSize: 14,
    color: '#6e7798',
    lineHeight: 22,
    marginBottom: 14,
    fontWeight: '500'
  },
  cardTimestamp: {
    fontSize: 12,
    color: '#a3a9c7',
    fontWeight: '700'
  }
});
