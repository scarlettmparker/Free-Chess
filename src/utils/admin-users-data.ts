/**
 * @fileoverview Admin account loaders.
 * @module utils/admin-users-data
 */

import { defineLoader } from '@sun/ssr';
import { executeDocument } from '@sun/api';
import { callerHeaders } from '~/server/admin-auth';
import { auth } from '~/server/auth-instance';
import type { Permission } from '~/server/permissions';
import { getSession, requirePermission } from '~/server/session';
import { ListAccountsDocument, GetAccountDocument, type ListAccountsQuery, type GetAccountQuery } from '~/generated/graphql';
import {
  emptyUserPage,
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
    const allowed = await canRead(context.cookie, { user: ['list'] } satisfies Permission);
    if (!allowed) {
      return { adminUsers: emptyUserPage(page, PAGE_SIZE) };
    }

    try {
      const result = await executeDocument<ListAccountsQuery>(ListAccountsDocument, {
        pagination: { page, size: PAGE_SIZE },
      });
      const items = result?.success ? (result.data?.gaiaQueries.accounts.items ?? []) : [];
      const total = result?.success ? (result.data?.gaiaQueries.accounts.pageInfo.totalCount ?? 0) : 0;
      const adminUsers: AdminUserPage = {
        users: items.map((u) => ({
          id: u.id,
          email: u.username,
          name: u.username,
          role: 'user',
          banned: u.status === 'SUSPENDED',
          banReason: null,
          banExpires: null,
          createdAt: String(u.createdAt ?? ''),
          updatedAt: String(u.updatedAt ?? ''),
        })),
        total,
        page,
        pageSize: PAGE_SIZE,
        totalPages: Math.ceil(total / PAGE_SIZE) || 1,
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
      const result = await executeDocument<GetAccountQuery>(GetAccountDocument, { id });
      if (!result?.success || !result.data?.gaiaQueries.account) {
        return { adminUser: null };
      }
      const u = result.data.gaiaQueries.account;
      return {
        adminUser: {
          id: u.id,
          email: u.username,
          name: u.username,
          role: 'user',
          banned: u.status === 'SUSPENDED',
          banReason: null,
          banExpires: null,
          createdAt: String(u.createdAt ?? ''),
          updatedAt: String(u.updatedAt ?? ''),
        },
      };
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
