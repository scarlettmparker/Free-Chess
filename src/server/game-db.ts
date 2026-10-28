/**
 * @fileoverview Game database path resolution and connection setup.
 * @module server/game-db
 */

import { Database } from 'bun:sqlite';
import { chmodSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

/**
 * Resolves the game database path.
 *
 * `GAME_DB_PATH`, then `XDG_DATA_HOME`, then `~/.local/share`.
 *
 * @returns Absolute or configured path to the game database.
 */
export function resolveGameDbPath() {
  if (process.env.GAME_DB_PATH) {
    return process.env.GAME_DB_PATH;
  }

  const dataHome = process.env.XDG_DATA_HOME || join(homedir(), '.local', 'share');
  return join(dataHome, 'free-chess', 'game.db');
}

/**
 * Creates the account game tables when they are missing.
 *
 * @param db Open SQLite database handle.
 */
export function ensureGameTables(db: Database) {
  db.run(`CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL CHECK (status IN ('waiting', 'active', 'finished')),
      board_layout_id INTEGER,
      board_layout_name TEXT,
      initial_state TEXT NOT NULL,
      creator_account_id TEXT NOT NULL,
      white_account_id TEXT,
      black_account_id TEXT,
      result TEXT,
      winner_account_id TEXT,
      created_at TEXT NOT NULL,
      started_at TEXT,
      finished_at TEXT
    )`);

  db.run('CREATE INDEX IF NOT EXISTS games_white_account_idx ON games(white_account_id)');
  db.run('CREATE INDEX IF NOT EXISTS games_black_account_idx ON games(black_account_id)');
  db.run('CREATE INDEX IF NOT EXISTS games_creator_account_idx ON games(creator_account_id)');
  db.run('CREATE INDEX IF NOT EXISTS games_created_at_idx ON games(created_at DESC)');

  db.run(`CREATE TABLE IF NOT EXISTS game_moves (
      game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      ply INTEGER NOT NULL,
      move INTEGER NOT NULL,
      played_at TEXT NOT NULL,
      PRIMARY KEY (game_id, ply)
    )`);
}

/**
 * Opens the game database with the pragmas this app relies on.
 *
 * @param path Path to the game database.
 * @returns Open SQLite database handle.
 */
export function openGameDatabase(path = resolveGameDbPath()) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });

  const db = new Database(path, { create: true });
  db.run('PRAGMA journal_mode = WAL;');
  db.run('PRAGMA foreign_keys = ON;');
  db.run('PRAGMA busy_timeout = 5000;');
  ensureGameTables(db);

  try {
    chmodSync(path, 0o600);
  } catch {
    // Some filesystems do not support chmod.
  }

  return db;
}
