/**
 * @fileoverview Admin audit log loader.
 * @module utils/audit-data
 */

import { defineLoader } from '@sun/ssr';
import { listAudit } from '~/server/audit';
import { auth } from '~/server/auth-instance';
import type { Permission } from '~/server/permissions';
import { getSession, requirePermission } from '~/server/session';

defineLoader({
  pattern: 'adminAudit',
  async loader(_params, context) {
    const session = await getSession(auth, context.cookie);
    const allowed = await requirePermission(auth, session, {
      audit: ['read'],
    } satisfies Permission);
    if (!allowed) {
      return { adminAudit: [] };
    }

    try {
      return { adminAudit: listAudit(200) };
    } catch (error) {
      console.error('Failed to load audit log:', error);
      return { adminAudit: [] };
    }
  },
});
