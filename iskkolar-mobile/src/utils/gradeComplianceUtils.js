/**
 * gradeComplianceUtils.js
 *
 * Shared helpers for grade-compliance deadline and date validation.
 * These are kept outside the screen so they can be tested and reused
 * (e.g. in the dashboard summary card).
 */

/** How many days before the deadline the submission window opens */
const SUBMISSION_WINDOW_DAYS = 14;

// ─── Date parsing ──────────────────────────────────────────────────────────────

/**
 * Parses common date formats used across the app into a JS Date.
 * Handles ISO (YYYY-MM-DD / with time), slash (MM/DD/YYYY), and native JS.
 * @param {string|null|undefined} str
 * @returns {Date|null}
 */
export const parseStringToDate = (str) => {
  if (!str) return null;
  const cleaned = String(str).trim();
  if (!cleaned) return null;

  // ISO format  "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss…"
  if (cleaned.includes('-')) {
    const parts = cleaned.split('T')[0].split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m - 1, d);
      }
    }
  }

  // Slash format  "MM/DD/YYYY" or "M/D/YYYY"
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    if (parts.length === 3) {
      const m = parseInt(parts[0], 10);
      const d = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);
      if (!isNaN(m) && !isNaN(d) && !isNaN(y)) {
        return new Date(y, m - 1, d);
      }
    }
  }

  const fallback = new Date(cleaned);
  return isNaN(fallback.getTime()) ? null : fallback;
};

// ─── Submission window ─────────────────────────────────────────────────────────

/**
 * Determines whether today falls inside the 14-day submission window for the
 * given deadline.
 *
 * Rules:
 *  - Window opens  : deadline − 14 days (inclusive)
 *  - Window closes : never (form stays open so late submissions are accepted)
 *  - If deadline is null / invalid → always open (no restriction)
 *
 * @param {string|Date|null} deadline
 * @returns {{
 *   canSubmit: boolean,   // true when within window OR past deadline
 *   isLate: boolean,      // true when today > deadline
 *   daysUntilOpen: number,// > 0 when window hasn't opened yet
 *   windowOpensOn: Date|null,
 *   deadline: Date|null,
 * }}
 */
export const getSubmissionWindowStatus = (deadline) => {
  if (!deadline) {
    return { canSubmit: true, isLate: false, daysUntilOpen: 0, windowOpensOn: null, deadline: null };
  }

  const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
  if (isNaN(deadlineDate.getTime())) {
    return { canSubmit: true, isLate: false, daysUntilOpen: 0, windowOpensOn: null, deadline: null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // The deadline is inclusive until end-of-day
  const deadlineEnd = new Date(deadlineDate);
  deadlineEnd.setHours(23, 59, 59, 999);

  // Window opens SUBMISSION_WINDOW_DAYS before the deadline
  const windowOpensOn = new Date(deadlineDate);
  windowOpensOn.setDate(windowOpensOn.getDate() - SUBMISSION_WINDOW_DAYS);
  windowOpensOn.setHours(0, 0, 0, 0);

  const isPastDeadline = today > deadlineEnd;
  const isBeforeWindow = today < windowOpensOn;

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilOpen = isBeforeWindow
    ? Math.ceil((windowOpensOn.getTime() - today.getTime()) / msPerDay)
    : 0;

  return {
    // Submission IS allowed when we're inside the window OR when the deadline
    // has already passed (the form stays open, just marked as late).
    canSubmit: !isBeforeWindow,
    isLate: isPastDeadline,
    daysUntilOpen,
    windowOpensOn,
    deadline: deadlineDate,
  };
};

// ─── Date-range validation ────────────────────────────────────────────────────

/**
 * Validates the next-term date pair against the current term's end date.
 *
 * Rules (per requirements):
 *  1. nextTermStartDate must be AFTER the current term's end date
 *  2. nextTermEndDate must be at least 1 month after nextTermStartDate
 *  (No academic-year bounds are enforced here.)
 *
 * @param {string} nextTermStartDate - raw string value from the form
 * @param {string} nextTermEndDate   - raw string value from the form
 * @param {string|Date|null} currentTermEndDate - end date of the selected term
 * @returns {{ nextTermStartDate: string, nextTermEndDate: string }}
 */
export const validateNextTermDates = (nextTermStartDate, nextTermEndDate, currentTermEndDate) => {
  const errors = { nextTermStartDate: '', nextTermEndDate: '' };

  const startD = nextTermStartDate ? parseStringToDate(nextTermStartDate) : null;
  const endD = nextTermEndDate ? parseStringToDate(nextTermEndDate) : null;

  // Determine the minimum allowed start date
  const minStartDate = currentTermEndDate
    ? parseStringToDate(typeof currentTermEndDate === 'string' ? currentTermEndDate : currentTermEndDate.toISOString())
    : (() => {
        // Fallback: yesterday (1-day safety buffer)
        const d = new Date();
        d.setDate(d.getDate() - 1);
        d.setHours(0, 0, 0, 0);
        return d;
      })();

  // Rule 1: start must be after current term end date
  if (startD && minStartDate) {
    const minStart = new Date(minStartDate);
    minStart.setHours(0, 0, 0, 0);
    if (startD <= minStart) {
      errors.nextTermStartDate = 'Next term start date must be after the current term end date.';
    }
  }

  // Rule 2: end must be at least 1 month after start
  if (startD && endD) {
    const minEnd = new Date(startD);
    minEnd.setMonth(minEnd.getMonth() + 1);
    if (endD < minEnd) {
      errors.nextTermEndDate = 'End date must be at least 1 month after start date.';
    }
  }

  return errors;
};
