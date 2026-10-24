/**
 * @fileoverview Session-backed page data shared by the app shell.
 * @module utils/global-data
 */

import { defineLoader } from '@sun/ssr';
import { auth } from '~/server/auth-instance';
import { getSession, rolesOf } from '~/server/session';

/**
 * Account fields shown in the app shell.
 */
export type CurrentUser = {
  /**
   * Account id.
   */
  id: string;
  /**
   * Email address used for sign-in.
   */
  email: string;
  /**
   * Display name.
   */
  name: string;
  /**
   * Comma-separated role field from better-auth.
   */
  role: string;
};

defineLoader({
  pattern: 'currentUser',
  async loader(_params, context) {
    const session = await getSession(auth, context.cookie);
    const user = session?.user;
    const currentUser: CurrentUser | null = user
      ? {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || 'user',
        }
      : null;
    return { currentUser };
  },
});

defineLoader({
  pattern: 'currentRoles',
  async loader(_params, context) {
    const session = await getSession(auth, context.cookie);
    return { currentRoles: rolesOf(session?.user) };
  },
});
