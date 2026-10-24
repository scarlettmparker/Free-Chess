/**
 * @fileoverview Auth database path resolution and connection setup.
 * @module server/db
 */

import { Database } from 'bun:sqlite';
import { chmodSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

/**
 * Resolves the auth database path.
 *
 * `AUTH_DB_PATH` wins, then `XDG_DATA_HOME`, then `~/.local/share`.
 *
 * @returns Absolute or configured path to the auth database.
 */
export function resolveAuthDbPath() {
  if (process.env.AUTH_DB_PATH) {
    return process.env.AUTH_DB_PATH;
  }

  const dataHome = process.env.XDG_DATA_HOME || join(homedir(), '.local', 'share');
  return join(dataHome, 'free-chess', 'auth.db');
}

/**
 * Opens the auth database with the pragmas this app relies on.
 *
 * @param path Path to the auth database.
 * @returns Open SQLite database handle.
 */
export function openAuthDatabase(path = resolveAuthDbPath()) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });

  const db = new Database(path, { create: true });
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA busy_timeout = 5000;');

  try {
    chmodSync(path, 0o600);
  } catch {
    // Some filesystems do not support chmod.
  }

  return db;
}
