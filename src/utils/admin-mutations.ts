/**
 * @fileoverview Guarded game administration mutations.
 * @module utils/admin-mutations
 */

import { defineMutation, MutationError } from '@sun/ssr';
import type { Permission } from '~/server/permissions';
import { auth } from '~/server/auth-instance';
import { getSession, requirePermission } from '~/server/session';
import { runAdminCommand, type AdminColor } from './admin-command';

/**
 * Body accepted by the clear mutation.
 */
type ClearBody = {
  /**
   * Colour to clear.
   */
  color?: AdminColor;
};

/**
 * Admin command for each clear target.
 */
const clearCommandByColor: Record<AdminColor, 'cw' | 'cb' | 'clear'> = {
  white: 'cw',
  black: 'cb',
  all: 'clear',
};

/**
 * Rejects callers without the requested game permission.
 *
 * @param cookie Raw request cookie header.
 * @param permission Permission the caller must hold.
 */
async function requireGame(cookie: string | undefined, permission: Permission) {
  const session = await getSession(auth, cookie);
  const allowed = await requirePermission(auth, session, permission);
  if (!allowed) {
    throw new MutationError('Forbidden', 403);
  }
}

defineMutation({
  path: 'game/reset',
  async handler(_body: Record<string, unknown>, context) {
    await requireGame(context.cookie, { game: ['reset'] } satisfies Permission);
    return runAdminCommand('reset');
  },
});

defineMutation({
  path: 'game/clear',
  async handler(body: ClearBody, context) {
    await requireGame(context.cookie, { game: ['clear'] } satisfies Permission);
    const command = body.color ? clearCommandByColor[body.color] : undefined;
    if (!command) {
      throw new MutationError('Invalid colour', 400);
    }
    return runAdminCommand(command);
  },
});

defineMutation({
  path: 'game/list-sessions',
  async handler(_body: Record<string, unknown>, context) {
    await requireGame(context.cookie, { game: ['list-sessions'] } satisfies Permission);
    return runAdminCommand('list');
  },
});
