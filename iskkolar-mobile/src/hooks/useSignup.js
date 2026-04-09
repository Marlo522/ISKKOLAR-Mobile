import { useState, useEffect } from 'react';
import { validateSignupStep, register, resendVerificationEmail } from '../services/authService';

// ─── CONSTANTS ───────────────────────────────────────────────
export const GENDER_OPTIONS = ['Male', 'Female'];
export const CITIZENSHIP_OPTIONS = ['Filipino', 'Others'];
export const CIVIL_STATUS_OPTIONS = ['Single', 'Married'];

export const STEP_TITLES = [
  'Account Setup',
  'Personal Details',
  'Contact & Background',
  'Review Information',
];

// ─── INITIAL FORM STATE ──────────────────────────────────────
const INITIAL_FORM = {
  profilePhoto: null,   // { uri, fileName, mimeType } from image picker
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  birthday: '',
  gender: '',
  civilStatus: 'Single',
  citizenship: '',
  mobile: '',           // stored as 'mobile' in form, sent as 'mobileNumber' to backend
  facebook: '',
  street: '',
  barangay: '',
  city: '',
  province: '',
  country: 'Philippines',
  zip: '',              // stored as 'zip' in form, sent as 'zipCode' to backend
};

// ─── MAP FORM FIELDS → BACKEND FIELD NAMES ───────────────────
// Your form uses 'mobile' and 'zip'; your backend expects 'mobileNumber' and 'zipCode'
const buildBackendPayload = (form) => ({
  email: form.email,
  password: form.password,
  confirmPassword: form.confirmPassword,
  firstName: form.firstName,
  middleName: form.middleName,
  lastName: form.lastName,
  suffix: form.suffix,
  birthday: form.birthday,
  gender: form.gender,
  civilStatus: form.civilStatus,
  citizenship: form.citizenship,
  mobileNumber: form.mobile,
  facebook: form.facebook,
  street: form.street,
  barangay: form.barangay,
  city: form.city,
  province: form.province,
  country: form.country,
  zipCode: form.zip,
  userType: 'applicant',
});

// ─── STEP PAYLOAD SLICES ─────────────────────────────────────
// Each step only sends the fields that backend validates for that step number
// Your screen step 0 = backend step 1, screen step 1 = backend step 2, etc.
const buildStepPayload = (screenStep, form) => {
  if (screenStep === 0) {
    return {
      email: form.email,
      password: form.password,
      confirmPassword: form.confirmPassword,
    };
  }
  if (screenStep === 1) {
    return {
      firstName: form.firstName,
      middleName: form.middleName,
      lastName: form.lastName,
      suffix: form.suffix,
      birthday: form.birthday,
      gender: form.gender,
      civilStatus: form.civilStatus,
      citizenship: form.citizenship,
      // Include profilePhoto metadata so backend can validate it
      profilePhoto: form.profilePhoto
        ? { uri: form.profilePhoto.uri, type: form.profilePhoto.mimeType, size: form.profilePhoto.fileSize, name: form.profilePhoto.fileName }
        : null,
    };
  }
  if (screenStep === 2) {
    return {
      mobileNumber: form.mobile,
      facebook: form.facebook,
      street: form.street,
      barangay: form.barangay,
      city: form.city,
      province: form.province,
      country: form.country,
      zipCode: form.zip,
    };
  }
  return {};
};

// ─── BACKEND STEP NUMBER ─────────────────────────────────────
// Screen step 0 → backend step 1, screen step 1 → backend step 2, etc.
const toBackendStep = (screenStep) => screenStep + 1;

// ─── MAP BACKEND ERROR FIELD NAMES → FORM FIELD NAMES ────────
// Backend returns 'mobileNumber', 'zipCode' — map back to form keys
const mapBackendErrors = (backendErrors = []) => {
  const fieldMap = {
    mobileNumber: 'mobile',
    zipCode: 'zip',
  };
  const mapped = {};

  if (Array.isArray(backendErrors)) {
    backendErrors.forEach(({ field, message }) => {
      const formField = fieldMap[field] || field;
      mapped[formField] = message;
    });
    return mapped;
  }

  if (backendErrors && typeof backendErrors === 'object') {
    Object.entries(backendErrors).forEach(([field, message]) => {
      const formField = fieldMap[field] || field;
      mapped[formField] = Array.isArray(message) ? message[0] : message;
    });
  }

  return mapped;
};

