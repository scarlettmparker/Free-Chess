import { Piece } from '~/game/piece/piece';
import { Colors } from './type';

export const pieceIds = new Set<number>();

type BitboardData = {
  pieceId: number;
  lo: number;
  hi: number;
};

export type GameState = {
  whiteMoves: Map<number, number>;
  blackMoves: Map<number, number>;
  whitePieceIds: number[];
  blackPieceIds: number[];
  pieces: Piece[];
  bitboards: BitboardData[];
  occLo: Uint32Array;
  occHi: Uint32Array;
  checked: [boolean, boolean];
  moves: Moves;
  globalMove: number;
  side: number;
  enpassant: number;
  castle: number;
  nodes: number;
  moveHistory: number[];
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
  occLo: new Uint32Array(3),
  occHi: new Uint32Array(3),
  checked: [false, false],
  moves: { captures: 0, enpassants: 0, castles: 0, promotions: 0 },
  globalMove: 0,
  side: 0,
  enpassant: -1,
  castle: 0,
  nodes: 0,
  moveHistory: [],
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

export const getBitboard = (
  pieceId: number,
  bitboards: BitboardData[] = gameState.bitboards,
): BitboardData => {
  return bitboards[pieceId] ?? { pieceId, lo: 0, hi: 0 };
};
