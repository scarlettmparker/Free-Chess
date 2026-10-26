import { colors, gameState, getBitboard } from '~/game/consts/board';
import { getBit } from '~/game/board/bitboard';
import { lsbIndex } from '~/game/board/bb';
import { notToRawPos, offsetSquare } from '~/game/board/square-helper';
import { isSquareAttacked } from '~/game/board/attacks';
import { addMove } from './move';
import { encodeMove, MoveList } from './move-def';
import { pieceRegistry } from '~/game/piece/piece-registry';
import type { Piece } from '~/game/piece/piece';
import type { PieceDefinition, MoveVector } from '~/game/piece/piece-definition';
import { getDefinition, getPieceState } from './piece-state';

/**
 * Whether a square holds a piece of the moving side.
 *
 * @param square Square to test.
 * @returns True if occupied by the moving side.
 */
function isOwn(square: number): boolean {
  const side = gameState.side;
  const occLo =
    side === colors.WHITE ? gameState.occLo[colors.WHITE] : gameState.occLo[colors.BLACK];
  const occHi =
    side === colors.WHITE ? gameState.occHi[colors.WHITE] : gameState.occHi[colors.BLACK];
  if (square < 32) return ((occLo >>> square) & 1) === 1;
  return ((occHi >>> (square - 32)) & 1) === 1;
}

/**
 * Whether a square holds an enemy piece.
 *
 * @param square Square to test.
 * @returns True if occupied by the enemy.
 */
function isEnemy(square: number): boolean {
  const side = gameState.side;
  const occLo =
    side === colors.WHITE ? gameState.occLo[colors.BLACK] : gameState.occLo[colors.WHITE];
  const occHi =
    side === colors.WHITE ? gameState.occHi[colors.BLACK] : gameState.occHi[colors.WHITE];
  if (square < 32) return ((occLo >>> square) & 1) === 1;
  return ((occHi >>> (square - 32)) & 1) === 1;
}

/**
 * King square for a king piece.
 *
 * @param piece King piece.
 * @returns Square holding the king.
 */
function kingSquareOf(piece: Piece): number {
  const bb = getBitboard(piece.getId());
  return lsbIndex(bb.lo, bb.hi);
}

/**
 * Whether a friendly sliding piece holds a corner square, which castling
 * needs in place of a slugged rook so custom layouts can castle.
 *
 * @param square Corner square.
 * @param color Moving colour.
 * @returns True when a friendly slider holds the square.
 */
function cornerSlider(square: number, color: number): boolean {
  for (const piece of gameState.pieces) {
    if (piece.getColor() !== color) continue;
    const bb = getBitboard(piece.getId());
    const has =
      square < 32 ? ((bb.lo >>> square) & 1) !== 0 : ((bb.hi >>> (square - 32)) & 1) !== 0;
    if (has) return piece.getSlider();
  }
  return false;
}

/**
 * Generate castling moves for a king piece.
 *
 * @param movesCopy Move list to append to.
 * @param piece King piece.
 */
