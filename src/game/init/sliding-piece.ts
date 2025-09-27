import {
  straightRelevantBits,
  straightBitMask,
  diagonalRelevantBits,
  diagonalBitMask,
} from '~/game/consts/bits';
import { straightMagicNumbers, diagonalMagicNumbers } from '~/game/consts/magic';
import { countBits } from '~/game/board/bitboard';
import { setOccupancyBits } from '~/game/occupancies';

/**
 * Function that initializes piece attacks for sliding pieces.
 */
export const initSlidingPieces = () => {
  const straightPieceMask = new BigUint64Array(64);
  const diagonalPieceMask = new BigUint64Array(64);
  const straightPieceState = Array.from({ length: 64 }, () => new BigUint64Array(4096));
  const diagonalPieceState = Array.from({ length: 64 }, () => new BigUint64Array(512));

  for (let square = 0; square < 64; square++) {
    let relevantBitsCount;
    let occupancyIndicies;

    straightPieceMask[square] = maskStraightAttacks(square);
    relevantBitsCount = countBits(straightPieceMask[square]);

    occupancyIndicies = 1 << relevantBitsCount;
    for (let idx = 0; idx < occupancyIndicies; idx++) {
      const occupancy = setOccupancyBits(idx, relevantBitsCount, straightPieceMask[square]);
      const magicIdx =
        (occupancy * straightMagicNumbers[square]) >> (64n - BigInt(straightRelevantBits[square]));
      const maskedMagicIdx = Number(magicIdx & straightBitMask);
      straightPieceState[square][maskedMagicIdx] = maskStraightAttacksOTF(square, occupancy);
    }

    diagonalPieceMask[square] = maskDiagonalAttacks(square);
    relevantBitsCount = countBits(diagonalPieceMask[square]);

    occupancyIndicies = 1 << relevantBitsCount;
    for (let idx = 0; idx < occupancyIndicies; idx++) {
      const occupancy = setOccupancyBits(idx, relevantBitsCount, diagonalPieceMask[square]);
      const magicIdx =
        (occupancy * diagonalMagicNumbers[square]) >> (64n - BigInt(diagonalRelevantBits[square]));
      const maskedMagicIdx = Number(magicIdx & diagonalBitMask);
      diagonalPieceState[square][maskedMagicIdx] = maskDiagonalAttacksOTF(square, occupancy);
    }
  }

  return { straightPieceMask, diagonalPieceMask, straightPieceState, diagonalPieceState };
};

/**
 * Function to mask a piece's sliding straight attacks.
 *
 * @param pos Position on the bitboard.
 * @returns Piece occupancy bits for magic bitboard.
 */
const maskStraightAttacks = (pos: number) => {
  let currentAttacks = 0n;

  const targetRank = Math.floor(pos / 8);
  const targetFile = pos % 8;

  // up
  for (let rank = targetRank + 1; rank <= 6; rank++) {
    currentAttacks |= 1n << BigInt(rank * 8 + targetFile);
  }

  // down
  for (let rank = targetRank - 1; rank >= 1; rank--) {
    currentAttacks |= 1n << BigInt(rank * 8 + targetFile);
  }

  // left
  for (let file = targetFile - 1; file >= 1; file--) {
    currentAttacks |= 1n << BigInt(targetRank * 8 + file);
  }

  // right
  for (let file = targetFile + 1; file <= 6; file++) {
    currentAttacks |= 1n << BigInt(targetRank * 8 + file);
  }

  return currentAttacks;
};

const maskStraightAttacksOTF = (pos: number, block: bigint) => {
  let currentAttacks = 0n;

  const targetRank = Math.floor(pos / 8);
  const targetFile = pos % 8;

  // up
  for (let rank = targetRank + 1; rank <= 7; rank++) {
    currentAttacks |= 1n << BigInt(rank * 8 + targetFile);
    if (((1n << BigInt(rank * 8 + targetFile)) & block) != 0n) break;
  }

  // down
  for (let rank = targetRank - 1; rank >= 0; rank--) {
    currentAttacks |= 1n << BigInt(rank * 8 + targetFile);
    if (((1n << BigInt(rank * 8 + targetFile)) & block) != 0n) break;
  }

  // left
  for (let file = targetFile - 1; file >= 0; file--) {
    currentAttacks |= 1n << BigInt(targetRank * 8 + file);
    if (((1n << BigInt(targetRank * 8 + file)) & block) != 0n) break;
  }

  // right
  for (let file = targetFile + 1; file <= 7; file++) {
    currentAttacks |= 1n << BigInt(targetRank * 8 + file);
    if (((1n << BigInt(targetRank * 8 + file)) & block) != 0n) break;
  }

  return currentAttacks;
};

/**
 * Function to mask a piece's sliding diagonal attacks.
 *
 * @param pos Position on the bitboard.
 * @returns Piece occupancy bits for magic bitboard.
 */
