import { getBit } from '~/game/board/bitboard';
import { notToRawPos } from '~/game/board/square-helper';
import { colors, gameState, getBitboard, moveType } from '~/game/consts/board';
import { generateMoves } from '~/game/move/legal-move-generator';
import { makeMove } from '~/game/move/move';
import { pieceRegistry } from '~/game/piece/piece-registry';
import { BUILTIN_DEFINITIONS } from '~/game/piece/builtins';
import type { PieceDefinition } from '~/game/piece/piece-definition';
import { encodeMove, getMoveCastle, getMoveSource, getMoveTarget } from '~/game/move/move-def';
import { loadTestPosition, mountGame } from '~/utils';
import {
  checkedForSideToMove,
  evaluateGameStatus,
  hasLegalMoves,
  isEncodedMove,
  resetGameStatus,
  updateGameStatus,
  validateServerMove,
} from '~server/rules';

const startPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const foolsMate = 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';
const castlingPosition = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
const stalematePosition = '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1';
const onlyKingsPosition = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';

/**
 * Finds a generated move between two squares.
 *
 * @param from Source square name.
 * @param to Target square name.
 * @returns Encoded move, or undefined.
 */
function findMove(from: string, to: string): number | undefined {
  const moves = { moves: [] as number[], count: 0 };
  generateMoves(moves, gameState.pieces);
  return moves.moves
    .slice(0, moves.count)
    .find(
      (move) =>
        getMoveSource(move) === notToRawPos[from] && getMoveTarget(move) === notToRawPos[to],
    );
}

/**
 * Validates, applies and records one move.
 *
 * @param from Source square name.
 * @param to Target square name.
 */
function play(from: string, to: string): void {
  const move = findMove(from, to);
  expect(move).toBeDefined();
  expect(validateServerMove(move!)).toBe(true);
  expect(makeMove(move!, moveType.ALL_MOVES, 0)).toBe(1);
  gameState.moveHistory.push(move!);
  updateGameStatus(move!);
}

