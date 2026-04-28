import React, { useState, useContext, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Animated, Platform, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import * as profileService from "../services/profileService";

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logoutUser, loginUser } = useContext(AuthContext);
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
  const [editingMobile, setEditingMobile] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

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

    // Fetch latest profile
    const fetchProfile = async () => {
      try {
        const p = await profileService.getProfile();
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
        loginUser({ ...user, ...p }); // Update context if possible
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const onLogout = async () => {
    await logoutUser();
    navigation.replace("Login");
  };

  const handleSaveMobile = async () => {
    const mobileValue = form.mobileNumber.trim();
    if (!mobileValue) {
      alert("Mobile number is required.");
      return;
    }
    const MOBILE_PATTERN = /^0\d{10}$/;
    if (!MOBILE_PATTERN.test(mobileValue)) {
      alert("Mobile number must start with 0 and contain 11 digits.");
      return;
    }

    setLoading(true);
    try {
      const updated = await profileService.updateProfile({
        email: user?.email || form.email,
        mobileNumber: mobileValue,
      });
      alert(updated._message || "Mobile number updated successfully!");
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
    if (!emailValue) {
      alert("Email is required.");
      return;
    }
    const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
    if (!EMAIL_PATTERN.test(emailValue)) {
      alert("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const updated = await profileService.updateProfile({
        email: emailValue,
        mobileNumber: user?.mobileNumber || form.mobileNumber,
      });
      alert(updated._message || "Email updated successfully!");
      loginUser({ ...user, ...updated });
      setEditingEmail(false);
    } catch (err) {
      alert(err.message || "Failed to update email.");
    } finally {
      setLoading(false);
    }
  };

  const pickProfilePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    setForm({ ...form, profilePhoto: { uri: asset.uri } });
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
      alert(res.message || "Password updated successfully!");
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
    <View style={styles.container}>
      {/* Top Profile Header like Financial Records / Activities */}
      <View style={[styles.landingHeaderTop, { paddingTop: insets.top + 16 }]}>
        <View style={styles.profileRow}>
          <View style={styles.userIconWrapper}>
            <Ionicons name="person-outline" size={24} color="#5b6095" />
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
                  onPress={() => setForm({ ...form, profilePhoto: null })}
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
                <TextInput placeholderTextColor="#888" value={form.firstName} editable={false} style={[styles.formInput, { backgroundColor: '#f5f7fc', color: '#888' }]} />
              </View>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Middle Name</Text>
                <TextInput placeholderTextColor="#888" value={form.middleName} editable={false} style={[styles.formInput, { backgroundColor: '#f5f7fc', color: '#888' }]} />
              </View>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Last Name</Text>
                <TextInput placeholderTextColor="#888" value={form.lastName} editable={false} style={[styles.formInput, { backgroundColor: '#f5f7fc', color: '#888' }]} />
              </View>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Suffix</Text>
                <TextInput placeholderTextColor="#888" value={form.suffix} editable={false} style={[styles.formInput, { backgroundColor: '#f5f7fc', color: '#888' }]} />
              </View>

              <View style={styles.formRow}>
                <View style={styles.labelRow}>
                  <Text style={[styles.formLabel, { marginBottom: 0 }]}>Mobile Number</Text>
                  {!editingMobile && (
                    <TouchableOpacity onPress={() => { setEditingMobile(true); setEditingEmail(false); }} style={styles.editBtnWrap}>
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput placeholderTextColor="#888"
                  value={form.mobileNumber}
                  onChangeText={(val) => setForm({ ...form, mobileNumber: val.replace(/[^0-9]/g, "").slice(0, 11) })}
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
                    <TouchableOpacity onPress={() => { setEditingEmail(true); setEditingMobile(false); }} style={styles.editBtnWrap}>
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput placeholderTextColor="#888"
                  value={form.email}
                  onChangeText={(val) => setForm({ ...form, email: val })}
                  editable={editingEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.formInput, !editingEmail && { backgroundColor: '#f5f7fc', color: '#888' }]}
                />
                {editingEmail && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity onPress={() => { setEditingEmail(false); setForm({ ...form, email: user?.email || "" }); }} style={styles.cancelBtn}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSaveEmail} disabled={loading} style={[styles.saveBtn, loading && { opacity: 0.7 }]}>
                      <Text style={styles.saveBtnText}>{loading ? "Saving..." : "Save"}</Text>
                    </TouchableOpacity>
                  </View>
                )}
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
                  <TextInput placeholderTextColor="#888"
                    value={passwords.current}
                    secureTextEntry={!showCurrentPw}
                    onChangeText={(value) => setPasswords({ ...passwords, current: value })}
                    style={[styles.formInput, { flex: 1 }]}
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
                  <TextInput placeholderTextColor="#888"
                    value={passwords.newPassword}
                    secureTextEntry={!showNewPw}
                    onChangeText={(value) => setPasswords({ ...passwords, newPassword: value })}
                    style={[styles.formInput, { flex: 1 }]}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon} 
                    onPress={() => setShowNewPw(!showNewPw)}
                  >
                    <Ionicons name={showNewPw ? "eye-outline" : "eye-off-outline"} size={20} color="#7f88a3" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Confirm New Password</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput placeholderTextColor="#888"
                    value={passwords.confirm}
                    secureTextEntry={!showConfirmPw}
                    onChangeText={(value) => setPasswords({ ...passwords, confirm: value })}
                    style={[styles.formInput, { flex: 1 }]}
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

            <TouchableOpacity style={[styles.primaryButton, loading && { opacity: 0.7 }]} onPress={updatePassword} activeOpacity={0.8} disabled={loading}>
              <Text style={styles.primaryButtonText}>{loading ? "Saving..." : "Update Password"}</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.ScrollView>
    </View>
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
});
