/**
 * @fileoverview Guarded game administration mutations.
 * @module utils/admin-mutations
 */

import { defineMutation, MutationError } from '@sun/ssr';
import { executeDocument, getCookieValue } from '@sun/api';
import { MyRolesDocument } from '~/generated/graphql';
import { AUTH_COOKIE } from '~/utils/auth';
import { FREE_CHESS_ADMIN_ROLE } from '~/utils/roles';
import { syncLayoutFromSun } from '~/server/board-layout-sync';
import { runAdminCommand, type AdminColor } from './admin-command';

/**
 * Body accepted by the reset mutation.
 */
type ResetBody = {
  /**
   * Sun board layout id to start with.
   */
  boardLayoutId?: string;
};

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
async function requireGame(cookie: string | undefined) {
  const token = getCookieValue(cookie, AUTH_COOKIE);
  if (!token) throw new MutationError('Forbidden', 403);
  const res = await executeDocument<{ gaiaQueries: { myRoles: string[] } }>(
    MyRolesDocument,
    {},
    token,
  );
  const roles = res.success ? (res.data?.gaiaQueries.myRoles ?? []) : [];
  if (!roles.includes(FREE_CHESS_ADMIN_ROLE)) {
    throw new MutationError('Forbidden', 403);
  }
}

defineMutation({
  path: 'game/reset',
  async handler(body: ResetBody, context) {
    await requireGame(context.cookie);
    let localLayoutId: number | undefined;
    if (body.boardLayoutId !== undefined) {
      localLayoutId = await syncLayoutFromSun(body.boardLayoutId);
    }
    const result = await runAdminCommand(
      'reset',
      localLayoutId === undefined ? {} : { body: { boardLayoutId: localLayoutId } },
    );
    if (!result.ok) {
      throw new MutationError(result.message, 400);
    }
    return result;
  },
});

defineMutation({
  path: 'game/clear',
  async handler(body: ClearBody, context) {
    await requireGame(context.cookie);
    const command = body.color ? clearCommandByColor[body.color] : undefined;
    if (!command) {
      throw new MutationError('Invalid colour', 400);
    }

    const result = await runAdminCommand(command);
    return result;
  },
});

defineMutation({
  path: 'game/list-sessions',
  async handler(_, context) {
    await requireGame(context.cookie);
    const result = await runAdminCommand('list');
    return result;
  },
});
