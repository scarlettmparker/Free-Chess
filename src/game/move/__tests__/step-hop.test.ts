import { colors, gameState } from '~/game/consts/board';
import { isSquareAttacked } from '~/game/board/attacks';
import { generateMoves } from '~/game/move/legal-move-generator';
import { getMovePiece, getMoveTarget, type MoveList } from '~/game/move/move-def';
import type { PieceDefinition } from '~/game/piece/piece-definition';
import { pieceRegistry } from '~/game/piece/piece-registry';
import { mountGame } from '~/utils';

const sprite = { headKey: 'pawn-head', bodyKey: 'pawn-body', footKey: 'pawn-foot' };

/**
 * Build a test definition with one move state.
 */
function testDef(
  id: number,
  slug: string,
  isKing: boolean,
  vectors: PieceDefinition['moveStates'][number]['vectors'],
): PieceDefinition {
  return {
    id,
    slug,
    name: slug,
    isKing,
    promotionTargets: [],
    promotionRanks: [],
    moveStates: [{ index: 0, vectors }],
    stateTransition: 'none',
    edgeReset: false,
    sprite,
  };
}

const whiteKing = testDef(901, 'test-king', true, [
  { dx: 1, dy: 0, range: 'hop', capture: 'optional' },
]);
const blackKing = testDef(902, 'test-king-b', true, [
  { dx: 1, dy: 0, range: 'hop', capture: 'optional' },
]);

/**
 * Mount kings plus one white test piece and one black blocker.
 */
function mountWith(mover: PieceDefinition, moverSquare: number, blockerSquare: number | null) {
  const placements = [
    { definitionId: 901, color: 0 as const, square: 63 },
    { definitionId: 902, color: 1 as const, square: 56 },
    { definitionId: mover.id, color: 0 as const, square: moverSquare },
  ];
  if (blockerSquare !== null) {
    placements.push({ definitionId: 902, color: 1 as const, square: blockerSquare });
  }
  mountGame({ placements, definitions: [whiteKing, blackKing, mover] });
}

/**
 * Targets of generated moves for one definition.
 */
function moverTargets(definitionId: number) {
  const engineId = pieceRegistry.getEngineId(definitionId, 0);
  const moves = { moves: [], count: 0 } as MoveList;
  generateMoves(moves, gameState.pieces);
  const targets: number[] = [];
  for (let i = 0; i < moves.count; i++) {
    if (getMovePiece(moves.moves[i]) === engineId) targets.push(getMoveTarget(moves.moves[i]));
  }
  return targets;
}

describe('step and hop vectors', () => {
  test('step moves onto empty squares', () => {
    const stepper = testDef(903, 'stepper', false, [
      { dx: 0, dy: 1, range: 'step', capture: 'forbidden' },
    ]);
    mountWith(stepper, 36, null);

    expect(moverTargets(stepper.id)).toContain(28);
  });

  test('step never takes', () => {
    const stepper = testDef(904, 'stepper', false, [
      { dx: 0, dy: 1, range: 'step', capture: 'forbidden' },
    ]);
    mountWith(stepper, 36, 28);

    expect(moverTargets(stepper.id)).not.toContain(28);
  });

  test('hop takes on the target square', () => {
    const hopper = testDef(905, 'hopper', false, [
      { dx: 0, dy: 1, range: 'hop', capture: 'optional' },
    ]);
    mountWith(hopper, 36, 28);

    expect(moverTargets(hopper.id)).toContain(28);
  });

  test('step gives no check but hop does', () => {
    const stepper = testDef(906, 'stepper', false, [
      { dx: 0, dy: 1, range: 'step', capture: 'forbidden' },
    ]);
    mountWith(stepper, 36, null);

    expect(gameState.side).toBe(colors.WHITE);
    expect(isSquareAttacked(28, colors.WHITE)).toBe(false);

    const hopper = testDef(907, 'hopper', false, [
      { dx: 0, dy: 1, range: 'hop', capture: 'optional' },
    ]);
    mountWith(hopper, 36, null);

    expect(isSquareAttacked(28, colors.WHITE)).toBe(true);
  });
});
