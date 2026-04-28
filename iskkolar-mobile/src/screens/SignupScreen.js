import React, { useState, useEffect, useRef } from "react";
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
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSignup } from "../hooks/useSignup";

const GENDER_OPTIONS = ["Male", "Female"];
const CIVIL_STATUS_OPTIONS = ["Single", "Married"];
const CITIZENSHIP_OPTIONS = ["Filipino", "Others"];
const STEP_TITLES = [
  "Account Setup",
  "Personal Details",
  "Contact & Background",
  "Review Information",
];

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
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={modalStyles.yearPickerModal}>
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View style={[modalStyles.yearPickerContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={modalStyles.yearPickerHeader}>
            <Text style={modalStyles.yearPickerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
              <Ionicons name="close" size={24} color="#3d4076" />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={modalStyles.yearPickerScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {options.length === 0 ? (
              <View style={modalStyles.emptyState}>
                <Text style={modalStyles.emptyText}>No options available</Text>
              </View>
            ) : (
              options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    modalStyles.yearPickerOption,
                    option === selected ? modalStyles.yearPickerOptionActive : null,
                  ]}
                  onPress={() => {
                    onSelect(option);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      modalStyles.yearPickerOptionText,
                      option === selected ? modalStyles.yearPickerOptionTextActive : null,
                    ]}
                  >
                    {option}
                  </Text>
                  {option === selected && (
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
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
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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
  const insets = useSafeAreaInsets();
  // All logic lives in the hook
  const {
    step, loading, form, errors, addressData,
    resendCooldown, resendLoading, resendError, resendMessage,
    updateField, nextStep, backStep, handleRegister, handleResendVerification, formatDate, fetchProvinces,
  } = useSignup(navigation);

  useEffect(() => {
    if (step === 2 && addressData.provinces.length === 0) {
      fetchProvinces();
    }
  }, [step]);

  // Local UI-only state (modals don't belong in the hook)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const stepFade = useRef(new Animated.Value(1)).current;
  const stepSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    stepFade.setValue(0);
    stepSlide.setValue(10);
    Animated.timing(stepFade, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
    Animated.timing(stepSlide, {
      toValue: 0,
      duration: 350,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [step]);

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
      mediaTypes: ['images'],
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
          <TextInput placeholderTextColor="#888"
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
          <TextInput placeholderTextColor="#888"
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
          <TextInput placeholderTextColor="#888"
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
        <View style={{ flex: 1, gap: 10 }}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickProfilePhoto}
          >
            <Text style={styles.uploadButtonText}>
              {form.profilePhoto?.uri ? "Change Photo" : "Add Profile Photo"}
            </Text>
          </TouchableOpacity>
          {form.profilePhoto?.uri && (
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: "#fee2e2", borderWidth: 0 }]}
              onPress={() => updateField("profilePhoto", null)}
            >
              <Text style={[styles.uploadButtonText, { color: "#ef4444" }]}>
                Remove Photo
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {errors.profilePhoto ? (
        <Text style={[styles.errorText, { marginBottom: 16 }]}>{errors.profilePhoto}</Text>
      ) : null}

      <View style={styles.field}>
        <Text style={styles.label}>First Name</Text>
        <TextInput placeholderTextColor="#888"
          value={form.firstName}
          onChangeText={(v) => updateField("firstName", v)}
          placeholder="Enter first name"
          style={[styles.input, styles.standaloneInput, errors.firstName && styles.inputError]}
        />
        {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Middle Name (Optional)</Text>
        <TextInput placeholderTextColor="#888"
          value={form.middleName}
          onChangeText={(v) => updateField("middleName", v)}
          placeholder="Enter middle name"
          style={[styles.input, styles.standaloneInput]}
        />
      </View>

      <View style={styles.rowFields}>
        <View style={[styles.field, styles.flex1]}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput placeholderTextColor="#888"
            value={form.lastName}
            onChangeText={(v) => updateField("lastName", v)}
            placeholder="Last name"
            style={[styles.input, styles.standaloneInput, errors.lastName && styles.inputError]}
          />
          {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
        </View>
        <View style={[styles.field, styles.flex1, styles.ml12]}>
          <Text style={styles.label}>Suffix (Optional)</Text>
          <TextInput placeholderTextColor="#888"
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

      {form.citizenship === "Others" && (
        <View style={styles.generalError}>
          <Text style={styles.generalErrorText}>You must be a Filipino citizen to apply for an ISKKOLAR scholarship.</Text>
        </View>
      )}
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
        <TextInput placeholderTextColor="#888"
          value={form.mobile}
          onFocus={() => {
            if (!form.mobile) updateField("mobile", "09");
          }}
          onChangeText={(v) => {
            let digits = v.replace(/[^0-9]/g, "");
            if (!digits.startsWith("09")) {
              digits = digits.startsWith("0") ? "09" + digits.slice(1) : "09" + digits;
            }
            updateField("mobile", digits.slice(0, 11));
          }}
          placeholder="09XXXXXXXXX"
          style={[styles.input, styles.standaloneInput, errors.mobile && styles.inputError]}
          keyboardType="phone-pad"
          maxLength={11}
        />
        {errors.mobile ? <Text style={styles.errorText}>{errors.mobile}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Facebook</Text>
        <TextInput placeholderTextColor="#888"
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
        <TextInput placeholderTextColor="#888"
          value={form.street}
          onChangeText={(v) => updateField("street", v)}
          placeholder="Street / Unit"
          style={[styles.input, styles.standaloneInput, errors.street && styles.inputError]}
        />
        {errors.street ? <Text style={styles.errorText}>{errors.street}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Province</Text>
        <TouchableOpacity
          style={[styles.inputWrapper, errors.province && styles.inputError]}
          onPress={() => openPicker("Select province", addressData.provinces.map(p => p.name), "province")}
        >
          <Text style={[styles.input, { paddingVertical: 14, color: form.province ? '#111' : '#999' }]}>
            {form.province || "Select province"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#999" />
        </TouchableOpacity>
        {errors.province ? <Text style={styles.errorText}>{errors.province}</Text> : null}
      </View>

      <View style={styles.rowFields}>
        <View style={[styles.field, styles.flex1]}>
          <Text style={styles.label}>City/Municipality</Text>
          <TouchableOpacity
            style={[styles.inputWrapper, errors.city && styles.inputError]}
            onPress={() => openPicker("Select city", addressData.cities.map(c => c.name), "city")}
          >
            <Text style={[styles.input, { paddingVertical: 14, color: form.city ? '#111' : '#999' }]}>
              {form.city || "Select city"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#999" />
          </TouchableOpacity>
          {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}
        </View>

        <View style={[styles.field, styles.flex1, styles.ml12]}>
          <Text style={styles.label}>Barangay</Text>
          <TouchableOpacity
            style={[styles.inputWrapper, errors.barangay && styles.inputError]}
            onPress={() => openPicker("Select barangay", addressData.barangays.map(b => b.name), "barangay")}
          >
            <Text style={[styles.input, { paddingVertical: 14, color: form.barangay ? '#111' : '#999' }]}>
              {form.barangay || "Select barangay"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#999" />
          </TouchableOpacity>
          {errors.barangay ? <Text style={styles.errorText}>{errors.barangay}</Text> : null}
        </View>
      </View>

      <View style={styles.rowFields}>
        <View style={[styles.field, styles.flex1]}>
          <Text style={styles.label}>Country</Text>
          <TextInput placeholderTextColor="#888"
            value="Philippines"
            editable={false}
            style={[styles.input, styles.standaloneInput, { backgroundColor: '#f0f0f0', color: '#666' }]}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Zip Code</Text>
        <TextInput placeholderTextColor="#888"
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
  const renderStep3 = () => {
    const renderReviewRow = (icon, label, value) => (
      <View style={styles.reviewDataRow}>
        <View style={styles.reviewIconWrapper}>
          <Ionicons name={icon} size={16} color="#5b5f97" />
        </View>
        <View style={styles.reviewDataText}>
          <Text style={styles.reviewLabel}>{label}</Text>
          <Text style={styles.reviewValue}>{value || "-"}</Text>
        </View>
      </View>
    );

    const renderReviewCard = (title, icon, items) => (
      <View style={styles.newReviewSection}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIconWrapper}>
            <Ionicons name={icon} size={18} color="#3d4076" />
          </View>
          <Text style={styles.newReviewHeading}>{title}</Text>
        </View>
        <View style={styles.newReviewCard}>
          {items.map(([iconName, label, value], idx) => (
            <React.Fragment key={label}>
              {renderReviewRow(iconName, label, value)}
              {idx < items.length - 1 && <View style={styles.reviewDivider} />}
            </React.Fragment>
          ))}
        </View>
      </View>
    );

    return (
      <View style={{ paddingBottom: 20 }}>
        <Text style={styles.sectionTitle}>Review Information</Text>
        <Text style={styles.sectionSubtitle}>Please review all details before completing your registration.</Text>

        {errors.general ? (
          <View style={styles.generalError}>
            <Text style={styles.generalErrorText}>{errors.general}</Text>
          </View>
        ) : null}

        {/* Profile Card */}
        <View style={styles.identityCard}>
          <View style={styles.identityLeft}>
            <View style={styles.identityAvatar}>
              <Image
                source={
                  form.profilePhoto?.uri
                    ? { uri: form.profilePhoto.uri }
                    : require("../../assets/images/logo.png")
                }
                style={styles.identityAvatarImage}
                resizeMode="cover"
              />
            </View>
          </View>
          <View style={styles.identityRight}>
            <Text style={styles.identityName} numberOfLines={1}>
              {form.firstName} {form.lastName}
            </Text>
            <Text style={styles.identityEmail} numberOfLines={1}>{form.email}</Text>
            <View style={styles.statusBadge}>
              <View style={styles.dot} />
              <Text style={styles.statusText}>Scholar Applicant</Text>
            </View>
          </View>
        </View>

        {renderReviewCard("Personal Information", "person-outline", [
          ["calendar-outline", "Birthday", form.birthday],
          ["male-female-outline", "Gender", form.gender],
          ["heart-outline", "Civil Status", form.civilStatus],
          ["flag-outline", "Citizenship", form.citizenship],
        ])}

        {renderReviewCard("Contact Details", "call-outline", [
          ["phone-portrait-outline", "Mobile", form.mobile],
          ["logo-facebook", "Facebook", form.facebook],
        ])}

        {renderReviewCard("Address Information", "location-outline", [
          ["home-outline", "Street", form.street],
          ["business-outline", "Barangay", form.barangay],
          ["map-outline", "City/Municipality", form.city],
          ["earth-outline", "Province", form.province],
          ["mail-open-outline", "Zip Code", form.zip],
        ])}
      </View>
    );
  };

  // ─── STEP 4: Success ─────────────────────────────────────
  const renderStep4 = () => (
    <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 32, alignItems: 'center' }}>
      <Text style={{ color: '#4F5288', fontSize: 30, fontWeight: 'bold', marginBottom: 8 }}>Success!</Text>
      <Text style={{ color: '#6b7280', marginBottom: 32, textAlign: 'center', fontSize: 16 }}>
        We sent a verification link to your email
      </Text>

      <View style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: '#4F5288', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
        <Ionicons name="checkmark" size={48} color="#4F5288" />
      </View>

      <TouchableOpacity
        style={{ backgroundColor: '#5b5f97', width: '100%', borderRadius: 8, paddingVertical: 14, alignItems: 'center' }}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={{ color: '#fff', fontWeight: '500', fontSize: 16 }}>Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          marginTop: 24,
          paddingVertical: 8,
          opacity: resendCooldown > 0 || resendLoading ? 0.5 : 1
        }}
        onPress={handleResendVerification}
        disabled={resendCooldown > 0 || resendLoading}
      >
        <Text style={{ color: '#4F5288', fontWeight: '500', fontSize: 16 }}>
          {resendLoading
            ? "Sending..."
            : resendCooldown > 0
              ? `Resend available in ${resendCooldown}s`
              : "Resend verification link"}
        </Text>
      </TouchableOpacity>

      {resendMessage ? (
        <Text style={{ color: '#10b981', marginTop: 16, fontSize: 14 }}>{resendMessage}</Text>
      ) : null}

      {resendError ? (
        <Text style={{ color: '#ef4444', marginTop: 16, fontSize: 14 }}>{resendError}</Text>
      ) : null}
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
      <View style={[styles.headerContainer, { paddingTop: insets.top + 16 }]}>
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

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.card, { opacity: stepFade, transform: [{ translateY: stepSlide }] }]}>
          {renderStepContent()}
        </Animated.View>

        {step < 4 ? (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (loading || (step === 1 && form.citizenship === "Others")) && styles.primaryButtonDisabled
            ]}
            onPress={step === 3 ? handleRegister : nextStep}
            disabled={loading || (step === 1 && form.citizenship === "Others")}
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
  screen: { flex: 1, backgroundColor: "#f8f9fc" },
  headerContainer: {
    backgroundColor: "#5b61a7",
    paddingTop: 16,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
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
  stepDotInactive: { backgroundColor: "rgba(255,255,255,0.3)" },
  container: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    marginTop: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    borderWidth: 1,
    borderColor: "#eff1f8",
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
  avatar: { width: 86, height: 86, borderRadius: 43 },
  uploadButton: {
    flex: 1, borderRadius: 14, backgroundColor: "#5b5f97",
    paddingVertical: 12, alignItems: "center", justifyContent: "center",
  },
  uploadButtonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  label: { fontSize: 13, fontWeight: "700", color: "#1c2131", marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#e0e0e0",
    backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 12,
  },
  standaloneInput: {
    borderWidth: 1, borderColor: "#e0e0e0",
    borderRadius: 12, paddingHorizontal: 12,
    height: 48, color: "#111", fontSize: 14,
  },
  input: { flex: 1, height: Platform.OS === "ios" ? 54 : 50, color: "#111", fontSize: 15 },
  icon: { marginRight: 12 },
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
  ml12: { marginLeft: 16 },
  primaryButton: {
    backgroundColor: "#5b5f97", paddingVertical: 14,
    borderRadius: 14, alignItems: "center",
  },
  primaryButtonDisabled: { opacity: 0.7, shadowOpacity: 0 },
  primaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.5 },
  reviewCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "rgba(0,0,0,0.05)", marginTop: 10,
  },
  reviewRow: { flexDirection: "row", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#eff1f8" },
  reviewAvatar: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: "rgba(91,95,151,0.15)",
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  reviewAvatarImage: { width: 46, height: 46, borderRadius: 12 },
  reviewInfo: { flex: 1 },
  reviewTitle: { fontSize: 13, fontWeight: "700", color: "#3d4076" },
  reviewText: { fontSize: 13, color: "#333", marginTop: 4 },
  reviewSection: { marginTop: 14 },
  reviewHeading: { fontSize: 14, fontWeight: "700", color: "#3d4076", marginBottom: 8 },
  reviewTextSmall: { fontSize: 12, color: "#333", marginBottom: 4 },
  successContainer: { alignItems: "center", paddingVertical: 40 },
  successTitle: { fontSize: 32, fontWeight: "900", color: "#4f5ec4", marginBottom: 12, textAlign: "center" },
  successSubtitle: { fontSize: 15, color: "#6e7798", marginBottom: 32, textAlign: "center", fontWeight: "500", lineHeight: 22 },
  successBadge: {
    width: 160, height: 160, borderRadius: 100,
    backgroundColor: "#5b5f97",
    justifyContent: "center", alignItems: "center", marginBottom: 30,
  },
  // Redesigned Review Styles
  identityCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#eff1f8",
    alignItems: "center",
    shadowColor: "#3d4076",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  identityLeft: { marginRight: 16 },
  identityAvatar: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: "rgba(91,95,151,0.1)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 3, borderColor: "#eff1f8"
  },
  identityAvatarImage: { width: 70, height: 70, borderRadius: 35 },
  identityRight: { flex: 1 },
  identityName: { fontSize: 20, fontWeight: "800", color: "#1c2131" },
  identityEmail: { fontSize: 13, color: "#667084", marginTop: 2 },
  statusBadge: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(91,95,151,0.1)",
    alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginTop: 8
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#5b5f97", marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: "700", color: "#5b5f97", textTransform: "uppercase" },
  newReviewSection: { marginBottom: 24 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, paddingLeft: 4 },
  newReviewHeading: { fontSize: 16, fontWeight: "700", color: "#3d4076" },
  newReviewCard: { backgroundColor: "#fff", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "#eff1f8" },
  reviewDataRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  reviewIconWrapper: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "rgba(91,95,151,0.08)",
    justifyContent: "center", alignItems: "center", marginRight: 12
  },
  reviewDataText: { flex: 1 },
  reviewLabel: { fontSize: 12, fontWeight: "600", color: "#667084" },
  reviewValue: { fontSize: 14, fontWeight: "700", color: "#1c2131", marginTop: 1 },
  reviewDivider: { height: 1, backgroundColor: "#f1f3f9", marginLeft: 44 },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
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
  yearPickerModal: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  yearPickerContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: "80%",
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 25
  },
  yearPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eff1f8"
  },
  yearPickerTitle: { fontSize: 20, fontWeight: "900", color: "#1c2131" },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },
  yearPickerScroll: { paddingHorizontal: 24 },
  yearPickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eff1f8",
    backgroundColor: "#fff",
  },
  yearPickerOptionActive: { backgroundColor: "#5b5f97", borderColor: "#5b5f97" },
  yearPickerOptionText: { fontSize: 16, fontWeight: "700", color: "#3d4076" },
  yearPickerOptionTextActive: { color: "#fff" },
  emptyState: { paddingVertical: 40, alignItems: "center" },
  emptyText: { color: "#9ca3af", fontSize: 15, fontWeight: "600" },
  sectionIconWrapper: { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(91,95,151,0.1)", justifyContent: "center", alignItems: "center", marginRight: 10 },
});

const strengthStyles = StyleSheet.create({
  container: { marginTop: 8, alignItems: "flex-start" },
  barContainer: { flexDirection: "row", gap: 4 },
  bar: { height: 4, width: "23%", borderRadius: 2, backgroundColor: "#e0e0e0" },
  label: { fontSize: 12, fontWeight: "600", marginTop: 6 },
});