import { CSRF_FIELD, getCsrfToken, getRequestCookie } from '@sun/ssr';

/**
 * Reads one cookie from a raw cookie header.
 *
 * @param header Raw cookie header.
 * @param name Cookie name.
 * @returns Decoded value, or undefined.
 */
function readCookie(header: string | undefined, name: string) {
  if (!header) return undefined;
  for (const part of header.split(/;\s*/)) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1));
    }
  }
  return undefined;
}

/**
 * CSRF hidden field that is populated during SSR as well as hydration.
 */
const CsrfField = () => {
  const token =
    typeof document === 'undefined'
      ? (readCookie(getRequestCookie(), 'csrf_token') ?? '')
      : (getCsrfToken() ?? '');

  return <input type="hidden" name={CSRF_FIELD} value={token} readOnly />;
};

export default CsrfField;