function generateCastling(movesCopy: MoveList, piece: Piece): void {
  const color = piece.getColor();

  if (color === colors.WHITE && piece.getKing()) {
    if (kingSquareOf(piece) !== notToRawPos['e1']) return;
    if (gameState.castle & 1) {
      if (
        cornerSlider(notToRawPos['h1'], colors.WHITE) &&
        !getBit(gameState.occLo[colors.BOTH], gameState.occHi[colors.BOTH], notToRawPos['f1']) &&
        !getBit(gameState.occLo[colors.BOTH], gameState.occHi[colors.BOTH], notToRawPos['g1'])
      ) {
        if (
          !isSquareAttacked(notToRawPos['e1'], colors.BLACK) &&
          !isSquareAttacked(notToRawPos['f1'], colors.BLACK)
        ) {
          addMove(
            movesCopy,
            encodeMove(notToRawPos['e1'], notToRawPos['g1'], piece.getId(), 0, 0, 0, 0, 1),
          );
        }
      }
    }
    if (gameState.castle & 2) {
      if (
        cornerSlider(notToRawPos['a1'], colors.WHITE) &&
        !getBit(gameState.occLo[colors.BOTH], gameState.occHi[colors.BOTH], notToRawPos['d1']) &&
        !getBit(gameState.occLo[colors.BOTH], gameState.occHi[colors.BOTH], notToRawPos['c1']) &&
        !getBit(gameState.occLo[colors.BOTH], gameState.occHi[colors.BOTH], notToRawPos['b1'])
      ) {
        if (
          !isSquareAttacked(notToRawPos['e1'], colors.BLACK) &&
          !isSquareAttacked(notToRawPos['d1'], colors.BLACK)
        ) {
          addMove(
            movesCopy,
            encodeMove(notToRawPos['e1'], notToRawPos['c1'], piece.getId(), 0, 0, 0, 0, 1),
          );
        }
      }
    }
  }

  if (color === colors.BLACK && piece.getKing()) {
    if (kingSquareOf(piece) !== notToRawPos['e8']) return;
    if (gameState.castle & 4) {
      if (
        cornerSlider(notToRawPos['h8'], colors.BLACK) &&
        !getBit(gameState.occLo[colors.BOTH], gameState.occHi[colors.BOTH], notToRawPos['f8']) &&
        !getBit(gameState.occLo[colors.BOTH], gameState.occHi[colors.BOTH], notToRawPos['g8'])
      ) {
        if (
          !isSquareAttacked(notToRawPos['e8'], colors.WHITE) &&
          !isSquareAttacked(notToRawPos['f8'], colors.WHITE)
        ) {
          addMove(
            movesCopy,
            encodeMove(notToRawPos['e8'], notToRawPos['g8'], piece.getId(), 0, 0, 0, 0, 1),
          );
        }
      }
    }
    if (gameState.castle & 8) {
      if (
        cornerSlider(notToRawPos['a8'], colors.BLACK) &&
        !getBit(gameState.occLo[colors.BOTH], gameState.occHi[colors.BOTH], notToRawPos['d8']) &&
        !getBit(gameState.occLo[colors.BOTH], gameState.occHi[colors.BOTH], notToRawPos['c8']) &&
        !getBit(gameState.occLo[colors.BOTH], gameState.occHi[colors.BOTH], notToRawPos['b8'])
      ) {
        if (
          !isSquareAttacked(notToRawPos['e8'], colors.WHITE) &&
          !isSquareAttacked(notToRawPos['d8'], colors.WHITE)
        ) {
          addMove(
            movesCopy,
            encodeMove(notToRawPos['e8'], notToRawPos['c8'], piece.getId(), 0, 0, 0, 0, 1),
          );
        }
      }
    }
  }
}

/**
 * Add a single vector's moves for one source square.
 *
 * @param movesCopy Move list to append to.
 * @param piece Moving piece.
 * @param def Piece definition.
 * @param source Source square.
 * @param v Move vector.
 * @param color Piece colour.
 */
