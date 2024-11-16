import { Accessor, createSignal, Signal } from "solid-js";
import { bitboards, castle, enpassant, occupancies, setBitboards, setCastle, setEnpassant, setOccupancies, setSide, side } from "~/consts/board";
import { getter } from "../bigint";

/**
 * Copies the current board state.
 */
export function copyBoard() {
    const bitboardsCopy = Array.from({ length: 12 }, (_, i) => createSignal(getter(bitboards, i)()));
    const occupanciesCopy = Array.from({ length: 3 }, (_, i) => createSignal(getter(occupancies, i)()));
    const [sideCopy, setSideCopy] = createSignal(-1);
    const [enpassantCopy, setEnpassantCopy] = createSignal(-1);
    const [castleCopy, setCastleCopy] = createSignal(0n);

    setSideCopy(side());
    setEnpassantCopy(enpassant());
    setCastleCopy(castle());

    return {
        bitboardsCopy,
        occupanciesCopy,
        sideCopy,
        enpassantCopy,
        castleCopy
    };
}

/**
 * Restores the board state from a previous copy.
 * @param {Object} copies - The copied board states returned by copyBoard.
 */
export function takeBack(copies: { bitboardsCopy: Signal<bigint>[]; occupanciesCopy: Signal<bigint>[]; sideCopy: Accessor<number>; enpassantCopy: Accessor<number>; castleCopy: Accessor<bigint>; }) {
    const { bitboardsCopy, occupanciesCopy, sideCopy, enpassantCopy, castleCopy } = copies;

    // restore bitboards
    setBitboards(bitboardsCopy);
    setOccupancies(occupanciesCopy);
    setSide(sideCopy());
    setEnpassant(enpassantCopy());
    setCastle(castleCopy());
}

export default null;