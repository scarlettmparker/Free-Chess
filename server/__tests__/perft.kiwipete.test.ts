import { gameState } from '~/game/consts/board';
import { perftDriver } from '~/game/perft';
import { loadTestPosition } from '~/utils';

describe('Perft tests for Kiwipete', () => {
  const position2 = 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -';

  beforeEach(() => {
    loadTestPosition(position2);
  });

  test('depth 1', () => {
    perftDriver(1);
    expect(gameState.nodes).toBe(48);
    expect(gameState.moves.captures).toBe(8);
    expect(gameState.moves.enpassants).toBe(0);
    expect(gameState.moves.castles).toBe(2);
    expect(gameState.moves.promotions).toBe(0);
  });

  test('depth 2', () => {
    perftDriver(2);
    expect(gameState.nodes).toBe(2039);
    expect(gameState.moves.captures).toBe(351);
    expect(gameState.moves.enpassants).toBe(1);
    expect(gameState.moves.castles).toBe(91);
    expect(gameState.moves.promotions).toBe(0);
  });

  test('depth 3', () => {
    perftDriver(3);
    expect(gameState.nodes).toBe(97862);
    expect(gameState.moves.captures).toBe(17102);
    expect(gameState.moves.enpassants).toBe(45);
    expect(gameState.moves.castles).toBe(3162);
    expect(gameState.moves.promotions).toBe(0);
  });
});
