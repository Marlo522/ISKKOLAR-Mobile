import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const FormDatePicker = ({ 
  label, 
  value, 
  onDateChange, 
  error, 
  placeholder = "Select Date",
  minimumDate,
  maximumDate,
  required = false
}) => {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(value ? new Date(value) : new Date());

  useEffect(() => {
    if (value) {
      setTempDate(new Date(value));
    }
  }, [value]);

  const formatDate = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const onChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (selectedDate && event.type === 'set') {
        onDateChange(formatDate(selectedDate));
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const confirmIOS = () => {
    setShow(false);
    onDateChange(formatDate(tempDate));
  };

  const cancelIOS = () => {
    setShow(false);
    setTempDate(value ? new Date(value) : new Date());
  };

  const displayValue = value ? value : "";

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      ) : null}
      
      <TouchableOpacity 
        activeOpacity={0.7}
        style={[styles.input, error ? styles.errorInput : null]} 
        onPress={() => setShow(true)}
      >
        <Text style={[styles.dateText, !value ? styles.placeholderText : null]}>
          {displayValue || placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#4f5fc5" />
      </TouchableOpacity>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={show} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={cancelIOS} style={styles.modalBtn}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmIOS} style={styles.modalBtn}>
                  <Text style={styles.modalConfirm}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                onChange={onChange}
                textColor="#000000"
              />
            </View>
          </View>
        </Modal>
      ) : (
        show && (
          <DateTimePicker
            value={value ? new Date(value) : new Date()}
            mode="date"
            display="default"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={onChange}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    width: '100%',
    marginBottom: 16 
  },
  label: { 
    fontWeight: "700", 
    color: "#2d3a7c", 
    fontSize: 13, 
    marginBottom: 8,
    letterSpacing: 0.2
  },
  required: {
    color: "#dc2626"
  },
  input: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    borderWidth: 1.5, 
    borderColor: "#e4e8f8", 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    backgroundColor: "#fcfdff", 
    height: 52,
    shadowColor: "#4f5fc5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  dateText: { 
    fontSize: 14, 
    color: "#1c2131",
    fontWeight: "500"
  },
  placeholderText: { 
    color: "#8a94b5" 
  },
  errorInput: { 
    borderColor: "#dc2626",
    backgroundColor: "#fff5f5",
    shadowOpacity: 0
  },
  errorText: { 
    color: "#dc2626", 
    fontSize: 12, 
    marginTop: 4, 
    fontWeight: "600",
    lineHeight: 14
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  modalBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  modalCancel: {
    color: '#848baf',
    fontSize: 16,
    fontWeight: '600'
  },
  modalConfirm: {
    color: '#4f5fc5',
    fontSize: 16,
    fontWeight: '800'
  }
});

export default FormDatePicker;
