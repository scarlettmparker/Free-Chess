import { Accessor, createSignal, Setter, Signal } from "solid-js";
import { Colors, Sliders } from "~/routes";

// bitboards
export const [bitboards, setBitboards]: [() => BigIntSignalArray, (value: BigIntSignalArray) => void] = createSignal(
    Array.from({ length: 12 }, () => createSignal(0n))
);
export const [occupancies, setOccupancies]: [() => BigIntSignalArray, (value: BigIntSignalArray) => void] = createSignal(
    Array.from({ length: 3 }, () => createSignal(0n))
);

export const [side, setSide] = createSignal(-1);
export const [enpassant, setEnpassant] = createSignal(-1);
export const [castle, setCastle] = createSignal(0n);

export const WIDTH = 64;
export const HEIGHT = 64;
export const BOARD_SIZE = 8;

export const colors: Colors = Object.freeze({
    WHITE: 0,
    BLACK: 1,
    BOTH: 2
});

export const sliders: Sliders = Object.freeze({
    ROOK: 0,
    BISHOP: 1
});

export const pieces = Object.freeze({
    wk: 1,
    wq: 2,
    bk: 4,
    bq: 8
});

export const charPieces: { [key: string]: number } = {
    P: 0, N: 1, B: 2, R: 3, Q: 4, K: 5,
    p: 6, n: 7, b: 8, r: 9, q: 10, k: 11
};

export const unicodePieces = [
    '\u2659', '\u2658', '\u2657', '\u2656', '\u2655', '\u2654',
    '\u265F', '\u265E', '\u265D', '\u265C', '\u265B', '\u265A'
];

export type BitboardSignal = [Accessor<bigint>, Setter<bigint>];
export type BigIntSignalArray = Signal<bigint>[];

// bit board
export const notAFile: bigint = 18374403900871474942n;
export const notABFile: bigint = 18229723555195321596n;
export const notHFile: bigint = 9187201950435737471n;
export const notHGFile: bigint = 4557430888798830399n;

export default null;