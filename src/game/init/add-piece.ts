import { gameState } from '~/game/consts/board';
import { PieceFactory } from '~/game/piece/piece';
import { preloadPieceSounds } from '~/game/sound/play';

/**
 * Piece IDs
 */
// White pieces (even numbers)
const PAWN_ID = 0;
const KNIGHT_ID = 2;
const BISHOP_ID = 4;
const ROOK_ID = 6;
const QUEEN_ID = 8;
const KING_ID = 10;
const POGO_ID = 12;
const BALLOON_ID = 14;

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
