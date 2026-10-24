/**
 * @fileoverview Admin account loaders.
 * @module utils/admin-users-data
 */

import { defineLoader } from '@sun/ssr';
import { callerHeaders } from '~/server/admin-auth';
import { auth } from '~/server/auth-instance';
import type { Permission } from '~/server/permissions';
import { getSession, requirePermission } from '~/server/session';
import {
  emptyUserPage,
  toAdminUser,
  toAdminUserSession,
  type AdminUserPage,
} from './admin-user-types';

const PAGE_SIZE = 20;

/**
 * Checks the caller's permission without throwing.
 *
 * @param cookie Raw request cookie header.
 * @param permission Permission the caller must hold.
 * @returns True when the caller may read the data.
 */
async function canRead(cookie: string | undefined, permission: Permission) {
  const session = await getSession(auth, cookie);
  return requirePermission(auth, session, permission);
}

defineLoader({
  pattern: 'adminUsers',
  async loader(params, context) {
    const page = Math.max(0, Number(params.page ?? 0) || 0);
    const search = typeof params.search === 'string' ? params.search : '';
    const allowed = await canRead(context.cookie, { user: ['list'] } satisfies Permission);
    if (!allowed) {
      return { adminUsers: emptyUserPage(page, PAGE_SIZE) };
    }

    try {
      const result = await auth.api.listUsers({
        query: {
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
          searchValue: search || undefined,
          searchField: 'email',
          searchOperator: 'contains',
          sortBy: 'createdAt',
          sortDirection: 'desc',
        },
        headers: callerHeaders(context.cookie),
      });
      const adminUsers: AdminUserPage = {
        users: result.users.map(toAdminUser),
        total: result.total,
        page,
        pageSize: PAGE_SIZE,
        totalPages: Math.ceil(result.total / PAGE_SIZE),
      };
      return { adminUsers };
    } catch (error) {
      console.error('Failed to list admin users:', error);
      return { adminUsers: emptyUserPage(page, PAGE_SIZE) };
    }
  },
});

defineLoader({
  pattern: 'adminUser',
  async loader(params, context) {
    const id = typeof params.id === 'string' ? params.id : '';
    const allowed = await canRead(context.cookie, { user: ['get'] } satisfies Permission);
    if (!allowed || !id) {
      return { adminUser: null };
    }

    try {
      const user = await auth.api.getUser({
        query: { id },
        headers: callerHeaders(context.cookie),
      });
      return { adminUser: toAdminUser(user) };
    } catch (error) {
      console.error('Failed to load admin user:', error);
      return { adminUser: null };
    }
  },
});

defineLoader({
  pattern: 'adminUserSessions',
  async loader(params, context) {
    const id = typeof params.id === 'string' ? params.id : '';
    const allowed = await canRead(context.cookie, { session: ['list'] } satisfies Permission);
    if (!allowed || !id) {
      return { adminUserSessions: [] };
    }

    try {
      const result = await auth.api.listUserSessions({
        body: { userId: id },
        headers: callerHeaders(context.cookie),
      });
      return { adminUserSessions: result.sessions.map(toAdminUserSession) };
    } catch (error) {
      console.error('Failed to load admin user sessions:', error);
      return { adminUserSessions: [] };
    }
  },
});
