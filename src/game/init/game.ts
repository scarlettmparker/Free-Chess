import { gameState, colors } from '~/game/consts/board';
import {
  LeaperMoveBehavior,
  MoveBehavior,
  PawnMoveBehavior,
  Piece,
  SlidingMoveBehavior,
} from '~/game/piece/piece';
import { initSlidingPieces } from '~/game/init/sliding-piece';

/**
 * Helper function to reset the game state, sets everything in
 * the global game state variables to their defaults.
 */
export function resetGameState() {
  gameState.pieces = [];
  gameState.bitboards = [];
  gameState.occupancies = Array.from({ length: 3 }, () => 0n);
  gameState.globalMove = 0;
  gameState.side = 0;
  gameState.enpassant = -1;
  gameState.castle = 0n;
  gameState.nodes = 0;
}

/**
 * Initialize the game state. Goes through all pieces added on
 * game start and creates a bitboard of array of length no. pieces.
 */
export function initGameState() {
  gameState.whitePieceIds = gameState.pieces
    .filter((piece: Piece) => piece.getColor() === colors.WHITE)
    .map((piece: Piece) => piece.getId());

  gameState.blackPieceIds = gameState.pieces
    .filter((piece: Piece) => piece.getColor() === colors.BLACK)
    .map((piece: Piece) => piece.getId());

  gameState.bitboards = Array.from(
    { length: gameState.whitePieceIds.length + gameState.blackPieceIds.length },
    (_, index) => {
      const pieceId = gameState.pieces[index].getId();
      return { pieceId, bitboard: 0n };
    },
  );
}

/**
 * Initialize the game. Loops through the pieces and initializes
 * their attacks, copying the sliding pieces from white to black.
 */
export function initGame() {
  const { straightPieceMask, diagonalPieceMask, straightPieceState, diagonalPieceState } =
    initSlidingPieces();

  gameState.pieces.forEach((piece: Piece) => {
    const moveBehavior: MoveBehavior = piece.getMoveBehavior();

    if (moveBehavior instanceof SlidingMoveBehavior) {
      if (moveBehavior.getStraight()) {
        moveBehavior.setSlidingStraightPieceState(straightPieceState);
        moveBehavior.setStraightPieceMask(straightPieceMask);
      }
      if (moveBehavior.getDiagonal()) {
        moveBehavior.setSlidingDiagonalPieceState(diagonalPieceState);
        moveBehavior.setDiagonalPieceMask(diagonalPieceMask);
      }
    }

    // Initialize attacks for leaper or pawn pieces
    if (moveBehavior instanceof LeaperMoveBehavior || moveBehavior instanceof PawnMoveBehavior) {
      moveBehavior.initializeAttacks();
    }
  });
}
