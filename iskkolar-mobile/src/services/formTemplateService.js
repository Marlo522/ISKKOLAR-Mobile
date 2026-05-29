import api from './api';

/**
 * Fetches public scholarship form templates.
 * @returns {Promise<Array>} List of form templates containing fields: id, template_id, name, file_name, file_url, file_size, category, uploaded_at
 */
export const getPublicFormTemplates = async () => {
  try {
    const response = await api.get('/admin/form-templates/public');
    // The response might contain response.data.data or response.data directly
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error('Error fetching public form templates:', error);
    // Leverage the structured error mapping from our global interceptor in api.js
    const errorMessage = error?.message || 'Failed to load scholarship forms';
    throw errorMessage;
  }
};
