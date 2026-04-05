import React, { useState, useEffect, useRef } from "react";
import * as ImagePicker from "expo-image-picker";
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

const GENDER_OPTIONS = ["Male", "Female", "Prefer not to say"];
const CIVIL_STATUS_OPTIONS = ["Single", "Married"];
const CITIZENSHIP_OPTIONS = ["Filipino", "Others"];
const STEP_TITLES = [
  "Account Setup",
  "Personal Details",
  "Contact & Background",
  "Review Information",
];

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
        <View style={[strengthStyles.bar, strengthStyles.bar1, strength.level >= 1 ? { backgroundColor: strength.color } : {}]} />
        <View style={[strengthStyles.bar, strengthStyles.bar2, strength.level >= 2 ? { backgroundColor: strength.color } : {}]} />
        <View style={[strengthStyles.bar, strengthStyles.bar3, strength.level >= 3 ? { backgroundColor: strength.color } : {}]} />
        <View style={[strengthStyles.bar, strengthStyles.bar4, strength.level >= 4 ? { backgroundColor: strength.color } : {}]} />
      </View>
      {strength.label ? <Text style={[strengthStyles.label, { color: strength.color }]}>{strength.label}</Text> : null}
    </View>
  );
}


function PickerModal({ visible, title, options, selected, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.yearPickerModal}>
        <View style={modalStyles.yearPickerContent}>
          <View style={modalStyles.yearPickerHeader}>
            <Text style={modalStyles.yearPickerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#4f5fc5" />
            </TouchableOpacity>
          </View>
          <ScrollView style={modalStyles.yearPickerScroll} showsVerticalScrollIndicator={true}>
            <View style={{ flexDirection: "column", paddingBottom: 20 }}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    modalStyles.yearPickerOption,
                    { width: "100%", marginBottom: 8, paddingVertical: 14 },
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
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DatePickerModal({ visible, date, onConfirm, onClose }) {
  const [year, setYear] = useState(date.getFullYear());
  const [month, setMonth] = useState(date.getMonth());
  const [day, setDay] = useState(date.getDate());

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 80; y -= 1) years.push(y);

  const handleConfirm = () => {
    const picked = new Date(year, month, day);
    onConfirm(picked);
    onClose();
  };

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
                  style={[
                    modalStyles.option,
                    d === day ? modalStyles.optionSelected : null,
                  ]}
                  onPress={() => setDay(d)}
                >
                  <Text
                    style={[
                      modalStyles.optionText,
                      d === day ? modalStyles.optionTextSelected : null,
                    ]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={modalStyles.pickerColumn}>
              {months.map((m, idx) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    modalStyles.option,
                    idx === month ? modalStyles.optionSelected : null,
                  ]}
                  onPress={() => {
                    setMonth(idx);
                    const max = daysInMonth(year, idx);
                    if (day > max) setDay(max);
                  }}
                >
                  <Text
                    style={[
                      modalStyles.optionText,
                      idx === month ? modalStyles.optionTextSelected : null,
                    ]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={modalStyles.pickerColumn}>
              {years.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[
                    modalStyles.option,
                    y === year ? modalStyles.optionSelected : null,
                  ]}
                  onPress={() => setYear(y)}
                >
                  <Text
                    style={[
                      modalStyles.optionText,
                      y === year ? modalStyles.optionTextSelected : null,
                    ]}
                  >
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
            <TouchableOpacity style={modalStyles.modalButton} onPress={handleConfirm}>
              <Text style={modalStyles.modalButtonText}>Select</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SignupScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTitle, setPickerTitle] = useState("");
  const [pickerOptions, setPickerOptions] = useState([]);
  const [pickerValue, setPickerValue] = useState("");
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

  const [form, setForm] = useState({
    profilePhoto: null,
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    birthday: "",
    gender: "",
    civilStatus: "",
    citizenship: "",
    otherCitizenship: "",
    mobile: "",
    facebook: "",
    street: "",
    barangay: "",
    city: "",
    province: "",
    country: "",
    zip: "",
  });
  const [errors, setErrors] = useState({});

  const setProfilePhoto = async () => {
    if (form.profilePhoto) {
      setForm((prev) => ({ ...prev, profilePhoto: null }));
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setForm((prev) => ({
        ...prev,
        profilePhoto: { uri: result.assets[0].uri },
      }));
    }
  };

  const showPicker = (title, options, value, onSelect) => {
    setPickerTitle(title);
    setPickerOptions(options);
    setPickerValue(value);
    setPickerOnSelect(() => (v) => {
      setPickerValue(v);
      onSelect(v);
    });
    setPickerVisible(true);
  };

  const [pickerOnSelect, setPickerOnSelect] = useState(() => () => {});

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  };

  const validateStep = () => {
    const errs = {};

    if (step === 0) {
      if (!form.email.trim()) errs.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email";
      if (!form.password.trim()) errs.password = "Password is required";
      if (!form.confirmPassword.trim()) errs.confirmPassword = "Confirm password";
      if (form.password && form.confirmPassword && form.password !== form.confirmPassword)
        errs.confirmPassword = "Passwords must match";
    }

    if (step === 1) {
      if (!form.firstName.trim()) errs.firstName = "First name required";
      if (!form.lastName.trim()) errs.lastName = "Last name required";
      if (!form.birthday.trim()) errs.birthday = "Birthday required";
    }

    if (step === 2) {
      if (!form.mobile.trim()) errs.mobile = "Mobile number required";
      if (!form.street.trim()) errs.street = "Street required";
      if (!form.city.trim()) errs.city = "City required";
    }

    setErrors(errs);
    return Object.keys(errs).length > 0;
  };

  const nextStep = () => {
    if (validateStep()) return;
    setStep((s) => Math.min(s + 1, 4));
  };

  const backStep = () => {
    if (step === 0) return navigation.goBack();
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleRegister = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(4);
    }, 900);
  };

  const renderStep0 = () => (
    <>
      <Text style={styles.sectionTitle}>Create your login credentials</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
          <Ionicons name="mail-outline" size={18} color="#999" style={styles.icon} />
          <TextInput
            value={form.email}
            onChangeText={(value) => setForm({ ...form, email: value })}
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
            onChangeText={(value) => setForm({ ...form, password: value })}
            placeholder="Password"
            style={styles.input}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeButton}
          >
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
            onChangeText={(value) => setForm({ ...form, confirmPassword: value })}
            placeholder="Confirm Password"
            style={styles.input}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
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
    </>
  );

  const renderStep1 = () => (
    <>
      <Text style={styles.sectionTitle}>Provide your personal details</Text>

      <View style={styles.photoRow}>
        <View style={styles.avatarWrapper}>
          <Image
            source={form.profilePhoto || require("../../assets/images/logo.png")}
            style={styles.avatar}
          />
        </View>
        <TouchableOpacity style={styles.uploadButton} onPress={setProfilePhoto}>
          <Text style={styles.uploadButtonText}>
            {form.profilePhoto ? "Remove Photo" : "Add Profile Photo"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>First Name</Text>
        <TextInput
          value={form.firstName}
          onChangeText={(value) => setForm({ ...form, firstName: value })}
          placeholder="Enter first name"
          style={styles.input}
        />
        {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Middle Name (Optional)</Text>
        <TextInput
          value={form.middleName}
          onChangeText={(value) => setForm({ ...form, middleName: value })}
          placeholder="Enter middle name"
          style={styles.input}
        />
      </View>

      <View style={styles.rowFields}>
        <View style={[styles.field, styles.flex1]}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            value={form.lastName}
            onChangeText={(value) => setForm({ ...form, lastName: value })}
            placeholder="Last name"
            style={styles.input}
          />
          {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
        </View>
        <View style={[styles.field, styles.flex1, styles.ml12]}>
          <Text style={styles.label}>Suffix (Optional)</Text>
          <TextInput
            value={form.suffix}
            onChangeText={(value) => setForm({ ...form, suffix: value })}
            placeholder="--"
            style={styles.input}
          />
        </View>
      </View>

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
            style={styles.inputWrapper}
            onPress={() =>
              showPicker("Select gender", GENDER_OPTIONS, form.gender, (value) =>
                setForm({ ...form, gender: value })
              )
            }
          >
            <Text style={[styles.input, { paddingVertical: 14 }]}>
              {form.gender || "Select gender"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#999" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.rowFields}>
        <View style={[styles.field, styles.flex1]}>
          <Text style={styles.label}>Civil Status</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() =>
              showPicker("Select status", CIVIL_STATUS_OPTIONS, form.civilStatus, (value) =>
                setForm({ ...form, civilStatus: value })
              )
            }
          >
            <Text style={[styles.input, { paddingVertical: 14 }]}>
              {form.civilStatus || "Select status"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={[styles.field, styles.flex1, styles.ml12]}>
          <Text style={styles.label}>Citizenship</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() =>
              showPicker("Select citizenship", CITIZENSHIP_OPTIONS, form.citizenship, (value) =>
                setForm({
                  ...form,
                  citizenship: value,
                  otherCitizenship: value !== "Others" ? "" : form.otherCitizenship,
                })
              )
            }
          >
            <Text style={[styles.input, { paddingVertical: 14 }]}>
              {form.citizenship || "Select citizenship"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#999" />
          </TouchableOpacity>
        </View>
      </View>

      {form.citizenship === "Others" && (
        <View style={styles.field}>
          <Text style={styles.label}>Please specify citizenship</Text>
          <TextInput
            value={form.otherCitizenship}
            onChangeText={(value) => setForm({ ...form, otherCitizenship: value })}
            placeholder="Enter citizenship"
            style={styles.input}
          />
        </View>
      )}
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.sectionTitle}>Provide your contact & background</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Mobile Number</Text>
        <TextInput
          value={form.mobile}
          onChangeText={(value) => setForm({ ...form, mobile: value.replace(/[^0-9]/g, "") })}
          placeholder="Enter mobile number"
          style={styles.input}
          keyboardType="phone-pad"
        />
        {errors.mobile ? <Text style={styles.errorText}>{errors.mobile}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Facebook</Text>
        <TextInput
          value={form.facebook}
          onChangeText={(value) => setForm({ ...form, facebook: value })}
          placeholder="Enter Facebook link"
          style={styles.input}
        />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Address Information</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Street / Unit</Text>
        <TextInput
          value={form.street}
          onChangeText={(value) => setForm({ ...form, street: value })}
          placeholder="Street / Unit"
          style={styles.input}
        />
        {errors.street ? <Text style={styles.errorText}>{errors.street}</Text> : null}
      </View>

      <View style={styles.rowFields}>
        <View style={[styles.field, styles.flex1]}>
          <Text style={styles.label}>Barangay</Text>
          <TextInput
            value={form.barangay}
            onChangeText={(value) => setForm({ ...form, barangay: value })}
            placeholder="Barangay"
            style={styles.input}
          />
        </View>
        <View style={[styles.field, styles.flex1, styles.ml12]}>
          <Text style={styles.label}>City</Text>
          <TextInput
            value={form.city}
            onChangeText={(value) => setForm({ ...form, city: value })}
            placeholder="City"
            style={styles.input}
          />
        </View>
      </View>

      <View style={styles.rowFields}>
        <View style={[styles.field, styles.flex1]}>
          <Text style={styles.label}>Province</Text>
          <TextInput
            value={form.province}
            onChangeText={(value) => setForm({ ...form, province: value })}
            placeholder="Province"
            style={styles.input}
          />
        </View>
        <View style={[styles.field, styles.flex1, styles.ml12]}>
          <Text style={styles.label}>Country</Text>
          <TextInput
            value={form.country}
            onChangeText={(value) => setForm({ ...form, country: value })}
            placeholder="Country"
            style={styles.input}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Zip Code</Text>
        <TextInput
          value={form.zip}
          onChangeText={(value) => setForm({ ...form, zip: value })}
          placeholder="Zip Code"
          style={styles.input}
        />
      </View>
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.sectionTitle}>Review Information</Text>
      <Text style={styles.sectionSubtitle}>Check your details</Text>

      <View style={styles.reviewCard}>
        <View style={styles.reviewRow}>
          <View style={styles.reviewAvatar}>
            <Image
              source={form.profilePhoto || require("../../assets/images/logo.png")}
              style={styles.reviewAvatarImage}
            />
          </View>
          <View style={styles.reviewInfo}>
            <Text style={styles.reviewTitle}>Profile Photo</Text>
            <Text style={styles.reviewText}>Uploaded image</Text>
          </View>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewHeading}>Personal Information</Text>
          <Text style={styles.reviewTextSmall}>First Name: {form.firstName || "-"}</Text>
          <Text style={styles.reviewTextSmall}>Middle Name: {form.middleName || "-"}</Text>
          <Text style={styles.reviewTextSmall}>Last Name: {form.lastName || "-"}</Text>
          <Text style={styles.reviewTextSmall}>Suffix: {form.suffix || "-"}</Text>
          <Text style={styles.reviewTextSmall}>Birthday: {form.birthday || "-"}</Text>
          <Text style={styles.reviewTextSmall}>Gender: {form.gender || "-"}</Text>
          <Text style={styles.reviewTextSmall}>Civil Status: {form.civilStatus || "-"}</Text>
          <Text style={styles.reviewTextSmall}>
            Citizenship: {form.citizenship === "Others" ? form.otherCitizenship : form.citizenship || "-"}
          </Text>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewHeading}>Contact Information</Text>
          <Text style={styles.reviewTextSmall}>Mobile: {form.mobile || "-"}</Text>
          <Text style={styles.reviewTextSmall}>Email: {form.email || "-"}</Text>
          <Text style={styles.reviewTextSmall}>Facebook: {form.facebook || "-"}</Text>
          <Text style={styles.reviewTextSmall}>Street: {form.street || "-"}</Text>
          <Text style={styles.reviewTextSmall}>Barangay: {form.barangay || "-"}</Text>
          <Text style={styles.reviewTextSmall}>City: {form.city || "-"}</Text>
          <Text style={styles.reviewTextSmall}>Province: {form.province || "-"}</Text>
          <Text style={styles.reviewTextSmall}>Country: {form.country || "-"}</Text>
          <Text style={styles.reviewTextSmall}>Zip Code: {form.zip || "-"}</Text>
        </View>
      </View>
    </>
  );

  const renderStep4 = () => (
    <View style={styles.successContainer}>
      <Text style={styles.successTitle}>Success!</Text>
      <Text style={styles.successSubtitle}>We sent a verification link to your email</Text>
      <View style={styles.successBadge}>
        <Ionicons name="checkmark" size={72} color="#fff" />
      </View>
      <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("Login")}> 
        <Text style={styles.primaryButtonText}>Continue</Text>
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

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.card, { opacity: stepFade, transform: [{ translateY: stepSlide }] }]}>
          {renderStepContent()}
        </Animated.View>
        {step < 4 ? (
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={step === 3 ? handleRegister : nextStep}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {step === 3 ? (loading ? "Registering..." : "Register Account") : "Next Step →"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <PickerModal
        visible={pickerVisible}
        title={pickerTitle}
        options={pickerOptions}
        selected={pickerValue}
        onSelect={(value) => pickerOnSelect(value)}
        onClose={() => setPickerVisible(false)}
      />

      <DatePickerModal
        visible={datePickerVisible}
        date={new Date()}
        onConfirm={(date) => setForm({ ...form, birthday: formatDate(date.toISOString()) })}
        onClose={() => setDatePickerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8f9fc" },
  headerContainer: {
    backgroundColor: "#5b61a7",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
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
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 32, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: "rgba(255,255,255,0.85)", marginTop: 6, fontWeight: "500" },
  stepsRow: {
    flexDirection: "row",
    marginTop: 24,
    gap: 8,
  },
  stepDot: {
    height: 6,
    borderRadius: 4,
    flex: 1,
    marginRight: 6,
  },
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#4f5fc5",
    marginBottom: 16,
  },
  sectionSubtitle: { fontSize: 13, color: "#7f88a3", marginBottom: 16, fontWeight: "600" },
  field: { marginBottom: 18 },
  photoRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  avatarWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#eff1f8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: { width: 86, height: 86, borderRadius: 43 },
  uploadButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "#eef1fc",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dbe2f6",
  },
  uploadButtonText: { color: "#4f5fc5", fontWeight: "800", fontSize: 14 },
  label: { fontSize: 13, fontWeight: "700", color: "#1c2131", marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#a9b1c0",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: { flex: 1, height: Platform.OS === "ios" ? 54 : 50, color: "#111", fontSize: 15 },
  icon: { marginRight: 12 },
  eyeButton: { padding: 8 },
  inputError: { borderColor: "#dc2626", backgroundColor: "#fffcfc" },
  hintText: { fontSize: 12, color: "#7f88a3", marginTop: 6, fontWeight: "500" },
  errorText: { color: "#dc2626", fontSize: 12, marginTop: 6, fontWeight: "600" },
  rowFields: { flexDirection: "row" },
  flex1: { flex: 1 },
  ml12: { marginLeft: 16 },
  primaryButton: {
    backgroundColor: "#5b61a7",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#2d3a7c",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonDisabled: { opacity: 0.7, shadowOpacity: 0 },
  primaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.5 },
  reviewCard: {
    backgroundColor: "#fbfbff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eff1f8",
    marginTop: 6,
  },
  reviewRow: { flexDirection: "row", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#eff1f8" },
  reviewAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#eff1f8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  reviewAvatarImage: { width: 60, height: 60, borderRadius: 30 },
  reviewInfo: { flex: 1 },
  reviewTitle: { fontSize: 15, fontWeight: "900", color: "#111" },
  reviewText: { fontSize: 13, color: "#7a82a0", marginTop: 4, fontWeight: "500" },
  reviewSection: { marginTop: 16 },
  reviewHeading: { fontSize: 14, fontWeight: "900", color: "#4f5fc5", marginBottom: 12 },
  reviewTextSmall: { fontSize: 13, color: "#222", marginBottom: 8, fontWeight: "600" },
  successContainer: { alignItems: "center", paddingVertical: 40 },
  successTitle: { fontSize: 32, fontWeight: "900", color: "#4f5ec4", marginBottom: 12, textAlign: "center" },
  successSubtitle: { fontSize: 15, color: "#6e7798", marginBottom: 32, textAlign: "center", fontWeight: "500", lineHeight: 22 },
  successBadge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#29d0a5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    shadowColor: "#29d0a5",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modal: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    maxHeight: "85%",
  },
  dateModal: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12, color: "#3d4076" },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
  },
  optionSelected: { backgroundColor: "rgba(91,95,151,0.12)" },
  optionText: { fontSize: 14, color: "#333" },
  optionTextSelected: { fontWeight: "700", color: "#3d4076" },
  closeArea: {
    marginTop: 8,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerRow: { flexDirection: "row", justifyContent: "space-between" },
  pickerColumn: { width: "30%", maxHeight: 260 },
  buttonRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(91,95,151,0.12)",
    marginLeft: 8,
  },
  modalButtonText: { color: "#3d4076", fontWeight: "700" },
  yearPickerModal: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  yearPickerContent: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80%", paddingTop: 16 },
  yearPickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#e4e8f8" },
  yearPickerTitle: { fontSize: 18, fontWeight: "800", color: "#3d4fa0" },
  yearPickerScroll: { paddingHorizontal: 16, paddingVertical: 12 },
  yearPickerOption: { paddingVertical: 12, marginBottom: 8, borderRadius: 10, borderWidth: 1, borderColor: "#d7def8", backgroundColor: "#f8f9ff", alignItems: "center" },
  yearPickerOptionActive: { backgroundColor: "#4f5fc5", borderColor: "#4f5fc5" },
  yearPickerOptionText: { fontSize: 16, fontWeight: "700", color: "#4f5fc5" },
  yearPickerOptionTextActive: { color: "#fff" },
});

const strengthStyles = StyleSheet.create({
  container: { marginTop: 8, alignItems: "flex-start" },
  barContainer: { flexDirection: "row", gap: 4 },
  bar: { height: 4, borderRadius: 2, flex: 1, backgroundColor: "#e0e0e0" },
  bar1: { width: "23%" },
  bar2: { width: "23%" },
  bar3: { width: "23%" },
  bar4: { width: "23%" },
  label: { fontSize: 12, fontWeight: "600", marginTop: 6 },
});
