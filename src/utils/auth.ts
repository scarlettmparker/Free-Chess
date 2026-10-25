import { executeDocument } from "@sun/api";
import { LoginDocument, MeDocument, type MeQuery } from "~/generated/graphql";

export const AUTH_COOKIE = "free_chess_auth";

export function buildAuthCookie(token: string, maxAgeSeconds = 60 * 60 * 12): string {
  return `${AUTH_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${maxAgeSeconds}`;
}

export function clearAuthCookie(): string {
  return `${AUTH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/**
 * Logs in via Gaia and returns the JWT, or null if rejected.
 *
 * @param username the account username or email
 * @param password the account password
 * @returns the JWT, or null
 */
export async function loginViaGaia(username: string, password: string): Promise<string | null> {
  const res = await executeDocument<{ gaiaMutations: { login: { token: string } | null } }>(
    LoginDocument,
    { input: { username, password } },
  );
  if (!res.success || !res.data) return null;
  return res.data.gaiaMutations.login?.token ?? null;
}

/**
 * Returns the signed-in account for a JWT, or null.
 *
 * @param token the JWT
 * @returns the account, or null
 */
export async function getCurrentUser(token: string | undefined): Promise<MeQuery["gaiaQueries"]["me"] | null> {
  if (!token) return null;
  const res = await executeDocument<MeQuery>(MeDocument, {}, token);
  if (!res.success) {
    if (res.statusCode && res.statusCode >= 500) throw new Error(res.error || "Transient auth error");
    return null;
  }
  return res.data?.gaiaQueries.me ?? null;
}