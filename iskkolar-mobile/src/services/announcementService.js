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
    console.error('Error fetching announcements:', error);
    throw error.message || 'Failed to load announcements';
  }
};

