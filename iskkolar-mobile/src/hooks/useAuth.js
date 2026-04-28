import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as authLogin, logout as authLogout, getCurrentUser } from '../services/authService';

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
      const res = await authLogin(email, password);

      // User data stored persistently (Token handled by cookie automatically)
      await AsyncStorage.setItem('user', JSON.stringify(res.user));

      setUser(res.user);
      navigation.replace('Dashboard'); // adjust to your actual route name
    } catch (err) {
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        setErrors({
          general: 'Please verify your email before logging in. Check your inbox.',
        });
      } else if (err.code === 'ACCOUNT_INACTIVE') {
        setErrors({
          general: 'Your account is inactive. Please contact support.',
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
      await authLogout();
    } catch {
      // Even if the server call fails, clear local data
    } finally {
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
      // With cookies, we just try to fetch the user. 
      // If the cookie is valid, the request succeeds.
      const res = await getCurrentUser();
      setUser(res);
      
      // Persist local user data if it wasn't there
      await AsyncStorage.setItem('user', JSON.stringify(res));
      
      setLoading(false);
      return true;
    } catch {
      // Session invalid or expired — clear storage
      await AsyncStorage.removeItem('user');
      setUser(null);
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