describe('isEncodedMove', () => {
  test('accepts 32-bit unsigned integers', () => {
    expect(isEncodedMove(0)).toBe(true);
    expect(isEncodedMove(0xffffffff)).toBe(true);
    expect(isEncodedMove(123456)).toBe(true);
  });

  test('rejects values that are not encoded moves', () => {
    expect(isEncodedMove(-1)).toBe(false);
    expect(isEncodedMove(1.5)).toBe(false);
    expect(isEncodedMove(2 ** 32)).toBe(false);
    expect(isEncodedMove(Number.NaN)).toBe(false);
    expect(isEncodedMove(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isEncodedMove('123456')).toBe(false);
    expect(isEncodedMove(null)).toBe(false);
    expect(isEncodedMove(undefined)).toBe(false);
    expect(isEncodedMove({})).toBe(false);
  });

  test('accepts castling moves produced by encodeMove', () => {
    const move = encodeMove(notToRawPos['e1'], notToRawPos['g1'], 10, 0, 0, 0, 0, 1);

    expect(move).toBeGreaterThan(0);
    expect(isEncodedMove(move)).toBe(true);
  });
});

describe('castling', () => {
  test('the server accepts a kingside castling move', () => {
    loadTestPosition(castlingPosition);
    const moves = { moves: [] as number[], count: 0 };
    generateMoves(moves, gameState.pieces);
    const castle = moves.moves
      .slice(0, moves.count)
      .find((move) => getMoveCastle(move) && getMoveTarget(move) === notToRawPos['g1']);

    expect(castle).toBeDefined();
    expect(isEncodedMove(castle)).toBe(true);
    expect(makeMove(castle!, moveType.ALL_MOVES, 0)).toBe(1);

    const king = getBitboard(gameState.kingPieceId[colors.WHITE]);
    expect(getBit(king.lo, king.hi, notToRawPos['g1'])).toBe(1);
  });
});

describe('validateServerMove', () => {
  test('accepts a move generated for the side to move', () => {
    loadTestPosition(startPosition);
    resetGameStatus();
    const move = findMove('e2', 'e4');

    expect(move).toBeDefined();
    expect(validateServerMove(move!)).toBe(true);
  });

  test('rejects moves that the engine did not generate', () => {
    loadTestPosition(startPosition);
    resetGameStatus();
    const fabricated = encodeMove(
      notToRawPos['e2'],
      notToRawPos['e5'],
      0,
      0,
      0,
      0,
      0,
      0,
    );

    expect(validateServerMove(fabricated)).toBe(false);
  });

  test('rejects moves made with the opponent pieces', () => {
    loadTestPosition(startPosition);
    resetGameStatus();
    const wrongSide = encodeMove(
      notToRawPos['e7'],
      notToRawPos['e5'],
      1,
      0,
      0,
      0,
      0,
      0,
    );

    expect(validateServerMove(wrongSide)).toBe(false);
  });

  test('rejects capturing a king', () => {
    loadTestPosition('4k3/8/8/8/8/8/4R3/4K3 w - - 0 1');
    resetGameStatus();
    const kingCapture = encodeMove(
      notToRawPos['e2'],
      notToRawPos['e8'],
      6,
      0,
      1,
      0,
      0,
      0,
    );

    expect(validateServerMove(kingCapture)).toBe(false);
  });

  test('rejects a move replayed from an earlier position', () => {
    loadTestPosition(startPosition);
    resetGameStatus();
    const move = findMove('e2', 'e4');
    expect(validateServerMove(move!)).toBe(true);
    makeMove(move!, moveType.ALL_MOVES, 0);
    gameState.moveHistory.push(move!);
    updateGameStatus(move!);

    expect(validateServerMove(move!)).toBe(false);
  });

  test('accepts castling', () => {
    loadTestPosition(castlingPosition);
    resetGameStatus();
    const castle = findMove('e1', 'g1');

    expect(castle).toBeDefined();
    expect(validateServerMove(castle!)).toBe(true);
  });
});

describe('game result', () => {
  test('detects checkmate', () => {
    loadTestPosition(startPosition);
    resetGameStatus();
    play('f2', 'f3');
    play('e7', 'e5');
    play('g2', 'g4');
    play('d8', 'h4');

    expect(gameState.gameOver).toBe(true);
    expect(gameState.result).toBe('black-checkmate');
    expect(hasLegalMoves()).toBe(false);
  });

  test('detects stalemate', () => {
    loadTestPosition(stalematePosition);
    resetGameStatus();
    evaluateGameStatus();

    expect(checkedForSideToMove()).toEqual([false, false]);
    expect(hasLegalMoves()).toBe(false);
    expect(gameState.gameOver).toBe(true);
    expect(gameState.result).toBe('stalemate');
  });

  test('detects insufficient material', () => {
    loadTestPosition(onlyKingsPosition);
    resetGameStatus();
    evaluateGameStatus();

    expect(gameState.gameOver).toBe(true);
    expect(gameState.result).toBe('draw');
  });

  test('detects threefold repetition', () => {
    loadTestPosition(startPosition);
    resetGameStatus();
    play('g1', 'f3');
    play('g8', 'f6');
    play('f3', 'g1');
    play('f6', 'g8');
    play('g1', 'f3');
    play('g8', 'f6');
    play('f3', 'g1');
    play('f6', 'g8');

    expect(gameState.gameOver).toBe(true);
    expect(gameState.result).toBe('draw');
  });
});

describe('custom piece state transitions', () => {
  test('advance moves to the next state after a move', () => {
    const kingDefinition = BUILTIN_DEFINITIONS.find(
      (definition) => definition.slug === 'king',
    ) as PieceDefinition;
    const advancer: PieceDefinition = {
      id: 100,
      slug: 'advancer',
      name: 'Advancer',
      isKing: false,
      promotionTargets: [],
      promotionRanks: [],
      moveStates: [
        {
          index: 0,
          vectors: [{ dx: 0, dy: 1, range: 'step', capture: 'optional' }],
        },
        {
          index: 1,
          vectors: [{ dx: 0, dy: -1, range: 'step', capture: 'optional' }],
        },
      ],
      stateTransition: 'advance',
      edgeReset: false,
      sprite: { headKey: 'pawn-head', bodyKey: 'pawn-body', footKey: 'pawn-foot' },
    };

    mountGame({
      placements: [
        { definitionId: 1, color: 0, square: notToRawPos['e1'] },
        { definitionId: 1, color: 1, square: notToRawPos['e8'] },
        { definitionId: 100, color: 0, square: notToRawPos['e4'] },
      ],
      definitions: [kingDefinition, advancer],
    });
    resetGameStatus();

    const piece = gameState.pieces.find((candidate) => candidate.getDefinitionId() === 100);
    const move = findMove('e4', 'e5');

    expect(piece).toBeDefined();
    expect(move).toBeDefined();
    expect(validateServerMove(move!)).toBe(true);
    expect(makeMove(move!, moveType.ALL_MOVES, 0)).toBe(1);
    expect(gameState.whiteMoves.get(Number(`${notToRawPos['e5']}${piece!.getId()}`))).toBe(1);
  });

  test('cycle wraps back to the first state', () => {
    const kingDefinition = BUILTIN_DEFINITIONS.find(
      (definition) => definition.slug === 'king',
    ) as PieceDefinition;
    const cycler: PieceDefinition = {
      id: 102,
      slug: 'cycler',
      name: 'Cycler',
      isKing: false,
      promotionTargets: [],
      promotionRanks: [],
      moveStates: [
        {
          index: 0,
          vectors: [{ dx: 0, dy: 1, range: 'step', capture: 'optional' }],
        },
        {
          index: 1,
          vectors: [{ dx: 0, dy: -1, range: 'step', capture: 'optional' }],
        },
      ],
      stateTransition: 'cycle',
      edgeReset: false,
      sprite: { headKey: 'pawn-head', bodyKey: 'pawn-body', footKey: 'pawn-foot' },
    };

    mountGame({
      placements: [
        { definitionId: 1, color: 0, square: notToRawPos['e1'] },
        { definitionId: 1, color: 1, square: notToRawPos['e8'] },
        { definitionId: 102, color: 0, square: notToRawPos['e4'] },
      ],
      definitions: [kingDefinition, cycler],
    });
    resetGameStatus();

    const piece = gameState.pieces.find((candidate) => candidate.getDefinitionId() === 102);
    play('e4', 'e5');
    play('e8', 'd8');
    play('e5', 'e4');

    expect(gameState.whiteMoves.get(Number(`${notToRawPos['e4']}${piece!.getId()}`))).toBe(0);
  });

  test('first-move-only vectors are unavailable after the piece moves', () => {
    const kingDefinition = BUILTIN_DEFINITIONS.find(
      (definition) => definition.slug === 'king',
    ) as PieceDefinition;
    const jumper: PieceDefinition = {
      id: 103,
      slug: 'jumper',
      name: 'Jumper',
      isKing: false,
      promotionTargets: [],
      promotionRanks: [],
      moveStates: [
        {
          index: 0,
          vectors: [
            { dx: 0, dy: 2, range: 'hop', capture: 'optional', firstMoveOnly: true },
            { dx: 0, dy: 1, range: 'step', capture: 'optional' },
          ],
        },
      ],
      stateTransition: 'none',
      edgeReset: false,
      sprite: { headKey: 'pawn-head', bodyKey: 'pawn-body', footKey: 'pawn-foot' },
    };

    mountGame({
      placements: [
        { definitionId: 1, color: 0, square: notToRawPos['e1'] },
        { definitionId: 1, color: 1, square: notToRawPos['e8'] },
        { definitionId: 103, color: 0, square: notToRawPos['e4'] },
      ],
      definitions: [kingDefinition, jumper],
    });
    resetGameStatus();

    expect(findMove('e4', 'e6')).toBeDefined();
    play('e4', 'e5');
    gameState.side = colors.WHITE;

    expect(findMove('e5', 'e7')).toBeUndefined();
    expect(findMove('e5', 'e6')).toBeDefined();
  });
});

describe('checkedForSideToMove', () => {
  test('the starting position is not in check', () => {
    loadTestPosition(startPosition);

    expect(gameState.side).toBe(colors.WHITE);
    expect(checkedForSideToMove()).toEqual([false, false]);
  });

  test('flags the side to move in check', () => {
    loadTestPosition(foolsMate);

    expect(gameState.side).toBe(colors.WHITE);
    expect(checkedForSideToMove()).toEqual([true, false]);
  });

  test('flags check when the king is a custom piece', () => {
    loadTestPosition(foolsMate);
    const king = gameState.pieces.find(
      (piece) => piece.getColor() === colors.WHITE && piece.getKing(),
    );
    const base = pieceRegistry.getDefinition(king!.getDefinitionId())!;
    const custom = { ...base, id: 101, slug: 'test-king' };

    pieceRegistry.register(custom);
    king!.setDefinitionId(101);

    expect(checkedForSideToMove()).toEqual([true, false]);
  });
});
