import { randomInt } from 'node:crypto';
import type { SerializedGameState } from '~/utils/game-serialize';
import { openGameDatabase } from '~/server/game-db';

/**
 * Lifecycle state of a stored game.
 */
export type GameStatus = 'waiting' | 'active' | 'finished';

/**
 * Final result recorded by the engine.
 */
export type GameOutcome = 'white-checkmate' | 'black-checkmate' | 'stalemate' | 'draw';

/**
 * Colour held by a player.
 */
export type GameColor = 'white' | 'black';

/**
 * Stored game row.
 */
type GameRow = {
  /**
   * Seven character game id.
   */
  id: string;
  /**
   * Lifecycle state.
   */
  status: string;
  /**
   * Local board layout id.
   */
  board_layout_id: number | null;
  /**
   * Board layout display name.
   */
  board_layout_name: string | null;
  /**
   * Serialized starting position.
   */
  initial_state: string;
  /**
   * Account that created the game.
   */
  creator_account_id: string;
  /**
   * Account holding white.
   */
  white_account_id: string | null;
  /**
   * Account holding black.
   */
  black_account_id: string | null;
  /**
   * Final engine result.
   */
  result: string | null;
  /**
   * Account that won.
   */
  winner_account_id: string | null;
  /**
   * Creation timestamp.
   */
  created_at: string;
  /**
   * Time the second seat was filled.
   */
  started_at: string | null;
  /**
   * Time the game finished.
   */
  finished_at: string | null;
};

/**
 * Public game shape used by loaders and the worker.
 */
export type GameDto = {
  /**
   * Seven character game id.
   */
  id: string;
  /**
   * Lifecycle state.
   */
  status: GameStatus;
  /**
   * Local board layout id.
   */
  boardLayoutId: number | null;
  /**
   * Board layout display name.
   */
  boardLayoutName: string | null;
  /**
   * Serialized starting position.
   */
  initialState: SerializedGameState;
  /**
   * Account that created the game.
   */
  creatorAccountId: string;
  /**
   * Account holding white.
   */
  whiteAccountId: string | null;
  /**
   * Account holding black.
   */
  blackAccountId: string | null;
  /**
   * Final engine result.
   */
  result: GameOutcome | null;
  /**
   * Account that won.
   */
  winnerAccountId: string | null;
  /**
   * Creation timestamp.
   */
  createdAt: string;
  /**
   * Time the second seat was filled.
   */
  startedAt: string | null;
  /**
   * Time the game finished.
   */
  finishedAt: string | null;
};

/**
 * Stored move row.
 */
export type GameMoveDto = {
  /**
   * Encoded move offset.
   */
  move: number;
  /**
   * Zero based half move index.
   */
  ply: number;
  /**
   * Time the move was accepted.
   */
  playedAt: string;
};

/**
 * Input required to create an account game.
 */
export type CreateGameInput = {
  /**
   * Local board layout id.
   */
  boardLayoutId: number | null;
  /**
   * Board layout display name.
   */
  boardLayoutName: string | null;
  /**
   * Serialized starting position.
   */
  initialState: SerializedGameState;
  /**
   * Account that created the game.
   */
  creatorAccountId: string;
};

/**
 * Page of games for one account.
 */
export type GamePage = {
  /**
   * Games on this page.
   */
  games: GameDto[];
  /**
   * Total games for the account.
   */
  total: number;
  /**
   * Zero based page index.
   */
  page: number;
  /**
   * Page size.
   */
  pageSize: number;
  /**
   * Total number of pages.
   */
  totalPages: number;
};

/**
 * Win loss and draw totals for one account.
 */
export type AccountGameRecord = {
  /**
   * Finished games won.
   */
  wins: number;
  /**
   * Finished games lost.
   */
  losses: number;
  /**
   * Finished games drawn.
   */
  draws: number;
  /**
   * Finished games played.
   */
  played: number;
};

/**
 * Result of binding a socket account to a game.
 */
export type SeatAssignment =
  | {
      /**
       * Game does not exist.
       */
      status: 'not-found';
    }
  | {
      /**
       * Account already holds a seat.
       */
      status: 'existing';
      /**
       * Colour held by the account.
       */
      color: GameColor;
    }
  | {
      /**
       * Account filled the second seat.
       */
      status: 'joined';
      /**
       * Colour assigned to the account.
       */
      color: GameColor;
    }
  | {
      /**
       * Account is watching only.
       */
      status: 'spectator';
    };

/**
 * Characters used by generated game ids.
 */
const GAME_ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Number of id attempts before creation fails.
 */
