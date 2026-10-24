/**
 * @fileoverview Applies game database migrations and seeds built-in pieces.
 * @module scripts/migrate-game
 */

import { BUILTIN_DEFINITIONS } from '~/game/piece/builtins';
import { openGameDatabase, resolveGameDbPath } from '~/server/game-db';

const STARTING_FEN =
  '[17][3][5][15][11][5][3][17]/[1][1][1][13][13][13][1][1]/8/8/8/8/[0][0][12][12][12][0][0][0]/[16][2][4][14][10][4][2][16] w KQkq - 0 1';

const db = openGameDatabase();
const now = new Date().toISOString();

db.run(`CREATE TABLE IF NOT EXISTS piece_definitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_king INTEGER NOT NULL DEFAULT 0,
    promotion_targets TEXT NOT NULL DEFAULT '[]',
    promotion_ranks TEXT NOT NULL DEFAULT '[]',
    move_states TEXT NOT NULL,
    state_transition TEXT NOT NULL DEFAULT 'none',
    edge_reset INTEGER NOT NULL DEFAULT 0,
    created_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_system INTEGER NOT NULL DEFAULT 0
  )`);

db.run(`CREATE TABLE IF NOT EXISTS piece_sprites (
    piece_definition_id INTEGER PRIMARY KEY REFERENCES piece_definitions(id) ON DELETE CASCADE,
    head_key TEXT NOT NULL,
    body_key TEXT NOT NULL,
    foot_key TEXT NOT NULL
  )`);

db.run(`CREATE TABLE IF NOT EXISTS piece_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    starting_fen TEXT NOT NULL,
    created_by TEXT,
    created_at TEXT NOT NULL,
    is_system INTEGER NOT NULL DEFAULT 0
  )`);

db.run(`CREATE TABLE IF NOT EXISTS piece_set_members (
    piece_set_id INTEGER NOT NULL REFERENCES piece_sets(id) ON DELETE CASCADE,
    slot TEXT NOT NULL,
    piece_definition_id INTEGER NOT NULL REFERENCES piece_definitions(id),
    PRIMARY KEY (piece_set_id, slot)
  )`);

const insertDef = db.prepare(`
  INSERT INTO piece_definitions (
    slug, name, description, is_king, promotion_targets, promotion_ranks,
    move_states, state_transition, edge_reset, created_by, created_at, updated_at, is_system
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateDef = db.prepare(`
  UPDATE piece_definitions SET
    name = ?, description = ?, is_king = ?, promotion_targets = ?, promotion_ranks = ?,
    move_states = ?, state_transition = ?, edge_reset = ?, updated_at = ?, is_system = ?
  WHERE slug = ?
`);

const upsertSprite = db.prepare(`
  INSERT INTO piece_sprites (piece_definition_id, head_key, body_key, foot_key)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(piece_definition_id) DO UPDATE SET
    head_key = excluded.head_key,
    body_key = excluded.body_key,
    foot_key = excluded.foot_key
`);

for (const def of BUILTIN_DEFINITIONS) {
  const existing = db.query('SELECT id FROM piece_definitions WHERE slug = ?').get(def.slug) as {
    id: number;
  } | null;

  const values = [
    def.name,
    null,
    def.isKing ? 1 : 0,
    JSON.stringify(def.promotionTargets),
    JSON.stringify(def.promotionRanks),
    JSON.stringify(def.moveStates),
    def.stateTransition,
    def.edgeReset ? 1 : 0,
    null,
    now,
    now,
    1,
  ];

  if (existing) {
    updateDef.run(
      values[0],
      values[1],
      values[2],
      values[3],
      values[4],
      values[5],
      values[6],
      values[7],
      values[10],
      values[11],
      def.slug,
    );
  } else {
    insertDef.run(def.slug, ...values);
  }

  const row = db.query('SELECT id FROM piece_definitions WHERE slug = ?').get(def.slug) as {
    id: number;
  };
  upsertSprite.run(row.id, def.sprite.headKey, def.sprite.bodyKey, def.sprite.footKey);
}

const standard = db.query('SELECT id FROM piece_sets WHERE name = ?').get('Standard') as {
  id: number;
} | null;

let standardId: number;
if (standard) {
  standardId = standard.id;
} else {
  db.run(
    `INSERT INTO piece_sets (name, description, starting_fen, created_by, created_at, is_system)
     VALUES (?, ?, ?, ?, ?, 1)`,
    ['Standard', 'Standard chess plus fairy pieces', STARTING_FEN, null, now],
  );
  standardId = Number((db.query('SELECT last_insert_rowid() AS id').get() as { id: number }).id);
}

const slotBySlug: Record<string, string> = {
  pawn: 'pawn',
  knight: 'knight',
  bishop: 'bishop',
  rook: 'rook',
  queen: 'queen',
  king: 'king',
  pogo: 'pogo',
  balloon: 'balloon',
  spongebob: 'spongebob',
};

const insertMember = db.prepare(`
  INSERT OR IGNORE INTO piece_set_members (piece_set_id, slot, piece_definition_id)
  VALUES (?, ?, ?)
`);

for (const def of BUILTIN_DEFINITIONS) {
  const row = db.query('SELECT id FROM piece_definitions WHERE slug = ?').get(def.slug) as {
    id: number;
  };
  const slot = slotBySlug[def.slug];
  if (slot) {
    insertMember.run(standardId, slot, row.id);
  }
}

db.close();
console.log(`Game database ready: ${resolveGameDbPath()}`);
console.log('Piece definitions and Standard set seeded.');
