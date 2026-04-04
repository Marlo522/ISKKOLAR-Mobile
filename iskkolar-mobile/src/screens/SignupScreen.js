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
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSignup } from "../hooks/useSignup";

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

// ─── PICKER MODAL ────────────────────────────────────────────
function PickerModal({ visible, title, options, selected, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.modal}>
          <Text style={modalStyles.modalTitle}>{title}</Text>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                modalStyles.option,
                option === selected ? modalStyles.optionSelected : null,
              ]}
              onPress={() => { onSelect(option); onClose(); }}
            >
              <Text
                style={[
                  modalStyles.optionText,
                  option === selected ? modalStyles.optionTextSelected : null,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
          <Pressable style={modalStyles.closeArea} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

// ─── DATE PICKER MODAL ───────────────────────────────────────
function DatePickerModal({ visible, date, onConfirm, onClose }) {
  const [year, setYear] = useState(date.getFullYear());
  const [month, setMonth] = useState(date.getMonth());
  const [day, setDay] = useState(date.getDate());

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 81 }, (_, i) => currentYear - i);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.dateModal}>
          <Text style={modalStyles.modalTitle}>Pick your birthday</Text>
          <View style={modalStyles.pickerRow}>
            <ScrollView style={modalStyles.pickerColumn}>
              {Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[modalStyles.option, d === day ? modalStyles.optionSelected : null]}
                  onPress={() => setDay(d)}
                >
                  <Text style={[modalStyles.optionText, d === day ? modalStyles.optionTextSelected : null]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView style={modalStyles.pickerColumn}>
              {months.map((m, idx) => (
                <TouchableOpacity
                  key={m}
                  style={[modalStyles.option, idx === month ? modalStyles.optionSelected : null]}
                  onPress={() => { setMonth(idx); const max = daysInMonth(year, idx); if (day > max) setDay(max); }}
                >
                  <Text style={[modalStyles.optionText, idx === month ? modalStyles.optionTextSelected : null]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView style={modalStyles.pickerColumn}>
              {years.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[modalStyles.option, y === year ? modalStyles.optionSelected : null]}
                  onPress={() => setYear(y)}
                >
                  <Text style={[modalStyles.optionText, y === year ? modalStyles.optionTextSelected : null]}>
                    {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={modalStyles.buttonRow}>
            <TouchableOpacity style={modalStyles.modalButton} onPress={onClose}>
              <Text style={modalStyles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.modalButton}
              onPress={() => { onConfirm(new Date(year, month, day)); onClose(); }}
            >
              <Text style={modalStyles.modalButtonText}>Select</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────
export default function SignupScreen({ navigation }) {
  // All logic lives in the hook
  const {
    step, loading, form, errors,
    updateField, nextStep, backStep, handleRegister, formatDate,
    GENDER_OPTIONS, CITIZENSHIP_OPTIONS, CIVIL_STATUS_OPTIONS, STEP_TITLES,
  } = useSignup(navigation);

  // Local UI-only state (modals don't belong in the hook)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [pickerConfig, setPickerConfig] = useState({
    visible: false, title: "", options: [], field: "",
  });

  const openPicker = (title, options, field) => {
    setPickerConfig({ visible: true, title, options, field });
  };
  const closePicker = () => setPickerConfig((p) => ({ ...p, visible: false }));

  const pickProfilePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    updateField("profilePhoto", {
      uri: asset.uri,
      fileName: asset.fileName || `profile-photo-${Date.now()}.jpg`,
      mimeType: asset.mimeType || "image/jpeg",
      fileSize: asset.fileSize,
    });
  };

  // ─── STEP 0: Account Setup ───────────────────────────────
  const renderStep0 = () => (
    <>
      <Text style={styles.sectionTitle}>Create your login credentials</Text>

      {/* General error (e.g. email already registered) */}
      {errors.general ? (
        <View style={styles.generalError}>
          <Text style={styles.generalErrorText}>{errors.general}</Text>
        </View>
      ) : null}

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
          <Ionicons name="mail-outline" size={18} color="#999" style={styles.icon} />
          <TextInput
            value={form.email}
            onChangeText={(v) => updateField("email", v)}
            placeholder="Email"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
          <Ionicons name="lock-closed-outline" size={18} color="#999" style={styles.icon} />
          <TextInput
            value={form.password}
            onChangeText={(v) => updateField("password", v)}
            placeholder="Password"
            style={styles.input}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
            <Ionicons name={showPassword ? "eye" : "eye-off"} size={18} color="#999" />
          </TouchableOpacity>
        </View>
        {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        <Text style={styles.hintText}>Use 8+ characters with letters, numbers & symbols</Text>
        <PasswordStrengthMeter password={form.password} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Confirm Password</Text>
        <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
          <Ionicons name="lock-closed-outline" size={18} color="#999" style={styles.icon} />
          <TextInput
            value={form.confirmPassword}
            onChangeText={(v) => updateField("confirmPassword", v)}
            placeholder="Confirm Password"
            style={styles.input}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)} style={styles.eyeButton}>
            <Ionicons name={showConfirmPassword ? "eye" : "eye-off"} size={18} color="#999" />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
      </View>
    </>
  );

  // ─── STEP 1: Personal Details ────────────────────────────
  const renderStep1 = () => (
    <>
      <Text style={styles.sectionTitle}>Provide your personal details</Text>

      {errors.general ? (
        <View style={styles.generalError}>
          <Text style={styles.generalErrorText}>{errors.general}</Text>
        </View>
      ) : null}

      {/* Profile Photo — replace this TouchableOpacity with your image picker */}
      <View style={styles.photoRow}>
        <View style={styles.avatarWrapper}>
          <Image
            source={
              form.profilePhoto?.uri
                ? { uri: form.profilePhoto.uri }
                : require("../../assets/images/logo.png")
            }
            style={styles.avatar}
          />
        </View>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={pickProfilePhoto}
        >
          <Text style={styles.uploadButtonText}>
            {form.profilePhoto?.uri ? "Change Photo" : "Add Profile Photo"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>First Name</Text>
        <TextInput
          value={form.firstName}
          onChangeText={(v) => updateField("firstName", v)}
          placeholder="Enter first name"
          style={[styles.input, styles.standaloneInput, errors.firstName && styles.inputError]}
        />
        {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Middle Name (Optional)</Text>
        <TextInput
          value={form.middleName}
          onChangeText={(v) => updateField("middleName", v)}
          placeholder="Enter middle name"
          style={[styles.input, styles.standaloneInput]}
        />
      </View>

      <View style={styles.rowFields}>
        <View style={[styles.field, styles.flex1]}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            value={form.lastName}
            onChangeText={(v) => updateField("lastName", v)}
            placeholder="Last name"
            style={[styles.input, styles.standaloneInput, errors.lastName && styles.inputError]}
          />
          {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
        </View>
        <View style={[styles.field, styles.flex1, styles.ml12]}>
          <Text style={styles.label}>Suffix (Optional)</Text>
          <TextInput
            value={form.suffix}
            onChangeText={(v) => updateField("suffix", v)}
            placeholder="--"
            style={[styles.input, styles.standaloneInput]}
          />
        </View>
      </View>

      {/* Birthday + Gender row */}
      <View style={styles.rowFields}>
        <View style={[styles.field, styles.flex1]}>
          <Text style={styles.label}>Birthday</Text>
          <TouchableOpacity
            style={[styles.inputWrapper, errors.birthday && styles.inputError]}
            onPress={() => setDatePickerVisible(true)}
          >
            <Text style={[styles.input, { paddingVertical: 14 }]}>
              {form.birthday || "Select date"}
            </Text>
            <Ionicons name="calendar-outline" size={18} color="#999" />
          </TouchableOpacity>
          {errors.birthday ? <Text style={styles.errorText}>{errors.birthday}</Text> : null}
        </View>

        <View style={[styles.field, styles.flex1, styles.ml12]}>
          <Text style={styles.label}>Gender</Text>
          <TouchableOpacity
            style={[styles.inputWrapper, errors.gender && styles.inputError]}
            onPress={() => openPicker("Select gender", GENDER_OPTIONS, "gender")}
          >
            <Text style={[styles.input, { paddingVertical: 14 }]}>
              {form.gender || "Select gender"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#999" />
          </TouchableOpacity>
          {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}
        </View>
      </View>

      {/* Civil Status + Citizenship row */}
      <View style={styles.rowFields}>
        <View style={[styles.field, styles.flex1]}>
          <Text style={styles.label}>Civil Status</Text>
          <TouchableOpacity
            style={[styles.inputWrapper, errors.civilStatus && styles.inputError]}
            onPress={() => openPicker("Select civil status", CIVIL_STATUS_OPTIONS, "civilStatus")}
          >
            <Text style={[styles.input, { paddingVertical: 14 }]}>
              {form.civilStatus || "Select status"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#999" />
          </TouchableOpacity>
          {errors.civilStatus ? <Text style={styles.errorText}>{errors.civilStatus}</Text> : null}
        </View>

        <View style={[styles.field, styles.flex1, styles.ml12]}>
          <Text style={styles.label}>Citizenship</Text>
          <TouchableOpacity
            style={[styles.inputWrapper, errors.citizenship && styles.inputError]}
            onPress={() => openPicker("Select citizenship", CITIZENSHIP_OPTIONS, "citizenship")}
          >
            <Text style={[styles.input, { paddingVertical: 14 }]}>
              {form.citizenship || "Select citizenship"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#999" />
          </TouchableOpacity>
          {errors.citizenship ? <Text style={styles.errorText}>{errors.citizenship}</Text> : null}
        </View>
      </View>
    </>
  );

  // ─── STEP 2: Contact & Background ───────────────────────
  const renderStep2 = () => (
    <>
      <Text style={styles.sectionTitle}>Provide your contact & background</Text>

      {errors.general ? (
        <View style={styles.generalError}>
          <Text style={styles.generalErrorText}>{errors.general}</Text>
        </View>
      ) : null}

      <View style={styles.field}>
        <Text style={styles.label}>Mobile Number</Text>
        <TextInput
          value={form.mobile}
          onChangeText={(v) => updateField("mobile", v.replace(/[^0-9]/g, ""))}
          placeholder="09XXXXXXXXX"
          style={[styles.input, styles.standaloneInput, errors.mobile && styles.inputError]}
          keyboardType="phone-pad"
        />
        {errors.mobile ? <Text style={styles.errorText}>{errors.mobile}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Facebook</Text>
        <TextInput
          value={form.facebook}
          onChangeText={(v) => updateField("facebook", v)}
          placeholder="https://facebook.com/yourprofile"
          style={[styles.input, styles.standaloneInput, errors.facebook && styles.inputError]}
          autoCapitalize="none"
          keyboardType="url"
        />
        {errors.facebook ? <Text style={styles.errorText}>{errors.facebook}</Text> : null}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Address Information</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Street / Unit</Text>
        <TextInput
          value={form.street}
          onChangeText={(v) => updateField("street", v)}
          placeholder="Street / Unit"
          style={[styles.input, styles.standaloneInput, errors.street && styles.inputError]}
        />
        {errors.street ? <Text style={styles.errorText}>{errors.street}</Text> : null}
      </View>

      <View style={styles.rowFields}>
        <View style={[styles.field, styles.flex1]}>
          <Text style={styles.label}>Barangay</Text>
          <TextInput
            value={form.barangay}
            onChangeText={(v) => updateField("barangay", v)}
            placeholder="Barangay"
            style={[styles.input, styles.standaloneInput, errors.barangay && styles.inputError]}
          />
          {errors.barangay ? <Text style={styles.errorText}>{errors.barangay}</Text> : null}
        </View>
        <View style={[styles.field, styles.flex1, styles.ml12]}>
          <Text style={styles.label}>City</Text>
          <TextInput
            value={form.city}
            onChangeText={(v) => updateField("city", v)}
            placeholder="City"
            style={[styles.input, styles.standaloneInput, errors.city && styles.inputError]}
          />
          {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}
        </View>
      </View>

      <View style={styles.rowFields}>
        <View style={[styles.field, styles.flex1]}>
          <Text style={styles.label}>Province</Text>
          <TextInput
            value={form.province}
            onChangeText={(v) => updateField("province", v)}
            placeholder="Province"
            style={[styles.input, styles.standaloneInput, errors.province && styles.inputError]}
          />
          {errors.province ? <Text style={styles.errorText}>{errors.province}</Text> : null}
        </View>
        <View style={[styles.field, styles.flex1, styles.ml12]}>
          <Text style={styles.label}>Country</Text>
          <TextInput
            value={form.country}
            onChangeText={(v) => updateField("country", v)}
            placeholder="Country"
            style={[styles.input, styles.standaloneInput, errors.country && styles.inputError]}
          />
          {errors.country ? <Text style={styles.errorText}>{errors.country}</Text> : null}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Zip Code</Text>
        <TextInput
          value={form.zip}
          onChangeText={(v) => updateField("zip", v)}
          placeholder="Zip Code"
          style={[styles.input, styles.standaloneInput, errors.zip && styles.inputError]}
          keyboardType="number-pad"
        />
        {errors.zip ? <Text style={styles.errorText}>{errors.zip}</Text> : null}
      </View>
    </>
  );

  // ─── STEP 3: Review ──────────────────────────────────────
  const renderStep3 = () => (
    <>
      <Text style={styles.sectionTitle}>Review Information</Text>
      <Text style={styles.sectionSubtitle}>Check your details before submitting</Text>

      {errors.general ? (
        <View style={styles.generalError}>
          <Text style={styles.generalErrorText}>{errors.general}</Text>
        </View>
      ) : null}

      <View style={styles.reviewCard}>
        <View style={styles.reviewRow}>
          <View style={styles.reviewAvatar}>
            <Image
              source={
                form.profilePhoto?.uri
                  ? { uri: form.profilePhoto.uri }
                  : require("../../assets/images/logo.png")
              }
              style={styles.reviewAvatarImage}
            />
          </View>
          <View>
            <Text style={styles.reviewTitle}>
              {form.firstName} {form.lastName}
            </Text>
            <Text style={styles.reviewText}>{form.email}</Text>
          </View>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewHeading}>Personal Information</Text>
          {[
            ["First Name", form.firstName],
            ["Middle Name", form.middleName],
            ["Last Name", form.lastName],
            ["Suffix", form.suffix],
            ["Birthday", form.birthday],
            ["Gender", form.gender],
            ["Civil Status", form.civilStatus],
            ["Citizenship", form.citizenship],
          ].map(([label, value]) => (
            <Text key={label} style={styles.reviewTextSmall}>
              {label}: {value || "-"}
            </Text>
          ))}
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewHeading}>Contact Information</Text>
          {[
            ["Mobile", form.mobile],
            ["Email", form.email],
            ["Facebook", form.facebook],
            ["Street", form.street],
            ["Barangay", form.barangay],
            ["City", form.city],
            ["Province", form.province],
            ["Country", form.country],
            ["Zip Code", form.zip],
          ].map(([label, value]) => (
            <Text key={label} style={styles.reviewTextSmall}>
              {label}: {value || "-"}
            </Text>
          ))}
        </View>
      </View>
    </>
  );

  // ─── STEP 4: Success ─────────────────────────────────────
  const renderStep4 = () => (
    <View style={styles.successContainer}>
      <Text style={styles.successTitle}>Success!</Text>
      <Text style={styles.successSubtitle}>
        We sent a verification link to {form.email}
      </Text>
      <View style={styles.successBadge}>
        <Ionicons name="checkmark" size={72} color="#fff" />
      </View>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.primaryButtonText}>Go to Login</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStepContent = () => {
    if (step === 0) return renderStep0();
    if (step === 1) return renderStep1();
    if (step === 2) return renderStep2();
    if (step === 3) return renderStep3();
    if (step === 4) return renderStep4();
    return null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={backStep}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join ISKKOLAR today</Text>
        <View style={styles.stepsRow}>
          {STEP_TITLES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.stepDot,
                index <= step && index < 4 ? styles.stepDotActive : styles.stepDotInactive,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>{renderStepContent()}</View>

        {step < 4 ? (
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={step === 3 ? handleRegister : nextStep}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {step === 3
                ? loading ? "Registering..." : "Register Account"
                : loading ? "Validating..." : "Next Step →"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      {/* Picker Modal — single instance, reused for all pickers */}
      <PickerModal
        visible={pickerConfig.visible}
        title={pickerConfig.title}
        options={pickerConfig.options}
        selected={form[pickerConfig.field]}
        onSelect={(value) => updateField(pickerConfig.field, value)}
        onClose={closePicker}
      />

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={datePickerVisible}
        date={new Date()}
        onConfirm={(date) => updateField("birthday", formatDate(date))}
        onClose={() => setDatePickerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

// ─── STYLES (unchanged from your original) ───────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f5f5" },
  headerContainer: {
    backgroundColor: "#5b5f97",
    paddingTop: Platform.OS === "ios" ? 50 : 32,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center", marginBottom: 14,
  },
  title: { fontSize: 28, fontWeight: "700", color: "#fff" },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.75)", marginTop: 6 },
  stepsRow: { flexDirection: "row", marginTop: 18, gap: 10 },
  stepDot: { width: 40, height: 6, borderRadius: 4, marginRight: 6 },
  stepDotActive: { backgroundColor: "#fff" },
  stepDotInactive: { backgroundColor: "rgba(255,255,255,0.35)" },
  container: { padding: 18, paddingBottom: 32 },
  card: {
    backgroundColor: "#fff", borderRadius: 18, padding: 18,
    marginTop: -28, marginBottom: 18,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 }, elevation: 5,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#3d4076", marginBottom: 12 },
  sectionSubtitle: { fontSize: 13, color: "#667084", marginBottom: 14 },
  field: { marginBottom: 16 },
  photoRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  avatarWrapper: {
    width: 82, height: 82, borderRadius: 18,
    backgroundColor: "rgba(91,95,151,0.15)",
    justifyContent: "center", alignItems: "center", marginRight: 16,
  },
  avatar: { width: 68, height: 68, borderRadius: 16 },
  uploadButton: {
    flex: 1, borderRadius: 14, backgroundColor: "#5b5f97",
    paddingVertical: 12, alignItems: "center", justifyContent: "center",
  },
  uploadButtonText: { color: "#fff", fontWeight: "600" },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#e0e0e0",
    backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 12,
  },
  // For TextInputs that don't use inputWrapper (standalone)
  standaloneInput: {
    borderWidth: 1, borderColor: "#e0e0e0",
    borderRadius: 12, paddingHorizontal: 12,
    height: 48, color: "#111", fontSize: 14,
  },
  input: { flex: 1, height: 48, color: "#111", fontSize: 14 },
  icon: { marginRight: 10 },
  eyeButton: { padding: 8 },
  inputError: { borderColor: "#dc2626" },
  hintText: { fontSize: 12, color: "#666", marginTop: 6 },
  errorText: { color: "#dc2626", fontSize: 12, marginTop: 6 },
  generalError: {
    backgroundColor: "#fef2f2", borderRadius: 10,
    padding: 12, marginBottom: 14,
    borderWidth: 1, borderColor: "#fecaca",
  },
  generalErrorText: { color: "#dc2626", fontSize: 13 },
  rowFields: { flexDirection: "row" },
  flex1: { flex: 1 },
  ml12: { marginLeft: 12 },
  primaryButton: {
    backgroundColor: "#5b5f97", paddingVertical: 14,
    borderRadius: 14, alignItems: "center",
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  reviewCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "rgba(0,0,0,0.05)", marginTop: 10,
  },
  reviewRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  reviewAvatar: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: "rgba(91,95,151,0.15)",
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  reviewAvatarImage: { width: 46, height: 46, borderRadius: 12 },
  reviewTitle: { fontSize: 13, fontWeight: "700", color: "#3d4076" },
  reviewText: { fontSize: 13, color: "#333", marginTop: 4 },
  reviewSection: { marginTop: 14 },
  reviewHeading: { fontSize: 14, fontWeight: "700", color: "#3d4076", marginBottom: 8 },
  reviewTextSmall: { fontSize: 12, color: "#333", marginBottom: 4 },
  successContainer: { alignItems: "center", paddingVertical: 40 },
  successTitle: { fontSize: 32, fontWeight: "800", color: "#3d4076", marginBottom: 12 },
  successSubtitle: { fontSize: 15, color: "#666", marginBottom: 26, textAlign: "center" },
  successBadge: {
    width: 160, height: 160, borderRadius: 100,
    backgroundColor: "#5b5f97",
    justifyContent: "center", alignItems: "center", marginBottom: 30,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center", alignItems: "center", padding: 24,
  },
  modal: {
    width: "100%", backgroundColor: "#fff",
    borderRadius: 18, padding: 16, maxHeight: "85%",
  },
  dateModal: { width: "100%", backgroundColor: "#fff", borderRadius: 18, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12, color: "#3d4076" },
  option: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14, marginBottom: 6 },
  optionSelected: { backgroundColor: "rgba(91,95,151,0.12)" },
  optionText: { fontSize: 14, color: "#333" },
  optionTextSelected: { fontWeight: "700", color: "#3d4076" },
  closeArea: { marginTop: 8, height: 40, alignItems: "center", justifyContent: "center" },
  pickerRow: { flexDirection: "row", justifyContent: "space-between" },
  pickerColumn: { width: "30%", maxHeight: 260 },
  buttonRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
  modalButton: {
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 12, backgroundColor: "rgba(91,95,151,0.12)", marginLeft: 8,
  },
  modalButtonText: { color: "#3d4076", fontWeight: "700" },
});

const strengthStyles = StyleSheet.create({
  container: { marginTop: 8, alignItems: "flex-start" },
  barContainer: { flexDirection: "row", gap: 4 },
  bar: { height: 4, width: "23%", borderRadius: 2, backgroundColor: "#e0e0e0" },
  label: { fontSize: 12, fontWeight: "600", marginTop: 6 },
});