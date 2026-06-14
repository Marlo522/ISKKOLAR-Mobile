import api from './api';
import { sanitizeFilename } from '../utils/fileSanitizer';

const appendFile = (data, key, file, defaultName, defaultType) => {
  if (!file) return;

  if (typeof file === 'string') {
    data.append(key, file);
    return;
  }

  if (file.uri) {
    data.append(key, {
      uri: file.uri,
      type: file.type || file.mimeType || defaultType,
      name: sanitizeFilename(file.name || defaultName),
    });
    return;
  }

  data.append(key, file);
};

export const submitFinancialAssistance = async (formData, files) => {
  try {
    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'receipts' && Array.isArray(value)) {
        data.append(key, JSON.stringify(value));
      } else if (value !== null && value !== undefined) {
        data.append(key, value);
      }
    });

    appendFile(data, 'supportingDocument', files.supportingDocument, 'document.pdf', 'application/pdf');

    if (files.receipts && Array.isArray(files.receipts)) {
      files.receipts.forEach((file, idx) => {
        appendFile(data, `receipt_file_${idx}`, file, `receipt_${idx}.jpg`, 'image/jpeg');
      });
    }

    // In mobile api.js, when options.body instanceof FormData, 
    // Content-Type is automatically set properly without boundary issues
    const response = await api.post('/assistance/financial-assistance', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (response.data && response.data.success === false) {
      throw response.data;
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getFinancialAssistanceApplications = async () => {
  try {
    const response = await api.get('/assistance/financial-assistance');
    return response.data;
  } catch (error) {
    throw error;
  }
};

