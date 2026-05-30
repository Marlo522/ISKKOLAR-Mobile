/**
 * useGradeCompliance.js
 *
 * Encapsulates:
 *  - Application-guard check (blocks submission when an ongoing scholarship
 *    application exists, including "for_interview" status)
 *  - Exposes guard state so the screen can branch rendering cleanly
 *
 * The hook intentionally does NOT own the term-loading logic; that stays in
 * the screen so the deadline window can drive per-term UI.
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getMyApplications as getMyTertiaryApplications } from '../services/tertiaryAppService';
import {
  getMyChildDesignationApplications,
  getMyStaffAdvancementApplications,
} from '../services/StaffApplication';

// ─── Statuses that block a new grade-compliance submission ─────────────────────
// Extends the shared applicationGuardService set with `for_interview` so the
// grade-compliance screen respects the web-app guard described in requirements.
const BLOCKING_STATUSES = new Set([
  'pending',
  'under_review',
  'initial_passed',
  'for_review',
  'for_interview',
]);

const isBlockingStatus = (status) =>
  BLOCKING_STATUSES.has(String(status || '').toLowerCase());

// ─── Private fetch helpers ─────────────────────────────────────────────────────

const getMyVocationalApplications = async () => {
  const response = await api.get('/scholarships/vocational/my-applications');
  return response.data?.data || response.data || [];
};

const withType = (apps, fallbackType) =>
  (Array.isArray(apps) ? apps : []).map((app) => ({
    ...app,
    application_type: app?.application_type || fallbackType,
  }));

/**
 * Fetches all application types and returns the first one whose status matches
 * the extended BLOCKING_STATUSES set (which includes for_interview).
 * @returns {Promise<object|null>}
 */
const checkOngoingForGradeCompliance = async () => {
  const [tertiaryResult, vocationalResult, childResult, staffResult] =
    await Promise.allSettled([
      getMyTertiaryApplications(),
      getMyVocationalApplications(),
      getMyChildDesignationApplications(),
      getMyStaffAdvancementApplications(),
    ]);

  const tertiary =
    tertiaryResult.status === 'fulfilled'
      ? withType(tertiaryResult.value, 'tertiary')
      : [];
  const vocational =
    vocationalResult.status === 'fulfilled'
      ? withType(vocationalResult.value, 'vocational')
      : [];
  const child =
    childResult.status === 'fulfilled'
      ? withType(childResult.value, 'child_designation')
      : [];
  const staff =
    staffResult.status === 'fulfilled'
      ? withType(staffResult.value, 'staff_advancement')
      : [];

  const all = [...tertiary, ...vocational, ...child, ...staff];
  return all.find((app) => isBlockingStatus(app?.status)) || null;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @returns {{
 *   isCheckingGuard: boolean,
 *   ongoingApplication: object|null,
 *   recheckGuard: () => Promise<void>,
 * }}
 */
export const useGradeCompliance = () => {
  const [isCheckingGuard, setIsCheckingGuard] = useState(true);
  const [ongoingApplication, setOngoingApplication] = useState(null);

  const checkGuard = useCallback(async () => {
    setIsCheckingGuard(true);
    try {
      const ongoing = await checkOngoingForGradeCompliance();
      setOngoingApplication(ongoing);
    } catch {
      // If the guard check itself fails, allow entry — the backend submission
      // will still enforce its own rules.
      setOngoingApplication(null);
    } finally {
      setIsCheckingGuard(false);
    }
  }, []);

  useEffect(() => {
    checkGuard();
  }, [checkGuard]);

  return {
    isCheckingGuard,
    ongoingApplication,
    recheckGuard: checkGuard,
  };
};
