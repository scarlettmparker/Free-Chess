import { MutationError } from '@sun/ssr';
import { executeDocument } from '@sun/api';
import {
  GetBoardLayoutDocument,
  ListPiecesDocument,
  type GetBoardLayoutQuery,
  type ListPiecesQuery,
} from '~/generated/graphql';
import { syncPiece, type PieceInput } from '~/server/game-pieces';
import { upsertSyncedLayout, type SyncedPlacement } from '~/server/board-layouts';

/**
 * Mirrors a Sun board layout into the local engine database.
 *
 * @param id Sun board layout id.
 * @returns Local layout id.
 */
export async function syncLayoutFromSun(id: string): Promise<number> {
  const layoutResult = await executeDocument<GetBoardLayoutQuery>(GetBoardLayoutDocument, { id });
  const layout = layoutResult.success ? layoutResult.data?.medusaQueries.boardLayout : null;
  if (!layout) {
    throw new MutationError('Board layout not found', 400);
  }

  const piecesResult = await executeDocument<ListPiecesQuery>(ListPiecesDocument, { all: true });
  const pieces = piecesResult.success ? (piecesResult.data?.medusaQueries.pieces ?? []) : [];
  for (const piece of pieces) {
    const {
      id: _id,
      isSystem: _isSystem,
      createdBy: _createdBy,
      ownerName: _ownerName,
      ...base
    } = piece;
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
