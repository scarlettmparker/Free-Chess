import { colors, gameState, getBitboard, moveType } from '~/game/consts/board';
import { isSquareAttacked } from '~/game/board/attacks';
import { lsbIndex } from '~/game/board/bb';
import { notToRawPos, rawPosToNot } from '~/game/board/square-helper';
import { generateMoves } from '~/game/move/legal-move-generator';
import { applyMove, isLegalMove, makeMove, undoMove } from '~/game/move/move';
import { getMoveSource, getMoveTarget } from '~/game/move/move-def';
import { BUILTIN_DEFINITIONS } from '~/game/piece/builtins';
import type { PieceDefinition } from '~/game/piece/piece-definition';
import { mountGame } from '~/utils';
import { checkedForSideToMove, resetGameStatus } from '~server/rules';
import { statefulLeaper } from './fixtures/stateful-pieces';

const king = BUILTIN_DEFINITIONS.find(
  (definition) => definition.slug === 'king',
) as PieceDefinition;

/**
 * Mount a board where the black leaper starts on d4 and covers b1 after it
 * advances to state 1.
 *
 * @param kingSquare Square for the white king.
 */
function mountScenario(kingSquare = 'b1'): void {
  mountGame({
    placements: [
      { definitionId: 1, color: 0, square: notToRawPos[kingSquare] },
      { definitionId: 1, color: 1, square: notToRawPos['h8'] },
      { definitionId: 9001, color: 1, square: notToRawPos['d4'] },
    ],
    definitions: [king, statefulLeaper()],
  });
  resetGameStatus();
}

/**
 * Find a generated move between two squares, optionally for a chosen side.
 *
 * @param from Source square name.
 * @param to Target square name.
 * @param side Side to generate for, defaulting to the side to move.
 * @returns Encoded move, or undefined.
 */
function findMove(from: string, to: string, side?: number): number | undefined {
  const previousSide = gameState.side;
  if (side !== undefined) gameState.side = side;
  const moves = { moves: [] as number[], count: 0 };
  generateMoves(moves, gameState.pieces);
  gameState.side = previousSide;
  return moves.moves
    .slice(0, moves.count)
    .find(
      (move) =>
        getMoveSource(move) === notToRawPos[from] && getMoveTarget(move) === notToRawPos[to],
    );
}

/**
 * Play the leaper move that advances its state.
 *
 * @returns The leaper piece id.
 */
function advanceLeaper(): number {
  gameState.side = colors.BLACK;
  const move = findMove('d4', 'd3');
  expect(move).toBeDefined();
  expect(makeMove(move!, moveType.ALL_MOVES, 0)).toBe(1);
  return gameState.pieces
    .find((piece) => piece.getDefinitionId() === 9001 && piece.getColor() === colors.BLACK)!
    .getId();
}

describe('stateful piece attacks', () => {
  beforeEach(() => mountScenario());

  test('advances the piece state after it moves', () => {
    const pieceId = advanceLeaper();
    const board = getBitboard(pieceId);
    const square = lsbIndex(board.lo, board.hi);

    expect(rawPosToNot[square]).toBe('d3');
    expect(gameState.blackMoves.get(Number(`${square}${pieceId}`))).toBe(1);
  });

  test('generates the capture that the advanced state unlocks', () => {
    const pieceId = advanceLeaper();
    const move = findMove('d3', 'b1', colors.BLACK);

    expect(move).toBeDefined();
    expect(gameState.pieces.find((piece) => piece.getId() === pieceId)).toBeDefined();
  });

  test('flags check from the advanced state', () => {
    advanceLeaper();

    expect(isSquareAttacked(notToRawPos['b1'], colors.BLACK)).toBe(true);
    expect(checkedForSideToMove()).toEqual([true, false]);
  });

  test('rejects a king move into the advanced attack', () => {
    mountScenario('a1');
    advanceLeaper();

    expect(isSquareAttacked(notToRawPos['b1'], colors.BLACK)).toBe(true);
    expect(checkedForSideToMove()).toEqual([false, false]);

    const kingMove = findMove('a1', 'b1');
    expect(kingMove).toBeDefined();
    expect(isLegalMove(kingMove!)).toBe(false);
  });

  test('restores the previous attack set when the move is undone', () => {
    gameState.side = colors.BLACK;
    const move = findMove('d4', 'd3');
    expect(move).toBeDefined();

    const undo = applyMove(move!);
    expect(isSquareAttacked(notToRawPos['b1'], colors.BLACK)).toBe(true);

    undoMove(move!, undo);
    expect(isSquareAttacked(notToRawPos['b1'], colors.BLACK)).toBe(false);
  });
});
