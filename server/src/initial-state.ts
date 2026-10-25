/**
 * @fileoverview Snapshot of the position the current game started from.
 * @module server/initial-state
 */

import { gameState } from '~/game/consts/board.ts';
import { serializeGameState, type SerializedGameState } from '~/utils/game-serialize.ts';

let initial: SerializedGameState = serializeGameState(gameState);

/**
 * Records the current game state as the starting position for the next reset.
 */
export function captureInitialState() {
  initial = serializeGameState(gameState);
}

/**
 * Starting position clients replay the move history from.
 *
 * @returns Serialized starting state.
 */
export function getInitialState() {
  return initial;
}
