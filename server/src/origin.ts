/**
 * Normalise one allowlist entry to a URL host.
 *
 * @param value Raw entry.
 * @returns Host with optional port.
 */
function normalizeOrigin(value: string): string {
  try {
    return new URL(value.includes('://') ? value : `https://${value}`).host;
  } catch {
    return value;
  }
}

/**
 * Parse the first non-empty origin allowlist.
 *
 * @param values Candidate environment values.
 * @returns Normalised hosts.
 */
export function parseAllowedOrigins(...values: Array<string | undefined>): string[] {
  for (const value of values) {
    const entries = (value ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (entries.length > 0) return entries.map(normalizeOrigin);
  }
  return [];
}

/**
 * Check whether an origin is allowed.
 *
 * An empty allowlist accepts every origin. That is intended for local
 * development; production startup rejects an empty allowlist.
 *
 * @param origin Origin header.
 * @param allowed Allowed hosts.
 * @returns True when the origin is allowed.
 */
export function isOriginAllowed(origin: string | null, allowed: string[]): boolean {
  if (allowed.length === 0) return true;
  if (!origin) return false;
  try {
    return allowed.includes(new URL(origin).host);
  } catch {
    return false;
  }
}
