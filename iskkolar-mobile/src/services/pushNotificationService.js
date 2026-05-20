import api from './api';

/**
 * Registers the device's FCM push token on the backend.
 * @param {string} token - The FCM device token.
 * @param {string} [deviceType='mobile'] - The device platform type.
 * @returns {Promise<any>} Response data from the API
 */
export const registerPushToken = async (token, deviceType = 'mobile') => {
  try {
    const response = await api.post('/auth/me/push-token', {
      token,
      deviceType,
    });
    return response.data;
  } catch (error) {
    console.error('Error registering push token on backend:', error);
    throw error;
  }
};

/**
 * Deletes/unregisters the device's FCM push token on the backend on logout.
 * @param {string} token - The FCM device token to delete.
 * @returns {Promise<any>} Response data from the API
 */
export const deletePushToken = async (token) => {
  try {
    const response = await api.delete('/auth/me/push-token', {
      data: { token },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting push token on backend:', error);
    throw error;
  }
};
