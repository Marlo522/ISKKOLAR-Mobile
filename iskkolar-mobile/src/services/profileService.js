import api from "./api";
import { sanitizeFilename } from "../utils/fileSanitizer";

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
const MOBILE_PATTERN = /^09\d{9}$/;

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
    throw new Error("Please enter a valid email address ending with .com.");
  }

  if (!normalizedMobile) {
    throw new Error("Mobile number is required.");
  }

  if (!MOBILE_PATTERN.test(normalizedMobile)) {
    throw new Error("Mobile number must start with 09 and contain 11 digits.");
  }

  try {
    const formData = new FormData();
    formData.append("email", normalizedEmail);
    formData.append("mobileNumber", normalizedMobile);

    if (data.profilePhoto) {
      formData.append("profilePhoto", {
        uri: data.profilePhoto.uri,
        name: sanitizeFilename(data.profilePhoto.name || "profile.jpg"),
        type: data.profilePhoto.type || "image/jpeg",
      });
    }

    if (data.removePhoto) {
      formData.append("removePhoto", "true");
    }

    const response = await api.patch("/auth/me", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
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

