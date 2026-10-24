import { Piece } from './piece';
import { BUILTIN_DEFINITIONS } from './builtins';

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
}
