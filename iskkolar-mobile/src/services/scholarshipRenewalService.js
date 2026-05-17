import api from './api';
import { isMissingUserProfileError } from './serviceErrorHelpers';

/**
 * Submit a scholarship renewal application with supporting documents.
 * Mirrors: web/src/features/scholar/services/scholarshipRenewalService.js
 */
export const submitScholarshipRenewal = async (formData) => {
  try {
    const response = await api.post('/assistance/scholarship-renewal', formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};


/**
 * Fetch the scholar's own renewal applications.
 */
export const getScholarshipRenewals = async () => {
  try {
    const response = await api.get('/assistance/scholarship-renewal');
    return response.data;
  } catch (error) {
    throw error?.message || error;
  }
};

/**
 * Check the scholar's current eligibility for renewal.
 * Returns { success, data: { isQualified, tags, aiEvaluation } }
 */
export const checkScholarEligibility = async () => {
  try {
    const response = await api.get('/scholarships/renewal/eligibility');
    return response.data;
  } catch (error) {
    if (isMissingUserProfileError(error)) {
      return { success: true, data: null };
    }

    throw error?.message || error;
  }
};

/**
 * Fetch the scholar's snapshot academic status.
 * Mirrors: web/src/features/scholar/services/scholarshipRenewalService.js
 */
export const fetchScholarAcademicStatus = async () => {
  try {
    const response = await api.get('/scholarships/renewal/academic-status');
    return response.data;
  } catch (error) {
    if (isMissingUserProfileError(error)) {
      return { success: true, data: null };
    }

    throw error?.message || error;
  }
};
