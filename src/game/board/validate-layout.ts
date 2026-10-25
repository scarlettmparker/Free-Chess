import type { MoveVector, PieceDefinition } from '~/game/piece/piece-definition';

/**
 * Piece definition id accepted by layout validation.
 */
type LayoutId = string | number;

/**
 * Placement of one piece on the board.
 */
export interface BoardPlacement<Id = number> {
  /**
   * Piece definition id.
   */
  definitionId: Id;
  /**
   * Piece colour, 0 = white, 1 = black.
   */
  color: 0 | 1;
  /**
   * Square index, 0 = a8 through 63 = h1.
   */
  square: number;
}

/**
 * Definition fields used by layout validation.
 */
export type LayoutDefinition<Id = number> = Pick<PieceDefinition, 'isKing' | 'moveStates'> & {
  /**
   * Piece definition id.
   */
  id: Id;
};

/**
 * Machine-readable layout rejection reasons.
 */
export type LayoutValidationError =
  | 'unknown-piece'
  | 'off-board'
  | 'overlapping-pieces'
  | 'missing-white-king'
  | 'missing-black-king'
  | 'extra-white-king'
  | 'extra-black-king'
  | 'kings-adjacent'
  | 'white-in-check'
  | 'black-in-check'
  | 'no-legal-moves'
  | 'bare-kings';

/**
 * Result of validating a board layout.
 */
export interface LayoutValidationResult {
  /**
   * True when the layout is a legal starting position.
   */
  ok: boolean;
  /**
   * Rejection reasons, empty when valid.
   */
  errors: LayoutValidationError[];
}

const WHITE = 0;
const BLACK = 1;

/**
 * Convert a source square plus a white-oriented offset into a target square.
 *
 * @param source Source square.
 * @param dx Horizontal offset, white-oriented.
 * @param dy Vertical offset, white-oriented (positive = up the board).
 * @param color Moving colour (black mirrors the offset).
 * @returns Target square, or -1 when off the board.
 */
function offsetSquare(source: number, dx: number, dy: number, color: 0 | 1): number {
  const tdx = color === WHITE ? dx : -dx;
  const tdy = color === WHITE ? dy : -dy;
  const rankTop = source >> 3;
  const file = source & 7;
  const nrt = rankTop - tdy;
  const nf = file + tdx;
  if (nf < 0 || nf > 7 || nrt < 0 || nrt > 7) return -1;
  return nrt * 8 + nf;
}

/**
 * Squares a piece attacks from a square, given an occupancy map.
 * Only capture-capable vectors attack. Castling vectors never attack and
 * double pushes never capture, while en passant vectors still attack
 * diagonally because no en passant square exists at a starting position.
 *
 * @param vectors Move vectors in the piece's starting state.
 * @param source Square the piece attacks from.
 * @param color Attacking colour.
 * @param occupied Occupancy by square.
 * @returns Attacked squares.
 */
function attackedSquares(
  vectors: MoveVector[],
  source: number,
  color: 0 | 1,
  occupied: Map<number, BoardPlacement<LayoutId>>,
): number[] {
  const targets: number[] = [];
  for (const v of vectors) {
    if (v.capture === 'forbidden') continue;
    if (v.castling || v.doubleStep) continue;
    if (v.range === 'slide') {
      let cur = source;
      for (;;) {
        cur = offsetSquare(cur, v.dx, v.dy, color);
        if (cur === -1) break;
        targets.push(cur);
        if (occupied.has(cur)) break;
      }
      continue;
    }
    const target = offsetSquare(source, v.dx, v.dy, color);
    if (target !== -1) targets.push(target);
  }
  return targets;
}

/**
 * Whether a square is attacked by a colour.
 *
 * @param square Square to test.
 * @param byColor Attacking colour.
 * @param placements All pieces on the board.
 * @param byDef Definitions by id.
 * @param occupied Occupancy by square.
 * @returns True when any piece of the colour attacks the square.
 */
function isAttacked(
  square: number,
  byColor: 0 | 1,
  placements: BoardPlacement<LayoutId>[],
  byDef: Map<LayoutId, LayoutDefinition<LayoutId>>,
  occupied: Map<number, BoardPlacement<LayoutId>>,
): boolean {
  for (const p of placements) {
    if (p.color !== byColor) continue;
    const def = byDef.get(p.definitionId);
    if (!def) continue;
    const vectors = def.moveStates[0]?.vectors ?? [];
    if (attackedSquares(vectors, p.square, p.color, occupied).includes(square)) return true;
  }
  return false;
}

/**
 * Pseudo-legal target squares for one piece, honouring occupancy and capture
 * policy. Starting-rank double steps need both squares empty and
 * first-move-only vectors are available at game start, while castling is
 * excluded and en passant targets are treated as normal captures because no
 * en passant square exists at a starting position.
 *
 * @param p Placement of the moving piece.
 * @param def Definition of the moving piece.
 * @param occupied Occupancy by square.
 * @returns Reachable target squares before king-safety filtering.
 */
