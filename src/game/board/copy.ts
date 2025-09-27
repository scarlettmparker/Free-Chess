import { gameState } from '../consts/board';
import { Piece } from '../piece/piece';

/**
 * Copies the current board state.
 */
export function copyBoard() {
  const whiteMovesCopy = new Map(gameState.whiteMoves);
  const blackMovesCopy = new Map(gameState.blackMoves);
  const piecesCopy = gameState.pieces;

  const bitboardsCopy = gameState.bitboards.map((bitboardData) => ({
    pieceId: bitboardData.pieceId,
    bitboard: bitboardData.bitboard,
  }));
  const occupanciesCopy = Array.from({ length: 3 }, (_, i) => gameState.occupancies[i]);
  const globalMoveCopy = gameState.globalMove;
  const sideCopy = gameState.side;
  const enpassantCopy = gameState.enpassant;
  const castleCopy = gameState.castle;

  return {
    whiteMovesCopy,
    blackMovesCopy,
    piecesCopy,
    bitboardsCopy,
    occupanciesCopy,
    globalMoveCopy,
    sideCopy,
    enpassantCopy,
    castleCopy,
  };
}

/**
 * Restores the board state from a previous copy.
 * @param {Object} copies - The copied board states returned by copyBoard.
 */
export function takeBack(copies: {
  whiteMovesCopy: Map<number, number>;
  blackMovesCopy: Map<number, number>;
  piecesCopy: Piece[];
  bitboardsCopy: { pieceId: number; bitboard: bigint }[];
  occupanciesCopy: bigint[];
  globalMoveCopy: number;
  sideCopy: number;
  enpassantCopy: number;
  castleCopy: bigint;
}) {
  const {
    whiteMovesCopy,
    blackMovesCopy,
    piecesCopy,
    bitboardsCopy,
    occupanciesCopy,
    globalMoveCopy,
    sideCopy,
    enpassantCopy,
    castleCopy,
  } = copies;

  // restore bitboards
  gameState.whiteMoves = whiteMovesCopy;
  gameState.blackMoves = blackMovesCopy;
  gameState.pieces = piecesCopy;
  gameState.bitboards = bitboardsCopy;
  gameState.occupancies = occupanciesCopy;
  gameState.globalMove = globalMoveCopy;
  gameState.side = sideCopy;
  gameState.enpassant = enpassantCopy;
  gameState.castle = castleCopy;
}

export default null;
