import { Piece } from '~/game/piece/piece';
import { Colors } from './type';

export const pieceIds = new Set<number>();

type BitboardData = {
  pieceId: number;
  bitboard: bigint;
};

export type GameState = {
  whiteMoves: Map<number, number>;
  blackMoves: Map<number, number>;
  whitePieceIds: number[];
  blackPieceIds: number[];
  pieces: Piece[];
  bitboards: BitboardData[];
  occupancies: bigint[];
  checked: [boolean, boolean];
  moves: Moves;
  globalMove: number;
  side: number;
  enpassant: number;
  castle: bigint;
  nodes: number;
};

export type Moves = {
  captures: number;
  enpassants: number;
  castles: number;
  promotions: number;
};

export const gameState: GameState = {
  whiteMoves: new Map(),
  blackMoves: new Map(),
  whitePieceIds: [],
  blackPieceIds: [],
  pieces: [],
  bitboards: [],
  occupancies: Array.from({ length: 3 }, () => 0n),
  checked: [false, false],
  moves: { captures: 0, enpassants: 0, castles: 0, promotions: 0 },
  globalMove: 0,
  side: 0,
  enpassant: -1,
  castle: 0n,
  nodes: 0,
};

export const BOARD_SIZE = 8;

export type PlayerColor = typeof colors.WHITE | typeof colors.BLACK;

export const colors: Colors = Object.freeze({
  WHITE: 0,
  BLACK: 1,
  BOTH: 2,
});

export const moveType = Object.freeze({
  ALL_MOVES: 0,
  ONLY_CAPTURES: 1,
});

export const castlePieces = Object.freeze({
  wk: 1,
  wq: 2,
  bk: 4,
  bq: 8,
});

export const charPieces: { [key: string]: number } = {
  P: 0,
  p: 1,
  N: 2,
  n: 3,
  B: 4,
  b: 5,
  R: 6,
  r: 7,
  Q: 8,
  q: 9,
  K: 10,
  k: 11,
};

export const unicodePieces = [
  '\u2659',
  '\u265F',
  '\u2658',
  '\u265E',
  '\u2657',
  '\u265D',
  '\u2656',
  '\u265C',
  '\u2655',
  '\u265B',
  '\u2654',
  '\u265A',
];

export const whitePromotions = [charPieces.Q, charPieces.R, charPieces.B, charPieces.N];
export const blackPromotions = [charPieces.q, charPieces.r, charPieces.b, charPieces.n];

// bit board
export const notAFile: bigint = 18374403900871474942n;
export const notABFile: bigint = 18229723555195321596n;
export const notHFile: bigint = 9187201950435737471n;
export const notHGFile: bigint = 4557430888798830399n;

export const getBitboard = (
  pieceId: number,
  bitboards: BitboardData[] = gameState.bitboards,
): BitboardData => {
  const foundPiece = bitboards.find((piece) => piece.pieceId === pieceId);

  if (!foundPiece) {
    return { pieceId: pieceId, bitboard: 0n };
  }

  return foundPiece;
};
