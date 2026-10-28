/**
 * @fileoverview Applies game database migrations and seeds built-in pieces.
 * @module scripts/migrate-game
 */

import { BUILTIN_DEFINITIONS } from '~/game/piece/builtins';
import { ensureGameTables, openGameDatabase, resolveGameDbPath } from '~/server/game-db';

const STARTING_FEN =
  '[7][3][5][9][11][5][3][7]/[1][1][1][1][1][1][1][1]/8/8/8/8/[0][0][0][0][0][0][0][0]/[6][2][4][8][10][4][2][6] w KQkq - 0 1';

const db = openGameDatabase();
const now = new Date().toISOString();

ensureGameTables(db);

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
  const existing = db
    .query('SELECT id, is_system FROM piece_definitions WHERE slug = ?')
    .get(def.slug) as { id: number; is_system: number } | null;

  const system = !['pogo', 'balloon', 'spongebob'].includes(def.slug);

  if (existing && !system) {
    if (existing.is_system) {
      db.run('UPDATE piece_definitions SET is_system = 0, updated_at = ? WHERE slug = ?', [
        now,
        def.slug,
      ]);
    }
    const row = { id: existing.id };
    upsertSprite.run(row.id, def.sprite.headKey, def.sprite.bodyKey, def.sprite.footKey);
    continue;
  }

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
    system ? 1 : 0,
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
    ['Standard', 'Standard chess starting position', STARTING_FEN, null, now],
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

db.run(`CREATE TABLE IF NOT EXISTS board_layouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    placements TEXT NOT NULL,
    created_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_system INTEGER NOT NULL DEFAULT 0
  )`);

const engineBaseToSlug: Record<number, string> = {
  0: 'pawn',
  2: 'knight',
  4: 'bishop',
  6: 'rook',
  8: 'queen',
  10: 'king',
  12: 'pogo',
  14: 'balloon',
  16: 'spongebob',
};

/**
 * Convert the standard piece id FEN board into layout placements.
 * Engine ids are even for white and odd for black.
 */
function standardPlacements(): { definitionId: number; color: 0 | 1; square: number }[] {
  const board = STARTING_FEN.split(' ')[0];
  const idBySlug = new Map<string, number>();
  const rows = db.query('SELECT id, slug FROM piece_definitions').all() as {
    id: number;
    slug: string;
  }[];
  for (const row of rows) idBySlug.set(row.slug, row.id);

  const placements: { definitionId: number; color: 0 | 1; square: number }[] = [];
  let rank = 0;
  let file = 0;
  for (let i = 0; i < board.length; i++) {
    const char = board[i];
    if (char === '/') {
      rank++;
      file = 0;
      continue;
    }
    if (char >= '0' && char <= '9') {
      file += Number(char);
      continue;
    }
    if (char === '[') {
      const end = board.indexOf(']', i);
      const engineId = Number(board.slice(i + 1, end));
      const color = engineId % 2 === 0 ? 0 : 1;
      const slug = engineBaseToSlug[engineId - color];
      const definitionId = slug ? (idBySlug.get(slug) ?? 0) : 0;
      if (!definitionId)
        throw new Error(`Cannot seed standard layout, unknown engine id ${engineId}`);
      placements.push({ definitionId, color: color as 0 | 1, square: rank * 8 + file });
      file++;
      i = end;
    }
  }
  return placements;
}

const standardLayout = db.query('SELECT id FROM board_layouts WHERE slug = ?').get('standard') as {
  id: number;
} | null;

if (!standardLayout) {
  db.run(
    `INSERT INTO board_layouts (slug, name, description, placements, created_by, created_at, updated_at, is_system)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      'standard',
      'Standard',
      'Standard chess starting position',
      JSON.stringify(standardPlacements()),
      null,
      now,
      now,
    ],
  );
}

db.close();
console.log(`Game database ready: ${resolveGameDbPath()}`);
console.log('Piece definitions and Standard set seeded.');
