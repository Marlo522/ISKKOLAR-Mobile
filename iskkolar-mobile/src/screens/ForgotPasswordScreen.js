import React, { useState, useEffect, useContext } from "react";
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

export default function ForgotPasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect logged-in users away from forgot password page
  useEffect(() => {
    if (user) {
      const target = user.userType === "scholar" ? "ScholarTabs" : "Main";
      navigation.replace(target);
    }
  }, [user, navigation]);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Invalid email format");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <View style={styles.emailIconWrapper}>
        <Text style={styles.emailEmoji}>📧</Text>
      </View>
      <Text style={styles.sectionTitle}>Check Your Email</Text>
      <Text style={styles.sectionSubtitle}>
        A password reset link has been sent to your email address.
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.primaryButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );

  const renderForm = () => (
    <>
      <Text style={styles.sectionTitle}>Forgot Password</Text>
      <Text style={styles.sectionSubtitle}>
        Enter your email and we'll send you a reset link
      </Text>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.field}>
        <Text style={styles.label}>Email Address</Text>
        <View style={[styles.inputWrapper, error && styles.inputError]}>
          <TextInput
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (error) setError("");
            }}
            placeholder="Enter your email"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
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
          <Text style={styles.primaryButtonText}>Send Reset Link</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backToLoginButton}
        onPress={() => navigation.goBack()}
        disabled={loading}
      >
        <Ionicons name="arrow-back" size={16} color="#5b5f97" />
        <Text style={styles.backToLoginText}>Back to Login</Text>
      </TouchableOpacity>
    </>
  );

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
          {success ? renderSuccess() : renderForm()}
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
    maxWidth: 420,
    alignSelf: "center",
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    // Elevation for Android
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "left",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 24,
    lineHeight: 20,
  },
  field: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  inputWrapper: {
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
  backToLoginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    gap: 6,
  },
  backToLoginText: {
    color: "#5b5f97",
    fontSize: 14,
    fontWeight: "500",
  },
  successContainer: {
    alignItems: "center",
  },
  emailIconWrapper: {
    marginBottom: 12,
  },
  emailEmoji: {
    fontSize: 48,
  },
});

