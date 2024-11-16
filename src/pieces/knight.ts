import { createSignal } from "solid-js";
import { notABFile, notAFile, notHFile, notHGFile } from "../consts/board";
import { KnightState } from "./statetype";
import setBit from "../utils/board/bitboard";

export const [knightState, setKnightState] = createSignal<KnightState>(new BigUint64Array(64));

/**
 * 
 * @param pos Position on the bitboard.
 * @returns Attack bitboard for a knight on a specified square.
 */
export const maskKnightAttacks = (pos: number) => {
    let currentAttacks = 0n;
    let currentBitboard = 0n;
    currentBitboard = setBit(currentBitboard, pos, true);

    // prevent wrapping around board
    if ((currentBitboard >> 17n & notHFile) !== 0n) currentAttacks |= (currentBitboard >> 17n);
    if ((currentBitboard >> 15n & notAFile) !== 0n) currentAttacks |= (currentBitboard >> 15n);

    if ((currentBitboard >> 10n & notHGFile) !== 0n) currentAttacks |= (currentBitboard >> 10n);
    if ((currentBitboard >> 6n & notABFile) !== 0n) currentAttacks |= (currentBitboard >> 6n);

    // opposite direction
    if ((currentBitboard << 17n & notAFile) !== 0n) currentAttacks |= (currentBitboard << 17n);
    if ((currentBitboard << 15n & notHFile) !== 0n) currentAttacks |= (currentBitboard << 15n);

    if ((currentBitboard << 10n & notABFile) !== 0n) currentAttacks |= (currentBitboard << 10n);
    if ((currentBitboard << 6n & notHGFile) !== 0n) currentAttacks |= (currentBitboard << 6n);

    return currentAttacks;
}

/**
 * 
 * @param square Position on the board.
 * @returns Knight capture state for a given square.
 */
export const getkState = (square: number) => {
    return knightState()[square];
}

export default null;