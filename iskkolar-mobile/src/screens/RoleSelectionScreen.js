import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RoleSelectionScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#131b3e" />
        </TouchableOpacity>
        <Text style={styles.title}>Welcome!</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.questionText}>How are you using iSKKOLAR today?</Text>
        <Text style={styles.subtitleText}>Select a role to continue to your customized dashboard.</Text>

        <TouchableOpacity 
          style={styles.roleCard} 
          activeOpacity={0.8}
          onPress={() => navigation.replace("Main")}
        >
          <View style={[styles.iconBox, { backgroundColor: '#e9ebfe' }]}>
            <Ionicons name="document-text" size={32} color="#4f5fc5" />
          </View>
          <View style={styles.roleTextContainer}>
            <Text style={styles.roleTitle}>Scholarship Applicant</Text>
            <Text style={styles.roleDescription}>I want to apply for a scholarship, check my application status, or submit requirements.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#c0c8df" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.roleCard} 
          activeOpacity={0.8}
          onPress={() => navigation.replace("ScholarTabs")}
        >
          <View style={[styles.iconBox, { backgroundColor: '#eefcf5' }]}>
            <Ionicons name="school" size={32} color="#2ecb9b" />
          </View>
          <View style={styles.roleTextContainer}>
            <Text style={styles.roleTitle}>Active Scholar</Text>
            <Text style={styles.roleDescription}>I am a current scholar checking my grants, renewing my scholarship, or submitting grades.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#c0c8df" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#131b3e',
    letterSpacing: -0.5,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  questionText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#131b3e',
    marginBottom: 8,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  subtitleText: {
    fontSize: 15,
    color: '#6873a6',
    marginBottom: 32,
    lineHeight: 22,
    fontWeight: '500'
  },
  roleCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1d2e57',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#edf0f8'
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#131b3e',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  roleDescription: {
    fontSize: 13,
    color: '#6873a6',
    lineHeight: 18,
    fontWeight: '500',
  }
});