const GAME_ID_ATTEMPTS = 8;

/**
 * Convert a database row into a game DTO.
 *
 * @param row Stored game row.
 * @returns Game DTO.
 */
function toGameDto(row: GameRow): GameDto {
  return {
    id: row.id,
    status: row.status as GameStatus,
    boardLayoutId: row.board_layout_id,
    boardLayoutName: row.board_layout_name,
    initialState: JSON.parse(row.initial_state) as SerializedGameState,
    creatorAccountId: row.creator_account_id,
    whiteAccountId: row.white_account_id,
    blackAccountId: row.black_account_id,
    result: row.result as GameOutcome | null,
    winnerAccountId: row.winner_account_id,
    createdAt: row.created_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

/**
 * Generates a seven character game id.
 *
 * @returns Game id using upper case letters lower case letters and digits.
 */
export function generateGameId(): string {
  let id = '';
  for (let index = 0; index < 7; index += 1) {
    id += GAME_ID_ALPHABET[randomInt(GAME_ID_ALPHABET.length)];
  }
  return id;
}

/**
 * Creates a stored game.
 *
 * @param input Game fields.
 * @param options Optional id factory for tests.
 * @returns Generated game id.
 */
export function createGame(
  input: CreateGameInput,
  options: { idFactory?: () => string } = {},
): string {
  const db = openGameDatabase();
  const now = new Date().toISOString();
  const initial = JSON.stringify(input.initialState);
  const nextId = options.idFactory ?? generateGameId;

  try {
    for (let attempt = 0; attempt < GAME_ID_ATTEMPTS; attempt += 1) {
      const id = nextId();
      const result = db.run(
        `INSERT OR IGNORE INTO games (
          id, status, board_layout_id, board_layout_name, initial_state,
          creator_account_id, white_account_id, black_account_id, result,
          winner_account_id, created_at, started_at, finished_at
        ) VALUES (?, 'waiting', ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, NULL, NULL)`,
        [
          id,
          input.boardLayoutId,
          input.boardLayoutName,
          initial,
          input.creatorAccountId,
          input.creatorAccountId,
          now,
        ],
      );
      if (result.changes > 0) return id;
    }
  } finally {
    db.close();
  }

  throw new Error('Could not allocate a game id');
}

/**
 * Reads one stored game.
 *
 * @param id Game id.
 * @returns Game DTO or null.
 */
export function getGame(id: string): GameDto | null {
  const db = openGameDatabase();
  const row = db.query('SELECT * FROM games WHERE id = ?').get(id) as GameRow | null;
  db.close();
  return row ? toGameDto(row) : null;
}

/**
 * Reads the moves stored for a game.
 *
 * @param gameId Game id.
 * @returns Moves ordered by ply.
 */
export function listMoves(gameId: string): GameMoveDto[] {
  const db = openGameDatabase();
  const rows = db
    .query('SELECT move, ply, played_at FROM game_moves WHERE game_id = ? ORDER BY ply ASC')
    .all(gameId) as Array<{ move: number; ply: number; played_at: string }>;
  db.close();

  return rows.map((row) => ({
    move: row.move,
    ply: row.ply,
    playedAt: row.played_at,
  }));
}

/**
 * Lists games where an account is the creator or holds a seat.
 *
 * @param accountId Account id.
 * @param page Zero based page index.
 * @param pageSize Page size.
 * @returns Page of games.
 */
export function listGamesForAccount(accountId: string, page = 0, pageSize = 20): GamePage {
  const safePage = Number.isFinite(page) ? Math.max(0, Math.floor(page)) : 0;
  const safeSize = Number.isFinite(pageSize)
    ? Math.min(100, Math.max(1, Math.floor(pageSize)))
    : 20;
  const db = openGameDatabase();

  try {
    const where = 'creator_account_id = ? OR white_account_id = ? OR black_account_id = ?';
    const total = Number(
      (
        db
          .query(`SELECT COUNT(*) AS total FROM games WHERE ${where}`)
          .get(accountId, accountId, accountId) as { total: number }
      ).total,
    );
    const rows = db
      .query(
        `SELECT * FROM games WHERE ${where}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
      )
      .all(accountId, accountId, accountId, safeSize, safePage * safeSize) as GameRow[];

    return {
      games: rows.map(toGameDto),
      total,
      page: safePage,
      pageSize: safeSize,
      totalPages: Math.ceil(total / safeSize) || 1,
    };
  } finally {
    db.close();
  }
}

/**
 * Binds an account to a waiting game or returns its existing seat.
 *
 * @param gameId Game id.
 * @param accountId Account requesting a seat.
 * @returns Seat assignment result.
 */
export function assignSeat(gameId: string, accountId: string): SeatAssignment {
  const db = openGameDatabase();
  db.run('BEGIN IMMEDIATE');

  try {
    const row = db.query('SELECT * FROM games WHERE id = ?').get(gameId) as GameRow | null;
    if (!row) {
      db.run('ROLLBACK');
      return { status: 'not-found' };
    }

    if (row.white_account_id === accountId) {
      db.run('COMMIT');
      return { status: 'existing', color: 'white' };
    }
    if (row.black_account_id === accountId) {
      db.run('COMMIT');
      return { status: 'existing', color: 'black' };
    }

    const now = new Date().toISOString();

    if (row.status === 'waiting' && row.white_account_id === null) {
      if (row.creator_account_id === accountId) {
        db.run('UPDATE games SET white_account_id = ? WHERE id = ?', [accountId, gameId]);
        db.run('COMMIT');
        return { status: 'existing', color: 'white' };
      }

      db.run(
        `UPDATE games
         SET status = 'active', white_account_id = ?, black_account_id = ?,
             started_at = ?
         WHERE id = ?`,
        [row.creator_account_id, accountId, now, gameId],
      );
      db.run('COMMIT');
      return { status: 'joined', color: 'black' };
    }

    if (row.status === 'waiting' && row.black_account_id === null) {
      db.run(
        `UPDATE games
         SET status = 'active', black_account_id = ?, started_at = ?
         WHERE id = ?`,
        [accountId, now, gameId],
      );
      db.run('COMMIT');
      return { status: 'joined', color: 'black' };
    }

    db.run('COMMIT');
    return { status: 'spectator' };
  } catch (error) {
    db.run('ROLLBACK');
    throw error;
  } finally {
    db.close();
  }
}

/**
 * Appends an accepted move to a game.
 *
 * @param gameId Game id.
 * @param move Encoded move offset.
 * @returns Stored ply and timestamp.
 */
export function recordMove(gameId: string, move: number): { ply: number; playedAt: string } {
  const db = openGameDatabase();
  const playedAt = new Date().toISOString();

  try {
    const next = db
      .query('SELECT COALESCE(MAX(ply), -1) + 1 AS ply FROM game_moves WHERE game_id = ?')
      .get(gameId) as { ply: number };
    db.run('INSERT INTO game_moves (game_id, ply, move, played_at) VALUES (?, ?, ?, ?)', [
      gameId,
      next.ply,
      move,
      playedAt,
    ]);
    return { ply: next.ply, playedAt };
  } finally {
    db.close();
  }
}

/**
 * Records the final result of a game.
 *
 * @param gameId Game id.
 * @param result Engine result.
 * @param winnerAccountId Winning account or null for a draw.
 * @returns True when the game moved to finished.
 */
export function finishGame(
  gameId: string,
  result: GameOutcome,
  winnerAccountId: string | null,
): boolean {
  const db = openGameDatabase();
  const finishedAt = new Date().toISOString();

  try {
    const updated = db.run(
      `UPDATE games
       SET status = 'finished', result = ?, winner_account_id = ?, finished_at = ?
       WHERE id = ? AND status <> 'finished'`,
      [result, winnerAccountId, finishedAt, gameId],
    );
    return updated.changes > 0;
  } finally {
    db.close();
  }
}

/**
 * Counts finished wins losses and draws for an account.
 *
 * @param accountId Account id.
 * @returns Result totals.
 */
export function countResultsForAccount(accountId: string): AccountGameRecord {
  const db = openGameDatabase();

  try {
    const row = db
      .query(
        `SELECT
           COALESCE(SUM(CASE WHEN winner_account_id = ? THEN 1 ELSE 0 END), 0) AS wins,
           COALESCE(SUM(CASE WHEN status = 'finished' AND winner_account_id IS NOT NULL
             AND winner_account_id <> ? THEN 1 ELSE 0 END), 0) AS losses,
           COALESCE(SUM(CASE WHEN status = 'finished' AND winner_account_id IS NULL
             THEN 1 ELSE 0 END), 0) AS draws
         FROM games
         WHERE white_account_id = ? OR black_account_id = ?`,
      )
      .get(accountId, accountId, accountId, accountId) as {
      wins: number;
      losses: number;
      draws: number;
    };

    const wins = Number(row.wins);
    const losses = Number(row.losses);
    const draws = Number(row.draws);
    return { wins, losses, draws, played: wins + losses + draws };
  } finally {
    db.close();
  }
}
