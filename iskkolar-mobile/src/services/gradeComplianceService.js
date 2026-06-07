import api from './api';

export const getGradeComplianceTerms = async () => {
  try {
    const response = await api.get('/assistance/grade-compliance/terms');
    return response.data?.data || response.data;
  } catch (error) {
    throw error;
  }
};

const toIsoDate = (dateStr) => {
  if (!dateStr || !dateStr.includes('/')) return dateStr;
  const [m, d, y] = dateStr.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

export const submitGradeCompliance = async ({ term, scholarshipName, remarks, nextTermStartDate, nextTermEndDate, gwa, files }) => {
  try {
    const data = new FormData();
    data.append('term', term);

    if (scholarshipName) data.append('scholarshipName', scholarshipName);
    if (remarks) data.append('remarks', remarks);
    if (nextTermStartDate) data.append('nextTermStartDate', toIsoDate(nextTermStartDate));
    if (nextTermEndDate) data.append('nextTermEndDate', toIsoDate(nextTermEndDate));
    if (gwa) data.append('gwa', parseFloat(gwa));

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

    if (response.data && response.data.success === false) {
      throw response.data;
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

