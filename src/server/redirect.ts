/**
 * @fileoverview Redirect target validation.
 * @module server/redirect
 */

/**
 * Accepts only same-origin absolute paths.
 *
 * @param value Candidate redirect target.
 * @param fallback Target used when the candidate is unsafe.
 * @returns A path safe to pass to `Location`.
 */
export function safeRedirect(value: unknown, fallback = '/') {
  if (typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return fallback;
  }
  return value;
}
