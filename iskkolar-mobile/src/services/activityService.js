import api from './api';

/**
 * Fetches the activities for the logged-in scholar.
 * @returns {Promise<Array>} List of formatted activities
 */
export const getScholarActivities = async () => {
  try {
    const response = await api.get('/scholar/activities');
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error('Error fetching scholar activities:', error);
    throw error.message || 'Failed to load activities';
  }
};

