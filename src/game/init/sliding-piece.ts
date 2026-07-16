import { getLSFBIndex } from '~/game/board/bitboard';
import { setOccupancyBits } from '~/game/occupancies';

/**
 * Extract the set-bit positions of a bigint mask (used to build PEXT bit lists at init).
 */
const bitsOf = (bb: bigint): number[] => {
  const bits: number[] = [];
  let b = bb;
  while (b > 0n) {
    bits.push(getLSFBIndex(b));
    b &= b - 1n;
  }
  return bits;
};

/**
 * Initialize sliding-piece attack tables indexed by a software PEXT of the relevant
 * occupancy (no magic numbers, no bigint multiply at runtime). Returns lo/hi Uint32Array
 * tables plus the per-square mask bit lists used to compute the PEXT index.
 */
export const initSlidingPieces = () => {
  const straightLo: Uint32Array[] = new Array(64);
  const straightHi: Uint32Array[] = new Array(64);
  const straightBits: number[][] = new Array(64);
  const diagonalLo: Uint32Array[] = new Array(64);
  const diagonalHi: Uint32Array[] = new Array(64);
  const diagonalBits: number[][] = new Array(64);

  for (let square = 0; square < 64; square++) {
    // straight (rook) rays
    const sMask = maskStraightAttacks(square);
    const sBitsList = bitsOf(sMask);
    const sn = sBitsList.length;
    straightBits[square] = sBitsList;
    const slo = new Uint32Array(1 << sn);
    const shi = new Uint32Array(1 << sn);
    for (let idx = 0; idx < 1 << sn; idx++) {
      const occ = setOccupancyBits(idx, sn, sMask);
      const att = maskStraightAttacksOTF(square, occ);
      slo[idx] = Number(att & 0xffffffffn) >>> 0;
      shi[idx] = Number(att >> 32n) >>> 0;
    }
    straightLo[square] = slo;
    straightHi[square] = shi;

    // diagonal (bishop) rays
    const dMask = maskDiagonalAttacks(square);
    const dBitsList = bitsOf(dMask);
    const dn = dBitsList.length;
    diagonalBits[square] = dBitsList;
    const dlo = new Uint32Array(1 << dn);
    const dhi = new Uint32Array(1 << dn);
    for (let idx = 0; idx < 1 << dn; idx++) {
      const occ = setOccupancyBits(idx, dn, dMask);
      const att = maskDiagonalAttacksOTF(square, occ);
      dlo[idx] = Number(att & 0xffffffffn) >>> 0;
      dhi[idx] = Number(att >> 32n) >>> 0;
    }
    diagonalLo[square] = dlo;
    diagonalHi[square] = dhi;
  }

  return { straightLo, straightHi, straightBits, diagonalLo, diagonalHi, diagonalBits };
};

/**
 * Mask of a piece's sliding straight attack squares (excluding edges) for the relevant-occupancy set.
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

/** On-the-fly straight attacks for a given blocker occupancy (includes the blocker square). */
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
 * Mask of a piece's sliding diagonal attack squares (excluding edges) for the relevant-occupancy set.
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

/** On-the-fly diagonal attacks for a given blocker occupancy (includes the blocker square). */
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
