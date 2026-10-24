/**
 * @fileoverview Role and permission definitions for the admin plugin.
 * @module server/permissions
 */

import { createAccessControl } from 'better-auth/plugins/access';

/**
 * Actions available to each protected resource.
 */
export const statement = {
  game: ['reset', 'clear', 'list-sessions'],
  user: [
    'create',
    'list',
    'set-role',
    'set-password',
    'ban',
    'delete',
    'get',
    'update',
    'set-email',
  ],
  session: ['list', 'revoke', 'delete'],
} as const;

/**
 * Access control used by the auth plugin and server-side checks.
 */
export const ac = createAccessControl(statement);

/**
 * Roles assignable from the admin UI.
 */
export const roles = {
  admin: ac.newRole({
    game: [...statement.game],
    user: [...statement.user],
    session: [...statement.session],
  }),
  'game-admin': ac.newRole({
    game: [...statement.game],
  }),
  'user-admin': ac.newRole({
    user: [
      'create',
      'list',
      'set-role',
      'set-password',
      'ban',
      'delete',
      'get',
      'update',
      'set-email',
    ],
    session: ['list', 'revoke'],
  }),
  user: ac.newRole({}),
};

/**
 * Role assigned to users without an explicit role.
 */
export const defaultRole = 'user';

/**
 * Roles the admin plugin treats as administrators.
 */
export const adminRoles = ['admin'];

/**
 * Permission map accepted by the admin plugin.
 */
export type Permission = {
  /**
   * Game management actions.
   */
  game?: (typeof statement.game)[number][];
  /**
   * User management actions.
   */
  user?: (typeof statement.user)[number][];
  /**
   * Session management actions.
   */
  session?: (typeof statement.session)[number][];
};