// ─── THE HOOK ─────────────────────────────────────────────────
export const useSignup = (navigation) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  // ─── RESEND VERIFICATION STATE ───
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState("");
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // ─── PSGC ADDRESS STATE ───
  const [addressData, setAddressData] = useState({
    provinces: [],
    cities: [],
    barangays: [],
  });

  // Fetch initial provinces + explicit addition of NCR on mount
  const fetchProvinces = async () => {
    try {
      const res = await fetch('https://psgc.gitlab.io/api/provinces.json');
      const data = await res.json();
      // Add NCR since it's classified as a Region but acts as a Province in typical forms
      data.push({ code: '130000000', name: 'Metro Manila (NCR)', isNcr: true });
      // Sort alphabetically
      data.sort((a, b) => a.name.localeCompare(b.name));
      setAddressData(prev => ({ ...prev, provinces: data }));
    } catch (e) {
      console.error("Error fetching provinces:", e);
    }
  };

  const fetchCities = async (provinceCode, isNcr = false) => {
    try {
      const url = isNcr
        ? `https://psgc.gitlab.io/api/regions/${provinceCode}/cities-municipalities.json`
        : `https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities.json`;
      const res = await fetch(url);
      const data = await res.json();
      data.sort((a, b) => a.name.localeCompare(b.name));
      setAddressData(prev => ({ ...prev, cities: data, barangays: [] }));
    } catch (e) {
      console.error("Error fetching cities:", e);
    }
  };

  const fetchBarangays = async (cityCode) => {
    try {
      const res = await fetch(`https://psgc.gitlab.io/api/cities-municipalities/${cityCode}/barangays.json`);
      let data = await res.json();
      if (!data || data.length === 0) {
        // Fallback for independent cities/districts that use /cities instead of /cities-municipalities
        const res2 = await fetch(`https://psgc.gitlab.io/api/cities/${cityCode}/barangays.json`);
        data = await res2.json();
      }
      if (data) {
        data.sort((a, b) => a.name.localeCompare(b.name));
        setAddressData(prev => ({ ...prev, barangays: data }));
      }
    } catch (e) {
      console.error("Error fetching barangays:", e);
    }
  };

  // Update a single field
  const updateField = (field, value) => {
    setForm((prev) => {
      let newState = { ...prev, [field]: value };

      // Cascade resets for address picks
      if (field === 'province') {
        newState.city = '';
        newState.barangay = '';

        // Find the province/NCR object to fetch its cities
        const prov = addressData.provinces.find(p => p.name === value);
        if (prov) fetchCities(prov.code, prov.isNcr);
      } else if (field === 'city') {
        newState.barangay = '';

        // Find the city object to fetch its barangays
        const city = addressData.cities.find(c => c.name === value);
        if (city) fetchBarangays(city.code);
      }

      return newState;
    });

    // Clear that field's error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Format date for display (Date object → MM/DD/YYYY)
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  };

  // Go to next step — local validate → server validate → advance
  const nextStep = async () => {
    setLoading(true);
    setErrors({});

    try {
      // Server-side validation for steps 0–2
      if (step < 3) {
        await validateSignupStep(
          toBackendStep(step),
          buildStepPayload(step, form)
        );
      }
      setStep((s) => Math.min(s + 1, 4));
    } catch (err) {
      const mappedErrors = mapBackendErrors(err?.errors);
      if (Object.keys(mappedErrors).length > 0) {
        setErrors(mappedErrors);
      } else if (String(err?.message || '').toLowerCase().includes('email already')) {
        setErrors({ email: err.message });
      } else {
        setErrors({ general: err.message || 'Something went wrong' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Go back one step (or leave screen if on step 0)
  const backStep = () => {
    if (step === 0) {
      navigation.goBack();
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
    setErrors({});
  };

  // Final registration submit (step 3 review screen)
  const handleRegister = async () => {
    setLoading(true);
    setErrors({});

    try {
      const payload = { ...buildBackendPayload(form), profilePhoto: form.profilePhoto };
      await register(payload);
      setStep(4); // success screen
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        setErrors(mapBackendErrors(err.errors));
        // Go back to the step that has the error
        if (step !== 3) return;
        setStep(0); // fallback to start if it's a general field error
      } else {
        setErrors({ general: err.message || 'Registration failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!form.email || resendCooldown > 0) {
      return;
    }

    setResendLoading(true);
    setResendError("");
    setResendMessage("");

    try {
      const result = await resendVerificationEmail(form.email);
      setResendMessage(result.message || "Verification email resent successfully.");
      setResendCooldown(result.resendCooldownSeconds || 60);
    } catch (error) {
      if (error?.code === "VERIFICATION_RESEND_COOLDOWN") {
        const retryAfter = Number(error?.data?.retryAfterSeconds) || 0;
        setResendCooldown(retryAfter);
      }
      setResendError(error?.message || "Failed to resend verification email.");
    } finally {
      setResendLoading(false);
    }
  };

  return {
    // State
    step,
    loading,
    form,
    errors,
    addressData,
    resendCooldown,
    resendLoading,
    resendError,
    resendMessage,

    // Actions
    updateField,
    nextStep,
    backStep,
    handleRegister,
    handleResendVerification,
    formatDate,
    fetchProvinces,

    // Constants (re-exported so screen doesn't need to import them separately)
    GENDER_OPTIONS,
    CITIZENSHIP_OPTIONS,
    CIVIL_STATUS_OPTIONS,
    STEP_TITLES,
  };
};