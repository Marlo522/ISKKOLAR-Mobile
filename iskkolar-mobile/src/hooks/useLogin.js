import { useState, useContext } from "react";
import { login } from "../services/authService";
import { AuthContext } from "../context/AuthContext";

// ─── THE HOOK ─────────────────────────────────────────────────
export const useLogin = (navigation) => {
  const { loginUser } = useContext(AuthContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // ─── UPDATE A SINGLE FIELD ───────────────────────────────────
  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (apiError) setApiError("");
  };

  const resolveAllowedRole = (rawRole) => {
    const value = String(rawRole || '')
      .trim()
      .toLowerCase()
      .replace(/[_\-\s]+/g, ' ');

    if (!value) return '';
    // Check terminated BEFORE scholar since 'scholar terminated' contains 'scholar'
    if (value.includes('scholar') && value.includes('terminated')) return 'terminated';
    if (value.includes('terminated')) return 'terminated';
    if (value.includes('scholar')) return 'scholar';
    if (value.includes('applicant')) return 'applicant';
    return '';
  };

  // ─── HANDLE LOGIN ────────────────────────────────────────────
  const handleLogin = async () => {
    setLoading(true);
    setApiError("");
    setErrors({});

    try {
      const response = await login(form.email.trim(), form.password);

      const normalizedRole = resolveAllowedRole(response.rawRole || response.user.userType);

      if (normalizedRole !== "applicant" && normalizedRole !== "scholar" && normalizedRole !== "terminated") {
        setApiError("Invalid account.");
        setLoading(false);
        return;
      }

      const userData = { ...response.user, role: normalizedRole };

      await loginUser(userData, rememberMe);

      switch (normalizedRole) {
        case "applicant":
          navigation.replace("Main");
          break;
        case "scholar":
          navigation.replace("ScholarTabs");
          break;
        case "terminated":
          navigation.replace("Terminated");
          break;
        default:
          setApiError("Login failed.");
      }
    } catch (err) {
      if (err.errors) {
        // Backend mapping errors to fields
        const mappedErrors = {};
        if (Array.isArray(err.errors)) {
          err.errors.forEach(e => mappedErrors[e.field] = e.message);
        } else if (typeof err.errors === "object") {
          Object.entries(err.errors).forEach(([k, v]) => {
            mappedErrors[k] = Array.isArray(v) ? v[0] : v;
          });
        }
        setErrors(mappedErrors);
      }
      setApiError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    errors,
    apiError,
    loading,
    rememberMe,
    setRememberMe,
    updateField,
    handleLogin,
  };
};