function pseudoMoves(
  p: BoardPlacement<LayoutId>,
  def: LayoutDefinition<LayoutId>,
  occupied: Map<number, BoardPlacement<LayoutId>>,
): number[] {
  const vectors = def.moveStates[0]?.vectors ?? [];
  const targets: number[] = [];
  const sourceRank = p.square >> 3;
  const startingRank = p.color === WHITE ? 6 : 1;
  for (const v of vectors) {
    if (v.castling) continue;
    if (v.doubleStep && sourceRank !== startingRank) continue;
    if (v.doubleStep) {
      if (!Number.isInteger(v.dy / 2)) continue;
      const mid = offsetSquare(p.square, v.dx, v.dy / 2, p.color);
      if (mid === -1 || occupied.has(mid)) continue;
    }
    if (v.range === 'slide') {
      let cur = p.square;
      for (;;) {
        cur = offsetSquare(cur, v.dx, v.dy, p.color);
        if (cur === -1) break;
        const blocker = occupied.get(cur);
        if (!blocker) {
          if (v.capture !== 'required') targets.push(cur);
          continue;
        }
        if (blocker.color !== p.color && v.capture !== 'forbidden') targets.push(cur);
        break;
      }
      continue;
    }
    const target = offsetSquare(p.square, v.dx, v.dy, p.color);
    if (target === -1) continue;
    const occupant = occupied.get(target);
    if (!occupant) {
      if (v.capture !== 'required') targets.push(target);
    } else if (occupant.color !== p.color && v.capture !== 'forbidden') {
      targets.push(target);
    }
  }
  return targets;
}

/**
 * Validate a board layout as a legal starting position. Pure function safe to
 * run on client and server: no engine globals are touched.
 *
 * @param placements Piece placements to validate.
 * @param definitions Piece definitions the placements refer to.
 * @returns Validation result with rejection reasons.
 */
export function validateBoardLayout(
  placements: BoardPlacement<LayoutId>[],
  definitions: LayoutDefinition<LayoutId>[],
): LayoutValidationResult {
  const errors: LayoutValidationError[] = [];
  const byDef = new Map(definitions.map((def) => [def.id, def]));
  const occupied = new Map<number, BoardPlacement<LayoutId>>();

  for (const p of placements) {
    if (!byDef.has(p.definitionId)) errors.push('unknown-piece');
    if (!Number.isInteger(p.square) || p.square < 0 || p.square > 63) errors.push('off-board');
    if (occupied.has(p.square)) errors.push('overlapping-pieces');
    else occupied.set(p.square, p);
  }
  if (errors.length > 0) return { ok: false, errors: [...new Set(errors)] };

  const kings = placements.filter((p) => byDef.get(p.definitionId)?.isKing);
  const whiteKings = kings.filter((p) => p.color === WHITE);
  const blackKings = kings.filter((p) => p.color === BLACK);
  if (whiteKings.length === 0) errors.push('missing-white-king');
  if (blackKings.length === 0) errors.push('missing-black-king');
  if (whiteKings.length > 1) errors.push('extra-white-king');
  if (blackKings.length > 1) errors.push('extra-black-king');
  if (errors.length > 0) return { ok: false, errors };

  const [whiteKing] = whiteKings;
  const [blackKing] = blackKings;
  const wkFile = whiteKing.square & 7;
  const wkRank = whiteKing.square >> 3;
  const bkFile = blackKing.square & 7;
  const bkRank = blackKing.square >> 3;
  if (Math.abs(wkFile - bkFile) <= 1 && Math.abs(wkRank - bkRank) <= 1) {
    errors.push('kings-adjacent');
  }
  if (isAttacked(whiteKing.square, BLACK, placements, byDef, occupied)) {
    errors.push('white-in-check');
  }
  if (isAttacked(blackKing.square, WHITE, placements, byDef, occupied)) {
    errors.push('black-in-check');
  }

  for (const color of [WHITE, BLACK] as const) {
    const hasNonKing = placements.some(
      (p) => p.color === color && !byDef.get(p.definitionId)?.isKing,
    );
    if (!hasNonKing) {
      errors.push('bare-kings');
      break;
    }
  }

  if (!errors.includes('white-in-check')) {
    let hasLegal = false;
    for (const p of placements) {
      if (p.color !== WHITE) continue;
      const def = byDef.get(p.definitionId);
      if (!def) continue;
      for (const target of pseudoMoves(p, def, occupied)) {
        const next = new Map(occupied);
        next.delete(p.square);
        next.set(target, { ...p, square: target });
        const nextPlacements = placements
          .filter((q) => q.square !== target)
          .map((q) => (q === p ? { ...p, square: target } : q));
        const kingSquare = def.isKing ? target : whiteKing.square;
        if (!isAttacked(kingSquare, BLACK, nextPlacements, byDef, next)) {
          hasLegal = true;
          break;
        }
      }
      if (hasLegal) break;
    }
    if (!hasLegal) errors.push('no-legal-moves');
  }

  return { ok: errors.length === 0, errors };
}
