import { gameState } from '~/game/consts/board';
import { notToRawPos } from '~/game/board/square-helper';
import { applyMove, undoMove } from '~/game/move/move';
import { encodeMove } from '~/game/move/move-def';
import { getPieceState } from '~/game/move/piece-state';
import { BUILTIN_DEFINITIONS } from '~/game/piece/builtins';
import { pieceRegistry } from '~/game/piece/piece-registry';
import type { PieceDefinition } from '~/game/piece/piece-definition';
import { mountGame } from '~/utils';

const king = BUILTIN_DEFINITIONS.find(
  (definition) => definition.slug === 'king',
) as PieceDefinition;

/**
 * Build a stateful piece whose stored state indices are out of order.
 *
 * @returns A piece definition with states 2, 0, 1.
 */
function unorderedPiece(): PieceDefinition {
  return {
    id: 9101,
    slug: 'unordered-piece',
    name: 'Unordered Piece',
    isKing: false,
    promotionTargets: [],
    promotionRanks: [],
    moveStates: [
      {
        index: 2,
        vectors: [{ dx: 0, dy: 2, range: 'hop', capture: 'optional' }],
      },
      {
        index: 0,
        vectors: [{ dx: 0, dy: 1, range: 'hop', capture: 'optional' }],
      },
      {
        index: 1,
        vectors: [{ dx: 1, dy: 1, range: 'hop', capture: 'optional' }],
      },
    ],
    stateTransition: 'advance',
    edgeReset: false,
    sprite: { headKey: 'pawn-head', bodyKey: 'pawn-body', footKey: 'pawn-foot' },
  };
}

/**
 * Build a two-state piece that never advances.
 *
 * @returns A piece definition with a disabled transition.
 */
function fixedPiece(): PieceDefinition {
  return {
    id: 9102,
    slug: 'fixed-piece',
    name: 'Fixed Piece',
    isKing: false,
    promotionTargets: [],
    promotionRanks: [],
    moveStates: [
      {
        index: 0,
        vectors: [{ dx: 0, dy: 1, range: 'hop', capture: 'optional' }],
      },
      {
        index: 1,
        vectors: [{ dx: 0, dy: 2, range: 'hop', capture: 'optional' }],
      },
    ],
    stateTransition: 'none',
    edgeReset: false,
    sprite: { headKey: 'pawn-head', bodyKey: 'pawn-body', footKey: 'pawn-foot' },
  };
}

/**
 * Mount a board with one custom piece.
 *
 * @param definition Definition to mount.
 * @param square Square for the custom piece.
 */
function mountPiece(definition: PieceDefinition, square: number): void {
  mountGame({
    placements: [
      { definitionId: 1, color: 0, square: notToRawPos['a1'] },
      { definitionId: 1, color: 1, square: notToRawPos['h8'] },
      { definitionId: definition.id, color: 0, square },
    ],
    definitions: [king, definition],
  });
}

describe('piece state resolution', () => {
  test('sorts out-of-order move states on registration', () => {
    mountPiece(unorderedPiece(), notToRawPos['d4']);
    const stored = pieceRegistry.getDefinition(9101)!;

    expect(stored.moveStates.map((state) => state.index)).toEqual([0, 1, 2]);
    expect(stored.moveStates[0].vectors[0].dy).toBe(1);
    expect(stored.moveStates[1].vectors[0].dx).toBe(1);
    expect(stored.moveStates[2].vectors[0].dy).toBe(2);
  });

  test('uses the stored state index for the current square', () => {
    mountPiece(unorderedPiece(), notToRawPos['d4']);
    const piece = gameState.pieces.find((candidate) => candidate.getDefinitionId() === 9101)!;
    const square = notToRawPos['d4'];
    const key = Number(`${square}${piece.getId()}`);

    expect(getPieceState(piece, square).index).toBe(0);
    gameState.whiteMoves.set(key, 1);
    expect(getPieceState(piece, square).vectors[0].dx).toBe(1);
    gameState.whiteMoves.set(key, 2);
    expect(getPieceState(piece, square).vectors[0].dy).toBe(2);
    gameState.whiteMoves.set(key, 5);
    expect(getPieceState(piece, square).index).toBe(2);
  });

  test('keeps state zero when the transition is none', () => {
    mountPiece(fixedPiece(), notToRawPos['d4']);
    const piece = gameState.pieces.find((candidate) => candidate.getDefinitionId() === 9102)!;
    const square = notToRawPos['d4'];
    gameState.whiteMoves.set(Number(`${square}${piece.getId()}`), 1);

    const state = getPieceState(piece, square);

    expect(state.index).toBe(0);
    expect(state.vectors[0].dy).toBe(1);
  });

  test('restores the previous state when a move is undone', () => {
    mountPiece(unorderedPiece(), notToRawPos['e4']);
    const piece = gameState.pieces.find((candidate) => candidate.getDefinitionId() === 9101)!;
    const source = notToRawPos['e4'];
    const target = notToRawPos['e5'];
    const move = encodeMove(source, target, piece.getId(), 0, 0, 0, 0, 0);

    const undo = applyMove(move);
    expect(getPieceState(piece, target).index).toBe(1);

    undoMove(move, undo);
    expect(getPieceState(piece, source).index).toBe(0);
    expect(gameState.whiteMoves.has(Number(`${target}${piece.getId()}`))).toBe(false);
  });
});
