import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, logoutUser, getCurrentUser } from '../services/authService';

// ─── THE HOOK ─────────────────────────────────────────────────
export const useAuth = (navigation) => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [errors, setErrors] = useState({});

  // ─── LOGIN ──────────────────────────────────────────────────
  const login = async (email, password) => {
    setLoading(true);
    setErrors({});

    try {
      const res = await loginUser(email, password);

      // Store token and user data persistently
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.data));

      setUser(res.data);
      navigation.replace('Dashboard'); // adjust to your actual route name
    } catch (err) {
      // Handle specific backend error codes
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        setErrors({
          general: 'Please verify your email before logging in. Check your inbox.',
        });
      } else if (err.code === 'ACCOUNT_INACTIVE') {
        setErrors({
          general: 'Your account is inactive. Please contact support.',
        });
      } else if (err.status === 401) {
        setErrors({
          general: 'Invalid email or password.',
        });
      } else {
        setErrors({
          general: err.message || 'Login failed. Please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── LOGOUT ─────────────────────────────────────────────────
  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
    } catch {
      // Even if the server call fails, clear local data
    } finally {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setUser(null);
      setLoading(false);
      navigation.replace('Login'); // adjust to your actual route name
    }
  };

  // ─── RESTORE SESSION ─────────────────────────────────────────
  // Call this in your root navigator to check if user is already logged in
  const restoreSession = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return false;
      }

      // Verify token is still valid with backend
      const res = await getCurrentUser();
      setUser(res.data);
      setLoading(false);
      return true;
    } catch {
      // Token expired or invalid — clear storage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setLoading(false);
      return false;
    }
  };

  // ─── CLEAR A SPECIFIC ERROR ──────────────────────────────────
  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return {
    user,
    loading,
    errors,
    login,
    logout,
    restoreSession,
    clearError,
  };
};