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