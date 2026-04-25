import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import * as authService from "../services/authService";

export default function ResetPasswordScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  
  // Params will come from deep link via AppNavigator config
  const { accessToken, type, error: urlError, error_description } = route.params || {};

  const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/;
  
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user && (!accessToken || type !== "recovery")) {
      const target = user.userType === "scholar" ? "ScholarTabs" : "Main";
      navigation.replace(target);
    }
  }, [user, accessToken, type, navigation]);

  useEffect(() => {
    if (urlError) {
      setError(decodeURIComponent(error_description || urlError));
    }
  }, [urlError, error_description]);

  const validate = () => {
    if (!accessToken || type !== "recovery") {
      return "This password reset link is invalid or expired. Please request a new one.";
    }
    if (!form.password) return "New password is required.";
    if (form.password.length < 8) return "Password must be at least 8 characters long.";
    if (!PASSWORD_PATTERN.test(form.password)) {
      return "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.";
    }
    if (form.password !== form.confirmPassword) return "Passwords do not match.";
    return "";
  };

  const handleSubmit = async () => {
    setError("");
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(accessToken, form.password);
      setSuccess(true);
      setForm({ password: "", confirmPassword: "" });
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.screen}>
        <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
          <View style={styles.card}>
            <View style={styles.successBadge}>
              <Text style={styles.successEmoji}>✅</Text>
            </View>
            <Text style={styles.sectionTitle}>Password Updated</Text>
            <Text style={styles.sectionSubtitle}>
              Your password has been changed successfully. You can now log in with your new password.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.primaryButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const linkProblem = (!accessToken || type !== "recovery") && !urlError;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 60, paddingBottom: 40 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={16} color="#5b5f97" />
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Set a New Password</Text>
          <Text style={styles.sectionSubtitle}>
            Choose a strong password you haven’t used before.
          </Text>
          <Text style={styles.requirementText}>
            Use at least 8 characters with uppercase, lowercase, number, and special character.
          </Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {linkProblem ? (
            <View style={styles.problemBanner}>
              <Text style={styles.problemText}>This reset link is missing required information.</Text>
              <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                <Text style={styles.linkText}>Request a new reset link</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.field}>
                <Text style={styles.label}>New Password</Text>
                <View style={[styles.inputWrapper, error && styles.inputError]}>
                  <TextInput
                    value={form.password}
                    onChangeText={(val) => setForm(p => ({ ...p, password: val }))}
                    placeholder="Enter new password"
                    style={styles.input}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#999" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={[styles.inputWrapper, error && styles.inputError]}>
                  <TextInput
                    value={form.confirmPassword}
                    onChangeText={(val) => setForm(p => ({ ...p, confirmPassword: val }))}
                    placeholder="Confirm new password"
                    style={styles.input}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#999" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f5f5" },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 4,
  },
  backButtonText: {
    color: "#5b5f97",
    fontSize: 14,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 8,
    lineHeight: 20,
  },
  requirementText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 24,
  },
  field: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  inputError: { borderColor: "#dc2626" },
  errorBanner: {
    backgroundColor: "#fee2e2",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13,
  },
  problemBanner: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#f1f1f1",
    padding: 16,
    borderRadius: 12,
  },
  problemText: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 12,
  },
  linkText: {
    color: "#5b5f97",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  primaryButton: {
    backgroundColor: "#5b5f97",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  successBadge: {
    marginBottom: 16,
    alignItems: "center",
  },
  successEmoji: {
    fontSize: 48,
  },
});
