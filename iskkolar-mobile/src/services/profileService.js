import api from "./api";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const MOBILE_PATTERN = /^0\d{10}$/;

export const getProfile = async () => {
  try {
    const response = await api.get("/auth/me");
    const profile = response.data?.data || response.data;
    if (profile) return profile;
    
    throw new Error("Failed to fetch profile");
  } catch (error) {
    throw new Error(error.message || "Failed to fetch profile.");
  }
};

export const updateProfile = async (data) => {
  const normalizedEmail = (data.email ?? "").trim();
  const normalizedMobile = String(data.mobileNumber ?? "").trim();

  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  if (!normalizedMobile) {
    throw new Error("Mobile number is required.");
  }

  if (!MOBILE_PATTERN.test(normalizedMobile)) {
    throw new Error("Mobile number must start with 0 and contain 11 digits.");
  }

  try {
    const response = await api.patch("/auth/me", {
      email: normalizedEmail,
      mobileNumber: normalizedMobile,
    });

    const updatedProfile = response.data?.data || response.data;
    if (updatedProfile) {
      return {
        ...updatedProfile,
        _message: response.data?.message || "Profile updated successfully.",
      };
    }

    throw new Error(response.data?.message || "Failed to update profile.");
  } catch (error) {
    throw new Error(error.message || "Failed to update profile.");
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.post("/auth/me/password", {
      currentPassword,
      newPassword,
    });

    if (response.data?.success || response.data?.message) {
      return { message: response.data.message || "Password updated successfully." };
    }

    throw new Error(response.data?.message || "Failed to update password.");
  } catch (error) {
    throw new Error(error.message || "Failed to update password.");
  }
};

