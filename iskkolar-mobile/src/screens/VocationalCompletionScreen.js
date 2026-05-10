import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { submitVocationalCompletion } from '../services/vocationalDashboardService';

export default function VocationalCompletionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [completionDate, setCompletionDate] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [files, setFiles] = useState({
    completion_certificate: null,
    transcript_of_records: null,
    other: null,
  });

  const pickDocument = async (key) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
      });

      if (!result.canceled) {
        setFiles(prev => ({ ...prev, [key]: result.assets[0] }));
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleSubmit = async () => {
    if (!completionDate) {
      Alert.alert('Required', 'Please provide the completion date.');
      return;
    }

    if (!files.completion_certificate) {
      Alert.alert('Required', 'Please upload your completion certificate.');
      return;
    }

    setLoading(true);
    try {
      const payload = { completion_date: completionDate, certificate_number: certificateNumber };
      await submitVocationalCompletion(payload, files);
      Alert.alert('Success', 'Your completion proof has been submitted for review.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit completion proof.');
    } finally {
      setLoading(false);
    }
  };

  const renderFilePicker = (key, label) => (
    <View style={styles.filePickerContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity 
        style={[styles.filePicker, files[key] && styles.filePicked]} 
        onPress={() => pickDocument(key)}
      >
        <Ionicons 
          name={files[key] ? "checkmark-circle" : "cloud-upload-outline"} 
          size={24} 
          color={files[key] ? "#39a751" : "#727ab6"} 
        />
        <Text style={[styles.filePickerText, files[key] && styles.filePickedText]}>
          {files[key] ? files[key].name : `Select ${label}`}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Completion</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#727ab6" />
          <Text style={styles.infoText}>
            Please provide your program completion details and upload the required documents for verification.
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.fieldLabel}>Completion Date (YYYY-MM-DD)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="calendar-outline" size={20} color="#8b93b0" />
            <Text style={styles.placeholderText}>Manual input for now...</Text>
            {/* Note: In a real app, use a DatePicker component */}
          </View>
          <Text style={styles.fieldHint}>Date you finished the vocational program</Text>

          <Text style={styles.fieldLabel}>Certificate Number (Optional)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="barcode-outline" size={20} color="#8b93b0" />
            <Text style={styles.placeholderText}>Optional ID/Number...</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Required Documents</Text>
        {renderFilePicker('completion_certificate', 'Completion Certificate')}
        {renderFilePicker('transcript_of_records', 'Transcript of Records (TOR)')}
        {renderFilePicker('other', 'Other Supporting Docs (Optional)')}

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Submit for Verification</Text>
              <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#edf0f8'
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  infoCard: {
    backgroundColor: '#f4effe', borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 24
  },
  infoText: { flex: 1, marginLeft: 12, fontSize: 13, color: '#5b5f97', fontWeight: '500', lineHeight: 18 },
  formSection: { marginBottom: 24 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: '#343a40', marginBottom: 8 },
  fieldHint: { fontSize: 11, color: '#8b93b0', marginTop: 4, fontWeight: '500' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, paddingHorizontal: 16, height: 50,
    borderWidth: 1, borderColor: '#edf0f8'
  },
  placeholderText: { marginLeft: 10, color: '#8b93b0', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 16 },
  filePickerContainer: { marginBottom: 16 },
  filePicker: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#edf0f8',
    borderStyle: 'dashed'
  },
  filePicked: { borderColor: '#39a751', borderStyle: 'solid', backgroundColor: '#f0f9f1' },
  filePickerText: { marginLeft: 12, fontSize: 14, color: '#727ab6', fontWeight: '600' },
  filePickedText: { color: '#39a751' },
  submitButton: {
    backgroundColor: '#727ab6', borderRadius: 16, height: 56,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 24, shadowColor: '#727ab6', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
