import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLogin } from "../hooks/useLogin";

export default function LoginScreen({ navigation }) {
  const { form, errors, apiError, loading, updateField, handleLogin } = useLogin(navigation);

  // Local UI-only state
  const [showPassword, setShowPassword] = useState(false);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.loginLogo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.header}>LOGIN</Text>
        <Text style={styles.subheader}>Please enter your details to sign in</Text>

        {apiError ? <Text style={styles.apiError}>{apiError}</Text> : null}

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
            <Ionicons name="mail-outline" size={18} color="#999" style={styles.icon} />
            <TextInput
              value={form.email}
              onChangeText={(v) => updateField("email", v)}
              placeholder="Enter your email"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        </View>

        {/* Password */}
        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
            <Ionicons name="lock-closed-outline" size={18} color="#999" style={styles.icon} />
            <TextInput
              value={form.password}
              onChangeText={(v) => updateField("password", v)}
              placeholder="Enter your password"
              style={styles.input}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? "eye" : "eye-off"}
                size={18}
                color="#999"
              />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        </View>

        {/* Forgot password */}
        <View style={styles.row}>
          <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={styles.link}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Login button */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? "Logging in..." : "LOGIN"}
          </Text>
        </TouchableOpacity>

        {/* Sign up link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.footerLink}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { padding: 24, flexGrow: 1, justifyContent: "center" },
  logoContainer: { alignItems: "center", marginBottom: 18, marginTop: 10 },
  loginLogo: { width: 200, height: 200 },
  header: {
    fontSize: 28, fontWeight: "700", color: "#3d4076",
    textAlign: "center", marginBottom: 6,
  },
  subheader: {
    textAlign: "center", color: "#666",
    marginBottom: 28, fontSize: 14,
  },
  apiError: {
    backgroundColor: "#fee2e2", color: "#dc2626",
    padding: 12, borderRadius: 12,
    marginBottom: 16, textAlign: "center",
  },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#e0e0e0",
    backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 12,
  },
  icon: { marginRight: 10 },
  eyeButton: { padding: 8 },
  inputError: { borderColor: "#dc2626" },
  errorText: { color: "#dc2626", fontSize: 12, marginTop: 6 },
  row: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 18 },
  link: { color: "#5b5f97", fontSize: 13, fontWeight: "600" },
  primaryButton: {
    backgroundColor: "#5b5f97", paddingVertical: 14,
    borderRadius: 14, alignItems: "center",
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerText: { color: "#666", fontSize: 13 },
  footerLink: { color: "#5b5f97", fontSize: 13, fontWeight: "600" },
  input: { flex: 1, height: 48, color: "#111", fontSize: 14 },
});