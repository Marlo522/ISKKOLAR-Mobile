export const VOCATIONAL_KEYWORDS = ["vocational", "certification", "certificate", "tesda", "tech scholar"];

export const isVocationalScholar = (user, dashboardSummary) => {
  // Extract fields from your APIs
  const candidates = [
    dashboardSummary?.academicStatus?.program,
    dashboardSummary?.academicStatus?.schoolName,
    dashboardSummary?.vocational?.program,
    dashboardSummary?.vocational?.school,
    user?.scholarshipType,
    user?.program
  ];

  // If any of their active data matches a vocational keyword, they are vocational
  return candidates.some((value) => {
    const normalized = String(value || "").toLowerCase();
    return VOCATIONAL_KEYWORDS.some((keyword) => normalized.includes(keyword));
  });
};
