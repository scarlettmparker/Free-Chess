/**
 * @fileoverview Session lookup and permission helpers.
 * @module server/session
 */

import type { createAuth } from './auth.ts';
import type { Permission } from './permissions.ts';

/**
 * Auth instance returned by `createAuth`.
 */
export type Auth = ReturnType<typeof createAuth>;

/**
 * Session payload returned by better-auth.
 */
export type SessionData = NonNullable<Awaited<ReturnType<Auth['api']['getSession']>>>;

/**
 * Reads the session for a cookie header.
 *
 * @param auth Auth instance to query.
 * @param cookie Raw cookie header, when present.
 * @returns Session payload or null for a guest.
 */
export async function getSession(auth: Auth, cookie?: string | null) {
  if (!cookie) return null;
  return auth.api.getSession({ headers: new Headers({ cookie }) });
}

/**
 * Splits the comma-separated role field into role names.
 *
 * @param user User record with an optional role field.
 * @returns Role names assigned to the user.
 */
export function rolesOf(user: { role?: string | null } | null | undefined) {
  return (user?.role || 'user')
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean);
}

/**
 * Checks whether the session holds any of the allowed roles.
 *
 * @param session Session payload, or null for a guest.
 * @param allowed Role names that may pass.
 * @returns True when the session holds at least one role.
 */
export function hasAnyRole(session: SessionData | null, allowed: string[]) {
  if (!session) return false;
  const held = new Set(rolesOf(session.user));
  return allowed.some((role) => held.has(role));
}

/**
 * Checks whether the session has every requested permission.
 *
 * @param auth Auth instance to query.
 * @param session Session payload, or null for a guest.
 * @param permission Permissions the caller must hold.
 * @returns True when the session holds each permission.
 */
export async function requirePermission(
  auth: Auth,
  session: SessionData | null,
  permission: Permission,
) {
  if (!session) return false;

  const { success } = await auth.api.userHasPermission({
    body: {
      userId: session.user.id,
      permissions: permission,
    },
  });

  return success;
}
