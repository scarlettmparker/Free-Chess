import { createSignal } from "solid-js";
import { BishopState } from "./statetype";
import { bishopMagicNumbers } from "~/consts/magic";
import { bishopBitMask, bishopRelevantBits } from "~/consts/bits";

const [attacks, setAttacks] = createSignal(0n);
export const [bishopMask, setBishopMask] = createSignal(new BigUint64Array(64));
export const [bishopState, setBishopState] = createSignal<BishopState>(Array.from({ length: 64 }, () => new BigUint64Array(512)));

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

/**
 * 
 * @param pos Position on the bitboard.
 * @param occupancy Current occupancy of the board
 * @returns A bitboard representing squares attacked by the bishop.
 */
export const getBishopAttacks = (pos: number, occupancy: bigint) => {
    occupancy &= bishopMask()[pos];
    occupancy = (occupancy * bishopMagicNumbers[pos]) >> (64n - BigInt(bishopRelevantBits[pos]));
    const maskedOccupancy = occupancy & bishopBitMask;

    return bishopState()[pos][Number(maskedOccupancy)];
}

export default null;