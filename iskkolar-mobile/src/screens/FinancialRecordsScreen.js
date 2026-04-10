import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function FinancialRecordsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(-1); // -1: Landing, 10: Other Study Needs, 20: Upload Receipt
  const [values, setValues] = useState({
    itemDescription: "",
    subjectCourse: "",
    whereToPurchase: "",
    amountRequested: "",
    purpose: "",
    purchaseDate: "",
    additionalNotes: ""
  });
  
  const [uploadText, setUploadText] = useState({ 
    supportingDocument: "",
    officialReceipt: "" 
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [completeStage, setCompleteStage] = useState("none");

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
    if (completeStage === "preAssessment" || completeStage === "success") {
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
  
  const submitReceipt = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setCompleteStage("success");
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

  const renderTextArea = (label, key, placeholder) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={values[key]}
        placeholder={placeholder}
        multiline
        numberOfLines={4}
        onChangeText={(text) => setValues({ ...values, [key]: text })}
        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
      />
    </View>
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

  const renderReceiptUploadArea = () => (
    <View style={styles.row}>
      <Text style={styles.sectionTitleHeader}>|Upload Official Receipt</Text>
      <TouchableOpacity 
        style={styles.receiptUploadBox}
        onPress={() => Alert.alert("Upload", "Camera/Gallery picker stub.")}
      >
        <Text style={styles.receiptUploadBoxTitle}>Tap to Upload Receipt</Text>
        <Text style={styles.receiptUploadBoxSub}>Take a clear photo or upload from gallery.</Text>
        <Text style={styles.receiptUploadBoxSub}>Make sure the amount and date are visible.</Text>
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
    
    if (completeStage === "success") {
      return (
        <View style={styles.centered}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons name="checkmark-circle" size={120} color="#29d0a5" />
          </Animated.View>
          <Text style={[styles.completeText, { marginTop: 8 }]}>Receipt Uploaded!</Text>
          <Text style={{ textAlign: "center", color: "#6b72aa", paddingHorizontal: 30, marginBottom: 30, fontSize: 16, lineHeight: 22 }}>
            Your receipt has been successfully submitted for processing.
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
          <Text style={styles.completeText}>Processing...</Text>
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
            <View style={styles.pageHeaderBox}>
              <Text style={styles.pageHeaderTitle}>Financial Records</Text>
              <Text style={styles.pageHeaderSub}>Complete disbursement history</Text>
            </View>

            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Received</Text>
              <Text style={styles.totalValue}>₱ 1,500</Text>
              <View style={styles.lineDivider} />
              <View style={styles.totalStatsRow}>
                <View style={styles.totalStatCol}>
                  <Text style={styles.totalStatNum}>₱1,500</Text>
                  <Text style={styles.totalStatLabel}>This Year</Text>
                </View>
                <View style={styles.totalStatColRight}>
                  <Text style={styles.totalStatNum}></Text>
                  <Text style={styles.totalStatLabel}>Transactions</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionTitleBlock}>
              <Text style={styles.sectionTitle}>Transaction History</Text>
              <Text style={styles.sectionSubtitle}>2026</Text>
            </View>

            <View style={styles.txCard}>
              <View style={styles.txHeaderRow}>
                <View style={styles.txIconBox}>
                  <Ionicons name="cash" size={28} color="#2cae57" />
                </View>
                <View style={styles.txHeaderTextCol}>
                  <Text style={styles.txHeaderTitle}>Scholarship Disbursement</Text>
                  <Text style={styles.txHeaderSub}>SY 2025 - 2026</Text>
                </View>
              </View>
              <View style={styles.lineDivider} />
              <View style={styles.txFooterRow}>
                <View style={styles.txFooterCol}>
                  <Text style={styles.txFooterLabel}>Date Received</Text>
                  <Text style={styles.txFooterValue}>January 15, 2026</Text>
                </View>
                <View style={styles.txFooterColRight}>
                  <Text style={styles.txFooterLabel}>Status</Text>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>Completed</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.sectionTitleBlock}>
              <Text style={styles.sectionTitle}>Request Financial Assistance</Text>
              <Text style={styles.sectionSubtitle}>For study-related needs</Text>
            </View>

            <TouchableOpacity style={styles.actionBlock} onPress={() => setStep(10)}>
              <Ionicons name="add-circle-outline" size={30} color="#fff" />
              <View style={styles.actionBlockTextCol}>
                <Text style={styles.actionBlockTitle}>Other Study Needs</Text>
                <Text style={styles.actionBlockSub}>Books, Uniforms, School Supplies & other</Text>
              </View>
              <Ionicons name="arrow-forward" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBlock, { backgroundColor: '#29d0a5', marginTop: 12 }]} onPress={() => setStep(20)}>
              <Ionicons name="receipt-outline" size={30} color="#fff" />
              <View style={styles.actionBlockTextCol}>
                <Text style={styles.actionBlockTitle}>Submit Receipt</Text>
                <Text style={styles.actionBlockSub}>Upload liquidation documents</Text>
              </View>
              <Ionicons name="arrow-forward" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        );

      case 10:
        return (
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitleHeader}>|Item Details</Text>
            {renderInput("Item / Description", "itemDescription")}
            {renderInput("Subject / Course", "subjectCourse")}
            {renderInput("Where to Purchase", "whereToPurchase")}
            
            <Text style={styles.sectionTitleHeader}>|Amount Requested</Text>
            {renderInput("", "amountRequested", "Php 500")}
            
            <Text style={styles.sectionTitleHeader}>|Purpose / Justification</Text>
            {renderTextArea("", "purpose", "Explain why this is needed")}
            
            {renderUpload("Supporting Document (Optional)", "supportingDocument")}
          </View>
        );
        
      case 20: 
        return (
          <View style={styles.formContainer}>
            {renderReceiptUploadArea()}
            {renderInput("Purchase Date", "purchaseDate", "March 2, 2026")}
            
            <TouchableOpacity style={styles.addAnotherBtn}>
              <Ionicons name="add-circle-outline" size={20} color="#4f5fc5" style={{marginRight: 6}}/>
              <Text style={styles.addAnotherText}>Add Another Receipt</Text>
            </TouchableOpacity>
            
            <Text style={styles.sectionTitleHeader}>|Additional Notes (Optional)</Text>
            {renderTextArea("", "additionalNotes", "e.g. Bought at National Bookstore SM City. Receipt stapled together with price tag...")}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {step === -1 ? (
        <View style={[styles.landingHeaderTop, { paddingTop: insets.top + 16 }]}>
          <View style={styles.profileRow}>
            <View style={styles.userIconWrapper}>
              <Ionicons name="person-outline" size={24} color="#6472d9" />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.userName}>Dominic Madla</Text>
              <Text style={styles.userRole}>Active Scholar</Text>
            </View>
            <TouchableOpacity style={styles.bellBtnLanding} activeOpacity={0.8} onPress={() => navigation.navigate("Notifications")}>
              <Ionicons name="notifications-outline" size={22} color="#6472d9" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[styles.progressHeader, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => setStep(-1)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#5b6095" />
          </TouchableOpacity>
          <Text style={styles.titleLanding}>Financial Assistance</Text>
          <View style={styles.empty} />
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 60 }}>
        <Animated.View style={{ opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          {renderStep()}
        </Animated.View>
      </ScrollView>

      {!submitting && completeStage === "none" && step === 10 && (
        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity style={styles.nextBtn} onPress={submitApplication}>
            <Text style={styles.nextBtnText}>Submit Application</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {!submitting && completeStage === "none" && step === 20 && (
        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity style={styles.nextBtn} onPress={submitReceipt}>
            <Text style={styles.nextBtnText}>Submit Receipt</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fc" },
  landingHeaderTop: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#e4e8f8", backgroundColor: "#fff" },
  profileRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  userIconWrapper: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e8eAFD', justifyContent: 'center', alignItems: 'center', marginRight: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  headerTextCol: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '900', color: '#080d19', letterSpacing: -0.3, marginBottom: 2 },
  userRole: { fontSize: 13, color: '#344054', fontWeight: '600' },
  bellBtnLanding: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e8eaff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  
  progressHeader: { flexDirection: "row", alignItems: "center", paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderColor: "#ccd1ed", backgroundColor: "#fff" },
  backBtn: { width: 42, height: 42, borderRadius: 10, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#dbe2f6" },
  empty: { width: 42 },
  titleLanding: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "900", color: "#4f5fc5" },
  
  landingContainer: { paddingHorizontal: 20, paddingTop: 20 },
  pageHeaderBox: { marginBottom: 20 },
  pageHeaderTitle: { fontSize: 20, fontWeight: "900", color: "#4f5ec4" },
  pageHeaderSub: { fontSize: 13, color: "#111", fontWeight: "600", marginTop: 2 },
  
  totalCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2, borderWidth: 1, borderColor: "#e4e8f6", alignItems: "center" },
  totalLabel: { fontSize: 14, fontWeight: "800", color: "#333", marginBottom: 8 },
  totalValue: { fontSize: 36, fontWeight: "900", color: "#1d844c", marginBottom: 16 },
  lineDivider: { height: 1, backgroundColor: "#d4dae8", width: "100%", marginBottom: 16 },
  totalStatsRow: { flexDirection: "row", width: "100%", justifyContent: "space-between" },
  totalStatCol: { flex: 1 },
  totalStatColRight: { flex: 1, alignItems: "flex-end" },
  totalStatNum: { fontSize: 18, fontWeight: "900", color: "#111", marginBottom: 2 },
  totalStatLabel: { fontSize: 12, fontWeight: "600", color: "#888" },
  
  sectionTitleBlock: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: "#111" },
  sectionSubtitle: { fontSize: 13, color: "#111", fontWeight: "500", marginTop: 2 },
  
  txCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2, borderWidth: 1, borderColor: "#e4e8f6" },
  txHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  txIconBox: { backgroundColor: "#daf3e1", width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 12 },
  txHeaderTextCol: { flex: 1 },
  txHeaderTitle: { fontSize: 15, fontWeight: "900", color: "#111" },
  txHeaderSub: { fontSize: 12, fontWeight: "600", color: "#333", marginTop: 2 },
  txFooterRow: { flexDirection: "row", justifyContent: "space-between" },
  txFooterCol: { flex: 1 },
  txFooterColRight: { alignItems: "flex-end" },
  txFooterLabel: { fontSize: 12, color: "#888", fontWeight: "600", marginBottom: 4 },
  txFooterValue: { fontSize: 13, color: "#111", fontWeight: "900" },
  statusPill: { backgroundColor: "#2ce491", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusPillText: { fontSize: 11, fontWeight: "900", color: "#00562b", letterSpacing: 0.3 },
  
  actionBlock: { backgroundColor: "#5b61aa", borderRadius: 14, flexDirection: "row", alignItems: "center", padding: 16, shadowColor: "#4f5fc5", shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 4 },
  actionBlockTextCol: { flex: 1, marginLeft: 16 },
  actionBlockTitle: { fontSize: 15, fontWeight: "800", color: "#fff", marginBottom: 2 },
  actionBlockSub: { fontSize: 11, color: "#dbe0f9", fontWeight: "500" },
  
  formContainer: { paddingHorizontal: 20, paddingTop: 16 },
  sectionTitleHeader: { fontSize: 18, fontWeight: "900", color: "#4f5fc5", marginBottom: 12, marginTop: 4 },
  row: { marginBottom: 16 },
  label: { fontWeight: "600", color: "#1c2131", fontSize: 13, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#a9b1c0", borderRadius: 12, paddingHorizontal: 16, paddingVertical: Platform.OS === "ios" ? 14 : 12, backgroundColor: "#ffffff", color: "#555", fontSize: 15 },
  uploadBtn: { borderWidth: 1, borderColor: "#a9b1c0", borderRadius: 12, height: 50, justifyContent: "center", paddingHorizontal: 16, backgroundColor: "#ffffff" },
  uploadText: { color: "#777", fontSize: 15, alignSelf: "center" },
  
  receiptUploadBox: { borderWidth: 1, borderColor: "#bcc4da", backgroundColor: "#fff", borderRadius: 12, paddingVertical: 24, alignItems: "center", justifyContent: "center" },
  receiptUploadBoxTitle: { color: "#5b6095", fontSize: 16, fontWeight: "800", marginBottom: 8 },
  receiptUploadBoxSub: { color: "#8a94b5", fontSize: 12, fontWeight: "500", textAlign: "center" },
  
  addAnotherBtn: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  addAnotherText: { color: "#4f5fc5", fontSize: 14, fontWeight: "800" },
  
  bottomBtnContainer: { paddingHorizontal: 24, paddingBottom: 30 },
  nextBtn: { backgroundColor: "#5b61a7", borderRadius: 14, paddingVertical: 16, alignItems: "center", shadowColor: "#2d3a7c", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 4 },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  
  content: { flex: 1 },
  centered: { alignItems: "center", justifyContent: "center", marginTop: 120 },
  completeText: { fontSize: 22, fontWeight: "800", color: "#3f4ca8", marginTop: 16, marginBottom: 8 },
  submitBtnOk: { borderRadius: 12, backgroundColor: "#4f5fc5", paddingVertical: 14, paddingHorizontal: 30, marginTop: 10 },
  submitBtnOkText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
