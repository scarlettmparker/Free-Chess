import { LeaperMoveBehavior, Piece, SlidingMoveBehavior } from './piece';
import { BUILTIN_DEFINITIONS } from './builtins';
import type { PieceDefinition } from './piece-definition';

/**
 * Creates pieces from built-in definitions.
 */
export class PieceFactory {
  /**
   * Create a piece from a built-in type slug.
   *
   * @param type Piece type slug.
   * @param id Engine piece id.
   * @param color Piece colour.
   * @returns The created piece.
   */
  static createPiece(type: string, id: number, color: number): Piece {
    const builtin = BUILTIN_DEFINITIONS.find(
      (definition) => definition.slug === type.toLowerCase(),
    );
    if (!builtin || !builtin.legacy) {
      throw new Error(`Unknown piece type: ${type}`);
    }

    const piece = new Piece(
      id,
      color,
      builtin.legacy.moveBehavior,
      builtin.legacy.rotationalMoveType,
      builtin.id,
      builtin.slug,
    );

    piece.setKing(builtin.isKing);
    piece.setSprite(builtin.sprite);
    piece.setPawn(builtin.legacy.isPawn);
    piece.setLeaper(builtin.legacy.isLeaper);
    piece.setSlider(builtin.legacy.isSlider);
    piece.setEnpassant(builtin.legacy.enpassant);
    piece.setPromote(builtin.legacy.promote);

    return piece;
  }

  /**
   * Create a piece from a definition.
   *
   * @param definition Piece definition.
   * @param id Engine piece id.
   * @param color Piece colour.
   * @returns The created piece.
   */
  static createPieceFromDefinition(
    definition: (typeof BUILTIN_DEFINITIONS)[number],
    id: number,
    color: number,
  ): Piece {
    return this.createPiece(definition.slug, id, color);
  }

  /**
   * Create a piece from a data driven definition without legacy behaviour.
   * Slide vectors become sliding flags with steps subsumed, while step and
   * hop vectors become per state leaper offsets in definition order.
   *
   * @param definition Piece definition.
   * @param id Engine piece id.
   * @param color Piece colour.
   * @returns The created piece.
   */
  static createGenericPiece(definition: PieceDefinition, id: number, color: number): Piece {
    let straight = false;
    let diagonal = false;
    let pawn = false;
    let promote = false;
    let slider = false;
    let leaper = false;
    const states = [...definition.moveStates].sort((a, b) => a.index - b.index);
    const offsetsPerState: number[][][] = [];
    for (const state of states) {
      const offsets: number[][] = [];
      for (const vector of state.vectors ?? []) {
        if (vector.doubleStep || vector.enPassant) pawn = true;
        if (vector.promotes) promote = true;
        if (vector.range === 'slide') {
          slider = true;
          if (vector.dx === 0 || vector.dy === 0) straight = true;
          else if (Math.abs(vector.dx) === Math.abs(vector.dy)) diagonal = true;
        } else if (vector.range !== 'step') {
          leaper = true;
          offsets.push([vector.dx, vector.dy]);
        }
      }
      offsetsPerState.push(offsets);
    }
    if (offsetsPerState.length === 0) offsetsPerState.push([]);

    const behavior =
      straight || diagonal
        ? new SlidingMoveBehavior(straight, diagonal)
        : new LeaperMoveBehavior(offsetsPerState);

    const piece = new Piece(id, color, behavior, 'DEFAULT', definition.id, definition.slug);
    piece.setKing(definition.isKing);
    piece.setSprite(definition.sprite);
    piece.setPawn(pawn);
    piece.setLeaper(leaper);
    piece.setSlider(slider);
    piece.setEnpassant(pawn);
    piece.setPromote(promote);
    return piece;
  }
}
