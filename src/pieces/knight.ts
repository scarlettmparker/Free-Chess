import { createSignal } from "solid-js";
import { notABFile, notAFile, notHFile, notHGFile } from "~/consts/board";
import { updateBitboard } from "~/utils/board/bitboard";
import { KnightState } from "./statetype";

const [kbitboard, setkBitboard] = createSignal<bigint>(0n);
const [attacks, setAttacks] = createSignal(0n);
export const [knightState, setKnightState] = createSignal<KnightState>(Array(64).fill(0n));

/**
 * 
 * @param pos Position on the bitboard.
 * @returns Attack bitboard for a knight on a specified square.
 */
export const maskKnightAttacks = (pos: number) => {
    let currentAttacks = 0n;
    let currentBitboard = 0n;

    updateBitboard(currentBitboard, setkBitboard, pos, true);

    // prevent wrapping around board
    if ((kbitboard() >> 17n & notHFile) !== 0n) currentAttacks |= (kbitboard() >> 17n);
    if ((kbitboard() >> 15n & notAFile) !== 0n) currentAttacks |= (kbitboard() >> 15n);

    if ((kbitboard() >> 10n & notHGFile) !== 0n) currentAttacks |= (kbitboard() >> 10n);
    if ((kbitboard() >> 6n & notABFile) !== 0n) currentAttacks |= (kbitboard() >> 6n);

    // opposite direction
    if ((kbitboard() << 17n & notAFile) !== 0n) currentAttacks |= (kbitboard() << 17n);
    if ((kbitboard() << 15n & notHFile) !== 0n) currentAttacks |= (kbitboard() << 15n);

    if ((kbitboard() << 10n & notABFile) !== 0n) currentAttacks |= (kbitboard() << 10n);
    if ((kbitboard() << 6n & notHGFile) !== 0n) currentAttacks |= (kbitboard() << 6n);

    setAttacks(currentAttacks);
    return attacks();
}

/**
 * 
 * @param square Position on the board.
 * @returns Knight capture state for a given square.
 */
export const getkState = (square: number) => {
    return knightState()[square];
}