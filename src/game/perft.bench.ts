/**
 * Perft benchmark harness — serial + parallel.
 * Usage: npm run bench:perft [depth]
 * Prints nodes/sec for the serial engine and the worker_threads parallel engine,
 * and cross-checks parallel node counts against the serial reference.
 */
import { performance } from 'node:perf_hooks';
import os from 'node:os';
import { gameState } from './consts/board';
import { perftDriver } from './perft';
import { perftParallel } from './perft.parallel';
import { loadTestPosition } from '~/utils';

type Bench = { name: string; fen: string; depth: number };

const ref: Record<string, number[]> = {
  start: [1, 20, 400, 8902, 197281, 4865609, 119060324],
  kiwipete: [1, 48, 2039, 97862, 4085603, 193690690],
};

async function main() {
  const defaultDepth = Number(process.argv[2] ?? 4);

  const positions: Bench[] = [
    {
      name: 'start',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      depth: defaultDepth,
    },
    {
      name: 'kiwipete',
      fen: 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -',
      depth: Math.max(1, defaultDepth - 1),
    },
  ];

  const cpuCount = os.cpus().length;
  console.log(`# perft bench (node ${process.version}, ${cpuCount} cores)\n`);

  for (const p of positions) {
    // serial
    loadTestPosition(p.fen);
    gameState.nodes = 0;
    gameState.moves = { captures: 0, enpassants: 0, castles: 0, promotions: 0 };
    const t0 = performance.now();
    perftDriver(p.depth);
    const sMs = performance.now() - t0;
    const sNodes = gameState.nodes;
    const expected = ref[p.name][p.depth];
    const ok = expected ? (sNodes === expected ? 'OK' : `MISMATCH expected ${expected}`) : 'no-ref';
    const sNps = Math.round(sNodes / (sMs / 1000));

    // parallel
    let pLine = '(skipped: depth too shallow)';
    if (p.depth >= 2) {
      const t1 = performance.now();
      const pr = await perftParallel(p.fen, p.depth, Math.max(1, cpuCount - 1));
      const pMs = performance.now() - t1;
      const pNps = Math.round(pr.nodes / (pMs / 1000));
      const match = pr.nodes === sNodes ? 'matches serial' : `MISMATCH serial ${sNodes}`;
      const speedup = (pMs > 0 ? sMs / pMs : 0).toFixed(2);
      pLine = `${pr.nodes} nodes  ${pMs.toFixed(0).padStart(7)} ms  ${pNps.toLocaleString().padStart(12)} nps  ${speedup}x  [${match}]`;
    }

    console.log(`${p.name.padEnd(9)} d${p.depth}`);
    console.log(
      `  serial:   ${sNodes.toString().padStart(10)} nodes  ${sMs.toFixed(0).padStart(7)} ms  ${sNps.toLocaleString().padStart(12)} nps  [${ok}]`,
    );
    console.log(`  parallel: ${pLine}`);
    console.log('');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
