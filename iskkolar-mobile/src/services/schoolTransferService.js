import api from './api';

/**
 * Submits a school transfer request via multipart/form-data.
 * Matches the web's backend contract at POST /scholarships/transfer/apply
 */
export const submitTransferRequest = async (payload, corFile) => {
  const data = new FormData();

  // Append all text fields matching the web's FormData keys
  data.append('prevSchool', payload.prevSchool || '');
  data.append('prevProgram', payload.prevProgram || '');
  data.append('newSchool', payload.newSchool || '');
  data.append('newProgram', payload.newProgram || '');
  data.append('academicYear', payload.academicYear || '');
  data.append('yearLevel', payload.yearLevel || '');
  data.append('expectedGraduationYear', payload.expectedGraduationYear || '');
  data.append('termType', payload.termType || '');
  data.append('gradingSystem', payload.gradingSystem || '');
  data.append('term', payload.term || '');
  data.append('reason', payload.reason || '');

  // Attach the Certificate of Registration file if provided
  if (corFile && corFile.uri) {
    data.append('corNewSchool', {
      uri: corFile.uri,
      type: corFile.mimeType || corFile.type || 'application/pdf',
      name: corFile.name || 'cor_new_school.pdf',
    });
  }

  const response = await api('/scholarships/transfer/apply', {
    method: 'POST',
    body: data,
  });

  return response;
};
