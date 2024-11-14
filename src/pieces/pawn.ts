import { createSignal } from "solid-js";
import { notAFile, notHFile } from "~/routes";
import { updateBitboard } from "~/utils/bitboard";
import { PawnState } from "./statetype";

const [pbitboard, setpBitboard] = createSignal<bigint>(BigInt(0));
const [attacks, setAttacks] = createSignal(BigInt(0));
export const [pawnState, setPawnState] = createSignal<PawnState>([
    Array(64).fill(BigInt(0)),
    Array(64).fill(BigInt(0))
])

/**
 * 
 * @param pos Position (e.g. a1) on a Chess board.
 * @param side Colour of piece (either WHITE or BLACK).
 * @returns Attack bitboard for a pawn on a specified square.
 */
export const maskPawnAttacks = (side: number, pos: string) => {
    let currentAttacks = BigInt(0);
    let currentBitboard = BigInt(0);

    updateBitboard(currentBitboard, setpBitboard, pos, true);

    // white pawns
    if (side == 0) {
        if ((pbitboard() >> BigInt(7) & notAFile) !== 0n) currentAttacks |= (pbitboard() >> BigInt(7));
        if ((pbitboard() >> BigInt(9) & notHFile) !== 0n) currentAttacks |= (pbitboard() >> BigInt(9));
    // black pawns
    } else {
        if ((pbitboard() << BigInt(7) & notHFile) !== 0n) currentAttacks |= (pbitboard() << BigInt(7));
        if ((pbitboard() << BigInt(9) & notAFile) !== 0n) currentAttacks |= (pbitboard() << BigInt(9));
    }

    setAttacks(currentAttacks);
    return attacks();
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
