import { beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { SerializedGameState } from '~/utils/game-serialize';

const tmpDb = path.join(os.tmpdir(), `free-chess-archive-${process.pid}.db`);
process.env.GAME_DB_PATH = tmpDb;
if (existsSync(tmpDb)) rmSync(tmpDb);

vi.mock('@sun/api', () => ({
  configureApi: vi.fn(),
  executeDocument: vi.fn(),
}));

const { executeDocument } = await import('@sun/api');
const { archiveFinishedGame } = await import('~/server/game-archive-client');
const { createGame, finishGame, getGame, listMoves } = await import('~/server/games');
const { openGameDatabase } = await import('~/server/game-db');

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

/**
 * Creates a finished game for archive tests.
 *
 * @param id Game id.
 * @param withFinalState Whether to store a final position.
 */
function finishedGame(id: string, withFinalState = true) {
  createGame(
    {
      boardLayoutId: null,
      boardLayoutName: 'Standard',
      initialState,
      creatorAccountId: 'creator',
    },
    { idFactory: () => id },
  );
  finishGame(id, 'draw', null, withFinalState ? initialState : null);
}

describe('game archive client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes the live game after Sun archives it', async () => {
    finishedGame('ARCHIVE1');
    vi.mocked(executeDocument).mockResolvedValue({
      success: true,
      data: {
        medusaMutations: {
          archiveGame: {
            message: 'Game archived',
            game: { id: 'sun-id', code: 'ARCHIVE1', archivedAt: '2026-01-01T00:00:00Z' },
          },
        },
      },
    } as never);

    expect(await archiveFinishedGame('ARCHIVE1')).toBe(true);
    expect(getGame('ARCHIVE1')).toBeNull();
    expect(listMoves('ARCHIVE1')).toEqual([]);
  });

  it('keeps the live game after a failed archive', async () => {
    finishedGame('ARCHIVE2');
    vi.mocked(executeDocument).mockResolvedValue({
      success: false,
      error: 'Sun unavailable',
    } as never);

    expect(await archiveFinishedGame('ARCHIVE2')).toBe(false);
    expect(getGame('ARCHIVE2')).not.toBeNull();

    const db = openGameDatabase();
    const row = db
      .query('SELECT archive_state, archive_error FROM games WHERE id = ?')
      .get('ARCHIVE2') as { archive_state: string; archive_error: string };
    db.close();
    expect(row.archive_state).toBe('failed');
    expect(row.archive_error).toContain('Sun unavailable');
  });

  it('rejects a finished game without a final state', async () => {
    finishedGame('ARCHIVE3', false);

    expect(await archiveFinishedGame('ARCHIVE3')).toBe(false);
    expect(executeDocument).not.toHaveBeenCalled();
    expect(getGame('ARCHIVE3')).not.toBeNull();
  });
});
