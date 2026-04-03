import React, { useState, useContext, useEffect, useRef } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Animated, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";

export default function ProfileScreen({ navigation }) {
  const { user, logoutUser, loginUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("Profile");
  const [form, setForm] = useState({
    firstName: user?.firstName ?? "Dominic",
    middleName: user?.middleName ?? "Edgar",
    lastName: user?.lastName ?? "Madla",
    email: user?.email ?? "dominic@example.com",
    birthday: user?.birthday ?? "July 3, 2004",
    gender: user?.gender ?? "Male",
    civilStatus: user?.civilStatus ?? "Single",
    citizenship: user?.citizenship ?? "Filipino",
  });
  const [passwords, setPasswords] = useState({ current: "", newPassword: "", confirm: "" });

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
  }, []);

  const onLogout = async () => {
    await logoutUser();
    navigation.replace("Login");
  };

  const updateProfile = () => {
    loginUser({ ...user, ...form }, "dev-token");
    alert("Profile updated (local only)");
  };

  const updatePassword = () => {
    if (passwords.newPassword !== passwords.confirm) {
      return alert("New password and confirm password do not match.");
    }

    if (!passwords.current || !passwords.newPassword) {
      return alert("Fields are required.");
    }

    alert("Password updated (local simulation)");
    setPasswords({ current: "", newPassword: "", confirm: "" });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Profile Header like Financial Records / Activities */}
      <View style={styles.landingHeaderTop}>
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
            <View style={styles.profilePicCircle}>
              <Ionicons name="person" size={54} color="#fff" />
              <View style={styles.cameraIconBadge}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </View>

            <Text style={styles.sectionTitleHeader}>| Personal Information</Text>
            
            <View style={styles.formContainer}>
              {[
                { label: 'First Name', key: 'firstName' },
                { label: 'Middle Name', key: 'middleName' },
                { label: 'Last Name', key: 'lastName' },
                { label: 'Email', key: 'email' },
                { label: 'Birthday', key: 'birthday' },
                { label: 'Gender', key: 'gender' },
                { label: 'Civil Status', key: 'civilStatus' },
                { label: 'Citizenship', key: 'citizenship' },
              ].map((item) => (
                <View style={styles.formRow} key={item.key}>
                  <Text style={styles.formLabel}>{item.label}</Text>
                  <TextInput
                    value={form[item.key]}
                    onChangeText={(value) => setForm({ ...form, [item.key]: value })}
                    style={styles.formInput}
                  />
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={updateProfile} activeOpacity={0.8}>
              <Text style={styles.primaryButtonText}>Update Profile</Text>
            </TouchableOpacity>

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
                <TextInput
                  value={passwords.current}
                  secureTextEntry
                  onChangeText={(value) => setPasswords({ ...passwords, current: value })}
                  style={styles.formInput}
                />
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>New Password</Text>
                <TextInput
                  value={passwords.newPassword}
                  secureTextEntry
                  onChangeText={(value) => setPasswords({ ...passwords, newPassword: value })}
                  style={styles.formInput}
                />
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Confirm New Password</Text>
                <TextInput
                  value={passwords.confirm}
                  secureTextEntry
                  onChangeText={(value) => setPasswords({ ...passwords, confirm: value })}
                  style={styles.formInput}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={updatePassword} activeOpacity={0.8}>
              <Text style={styles.primaryButtonText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fc" },
  landingHeaderTop: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#e4e8f8", backgroundColor: "#fff" },
  profileRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  userIconWrapper: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e8eAFD', justifyContent: 'center', alignItems: 'center', marginRight: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  headerTextCol: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '900', color: '#080d19', letterSpacing: -0.3, marginBottom: 4 },
  roleBadge: { backgroundColor: '#daf3e1', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  roleText: { fontSize: 11, color: '#00562b', fontWeight: '800' },
  bellBtnLanding: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e8eaff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  tabContainer: { backgroundColor: '#fff', borderRadius: 14, padding: 4, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2, marginBottom: 16, borderWidth: 1, borderColor: '#e4e8f6' },
  tabRow: { flexDirection: "row" },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: "#5b61a7" },
  tabText: { color: "#7f88a3", fontWeight: "700", fontSize: 14 },
  tabTextActive: { color: "#fff", fontWeight: "800" },
  sectionCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#e4e8f6", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  profilePicCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#5b61a7", justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 24, borderWidth: 4, borderColor: '#eff1fa' },
  cameraIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#29d0a5', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  sectionTitleHeader: { fontSize: 18, fontWeight: "900", color: "#4f5fc5", marginBottom: 16 },
  formContainer: { marginBottom: 8 },
  formRow: { marginBottom: 16 },
  formLabel: { fontWeight: "600", color: "#1c2131", fontSize: 13, marginBottom: 8 },
  formInput: { borderWidth: 1, borderColor: "#a9b1c0", borderRadius: 12, paddingHorizontal: 16, paddingVertical: Platform.OS === "ios" ? 14 : 12, backgroundColor: "#ffffff", color: "#555", fontSize: 15 },
  primaryButton: { backgroundColor: "#5b61a7", borderRadius: 14, paddingVertical: 16, alignItems: "center", shadowColor: "#2d3a7c", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 4 },
  primaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  secondaryButton: { backgroundColor: "#fff", borderColor: "#f9e0e0", borderWidth: 2, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 12 },
  secondaryButtonText: { color: "#de3a47", fontWeight: "800", fontSize: 16 },
});
