/**
 * Lo/hi 32-bit bitboard primitives.
 *
 * Bitboards are stored as two 32-bit Number halves (lo = bits 0..31, hi = bits 32..63).
 * All move-generation, make/unmake and attack logic operates on these halves in pure
 * Number arithmetic (Math.clz32 bit-scan, Int32 AND/OR/XOR) — no bigint in any hot path.
 */

/** 16-bit popcount lookup. */
export const POP16 = new Uint8Array(65536);
for (let i = 1; i < 65536; i++) POP16[i] = POP16[i & (i - 1)] + 1;

/** Popcount of a 32-bit unsigned word. */
export function popcount32(n: number): number {
  return POP16[n & 0xffff] + POP16[(n >>> 16) & 0xffff];
}

/** Popcount of a (lo, hi) bitboard. */
export function popcount(lo: number, hi: number): number {
  return popcount32(lo) + popcount32(hi);
}

/** Index of the least significant set bit of a (lo, hi) bitboard, or -1 if zero. */
export function lsbIndex(lo: number, hi: number): number {
  if (lo !== 0) return Math.clz32(lo & -lo) ^ 31;
  if (hi !== 0) return 32 + (Math.clz32(hi & -hi) ^ 31);
  return -1;
}
