import { createSignal } from "solid-js";
import { RookState } from "./statetype";
import { rookMagicNumbers } from "~/consts/magic";
import { rookBitMask, rookRelevantBits } from "~/consts/bits";

const [attacks, setAttacks] = createSignal(0n);
export const [rookMask, setRookMask] = createSignal(new BigUint64Array(64));
export const [rookState, setRookState] = createSignal<RookState>(Array.from({ length: 64 }, () => new BigUint64Array(4096)));

/**
 * 
 * @param pos Position on the bitboard.
 * @returns Rook occupancy bits to form a key.
 */
export const maskRookAttacks = (pos: number) => {
    let currentAttacks = 0n;

    const targetRank = Math.floor(pos / 8);
    const targetFile = pos % 8;

    // up
    for (let rank = targetRank - 1; rank >= 1; rank--) {
        currentAttacks |= (1n << BigInt(rank * 8 + targetFile));
    }

    // down
    for (let rank = targetRank + 1; rank <= 6; rank++) {
        currentAttacks |= (1n << BigInt(rank * 8 + targetFile));
    }

    // left
    for (let file = targetFile - 1; file >= 1; file--) {
        currentAttacks |= (1n << BigInt(targetRank * 8 + file));
    }

    // right
    for (let file = targetFile + 1; file <= 6; file++) {
        currentAttacks |= (1n << BigInt(targetRank * 8 + file));
    }

    setAttacks(currentAttacks);
    return attacks();
}

/**
 * 
 * @param pos Position on the bitboard.
 * @returns Rook occupancy bits to form a key.
 */
export const maskRookAttacksOTF = (pos: number, block: bigint) => {
    let currentAttacks = 0n;

    const targetRank = Math.floor(pos / 8);
    const targetFile = pos % 8;

    // up
    for (let rank = targetRank - 1; rank >= 0; rank--) {
        currentAttacks |= (1n << BigInt(rank * 8 + targetFile));
        if ((1n<< BigInt(rank * 8 + targetFile) & block) != 0n) break;
    }

    // down
    for (let rank = targetRank + 1; rank <= 7; rank++) {
        currentAttacks |= (1n << BigInt(rank * 8 + targetFile));
        if ((1n << BigInt(rank * 8 + targetFile) & block) != 0n) break;
    }

    // left
    for (let file = targetFile - 1; file >= 0; file--) {
        currentAttacks |= (1n << BigInt(targetRank * 8 + file));
        if ((1n << BigInt(targetRank * 8 + file) & block) != 0n) break;
    }

    // right
    for (let file = targetFile + 1; file <= 7; file++) {
        currentAttacks |= (1n << BigInt(targetRank * 8 + file));
        if ((1n << BigInt(targetRank * 8 + file) & block) != 0n) break;
    }

    setAttacks(currentAttacks);
    return attacks();
}

/**
 * 
 * @param pos Position on the bitboard.
 * @param occupancy Current occupancy of the board
 * @returns A bitboard representing squares attacked by the rook.
 */
export const getRookAttacks = (pos: number, occupancy: bigint) => {
    occupancy &= rookMask()[pos];
    occupancy = (occupancy * rookMagicNumbers[pos]) >> (64n - BigInt(rookRelevantBits[pos]));
    const maskedOccupancy = occupancy & rookBitMask;

    return rookState()[pos][Number(maskedOccupancy)];
}


export default null;