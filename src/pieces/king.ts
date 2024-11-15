import { createSignal } from "solid-js";
import { KingState } from "./statetype";
import { updateBitboard } from "~/utils/board/bitboard";
import { notAFile, notHFile } from "~/consts/board";

const [kibitboard, setkiBitboard] = createSignal<bigint>(0n);
const [attacks, setAttacks] = createSignal(0n);
export const [kingState, setKingState] = createSignal<KingState>(new BigUint64Array(64));

/**
 * 
 * @param pos Position on the bitboard.
 * @returns Attack bitboard for a king on a specified square.
 */
export const maskKingAttacks = (pos: number) => {
    let currentAttacks = 0n;
    let currentBitboard = 0n;

    updateBitboard(currentBitboard, setkiBitboard, pos, true);

    // king attacks
    if (kibitboard() >> 8n !== 0n) currentAttacks |= (kibitboard() >> 8n);
    if ((kibitboard() >> 9n & notHFile) !== 0n) currentAttacks |= (kibitboard() >> 9n);
    if ((kibitboard() >> 7n & notAFile) !== 0n) currentAttacks |= (kibitboard() >> 7n);
    if ((kibitboard() >> 1n & notHFile) !== 0n) currentAttacks |= (kibitboard() >> 1n);

    // opposite direction
    if (kibitboard() << 8n !== 0n) currentAttacks |= (kibitboard() << 8n);
    if ((kibitboard() << 9n & notAFile) !== 0n) currentAttacks |= (kibitboard() << 9n);
    if ((kibitboard() << 7n & notHFile) !== 0n) currentAttacks |= (kibitboard() << 7n);
    if ((kibitboard() << 1n & notAFile) !== 0n) currentAttacks |= (kibitboard() << 1n);

    setAttacks(currentAttacks);
    return attacks();
}

/**
 * @param square Position on the board.
 * @returns King capture state for a given square.
 */
export const getkiState = (square: number) => {
    return kingState()[square];
}

export default null;