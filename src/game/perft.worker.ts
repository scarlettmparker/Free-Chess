import { parentPort, workerData } from 'node:worker_threads';
import { loadTestPosition } from '~/utils';
import { gameState } from '~/game/consts/board';
import { perftDriver } from '~/game/perft';
import { applyMove, undoMove } from '~/game/move/move';

/**
 * Perft worker: compute perft(depth - 1) for each assigned root move and return
 * the summed tally.
 */
type WorkerPayload = { fen: string; moves: number[]; depth: number };
type Result = {
  nodes: number;
  captures: number;
  enpassants: number;
  castles: number;
  promotions: number;
};

const { fen, moves, depth } = workerData as WorkerPayload;

loadTestPosition(fen);

let nodes = 0;
let captures = 0;
let enpassants = 0;
let castles = 0;
let promotions = 0;

for (let i = 0; i < moves.length; i++) {
  const move = moves[i];
  const undo = applyMove(move);
  // root moves are pre-filtered legal; count the opponent's subtree
  gameState.nodes = 0;
  gameState.moves = { captures: 0, enpassants: 0, castles: 0, promotions: 0 };
  perftDriver(depth - 1, move);
  undoMove(move, undo);
  nodes += gameState.nodes;
  captures += gameState.moves.captures;
  enpassants += gameState.moves.enpassants;
  castles += gameState.moves.castles;
  promotions += gameState.moves.promotions;
}

const result: Result = { nodes, captures, enpassants, castles, promotions };
parentPort?.postMessage(result);
