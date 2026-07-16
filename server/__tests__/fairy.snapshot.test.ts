import { gameState } from '~/game/consts/board';
import { generateMoves } from '~/game/move/legal-move-generator';
import { MoveList, getMoveSource, getMoveTarget, getMovePiece } from '~/game/move/move-def';
import { rawPosToNot } from '~/game/board/square-helper';
import { parseFEN } from '~/game/fen';
import { resetGameState, initGameState, initGame } from '~/game/init/game';
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
} from '~/game/init/add-piece';

/**
 * Lock the fairy/rotational piece move-generation behaviour (Pogo/Balloon/Spongebob).
 * These pieces are NOT covered by the perft oracle, so this snapshot catches regressions
 * when the move generator is optimised. Asserts the exact pseudo-legal move SET (order-independent).
 */
function loadFairyPosition(fen: string) {
  resetGameState();
  addPawn();
  addKnight();
  addBishop();
  addRook();
  addQueen();
  addKing();
  addPogoPiece();
  addBalloonPiece();
  addSpongebobPiece();
  initGameState();
  parseFEN(fen);
  initGame();
}

describe('fairy piece move generation (rotational)', () => {
  // 10=white king, 12=pogo, 14=balloon, 16=spongebob, 11=black king
  const fen = '4[11]3/8/8/8/2[12][16][14]3/8/8/4[10]3 w - - 0 1';

  beforeEach(() => loadFairyPosition(fen));

  test('pseudo-legal move set is exactly the locked reference', () => {
    const moves = { moves: [], count: 0 } as MoveList;
    generateMoves(moves, gameState.pieces);

    const names: Record<number, string> = { 10: 'WK', 12: 'pogo', 14: 'balloon', 16: 'sponge' };
    const out: string[] = [];
    for (let i = 0; i < moves.count; i++) {
      const m = moves.moves[i];
      out.push(
        `${names[getMovePiece(m)] ?? getMovePiece(m)} ${rawPosToNot[getMoveSource(m)]}${rawPosToNot[getMoveTarget(m)]}`,
      );
    }
    out.sort();

    expect(moves.count).toBe(18);
    expect(out).toEqual([
      'WK e1d1',
      'WK e1d2',
      'WK e1e2',
      'WK e1f1',
      'WK e1f2',
      'balloon e4d3',
      'balloon e4d5',
      'balloon e4e2',
      'balloon e4e6',
      'balloon e4f3',
      'balloon e4f5',
      'pogo c4c6',
      'sponge d4c3',
      'sponge d4c5',
      'sponge d4d3',
      'sponge d4d5',
      'sponge d4e3',
      'sponge d4e5',
    ]);
  });
});
