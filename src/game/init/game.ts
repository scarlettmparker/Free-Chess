import { gameState, colors } from '../consts/board';
import { Piece } from '../piece/piece';
import { initSlidingPieces } from './slidingpiece';

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
    .map((piece: Piece) => piece.getID());

  gameState.blackPieceIds = gameState.pieces
    .filter((piece: Piece) => piece.getColor() === colors.BLACK)
    .map((piece: Piece) => piece.getID());

  gameState.bitboards = Array.from(
    { length: gameState.whitePieceIds.length + gameState.blackPieceIds.length },
    (_, index) => {
      const pieceID = gameState.pieces[index].getID();
      return { pieceID, bitboard: 0n };
    },
  );
}

/**
 * Initialize the game. Loops through the pieces and initializes
 * their attacks, copying the sliding pieces from white to black.
 */
export function initGame() {
  let { straightPieceMask, diagonalPieceMask, straightPieceState, diagonalPieceState } =
    initSlidingPieces();

  gameState.pieces.map((piece) => {
    if (piece.getSlider()) {
      if (piece.straight) {
        piece.setSlidingStraightPieceState(straightPieceState);
        piece.setStraightPieceMask(straightPieceMask);
      }
      if (piece.diagonal) {
        piece.setSlidingDiagonalPieceState(diagonalPieceState);
        piece.setDiagonalPieceMask(diagonalPieceMask);
      }
    }
    if (piece.getLeaper()) {
      piece.initLeaperAttacks();
    }
    if (piece.getPawn()) {
      piece.initPawnAttacks();
    }
  });
}
