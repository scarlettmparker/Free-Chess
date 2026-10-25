import { defineMutation, MutationError } from '@sun/ssr';
import { executeDocument } from '@sun/api';
import {
  SavePieceDocument,
  DeletePieceDocument,
  SavePieceSetDocument,
  DeletePieceSetDocument,
  type SavePieceMutation,
  type DeletePieceMutation,
  type SavePieceSetMutation,
  type DeletePieceSetMutation,
  type PieceInput,
  type PieceSetInput,
} from '~/generated/graphql';

/**
 * Saves a piece definition.
 */
defineMutation({
  path: 'pieces/save',
  async handler(body: PieceInput) {
    const result = await executeDocument<SavePieceMutation>(SavePieceDocument, { input: body });
    if (!result.success || !result.data?.medusaMutations.savePiece.piece) {
      throw new MutationError(result.error ?? 'Failed to save piece');
    }
    return { id: result.data.medusaMutations.savePiece.piece.id };
  },
});

/**
 * Deletes a piece definition.
 */
defineMutation({
  path: 'pieces/delete',
  async handler(body: { id: number | string }) {
    const result = await executeDocument<DeletePieceMutation>(DeletePieceDocument, {
      id: String(body.id),
    });
    if (!result.success || !result.data?.medusaMutations.deletePiece.ok) {
      throw new MutationError(result.error ?? 'Cannot delete piece');
    }
    return { ok: true };
  },
});

/**
 * Saves a piece set.
 */
defineMutation({
  path: 'piecesets/save',
  async handler(body: PieceSetInput) {
    const result = await executeDocument<SavePieceSetMutation>(SavePieceSetDocument, {
      input: body,
    });
    if (!result.success || !result.data?.medusaMutations.savePieceSet.pieceSet) {
      throw new MutationError(result.error ?? 'Failed to save piece set');
    }
    return { id: result.data.medusaMutations.savePieceSet.pieceSet.id };
  },
});

/**
 * Deletes a piece set.
 */
defineMutation({
  path: 'piecesets/delete',
  async handler(body: { id: number | string }) {
    const result = await executeDocument<DeletePieceSetMutation>(DeletePieceSetDocument, {
      id: String(body.id),
    });
    if (!result.success || !result.data?.medusaMutations.deletePieceSet.ok) {
      throw new MutationError(result.error ?? 'Cannot delete piece set');
    }
    return { ok: true };
  },
});