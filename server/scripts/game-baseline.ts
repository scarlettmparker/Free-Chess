import type { Database } from 'bun:sqlite';
import { openGameDatabase, resolveGameDbPath } from '~/server/game-db';

/**
 * Reads one count.
 *
 * @param db Open database.
 * @param sql Count query.
 * @returns Count value.
 */
function readCount(db: Database, sql: string): number {
  const row = db.query(sql).get() as { count: number };
  return Number(row.count);
}

const db = openGameDatabase();

try {
  const games = {
    total: readCount(db, 'SELECT COUNT(*) AS count FROM games'),
    waiting: readCount(db, "SELECT COUNT(*) AS count FROM games WHERE status = 'waiting'"),
    active: readCount(db, "SELECT COUNT(*) AS count FROM games WHERE status = 'active'"),
    finished: readCount(db, "SELECT COUNT(*) AS count FROM games WHERE status = 'finished'"),
  };
  const moves = {
    total: readCount(db, 'SELECT COUNT(*) AS count FROM game_moves'),
    gamesWithMoves: readCount(db, 'SELECT COUNT(DISTINCT game_id) AS count FROM game_moves'),
  };

  console.log(
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        database: resolveGameDbPath(),
        games,
        moves,
      },
      null,
      2,
    ),
  );
} finally {
  db.close();
}
