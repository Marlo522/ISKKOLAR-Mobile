import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
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

  const onChange = (event, selectedDate) => {
    // For Android, the picker closes immediately after selection.
    // For iOS, it's usually modal or inline, but here we use the default/spinner in a modal-like way.
    setShow(false);
    
    if (selectedDate) {
      // Format to YYYY-MM-DD for consistency
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      onDateChange(dateStr);
    }
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

      {show && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onValueChange={onChange}
          onDismiss={() => setShow(false)}
        />
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
});

export default FormDatePicker;
