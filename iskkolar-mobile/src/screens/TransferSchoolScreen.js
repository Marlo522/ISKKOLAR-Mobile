import React, { useState, useEffect, useRef, useContext } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert, Modal, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";

export default function TransferSchoolScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  
  const [values, setValues] = useState({
    newSchool: "",
    newProgram: "",
    effectiveYear: "2026-2027",
    effectiveTerm: "1st Semester",
    reason: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [completeStage, setCompleteStage] = useState("none");
  const [selectVisible, setSelectVisible] = useState(false);
  
  const termOptions = ["1st Semester", "2nd Semester", "Summer"];

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
  }, [completeStage, submitting]);

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
    if (completeStage === "success") {
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

  const submitRequest = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setCompleteStage("success");
    }, 1500);
  };

  const renderReadOnly = (label, value) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.input, styles.readOnlyInput]}>
        <Text style={styles.readOnlyText}>{value}</Text>
      </View>
    </View>
  );

  const renderInput = (label, key, placeholder) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#a9b1c0"
        value={values[key]}
        onChangeText={(text) => setValues({ ...values, [key]: text })}
      />
    </View>
  );

  const renderTextArea = (label, key, placeholder) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder={placeholder}
        placeholderTextColor="#a9b1c0"
        multiline
        numberOfLines={4}
        value={values[key]}
        onChangeText={(text) => setValues({ ...values, [key]: text })}
      />
    </View>
  );

  if (completeStage === "success") {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons name="checkmark-circle" size={120} color="#29d0a5" />
          </Animated.View>
          <Text style={styles.completeText}>Request Submitted!</Text>
          <Text style={styles.completeSub}>Your transfer school request has been sent for approval. We will notify you once it's processed.</Text>
          <TouchableOpacity style={styles.submitBtnOk} onPress={() => navigation.navigate("ScholarDashboardMain")}>
            <Text style={styles.submitBtnOkText}>Return Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (submitting) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="sync-circle" size={110} color="#4f5fc5" />
          </Animated.View>
          <Text style={styles.completeText}>Processing Request...</Text>
          <Text style={styles.completeSub}>Please wait while we securely transmit your transfer details.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#5b6095" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.superTitle}>TRANSFER SCHOOL REQUEST</Text>
          <Text style={styles.mainTitle}>Submit a Transfer Update</Text>
          <Text style={styles.subTitle}>Your current details are auto-filled from your application and grade compliance.</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <Animated.View style={{ opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          
          <View style={styles.formSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.verticalPill} />
              <Text style={styles.sectionTitle}>Current Academic Information</Text>
            </View>

            <View style={styles.rowTwoCol}>
              <View style={styles.colHalf}>
                {renderReadOnly("Current School", user?.school || "FEU Tech")}
              </View>
              <View style={styles.colHalf}>
                {renderReadOnly("Current Program", user?.course || "BSIT")}
              </View>
            </View>

            {renderReadOnly("Current GWA", user?.gwa || "Auto-filled from grade compliance")}
          </View>

          <View style={styles.formSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.verticalPill} />
              <Text style={styles.sectionTitle}>Transfer Details</Text>
            </View>

            <View style={styles.rowTwoCol}>
              <View style={styles.colHalf}>
                {renderInput("New School", "newSchool", "Target university or college")}
              </View>
              <View style={styles.colHalf}>
                {renderInput("New Program / Course", "newProgram", "Program you are transferring to")}
              </View>
            </View>

            <View style={styles.rowTwoCol}>
              <View style={styles.colHalf}>
                {renderInput("Effective Academic Year", "effectiveYear", "2026-2027")}
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.label}>Effective Term</Text>
                <TouchableOpacity 
                  style={styles.pickerInput}
                  onPress={() => setSelectVisible(true)}
                >
                  <Text style={styles.pickerText}>{values.effectiveTerm}</Text>
                  <Ionicons name="chevron-down" size={20} color="#6b72aa" />
                </TouchableOpacity>
              </View>
            </View>

            {renderTextArea("Reason for Transfer", "reason", "Provide a short explanation for the transfer request.")}
          </View>

          <View style={styles.formSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.verticalPill} />
              <Text style={styles.sectionTitle}>Supporting Documents</Text>
            </View>
            <Text style={[styles.label, { marginBottom: 12 }]}>Certificate of Registration (New School)</Text>
            <TouchableOpacity style={styles.uploadBoxDashed} onPress={() => Alert.alert("Upload", "File picker stub.")}>
              <Text style={styles.uploadBoxTitle}>Tap to upload</Text>
              <Text style={styles.uploadBoxSubtext}>Latest COR from the receiving school</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate("ScholarDashboardMain")}>
          <Text style={styles.btnSecondaryText}>Back to Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} onPress={submitRequest}>
          <Text style={styles.btnPrimaryText}>Submit Transfer Request</Text>
        </TouchableOpacity>
      </View>

      {/* Term Selector Modal */}
      <Modal visible={selectVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setSelectVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setSelectVisible(false)} />
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Term</Text>
              <TouchableOpacity onPress={() => setSelectVisible(false)}>
                <Ionicons name="close" size={24} color="#4f5fc5" />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {termOptions.map((opt, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.modalOption, values.effectiveTerm === opt && styles.modalOptionActive]}
                  onPress={() => {
                    setValues({ ...values, effectiveTerm: opt });
                    setSelectVisible(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, values.effectiveTerm === opt && styles.modalOptionTextActive]}>{opt}</Text>
                  {values.effectiveTerm === opt && (
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fbfbfe" },
  header: { paddingHorizontal: 24, paddingBottom: 16, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ccd1ed", backgroundColor: "#fff" },
  backBtn: { width: 42, height: 42, borderRadius: 10, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#dbe2f6" },
  headerTitles: { flex: 1, paddingLeft: 16 },
  superTitle: { fontSize: 11, fontWeight: "700", color: "#5b61aa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  mainTitle: { fontSize: 20, fontWeight: "900", color: "#1c2131", letterSpacing: -0.3, marginBottom: 2 },
  subTitle: { fontSize: 12, color: "#6e7798", fontWeight: "500" },
  
  content: { flex: 1 },
  formSection: { paddingHorizontal: 24, paddingTop: 24 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  verticalPill: { width: 4, height: 20, backgroundColor: '#5b61aa', borderRadius: 2, marginRight: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#2d3a7c" },
  
  row: { marginBottom: 16 },
  label: { fontWeight: "600", color: "#1c2131", fontSize: 13, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#eaecf0", borderRadius: 10, paddingHorizontal: 16, backgroundColor: "#ffffff", color: "#1c2131", fontSize: 13, height: 50 },
  readOnlyInput: { backgroundColor: "#f4f5f8", borderColor: "#eaecf0", justifyContent: 'center' },
  readOnlyText: { color: "#8a94b5", fontSize: 13 },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  
  rowTwoCol: { flexDirection: "row", gap: 12 },
  colHalf: { flex: 1 },
  
  pickerInput: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#eaecf0", borderRadius: 10, paddingHorizontal: 16, backgroundColor: "#ffffff", height: 50 },
  pickerText: { color: "#1c2131", fontSize: 13 },
  
  uploadBoxDashed: { borderWidth: 1, borderColor: "#bcc4da", borderStyle: "dashed", borderRadius: 12, paddingVertical: 20, paddingHorizontal: 16, backgroundColor: "#f8f9fc", alignItems: "flex-start" },
  uploadBoxTitle: { color: "#4f5ec4", fontSize: 14, fontWeight: "700", marginBottom: 4 },
  uploadBoxSubtext: { color: "#8a94b5", fontSize: 11, fontWeight: "500" },
  
  footer: { flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 30, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f0f2fb', backgroundColor: '#fff' },
  btnSecondary: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: '#dce1f0', marginRight: 12, flex: 1, alignItems: 'center' },
  btnSecondaryText: { color: '#4f5ec4', fontWeight: '700', fontSize: 14 },
  btnPrimary: { backgroundColor: "#5b61a7", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, flex: 1.5, alignItems: "center", shadowColor: "#2d3a7c", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 4 },
  btnPrimaryText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  completeText: { fontSize: 22, fontWeight: "900", color: "#1c2131", marginTop: 24, marginBottom: 12, textAlign: 'center' },
  completeSub: { textAlign: "center", color: "#6e7798", fontSize: 15, lineHeight: 22, marginBottom: 32 },
  submitBtnOk: { borderRadius: 12, backgroundColor: "#5b61a7", paddingVertical: 14, paddingHorizontal: 40 },
  submitBtnOkText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "50%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#e4e8f8" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1c2131" },
  modalScroll: { paddingHorizontal: 16, paddingTop: 16 },
  modalOption: { paddingVertical: 16, paddingHorizontal: 16, borderRadius: 12, marginBottom: 8, backgroundColor: '#f8f9ff', borderWidth: 1, borderColor: '#e4e8f8' },
  modalOptionActive: { backgroundColor: '#4f5fc5', borderColor: '#4f5fc5' },
  modalOptionText: { fontSize: 15, color: '#4f5fc5', fontWeight: '700' },
  modalOptionTextActive: { color: '#fff' },
});
