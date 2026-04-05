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

  const resolveAllowedRole = (rawRole) => {
    const value = String(rawRole || "")
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, " ");

    if (!value) return "";
    if (value.includes("scholar")) return "scholar";
    if (value.includes("applicant")) return "applicant";
    return "";
  };

  // ─── HANDLE LOGIN ────────────────────────────────────────────
  const handleLogin = async () => {
    setLoading(true);
    setApiError("");
    setErrors({});

    try {
      const response = await loginRequest(form.email.trim(), form.password);

      const payload = response?.data || response || {};
      const token = payload.token || payload.accessToken || payload.jwt;
      const profile = payload.user || payload.account || payload.profile || payload;
      const normalizedRole = resolveAllowedRole(
        profile?.role ||
        profile?.userType ||
        profile?.accountType ||
        payload?.role ||
        payload?.userType ||
        payload?.accountType
      );

      if (token) {
        const userData = { ...profile, role: normalizedRole };

        // Only applicant and scholar roles are allowed in this mobile client.
        if (normalizedRole !== "applicant" && normalizedRole !== "scholar") {
          setApiError("Invalid account. Only applicant or scholar accounts can log in.");
          return;
        }

        // AuthContext.loginUser expects (userData, jwt).
        await loginUser(userData, token);

        switch (normalizedRole) {
          case "applicant":
            navigation.replace("Main");
            break;
          case "scholar":
            navigation.replace("ScholarTabs");
            break;
          default:
            setApiError("Login failed. Unrecognized account role.");
        }
      } else {
        const mappedErrors = normalizeServerErrors(response?.errors);
        if (Object.keys(mappedErrors).length > 0) setErrors(mappedErrors);
        setApiError(response?.message || "Login failed");
      }

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