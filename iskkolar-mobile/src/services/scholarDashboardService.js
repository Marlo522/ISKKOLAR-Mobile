import api from './api';
import { isMissingUserProfileError } from './serviceErrorHelpers';
import { getScholarApplicationHistory as getScholarApplicationHistoryRN } from '../features/scholar/services/scholarDashboardService';

const toReadableError = (error) => {
  if (error?.message) {
    return error;
  }

  if (typeof error === 'string' && error.trim()) {
    return new Error(error);
  }

  return new Error('Failed to load scholar dashboard data.');
};

export const getScholarDashboardSummary = async () => {
  try {
    const response = await api.get('/scholarships/dashboard/summary');
    return response.data?.data || response.data;
  } catch (error) {
    if (isMissingUserProfileError(error)) {
      return { success: true, data: {} };
    }

    throw toReadableError(error);
  }
};

export const getScholarApplicationHistory = async () => {
  try {
    const response = await getScholarApplicationHistoryRN();
    return response?.data || response || [];
  } catch (error) {
    if (isMissingUserProfileError(error)) {
      return { success: true, data: { applicationItems: [] } };
    }

    throw toReadableError(error);
  }
};

