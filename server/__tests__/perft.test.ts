import { gameState } from '~/game/consts/board';
import { perftDriver } from '~/game/perft';
import { loadTestPosition } from '~/utils';

// https://www.chessprogramming.org/Perft_Results
describe('Perft tests for start position', () => {
  const startPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  beforeEach(() => {
    loadTestPosition(startPosition);
  });

  test('depth 0', () => {
    perftDriver(0);
    expect(gameState.nodes).toBe(1);
    expect(gameState.moves.captures).toBe(0);
    expect(gameState.moves.enpassants).toBe(0);
    expect(gameState.moves.castles).toBe(0);
    expect(gameState.moves.promotions).toBe(0);
  });

  test('depth 1', () => {
    perftDriver(1);
    expect(gameState.nodes).toBe(20);
    expect(gameState.moves.captures).toBe(0);
    expect(gameState.moves.enpassants).toBe(0);
    expect(gameState.moves.castles).toBe(0);
    expect(gameState.moves.promotions).toBe(0);
  });

  test('depth 2', () => {
    perftDriver(2);
    expect(gameState.nodes).toBe(400);
    expect(gameState.moves.captures).toBe(0);
    expect(gameState.moves.enpassants).toBe(0);
    expect(gameState.moves.castles).toBe(0);
    expect(gameState.moves.promotions).toBe(0);
  });

  test('depth 3', () => {
    perftDriver(3);
    expect(gameState.nodes).toBe(8902);
    expect(gameState.moves.captures).toBe(34);
    expect(gameState.moves.enpassants).toBe(0);
    expect(gameState.moves.castles).toBe(0);
    expect(gameState.moves.promotions).toBe(0);
  });

  test('depth 4', () => {
    perftDriver(4);
    console.log(gameState.moves);
    expect(gameState.nodes).toBe(197281);
    expect(gameState.moves.captures).toBe(1576);
    expect(gameState.moves.enpassants).toBe(0);
    expect(gameState.moves.castles).toBe(0);
    expect(gameState.moves.promotions).toBe(0);
  });
});
