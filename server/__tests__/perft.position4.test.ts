import { gameState } from '~/game/consts/board';
import { perftDriver } from '~/game/perft';
import { loadTestPosition } from '~/utils';

describe('Perft tests for position 4', () => {
  const position4 = 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1';

  beforeEach(() => {
    loadTestPosition(position4);
  });

  test('depth 1', () => {
    perftDriver(1);
    expect(gameState.nodes).toBe(6);
    expect(gameState.moves.captures).toBe(0);
    expect(gameState.moves.enpassants).toBe(0);
    expect(gameState.moves.castles).toBe(0);
    expect(gameState.moves.promotions).toBe(0);
  });

  test('depth 2', () => {
    perftDriver(2);
    expect(gameState.nodes).toBe(264);
    expect(gameState.moves.captures).toBe(87);
    expect(gameState.moves.enpassants).toBe(0);
    expect(gameState.moves.castles).toBe(6);
    expect(gameState.moves.promotions).toBe(48);
  });

  test('depth 3', () => {
    perftDriver(3);
    expect(gameState.nodes).toBe(9467);
    expect(gameState.moves.captures).toBe(1021);
    expect(gameState.moves.enpassants).toBe(4);
    expect(gameState.moves.castles).toBe(0);
    expect(gameState.moves.promotions).toBe(120);
  });
});
