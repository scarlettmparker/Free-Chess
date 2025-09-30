import { gameState } from '~/game/consts/board';
import { PieceFactory } from '~/game/piece/piece';
import { preloadPieceSounds } from '~/game/sound/play';

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
export const SPONGEBOB_ID = 16;

/**
 * Helper functions to add pieces to the current game state
 * and preload their sounds
 */
function addPiece(type: string, whiteId: number) {
  const blackId = whiteId + 1;
  const whitePiece = PieceFactory.createPiece(type, whiteId, 0);
  const blackPiece = PieceFactory.createPiece(type, blackId, 1);
  gameState.pieces.push(whitePiece, blackPiece);

  preloadPieceSounds(whiteId);
  preloadPieceSounds(blackId);
}

export const addPawn = () => addPiece('pawn', PAWN_ID);
export const addKnight = () => addPiece('knight', KNIGHT_ID);
export const addBishop = () => addPiece('bishop', BISHOP_ID);
export const addRook = () => addPiece('rook', ROOK_ID);
export const addQueen = () => addPiece('queen', QUEEN_ID);
export const addKing = () => addPiece('king', KING_ID);
export const addPogoPiece = () => addPiece('pogo', POGO_ID);
export const addBalloonPiece = () => addPiece('balloon', BALLOON_ID);
export const addSpongebobPiece = () => addPiece('spongebob', SPONGEBOB_ID);
