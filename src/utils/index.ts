import { parseFEN } from '~/game/fen';
import {
  addPawn,
  addKnight,
  addBishop,
  addRook,
  addQueen,
  addKing,
  addPogoPiece,
  addBalloonPiece,
} from '~/game/init/add-piece';
import { resetGameState, initGameState, initGame } from '~/game/init/game';
import { MoveList, getMoveSource, getMoveTarget } from '~/game/move/move-def';

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
  '[7][3][5][15][11][5][3][7]/[1][1][13][13][13][1][1][1]/8/8/8/8/[0][0][0][12][12][12][0][0]/[6][2][4][14][10][4][2][6] w KQkq - 0 1';

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
}
