import api from "./api";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const MOBILE_PATTERN = /^0\d{10}$/;

export const getProfile = async () => {
  try {
    const response = await api("/auth/me");
    const profile = response?.data || response;
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
    const response = await api("/auth/me", {
      method: 'PATCH',
      body: JSON.stringify({
        email: normalizedEmail,
        mobileNumber: normalizedMobile,
      }),
    });

    const updatedProfile = response?.data || response;
    if (updatedProfile) {
      return {
        ...updatedProfile,
        _message: response?.message || "Profile updated successfully.",
      };
    }

    throw new Error(response?.message || "Failed to update profile.");
  } catch (error) {
    throw new Error(error.message || "Failed to update profile.");
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api("/auth/me/password", {
      method: 'POST',
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    if (response?.success || response?.message) {
      return { message: response.message || "Password updated successfully." };
    }

    throw new Error(response?.message || "Failed to update password.");
  } catch (error) {
    throw new Error(error.message || "Failed to update password.");
  }
};
