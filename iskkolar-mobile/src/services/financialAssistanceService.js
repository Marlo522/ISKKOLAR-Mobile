import api from './api';

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

    if (files.supportingDocument && files.supportingDocument.uri) {
      data.append('supportingDocument', {
        uri: files.supportingDocument.uri,
        type: files.supportingDocument.mimeType || files.supportingDocument.type || 'application/pdf',
        name: files.supportingDocument.name || 'document.pdf',
      });
    }

    if (files.receipts && Array.isArray(files.receipts)) {
      files.receipts.forEach((file, idx) => {
        if (file && file.uri) {
          data.append(`receipt_file_${idx}`, {
            uri: file.uri,
            type: file.mimeType || file.type || 'image/jpeg',
            name: file.name || `receipt_${idx}.jpg`,
          });
        }
      });
    }

    // In mobile api.js, when options.body instanceof FormData, 
    // Content-Type is automatically set properly without boundary issues
    const response = await api.post('/assistance/financial-assistance', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getFinancialAssistanceApplications = async () => {
  try {
    const response = await api.get('/assistance/financial-assistance');
    return response.data?.data || response.data || [];
  } catch (error) {
    throw error;
  }
};

