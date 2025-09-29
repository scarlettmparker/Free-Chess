import { gameState } from '~/game/consts/board';
import { PieceFactory } from '~/game/piece/piece';

/**
 * Piece IDs
 */
// White pieces (even numbers)
export const PAWN_ID = 0;
export const KNIGHT_ID = 2;
export const BISHOP_ID = 4;
export const ROOK_ID = 6;
export const QUEEN_ID = 8;
export const KING_ID = 10;
export const POGO_ID = 12;
export const BALLOON_ID = 14;

// Black pieces (odd numbers, +1 from white)
export const PAWN_BLACK_ID = PAWN_ID + 1;
export const KNIGHT_BLACK_ID = KNIGHT_ID + 1;
export const BISHOP_BLACK_ID = BISHOP_ID + 1;
export const ROOK_BLACK_ID = ROOK_ID + 1;
export const QUEEN_BLACK_ID = QUEEN_ID + 1;
export const KING_BLACK_ID = KING_ID + 1;
export const POGO_BLACK_ID = POGO_ID + 1;
export const BALLOON_BLACK_ID = BALLOON_ID + 1;

/**
 * Helper functions to add pieces to the current game state
 */
export const addPawn = () => {
  const whitePiece = PieceFactory.createPiece('pawn', PAWN_ID, 0);
  const blackPiece = PieceFactory.createPiece('pawn', PAWN_BLACK_ID, 1);

  gameState.pieces.push(whitePiece, blackPiece);
};

export const addKnight = () => {
  const whitePiece = PieceFactory.createPiece('knight', KNIGHT_ID, 0);
  const blackPiece = PieceFactory.createPiece('knight', KNIGHT_BLACK_ID, 1);

  gameState.pieces.push(whitePiece, blackPiece);
};

export const addBishop = () => {
  const whitePiece = PieceFactory.createPiece('bishop', BISHOP_ID, 0);
  const blackPiece = PieceFactory.createPiece('bishop', BISHOP_BLACK_ID, 1);

  gameState.pieces.push(whitePiece, blackPiece);
};

export const addRook = () => {
  const whitePiece = PieceFactory.createPiece('rook', ROOK_ID, 0);
  const blackPiece = PieceFactory.createPiece('rook', ROOK_BLACK_ID, 1);

  gameState.pieces.push(whitePiece, blackPiece);
};

export const addQueen = () => {
  const whitePiece = PieceFactory.createPiece('queen', QUEEN_ID, 0);
  const blackPiece = PieceFactory.createPiece('queen', QUEEN_BLACK_ID, 1);

  gameState.pieces.push(whitePiece, blackPiece);
};

export const addKing = () => {
  const whitePiece = PieceFactory.createPiece('king', KING_ID, 0);
  const blackPiece = PieceFactory.createPiece('king', KING_BLACK_ID, 1);

  gameState.pieces.push(whitePiece, blackPiece);
};

export const addPogoPiece = () => {
  const whitePiece = PieceFactory.createPiece('pogo', POGO_ID, 0);
  const blackPiece = PieceFactory.createPiece('pogo', POGO_BLACK_ID, 1);

  gameState.pieces.push(whitePiece, blackPiece);
};

export const addBalloonPiece = () => {
  const whitePiece = PieceFactory.createPiece('balloon', BALLOON_ID, 0);
  const blackPiece = PieceFactory.createPiece('balloon', BALLOON_BLACK_ID, 1);

  gameState.pieces.push(whitePiece, blackPiece);
};
