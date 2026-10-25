/**
 * @fileoverview Guarded game administration mutations.
 * @module utils/admin-mutations
 */

import { defineMutation, MutationError } from '@sun/ssr';
import { executeDocument, getCookieValue } from '@sun/api';
import { MyRolesDocument } from '~/generated/graphql';
import { AUTH_COOKIE } from '~/utils/auth';
import { getLayout, loadLayout } from '~/server/board-layouts';
import { validateBoardLayout } from '~/game/board/validate-layout';
import { runAdminCommand, type AdminColor } from './admin-command';

/**
 * Body accepted by the reset mutation.
 */
type ResetBody = {
  /**
   * Board layout id to start with.
   */
  boardLayoutId?: number;
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
  const res = await executeDocument<{ gaiaQueries: { myRoles: string[] } }>(MyRolesDocument, {}, token);
  const roles = res.success ? (res.data?.gaiaQueries.myRoles ?? []) : [];
  if (!roles.includes('admin') && !roles.includes('game-admin')) {
    throw new MutationError('Forbidden', 403);
  }
}

defineMutation({
  path: 'game/reset',
  async handler(body: ResetBody, context) {
    await requireGame(context.cookie);
    if (body.boardLayoutId !== undefined) {
      const layout = getLayout(body.boardLayoutId);
      if (!layout) {
        throw new MutationError('Board layout not found', 400);
      }
      const loaded = loadLayout(body.boardLayoutId);
      if (!loaded) {
        throw new MutationError('Board layout refers to unknown pieces', 400);
      }
      const validation = validateBoardLayout(loaded.placements, loaded.definitions);
      if (!validation.ok) {
        throw new MutationError(`Illegal starting position: ${validation.errors.join(', ')}`, 400);
      }
    }
    const result = await runAdminCommand('reset', body.boardLayoutId === undefined ? {} : { body });
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
