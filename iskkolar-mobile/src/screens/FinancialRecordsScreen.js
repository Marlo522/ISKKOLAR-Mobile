import React, { useState, useEffect, useRef, useContext } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert, Animated, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { AuthContext } from "../context/AuthContext";
import { useFinancialAssistance } from "../hooks/useFinancialAssistance";
import { financialRecordsService } from "../services/financialRecordsService";

export default function FinancialRecordsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(-1); // -1: Landing, 10: Other Study Needs, 20: Upload Receipt
  const [values, setValues] = useState({
    itemDescription: "",
    subjectCourse: "",
    whereToPurchase: "",
    amountRequested: "",
    purpose: "",
  });
  
  const [receiptItems, setReceiptItems] = useState([
    { file: null, purchaseDate: "", additionalNotes: "" }
  ]);
  
  const [supportingDocument, setSupportingDocument] = useState(null);
  const [completeStage, setCompleteStage] = useState("none");
  
  const [dateVisible, setDateVisible] = useState(false);
  const [dateIndex, setDateIndex] = useState(null);
  
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Financial Records State
  const [transactions, setTransactions] = useState([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [recordsError, setRecordsError] = useState(null);

  const {
    submitting,
    error,
    fieldErrors,
    clearFieldError,
    validateForm,
    submitApplication,
  } = useFinancialAssistance();

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
    const fetchRecords = async () => {
      try {
        setIsLoadingRecords(true);
        setRecordsError(null);
        const result = await financialRecordsService.getScholarRecords();
        if (result.success) {
          setTransactions(result.data);
        } else {
          setRecordsError(result.message || "Failed to load records");
        }
      } catch (err) {
        console.error("Failed to fetch financial records:", err);
        setRecordsError(err.message || "Could not connect to the server.");
      } finally {
        setIsLoadingRecords(false);
      }
    };

    fetchRecords();
  }, []);

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

  const pickDocument = async (isSupporting) => {
    if (!isSupporting) {
      Alert.alert("Error", "Use pickReceipt for receipts");
      return;
    }

    const handleResult = (result) => {
      if (!result.canceled && result.assets && result.assets.length > 0) {
        let file = result.assets[0];
        if (!file.name) {
          file = { ...file, name: file.uri.split('/').pop(), type: file.mimeType || 'image/jpeg' };
        }
        setSupportingDocument(file);
      }
    };

    Alert.alert(
      "Upload Document",
      "Choose an option",
      [
        {
          text: "Take Photo",
          onPress: async () => {
            try {
              const permission = await ImagePicker.requestCameraPermissionsAsync();
              if (permission.status !== "granted") {
                Alert.alert("Permission Required", "Camera permission is required to take photos.");
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.8,
              });
              handleResult(result);
            } catch (err) {
              Alert.alert("Error", "Could not capture image.");
            }
          }
        },
        {
          text: "Choose File",
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: "*/*",
                copyToCacheDirectory: true,
              });
              handleResult(result);
            } catch (err) {
              Alert.alert("Error", "Failed to pick document.");
            }
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const pickReceipt = async (index) => {
    const handleResult = (result) => {
      if (!result.canceled && result.assets && result.assets.length > 0) {
        let file = result.assets[0];
        if (!file.name) {
          file = { ...file, name: file.uri.split('/').pop(), type: file.mimeType || 'image/jpeg' };
        }
        const newReceiptItems = [...receiptItems];
        newReceiptItems[index].file = file;
        setReceiptItems(newReceiptItems);
        clearFieldError(`receipt_file_${index}`);
      }
    };

    Alert.alert(
      "Upload Receipt",
      "Choose an option",
      [
        {
          text: "Take Photo",
          onPress: async () => {
            try {
              const permission = await ImagePicker.requestCameraPermissionsAsync();
              if (permission.status !== "granted") {
                Alert.alert("Permission Required", "Camera permission is required to take photos.");
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.8,
              });
              handleResult(result);
            } catch (err) {
              Alert.alert("Error", "Could not capture image.");
            }
          }
        },
        {
          text: "Choose File",
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: ["image/*", "application/pdf"],
                copyToCacheDirectory: true,
              });
              handleResult(result);
            } catch (err) {
              Alert.alert("Error", "Failed to pick receipt.");
            }
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const addReceiptItem = () => {
    setReceiptItems([...receiptItems, { file: null, purchaseDate: "", additionalNotes: "" }]);
  };

  const removeReceiptItem = (index) => {
    if (receiptItems.length > 1) {
      const newReceiptItems = [...receiptItems];
      newReceiptItems.splice(index, 1);
      setReceiptItems(newReceiptItems);
    }
  };

  const updateReceiptField = (index, field, value) => {
    const newReceiptItems = [...receiptItems];
    newReceiptItems[index][field] = value;
    setReceiptItems(newReceiptItems);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Pending";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Confirmed":
      case "Released":
        return { bg: "#e6f7ef", text: "#0d7c47" };
      case "Pending":
        return { bg: "#fff8e6", text: "#b5850a" };
      case "Cancelled":
        return { bg: "#ffe6e6", text: "#c00000" };
      default:
        return { bg: "#f3f4f6", text: "#6b7280" };
    }
  };

  const totalReceived = transactions
    .filter((t) => ["Confirmed", "Released"].includes(t.status))
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const submitReceipt = async () => {
    if (!validateForm(values, receiptItems)) {
      return;
    }
    
    try {
      await submitApplication(values, receiptItems, supportingDocument);
      setCompleteStage("success");
    } catch (err) {
      if (!err?.isValidationError) {
         Alert.alert("Submission Failed", err?.message || "An error occurred.");
      }
    }
  };

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(selectedYear - 1); }
    else setSelectedMonth(selectedMonth - 1);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(selectedYear + 1); }
    else setSelectedMonth(selectedMonth + 1);
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    let days = [];
    for (let i = 0; i < firstDay; i++) days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(
        <TouchableOpacity
          key={`day-${i}`}
          style={styles.calendarDay}
          onPress={() => {
            const m = selectedMonth + 1;
            const d = i < 10 ? `0${i}` : i;
            const dateStr = `${m < 10 ? '0' + m : m}/${d}/${selectedYear}`;
            updateReceiptField(dateIndex, 'purchaseDate', dateStr);
            clearFieldError(`receipt_date_${dateIndex}`);
            setDateVisible(false);
          }}
        >
          <Text style={styles.calendarDayText}>{i}</Text>
        </TouchableOpacity>
      );
    }
    return days;
  };

  const renderInput = (label, key, placeholder = null, keyboardType = "default") => (
    <View style={[styles.row, fieldErrors[key] && styles.rowWithError]}>
      <Text style={styles.label}>{label} <Text style={{color: 'red'}}>*</Text></Text>
      <TextInput placeholderTextColor="#888"
        value={values[key]}
        placeholder={placeholder || `Enter ${label}`}
        keyboardType={keyboardType}
        onChangeText={(text) => {
          const sanitizedText = keyboardType === "numeric" ? text.replace(/[^0-9.]/g, '') : text;
          setValues({ ...values, [key]: sanitizedText });
          clearFieldError(key);
        }}
        style={[styles.input, fieldErrors[key] && { borderColor: 'red' }]}
      />
      {fieldErrors[key] && <Text style={styles.errorText}>{fieldErrors[key]}</Text>}
    </View>
  );

  const renderTextArea = (label, key, placeholder, isValueState = true) => {
    const val = isValueState ? values[key] : key;
    const onChange = isValueState 
      ? (text) => { setValues({ ...values, [key]: text }); clearFieldError(key); } 
      : placeholder;
    
    return (
      <View style={[styles.row, isValueState && fieldErrors[key] && styles.rowWithError]}>
        <Text style={styles.label}>{label} {isValueState && <Text style={{color: 'red'}}>*</Text>}</Text>
        <TextInput placeholderTextColor="#888"
          value={val}
          placeholder={isValueState ? placeholder : key}
          multiline
          numberOfLines={4}
          onChangeText={onChange}
          style={[styles.input, { height: 100, textAlignVertical: 'top' }, isValueState && fieldErrors[key] && { borderColor: 'red' }]}
        />
        {isValueState && fieldErrors[key] && <Text style={styles.errorText}>{fieldErrors[key]}</Text>}
      </View>
    );
  };

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
              <Text style={styles.totalValue}>{formatCurrency(totalReceived)}</Text>
              <View style={styles.lineDivider} />
              <View style={styles.totalStatsRow}>
                <View style={styles.totalStatCol}>
                  <Text style={styles.totalStatNum}>{formatCurrency(totalReceived)}</Text>
                  <Text style={styles.totalStatLabel}>This Year</Text>
                </View>
                <View style={styles.totalStatColRight}>
                  <Text style={styles.totalStatNum}>{transactions.length}</Text>
                  <Text style={styles.totalStatLabel}>Transactions</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionTitleBlock}>
              <Text style={styles.sectionTitle}>Transaction History</Text>
              <Text style={styles.sectionSubtitle}>{new Date().getFullYear()}</Text>
            </View>

            {isLoadingRecords ? (
              <View style={[styles.txCard, { alignItems: 'center', paddingVertical: 40 }]}>
                <Text style={{ color: '#888', fontWeight: '600' }}>Loading records...</Text>
              </View>
            ) : recordsError ? (
              <View style={[styles.txCard, { alignItems: 'center', paddingVertical: 30 }]}>
                <Text style={{ color: '#dc2626', fontWeight: '600', textAlign: 'center' }}>{recordsError}</Text>
              </View>
            ) : transactions.length === 0 ? (
              <View style={[styles.txCard, { alignItems: 'center', paddingVertical: 40, borderStyle: 'dashed' }]}>
                <Text style={{ color: '#888', fontWeight: '600' }}>No financial records found.</Text>
              </View>
            ) : (
              transactions.map((tx) => {
                const statusStyle = getStatusStyle(tx.status);
                return (
                  <View key={tx.id} style={styles.txCard}>
                    <View style={styles.txHeaderRow}>
                      <View style={[styles.txIconBox, { backgroundColor: statusStyle.bg }]}>
                        <Ionicons name="cash" size={24} color={statusStyle.text} />
                      </View>
                      <View style={styles.txHeaderTextCol}>
                        <Text style={styles.txHeaderTitle}>{tx.title}</Text>
                        <Text style={styles.txHeaderSub}>{tx.period}</Text>
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusPillText, { color: statusStyle.text }]}>{tx.status}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.lineDivider} />
                    
                    <View style={styles.txFooterRow}>
                      <View style={styles.txFooterCol}>
                        <Text style={styles.txFooterLabel}>Date</Text>
                        <Text style={styles.txFooterValue}>{formatDate(tx.date)}</Text>
                      </View>
                      <View style={styles.txFooterCol}>
                        <Text style={styles.txFooterLabel}>Amount</Text>
                        <Text style={[styles.txFooterValue, { color: '#0d7c47' }]}>{formatCurrency(tx.amount)}</Text>
                      </View>
                      <View style={styles.txFooterColRight}>
                        <Text style={styles.txFooterLabel}>Type</Text>
                        <Text style={styles.txFooterValue}>{tx.type || "Disbursement"}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}

            <View style={styles.sectionTitleBlock}>
              <Text style={styles.sectionTitle}>Request Financial Assistance</Text>
              <Text style={styles.sectionSubtitle}>For study-related needs</Text>
            </View>

            <TouchableOpacity style={[styles.actionBlock, { backgroundColor: '#29d0a5', marginTop: 0 }]} onPress={() => setStep(20)}>
              <Ionicons name="receipt-outline" size={30} color="#fff" />
              <View style={styles.actionBlockTextCol}>
                <Text style={styles.actionBlockTitle}>Submit Receipt</Text>
                <Text style={styles.actionBlockSub}>Upload liquidation documents</Text>
              </View>
              <Ionicons name="arrow-forward" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        );

      case 20: 
        return (
          <View style={styles.formContainer}>
            <Text style={[styles.sectionTitleHeader, { marginBottom: 16 }]}>| Expense Details</Text>
            {renderInput("Item / Description", "itemDescription", "Calculus 10th Edition")}
            {renderInput("Subject / Course", "subjectCourse", "Calculus 1")}
            {renderInput("Where to Purchase", "whereToPurchase", "National Bookstore")}
            {renderInput("Amount Requested", "amountRequested", "500", "numeric")}
            {renderTextArea("Purpose / Justification", "purpose", "Explain why this is needed")}
            
            <Text style={styles.label}>Supporting Document (Optional)</Text>
            <TouchableOpacity 
              style={[styles.receiptUploadBox, { paddingVertical: 20, marginBottom: 32, borderStyle: 'dashed' }]}
              onPress={() => pickDocument(true)}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#f4f6fc', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                 <Ionicons name="push-outline" size={20} color="#4f5fc5" />
              </View>
              <Text style={[styles.receiptUploadBoxTitle, { fontSize: 14 }]}>
                {supportingDocument ? supportingDocument.name : "Upload PDF or Image"}
              </Text>
              {!supportingDocument && <Text style={styles.receiptUploadBoxSub}>Attach price quote, syllabus, or approval memo</Text>}
            </TouchableOpacity>

            <Text style={[styles.sectionTitleHeader, { marginBottom: 16 }]}>| Upload Official Receipt</Text>
            
            {receiptItems.map((item, idx) => (
              <View key={`receipt_${idx}`} style={{ borderWidth: 1, borderColor: '#e4e8f8', borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#4f5ec4' }}>Receipt #{idx + 1}</Text>
                  {receiptItems.length > 1 && (
                    <TouchableOpacity onPress={() => removeReceiptItem(idx)}>
                      <Ionicons name="trash-outline" size={20} color="#ff4444" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={{ fontSize: 13, color: '#6b72aa', marginBottom: 16 }}>Upload the official receipt and add purchase date.</Text>
                
                <View style={[fieldErrors[`receipt_file_${idx}`] && styles.rowWithError]}>
                  <TouchableOpacity 
                    style={[styles.receiptUploadBox, { marginBottom: 16, borderStyle: 'dashed' }, fieldErrors[`receipt_file_${idx}`] && { borderColor: '#dc2626', backgroundColor: '#fff3f3' }]}
                    onPress={() => pickReceipt(idx)}
                  >
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: fieldErrors[`receipt_file_${idx}`] ? '#ffe5e5' : '#f2f4fc', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                      <Ionicons name="push-outline" size={20} color={fieldErrors[`receipt_file_${idx}`] ? '#dc2626' : '#4f5fc5'} />
                    </View>
                    <Text style={styles.receiptUploadBoxTitle}>
                      {item.file ? item.file.name : "Tap to Upload Receipt"}
                    </Text>
                    {!item.file && <Text style={[styles.receiptUploadBoxSub, fieldErrors[`receipt_file_${idx}`] && { color: '#dc2626' }]}>Clear photo or PDF with amount and date</Text>}
                  </TouchableOpacity>
                  {fieldErrors[`receipt_file_${idx}`] && <Text style={[styles.errorText, { marginTop: -12, marginBottom: 16 }]}>{fieldErrors[`receipt_file_${idx}`]}</Text>}
                </View>
                
                <Text style={styles.label}>Purchase Date <Text style={{color: 'red'}}>*</Text></Text>
                <View style={[styles.row, fieldErrors[`receipt_date_${idx}`] && styles.rowWithError]}>
                  <TouchableOpacity
                    style={[styles.datePickerInput, fieldErrors[`receipt_date_${idx}`] && { borderColor: 'red' }]}
                    onPress={() => { setDateIndex(idx); setDateVisible(true); }}
                  >
                    <Text style={[styles.datePickerText, !item.purchaseDate && { color: "#a9b1c0" }]}>{item.purchaseDate || "mm/dd/yyyy"}</Text>
                    <Ionicons name="calendar-outline" size={20} color="#555" />
                  </TouchableOpacity>
                  {fieldErrors[`receipt_date_${idx}`] && <Text style={styles.errorText}>{fieldErrors[`receipt_date_${idx}`]}</Text>}
                </View>
                
                <Text style={styles.label}>Additional Notes (Optional)</Text>
                <View style={styles.row}>
                  <TextInput placeholderTextColor="#888"
                    value={item.additionalNotes}
                    placeholder="e.g. Bought at National Bookstore..."
                    multiline
                    numberOfLines={4}
                    onChangeText={(text) => updateReceiptField(idx, 'additionalNotes', text)}
                    style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                  />
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addAnotherBtn} onPress={addReceiptItem}>
              <Ionicons name="add-circle-outline" size={20} color="#5b61a7" style={{marginRight: 6}}/>
              <Text style={styles.addAnotherText}>Add Another Receipt</Text>
            </TouchableOpacity>
            
            <View style={{ backgroundColor: '#f9fafc', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e4e8f8', marginBottom: 24 }}>
              <Text style={{ fontSize: 13, color: '#6b72aa', lineHeight: 20 }}>
                Keep receipts clear and readable. If you do not have a receipt yet, add a justification and upload once available.
              </Text>
            </View>

            <Modal visible={dateVisible && dateIndex !== null} transparent animationType="fade">
              <View style={styles.calendarModalOverlay}>
                <View style={styles.calendarModalContent}>
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 4 }}>
                      <Ionicons name="chevron-back" size={24} color="#4f5fc5" />
                    </TouchableOpacity>
                    <Text style={styles.calendarHeaderText}>{months[selectedMonth]} {selectedYear}</Text>
                    <TouchableOpacity onPress={handleNextMonth} style={{ padding: 4 }}>
                      <Ionicons name="chevron-forward" size={24} color="#4f5fc5" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.calendarWeekDaysRow}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <Text key={i} style={styles.calendarWeekDay}>{d}</Text>)}
                  </View>
                  <View style={styles.calendarDaysGrid}>
                    {renderCalendarGrid()}
                  </View>
                  <TouchableOpacity onPress={() => setDateVisible(false)} style={styles.calendarCloseBtn}>
                    <Text style={styles.calendarCloseText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
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
              <Text style={styles.userName}>{user?.firstName ? `${user.firstName} ${user.lastName}` : 'Juan dela Cruz'}</Text>
              <Text style={styles.userRole}>Active Scholar</Text>
            </View>
            <TouchableOpacity style={styles.bellBtnLanding} activeOpacity={0.8} onPress={() => navigation.navigate("Notifications")}>
              <Ionicons name="notifications-outline" size={22} color="#6472d9" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[styles.progressHeader, { paddingTop: insets.top + 16, alignItems: 'flex-start' }]}>
          <TouchableOpacity onPress={() => setStep(-1)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#5b6095" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 16, marginTop: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#8a94b5', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>
              Study Needs
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#1c2131', marginBottom: 2 }}>
              Submit proof of expense
            </Text>
            <Text style={{ fontSize: 13, color: '#6b72aa', fontWeight: '500' }}>
              Category: Study Needs
            </Text>
          </View>
          <View style={{ backgroundColor: '#f0f2fb', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginTop: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#5b61aa' }}>For scholars</Text>
          </View>
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 60 }}>
        <Animated.View style={{ opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          {renderStep()}
        </Animated.View>
      </ScrollView>

      {!submitting && completeStage === "none" && step === 20 && (
        <View style={[styles.bottomBtnContainer, { flexDirection: "row", justifyContent: "flex-end", paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity 
            style={[styles.nextBtn, { backgroundColor: "#fff", borderWidth: 1, borderColor: "#d4dae8", paddingHorizontal: 24, marginRight: 12, elevation: 0, shadowOpacity: 0 }]} 
            onPress={() => setStep(-1)}
          >
            <Text style={[styles.nextBtnText, { color: "#5b61a7" }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.nextBtn, { paddingHorizontal: 24 }]} 
            onPress={submitReceipt}
          >
            <Text style={styles.nextBtnText}>Submit Proof</Text>
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
  input: { borderWidth: 1, borderColor: "#a9b1c0", borderRadius: 12, paddingHorizontal: 16, backgroundColor: "#ffffff", color: "#555", fontSize: 15, height: 50 },
  uploadBtn: { borderWidth: 1, borderColor: "#a9b1c0", borderRadius: 12, height: 50, justifyContent: "center", paddingHorizontal: 16, backgroundColor: "#ffffff" },
  uploadText: { color: "#777", fontSize: 15, alignSelf: "center" },
  
  receiptUploadBox: { borderWidth: 1, borderColor: "#bcc4da", backgroundColor: "#fff", borderRadius: 12, paddingVertical: 24, alignItems: "center", justifyContent: "center" },
  receiptUploadBoxTitle: { color: "#5b6095", fontSize: 16, fontWeight: "800", marginBottom: 8 },
  receiptUploadBoxSub: { color: "#8a94b5", fontSize: 12, fontWeight: "500", textAlign: "center" },
  
  addAnotherBtn: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  addAnotherText: { color: "#4f5fc5", fontSize: 14, fontWeight: "800" },
  
  bottomBtnContainer: { paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e4e8f8', backgroundColor: '#fff' },
  nextBtn: { backgroundColor: "#5b61a7", borderRadius: 14, paddingVertical: 16, alignItems: "center", shadowColor: "#2d3a7c", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 4 },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  
  content: { flex: 1 },
  centered: { alignItems: "center", justifyContent: "center", marginTop: 120 },
  completeText: { fontSize: 22, fontWeight: "800", color: "#3f4ca8", marginTop: 16, marginBottom: 8 },
  submitBtnOk: { borderRadius: 12, backgroundColor: "#4f5fc5", paddingVertical: 14, paddingHorizontal: 30, marginTop: 10 },
  submitBtnOkText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  
  rowWithError: { marginBottom: 3 },
  errorText: { color: "#dc2626", fontSize: 12, marginTop: 2, marginBottom: 0, fontWeight: "600", lineHeight: 14 },
  
  datePickerInput: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#a9b1c0", borderRadius: 12, paddingHorizontal: 16, paddingVertical: Platform.OS === "ios" ? 13 : 11, backgroundColor: "#ffffff", height: 50 },
  datePickerText: { color: "#555", fontSize: 15 },
  calendarModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  calendarModalContent: { backgroundColor: "#fff", width: "85%", borderRadius: 16, padding: 20 },
  calendarHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  calendarHeaderText: { fontSize: 18, fontWeight: "700", color: "#4f5fc5" },
  calendarWeekDaysRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 8 },
  calendarWeekDay: { color: "#848baf", fontSize: 13, fontWeight: "800", width: 40, textAlign: "center" },
  calendarDaysGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start" },
  calendarDay: { width: "14.28%", height: 40, justifyContent: "center", alignItems: "center", marginVertical: 2 },
  calendarDayText: { color: "#1c2131", fontSize: 16, fontWeight: "600" },
  calendarCloseBtn: { marginTop: 16, alignSelf: "flex-end", padding: 8, paddingBottom: 0 },
  calendarCloseText: { color: "#4f5ec4", fontSize: 15, fontWeight: "700" },
});

