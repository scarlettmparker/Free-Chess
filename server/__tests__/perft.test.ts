import { gameState } from '~/game/consts/board';
import { convertFEN, parseFEN } from '~/game/fen';
import { addBishop, addKing, addKnight, addPawn, addQueen, addRook } from '~/game/init/add-piece';
import { initGameState, initGame, resetGameState } from '~/game/init/game';
import { perftDriver } from '~/game/perft';

/**
 * Helper function.
 */
function loadPosition(startPosition: string) {
  resetGameState();
  addPawn();
  addKnight();
  addBishop();
  addRook();
  addQueen();
  addKing();
  initGameState();
  parseFEN(convertFEN(startPosition));
  initGame();
}

// https://www.chessprogramming.org/Perft_Results
describe('Perft tests for start position', () => {
  const startPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  beforeEach(() => {
    loadPosition(startPosition);
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

describe('Perft tests for Kiwipete', () => {
  const position2 = 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -';

  beforeEach(() => {
    loadPosition(position2);
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

describe('Perft tests for position 4', () => {
  const position4 = 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1';

  beforeEach(() => {
    loadPosition(position4);
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

describe('Perft tests for position 5', () => {
  const position5 = 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8';

  beforeEach(() => {
    loadPosition(position5);
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
