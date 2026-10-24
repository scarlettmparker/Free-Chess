import { defineLoader } from '@sun/ssr';
import { listPieces, getPiece, listSets, getSet } from '~/server/game-pieces';

/**
 * List all piece definitions.
 */
defineLoader({
  pattern: 'pieces',
  async loader() {
    return { pieces: listPieces() };
  },
});

/**
 * Get one piece definition.
 *
 * @param params Route params.
 */
defineLoader({
  pattern: 'pieces/:id',
  async loader(params) {
    const id = Number(params.id);
    return { piece: getPiece(id) };
  },
});

/**
 * List all piece sets.
 */
defineLoader({
  pattern: 'piecesets',
  async loader() {
    return { pieceSets: listSets() };
  },
});

/**
 * Get one piece set.
 *
 * @param params Route params.
 */
defineLoader({
  pattern: 'piecesets/:id',
  async loader(params) {
    const id = Number(params.id);
    return { pieceSet: getSet(id) };
  },
});
