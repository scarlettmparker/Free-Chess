import { colors, gameState, getBitboard } from '~/game/consts/board';
import { isSquareAttacked } from '~/game/board/attacks';
import { lsbIndex } from '~/game/board/bb';
import { notToRawPos, rawPosToNot } from '~/game/board/square-helper';
import { generateMoves } from '~/game/move/legal-move-generator';
import { getMovePiece, getMoveTarget } from '~/game/move/move-def';
import { BUILTIN_DEFINITIONS } from '~/game/piece/builtins';
import type { PieceDefinition } from '~/game/piece/piece-definition';
import { mountGame } from '~/utils';
import { resetGameStatus } from '~server/rules';
import { mixedHopper, statefulMixedHopper } from './fixtures/stateful-pieces';

const king = BUILTIN_DEFINITIONS.find(
  (definition) => definition.slug === 'king',
) as PieceDefinition;
const pogo = BUILTIN_DEFINITIONS.find(
  (definition) => definition.slug === 'pogo',
) as PieceDefinition;

/**
 * Collect the generated targets for one piece.
 *
 * @param pieceId Engine piece id.
 * @param side Side to generate for.
 * @returns Target square names.
 */
function moveTargets(pieceId: number, side: number): string[] {
  gameState.side = side;
  const moves = { moves: [] as number[], count: 0 };
  generateMoves(moves, gameState.pieces);
  const targets: string[] = [];
  for (let index = 0; index < moves.count; index += 1) {
    if (getMovePiece(moves.moves[index]) === pieceId) {
      targets.push(rawPosToNot[getMoveTarget(moves.moves[index])]);
    }
  }
  return targets;
}

describe('definition-based attacked squares', () => {
  test('covers both hop and slide vectors', () => {
    mountGame({
      placements: [
        { definitionId: 1, color: 0, square: notToRawPos['a1'] },
        { definitionId: 1, color: 1, square: notToRawPos['h8'] },
        { definitionId: 9002, color: 1, square: notToRawPos['d4'] },
      ],
      definitions: [king, mixedHopper()],
    });
    resetGameStatus();

    const piece = gameState.pieces.find(
      (candidate) => candidate.getDefinitionId() === 9002 && candidate.getColor() === colors.BLACK,
    )!;
    const targets = moveTargets(piece.getId(), colors.BLACK);

    expect(targets).toEqual(expect.arrayContaining(['d2', 'b2', 'a1']));
    for (const target of targets) {
      expect(isSquareAttacked(notToRawPos[target], colors.BLACK)).toBe(true);
    }
    expect(isSquareAttacked(notToRawPos['a1'], colors.BLACK)).toBe(true);
    expect(isSquareAttacked(notToRawPos['e2'], colors.BLACK)).toBe(false);
  });

  test('covers a stateful piece with mixed vectors after it advances', () => {
    mountGame({
      placements: [
        { definitionId: 1, color: 0, square: notToRawPos['a1'] },
        { definitionId: 1, color: 1, square: notToRawPos['h8'] },
        { definitionId: 9003, color: 1, square: notToRawPos['d4'] },
      ],
      definitions: [king, statefulMixedHopper()],
    });
    resetGameStatus();

    const piece = gameState.pieces.find(
      (candidate) => candidate.getDefinitionId() === 9003 && candidate.getColor() === colors.BLACK,
    )!;
    const board = getBitboard(piece.getId());
    const square = lsbIndex(board.lo, board.hi);
    const key = Number(`${square}${piece.getId()}`);

    expect(isSquareAttacked(notToRawPos['b1'], colors.BLACK)).toBe(false);
    gameState.blackMoves.set(key, 1);

    const targets = moveTargets(piece.getId(), colors.BLACK);

    expect(targets).toEqual(expect.arrayContaining(['b2', 'a1']));
    for (const target of targets) {
      expect(isSquareAttacked(notToRawPos[target], colors.BLACK)).toBe(true);
    }
  });

  test.each([0, 1, 2, 3])('matches every pogo move in state %i', (state) => {
    mountGame({
      placements: [
        { definitionId: 1, color: 0, square: notToRawPos['a1'] },
        { definitionId: 1, color: 1, square: notToRawPos['h8'] },
        { definitionId: 8, color: 1, square: notToRawPos['d4'] },
      ],
      definitions: [king, pogo],
    });
    resetGameStatus();

    const piece = gameState.pieces.find(
      (candidate) => candidate.getDefinitionId() === 8 && candidate.getColor() === colors.BLACK,
    )!;
    const board = getBitboard(piece.getId());
    const square = lsbIndex(board.lo, board.hi);
    gameState.blackMoves.set(Number(`${square}${piece.getId()}`), state);

    const targets = moveTargets(piece.getId(), colors.BLACK);

    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) {
      expect(isSquareAttacked(notToRawPos[target], colors.BLACK)).toBe(true);
    }
  });
});
