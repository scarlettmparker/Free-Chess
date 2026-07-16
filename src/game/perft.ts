import { gameState } from './consts/board';
import { MoveList } from './move/move-def';
import { generateMoves } from './move/legal-move-generator';
import { applyMove, undoMove, moverKingInCheck } from './move/move';
import { getMoveCapture, getMoveEnpassant, getMoveCastle, getMovePromoted } from './move/move-def';

/** Tally a move's counting properties into gameState.moves. */
const tally = (move: number) => {
  if (move === 0) return;
  if (getMoveCapture(move) > 0) gameState.moves.captures += 1;
  if (getMoveEnpassant(move) > 0) gameState.moves.enpassants += 1;
  if (getMoveCastle(move) > 0) gameState.moves.castles += 1;
  if (getMovePromoted(move) > 0) gameState.moves.promotions += 1;
};

/**
 * Performance test & move path enumeration.
 * Uses in-place make/unmake (no per-node board copies), short-circuits leaf
 * nodes (no move generation at depth 0), and bulk-counts the depth-1 ply.
 * @param depth Number of moves from root.
 * @param lastMove The move that led to the current position (for counting properties at leaves).
 */
export const perftDriver = (depth: number, lastMove: number = 0) => {
  // leaf: count without generating moves (generation was wasted work at depth 0)
  if (depth === 0) {
    gameState.nodes += 1;
    tally(lastMove);
    return;
  }

  const moves: MoveList = { moves: [], count: 0 };
  generateMoves(moves, gameState.pieces);

  // bulk-count the leaf ply: enumerate legal moves without recursing into make/unmake
  if (depth === 1) {
    for (let moveCount = 0; moveCount < moves.count; moveCount++) {
      const move = moves.moves[moveCount];
      const undo = applyMove(move);
      const legal = !moverKingInCheck();
      undoMove(move, undo);
      if (!legal) continue;
      gameState.nodes += 1;
      tally(move);
    }
    return;
  }

  for (let moveCount = 0; moveCount < moves.count; moveCount++) {
    const move = moves.moves[moveCount];
    const undo = applyMove(move);
    if (moverKingInCheck()) {
      undoMove(move, undo);
      continue;
    }
    perftDriver(depth - 1, move);
    undoMove(move, undo);
  }
};

/**
 * Pure perft: returns counts without relying on/ mutating gameState.counters.
 * The caller is responsible for resetting gameState before calling.
 */
export const perft = (depth: number): { nodes: number; captures: number; enpassants: number; castles: number; promotions: number } => {
  const savedNodes = gameState.nodes;
  const savedMoves = gameState.moves;
  gameState.nodes = 0;
  gameState.moves = { captures: 0, enpassants: 0, castles: 0, promotions: 0 };

  perftDriver(depth);

  const result = {
    nodes: gameState.nodes,
    captures: gameState.moves.captures,
    enpassants: gameState.moves.enpassants,
    castles: gameState.moves.castles,
    promotions: gameState.moves.promotions,
  };
  gameState.nodes = savedNodes;
  gameState.moves = savedMoves;
  return result;
};
