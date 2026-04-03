import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert, Modal, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function GradeComplianceScreen({ navigation }) {
  const [step, setStep] = useState(-1);
  const [values, setValues] = useState({
    scholarshipType: "Nationwide Scholarship Program",
    academicYear: "2025 - 2026",
    semester: "2nd",
  });
  
  const [uploadText, setUploadText] = useState({ gradeReport: "" });
  const [submitting, setSubmitting] = useState(false);
  const [completeStage, setCompleteStage] = useState("none");
  const [selectVisible, setSelectVisible] = useState(false);
  const [selectKey, setSelectKey] = useState(null);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    stepAnim.setValue(0);
    Animated.timing(stepAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [step, completeStage, submitting]);

  useEffect(() => {
    if (submitting) {
      spinAnim.setValue(0);
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [submitting, spinAnim]);

  useEffect(() => {
    if (completeStage === "preAssessment") {
      scaleAnim.setValue(0.5);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }).start();
    }
  }, [completeStage, scaleAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const submitApplication = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setCompleteStage("preAssessment");
    }, 1500);
  };

  const renderInput = (label, key, placeholder = null) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={values[key]}
        placeholder={placeholder || `Enter ${label}`}
        onChangeText={(text) => setValues({ ...values, [key]: text })}
        style={styles.input}
      />
    </View>
  );

  const renderSelect = (label, key, options) => (
    <>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={styles.yearPickerInput}
          onPress={() => {
            setSelectKey(key);
            setSelectVisible(true);
          }}
        >
          <Text style={styles.yearPickerText}>{values[key] || "Select"}</Text>
          <Ionicons name="arrow-down" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={selectVisible && selectKey === key}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectVisible(false)}
      >
        <View style={styles.yearPickerModal}>
          <View style={styles.yearPickerContent}>
            <View style={styles.yearPickerHeader}>
              <Text style={styles.yearPickerTitle}>Select Option</Text>
              <TouchableOpacity onPress={() => setSelectVisible(false)}>
                <Ionicons name="close" size={24} color="#4f5fc5" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.yearPickerScroll} showsVerticalScrollIndicator={true}>
              <View style={{ flexDirection: "column", paddingBottom: 20 }}>
                {options.map((opt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.yearPickerOption,
                      { width: "100%", marginBottom: 8, paddingVertical: 14 },
                      values[key] === opt && styles.yearPickerOptionActive,
                    ]}
                    onPress={() => {
                      setValues({ ...values, [key]: opt });
                      setSelectVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.yearPickerOptionText,
                        values[key] === opt && styles.yearPickerOptionTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );

  const renderUpload = (label, key) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.uploadBtn}
        onPress={() => Alert.alert("File upload", "File picker stub.")}
      >
        <Text style={styles.uploadText}>{uploadText[key] || "File Upload"}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTodoCard = (title, deadline, status, req, gwa) => (
    <View style={styles.todoCard}>
      <View style={styles.todoHeader}>
        <Text style={styles.todoTitle}>{title}</Text>
        <View style={styles.badgePending}>
          <Text style={styles.badgePendingText}>Pending</Text>
        </View>
      </View>
      
      <View style={styles.todoContentRow}>
        <View style={styles.todoCol}>
          <Text style={styles.todoLabel}>Deadline</Text>
          <Text style={styles.todoValue}>{deadline}</Text>
        </View>
        <View style={styles.todoCol}>
          <Text style={styles.todoLabel}>Status</Text>
          <Text style={styles.todoValue}>{status}</Text>
        </View>
      </View>

      <View style={styles.todoContentRow}>
        <View style={styles.todoCol}>
          <Text style={styles.todoLabel}>Requirement</Text>
          <Text style={styles.todoValue}>{req}</Text>
        </View>
        <View style={styles.todoCol}>
          <Text style={styles.todoLabel}>GWA Needed</Text>
          <Text style={styles.todoValue}>{gwa}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.submitBtnAction} onPress={() => setStep(0)}>
        <Text style={styles.submitBtnActionText}>Submit Grades Now</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep = () => {
    if (completeStage === "preAssessment") {
      return (
        <View style={styles.centered}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons name="checkmark-circle" size={120} color="#29d0a5" />
          </Animated.View>
          <Text style={[styles.completeText, { marginTop: 8 }]}>Submission Successful!</Text>
          <Text style={{ textAlign: "center", color: "#6b72aa", paddingHorizontal: 30, marginBottom: 30, fontSize: 16, lineHeight: 22 }}>
            Your application has been pre-assessed and forwarded securely. Please wait for further announcements.
          </Text>
          <TouchableOpacity style={styles.submitBtnOk} onPress={() => navigation.navigate("ScholarDashboardMain")}>
            <Text style={styles.submitBtnOkText}>Return Home</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (submitting) {
      return (
        <View style={styles.centered}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="sync-circle" size={110} color="#4f5fc5" />
          </Animated.View>
          <Text style={styles.completeText}>Evaluating Application...</Text>
          <Text style={{ textAlign: "center", color: "#848baf", paddingHorizontal: 40, fontSize: 15 }}>
            Please hold on while we securely process your documents.
          </Text>
        </View>
      );
    }

    switch (step) {
      case -1:
        return (
          <View style={styles.landingContainer}>
            <Text style={styles.landingHeader}>To do</Text>
            {renderTodoCard(
              "1st Semester AY 2025-2026",
              "March 15, 2026", "Not Submitted",
              "Official Grades", "85% or higher"
            )}
            {renderTodoCard(
              "2nd Semester AY 2025-2026",
              "August 1, 2026", "Not Submitted",
              "Official Grades", "85% or higher"
            )}
          </View>
        );

      case 0:
        return (
          <View style={styles.formContainer}>
            <View style={styles.underlinedTitleWrapper}>
              <Text style={styles.underlinedTitle}>Academic Year 2026-2027</Text>
            </View>
            {renderInput("Current Scholarship", "scholarshipType")}
            {renderInput("Current Academic Year", "academicYear")}
            {renderSelect("Semester", "semester", ["1st", "2nd", "Summer"])}
            {renderUpload("Grade Report", "gradeReport")}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressHeader}>
        <TouchableOpacity onPress={() => (step > -1 ? setStep(-1) : navigation.goBack())} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#5b6095" />
        </TouchableOpacity>
        
        <Text style={styles.titleLanding}>Grade Compliance</Text>
        <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8}>
          <Ionicons name="notifications-outline" size={24} color="#6a72b2" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 60 }}>
        <Animated.View style={{ opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          {renderStep()}
        </Animated.View>
      </ScrollView>

      {!submitting && completeStage === "none" && step === 0 && (
        <View style={{ paddingHorizontal: 24, paddingBottom: 30 }}>
          <TouchableOpacity style={styles.nextBtn} onPress={submitApplication}>
            <Text style={styles.nextBtnText}>Submit Application</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fc" },
  progressHeader: { flexDirection: "row", alignItems: "center", paddingTop: 16, paddingBottom: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderColor: "#ccd1ed" },
  backBtn: { width: 42, height: 42, borderRadius: 10, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#dbe2f6" },
  empty: { width: 42 },
  titleLanding: { flex: 1, marginLeft: 16, fontSize: 20, fontWeight: "900", color: "#4f5fc5" },
  bellBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e4e8f6", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  formContainer: { paddingHorizontal: 24, paddingTop: 16 },
  landingContainer: { paddingHorizontal: 20, paddingTop: 16 },
  landingHeader: { fontSize: 18, fontWeight: "900", color: "#111", marginBottom: 16, marginLeft: 2 },
  todoCard: { backgroundColor: "#fdfdff", borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2, borderWidth: 1, borderColor: "#e4e8f6" },
  todoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  todoTitle: { fontSize: 15, fontWeight: "900", color: "#111" },
  badgePending: { backgroundColor: "#ffa7a7", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  badgePendingText: { color: "#d91e1e", fontSize: 11, fontWeight: "800" },
  todoContentRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  todoCol: { flex: 1 },
  todoLabel: { color: "#111", fontSize: 12, fontWeight: "800", marginBottom: 4 },
  todoValue: { color: "#888", fontSize: 13, fontWeight: "500" },
  submitBtnAction: { backgroundColor: "#5b61a7", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 4, shadowColor: "#4f5fc5", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 2 },
  submitBtnActionText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  content: { flex: 1 },
  underlinedTitleWrapper: { alignSelf: "flex-start", marginBottom: 20 },
  underlinedTitle: { fontSize: 16, fontWeight: "900", color: "#111", borderBottomWidth: 2, borderBottomColor: "#111", paddingBottom: 4 },
  row: { marginBottom: 16 },
  label: { fontWeight: "600", color: "#1c2131", fontSize: 13, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#a9b1c0", borderRadius: 12, paddingHorizontal: 16, paddingVertical: Platform.OS === "ios" ? 14 : 12, backgroundColor: "#ffffff", color: "#555", fontSize: 15 },
  uploadBtn: { borderWidth: 1, borderColor: "#a9b1c0", borderRadius: 12, height: 50, justifyContent: "center", paddingHorizontal: 16, backgroundColor: "#ffffff" },
  uploadText: { color: "#777", fontSize: 15, alignSelf: "center" },
  yearPickerInput: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#a9b1c0", borderRadius: 12, paddingHorizontal: 16, paddingVertical: Platform.OS === "ios" ? 14 : 12, backgroundColor: "#ffffff", height: 50 },
  yearPickerText: { color: "#555", fontSize: 15, fontWeight: "500" },
  yearPickerModal: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  yearPickerContent: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80%", paddingTop: 16 },
  yearPickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#e4e8f8" },
  yearPickerTitle: { fontSize: 18, fontWeight: "800", color: "#3d4fa0" },
  yearPickerScroll: { paddingHorizontal: 16, paddingVertical: 12 },
  yearPickerOption: { width: "100%", paddingVertical: 12, marginBottom: 8, borderRadius: 10, borderWidth: 1, borderColor: "#d7def8", backgroundColor: "#f8f9ff", alignItems: "center" },
  yearPickerOptionActive: { backgroundColor: "#4f5fc5", borderColor: "#4f5fc5" },
  yearPickerOptionText: { fontSize: 16, fontWeight: "700", color: "#4f5fc5" },
  yearPickerOptionTextActive: { color: "#fff" },
  nextBtn: { backgroundColor: "#5b61a7", borderRadius: 14, paddingVertical: 16, alignItems: "center", shadowColor: "#2d3a7c", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 4 },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  centered: { alignItems: "center", justifyContent: "center", marginTop: 120 },
  completeText: { fontSize: 22, fontWeight: "800", color: "#3f4ca8", marginTop: 16, marginBottom: 8 },
  submitBtnOk: { borderRadius: 12, backgroundColor: "#4f5fc5", paddingVertical: 14, paddingHorizontal: 30, marginTop: 10 },
  submitBtnOkText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
