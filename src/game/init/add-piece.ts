import { gameState } from '~/game/consts/board';
import { PieceFactory } from '~/game/piece/piece';

/**
 * Helper functions to add pieces to the current game state (assumes black and white have same rules).
 */
export const addPawn = () => {
  const whitePiece = PieceFactory.createPiece('pawn', 0, 0);
  const blackPiece = PieceFactory.createPiece('pawn', 1, 1);

  gameState.pieces.push(whitePiece);
  gameState.pieces.push(blackPiece);
};

export const addKnight = () => {
  const whitePiece = PieceFactory.createPiece('knight', 2, 0);
  const blackPiece = PieceFactory.createPiece('knight', 3, 1);

  gameState.pieces.push(whitePiece);
  gameState.pieces.push(blackPiece);
};

export const addBishop = () => {
  const whitePiece = PieceFactory.createPiece('bishop', 4, 0);
  const blackPiece = PieceFactory.createPiece('bishop', 5, 1);

  gameState.pieces.push(whitePiece);
  gameState.pieces.push(blackPiece);
};

export const addRook = () => {
  const whitePiece = PieceFactory.createPiece('rook', 6, 0);
  const blackPiece = PieceFactory.createPiece('rook', 7, 1);

  gameState.pieces.push(whitePiece);
  gameState.pieces.push(blackPiece);
};

export const addQueen = () => {
  const whitePiece = PieceFactory.createPiece('queen', 8, 0);
  const blackPiece = PieceFactory.createPiece('queen', 9, 1);

  gameState.pieces.push(whitePiece);
  gameState.pieces.push(blackPiece);
};

export const addKing = () => {
  const whitePiece = PieceFactory.createPiece('king', 10, 0);
  const blackPiece = PieceFactory.createPiece('king', 11, 1);

  gameState.pieces.push(whitePiece);
  gameState.pieces.push(blackPiece);
};

export const addPogoPiece = () => {
  const whitePiece = PieceFactory.createPiece('pogo', 12, 0);
  const blackPiece = PieceFactory.createPiece('pogo', 13, 1);

  gameState.pieces.push(whitePiece);
  gameState.pieces.push(blackPiece);
};

export const addBalloonPiece = () => {
  const whitePiece = PieceFactory.createPiece('balloon', 14, 0);
  const blackPiece = PieceFactory.createPiece('balloon', 15, 1);

  gameState.pieces.push(whitePiece);
  gameState.pieces.push(blackPiece);
};
