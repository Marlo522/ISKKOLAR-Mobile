import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ActivitiesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Activities</Text>
      </View>
      <View style={styles.content}>
        <Ionicons name="clipboard-outline" size={64} color="#ccceea" style={{ marginBottom: 16 }} />
        <Text style={styles.emptyText}>No recent activities found.</Text>
        <Text style={styles.subText}>Your scheduled exam assistances, grade submissions, and general scholarship tasks will appear here.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fb',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#dce1f0',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#131b3e',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#344054',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: '#6e7798',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500'
  }
});
