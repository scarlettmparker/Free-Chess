import { createSignal } from "solid-js";
import { notABFile, notAFile, notHFile, notHGFile } from "~/routes";
import { updateBitboard } from "~/utils/bitboard";
import { KnightState } from "./statetype";

const [kbitboard, setkBitboard] = createSignal<bigint>(BigInt(0));
const [attacks, setAttacks] = createSignal(BigInt(0));
export const [knightState, setKnightState] = createSignal<KnightState>(Array(64).fill(BigInt(0)));

/**
 * 
 * @param pos Position (e.g. a1) on a Chess board.
 * @returns Attack bitboard for a knight on a specified square.
 */
export const maskKnightAttacks = (pos: string) => {
    let currentAttacks = BigInt(0);
    let currentBitboard = BigInt(0)

    updateBitboard(currentBitboard, setkBitboard, pos, true);

    // prevent wrapping around board
    if ((kbitboard() >> BigInt(17) & notHFile) !== 0n) currentAttacks |= (kbitboard() >> BigInt(17));
    if ((kbitboard() >> BigInt(15) & notAFile) !== 0n) currentAttacks |= (kbitboard() >> BigInt(15));

    if ((kbitboard() >> BigInt(10) & notHGFile) !== 0n) currentAttacks |= (kbitboard() >> BigInt(10));
    if ((kbitboard() >> BigInt(6) & notABFile) !== 0n) currentAttacks |= (kbitboard() >> BigInt(6));

    // opposite direction
    if ((kbitboard() << BigInt(17) & notAFile) !== 0n) currentAttacks |= (kbitboard() << BigInt(17));
    if ((kbitboard() << BigInt(15) & notHFile) !== 0n) currentAttacks |= (kbitboard() << BigInt(15));

    if ((kbitboard() << BigInt(10) & notABFile) !== 0n) currentAttacks |= (kbitboard() << BigInt(10));
    if ((kbitboard() << BigInt(6) & notHGFile) !== 0n) currentAttacks |= (kbitboard() << BigInt(6));

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