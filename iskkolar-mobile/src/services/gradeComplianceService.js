import api from './api';

export const getGradeComplianceTerms = async () => {
  try {
    const response = await api.get('/assistance/grade-compliance/terms');
    return response.data?.data || response.data;
  } catch (error) {
    throw error;
  }
};

export const submitGradeCompliance = async ({ term, scholarshipName, remarks, files }) => {
  try {
    const data = new FormData();
    data.append('term', term);

    if (scholarshipName) {
      data.append('scholarshipName', scholarshipName);
    }

    if (remarks) {
      data.append('remarks', remarks);
    }

    if (files?.gradeReport?.uri) {
      data.append('gradeReport', {
        uri: files.gradeReport.uri,
        type: files.gradeReport.mimeType || files.gradeReport.type || 'application/pdf',
        name: files.gradeReport.name || 'gradeReport.pdf',
      });
    }

    if (files?.cor?.uri) {
      data.append('cor', {
        uri: files.cor.uri,
        type: files.cor.mimeType || files.cor.type || 'application/pdf',
        name: files.cor.name || 'cor.pdf',
      });
    }

    const response = await api.post('/assistance/grade-compliance/submit', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

