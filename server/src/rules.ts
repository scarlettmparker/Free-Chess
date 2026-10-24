/**
 * @fileoverview Move payload validation and server-side check state.
 * @module server/rules
 */

import { isSquareAttacked } from '~/game/board/attacks.ts';
import { lsbIndex } from '~/game/board/bb.ts';
import { charPieces, colors, gameState, getBitboard } from '~/game/consts/board.ts';

/**
 * Largest value produced by `encodeMove`.
 */
const MAX_ENCODED_MOVE = 0xffffffff;

/**
 * Checks whether a value is an encoded 32-bit move.
 *
 * @param value Candidate payload field.
 * @returns True when the value can be passed to `makeMove`.
 */
export function isEncodedMove(value: unknown): value is number {
  return (
    typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_ENCODED_MOVE
  );
}

/**
 * Recomputes the checked flags for the side to move.
 *
 * `applyMove` flips `gameState.side`, so this runs after an accepted move.
 *
 * @returns Check flags indexed by colour.
 */
export function checkedForSideToMove(): [boolean, boolean] {
  const sideToMove = gameState.side;
  const opponent = sideToMove ^ 1;
  const king = sideToMove === colors.WHITE ? charPieces.K : charPieces.k;
  const bitboard = getBitboard(king);
  const square = lsbIndex(bitboard.lo, bitboard.hi);
  const checked: [boolean, boolean] = [false, false];

  if (square >= 0) {
    checked[sideToMove] = isSquareAttacked(square, opponent);
  }

  return checked;
}
