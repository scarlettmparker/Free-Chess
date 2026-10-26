import { colors, gameState } from '~/game/consts/board';
import { BUILTIN_DEFINITIONS } from '~/game/piece/builtins';
import { pieceRegistry } from '~/game/piece/piece-registry';
import type { Piece } from '~/game/piece/piece';
import type { MoveVector, PieceDefinition, PieceMoveState } from '~/game/piece/piece-definition';

/**
 * The resolved state of one piece on one square.
 */
export type PieceState = {
  /**
   * Definition for the piece.
   */
  definition: PieceDefinition;
  /**
   * Zero-based state index used for this square.
   */
  index: number;
  /**
   * State entry, when the definition has one.
   */
  state: PieceMoveState | undefined;
  /**
   * Vectors available in this state.
   */
  vectors: MoveVector[];
};

/**
 * Look up a piece definition, falling back to the built-in slug.
 *
 * @param piece Piece to inspect.
 * @returns The matching definition.
 */
export function getDefinition(piece: Piece): PieceDefinition {
  const definition = pieceRegistry.getDefinition(piece.getDefinitionId());
  if (definition) return definition;
  const fallback = BUILTIN_DEFINITIONS.find((candidate) => candidate.slug === piece.getType());
  if (fallback) return fallback;
  throw new Error(`Unknown piece definition: ${piece.getType()}`);
}

/**
 * Resolve the state index for a piece on a square.
 *
 * @param piece Piece to inspect.
 * @param square Square the piece occupies.
 * @param definition Definition for the piece.
 * @returns Zero-based state index.
 */
export function getStateIndex(
  piece: Piece,
  square: number,
  definition: PieceDefinition = getDefinition(piece),
): number {
  if (definition.stateTransition === 'none' || definition.moveStates.length === 0) return 0;
  const moves = piece.getColor() === colors.WHITE ? gameState.whiteMoves : gameState.blackMoves;
  return (moves.get(Number(`${square}${piece.getId()}`)) || 0) % definition.moveStates.length;
}

/**
 * Resolve the definition, state index and vectors used by a piece on a square.
 *
 * @param piece Piece to inspect.
 * @param square Square the piece occupies.
 * @param definition Definition for the piece.
 * @returns The resolved piece state.
 */
export function getPieceState(
  piece: Piece,
  square: number,
  definition: PieceDefinition = getDefinition(piece),
): PieceState {
  const index = getStateIndex(piece, square, definition);
  const state = definition.moveStates[index] ?? definition.moveStates[0];
  return {
    definition,
    index,
    state,
    vectors: state?.vectors ?? [],
  };
}
