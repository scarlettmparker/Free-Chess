/**
 * @fileoverview Guarded game administration mutations.
 * @module utils/admin-mutations
 */

import { defineMutation, MutationError } from '@sun/ssr';
import { executeDocument, getCookieValue } from '@sun/api';
import {
  GetBoardLayoutDocument,
  ListPiecesDocument,
  MyRolesDocument,
  type GetBoardLayoutQuery,
  type ListPiecesQuery,
} from '~/generated/graphql';
import { AUTH_COOKIE } from '~/utils/auth';
import { FREE_CHESS_ADMIN_ROLE } from '~/utils/roles';
import { upsertSyncedLayout, type SyncedPlacement } from '~/server/board-layouts';
import { syncPiece, type PieceInput } from '~/server/game-pieces';
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
  const res = await executeDocument<{ gaiaQueries: { myRoles: string[] } }>(MyRolesDocument, {}, token);
  const roles = res.success ? (res.data?.gaiaQueries.myRoles ?? []) : [];
  if (!roles.includes(FREE_CHESS_ADMIN_ROLE)) {
    throw new MutationError('Forbidden', 403);
  }
}

/**
 * Mirrors a Sun board layout into the local engine database.
 *
 * @param id Sun board layout id.
 * @returns Local layout id.
 */
async function syncLayout(id: string): Promise<number> {
  const layoutResult = await executeDocument<GetBoardLayoutQuery>(GetBoardLayoutDocument, { id });
  const layout = layoutResult.success ? layoutResult.data?.medusaQueries.boardLayout : null;
  if (!layout) {
    throw new MutationError('Board layout not found', 400);
  }

  const piecesResult = await executeDocument<ListPiecesQuery>(ListPiecesDocument);
  const pieces = piecesResult.success ? (piecesResult.data?.medusaQueries.pieces ?? []) : [];
  for (const piece of pieces) {
    const { id: _id, isSystem: _isSystem, ...base } = piece;
    const input: PieceInput = {
      ...base,
      promotionTargets: base.promotionTargets?.map(Number) ?? [],
      promotionRanks: base.promotionRanks ?? [],
      moveStates: Array.isArray(base.moveStates) ? base.moveStates : [],
      sprite: base.sprite ?? {
        headKey: 'pawn-head',
        bodyKey: 'pawn-body',
        footKey: 'pawn-foot',
      },
    };
    syncPiece(input);
  }
  const slugById = new Map(pieces.map((piece) => [piece.id, piece.slug]));
  const placements: SyncedPlacement[] = layout.placements.map((placement) => {
    const definitionSlug = slugById.get(placement.definitionId);
    if (!definitionSlug) {
      throw new MutationError('Board layout refers to an unknown piece', 400);
    }
    return {
      definitionSlug,
      color: placement.color as 0 | 1,
      square: placement.square,
    };
  });

  return upsertSyncedLayout({
    slug: layout.slug,
    name: layout.name,
    description: layout.description,
    placements,
  });
}

defineMutation({
  path: 'game/reset',
  async handler(body: ResetBody, context) {
    await requireGame(context.cookie);
    let localLayoutId: number | undefined;
    if (body.boardLayoutId !== undefined) {
      localLayoutId = await syncLayout(body.boardLayoutId);
    }
    return runAdminCommand(
      'reset',
      localLayoutId === undefined ? {} : { body: { boardLayoutId: localLayoutId } },
    );
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
