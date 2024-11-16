import { Accessor, Setter, Signal } from "solid-js";
import { Colors, Sliders } from "../App";

// bitboards
export const gameState = {
    bitboards: Array.from({ length: 12 }, () => 0n),
    occupancies: Array.from({ length: 3 }, () => 0n),
    side: 0,
    enpassant: -1,
    castle: 0n,
    nodes: 0,
    captures: 0,
    promotions: 0,
    castles: 0,
    checks: 0
};

export const WIDTH = 64;
export const HEIGHT = 64;
export const BOARD_SIZE = 8;

export const LIGHT_HIGHLIGHTED = 'rgb(252 165 165)';
export const DARK_HIGHLIGHTED = 'rgb(239 68 68)';

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

export const whitePromotions = [charPieces.Q, charPieces.R, charPieces.B, charPieces.N];
export const blackPromotions = [charPieces.q, charPieces.r, charPieces.b, charPieces.n];

export const unicodePieces = [
    '\u2659', '\u2658', '\u2657', '\u2656', '\u2655', '\u2654',
    '\u2659', '\u2658', '\u2657', '\u2656', '\u2655', '\u2654'
];

export type BitboardSignal = [Accessor<bigint>, Setter<bigint>];
export type BigIntSignalArray = Signal<bigint>[];

// bit board
export const notAFile: bigint = 18374403900871474942n;
export const notABFile: bigint = 18229723555195321596n;
export const notHFile: bigint = 9187201950435737471n;
export const notHGFile: bigint = 4557430888798830399n;

export default null;