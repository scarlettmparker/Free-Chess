import { gameState, moveType } from '~/game/consts/board';
import { makeMove } from '~/game/move/move';
import { deserializeGameState, type SerializedGameState } from '~/utils/game-serialize';

/**
 * Replaces the global engine state with a stored snapshot.
 *
 * @param snapshot Position to restore.
 */
export function restoreGameSnapshot(snapshot: SerializedGameState) {
  gameState.pieces = [];
  Object.assign(gameState, deserializeGameState(snapshot));
}

/**
 * Restores the starting position and replays moves up to an index.
 *
 * @param initial Starting position.
 * @param moves Encoded moves in ply order.
 * @param index Number of moves to apply.
 * @returns Number of moves applied.
 */
export function replayGameMoves(
  initial: SerializedGameState,
  moves: number[],
  index: number,
): number {
  restoreGameSnapshot(initial);
  gameState.moveHistory = [];
  const limit = Math.max(0, Math.min(index, moves.length));

  for (let step = 0; step < limit; step += 1) {
    const move = moves[step];
    if (makeMove(move, moveType.ALL_MOVES, 0) !== 1) {
      return step;
    }
    gameState.moveHistory.push(move);
  }

  return limit;
}
