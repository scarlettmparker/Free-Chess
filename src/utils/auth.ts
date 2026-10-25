import { executeDocument } from "@sun/api";
import {
  LoginDocument,
  MeDocument,
  MyRolesDocument,
  RequestMagicLinkDocument,
  VerifyMagicLinkDocument,
  LoginWithGoogleDocument,
  type MeQuery,
  type VerifyMagicLinkMutation,
  type LoginWithGoogleMutation,
} from "~/generated/graphql";

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
/**
 * Requests a magic-link email.
 *
 * @param email account email
 * @returns void
 */
export async function requestMagicLink(email: string): Promise<void> {
  await executeDocument(RequestMagicLinkDocument, { email });
}

/**
 * Verifies a magic-link token and returns a JWT.
 *
 * @param token magic-link token
 * @returns JWT or null
 */
export async function verifyMagicLink(token: string): Promise<string | null> {
  const res = await executeDocument<VerifyMagicLinkMutation>(VerifyMagicLinkDocument, { token });
  if (!res.success || !res.data) return null;
  return res.data.gaiaMutations.verifyMagicLink?.token ?? null;
}

/**
 * Signs in with Google using an authorization code.
 *
 * @param code authorization code
 * @param redirectUri redirect uri
 * @returns JWT or null
 */
export async function loginWithGoogle(code: string, redirectUri: string): Promise<string | null> {
  const res = await executeDocument<LoginWithGoogleMutation>(LoginWithGoogleDocument, { code, redirectUri });
  if (!res.success || !res.data) return null;
  return res.data.gaiaMutations.loginWithGoogle?.token ?? null;
}

/**
 * Returns the signed-in account's roles.
 *
 * @param token the JWT
 * @returns role names
 */
export async function getCurrentRoles(token: string | undefined): Promise<string[]> {
  if (!token) return [];
  const res = await executeDocument<{ gaiaQueries: { myRoles: string[] } }>(MyRolesDocument, {}, token);
  if (!res.success) return [];
  return res.data?.gaiaQueries.myRoles ?? [];
}

export async function getCurrentUser(token: string | undefined): Promise<MeQuery["gaiaQueries"]["me"] | null> {
  if (!token) return null;
  const res = await executeDocument<MeQuery>(MeDocument, {}, token);
  if (!res.success) {
    if (res.statusCode && res.statusCode >= 500) throw new Error(res.error || "Transient auth error");
    return null;
  }
  return res.data?.gaiaQueries.me ?? null;
}