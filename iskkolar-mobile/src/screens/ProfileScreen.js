import React, { useState, useContext, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Platform, Image, Switch, NativeModules, RefreshControl, Alert, Modal, KeyboardAvoidingView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import SafeTextInput from "../components/SafeTextInput";
import * as ImagePicker from "expo-image-picker";
import { validateAndSanitizeFile } from "../utils/fileSanitizer";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";
import * as profileService from "../services/profileService";
import { registerPushToken, deletePushToken } from "../services/pushNotificationService";
import SuccessModal from "../components/SuccessModal";

// ─── PASSWORD STRENGTH METER ─────────────────────────────────
function PasswordStrengthMeter({ password }) {
  const getStrength = () => {
    if (!password) return { level: 0, label: "", color: "#ccc" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/i.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-z0-9]/i.test(password)) score++;
    if (score === 0) return { level: 0, label: "", color: "#ccc" };
    if (score === 1) return { level: 1, label: "Weak", color: "#dc2626" };
    if (score === 2) return { level: 2, label: "Fair", color: "#f59e0b" };
    if (score === 3) return { level: 3, label: "Good", color: "#3b82f6" };
    return { level: 4, label: "Strong", color: "#10b981" };
  };
  const strength = getStrength();
  return (
    <View style={strengthStyles.container}>
      <View style={strengthStyles.barContainer}>
        {[1, 2, 3, 4].map((n) => (
          <View
            key={n}
            style={[
              strengthStyles.bar,
              strength.level >= n ? { backgroundColor: strength.color } : {},
            ]}
          />
        ))}
      </View>
      {strength.label ? (
        <Text style={[strengthStyles.label, { color: strength.color }]}>
          {strength.label}
        </Text>
      ) : null}
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logoutUser, loginUser, refreshSession } = useContext(AuthContext);
  const isFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState("Profile");
  const [form, setForm] = useState({
    firstName: user?.firstName ?? "Dominic",
    middleName: user?.middleName ?? "Edgar",
    lastName: user?.lastName ?? "Madla",
    suffix: user?.suffix ?? "",
    email: user?.email ?? "dominic@example.com",
    mobileNumber: user?.mobileNumber ?? "09000000000",
    profilePhoto: user?.profilePhoto ?? null
  });
  const [passwords, setPasswords] = useState({ current: "", newPassword: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingMobile, setEditingMobile] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [showEmailCurrentPassword, setShowEmailCurrentPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [successConfig, setSuccessConfig] = useState({
    visible: false,
    title: "",
    message: "",
  });

  // Mount animation
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    slideAnim.setValue(20);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();

    // Load push preference
    const loadPushPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem("push_notifications_enabled");
        if (stored !== null) {
          setPushEnabled(stored === "true");
        }
      } catch (err) {
        console.warn("FCM: Failed to load push preference:", err);
      }
    };
    loadPushPreference();
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchProfile();
    }
  }, [isFocused]);

  const fetchProfile = async () => {
    try {
      const p = await refreshSession();
      if (p) {
        setForm(prev => ({
          ...prev,
          firstName: p.firstName || prev.firstName,
          middleName: p.middleName || prev.middleName,
          lastName: p.lastName || prev.lastName,
          suffix: p.suffix || prev.suffix,
          email: p.email || prev.email,
          mobileNumber: p.mobileNumber || p.mobile_number || prev.mobileNumber,
          profilePhoto: p.profilePictureUrl ? { uri: p.profilePictureUrl } : prev.profilePhoto,
        }));
        
        // Live role redirect
        if (p.role === "terminated") {
          navigation.replace("Terminated");
        } else if (p.role === "scholar" && user?.role === "applicant") {
          navigation.replace("ScholarTabs");
        } else if (p.role === "applicant" && user?.role === "scholar") {
          navigation.replace("Main");
        }
      }
    } catch (err) {
      console.error("fetchProfile failed:", err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const onLogout = async () => {
    await logoutUser();
    navigation.replace("Login");
  };

  const handleTogglePush = async (newValue) => {
    setPushEnabled(newValue);
    if (!NativeModules.RNFBAppModule) {
      alert("Push notifications are not supported in Expo Go. Please compile a native development build to enable this feature.");
      setPushEnabled(!newValue);
      return;
    }
    try {
      await AsyncStorage.setItem("push_notifications_enabled", String(newValue));
      const messaging = require("@react-native-firebase/messaging").default;
      
      if (newValue) {
        // Request permissions and register token on backend
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (enabled) {
          const token = await messaging().getToken().catch(() => null);
          if (token) {
            await registerPushToken(token, Platform.OS);
            console.log("FCM: Registered push token dynamically via switch toggle.");
          }
        }
      } else {
        // Delete token on backend
        const token = await messaging().getToken().catch(() => null);
        if (token) {
          await deletePushToken(token);
          console.log("FCM: Deleted push token dynamically via switch toggle.");
        }
      }
    } catch (err) {
      console.warn("FCM: Failed to update push preference:", err);
      setPushEnabled(!newValue);
      alert("Failed to update push notification settings. Please check your network and try again.");
    }
  };

  const handleSaveMobile = async () => {
    const mobileValue = form.mobileNumber.trim();
    if (!mobileValue) {
      alert("Mobile number is required.");
      return;
    }
    const MOBILE_PATTERN = /^09\d{9}$/;
    if (!MOBILE_PATTERN.test(mobileValue)) {
      alert("Mobile number must start with 09 and contain 11 digits.");
      return;
    }

    setLoading(true);
    try {
      const updated = await profileService.updateProfile({
        email: user?.email || form.email,
        mobileNumber: mobileValue,
      });
      setSuccessConfig({
        visible: true,
        title: "Changes Saved!",
        message: updated._message || "Mobile number updated successfully!",
      });
      loginUser({ ...user, ...updated });
      setEditingMobile(false);
    } catch (err) {
      alert(err.message || "Failed to update mobile number.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmail = async () => {
    const emailValue = form.email.trim();
    const currentEmail = String(user?.email || "").trim();
    if (!emailValue) {
      setEmailError("Email is required.");
      return;
    }
    const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_PATTERN.test(emailValue)) {
      setEmailError("Please enter a valid email address (e.g. user@example.com).");
      return;
    }
    if (emailValue.toLowerCase() === currentEmail.toLowerCase()) {
      setEditingEmail(false);
      setEmailCurrentPassword("");
      setShowEmailCurrentPassword(false);
      setEmailError("");
      setForm((prev) => ({ ...prev, email: currentEmail }));
      setSuccessConfig({
        visible: true,
        title: "No Changes",
        message: "No changes detected.",
      });
      return;
    }
    if (!emailCurrentPassword.trim()) {
      setEmailError("Current password is required to change your email.");
      return;
    }

    setLoading(true);
    setEmailError("");
    try {
      const updated = await profileService.updateProfile({
        email: emailValue,
        mobileNumber: user?.mobileNumber || user?.mobile_number || form.mobileNumber,
        currentPassword: emailCurrentPassword,
      });

      loginUser({ ...user, ...updated });
      setEmailCurrentPassword("");
      setShowEmailCurrentPassword(false);
      setEditingEmail(false);
      setForm(prev => ({ ...prev, email: updated.email || currentEmail || prev.email }));
      setSuccessConfig({
        visible: true,
        title: "Check Your Email",
        message: updated._message || "Verification links were sent for your email change.",
      });
    } catch (err) {
      const message = err.message || "Failed to update email.";
      if (message.toLowerCase().includes("password")) {
        setEmailError(message);
      } else {
        Alert.alert("Failed to Update Email", message);
      }
    } finally {
      setLoading(false);
    }
  };

  const closeEmailModal = () => {
    if (loading) return;
    setEditingEmail(false);
    setEmailCurrentPassword("");
    setShowEmailCurrentPassword(false);
    setEmailError("");
    setForm((prev) => ({ ...prev, email: user?.email || "" }));
  };

  const pickProfilePhoto = () => {
    Alert.alert(
      "Change Profile Photo",
      "Choose an option",
      [
        {
          text: "Take Photo",
          onPress: handleLaunchCamera,
        },
        {
          text: "Choose from Library",
          onPress: handleLaunchLibrary,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handleLaunchCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Denied", "Camera permission is required to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    handleUploadProfilePhoto(asset);
  };

  const handleLaunchLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Denied", "Photos permission is required to select photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    handleUploadProfilePhoto(asset);
  };

  const handleUploadProfilePhoto = async (asset) => {
    const file = {
      uri: asset.uri,
      name: asset.fileName || `profile-photo-${Date.now()}.jpg`,
      fileName: asset.fileName || `profile-photo-${Date.now()}.jpg`,
      type: asset.mimeType || "image/jpeg",
      mimeType: asset.mimeType || "image/jpeg",
    };
    const sanitized = validateAndSanitizeFile(file);
    if (!sanitized) return;

    setLoading(true);
    try {
      const updated = await profileService.updateProfile({
        email: user?.email || form.email,
        mobileNumber: user?.mobileNumber || user?.mobile_number || form.mobileNumber,
        profilePhoto: sanitized,
      });
      setSuccessConfig({
        visible: true,
        title: "Changes Saved!",
        message: updated._message || "Profile picture updated successfully!",
      });
      loginUser({ ...user, ...updated });
      setForm(prev => ({
        ...prev,
        profilePhoto: updated.profilePictureUrl ? { uri: updated.profilePictureUrl } : null,
      }));
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to update profile picture.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProfilePhoto = async () => {
    setLoading(true);
    try {
      const updated = await profileService.updateProfile({
        email: user?.email || form.email,
        mobileNumber: user?.mobileNumber || user?.mobile_number || form.mobileNumber,
        removePhoto: true,
      });
      setSuccessConfig({
        visible: true,
        title: "Photo Removed",
        message: updated._message || "Profile picture removed successfully!",
      });
      loginUser({ ...user, ...updated });
      setForm(prev => ({
        ...prev,
        profilePhoto: null,
      }));
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to remove profile picture.");
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (passwords.newPassword !== passwords.confirm) {
      return alert("New password and confirm password do not match.");
    }

    if (!passwords.current || !passwords.newPassword) {
      return alert("Fields are required.");
    }

    const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/;
    if (passwords.newPassword.length < 8) {
      return alert("Password must be at least 8 characters.");
    }
    if (!PASSWORD_PATTERN.test(passwords.newPassword)) {
      return alert("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
    }

    setLoading(true);
    try {
      const res = await profileService.changePassword(passwords.current, passwords.newPassword);
      setSuccessConfig({
        visible: true,
        title: "Password Changed",
        message: res.message || "Password updated successfully!",
      });
      setPasswords({ current: "", newPassword: "", confirm: "" });
      setShowCurrentPw(false);
      setShowNewPw(false);
      setShowConfirmPw(false);
    } catch (err) {
      alert(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={['#ffffff', '#f1f2fa']}
        style={[styles.container, { backgroundColor: 'transparent' }]}
      >
        {/* Top Profile Header like Financial Records / Activities */}
        <View style={[styles.landingHeaderTop, { paddingTop: insets.top + 16 }]}>
          <View style={styles.profileRow}>
            <View style={styles.userIconWrapper}>
              {form.profilePhoto?.uri ? (
                <Image source={{ uri: form.profilePhoto.uri }} style={{ width: "100%", height: "100%", borderRadius: 12.5 }} />
              ) : (
                <Ionicons name="person-outline" size={24} color="#5b6095" />
              )}
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.userName}>{form.firstName} {form.lastName}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user?.role || "Active Scholar"}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("Notifications")} style={styles.bellBtnLanding} activeOpacity={0.8}>
              <Ionicons name="notifications-outline" size={22} color="#5b6095" />
            </TouchableOpacity>
          </View>
        </View>

        <Animated.ScrollView
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5b61a7']} tintColor="#5b61a7" />}
        >
          <View style={styles.tabContainer}>
            <View style={styles.tabRow}>
              {['Profile', 'Password'].map((label) => (
                <TouchableOpacity
                  key={label}
                  onPress={() => setActiveTab(label)}
                  style={[styles.tabButton, activeTab === label && styles.tabActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, activeTab === label && styles.tabTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {activeTab === 'Profile' ? (
            <View style={styles.sectionCard}>
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <TouchableOpacity onPress={pickProfilePhoto} activeOpacity={0.8}>
                  <View style={[styles.profilePicCircle, form.profilePhoto?.uri ? { marginBottom: 12 } : { marginBottom: 0 }]}>
                    {form.profilePhoto?.uri ? (
                      <Image source={{ uri: form.profilePhoto.uri }} style={{ width: 88, height: 88, borderRadius: 44 }} />
                    ) : (
                      <Ionicons name="person" size={54} color="#fff" />
                    )}
                    <View style={styles.cameraIconBadge}>
                      <Ionicons name="camera" size={16} color="#fff" />
                    </View>
                  </View>
                </TouchableOpacity>

                {form.profilePhoto?.uri && (
                  <TouchableOpacity
                    onPress={handleRemoveProfilePhoto}
                    style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#fee2e2' }}
                  >
                    <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13 }}>Remove Photo</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.sectionTitleHeader}>| Personal Information</Text>

              <View style={styles.formContainer}>
                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>First Name</Text>
                  <SafeTextInput placeholderTextColor="#888" value={form.firstName} editable={false} style={[styles.formInput, { backgroundColor: '#f5f7fc', color: '#888' }]} />
                </View>
                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Middle Name</Text>
                  <SafeTextInput placeholderTextColor="#888" value={form.middleName} editable={false} style={[styles.formInput, { backgroundColor: '#f5f7fc', color: '#888' }]} />
                </View>
                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Last Name</Text>
                  <SafeTextInput placeholderTextColor="#888" value={form.lastName} editable={false} style={[styles.formInput, { backgroundColor: '#f5f7fc', color: '#888' }]} />
                </View>
                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Suffix</Text>
                  <SafeTextInput placeholderTextColor="#888" value={form.suffix} editable={false} style={[styles.formInput, { backgroundColor: '#f5f7fc', color: '#888' }]} />
                </View>

                <View style={styles.formRow}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { marginBottom: 0 }]}>Mobile Number</Text>
                    {!editingMobile && (
                      <TouchableOpacity onPress={() => {
                        setEditingMobile(true);
                        setEditingEmail(false);
                        if (!form.mobileNumber.startsWith("09")) {
                          setForm({ ...form, mobileNumber: "09" });
                        }
                      }} style={styles.editBtnWrap}>
                        <Text style={styles.editBtnText}>Edit</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <SafeTextInput placeholderTextColor="#888"
                    value={form.mobileNumber}
                    onChangeText={(val) => {
                      let clean = val.replace(/[^0-9]/g, "");
                      if (clean.length < 2) {
                        clean = "09";
                      } else if (!clean.startsWith("09")) {
                        clean = "09" + clean.replace(/^0+/, "");
                      }
                      setForm({ ...form, mobileNumber: clean.slice(0, 11) });
                    }}
                    editable={editingMobile}
                    keyboardType="number-pad"
                    style={[styles.formInput, !editingMobile && { backgroundColor: '#f5f7fc', color: '#888' }]}
                  />
                  {editingMobile && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity onPress={() => { setEditingMobile(false); setForm({ ...form, mobileNumber: user?.mobileNumber || user?.mobile_number || "" }); }} style={styles.cancelBtn}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleSaveMobile} disabled={loading} style={[styles.saveBtn, loading && { opacity: 0.7 }]}>
                        <Text style={styles.saveBtnText}>{loading ? "Saving..." : "Save"}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <View style={styles.formRow}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.formLabel, { marginBottom: 0 }]}>Email</Text>
                    {!editingEmail && (
                      <TouchableOpacity
                        onPress={() => {
                          setEditingEmail(true);
                          setEditingMobile(false);
                          setEmailCurrentPassword("");
                          setShowEmailCurrentPassword(false);
                          setEmailError("");
                          setForm((prev) => ({ ...prev, email: "" }));
                        }}
                        style={styles.editBtnWrap}
                      >
                        <Text style={styles.editBtnText}>Edit</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <SafeTextInput placeholderTextColor="#888"
                    value={user?.email || form.email}
                    editable={false}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[styles.formInput, { backgroundColor: '#f5f7fc', color: '#888' }]}
                  />
                </View>
              </View>

              <Text style={styles.sectionTitleHeader}>| Preferences</Text>
              <View style={styles.preferencesContainer}>
                <View style={styles.preferenceRow}>
                  <View style={styles.preferenceTextCol}>
                    <Text style={styles.preferenceLabel}>Push Notifications</Text>
                    <Text style={styles.preferenceSublabel}>Receive alerts about announcements and activities</Text>
                  </View>
                  <Switch
                    value={pushEnabled}
                    onValueChange={handleTogglePush}
                    trackColor={{ false: "#d1d5db", true: "#a5b4fc" }}
                    thumbColor={pushEnabled ? "#5b61a7" : "#f4f4f5"}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.secondaryButton} onPress={onLogout} activeOpacity={0.8}>
                <Text style={styles.secondaryButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitleHeader}>| Change Password</Text>

              <View style={styles.formContainer}>
                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Current Password</Text>
                  <View style={styles.passwordInputWrapper}>
                    <SafeTextInput placeholderTextColor="#888"
                      value={passwords.current}
                      secureTextEntry={!showCurrentPw}
                      onChangeText={(value) => setPasswords({ ...passwords, current: value })}
                      style={[styles.formInput, { flex: 1 }]}
                      contextMenuHidden={true}
                    />
                    <TouchableOpacity 
                      style={styles.eyeIcon} 
                      onPress={() => setShowCurrentPw(!showCurrentPw)}
                    >
                      <Ionicons name={showCurrentPw ? "eye-outline" : "eye-off-outline"} size={20} color="#7f88a3" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>New Password</Text>
                  <View style={styles.passwordInputWrapper}>
                    <SafeTextInput placeholderTextColor="#888"
                      value={passwords.newPassword}
                      secureTextEntry={!showNewPw}
                      onChangeText={(value) => setPasswords({ ...passwords, newPassword: value })}
                      style={[styles.formInput, { flex: 1 }]}
                      contextMenuHidden={true}
                    />
                    <TouchableOpacity 
                      style={styles.eyeIcon} 
                      onPress={() => setShowNewPw(!showNewPw)}
                    >
                      <Ionicons name={showNewPw ? "eye-outline" : "eye-off-outline"} size={20} color="#7f88a3" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.hintText}>Use 8+ characters with letters, numbers & symbols</Text>
                  <PasswordStrengthMeter password={passwords.newPassword} />
                </View>

                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Confirm New Password</Text>
                  <View style={styles.passwordInputWrapper}>
                    <SafeTextInput placeholderTextColor="#888"
                      value={passwords.confirm}
                      secureTextEntry={!showConfirmPw}
                      onChangeText={(value) => setPasswords({ ...passwords, confirm: value })}
                      style={[styles.formInput, { flex: 1 }]}
                      contextMenuHidden={true}
                    />
                    <TouchableOpacity 
                      style={styles.eyeIcon} 
                      onPress={() => setShowConfirmPw(!showConfirmPw)}
                    >
                      <Ionicons name={showConfirmPw ? "eye-outline" : "eye-off-outline"} size={20} color="#7f88a3" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={[loading && { opacity: 0.7 }, { width: "100%", borderRadius: 14, overflow: "hidden" }]} onPress={updatePassword} activeOpacity={0.8} disabled={loading}>
                <LinearGradient
                  colors={['#5b61a7', '#727ab6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.primaryButton, { width: "100%", backgroundColor: 'transparent' }]}
                >
                  <Text style={styles.primaryButtonText}>{loading ? "Saving..." : "Update Password"}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Animated.ScrollView>
        <Modal
          visible={editingEmail}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={closeEmailModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.emailModalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Change Email Address</Text>
                <TouchableOpacity
                  onPress={closeEmailModal}
                  disabled={loading}
                  style={styles.modalCloseBtn}
                >
                  <Ionicons name="close" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.verificationNotice}>
                <Text style={styles.verificationTitle}>Verification required</Text>
                <Text style={styles.verificationText}>
                  We will send a verification link to confirm this change. Your current email will remain active until the new address is verified.
                </Text>
              </View>

              <View style={styles.modalField}>
                <Text style={styles.formLabel}>New email address</Text>
                <SafeTextInput
                  placeholderTextColor="#888"
                  value={form.email}
                  onChangeText={(val) => {
                    setForm((prev) => ({ ...prev, email: val }));
                    if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                      setEmailError("Please enter a valid email address (e.g. user@example.com).");
                    } else if (emailError.toLowerCase().includes("email")) {
                      setEmailError("");
                    }
                  }}
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                  style={[styles.formInput, emailError.toLowerCase().includes("email") && styles.errorInput]}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.formLabel}>Current password</Text>
                <View style={styles.passwordInputWrapper}>
                  <SafeTextInput
                    placeholderTextColor="#888"
                    value={emailCurrentPassword}
                    secureTextEntry={!showEmailCurrentPassword}
                    onChangeText={(value) => {
                      setEmailCurrentPassword(value);
                      if (emailError.toLowerCase().includes("password")) {
                        setEmailError("");
                      }
                    }}
                    placeholder="Enter your current password"
                    style={[styles.formInput, { flex: 1 }, emailError.toLowerCase().includes("password") && styles.errorInput]}
                    contextMenuHidden={true}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowEmailCurrentPassword((visible) => !visible)}
                  >
                    <Ionicons name={showEmailCurrentPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#7f88a3" />
                  </TouchableOpacity>
                </View>
              </View>

              {!!emailError && (
                <View style={styles.modalErrorBox}>
                  <Text style={styles.modalErrorText}>{emailError}</Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={closeEmailModal}
                  disabled={loading}
                  style={styles.modalCancelBtn}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveEmail}
                  disabled={loading}
                  style={[loading && { opacity: 0.7 }, { flex: 1.5, borderRadius: 10, overflow: "hidden" }]}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#5b5f97', '#727ab6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.modalSaveBtn, { flex: 0, width: "100%", backgroundColor: 'transparent' }]}
                  >
                    <Text style={styles.modalSaveText}>{loading ? "Sending..." : "Send Verification Email"}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <SuccessModal
          visible={successConfig.visible}
          title={successConfig.title}
          message={successConfig.message}
          onClose={() => {
            if (successConfig.onClose) {
              successConfig.onClose();
            } else {
              setSuccessConfig(prev => ({ ...prev, visible: false }));
            }
          }}
        />
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eff2f9" },
  landingHeaderTop: { paddingHorizontal: 24, paddingBottom: 24, backgroundColor: "#fff", borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4, marginBottom: 10, zIndex: 10 },
  profileRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  userIconWrapper: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e8eAFD', justifyContent: 'center', alignItems: 'center', marginRight: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  headerTextCol: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '900', color: '#080d19', letterSpacing: -0.3, marginBottom: 4 },
  roleBadge: { backgroundColor: '#daf3e1', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  roleText: { fontSize: 11, color: '#00562b', fontWeight: '800' },
  bellBtnLanding: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#f5f7fc", justifyContent: "center", alignItems: "center" },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  tabContainer: { backgroundColor: '#fff', borderRadius: 18, padding: 4, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2, marginBottom: 16 },
  tabRow: { flexDirection: "row" },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: "#5b61a7" },
  tabText: { color: "#7f88a3", fontWeight: "700", fontSize: 14 },
  tabTextActive: { color: "#fff", fontWeight: "800" },
  sectionCard: { backgroundColor: "#fff", borderRadius: 20, padding: 20, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  profilePicCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#5b61a7", justifyContent: "center", alignItems: "center", borderWidth: 4, borderColor: '#eff1fa' },
  cameraIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#29d0a5', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  sectionTitleHeader: { fontSize: 18, fontWeight: "900", color: "#4f5fc5", marginBottom: 16 },
  formContainer: { marginBottom: 8 },
  formRow: { marginBottom: 16 },
  formLabel: { fontWeight: "600", color: "#1c2131", fontSize: 13, marginBottom: 8 },
  formInput: { borderWidth: 1, borderColor: "#a9b1c0", borderRadius: 12, paddingHorizontal: 16, paddingVertical: Platform.OS === "ios" ? 14 : 12, backgroundColor: "#ffffff", color: "#555", fontSize: 15 },
  errorInput: { borderColor: "#dc2626", borderWidth: 2, backgroundColor: "#fff5f5" },
  passwordInputWrapper: { flexDirection: 'row', alignItems: 'center' },
  eyeIcon: { position: 'absolute', right: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  editBtnWrap: { paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#eef0ff', borderRadius: 12, borderWidth: 1, borderColor: '#d9ddff' },
  editBtnText: { color: '#4b4f8a', fontSize: 12, fontWeight: '700' },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginRight: 8 },
  cancelBtnText: { color: '#888', fontWeight: '600', fontSize: 13 },
  saveBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#5b61a7' },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  primaryButton: { backgroundColor: "#5b61a7", borderRadius: 14, paddingVertical: 16, alignItems: "center", shadowColor: "#2d3a7c", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 4 },
  primaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  secondaryButton: { backgroundColor: "#fff", borderColor: "#f9e0e0", borderWidth: 2, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 12 },
  secondaryButtonText: { color: "#de3a47", fontWeight: "800", fontSize: 16 },
  preferencesContainer: { marginBottom: 20 },
  preferenceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eff2f9" },
  preferenceTextCol: { flex: 1, paddingRight: 16 },
  preferenceLabel: { fontSize: 15, fontWeight: "700", color: "#1c2131", marginBottom: 4 },
  preferenceSublabel: { fontSize: 12, color: "#7f88a3", lineHeight: 16 },
  hintText: { fontSize: 12, color: "#666", marginTop: 6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(8, 13, 25, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 22,
  },
  emailModalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 20,
    shadowColor: "#080d19",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    flex: 1,
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
    paddingRight: 12,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  verificationNotice: {
    borderWidth: 1,
    borderColor: "#dedff0",
    backgroundColor: "#f7f7fc",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  verificationTitle: {
    color: "#4a4e7d",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },
  verificationText: {
    color: "#5f6678",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },
  modalField: {
    marginBottom: 14,
  },
  modalErrorBox: {
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  modalErrorText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 14,
  },
  modalCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  modalCancelText: {
    color: "#4b5563",
    fontWeight: "800",
    fontSize: 13,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#5b61a7",
    alignItems: "center",
  },
  modalSaveText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
});

const strengthStyles = StyleSheet.create({
  container: { marginTop: 8, alignItems: "flex-start" },
  barContainer: { flexDirection: "row", gap: 4 },
  bar: { height: 4, width: "23%", borderRadius: 2, backgroundColor: "#e0e0e0" },
  label: { fontSize: 12, fontWeight: "600", marginTop: 6 },
});
