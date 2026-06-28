import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import SafeTextInput from "../components/SafeTextInput";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLogin } from "../hooks/useLogin";
import LoadingOverlay from "../components/LoadingOverlay";

export default function LoginScreen({ navigation }) {
  const { form, errors, apiError, loading, rememberMe, setRememberMe, updateField, handleLogin } = useLogin(navigation);
  const insets = useSafeAreaInsets();

  // Local UI-only state
  const [showPassword, setShowPassword] = useState(false);

  return (
    <LinearGradient
      colors={['#ffffff', '#f1f2fa']}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        style={[styles.screen, { paddingTop: insets.top, backgroundColor: 'transparent' }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={require("../../assets/images/logo_symbol.png")}
              style={styles.logoSymbol}
              resizeMode="contain"
            />
          </View>
          <View style={styles.logoTextContainer}>
            <Image
              source={require("../../assets/images/logo_text.png")}
              style={styles.logoText}
              resizeMode="contain"
            />
          </View>
        </View>

        <Text style={styles.header}>LOGIN</Text>
        <Text style={styles.subheader}>Please enter your details to sign in</Text>


        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
            <Ionicons name="mail-outline" size={18} color="#999" style={styles.icon} />
            <SafeTextInput placeholderTextColor="#888"
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
            <SafeTextInput placeholderTextColor="#888"
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
          {!errors.password && apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}
        </View>

        {/* Remember Me & Forgot password */}
        <View style={styles.rowContainer}>
          <TouchableOpacity 
            style={styles.rememberMeContainer} 
            activeOpacity={0.8}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Ionicons name="checkmark" size={12} color="#fff" />}
            </View>
            <Text style={styles.rememberMeLabel}>Remember Me</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={styles.link}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Login button */}
        <TouchableOpacity
          style={loading && styles.primaryButtonDisabled}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#5b5f97', '#727ab6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? "Logging in..." : "LOGIN"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Sign up link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{"Don't have an account? "}</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.footerLink}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <LoadingOverlay visible={loading} message="Signing in..." />
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { padding: 24, flexGrow: 1, justifyContent: "center" },
  logoContainer: { alignItems: "center", marginBottom: 8, marginTop: 10 },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#5b5f97",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#5b5f97",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoSymbol: {
    width: 72,
    height: 72,
  },
  logoTextContainer: {
    backgroundColor: "#5b5f97",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 28,
    alignSelf: "center",
    marginBottom: 24,
    shadowColor: "#5b5f97",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    width: 140,
    height: 28,
  },
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
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    width: "100%",
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#a9b1c0",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#5b5f97",
    borderColor: "#5b5f97",
  },
  rememberMeLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4a4f6a",
  },
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