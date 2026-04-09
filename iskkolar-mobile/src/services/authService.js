import api from './api';

const createAuthError = (message, code, errors) => {
  const err = new Error(message);
  if (code) err.code = code;
  if (errors) err.errors = errors;
  return err;
};

const serializeProfilePhoto = (profilePhoto) => {
  if (!profilePhoto || !profilePhoto.uri) return null;
  return {
    uri: profilePhoto.uri,
    name: profilePhoto.fileName || profilePhoto.name || 'profile.jpg',
    type: profilePhoto.mimeType || profilePhoto.type || 'image/jpeg',
    size: profilePhoto.fileSize || profilePhoto.size || 0,
  };
};

// ─── VALIDATE A SINGLE SIGNUP STEP ───────────────────────────
export const validateSignupStep = async (step, formData) => {
  try {
    const payload = {
      ...formData,
      profilePhoto: serializeProfilePhoto(formData.profilePhoto),
    };

    const response = await api('/auth/signup/validate-step', {
      method: 'POST',
      body: JSON.stringify({ step, formData: payload }),
    });

    return response;
  } catch (error) {
    throw createAuthError(
      error.message || 'Step validation failed.',
      error.code,
      error.errors
    );
  }
};

// ─── FULL REGISTRATION ────────────────────────────────────────
export const register = async (userData) => {
  try {
    const formData = new FormData();

    Object.entries(userData).forEach(([key, value]) => {
      if (key !== 'profilePhoto' && value !== null && value !== undefined && value !== '') {
        formData.append(key, String(value));
      }
    });

    // Append photo if provided
    const serializedPhoto = serializeProfilePhoto(userData.profilePhoto);
    if (serializedPhoto) {
      formData.append('profilePhoto', {
        uri: serializedPhoto.uri,
        name: serializedPhoto.name,
        type: serializedPhoto.type,
      });
    }

    const response = await api('/auth/signup', {
      method: 'POST',
      body: formData,
    });

    return {
      pendingVerification: true,
      message: response?.message || 'Account created. Please verify your email before logging in.',
    };
  } catch (error) {
    throw createAuthError(
      error.message || 'Failed to create account. Please try again.',
      error.code,
      error.errors
    );
  }
};

// ─── RESEND VERIFICATION ────────────────────────────────────────
export const resendVerificationEmail = async (email) => {
  try {
    const response = await api('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    return {
      message: response?.message || "Verification email resent successfully.",
      resendCooldownSeconds: response?.data?.resendCooldownSeconds || 60,
      verificationExpiresInMinutes: response?.data?.verificationExpiresInMinutes || null,
    };
  } catch (error) {
    throw {
      success: false,
      code: error.code || "RESEND_VERIFICATION_FAILED",
      message: error.message || "Failed to resend verification email.",
      data: error.data || null,
    };
  }
};

// ─── LOGIN ────────────────────────────────────────────────────
export const login = async (email, password) => {
  try {
    const response = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const payload = response?.data || response;
    const token = payload.token || payload.accessToken || payload.jwt;
    const profile = payload.user || payload.account || payload.profile || payload;

    return {
      token,
      user: {
        id: profile.userId || profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        userType: profile.userType || profile.role,
        profilePictureUrl: profile.profilePictureUrl,
      },
      rawRole: profile.userType || profile.role, // keeping rawRole handy
    };
  } catch (error) {
    const status = error.status;
    const code = error.code;
    const message = error.message || '';

    const isEmailNotVerified =
      (status === 403 && code === 'EMAIL_NOT_VERIFIED') ||
      (status === 403 && String(message).toLowerCase().includes('verify your email'));

    if (isEmailNotVerified) {
      throw createAuthError(
        'Please verify your email first. Check your inbox for the verification link.',
        'EMAIL_NOT_VERIFIED'
      );
    }

    if (status === 403 && code === 'ACCOUNT_INACTIVE') {
      throw createAuthError('Your account is inactive. Please contact support.', 'ACCOUNT_INACTIVE');
    }

    throw createAuthError(
      message || 'Invalid credentials. Please check your email and password.',
      code || 'LOGIN_FAILED',
      error.errors
    );
  }
};

// ─── FORGOT PASSWORD ─────────────────────────────────────────
export const forgotPassword = async (email) => {
  try {
    const response = await api('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return { message: response?.message || 'A password reset link has been sent to your email.' };
  } catch (error) {
    throw createAuthError(error.message || 'Failed to process password reset request.', error.code);
  }
};

// ─── RESET PASSWORD ──────────────────────────────────────────
export const resetPassword = async (accessToken, password) => {
  try {
    const response = await api('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ accessToken, password }),
    });
    return { message: response?.message || 'Password updated successfully.' };
  } catch (error) {
    throw createAuthError(error.message || 'Failed to reset password.', error.code);
  }
};

// ─── GET CURRENT USER ────────────────────────────────────────
export const getCurrentUser = async () => {
  try {
    const response = await api('/auth/me');
    const profile = response?.data || response;
    
    return {
      id: profile.userId || profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      userType: profile.userType || profile.role,
      profilePictureUrl: profile.profilePictureUrl,
    };
  } catch (error) {
    throw createAuthError(error.message || 'Failed to fetch user data.', error.code);
  }
};

// ─── LOGOUT ──────────────────────────────────────────────────
export const logout = async () => {
  try {
    const response = await api('/auth/logout', { method: 'POST' });
    return response;
  } catch (error) {
    throw createAuthError(error.message || 'Logout failed.', error.code);
  }
};