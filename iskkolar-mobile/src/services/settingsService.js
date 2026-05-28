import api from "./api";

/**
 * Fetches the current application settings from the backend.
 * Falls back to open if the request fails (to prevent network glitches from blocking users).
 */
export const getApplicationSettings = async () => {
  try {
    const response = await api.get("/applications/settings");
    if (response.data?.success) {
      return response.data.data;
    }
    return { is_open: true, applicant_limit: null, applicant_count: 0, is_limit_reached: false, ai_checking_enabled: true };
  } catch (error) {
    console.error("Error fetching application settings:", error);
    return { is_open: true, applicant_limit: null, applicant_count: 0, is_limit_reached: false, ai_checking_enabled: true };
  }
};