function addVectorMoves(
  movesCopy: MoveList,
  piece: Piece,
  def: PieceDefinition,
  source: number,
  v: MoveVector,
  color: number,
): void {
  const tdx = color === colors.WHITE ? v.dx : -v.dx;
  const promotedTargets = def.promotionTargets
    .map((defId) => pieceRegistry.getEngineId(defId, color))
    .filter((id): id is number => id !== undefined);
  const tdy = color === colors.WHITE ? v.dy : -v.dy;

  // En passant capture.
  if (v.enPassant && gameState.enpassant !== -1) {
    const target = gameState.enpassant;
    const expected = offsetSquare(source, tdx, tdy);
    if (target === expected) {
      addMove(movesCopy, encodeMove(source, target, piece.getId(), 0, 1, 0, 1, 0));
    }
  }

  // Double step.
  if (v.doubleStep) {
    const sourceRank = source >> 3;
    const startingRank = color === colors.WHITE ? 6 : 1;
    if (sourceRank !== startingRank) return;
    const step1 = offsetSquare(source, tdx, tdy / 2);
    const step2 = offsetSquare(source, tdx, tdy);
    if (
      step1 !== -1 &&
      step2 !== -1 &&
      !isOwn(step1) &&
      !isEnemy(step1) &&
      !isOwn(step2) &&
      !isEnemy(step2)
    ) {
      addMove(movesCopy, encodeMove(source, step2, piece.getId(), 0, 0, 1, 0, 0));
    }
    return;
  }

  // Promotion ranks.
  let promotionRanks = def.promotionRanks;
  if (promotionRanks.length === 0) {
    promotionRanks = color === colors.WHITE ? [0] : [7];
  }
  const isPromotionTarget = (square: number) => promotionRanks.includes(square >> 3);

  if (v.range === 'slide') {
    let cur = source;
    for (;;) {
      cur = offsetSquare(cur, tdx, tdy);
      if (cur === -1) break;
      if (isOwn(cur)) break;
      const enemy = isEnemy(cur);
      if (enemy) {
        if (v.capture !== 'forbidden') {
          if (v.promotes && isPromotionTarget(cur) && promotedTargets.length) {
            for (const promoted of promotedTargets) {
              addMove(movesCopy, encodeMove(source, cur, piece.getId(), promoted, 1, 0, 0, 0));
            }
          } else {
            addMove(movesCopy, encodeMove(source, cur, piece.getId(), 0, 1, 0, 0, 0));
          }
        }
        break;
      }
      // empty square
      if (v.capture !== 'required') {
        if (v.promotes && isPromotionTarget(cur) && promotedTargets.length) {
          for (const promoted of promotedTargets) {
            addMove(movesCopy, encodeMove(source, cur, piece.getId(), promoted, 0, 0, 0, 0));
          }
        } else {
          addMove(movesCopy, encodeMove(source, cur, piece.getId(), 0, 0, 0, 0, 0));
        }
      }
    }
    return;
  }

  if (v.range === 'hop') {
    const target = offsetSquare(source, tdx, tdy);
    if (target === -1) return;
    if (isOwn(target)) return;
    const enemy = isEnemy(target);
    if (enemy && v.capture === 'forbidden') return;
    if (!enemy && v.capture === 'required') return;
    if (v.promotes && isPromotionTarget(target) && promotedTargets.length) {
      for (const promoted of promotedTargets) {
        addMove(
          movesCopy,
          encodeMove(source, target, piece.getId(), promoted, enemy ? 1 : 0, 0, 0, 0),
        );
      }
    } else {
      addMove(movesCopy, encodeMove(source, target, piece.getId(), 0, enemy ? 1 : 0, 0, 0, 0));
    }
    return;
  }

  // step
  const target = offsetSquare(source, tdx, tdy);
  if (target === -1) return;
  if (isOwn(target) || isEnemy(target)) return;

  if (v.promotes && isPromotionTarget(target) && promotedTargets.length) {
    for (const promoted of promotedTargets) {
      addMove(movesCopy, encodeMove(source, target, piece.getId(), promoted, 0, 0, 0, 0));
    }
  } else {
    addMove(movesCopy, encodeMove(source, target, piece.getId(), 0, 0, 0, 0, 0));
  }
}

/**
 * Generates moves for all pieces of the current side.
 *
 * @param moves Move list to append to.
 * @param pieces Pieces to generate for.
 */
export const generateMoves = (moves: MoveList, pieces: Piece[]) => {
  const l = pieces.length;
  for (let i = 0; i < l; i++) {
    const piece = pieces[i];
    if (piece.getColor() !== gameState.side) continue;
    generateMove(moves, piece);
  }
};

/**
 * Generates moves for a specific piece.
 *
 * @param movesCopy Move list to append to.
 * @param piece Piece to generate for.
 */
export const generateMove = (movesCopy: MoveList, piece: Piece) => {
  const def = getDefinition(piece);
  const color = piece.getColor();

  // Castling for kings.
  if (def.isKing) {
    generateCastling(movesCopy, piece);
  }

  const pieceBB = getBitboard(piece.getId());
  let bbLo = pieceBB.lo;
  let bbHi = pieceBB.hi;

  while (bbLo !== 0 || bbHi !== 0) {
    const source = lsbIndex(bbLo, bbHi);
    const { vectors } = getPieceState(piece, source, def);

    for (const v of vectors) {
      if (v.firstMoveOnly && !v.doubleStep && piece.getFirstMove() >= 0) continue;
      addVectorMoves(movesCopy, piece, def, source, v, color);
    }

    if (source < 32) bbLo &= ~(1 << source);
    else bbHi &= ~(1 << (source - 32));
  }
};
