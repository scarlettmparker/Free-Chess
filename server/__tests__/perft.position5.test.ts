import { gameState } from '~/game/consts/board';
import { perftDriver } from '~/game/perft';
import { loadTestPosition } from '~/utils';

describe('Perft tests for position 5', () => {
  const position5 = 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8';

  beforeEach(() => {
    loadTestPosition(position5);
  });

  test('depth 1', () => {
    perftDriver(1);
    expect(gameState.nodes).toBe(44);
  });

  test('depth 2', () => {
    perftDriver(2);
    expect(gameState.nodes).toBe(1486);
  });

  test('depth 3', () => {
    perftDriver(3);
    expect(gameState.nodes).toBe(62379);
  });
});
