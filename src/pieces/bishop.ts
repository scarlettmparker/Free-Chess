import { createSignal } from "solid-js";

const [attacks, setAttacks] = createSignal(0n);

/**
 * 
 * @param pos Position on the bitboard.
 * @returns Bishop occupancy bits for magic bitboard.
 */
export const maskBishopAttacks = (pos: number) => {
    let currentAttacks = 0n;

    const targetRank = Math.floor(pos / 8);
    const targetFile = pos % 8;

    // down right
    for (let rank = targetRank + 1, file = targetFile + 1; rank <= 6 && file <= 6; rank++, file++) {
        currentAttacks |= (1n << BigInt(rank * 8 + file));
    }

    // up right
    for (let rank = targetRank - 1, file = targetFile + 1; rank >= 1 && file <= 6; rank--, file++) {
        currentAttacks |= (1n << BigInt(rank * 8 + file));
    }

    // down left
    for (let rank = targetRank + 1, file = targetFile - 1; rank <= 6 && file >= 1; rank++, file--) {
        currentAttacks |= (1n << BigInt(rank * 8 + file));
    }

    // up left
    for (let rank = targetRank - 1, file = targetFile - 1; rank >= 1 && file >= 1; rank--, file--) {
        currentAttacks |= (1n << BigInt(rank * 8 + file));
    }

    setAttacks(currentAttacks);
    return attacks();
}

/**
 * 
 * @param pos Position on the bitboard.
 * @param block Bitboard of any blocking pieces.
 * @returns Bishop occupancy bits for magic bitboard.
 */
export const maskBishopAttacksOTF = (pos: number, block: bigint) => {
    let currentAttacks = 0n;

    const targetRank = Math.floor(pos / 8);
    const targetFile = pos % 8;

    // down right
    for (let rank = targetRank + 1, file = targetFile + 1; rank <= 7 && file <= 7; rank++, file++) {
        currentAttacks |= (1n << BigInt(rank * 8 + file));
        if ((1n << BigInt(rank * 8 + file) & block) !== 0n) break;
    }

    // up right
    for (let rank = targetRank - 1, file = targetFile + 1; rank >= 0 && file <= 7; rank--, file++) {
        if (rank < 0) break;
        currentAttacks |= (1n << BigInt(rank * 8 + file));
        if ((1n << BigInt(rank * 8 + file) & block) !== 0n) break;
    }

    // down left
    for (let rank = targetRank + 1, file = targetFile - 1; rank <= 7 && file >= 0; rank++, file--) {
        currentAttacks |= (1n << BigInt(rank * 8 + file));
        if ((1n << BigInt(rank * 8 + file) & block) !== 0n) break;
    }

    // up left
    for (let rank = targetRank - 1, file = targetFile - 1; rank >= 0 && file >= 0; rank--, file--) {
        if (rank < 0 || file < 0) break;
        currentAttacks |= (1n << BigInt(rank * 8 + file));
        if ((1n << BigInt(rank * 8 + file) & block) !== 0n) break;
    }

    setAttacks(currentAttacks);
    return attacks();
}