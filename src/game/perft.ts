import { gameState, moveType } from './consts/board';
import { MoveList } from './move/move-def';
import { generateMoves } from './move/legal-move-generator';
import { copyBoard, takeBack } from './board/copy';
import { makeMove } from './move/move';

/**
 * Performance test & move path enumeration
 * @param depth Number of moves from root
 */
export const perftDriver = (depth: number) => {
  if (depth === 0) {
    gameState.nodes += 1;
    return;
  }

  const moves: MoveList = { moves: [], count: 0 };
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
