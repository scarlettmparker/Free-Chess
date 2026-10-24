import { gameState } from '~/game/consts/board';
import { mountGame } from '~/utils';
import { deserializeGameState, serializeGameState } from '~/utils/game-serialize';

describe('game state serialization', () => {
  beforeEach(() => {
    mountGame();
  });

  test('round-trips the starting position', () => {
    const first = serializeGameState(gameState);
    const restored = deserializeGameState(first);
    const second = serializeGameState(restored);

    expect(second).toEqual(first);
    expect(second.side).toBe(first.side);
    expect(second.pieces.map((piece) => piece.id)).toEqual(first.pieces.map((piece) => piece.id));
  });

  test('survives a JSON transport round-trip', () => {
    const first = serializeGameState(gameState);
    const restored = deserializeGameState(JSON.parse(JSON.stringify(first)));

    expect(serializeGameState(restored)).toEqual(first);
  });
});
