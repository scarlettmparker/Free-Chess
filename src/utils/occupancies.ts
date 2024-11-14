import { getLSFBIndex, updateBitboard } from "./board/bitboard";

/**
 * 
 * @param idx Bitmask indicating squares to be marked.
 * @param bitsInMask Number of bits to be considered.
 * @param attackMask Bitmask of attacks for a piece.
 * @returns Bitmask representing the occupancy of the squares.
 */
export const setOccupancyBits = (idx: number, bitsInMask: number, attackMask: bigint) => {
    let occupancy = 0n;
    let currentAttackMask = attackMask;

    for (let count = 0; count < bitsInMask; count++) {
        const square = getLSFBIndex(currentAttackMask);
        if (square === -1) break;

        currentAttackMask &= currentAttackMask - 1n;

        if (idx & (1 << count)) {
            occupancy |= (1n << BigInt(square));
        }
    }

    return occupancy;
}