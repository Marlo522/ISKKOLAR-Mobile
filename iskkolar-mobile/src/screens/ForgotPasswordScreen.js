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
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(0); // 0: email, 1: verification code, 2: new password, 3: success
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateEmail = () => {
    const errs = {};
    if (!email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Invalid email format";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSendCode = () => {
    if (!validateEmail()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(1);
      Alert.alert("Success", "Verification code sent to your email");
    }, 1000);
  };

  const handleVerifyCode = () => {
    if (!code.trim()) {
      setErrors({ code: "Verification code is required" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1000);
  };

  const validatePassword = () => {
    const errs = {};
    if (!newPassword.trim()) errs.newPassword = "Password is required";
    if (!confirmPassword.trim()) errs.confirmPassword = "Confirm password";
    if (newPassword && confirmPassword && newPassword !== confirmPassword)
      errs.confirmPassword = "Passwords must match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleResetPassword = () => {
    if (!validatePassword()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 1000);
  };

  const handleBackToLogin = () => {
    navigation.replace("Login");
  };

  const renderStep0 = () => (
    <>
      <Text style={styles.sectionTitle}>Reset Your Password</Text>
      <Text style={styles.sectionSubtitle}>Enter your email to receive a verification code</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Email Address</Text>
        <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
          <Ionicons name="mail-outline" size={18} color="#999" style={styles.icon} />
          <TextInput
            value={email}
            onChangeText={(value) => setEmail(value)}
            placeholder="Enter your email"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>
        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
        onPress={handleSendCode}
        disabled={loading}
      >
        <Text style={styles.primaryButtonText}>{loading ? "Sending..." : "Send Verification Code"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
        <Text style={styles.secondaryButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep1 = () => (
    <>
      <Text style={styles.sectionTitle}>Verify Your Identity</Text>
      <Text style={styles.sectionSubtitle}>We've sent a verification code to {email}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Verification Code</Text>
        <View style={[styles.inputWrapper, errors.code && styles.inputError]}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#999" style={styles.icon} />
          <TextInput
            value={code}
            onChangeText={(value) => setCode(value)}
            placeholder="Enter 6-digit code"
            style={styles.input}
            keyboardType="number-pad"
            maxLength={6}
            editable={!loading}
          />
        </View>
        {errors.code ? <Text style={styles.errorText}>{errors.code}</Text> : null}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
        onPress={handleVerifyCode}
        disabled={loading}
      >
        <Text style={styles.primaryButtonText}>{loading ? "Verifying..." : "Verify Code"}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setStep(0)}
        disabled={loading}
      >
        <Text style={styles.secondaryButtonText}>Use Different Email</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.sectionTitle}>Create New Password</Text>
      <Text style={styles.sectionSubtitle}>Enter a strong new password</Text>

      <View style={styles.field}>
        <Text style={styles.label}>New Password</Text>
        <View style={[styles.inputWrapper, errors.newPassword && styles.inputError]}>
          <Ionicons name="lock-closed-outline" size={18} color="#999" style={styles.icon} />
          <TextInput
            value={newPassword}
            onChangeText={(value) => setNewPassword(value)}
            placeholder="Enter new password"
            style={styles.input}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!loading}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeButton}
          >
            <Ionicons name={showPassword ? "eye" : "eye-off"} size={18} color="#999" />
          </TouchableOpacity>
        </View>
        {errors.newPassword ? <Text style={styles.errorText}>{errors.newPassword}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Confirm Password</Text>
        <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
          <Ionicons name="lock-closed-outline" size={18} color="#999" style={styles.icon} />
          <TextInput
            value={confirmPassword}
            onChangeText={(value) => setConfirmPassword(value)}
            placeholder="Confirm password"
            style={styles.input}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            editable={!loading}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword((v) => !v)}
            style={styles.eyeButton}
          >
            <Ionicons name={showConfirmPassword ? "eye" : "eye-off"} size={18} color="#999" />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
        onPress={handleResetPassword}
        disabled={loading}
      >
        <Text style={styles.primaryButtonText}>{loading ? "Resetting..." : "Reset Password"}</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep3 = () => (
    <View style={styles.successContainer}>
      <View style={styles.successBadge}>
        <Ionicons name="checkmark" size={72} color="#fff" />
      </View>
      <Text style={styles.successTitle}>Password Reset</Text>
      <Text style={styles.successSubtitle}>Your password has been successfully reset</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleBackToLogin}>
        <Text style={styles.primaryButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (step === 0 ? navigation.goBack() : setStep(step - 1))}
          disabled={loading}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>Recover your account access</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f5f5" },
  headerContainer: {
    backgroundColor: "#5b5f97",
    paddingTop: Platform.OS === "ios" ? 50 : 32,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  title: { fontSize: 28, fontWeight: "700", color: "#fff" },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.75)", marginTop: 6 },
  container: { padding: 18, paddingTop: 24, paddingBottom: 32 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginTop: 0,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3d4076",
    marginBottom: 8,
  },
  sectionSubtitle: { fontSize: 13, color: "#666", marginBottom: 18 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: { flex: 1, height: 48, color: "#111", fontSize: 14 },
  icon: { marginRight: 10 },
  eyeButton: { padding: 8 },
  inputError: { borderColor: "#dc2626" },
  errorText: { color: "#dc2626", fontSize: 12, marginTop: 6 },
  primaryButton: {
    backgroundColor: "#5b5f97",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#5b5f97",
  },
  secondaryButtonText: { color: "#5b5f97", fontWeight: "700", fontSize: 15 },
  successContainer: { alignItems: "center", paddingVertical: 40 },
  successBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#5b5f97",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  successTitle: { fontSize: 24, fontWeight: "800", color: "#3d4076", marginBottom: 8 },
  successSubtitle: { fontSize: 14, color: "#666", marginBottom: 24, textAlign: "center" },
});
