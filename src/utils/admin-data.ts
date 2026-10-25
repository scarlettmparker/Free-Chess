import { defineLoader } from '@sun/ssr';
import { executeDocument } from '@sun/api';
import { getCookieValue } from '@sun/api';
import { MyRolesDocument } from '~/generated/graphql';
import { AUTH_COOKIE } from '~/utils/auth';
import { runAdminCommand } from './admin-command';

const ADMIN_ROLES = ['admin', 'game-admin', 'user-admin'];

/**
 * Checks whether the caller holds any admin role.
 *
 * @param cookie raw cookie header
 * @returns true when allowed
 */
async function canManage(cookie: string | undefined): Promise<boolean> {
  const token = getCookieValue(cookie, AUTH_COOKIE);
  if (!token) return false;
  const res = await executeDocument<{ gaiaQueries: { myRoles: string[] } }>(MyRolesDocument, {}, token);
  if (!res.success) return false;
  const roles = res.data?.gaiaQueries.myRoles ?? [];
  return ADMIN_ROLES.some((role) => roles.includes(role));
}

defineLoader({
  pattern: 'adminSessions',
  async loader(_params, context) {
    const allowed = await canManage(context.cookie);
    if (!allowed) {
      return { adminSessions: [] };
    }

    try {
      const result = await runAdminCommand('list');
      return { adminSessions: result.sessions ?? [] };
    } catch (error) {
      console.error('Failed to list admin sessions:', error);
      return { adminSessions: [] };
    }
  },
});