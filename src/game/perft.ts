import { gameState, moveType } from './consts/board';
import { MoveList } from './move/move-def';
import { generateMoves } from './move/legal-move-generator';
import { copyBoard, takeBack } from './board/copy';
import { makeMove } from './move/move';
import { getMoveCapture, getMoveEnpassant, getMoveCastle, getMovePromoted } from './move/move-def';

/**
 * Performance test & move path enumeration
 * @param depth Number of moves from root
 * @param lastMove The move that led to the current position (for counting properties at leaves)
 */
export const perftDriver = (depth: number, lastMove: number = 0) => {
  const moves: MoveList = { moves: [], count: 0 };
  generateMoves(moves, gameState.pieces);

  if (depth === 0) {
    gameState.nodes += 1;
    if (lastMove) {
      if (getMoveCapture(lastMove) > 0) gameState.moves.captures += 1;
      if (getMoveEnpassant(lastMove) > 0) gameState.moves.enpassants += 1;
      if (getMoveCastle(lastMove) > 0) gameState.moves.castles += 1;
      if (getMovePromoted(lastMove) > 0) gameState.moves.promotions += 1;
    }
    return;
  }

  // go through generated moves
  for (let moveCount = 0; moveCount < moves.count; moveCount++) {
    const move = moves.moves[moveCount];
    const copies = copyBoard();

    if (!makeMove(move, moveType.ALL_MOVES, 0)) {
      takeBack(copies);
      continue;
    }

    // call perft driver recursively, passing the current move
    perftDriver(depth - 1, move);
    takeBack(copies);
  }
};

export default null;
