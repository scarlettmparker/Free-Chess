import { getBit } from '~/game/board/bitboard';
import { notToRawPos } from '~/game/board/square-helper';
import { colors, gameState, getBitboard, moveType } from '~/game/consts/board';
import { generateMoves } from '~/game/move/legal-move-generator';
import { makeMove } from '~/game/move/move';
import { encodeMove, getMoveCastle, getMoveTarget } from '~/game/move/move-def';
import { loadTestPosition } from '~/utils';
import { checkedForSideToMove, isEncodedMove } from '~server/rules';

const startPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const foolsMate = 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';
const castlingPosition = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';

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
});
