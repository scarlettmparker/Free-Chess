import { gameState, moveType } from './consts/board';
import { getMoveCapture, MoveList } from './move/movedef';
import { generateMoves } from './move/legalmovegenerator';
import { copyBoard, takeBack } from './board/copy';
import { makeMove } from './move/move';
import { printBoard } from './board/bitboard';

/**
 * Performance test & move path enumeration
 * @param depth Number of moves from root
 */
export const perftDriver = (depth: number) => {
  if (depth === 0) {
    gameState.nodes += 1;
    return;
  }

  let moves: MoveList = { moves: [], count: 0 };
  generateMoves(moves, gameState.pieces);

  // go through generated moves
  for (let moveCount = 0; moveCount < moves.count; moveCount++) {
    const copies = copyBoard();

    if (!makeMove(moves.moves[moveCount], moveType.ALL_MOVES, 0)) {
      continue;
    }

    // call perft driver recursively
    perftDriver(depth - 1);
    takeBack(copies);
  }
};

export default null;
