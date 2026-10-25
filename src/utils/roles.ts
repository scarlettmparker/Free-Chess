/**
 * @fileoverview Shared role name constants for Free Chess.
 * @module utils/roles
 */

/**
 * Role granted to Free Chess administrators.
 */
export const FREE_CHESS_ADMIN_ROLE = 'Free Chess Admin';

/**
 * Role granted to Free Chess players.
 */
export const FREE_CHESS_USER_ROLE = 'Free Chess User';

/**
 * Assignable role options in the admin UI.
 */
export const ROLE_OPTIONS = [FREE_CHESS_ADMIN_ROLE, FREE_CHESS_USER_ROLE] as const;

/**
 * Roles allowed into the admin area.
 */
export const ADMIN_ROLES = [FREE_CHESS_ADMIN_ROLE] as const;

/**
 * Catalog keys for the roles the admin UI can assign.
 */
const ROLE_LABEL_KEYS: Record<string, string> = {
  [FREE_CHESS_ADMIN_ROLE]: 'role-admin',
  [FREE_CHESS_USER_ROLE]: 'role-user',
};

/**
 * Resolves a Gaia role name to its display label.
 *
 * @param role Role name as stored by Gaia.
 * @param t Translation function for the admin namespace.
 * @returns Translated label, or the raw role name when unknown.
 */
export function roleLabel(role: string, t: (key: string) => string): string {
  const key = ROLE_LABEL_KEYS[role];
  return key ? t(key) : role;
}