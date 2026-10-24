import { colors, gameState } from '~/game/consts/board';
import { convertFEN, parseFEN } from '~/game/fen';
import {
  addPawn,
  addKnight,
  addBishop,
  addRook,
  addQueen,
  addKing,
  addPogoPiece,
  addBalloonPiece,
  addSpongebobPiece,
  addPiece,
} from '~/game/init/add-piece';
import { resetGameState, initGameState, initGame } from '~/game/init/game';
import { pieceRegistry } from '~/game/piece/piece-registry';
import type { PieceDefinition } from '~/game/piece/piece-definition';

const startPosition =
  '[17][3][5][15][11][5][3][17]/[1][1][1][13][13][13][1][1]/8/8/8/8/[0][0][12][12][12][0][0][0]/[16][2][4][14][10][4][2][16] w KQkq - 0 1';

/**
 * Helper function to mount the game state
 */
export function mountGame(_pieceSetId?: number, defs?: PieceDefinition[]) {
  resetGameState();

  if (defs && defs.length > 0) {
    for (const def of defs) {
      const base = pieceRegistry.register(def);
      addPiece(def.slug, base);
    }
  } else {
    addPawn();
    addKnight();
    addBishop();
    addRook();
    addQueen();
    addKing();
    addPogoPiece();
    addBalloonPiece();
    addSpongebobPiece();
  }

  initGameState();
  parseFEN(startPosition);
  initGame();

  const whiteKing = gameState.pieces.find(
    (piece) => piece.getType() === 'king' && piece.getColor() === colors.WHITE,
  );
  const blackKing = gameState.pieces.find(
    (piece) => piece.getType() === 'king' && piece.getColor() === colors.BLACK,
  );
  gameState.kingPieceId = [whiteKing ? whiteKing.getId() : 10, blackKing ? blackKing.getId() : 11];
}

/**
 * Helper function.
 */
export function loadTestPosition(startPosition: string) {
  resetGameState();
  addPawn();
  addKnight();
  addBishop();
  addRook();
  addQueen();
  addKing();
  initGameState();
  parseFEN(convertFEN(startPosition));
  initGame();
}
