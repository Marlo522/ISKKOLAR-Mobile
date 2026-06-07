import api from './api';

/**
 * Fetches announcements and activities for the logged-in user (scholar or applicant).
 * @returns {Promise<Array>} List of formatted announcements and activities
 */
export const getScholarAnnouncements = async () => {
  try {
    const response = await api.get('/scholar/announcements');
    return response.data?.data || response.data || [];
  } catch (error) {
    console.warn('Error fetching announcements:', error);
    throw error.message || 'Failed to load announcements';
  }
};

/**
 * Generates the backend download URL for a given attachment.
 * Falls back to the direct file URL when already absolute.
 */
export const getAttachmentDownloadUrl = (fileUrl, fileName) => {
  if (!fileUrl) return '';

  if (/^https?:\/\//i.test(fileUrl)) {
    return fileUrl;
  }

  const apiBase = (api.defaults.baseURL || 'http://localhost:5000/api').replace(/\/+$/, '');
  return `${apiBase}/files/download?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(fileName || 'attachment')}`;
};

