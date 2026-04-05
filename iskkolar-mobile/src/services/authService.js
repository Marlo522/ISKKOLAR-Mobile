import api from './api';

// ─── VALIDATE A SINGLE SIGNUP STEP ───────────────────────────
// Mirrors POST /auth/signup/validate-step
// step: 1 | 2 | 3  (backend step numbering)
// formData: the fields for that step
export const validateSignupStep = async (step, formData) => {
  return await api('/auth/signup/validate-step', {
    method: 'POST',
    body: JSON.stringify({ step, formData }),
  });
};

// ─── FULL REGISTRATION ────────────────────────────────────────
// Mirrors POST /auth/signup  (multipart/form-data because of photo)
// formData: all text fields
// profilePhoto: { uri, fileName, mimeType } from image picker — or null
export const registerUser = async (formData, profilePhoto) => {
  const body = new FormData();

  // Append all text fields — skip empty strings/nulls
  Object.entries(formData).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      body.append(key, String(value));
    }
  });

  // Append photo if provided (react-native-image-picker shape)
  if (profilePhoto?.uri) {
    body.append('profilePhoto', {
      uri: profilePhoto.uri,
      name: profilePhoto.fileName || 'profile.jpg',
      type: profilePhoto.mimeType || 'image/jpeg',
    });
  }

  return await api('/auth/signup', {
    method: 'POST',
    body,
    // Don't set Content-Type — the api wrapper skips it for FormData
  });
};

// ─── LOGIN ────────────────────────────────────────────────────
// Mirrors POST /auth/login
export const loginUser = async (email, password) => {
  return await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

// ─── GET CURRENT USER ────────────────────────────────────────
// Mirrors GET /auth/me  (protected — token sent automatically by api wrapper)
export const getCurrentUser = async () => {
  return await api('/auth/me');
};

// ─── LOGOUT ──────────────────────────────────────────────────
// Mirrors POST /auth/logout  (protected)
export const logoutUser = async () => {
  return await api('/auth/logout', { method: 'POST' });
};

// ─── FORGOT PASSWORD ─────────────────────────────────────────
// Mirrors POST /auth/forgot-password
export const forgotPassword = async (email) => {
  return await api('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

// ─── RESET PASSWORD ──────────────────────────────────────────
// Mirrors POST /auth/reset-password
export const resetPassword = async (accessToken, password) => {
  return await api('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ accessToken, password }),
  });
};