const maskDiagonalAttacks = (pos: number) => {
  let currentAttacks = 0n;

  const targetRank = Math.floor(pos / 8);
  const targetFile = pos % 8;

  // down right
  for (let rank = targetRank + 1, file = targetFile + 1; rank <= 6 && file <= 6; rank++, file++) {
    currentAttacks |= 1n << BigInt(rank * 8 + file);
  }

  // up right
  for (let rank = targetRank - 1, file = targetFile + 1; rank >= 1 && file <= 6; rank--, file++) {
    currentAttacks |= 1n << BigInt(rank * 8 + file);
  }

  // down left
  for (let rank = targetRank + 1, file = targetFile - 1; rank <= 6 && file >= 1; rank++, file--) {
    currentAttacks |= 1n << BigInt(rank * 8 + file);
  }

  // up left
  for (let rank = targetRank - 1, file = targetFile - 1; rank >= 1 && file >= 1; rank--, file--) {
    currentAttacks |= 1n << BigInt(rank * 8 + file);
  }

  return currentAttacks;
};

const maskDiagonalAttacksOTF = (pos: number, block: bigint) => {
  let currentAttacks = 0n;

  const targetRank = Math.floor(pos / 8);
  const targetFile = pos % 8;

  // down right
  for (let rank = targetRank + 1, file = targetFile + 1; rank <= 7 && file <= 7; rank++, file++) {
    currentAttacks |= 1n << BigInt(rank * 8 + file);
    if (((1n << BigInt(rank * 8 + file)) & block) !== 0n) break;
  }

  // up right
  for (let rank = targetRank - 1, file = targetFile + 1; rank >= 0 && file <= 7; rank--, file++) {
    currentAttacks |= 1n << BigInt(rank * 8 + file);
    if (((1n << BigInt(rank * 8 + file)) & block) !== 0n) break;
  }

  // down left
  for (let rank = targetRank + 1, file = targetFile - 1; rank <= 7 && file >= 0; rank++, file--) {
    currentAttacks |= 1n << BigInt(rank * 8 + file);
    if (((1n << BigInt(rank * 8 + file)) & block) !== 0n) break;
  }

  // up left
  for (let rank = targetRank - 1, file = targetFile - 1; rank >= 0 && file >= 0; rank--, file--) {
    currentAttacks |= 1n << BigInt(rank * 8 + file);
    if (((1n << BigInt(rank * 8 + file)) & block) !== 0n) break;
  }

  return currentAttacks;
};

/**
 * Function to apply constraints to a piece's sliding moves.
 * @param moves Bitboard of piece's possible sliding moves.
 * @param constraints Array of constraints for each direction (e.g. [2, 2, 2, 2]).
 * @param pos Position of the piece on the bitboard.
 * @param isStraight If the piece is a straight slider or diagonal.
 */
export const applyConstraintsToMoves = (
  moves: bigint,
  constraints: number[],
  pos: number,
  isStraight: boolean,
): bigint => {
  let constrainedMoves = 0n;
  if (!constraints) return constrainedMoves;

  if (isStraight) {
    for (let dir = 0; dir < 4; dir++) {
      constrainedMoves |= limitDirectionMoves(moves, constraints[dir], pos, dir, true);
    }
  } else {
    for (let dir = 0; dir < 4; dir++) {
      constrainedMoves |= limitDirectionMoves(moves, constraints[dir], pos, dir, false);
    }
  }

  return constrainedMoves;
};

/**
 * Function to limit the number of moves in a given direction.
 * @param moves Bitboard of piece's possible sliding moves.
 * @param maxSteps Maximum number of steps the piece can slide in a given direction.
 * @param pos Position of the piece on the bitboard.
 * @param dir Direction of the piece's sliding moves.
 * @param isStraight If the piece is a straight slider or diagonal.
 */
const limitDirectionMoves = (
  moves: bigint,
  maxSteps: number,
  pos: number,
  dir: number,
  isStraight: boolean,
): bigint => {
  let limitedMoves = 0n;
  const directionOffset = getDirectionOffset(dir, isStraight);

  for (let step = 1; step <= maxSteps; step++) {
    const targetPos = pos + step * directionOffset;

    if (targetPos >= 0 && targetPos < 64) {
      const bit = 1n << BigInt(targetPos);
      if (moves & bit) limitedMoves |= bit;
      else break;
    }
  }

  return limitedMoves;
};

/**
 * Function to get the direction offset for a given direction.
 * @param dir Direction of the piece's sliding moves.
 * @param isStraight If the piece is a straight slider or diagonal.
 */
const getDirectionOffset = (dir: number, isStraight: boolean): number => {
  const straightOffsets = [-8, 8, -1, 1]; // UP, DOWN, LEFT, RIGHT
  const diagonalOffsets = [9, -7, 7, -9]; // DOWN_RIGHT, UP_RIGHT, DOWN_LEFT, UP_LEFT
  return isStraight ? straightOffsets[dir] : diagonalOffsets[dir];
};
