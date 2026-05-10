import api from './api';

const normalizeError = (error, fallback = 'Request failed.') => {
  const data = error?.response?.data || error;
  const err = new Error(data?.message || fallback);
  err.errors = data?.errors || [];
  err.code = data?.code || null;
  err.status = error?.response?.status || null;
  return err;
};

/**
 * Scholar: submit vocational completion proof.
 * @param {{ completion_date: string, certificate_number?: string }} payload
 * @param {{ completion_certificate?: File, transcript_of_records?: File, other?: File }} files
 */
export const submitVocationalCompletion = async (payload, files = {}) => {
  try {
    const formData = new FormData();
    formData.append('completion_date', payload.completion_date || '');
    if (payload.certificate_number) {
      formData.append('certificate_number', payload.certificate_number);
    }

    const docKeys = ['completion_certificate', 'transcript_of_records', 'other'];
    docKeys.forEach((key) => {
      if (files[key]) {
        // In React Native, files are usually objects with uri, name, type
        formData.append(key, files[key]);
      }
    });

    const response = await api.post('/assistance/vocational-completion/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (!response.data?.success) {
      throw response.data || { message: 'Submission failed.' };
    }

    return response.data;
  } catch (error) {
    throw normalizeError(error, 'Failed to submit vocational completion.');
  }
};

/**
 * Scholar: get their own completion submission.
 */
export const getMyVocationalCompletion = async () => {
  try {
    const response = await api.get('/assistance/vocational-completion/my-submission');
    return response.data;
  } catch (error) {
    throw normalizeError(error, 'Failed to load completion submission.');
  }
};
