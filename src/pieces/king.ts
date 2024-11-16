import { createSignal } from "solid-js";
import { KingState } from "./statetype";
import { notAFile, notHFile } from "~/consts/board";
import setBit from "~/utils/board/bitboard";

export const [kingState, setKingState] = createSignal<KingState>(new BigUint64Array(64));
/**
 * 
 * @param pos Position on the bitboard.
 * @returns Attack bitboard for a king on a specified square.
 */
export const maskKingAttacks = (pos: number) => {
    let currentAttacks = 0n;
    let currentBitboard = 0n;
    currentBitboard = setBit(currentBitboard, pos, true);

    // king attacks
    if (currentBitboard >> 8n !== 0n) currentAttacks |= (currentBitboard >> 8n);
    if ((currentBitboard >> 9n & notHFile) !== 0n) currentAttacks |= (currentBitboard >> 9n);
    if ((currentBitboard >> 7n & notAFile) !== 0n) currentAttacks |= (currentBitboard >> 7n);
    if ((currentBitboard >> 1n & notHFile) !== 0n) currentAttacks |= (currentBitboard >> 1n);

    // opposite direction
    if (currentBitboard << 8n !== 0n) currentAttacks |= (currentBitboard << 8n);
    if ((currentBitboard << 9n & notAFile) !== 0n) currentAttacks |= (currentBitboard << 9n);
    if ((currentBitboard << 7n & notHFile) !== 0n) currentAttacks |= (currentBitboard << 7n);
    if ((currentBitboard << 1n & notAFile) !== 0n) currentAttacks |= (currentBitboard << 1n);

    return currentAttacks;
}

/**
 * @param square Position on the board.
 * @returns King capture state for a given square.
 */
export const getkiState = (square: number) => {
    return kingState()[square];
}

export default null;