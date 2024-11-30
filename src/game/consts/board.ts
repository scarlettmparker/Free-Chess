import { Piece } from "../piece/piece";
import { Colors } from "./type";

export const pieceIDs = new Set<number>();

type BitboardData = {
    pieceID: number;
    bitboard: bigint;
};

export const gameState = {
    whiteMoves: new Map<number, number>(),
    blackMoves: new Map<number, number>(),
    whitePieceIDs: [] as number[],
    blackPieceIDs: [] as number[],
    pieces: [] as Piece[],
    bitboards: [] as BitboardData[],
    occupancies: Array.from({ length: 3 }, () => 0n),
    globalMove: 0,
    side: 0,
    enpassant: -1,
    castle: 0n,
    nodes: 0,
};

export const WIDTH = 64;
export const HEIGHT = 64;
export const BOARD_SIZE = 8;

// css styling stuff
export const LIGHT_HIGHLIGHTED = 'rgb(252 165 165)';
export const DARK_HIGHLIGHTED = 'rgb(239 68 68)';
export const LIGHT_SELECTED = 'rgb(205 205 205)';
export const DARK_SELECTED = 'rgb(144 144 144)';

export const colors: Colors = Object.freeze({
    WHITE: 0,
    BLACK: 1,
    BOTH: 2
});

export const moveType = Object.freeze({
    ALL_MOVES: 0,
    ONLY_CAPTURES: 1
});

export const castlePieces = Object.freeze({
    wk: 1,
    wq: 2,
    bk: 4,
    bq: 8
});

export const charPieces: { [key: string]: number } = {
    P: 0, p: 1, N: 2, n: 3, B: 4, b: 5,
    R: 6, r: 7, Q: 8, q: 9, K: 10, k: 11
}

export const unicodePieces = [
    '\u2659', '\u265F', '\u2658', '\u265E', '\u2657', '\u265D',
    '\u2656', '\u265C', '\u2655', '\u265B', '\u2654', '\u265A',
]

export const whitePromotions = [charPieces.Q, charPieces.R, charPieces.B, charPieces.N];
export const blackPromotions = [charPieces.q, charPieces.r, charPieces.b, charPieces.n];

// bit board
export const notAFile: bigint = 18374403900871474942n;
export const notABFile: bigint = 18229723555195321596n;
export const notHFile: bigint = 9187201950435737471n;
export const notHGFile: bigint = 4557430888798830399n;

export const getBitboard = (pieceID: number, bitboards: BitboardData[] = gameState.bitboards): BitboardData => {
    const foundPiece = bitboards.find(piece => piece.pieceID === pieceID);
    
    if (!foundPiece) {
        return { pieceID: pieceID, bitboard: 0n };
    }

    return foundPiece;
};