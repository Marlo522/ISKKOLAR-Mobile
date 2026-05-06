import api from './api';

/**
 * Submit a scholarship renewal application with supporting documents.
 * Mirrors: web/src/features/scholar/services/scholarshipRenewalService.js
 */
export const submitScholarshipRenewal = async (formData, files) => {
  try {
    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        data.append(key, String(value));
      }
    });

    // Attach files in the React Native format expected by axios multipart
    if (files.gradeReport?.uri) {
      data.append('gradeReport', {
        uri: files.gradeReport.uri,
        type: files.gradeReport.mimeType || files.gradeReport.type || 'application/pdf',
        name: files.gradeReport.name || 'gradeReport.pdf',
      });
    }

    if (files.cor?.uri) {
      data.append('cor', {
        uri: files.cor.uri,
        type: files.cor.mimeType || files.cor.type || 'application/pdf',
        name: files.cor.name || 'cor.pdf',
      });
    }

    if (files.receipts?.uri) {
      data.append('receipts', {
        uri: files.receipts.uri,
        type: files.receipts.mimeType || files.receipts.type || 'application/pdf',
        name: files.receipts.name || 'receipts.pdf',
      });
    }

    const response = await api.post('/assistance/scholarship-renewal', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

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
    throw error?.message || error;
  }
};
