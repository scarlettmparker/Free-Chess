import { Worker } from 'node:worker_threads';
import os from 'node:os';
import { loadTestPosition } from '~/utils';
import { gameState } from '~/game/consts/board';
import { generateMoves } from '~/game/move/legal-move-generator';
import { applyMove, undoMove, moverKingInCheck } from '~/game/move/move';
import { perftDriver } from '~/game/perft';
import { MoveList } from '~/game/move/move-def';

export type PerftResult = {
  nodes: number;
  captures: number;
  enpassants: number;
  castles: number;
  promotions: number;
};

/**
 * Parallel perft via worker_threads. Enumerates legal root moves in the main
 * thread, partitions them across N workers, and sums each worker's subtree
 * tally. Result is identical to serial perft for depth >= 2.
 */
export async function perftParallel(
  fen: string,
  depth: number,
  workerCount: number = Math.max(1, os.cpus().length - 1),
): Promise<PerftResult> {
  if (depth <= 1) {
    loadTestPosition(fen);
    gameState.nodes = 0;
    gameState.moves = { captures: 0, enpassants: 0, castles: 0, promotions: 0 };
    perftDriver(depth);
    return {
      nodes: gameState.nodes,
      captures: gameState.moves.captures,
      enpassants: gameState.moves.enpassants,
      castles: gameState.moves.castles,
      promotions: gameState.moves.promotions,
    };
  }

  // root: enumerate legal moves
  loadTestPosition(fen);
  const moves: MoveList = { moves: [], count: 0 };
  generateMoves(moves, gameState.pieces);
  const legal: number[] = [];
  for (let i = 0; i < moves.count; i++) {
    const m = moves.moves[i];
    const undo = applyMove(m);
    const ok = !moverKingInCheck();
    undoMove(m, undo);
    if (ok) legal.push(m);
  }

  const n = Math.min(Math.max(1, workerCount), legal.length);
  const chunks: number[][] = Array.from({ length: n }, () => []);
  for (let i = 0; i < legal.length; i++) chunks[i % n].push(legal[i]);

  const workerUrl = new URL('./perft.worker.ts', import.meta.url);
  const promises = chunks.map(
    (chunk) =>
      new Promise<PerftResult>((resolve, reject) => {
        const w = new Worker(workerUrl, { workerData: { fen, moves: chunk, depth } });
        w.on('message', (msg: PerftResult) => {
          resolve(msg);
          w.terminate();
        });
        w.on('error', reject);
        w.on('exit', (code) => {
          if (code !== 0) reject(new Error(`worker exited with code ${code}`));
        });
      }),
  );
  const results = await Promise.all(promises);

  const total: PerftResult = {
    nodes: 0,
    captures: 0,
    enpassants: 0,
    castles: 0,
    promotions: 0,
  };
  for (const r of results) {
    total.nodes += r.nodes;
    total.captures += r.captures;
    total.enpassants += r.enpassants;
    total.castles += r.castles;
    total.promotions += r.promotions;
  }
  return total;
}
