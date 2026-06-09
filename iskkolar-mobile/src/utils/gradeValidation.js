/**
 * Validates GWA based on the following rules:
 * - Accepted scales: 1.00–5.00, 0.00–4.00, Percentage 60–100 (with/without "%")
 * - Reject cases: > 100, negative, non-numeric/random text, between 5.01 and 59.99
 *
 * @param {any} value
 * @returns {boolean}
 */
export const validateGwa = (value) => {
  if (value === undefined || value === null) return false;
  let cleanVal = String(value).trim();
  if (cleanVal.endsWith("%")) {
    cleanVal = cleanVal.slice(0, -1).trim();
  }
  if (!/^-?\d+(\.\d+)?$/.test(cleanVal)) return false;
  const num = parseFloat(cleanVal);
  if (Number.isNaN(num) || num < 0 || num > 100) return false;
  if (num > 5 && num < 60) return false;
  return true;
};

export const INVALID_GWA_ERROR = "❌ Invalid grade input. Please enter a valid GWA using a 1.00-5.00 scale, a 4.00 scale, or a percentage (60-100%).";
