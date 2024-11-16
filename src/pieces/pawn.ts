import { createSignal } from "solid-js";
import { notAFile, notHFile } from "~/consts/board";
import { PawnState } from "./statetype";
import setBit from "~/utils/board/bitboard";

const [pbitboard, setpBitboard] = createSignal<bigint>(0n);
const [attacks, setAttacks] = createSignal(0n);
export const [pawnState, setPawnState] = createSignal<PawnState>([
    new BigUint64Array(64),
    new BigUint64Array(64)
])

/**
 * 
 * @param pos Position on the bitboard.
 * @param side Colour of piece (either WHITE or BLACK).
 * @returns Attack bitboard for a pawn on a specified square.
 */
export const maskPawnAttacks = (side: number, pos: number) => {
    let currentAttacks = 0n;
    let currentBitboard = 0n;
    currentBitboard = setBit(currentBitboard, pos, true);

    // white pawns
    if (side == 0) {
        if ((currentBitboard >> 7n & notAFile) !== 0n) currentAttacks |= (currentBitboard >> 7n);
        if ((currentBitboard >> 9n & notHFile) !== 0n) currentAttacks |= (currentBitboard >> 9n);
    // black pawns
    } else {
        if ((currentBitboard << 7n & notHFile) !== 0n) currentAttacks |= (currentBitboard << 7n);
        if ((currentBitboard << 9n & notAFile) !== 0n) currentAttacks |= (currentBitboard << 9n);
    }

    return currentAttacks;
}

/**
 * 
 * @param side Colour of piece (either WHITE or BLACK).
 * @param square Position on the board.
 * @returns Pawn capture state for a given side and square.
 */
export const getpState = (side: number, square: number) => {
    return pawnState()[side][square];
}

export default null;