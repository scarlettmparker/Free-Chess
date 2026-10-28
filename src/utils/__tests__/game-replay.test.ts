import { describe, expect, it } from 'vitest';
import { colors, gameState } from '~/game/consts/board';
import { notToRawPos } from '~/game/board/square-helper';
import { generateMoves } from '~/game/move/legal-move-generator';
import { getMoveSource, getMoveTarget } from '~/game/move/move-def';
import { serializeGameState } from '~/utils/game-serialize';
import { replayGameMoves, restoreGameSnapshot } from '~/utils/game-replay';
import { mountGame } from '~/utils';

/**
 * Finds the first legal move between two named squares.
 *
 * @param from Source square name.
 * @param to Target square name.
 * @returns Encoded move.
 */
function findMove(from: string, to: string): number {
  const moves = { moves: [] as number[], count: 0 };
  generateMoves(moves, gameState.pieces);
  const move = moves.moves
    .slice(0, moves.count)
    .find(
      (candidate) =>
        getMoveSource(candidate) === notToRawPos[from] &&
        getMoveTarget(candidate) === notToRawPos[to],
    );
  expect(move).toBeDefined();
  return move as number;
}

describe('game replay', () => {
  it('replays only the requested number of moves', () => {
    mountGame();
    const initial = serializeGameState(gameState);
    const e4 = findMove('e2', 'e4');
    replayGameMoves(initial, [e4], 1);
    const e5 = findMove('e7', 'e5');
    replayGameMoves(initial, [e4, e5], 2);

    replayGameMoves(initial, [e4, e5], 1);
    expect(gameState.moveHistory).toEqual([e4]);
    expect(gameState.side).toBe(colors.BLACK);

    replayGameMoves(initial, [e4, e5], 2);
    expect(gameState.moveHistory).toEqual([e4, e5]);
    expect(gameState.side).toBe(colors.WHITE);
  });

  it('clamps indexes beyond the move list', () => {
    mountGame();
    const initial = serializeGameState(gameState);
    const e4 = findMove('e2', 'e4');

    const applied = replayGameMoves(initial, [e4], 99);

    expect(applied).toBe(1);
    expect(gameState.moveHistory).toEqual([e4]);
  });

  it('restores a stored position', () => {
    mountGame();
    const initial = serializeGameState(gameState);
    const e4 = findMove('e2', 'e4');
    replayGameMoves(initial, [e4], 1);
    const afterMove = serializeGameState(gameState);

    restoreGameSnapshot(initial);
    expect(gameState.moveHistory).toEqual([]);
    expect(gameState.side).toBe(colors.WHITE);

    restoreGameSnapshot(afterMove);
    expect(gameState.moveHistory).toEqual([e4]);
    expect(gameState.side).toBe(colors.BLACK);
  });
});
