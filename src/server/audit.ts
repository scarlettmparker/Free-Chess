/**
 * @fileoverview Audit log storage in the auth database.
 * @module server/audit
 */

import type { Database } from 'bun:sqlite';
import type { AuditEvent, AuditOutcome } from '~/utils/audit-types';
import { openAuthDatabase, resolveAuthDbPath } from './db.ts';

const schema = `
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at INTEGER NOT NULL,
  actor_id TEXT,
  actor_email TEXT,
  action TEXT NOT NULL,
  target TEXT,
  outcome TEXT NOT NULL,
  detail TEXT,
  ip TEXT
);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log (created_at DESC);
`;

/**
 * Actor attached to an audit entry.
 */
export type AuditActor = {
  /**
   * User id.
   */
  id?: string | null;
  /**
   * Email address.
   */
  email?: string | null;
};

/**
 * Fields accepted when recording an entry.
 */
export type AuditInput = {
  /**
   * Dotted action name.
   */
  action: string;
  /**
   * Whether the action completed.
   */
  outcome: AuditOutcome;
  /**
   * Caller, when known.
   */
  actor?: AuditActor | null;
  /**
   * Affected resource.
   */
  target?: string | null;
  /**
   * Error text or extra context.
   */
  detail?: string | null;
  /**
   * Caller IP address.
   */
  ip?: string | null;
};

/**
 * Raw audit row.
 */
type AuditRow = {
  /**
   * Row id.
   */
  id: number;
  /**
   * Unix timestamp in milliseconds.
   */
  created_at: number;
  /**
   * Actor user id.
   */
  actor_id: string | null;
  /**
   * Actor email.
   */
  actor_email: string | null;
  /**
   * Dotted action name.
   */
  action: string;
  /**
   * Affected resource.
   */
  target: string | null;
  /**
   * Outcome string.
   */
  outcome: string;
  /**
   * Extra context.
   */
  detail: string | null;
  /**
   * Caller IP address.
   */
  ip: string | null;
};

let database: Database | null = null;
let databasePath = '';

/**
 * Opens the audit connection and creates its table.
 *
 * @returns Open database handle.
 */
function getDatabase() {
  const path = resolveAuthDbPath();
  if (database && databasePath === path) return database;

  if (database) database.close();
  database = openAuthDatabase(path);
  database.exec(schema);
  databasePath = path;
  return database;
}

/**
 * Creates the audit table.
 */
export function migrateAudit() {
  getDatabase();
}

/**
 * Records one entry. Failures are logged and never block the action.
 *
 * @param input Entry to store.
 */
export function recordAudit(input: AuditInput) {
  try {
    getDatabase()
      .query(
        `INSERT INTO audit_log
           (created_at, actor_id, actor_email, action, target, outcome, detail, ip)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        Date.now(),
        input.actor?.id ?? null,
        input.actor?.email ?? null,
        input.action,
        input.target ?? null,
        input.outcome,
        input.detail ?? null,
        input.ip ?? null,
      );
  } catch (error) {
    console.error('Failed to write audit entry:', error);
  }
}

/**
 * Reads the newest entries.
 *
 * @param limit Maximum rows to return.
 * @returns Entries newest first.
 */
export function listAudit(limit = 200): AuditEvent[] {
  const rows = getDatabase()
    .query(
      `SELECT id, created_at, actor_id, actor_email, action, target, outcome, detail, ip
       FROM audit_log
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
    )
    .all(limit) as unknown as AuditRow[];

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    actorId: row.actor_id,
    actorEmail: row.actor_email,
    action: row.action,
    target: row.target,
    outcome: row.outcome === 'success' ? 'success' : 'failure',
    detail: row.detail,
    ip: row.ip,
  }));
}

/**
 * Deletes entries older than a cutoff.
 *
 * @param days Age in days.
 * @returns Number of removed rows.
 */
export function pruneAudit(days = 180) {
  const cutoff = Date.now() - days * 86_400_000;
  const result = getDatabase().query('DELETE FROM audit_log WHERE created_at < ?').run(cutoff);
  return Number(result.changes);
}
