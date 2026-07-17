import { setOccupancyBits } from '~/game/occupancies';

type LoHi = { lo: number; hi: number };

/** Set bit `sq` in a {lo, hi} bitboard (mutates via return). */
const set = (acc: LoHi, sq: number) => {
  if (sq < 32) acc.lo |= 1 << sq;
  else acc.hi |= 1 << (sq - 32);
};

/** Test bit `sq` in a {lo, hi} bitboard. */
const test = (bb: LoHi, sq: number) =>
  sq < 32 ? (bb.lo >>> sq) & 1 : (bb.hi >>> (sq - 32)) & 1;

/** Set-bit positions of a {lo, hi} bitboard, in increasing square order. */
const bitsOf = (bb: LoHi): number[] => {
  const bits: number[] = [];
  let lo = bb.lo;
  let hi = bb.hi;
  while (lo !== 0) {
    const sq = Math.clz32(lo & -lo) ^ 31;
    bits.push(sq);
    lo &= lo - 1;
  }
  while (hi !== 0) {
    const sq = 32 + (Math.clz32(hi & -hi) ^ 31);
    bits.push(sq);
    hi &= hi - 1;
  }
  return bits;
};

/**
 * Initialize sliding-piece attack tables indexed by a software PEXT of the relevant
 * occupancy (no magic numbers, no bigint). Returns lo/hi Uint32Array tables plus the
 * per-square mask bit lists used to compute the PEXT index.
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
    straightBits[square] = sBitsList;
    const sn = sBitsList.length;
    const slo = new Uint32Array(1 << sn);
    const shi = new Uint32Array(1 << sn);
    for (let idx = 0; idx < 1 << sn; idx++) {
      const occ = setOccupancyBits(idx, sBitsList);
      const att = maskStraightAttacksOTF(square, occ);
      slo[idx] = att.lo;
      shi[idx] = att.hi;
    }
    straightLo[square] = slo;
    straightHi[square] = shi;

    // diagonal (bishop) rays
    const dMask = maskDiagonalAttacks(square);
    const dBitsList = bitsOf(dMask);
    diagonalBits[square] = dBitsList;
    const dn = dBitsList.length;
    const dlo = new Uint32Array(1 << dn);
    const dhi = new Uint32Array(1 << dn);
    for (let idx = 0; idx < 1 << dn; idx++) {
      const occ = setOccupancyBits(idx, dBitsList);
      const att = maskDiagonalAttacksOTF(square, occ);
      dlo[idx] = att.lo;
      dhi[idx] = att.hi;
    }
    diagonalLo[square] = dlo;
    diagonalHi[square] = dhi;
  }

  return { straightLo, straightHi, straightBits, diagonalLo, diagonalHi, diagonalBits };
};

/** Relevant occupancy mask for straight rays (excludes the board edges). */
const maskStraightAttacks = (pos: number): LoHi => {
  const acc: LoHi = { lo: 0, hi: 0 };
  const targetRank = pos >> 3;
  const targetFile = pos & 7;

  for (let rank = targetRank + 1; rank <= 6; rank++) set(acc, rank * 8 + targetFile);
  for (let rank = targetRank - 1; rank >= 1; rank--) set(acc, rank * 8 + targetFile);
  for (let file = targetFile + 1; file <= 6; file++) set(acc, targetRank * 8 + file);
  for (let file = targetFile - 1; file >= 1; file--) set(acc, targetRank * 8 + file);

  return acc;
};

/** On-the-fly straight attacks for a given blocker occupancy (includes the blocker square). */
const maskStraightAttacksOTF = (pos: number, occ: LoHi): LoHi => {
  const acc: LoHi = { lo: 0, hi: 0 };
  const targetRank = pos >> 3;
  const targetFile = pos & 7;

  for (let rank = targetRank + 1; rank <= 7; rank++) {
    const sq = rank * 8 + targetFile;
    set(acc, sq);
    if (test(occ, sq)) break;
  }
  for (let rank = targetRank - 1; rank >= 0; rank--) {
    const sq = rank * 8 + targetFile;
    set(acc, sq);
    if (test(occ, sq)) break;
  }
  for (let file = targetFile + 1; file <= 7; file++) {
    const sq = targetRank * 8 + file;
    set(acc, sq);
    if (test(occ, sq)) break;
  }
  for (let file = targetFile - 1; file >= 0; file--) {
    const sq = targetRank * 8 + file;
    set(acc, sq);
    if (test(occ, sq)) break;
  }

  return acc;
};

/** Relevant occupancy mask for diagonal rays (excludes the board edges). */
const maskDiagonalAttacks = (pos: number): LoHi => {
  const acc: LoHi = { lo: 0, hi: 0 };
  const targetRank = pos >> 3;
  const targetFile = pos & 7;

  for (let rank = targetRank + 1, file = targetFile + 1; rank <= 6 && file <= 6; rank++, file++)
    set(acc, rank * 8 + file);
  for (let rank = targetRank - 1, file = targetFile + 1; rank >= 1 && file <= 6; rank--, file++)
    set(acc, rank * 8 + file);
  for (let rank = targetRank + 1, file = targetFile - 1; rank <= 6 && file >= 1; rank++, file--)
    set(acc, rank * 8 + file);
  for (let rank = targetRank - 1, file = targetFile - 1; rank >= 1 && file >= 1; rank--, file--)
    set(acc, rank * 8 + file);

  return acc;
};

/** On-the-fly diagonal attacks for a given blocker occupancy (includes the blocker square). */
const maskDiagonalAttacksOTF = (pos: number, occ: LoHi): LoHi => {
  const acc: LoHi = { lo: 0, hi: 0 };
  const targetRank = pos >> 3;
  const targetFile = pos & 7;

  for (let rank = targetRank + 1, file = targetFile + 1; rank <= 7 && file <= 7; rank++, file++) {
    const sq = rank * 8 + file;
    set(acc, sq);
    if (test(occ, sq)) break;
  }
  for (let rank = targetRank - 1, file = targetFile + 1; rank >= 0 && file <= 7; rank--, file++) {
    const sq = rank * 8 + file;
    set(acc, sq);
    if (test(occ, sq)) break;
  }
  for (let rank = targetRank + 1, file = targetFile - 1; rank <= 7 && file >= 0; rank++, file--) {
    const sq = rank * 8 + file;
    set(acc, sq);
    if (test(occ, sq)) break;
  }
  for (let rank = targetRank - 1, file = targetFile - 1; rank >= 0 && file >= 0; rank--, file--) {
    const sq = rank * 8 + file;
    set(acc, sq);
    if (test(occ, sq)) break;
  }

  return acc;
};
