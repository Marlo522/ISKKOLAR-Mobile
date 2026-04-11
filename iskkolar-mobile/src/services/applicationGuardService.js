import api from "./api";
import { getMyApplications as getMyTertiaryApplications } from "./tertiaryAppService";
import {
  getMyChildDesignationApplications,
  getMyStaffAdvancementApplications,
} from "./StaffApplication";

const ONGOING_STATUSES = new Set(["pending", "under_review", "initial_passed", "for_review"]);

const isOngoingStatus = (status) => ONGOING_STATUSES.has(String(status || "").toLowerCase());

const getMyVocationalApplications = async () => {
  const response = await api("/scholarships/vocational/my-applications", { method: "GET" });
  return response?.data || [];
};

export const checkAnyOngoingApplication = async () => {
  const [tertiaryResult, vocationalResult, childDesignationResult, staffAdvancementResult] =
    await Promise.allSettled([
      getMyTertiaryApplications(),
      getMyVocationalApplications(),
      getMyChildDesignationApplications(),
      getMyStaffAdvancementApplications(),
    ]);

  const withType = (apps, fallbackType) =>
    (Array.isArray(apps) ? apps : []).map((app) => ({
      ...app,
      application_type: app?.application_type || fallbackType,
    }));

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

  const allApplications = [
    ...tertiaryApps,
    ...vocationalApps,
    ...childDesignationApps,
    ...staffAdvancementApps,
  ];

  return allApplications.find((app) => isOngoingStatus(app?.status)) || null;
};

export default checkAnyOngoingApplication;