import { useState, useContext } from "react";
import { loginUser as loginRequest } from "../services/authService";
import { AuthContext } from "../context/AuthContext";

// ─── THE HOOK ─────────────────────────────────────────────────
export const useLogin = (navigation) => {
  const { loginUser } = useContext(AuthContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  // ─── UPDATE A SINGLE FIELD ───────────────────────────────────
  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear that field's error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (apiError) setApiError("");
  };

  // ─── NORMALIZE SERVER ERRORS ─────────────────────────────────
  // Handles both array shape [{ field, message }] and object shape { field: message }
  const normalizeServerErrors = (rawErrors) => {
    if (!rawErrors) return {};

    if (Array.isArray(rawErrors)) {
      return rawErrors.reduce((acc, item) => {
        if (item?.field && item?.message) acc[item.field] = item.message;
        return acc;
      }, {});
    }

    if (typeof rawErrors === "object") {
      return Object.entries(rawErrors).reduce((acc, [key, value]) => {
        acc[key] = Array.isArray(value) ? value[0] : value;
        return acc;
      }, {});
    }

    return {};
  };

  // ─── HANDLE LOGIN ────────────────────────────────────────────
  const handleLogin = async () => {
    setLoading(true);
    setApiError("");
    setErrors({});

    try {
      const response = await loginRequest(form.email.trim(), form.password);

      if (response?.success && response?.data?.token) {
        const { token, ...userData } = response.data;
        await loginUser(userData, token);
        navigation.replace("Main");
        return;
      }

      const mappedErrors = normalizeServerErrors(response?.errors);
      if (Object.keys(mappedErrors).length > 0) setErrors(mappedErrors);
      setApiError(response?.message || "Login failed");
    } catch (err) {
      // Map field-level errors from backend
      const mappedErrors = normalizeServerErrors(err?.errors || err?.response?.data?.errors);
      if (Object.keys(mappedErrors).length > 0) {
        setErrors(mappedErrors);
      }

      if (err?.code === "EMAIL_NOT_VERIFIED") {
        setApiError("Please verify your email before logging in.");
      } else if (err?.code === "ACCOUNT_INACTIVE") {
        setApiError("Your account is inactive. Please contact support.");
      } else {
        setApiError(err?.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    errors,
    apiError,
    loading,
    updateField,
    handleLogin,
  };
};