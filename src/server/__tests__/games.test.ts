import { describe, expect, it } from 'vitest';
import { existsSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { SerializedGameState } from '~/utils/game-serialize';

const tmpDb = path.join(os.tmpdir(), `free-chess-games-${process.pid}.db`);
process.env.GAME_DB_PATH = tmpDb;
if (existsSync(tmpDb)) rmSync(tmpDb);

const {
  assignSeat,
  countResultsForAccount,
  createGame,
  finishGame,
  generateGameId,
  getGame,
  listGamesForAccount,
  listMoves,
  recordMove,
} = await import('~/server/games');

const initialState = {
  whitePieceIds: [],
  blackPieceIds: [],
  kingPieceId: [10, 11],
  pieces: [],
  bitboards: [],
  occupancies: ['0', '0', '0'],
  checked: [false, false],
  gameOver: false,
  result: null,
  side: 0,
  enpassant: -1,
  castle: '0',
  globalMove: 0,
  nodes: 0,
  moves: { captures: 0, enpassants: 0, castles: 0, promotions: 0 },
  whiteMoves: [],
  blackMoves: [],
  moveHistory: [],
} as SerializedGameState;

describe('game ids', () => {
  it('generates seven character alphanumeric ids', () => {
    const ids = new Set<string>();
    for (let index = 0; index < 20_000; index += 1) {
      const id = generateGameId();
      expect(id).toMatch(/^[A-Za-z0-9]{7}$/);
      ids.add(id);
    }
    expect(ids.size).toBeGreaterThan(19_990);
  });
});

describe('games', () => {
  it('creates games and retries an id collision', () => {
    const first = createGame(
      {
        boardLayoutId: 1,
        boardLayoutName: 'Standard',
        initialState,
        creatorAccountId: 'creator',
      },
      { idFactory: () => 'AAAAAAA' },
    );
    const second = createGame(
      {
        boardLayoutId: 1,
        boardLayoutName: 'Standard',
        initialState,
        creatorAccountId: 'creator',
      },
      {
        idFactory: (() => {
          let calls = 0;
          return () => {
            calls += 1;
            return calls === 1 ? 'AAAAAAA' : 'BBBBBBB';
          };
        })(),
      },
    );

    expect(first).toBe('AAAAAAA');
    expect(second).toBe('BBBBBBB');
    expect(getGame(second)?.status).toBe('waiting');
  });

  it('binds the creator and joiner to permanent seats', () => {
    const id = createGame(
      {
        boardLayoutId: 1,
        boardLayoutName: 'Standard',
        initialState,
        creatorAccountId: 'creator-seat',
      },
      { idFactory: () => 'SEAT001' },
    );

    expect(assignSeat(id, 'creator-seat')).toEqual({ status: 'creator', color: null });

    const joined = assignSeat(id, 'joiner-seat');
    expect(joined.status).toBe('joined');
    expect(joined.status === 'joined' ? joined.color : null).not.toBeNull();

    const game = getGame(id);
    expect(game?.status).toBe('active');
    expect(game?.whiteAccountId).toBeTruthy();
    expect(game?.blackAccountId).toBeTruthy();
    expect([game?.whiteAccountId, game?.blackAccountId]).toContain('creator-seat');
    expect([game?.whiteAccountId, game?.blackAccountId]).toContain('joiner-seat');

    expect(assignSeat(id, 'joiner-seat').status).toBe('existing');
    expect(assignSeat(id, 'spectator-seat')).toEqual({ status: 'spectator' });
  });

  it('stores moves in ply order', () => {
    const id = createGame(
      {
        boardLayoutId: 1,
        boardLayoutName: 'Standard',
        initialState,
        creatorAccountId: 'move-creator',
      },
      { idFactory: () => 'MOVES01' },
    );

    recordMove(id, 100);
    recordMove(id, 200);
    const moves = listMoves(id);

    expect(moves.map((entry) => entry.ply)).toEqual([0, 1]);
    expect(moves.map((entry) => entry.move)).toEqual([100, 200]);
  });

  it('records a finished result and account totals', () => {
    const id = createGame(
      {
        boardLayoutId: 1,
        boardLayoutName: 'Standard',
        initialState,
        creatorAccountId: 'winner-account',
      },
      { idFactory: () => 'RESULT1' },
    );

    assignSeat(id, 'winner-account');
    assignSeat(id, 'loser-account');
    const game = getGame(id);
    const winnerId = 'winner-account';
    const result = game?.whiteAccountId === winnerId ? 'white-checkmate' : 'black-checkmate';

    expect(finishGame(id, result, winnerId)).toBe(true);
    expect(finishGame(id, result, winnerId)).toBe(false);
    expect(getGame(id)?.status).toBe('finished');
    expect(countResultsForAccount(winnerId).wins).toBe(1);
    expect(countResultsForAccount('loser-account').losses).toBe(1);
    expect(listGamesForAccount(winnerId).games[0]?.id).toBe(id);
  });
});
