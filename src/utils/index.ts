import { printBoard } from '../game/board/bitboard';
import { gameState } from '../game/consts/board';
import { parseFEN } from '../game/fen';
import {
  addPawn,
  addKnight,
  addBishop,
  addRook,
  addQueen,
  addKing,
  addPogoPiece,
  addBalloonPiece,
} from '../game/init/add-piece';
import { resetGameState, initGameState, initGame } from '../game/init/game';
import { MoveList, getMoveSource, getMoveTarget } from '../game/move/move-def';
import { perftDriver } from '../game/perft';

type SquareMove = {
  source: number;
  target: number;
};

/**
 * Converts a MoveList to a list of {source, target} squares.
 */
export function movesToSquares(moveList: MoveList): SquareMove[] {
  return moveList.moves.map((move) => ({
    source: getMoveSource(move),
    target: getMoveTarget(move),
  }));
}

const startPosition =
  '[7]3[11]2[7]/[1]1[1][1][9][1][5]1/[5][3]2[1][3][1]1/3[0][2]3/1[1]2[0]3/2[2]2[8]1[1]/[0][0][0][4][4][0][0][0]/[6]3[10]2[6] w KQkq -';

/**
 * Helper function to mount the game state
 */
export function mountGame() {
  resetGameState();

  // Add game pieces
  // TODO: figure out how we will handle this for other positions
  addPawn();
  addKnight();
  addBishop();
  addRook();
  addQueen();
  addKing();
  addPogoPiece();
  addBalloonPiece();

  initGameState();
  parseFEN(startPosition);
  initGame();

  console.log('printBoard', printBoard());
  perftDriver(3);
  console.log('moves', gameState.nodes);
}
