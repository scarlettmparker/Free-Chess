import { createSignal } from "solid-js";
import { BigIntSignalArray, bitboards, castle, enpassant, occupancies, setCastle, setEnpassant, setSide, side } from "~/consts/board";
import { getter, setter } from "../bigint";

const [bitboardsCopy]: [() => BigIntSignalArray, (value: BigIntSignalArray) => void] = createSignal(
    Array.from({ length: 12 }, () => createSignal(0n))
);
const [occupanciesCopy]: [() => BigIntSignalArray, (value: BigIntSignalArray) => void] = createSignal(
    Array.from({ length: 3 }, () => createSignal(0n))
);
const [sideCopy, setSideCopy] = createSignal(-1);
const [enpassantCopy, setEnpassantCopy] = createSignal(-1);
const [castleCopy, setCastleCopy] = createSignal(0n);

/**
 * Copies the current board state.
 */
export function copyBoard() {
    for (let i = 0; i < 12; i++) {
        const setBitboard = setter(bitboardsCopy, i);
        setBitboard(getter(bitboards, i)());
    }
    for (let i = 0; i < 3; i++) {
        const setOccupancy = setter(occupanciesCopy, i);
        setOccupancy(getter(occupancies, i)());
    }
    setSideCopy(side());
    setEnpassantCopy(enpassant());
    setCastleCopy(castle());
}

/**
 * Restores the board state.
 */
export function takeBack() {
    for (let i = 0; i < 12; i++) {
        const setBitboard = setter(bitboards, i);
        setBitboard(getter(bitboardsCopy, i)());
    }
    for (let i = 0; i < 3; i++) {
        const setOccupancy = setter(occupancies, i);
        setOccupancy(getter(occupanciesCopy, i)());
    }
    setSide(sideCopy());
    setEnpassant(enpassantCopy());
    setCastle(castleCopy());
}