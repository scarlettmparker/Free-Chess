import { defineLoader } from '@sun/ssr';
import { executeDocument } from '@sun/api';
import {
  ListPiecesDocument,
  GetPieceDocument,
  ListPieceSetsDocument,
  GetPieceSetDocument,
  type ListPiecesQuery,
  type GetPieceQuery,
  type ListPieceSetsQuery,
  type GetPieceSetQuery,
} from '~/generated/graphql';

/**
 * Lists all piece definitions.
 */
defineLoader({
  pattern: 'pieces',
  async loader() {
    try {
      const result = await executeDocument<ListPiecesQuery>(ListPiecesDocument, { all: true });
      if (result?.success && result.data) {
        return { pieces: result.data.medusaQueries.pieces ?? [] };
      }
      return { pieces: [] };
    } catch (error) {
      console.error('Failed to fetch pieces:', error);
      return { pieces: [] };
    }
  },
});

/**
 * Gets one piece definition.
 *
 * @param params route params
 */
defineLoader({
  pattern: 'pieces/:id',
  async loader(params) {
    const id = params.id as string;
    if (!id) return null;
    try {
      const result = await executeDocument<GetPieceQuery>(GetPieceDocument, { id });
      if (result?.success && result.data) {
        return { piece: result.data.medusaQueries.piece ?? null };
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch piece:', error);
      return null;
    }
  },
});

/**
 * Lists all piece sets.
 */
defineLoader({
  pattern: 'piecesets',
  async loader() {
    try {
      const result = await executeDocument<ListPieceSetsQuery>(ListPieceSetsDocument);
      if (result?.success && result.data) {
        return { pieceSets: result.data.medusaQueries.pieceSets ?? [] };
      }
      return { pieceSets: [] };
    } catch (error) {
      console.error('Failed to fetch piece sets:', error);
      return { pieceSets: [] };
    }
  },
});

/**
 * Gets one piece set.
 *
 * @param params route params
 */
defineLoader({
  pattern: 'piecesets/:id',
  async loader(params) {
    const id = params.id as string;
    if (!id) return null;
    try {
      const result = await executeDocument<GetPieceSetQuery>(GetPieceSetDocument, { id });
      if (result?.success && result.data) {
        return { pieceSet: result.data.medusaQueries.pieceSet ?? null };
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch piece set:', error);
      return null;
    }
  },
});