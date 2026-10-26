import { BOARD_SIZE, colors, gameState, getBitboard } from '~/game/consts/board';
import { lsbIndex } from '~/game/board/bb';
import { offsetSquare } from '~/game/board/square-helper';
import { getPieceState } from '~/game/move/piece-state';
import type { Piece } from '~/game/piece/piece';
import type { MoveVector } from '~/game/piece/piece-definition';

/**
 * Whether any piece occupies a square.
 *
 * @param square Square to test.
 * @returns True when the square is occupied.
 */
function isOccupied(square: number): boolean {
  if (square < 32) return ((gameState.occLo[colors.BOTH] >>> square) & 1) === 1;
  return ((gameState.occHi[colors.BOTH] >>> (square - 32)) & 1) === 1;
}

/**
 * Whether one move vector from a source square attacks a target square.
 *
 * Step and forbidden-capture vectors do not attack. Hop vectors ignore
 * blockers. Slide vectors stop at the first occupied square.
 *
 * @param source Square holding the piece.
 * @param target Square to test.
 * @param vector Move vector.
 * @param color Moving colour.
 * @returns True when the vector attacks the target.
 */
function vectorAttacksSquare(
  source: number,
  target: number,
  vector: MoveVector,
  color: number,
): boolean {
  if (vector.range === 'step' || vector.capture === 'forbidden') return false;

  const dx = color === colors.WHITE ? vector.dx : -vector.dx;
  const dy = color === colors.WHITE ? vector.dy : -vector.dy;

  if (vector.range === 'hop') {
    return offsetSquare(source, dx, dy) === target;
  }

  let current = source;
  for (;;) {
    current = offsetSquare(current, dx, dy);
    if (current === -1) return false;
    if (current === target) return true;
    if (isOccupied(current)) return false;
  }
}

/**
 * Whether a piece on a square attacks a target square in its current state.
 *
 * @param piece Piece to inspect.
 * @param source Square holding the piece.
 * @param target Square to test.
 * @returns True when the piece attacks the target.
 */
function pieceAttacksSquare(piece: Piece, source: number, target: number): boolean {
  const { vectors } = getPieceState(piece, source);

  for (const vector of vectors) {
    if (vector.firstMoveOnly && !vector.doubleStep && piece.getFirstMove() >= 0) continue;
    if (vectorAttacksSquare(source, target, vector, piece.getColor())) return true;
  }

  return false;
}

/**
 * Whether a square is attacked by a side.
 *
 * Uses the same move vectors and state index as move generation, so custom,
 * mixed and stateful pieces attack the squares they can move to.
 *
 * @param pos Square to test.
 * @param side Side doing the attacking.
 * @returns True when the square is attacked.
 */
export const isSquareAttacked = (pos: number, side: number) => {
  if (pos === -1) return false;

  for (const piece of gameState.pieces) {
    if (piece.getColor() !== side) continue;

    const board = getBitboard(piece.getId());
    let bbLo = board.lo;
    let bbHi = board.hi;

    while (bbLo !== 0 || bbHi !== 0) {
      const source = lsbIndex(bbLo, bbHi);
      if (pieceAttacksSquare(piece, source, pos)) return true;

      if (source < 32) bbLo &= ~(1 << source);
      else bbHi &= ~(1 << (source - 32));
    }
  }

  return false;
};

/**
 * Prints attacked squares for a given player.
 *
 * @param side Side doing the attacking.
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
