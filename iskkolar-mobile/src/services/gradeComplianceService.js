import api from './api';
import { sanitizeFilename } from '../utils/fileSanitizer';

export const getGradeComplianceTerms = async () => {
  try {
    const response = await api.get('/assistance/grade-compliance/terms');
    return response.data?.data || response.data;
  } catch (error) {
    throw error;
  }
};

const appendFile = (data, key, file, defaultName, defaultType) => {
  if (!file) return;

  if (file.uri) {
    data.append(key, {
      uri: file.uri,
      type: file.mimeType || file.type || defaultType,
      name: sanitizeFilename(file.name || defaultName),
    });
    return;
  }

  data.append(key, file);
};

const buildGradeComplianceFormData = ({
  term,
  scholarshipName,
  remarks,
  nextTermStartDate,
  nextTermEndDate,
  gwa,
  files,
  preEvaluated,
  aiSummary,
  extractedGwa,
  gwaDiscrepancy,
  hasInc,
  hasFailed,
  isGwaQualified,
  gradeDeficiencyNotes,
}) => {
  const data = new FormData();
  data.append('term', term);

  if (scholarshipName) data.append('scholarshipName', scholarshipName);
  if (remarks) data.append('remarks', remarks);
  if (nextTermStartDate) data.append('nextTermStartDate', nextTermStartDate);
  if (nextTermEndDate) data.append('nextTermEndDate', nextTermEndDate);
  if (gwa) data.append('gwa', String(gwa));

  appendFile(data, 'gradeReport', files?.gradeReport, 'gradeReport.pdf', 'application/pdf');
  appendFile(data, 'cor', files?.cor, 'cor.pdf', 'application/pdf');

  if (preEvaluated) {
    data.append('preEvaluated', 'true');
  }
  if (aiSummary !== undefined && aiSummary !== null) {
    data.append('aiSummary', aiSummary);
  }
  if (extractedGwa !== undefined && extractedGwa !== null) {
    data.append('extractedGwa', String(extractedGwa));
  }
  if (gwaDiscrepancy !== undefined && gwaDiscrepancy !== null) {
    data.append('gwaDiscrepancy', String(gwaDiscrepancy));
  }
  if (hasInc !== undefined && hasInc !== null) {
    data.append('hasInc', String(hasInc));
  }
  if (hasFailed !== undefined && hasFailed !== null) {
    data.append('hasFailed', String(hasFailed));
  }
  if (isGwaQualified !== undefined && isGwaQualified !== null) {
    data.append('isGwaQualified', String(isGwaQualified));
  }
  if (gradeDeficiencyNotes !== undefined && gradeDeficiencyNotes !== null) {
    data.append('gradeDeficiencyNotes', gradeDeficiencyNotes);
  }

  return data;
};

const postGradeComplianceForm = async (endpoint, payload) => {
  try {
    const data = buildGradeComplianceFormData(payload);
    const response = await api.post(endpoint, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });

    if (response.data && response.data.success === false) {
      throw response.data;
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const evaluateGradeCompliance = async (payload) => (
  postGradeComplianceForm('/assistance/grade-compliance/evaluate', payload)
);

export const submitGradeCompliance = async (payload) => (
  postGradeComplianceForm('/assistance/grade-compliance/submit', payload)
);
