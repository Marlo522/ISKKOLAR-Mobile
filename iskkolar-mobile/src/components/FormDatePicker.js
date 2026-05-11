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
  required = false,
  dateFormat = 'mm/dd/yyyy'
}) => {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(value ? new Date(value) : new Date());

  const parseDate = (dateValue) => {
    if (!dateValue) return null;
    if (dateValue instanceof Date && !Number.isNaN(dateValue.getTime())) {
      return dateValue;
    }

    const text = String(dateValue).trim();

    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    if (isoMatch) {
      return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    }

    const slashMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
    if (!slashMatch) return null;

    const first = Number(slashMatch[1]);
    const second = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);

    if (dateFormat === 'dd/mm/yyyy') {
      return new Date(year, second - 1, first);
    }

    return new Date(year, first - 1, second);
  };

  useEffect(() => {
    if (value) {
      const parsed = parseDate(value);
      if (parsed) setTempDate(parsed);
    }
  }, [value, dateFormat]);

  const formatDate = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return dateFormat === 'dd/mm/yyyy' ? `${day}/${month}/${year}` : `${month}/${day}/${year}`;
  };

  const handleValueChange = (_event, selectedDate) => {
    if (!selectedDate) return;

    if (Platform.OS === 'android') {
      setShow(false);
      onDateChange(formatDate(selectedDate));
      return;
    }

    setTempDate(selectedDate);
  };

  const confirmIOS = () => {
    setShow(false);
    onDateChange(formatDate(tempDate));
  };

  const cancelIOS = () => {
    setShow(false);
    const parsed = parseDate(value);
    setTempDate(parsed || new Date());
  };

  const handleDismiss = () => {
    setShow(false);
    const parsed = parseDate(value);
    setTempDate(parsed || new Date());
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    const date = parseDate(dateString);
    if (!date) return dateString;
    return formatDate(date);
  };

  const displayValue = value ? formatDisplayDate(value) : "";

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
                onValueChange={handleValueChange}
                onDismiss={handleDismiss}
                textColor="#000000"
              />
            </View>
          </View>
        </Modal>
      ) : (
        show && (
          <DateTimePicker
            value={parseDate(value) || new Date()}
            mode="date"
            display="default"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onValueChange={handleValueChange}
            onDismiss={handleDismiss}
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
