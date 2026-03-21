import React, { useState, useContext } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from "react-native";
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
      <ScrollView style={styles.container} contentContainerStyle={[styles.contentContainer, { paddingBottom: 120 }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.nameText}>{form.firstName} {form.lastName}</Text>
          <Text style={styles.roleText}>Applicant</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Application")} style={styles.iconBubble}>
          <Ionicons name="notifications-outline" size={22} color="#4c60d1" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {['Profile', 'Password'].map((label) => (
          <TouchableOpacity key={label} onPress={() => setActiveTab(label)} style={[styles.tabButton, activeTab === label && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === label && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Profile' ? (
        <View style={styles.sectionCard}>
          <View style={styles.profilePicCircle}>
            <Ionicons name="person-circle" size={84} color="#fff" />
          </View>

          <Text style={styles.sectionTitle}>Personal Information</Text>
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

          <TouchableOpacity style={[styles.primaryButton, { marginTop: 16 }]} onPress={updateProfile}>
            <Text style={styles.primaryButtonText}>Update Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryButton, { marginTop: 10 }]} onPress={onLogout}>
            <Text style={styles.secondaryButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Change Password</Text>

          <Text style={styles.formLabel}>Current Password</Text>
          <TextInput
            value={passwords.current}
            secureTextEntry
            onChangeText={(value) => setPasswords({ ...passwords, current: value })}
            style={styles.formInput}
          />

          <Text style={styles.formLabel}>New Password</Text>
          <TextInput
            value={passwords.newPassword}
            secureTextEntry
            onChangeText={(value) => setPasswords({ ...passwords, newPassword: value })}
            style={styles.formInput}
          />

          <Text style={styles.formLabel}>Confirm New Password</Text>
          <TextInput
            value={passwords.confirm}
            secureTextEntry
            onChangeText={(value) => setPasswords({ ...passwords, confirm: value })}
            style={styles.formInput}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={updatePassword}>
            <Text style={styles.primaryButtonText}>Update Password</Text>
          </TouchableOpacity>
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f5ff" },
  contentContainer: { padding: 16, paddingBottom: 24 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  nameText: { fontSize: 24, fontWeight: "900", color: "#1b2260" },
  roleText: { fontSize: 14, color: "#5d6193", marginTop: 2 },
  iconBubble: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  tabRow: { flexDirection: "row", marginBottom: 14, borderBottomWidth: 1.4, borderColor: "#d3d7ee" },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: "center", borderBottomWidth: 3, borderColor: "transparent" },
  tabActive: { borderColor: "#4f5fc5" },
  tabText: { color: "#747ab5", fontWeight: "700" },
  tabTextActive: { color: "#3f4da9" },
  sectionCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e3e6f8", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  profilePicCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#4f5fc5", justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#3f4da9", marginBottom: 14, textAlign: "center" },
  formRow: { marginBottom: 12 },
  formLabel: { fontWeight: "700", color: "#5563a8", marginBottom: 4 },
  formInput: { borderWidth: 1, borderColor: "#d5d9ef", borderRadius: 10, backgroundColor: "#f8faff", padding: 10, fontSize: 14, color: "#41466f" },
  primaryButton: { backgroundColor: "#4f5fc5", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 10, shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  primaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  secondaryButton: { borderColor: "#de2a37", borderWidth: 1.5, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  secondaryButtonText: { color: "#de2a37", fontWeight: "800", fontSize: 15 },
});
