import api from "./api";
import { getMyApplications as getMyTertiaryApplications } from "./tertiaryAppService";
import {
  getMyChildDesignationApplications,
  getMyStaffAdvancementApplications,
} from "./StaffApplication";

const ONGOING_STATUSES = new Set(["pending", "under_review", "initial_passed", "for_review", "for_interview", "submitted"]);
const REJECTED_STATUSES = new Set(["rejected", "disapproved", "non_compliant"]);

const PROGRAM_TO_TYPES = {
  tertiary: ["tertiary"],
  vocational: ["vocational"],
  employeeChild: {
    "Option 1": ["staff_advancement"],
    "Option 2": ["child_designation"],
  },
};

const getApplicationYear = (app) => {
  const source = app?.submitted_at || app?.created_at;
  if (!source) return null;
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return null;
  return date.getFullYear();
};

const isRejectedStatus = (status) => REJECTED_STATUSES.has(String(status || "").toLowerCase());

const isOngoingStatus = (status) => ONGOING_STATUSES.has(String(status || "").toLowerCase());

const getTargetTypes = (program, option) => {
  if (program === "employeeChild") {
    return PROGRAM_TO_TYPES.employeeChild[option] || ["staff_advancement", "child_designation"];
  }

  return PROGRAM_TO_TYPES[program] || [program];
};

const withType = (apps, fallbackType) =>
  (Array.isArray(apps) ? apps : []).map((app) => ({
    ...app,
    application_type: app?.application_type || fallbackType,
  }));

const getMyVocationalApplications = async () => {
  const response = await api.get("/scholarships/vocational/my-applications");
  return response.data?.data || response.data || [];
};

const loadAllApplications = async () => {
  const [tertiaryResult, vocationalResult, childDesignationResult, staffAdvancementResult] =
    await Promise.allSettled([
      getMyTertiaryApplications(),
      getMyVocationalApplications(),
      getMyChildDesignationApplications(),
      getMyStaffAdvancementApplications(),
    ]);

  const tertiaryApps = tertiaryResult.status === "fulfilled" ? withType(tertiaryResult.value, "tertiary") : [];
  const vocationalApps = vocationalResult.status === "fulfilled" ? withType(vocationalResult.value, "vocational") : [];
  const childDesignationApps =
    childDesignationResult.status === "fulfilled"
      ? withType(childDesignationResult.value, "child_designation")
      : [];
  const staffAdvancementApps =
    staffAdvancementResult.status === "fulfilled"
      ? withType(staffAdvancementResult.value, "staff_advancement")
      : [];

  return [
    ...tertiaryApps,
    ...vocationalApps,
    ...childDesignationApps,
    ...staffAdvancementApps,
  ];
};

const buildRejectedYearMessage = (program, option) => {
  const targetTypes = getTargetTypes(program, option);
  const label = targetTypes.includes("tertiary")
    ? "tertiary"
    : targetTypes.includes("vocational")
      ? "vocational"
      : targetTypes.includes("child_designation")
        ? "child designation"
        : targetTypes.includes("staff_advancement")
          ? "staff advancement"
          : "scholarship";

  return `You already have a rejected ${label} application for this year. You cannot apply again for this scholarship type.`;
};

export const getScholarshipFormAccess = async ({ program, option } = {}) => {
  const allApplications = await loadAllApplications();
  const targetTypes = getTargetTypes(program, option);

  const ongoing = allApplications.find((app) => isOngoingStatus(app?.status));
  if (ongoing) {
    return {
      allowed: false,
      reason: "active_stage",
      message: "You already have an active interview-stage application. You cannot open or edit the form.",
      blockedApplication: ongoing,
    };
  }

  const currentYear = new Date().getFullYear();
  const rejectedThisYear = allApplications.find(
    (app) =>
      targetTypes.includes(app?.application_type) &&
      isRejectedStatus(app?.status) &&
      getApplicationYear(app) === currentYear
  );

  if (rejectedThisYear) {
    return {
      allowed: false,
      reason: "rejected_this_year",
      message: buildRejectedYearMessage(program, option),
      reapplyYear: currentYear + 1,
      blockedApplication: rejectedThisYear,
    };
  }

  return { allowed: true, reason: null, message: "", blockedApplication: null };
};

export const checkAnyOngoingApplication = async () => {
  const allApplications = await loadAllApplications();

  return allApplications.find((app) => isOngoingStatus(app?.status)) || null;
};

/**
 * Fetches all applications for the current user to display in their history.
 * Combines all scholarship types into a single list sorted by date.
 */
export const getApplicantHistory = async () => {
  const allApplications = await loadAllApplications();

  // Filter out malformed entries and normalize date fields for reliable sorting.
  const validApps = (Array.isArray(allApplications) ? allApplications : []).filter((app) => {
    if (!app || typeof app !== "object") return false;
    if (!app.status) return false;
    if (app.id) return true;
    if (app.submitted_at || app.created_at || app.submittedAt || app.createdAt) return true;
    return false;
  });

  const getAppTime = (app) => {
    const raw = app.submitted_at || app.submittedAt || app.created_at || app.createdAt || 0;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  };

  return validApps.sort((a, b) => getAppTime(b) - getAppTime(a));
};

export default checkAnyOngoingApplication;