import api from './api';

const toReadableError = (error) => {
  const payload = error?.response?.data || error;

  if (payload?.message) {
    const err = new Error(payload.message);
    err.details = payload.errors || null;
    return err;
  }

  if (typeof payload === 'string' && payload.trim()) {
    return new Error(payload);
  }

  return new Error(error?.message || 'Request failed');
};

const ALLOWED_FORM_FIELDS = new Set([
  'assistanceType',
  'examType',
  'examDate',
  'location',
  'firstAttempt',
  'notes',
]);

const appendFile = (formData, field, file) => {
  if (!file?.uri) return;
  formData.append(field, {
    uri: file.uri,
    type: file.mimeType || file.type || 'application/octet-stream',
    name: file.name || file.fileName || `${field}.dat`,
  });
};

export const submitExamAssistance = async (formValues, files = {}) => {
  const data = new FormData();

  // Only append expected fields to avoid backend "unknown property" validation errors.
  Object.entries(formValues || {}).forEach(([key, value]) => {
    if (!ALLOWED_FORM_FIELDS.has(key)) return;
    if (value !== null && value !== undefined) {
      data.append(key, String(value));
    }
  });

  appendFile(data, 'exam_registration', files.exam_registration);
  appendFile(data, 'review_enrollment', files.review_enrollment);

  try {
    const response = await api('/assistance/exam-assistance', {
      method: 'POST',
      body: data,
    });
    return response;
  } catch (error) {
    throw toReadableError(error);
  }
};

export const getExamAssistanceApplications = async () => {
  try {
    const response = await api('/assistance/exam-assistance', {
      method: 'GET',
    });
    return response;
  } catch (error) {
    throw toReadableError(error);
  }
};
