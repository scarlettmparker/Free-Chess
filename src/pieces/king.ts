import { createSignal } from "solid-js";
import { KingState } from "./statetype";
import { updateBitboard } from "~/utils/board/bitboard";
import { notAFile, notHFile } from "~/routes";

const [kibitboard, setkiBitboard] = createSignal<bigint>(BigInt(0));
const [attacks, setAttacks] = createSignal(BigInt(0));
export const [kingState, setKingState] = createSignal<KingState>(Array(64).fill(0));

/**
 * 
 * @param pos Position on the bitboard.
 * @returns Attack bitboard for a king on a specified square.
 */
export const maskKingAttacks = (pos: number) => {
    let currentAttacks = BigInt(0);
    let currentBitboard = BigInt(0);

    updateBitboard(currentBitboard, setkiBitboard, pos, true);

    // king attacks
    if (kibitboard() >> BigInt(8) !== 0n) currentAttacks |= (kibitboard() >> BigInt(8));
    if ((kibitboard() >> BigInt(9) & notHFile) !== 0n) currentAttacks |= (kibitboard() >> BigInt(9));
    if ((kibitboard() >> BigInt(7) & notAFile) !== 0n) currentAttacks |= (kibitboard() >> BigInt(7));
    if ((kibitboard() >> BigInt(1) & notHFile) !== 0n) currentAttacks |= (kibitboard() >> BigInt(1));

    // opposite direction
    if (kibitboard() << BigInt(8) !== 0n) currentAttacks |= (kibitboard() << BigInt(8));
    if ((kibitboard() << BigInt(9) & notAFile) !== 0n) currentAttacks |= (kibitboard() << BigInt(9));
    if ((kibitboard() << BigInt(7) & notHFile) !== 0n) currentAttacks |= (kibitboard() << BigInt(7));
    if ((kibitboard() << BigInt(1) & notAFile) !== 0n) currentAttacks |= (kibitboard() << BigInt(1));

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