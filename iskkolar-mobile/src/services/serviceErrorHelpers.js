export const isMissingUserProfileError = (error) => {
  const status = error?.status ?? error?.response?.status;
  const message = String(error?.message || error?.response?.data?.message || '').toLowerCase();

  return status === 404 && message.includes('user profile not found');
};
