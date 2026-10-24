/**
 * @fileoverview Guarded game administration mutations.
 * @module utils/admin-mutations
 */

import { defineMutation, getRequestIp, MutationError } from '@sun/ssr';
import { recordAudit } from '~/server/audit';
import type { Permission } from '~/server/permissions';
import { auth } from '~/server/auth-instance';
import { getSession, requirePermission } from '~/server/session';
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
async function requireGame(cookie: string | undefined, permission: Permission) {
  const session = await getSession(auth, cookie);
  const allowed = await requirePermission(auth, session, permission);
  if (!allowed || !session) {
    throw new MutationError('Forbidden', 403);
  }
  return session;
}

defineMutation({
  path: 'game/reset',
  async handler(body: ResetBody, context) {
    const session = await requireGame(context.cookie, { game: ['reset'] } satisfies Permission);
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
    recordAudit({
      action: 'game.reset',
      outcome: result.ok ? 'success' : 'failure',
      detail:
        body.boardLayoutId === undefined
          ? result.message
          : `${result.message} (layout ${body.boardLayoutId})`,
      actor: session.user,
      ip: getRequestIp(),
    });
    return result;
  },
});

defineMutation({
  path: 'game/clear',
  async handler(body: ClearBody, context) {
    const session = await requireGame(context.cookie, { game: ['clear'] } satisfies Permission);
    const command = body.color ? clearCommandByColor[body.color] : undefined;
    if (!command) {
      recordAudit({
        action: 'game.clear',
        outcome: 'failure',
        detail: 'Invalid colour',
        target: body.color ?? null,
        actor: session.user,
        ip: getRequestIp(),
      });
      throw new MutationError('Invalid colour', 400);
    }

    const result = await runAdminCommand(command);
    recordAudit({
      action: 'game.clear',
      outcome: result.ok ? 'success' : 'failure',
      detail: result.message,
      target: body.color ?? null,
      actor: session.user,
      ip: getRequestIp(),
    });
    return result;
  },
});

defineMutation({
  path: 'game/list-sessions',
  async handler(_body: Record<string, unknown>, context) {
    const session = await requireGame(context.cookie, {
      game: ['list-sessions'],
    } satisfies Permission);
    const result = await runAdminCommand('list');
    recordAudit({
      action: 'game.list-sessions',
      outcome: 'success',
      detail: result.message,
      actor: session.user,
      ip: getRequestIp(),
    });
    return result;
  },
});
