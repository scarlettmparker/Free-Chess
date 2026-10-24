import { colors, gameState } from '~/game/consts/board';
import { loadTestPosition } from '~/utils';
import { checkedForSideToMove, isEncodedMove } from '~server/rules';

const startPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const foolsMate = 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';

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
