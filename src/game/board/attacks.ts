import { BOARD_SIZE, colors, gameState, getBitboard } from '../consts/board';
import { getCheckMove } from '../move/move';
import { getLSFBIndex } from './bitboard';

/**
 * Function to determine whether a square is attacked by a player.
 * It does this by going through the piece's attack lookup tables for each piece
 * based on the current game's occupancies and piece constraints based on move count.
 *
 * @param pos Square to check if attacked.
 * @param side Chess player (0. white, 1. black).
 * @param currentMove The current move of the board state.
 * @returns True (square is attacked), or false (square is not attacked).
 */
export const isSquareAttacked = (pos: number, side: number) => {
  if (pos == -1) return false;
  const color = side === colors.WHITE ? colors.WHITE : colors.BLACK;
  const filteredPieces = gameState.pieces.filter((piece) => piece.getColor() === color);

  const l = filteredPieces.length;
  for (let i = 0; i < l; i++) {
    const piece = filteredPieces[i];
    const pieceID = piece.getID();

    if (piece.getPawn()) {
      if (piece.getPawnPieceState()[piece.getColor() ^ 1][pos] & getBitboard(pieceID).bitboard)
        return true;
    }

    if (piece.getSlider()) {
      if (
        piece.getSlidingPieceAttacks(
          pos,
          gameState.occupancies[colors.BOTH],
          piece.straightConstraints,
          piece.diagonalConstraints,
        ) & getBitboard(pieceID).bitboard
      )
        return true;
    }

    if (piece.getLeaper()) {
      let bitboard = getBitboard(pieceID).bitboard;
      let checkMove = 0;
      let checked = false;

      while (bitboard > 0n) {
        const sourceSquare = getLSFBIndex(bitboard);
        checkMove = getCheckMove(piece, sourceSquare);

        if (checkMove && checkMove > 0) {
          checked = true;
          if (
            piece.getLeaperPieceState()[piece.getColor() ^ 1][checkMove][pos] &
            getBitboard(pieceID).bitboard
          )
            return true;
        }

        bitboard &= ~(1n << BigInt(sourceSquare));
      }

      if (checkMove == 0 && !checked) {
        if (
          piece.getLeaperPieceState()[piece.getColor() ^ 1][checkMove][pos] &
          getBitboard(pieceID).bitboard
        )
          return true;
      }
    }
  }

  return false;
};

/**
 * Prints attacked squares for a given player.
 * @param side Chess player (0. white, 1. black).
 */
export const printAttackedSquares = (side: number) => {
  let out = '';
  for (let rank = 0; rank < BOARD_SIZE; rank++) {
    for (let file = 0; file < BOARD_SIZE; file++) {
      const square = rank * 8 + file;
      if (!file) out += ` ${8 - rank}`;
      out += `  ${isSquareAttacked(square, side) ? 1 : 0}`;
    }
    out += '\n';
  }
  out += '    a  b  c  d  e  f  g  h';
  console.log(out);
};

export default null;
