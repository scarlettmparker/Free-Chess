import { describe, expect, it } from 'vitest';
import { buildGameArchiveInput } from '~/server/game-archive';
import type { GameDto } from '~/server/games';
import type { SerializedGameState } from '~/utils/game-serialize';

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

const finalState = {
  ...initialState,
  gameOver: true,
  moveHistory: [100, 200],
} as SerializedGameState;

const moves: GameDto['moves'] = [
  { move: 100, ply: 0, playedAt: '2026-01-01T00:01:10.000Z' },
  { move: 200, ply: 1, playedAt: '2026-01-01T00:01:20.000Z' },
];

/**
 * Builds a stored game for archive tests.
 *
 * @param overrides Fields to replace.
 * @returns Stored game.
 */
function makeGame(overrides: Partial<GameDto> = {}): GameDto {
  return {
    id: 'ARCHIVE',
    code: 'ARCHIVE',
    status: 'finished',
    boardLayoutId: '1',
    boardLayoutName: 'Standard',
    initialState,
    finalState,
    creatorAccountId: 'creator-account',
    whiteAccountId: 'white-account',
    blackAccountId: 'black-account',
    result: 'white-checkmate',
    winnerAccountId: 'white-account',
    moveCount: moves.length,
    createdAt: '2026-01-01T00:00:00.000Z',
    startedAt: '2026-01-01T00:01:00.000Z',
    finishedAt: '2026-01-01T00:02:00.000Z',
    archivedAt: null,
    moves,
    ...overrides,
  };
}

describe('game archive contract', () => {
  it('maps a finished live game to an archive input', () => {
    const game = makeGame();
    const input = buildGameArchiveInput({
      game,
      moves: game.moves,
      boardLayoutId: 'sun-layout',
    });

    expect(input).toMatchObject({
      code: 'ARCHIVE',
      boardLayoutId: 'sun-layout',
      boardLayoutName: 'Standard',
      creatorAccountId: 'creator-account',
      whiteAccountId: 'white-account',
      blackAccountId: 'black-account',
      result: 'white-checkmate',
      winnerAccountId: 'white-account',
      createdAt: '2026-01-01T00:00:00.000Z',
      startedAt: '2026-01-01T00:01:00.000Z',
      finishedAt: '2026-01-01T00:02:00.000Z',
    });
    expect(input.initialState).toBe(initialState);
    expect(input.finalState).toBe(finalState);
    expect(input.moves).toEqual(moves);
  });

  it('rejects a game without a finish time', () => {
    expect(() =>
      buildGameArchiveInput({
        game: makeGame({ finishedAt: null }),
        moves: [],
      }),
    ).toThrow('Cannot archive a game without a finish time');
  });

  it('rejects a game without a final state', () => {
    expect(() =>
      buildGameArchiveInput({
        game: makeGame({ finalState: null }),
        moves: [],
      }),
    ).toThrow('Cannot archive a game without a final state');
  });
});
