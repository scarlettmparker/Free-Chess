import { defineLoader } from '@sun/ssr';
import { executeDocument } from '@sun/api';
import { getCookieValue } from '@sun/api';
import { MeDocument, MyRolesDocument, type MeQuery } from '~/generated/graphql';
import { AUTH_COOKIE } from '~/utils/auth';

/**
 * Loads the signed-in account for the app shell.
 */
defineLoader({
  pattern: 'currentUser',
  async loader(_params, context) {
    const token = getCookieValue((context as { cookie?: string } | undefined)?.cookie, AUTH_COOKIE);
    if (!token) return { currentUser: null };
    const meRes = await executeDocument<MeQuery>(MeDocument, {}, token);
    if (!meRes.success || !meRes.data?.gaiaQueries.me) return { currentUser: null };
    return { currentUser: meRes.data.gaiaQueries.me };
  },
});

/**
 * Loads the signed-in account's roles.
 */
defineLoader({
  pattern: 'currentRoles',
  async loader(_params, context) {
    const token = getCookieValue((context as { cookie?: string } | undefined)?.cookie, AUTH_COOKIE);
    if (!token) return { currentRoles: [] };
    const rolesRes = await executeDocument<{ gaiaQueries: { myRoles: string[] } }>(
      MyRolesDocument,
      {},
      token,
    );
    return { currentRoles: rolesRes.success ? (rolesRes.data?.gaiaQueries.myRoles ?? []) : [] };
  },
});