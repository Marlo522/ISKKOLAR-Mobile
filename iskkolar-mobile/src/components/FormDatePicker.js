import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  const initialDate = parseDate(value) || new Date();

  const [year, setYear] = useState(initialDate.getFullYear());
  const [month, setMonth] = useState(initialDate.getMonth());
  const [day, setDay] = useState(initialDate.getDate());

  useEffect(() => {
    if (show) {
      const d = parseDate(value) || new Date();
      setYear(d.getFullYear());
      setMonth(d.getMonth());
      setDay(d.getDate());
    }
  }, [show, value]);

  const formatDate = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return dateFormat === 'dd/mm/yyyy' ? `${d}/${m}/${y}` : `${m}/${d}/${y}`;
  };

  const handleConfirm = () => {
    const selectedDate = new Date(year, month, day);

    if (minimumDate) {
      const minVal = new Date(minimumDate);
      minVal.setHours(0, 0, 0, 0);
      const selVal = new Date(selectedDate);
      selVal.setHours(0, 0, 0, 0);
      if (selVal < minVal) {
        Alert.alert("Invalid Date", `Date cannot be before ${formatDate(minVal)}.`);
        return;
      }
    }

    if (maximumDate) {
      const maxVal = new Date(maximumDate);
      maxVal.setDate(maxVal.getDate() + 1);
      maxVal.setHours(23, 59, 59, 999);
      const selVal = new Date(selectedDate);
      selVal.setHours(0, 0, 0, 0);
      if (selVal > maxVal) {
        Alert.alert("Invalid Date", `Date cannot be after ${formatDate(new Date(maximumDate))}.`);
        return;
      }
    }

    onDateChange(formatDate(selectedDate));
    setShow(false);
  };

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 80;
  const maxYear = currentYear + 5;

  const years = [];
  for (let y = maxYear; y >= minYear; y--) {
    years.push(y);
  }

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

      <Modal visible={show} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.dateModal}>
            <Text style={modalStyles.modalTitle}>{label || "Pick a date"}</Text>
            <View style={modalStyles.pickerRow}>
              <ScrollView style={modalStyles.pickerColumn} showsVerticalScrollIndicator={false}>
                {months.map((m, idx) => (
                  <TouchableOpacity
                    key={m}
                    style={[modalStyles.option, idx === month ? modalStyles.optionSelected : null]}
                    onPress={() => {
                      setMonth(idx);
                      const max = daysInMonth(year, idx);
                      if (day > max) setDay(max);
                    }}
                  >
                    <Text style={[modalStyles.optionText, idx === month ? modalStyles.optionTextSelected : null]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView style={modalStyles.pickerColumn} showsVerticalScrollIndicator={false}>
                {Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1).map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[modalStyles.option, d === day ? modalStyles.optionSelected : null]}
                    onPress={() => setDay(d)}
                  >
                    <Text style={[modalStyles.optionText, d === day ? modalStyles.optionTextSelected : null]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView style={modalStyles.pickerColumn} showsVerticalScrollIndicator={false}>
                {years.map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[modalStyles.option, y === year ? modalStyles.optionSelected : null]}
                    onPress={() => setYear(y)}
                  >
                    <Text style={[modalStyles.optionText, y === year ? modalStyles.optionTextSelected : null]}>
                      {y}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={modalStyles.buttonRow}>
              <TouchableOpacity style={modalStyles.modalButton} onPress={() => setShow(false)}>
                <Text style={modalStyles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modalStyles.modalButton}
                onPress={handleConfirm}
              >
                <Text style={modalStyles.modalButtonText}>Select</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  }
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dateModal: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#3d4076"
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6
  },
  optionSelected: {
    backgroundColor: "rgba(91,95,151,0.12)"
  },
  optionText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center"
  },
  optionTextSelected: {
    fontWeight: "700",
    color: "#3d4076"
  },
  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  pickerColumn: {
    width: "30%",
    maxHeight: 260
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 14
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(91,95,151,0.12)",
    marginLeft: 8,
  },
  modalButtonText: {
    color: "#3d4076",
    fontWeight: "700"
  },
});

export default FormDatePicker;
