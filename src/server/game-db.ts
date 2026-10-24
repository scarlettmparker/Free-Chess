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

  try {
    chmodSync(path, 0o600);
  } catch {
    // Some filesystems do not support chmod.
  }

  return db;
}
