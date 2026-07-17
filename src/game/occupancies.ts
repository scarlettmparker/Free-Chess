/**
 * Reconstruct an occupancy subset from a PEXT index: for each set bit `k` of `idx`,
 * set the bit at position `bits[k]`. Returns a {lo, hi} bitboard.
 *
 * @param idx PEXT index (enumerator over the relevant occupancy bits).
 * @param bits Set-bit positions of the relevant occupancy mask (from bitsOf).
 */
export const setOccupancyBits = (idx: number, bits: number[]): { lo: number; hi: number } => {
  let lo = 0;
  let hi = 0;
  for (let k = 0; k < bits.length; k++) {
    if (idx & (1 << k)) {
      const sq = bits[k];
      if (sq < 32) lo |= 1 << sq;
      else hi |= 1 << (sq - 32);
    }
  }
  return { lo, hi };
};
