/**
 * @fileoverview Admin session list loader.
 * @module utils/admin-data
 */

import { defineLoader } from '@sun/ssr';
import type { Permission } from '~/server/permissions';
import { auth } from '~/server/auth-instance';
import { getSession, requirePermission } from '~/server/session';
import { runAdminCommand } from './admin-command';

defineLoader({
  pattern: 'adminSessions',
  async loader(_params, context) {
    const session = await getSession(auth, context.cookie);
    const allowed = await requirePermission(auth, session, {
      game: ['list-sessions'],
    } satisfies Permission);
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
