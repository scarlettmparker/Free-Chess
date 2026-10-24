import { MutationError } from '@sun/ssr';
import { openGameDatabase } from '~/server/game-db';
import { isCompassDirection } from '~/game/piece/piece-definition';
import type { PieceDefinitionDto, PieceSetDto, PieceSpriteDto } from '~/utils/piece-types';

type PieceRow = {
  /**
   * Piece id.
   */
  id: number;
  /**
   * Piece slug.
   */
  slug: string;
  /**
   * Piece name.
   */
  name: string;
  /**
   * Piece description.
   */
  description: string | null;
  /**
   * King flag.
   */
  is_king: number;
  /**
   * Promotion targets JSON.
   */
  promotion_targets: string;
  /**
   * Promotion ranks JSON.
   */
  promotion_ranks: string;
  /**
   * Move states JSON.
   */
  move_states: string;
  /**
   * State transition.
   */
  state_transition: string;
  /**
   * Edge reset flag.
   */
  edge_reset: number;
  /**
   * Creator id.
   */
  created_by: string | null;
  /**
   * Creation timestamp.
   */
  created_at: string;
  /**
   * Update timestamp.
   */
  updated_at: string;
  /**
   * System flag.
   */
  is_system: number;
  /**
   * Head key.
   */
  head_key: string;
  /**
   * Body key.
   */
  body_key: string;
  /**
   * Foot key.
   */
  foot_key: string;
};

type PieceSetRow = {
  /**
   * Set id.
   */
  id: number;
  /**
   * Set name.
   */
  name: string;
  /**
   * Set description.
   */
  description: string | null;
  /**
   * Starting FEN.
   */
  starting_fen: string;
  /**
   * Creator id.
   */
  created_by: string | null;
  /**
   * Creation timestamp.
   */
  created_at: string;
  /**
   * System flag.
   */
  is_system: number;
};

type MemberRow = {
  /**
   * Slot name.
   */
  slot: string;
  /**
   * Piece definition id.
   */
  piece_definition_id: number;
};

export type PieceInput = {
  /**
   * Piece id.
   */
  id?: number;
  /**
   * Piece slug.
   */
  slug: string;
  /**
   * Piece name.
   */
  name: string;
  /**
   * Piece description.
   */
  description?: string | null;
  /**
   * King flag.
   */
  isKing: boolean;
  /**
   * Promotion targets.
   */
  promotionTargets: number[];
  /**
   * Promotion ranks.
   */
  promotionRanks: number[];
  /**
   * Move states.
   */
  moveStates: unknown[];
  /**
   * State transition.
   */
  stateTransition: string;
  /**
   * Edge reset flag.
   */
  edgeReset: boolean;
  /**
   * Sprite keys.
   */
  sprite: PieceSpriteDto;
};

export type PieceSetInput = {
  /**
   * Set id.
   */
  id?: number;
  /**
   * Set name.
   */
  name: string;
  /**
   * Set description.
   */
  description?: string | null;
  /**
   * Starting FEN.
   */
  startingFen: string;
  /**
   * Set members.
   */
  members: { slot: string; pieceDefinitionId: number }[];
};

/**
 * Convert a database row into a piece DTO.
 *
 * @param row Database row.
 * @returns Piece DTO.
 */
function toPieceDto(row: PieceRow): PieceDefinitionDto {
  return {
    ...row,
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    isKing: Boolean(row.is_king),
    promotionTargets: JSON.parse(row.promotion_targets) as number[],
    promotionRanks: JSON.parse(row.promotion_ranks) as number[],
    moveStates: JSON.parse(row.move_states) as unknown[],
    stateTransition: row.state_transition,
    edgeReset: Boolean(row.edge_reset),
    sprite: {
      headKey: row.head_key,
      bodyKey: row.body_key,
      footKey: row.foot_key,
    },
    isSystem: Boolean(row.is_system),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * List all piece definitions.
 *
 * @returns Piece DTOs.
 */
export function listPieces(): PieceDefinitionDto[] {
  const db = openGameDatabase();
  const rows = db
    .query(
      `SELECT p.*, s.head_key, s.body_key, s.foot_key
       FROM piece_definitions p
       LEFT JOIN piece_sprites s ON s.piece_definition_id = p.id
       ORDER BY p.id`,
    )
    .all() as PieceRow[];
  db.close();
  return rows.map(toPieceDto);
}

/**
 * Get one piece definition.
 *
 * @param id Piece id.
 * @returns Piece DTO or null.
 */
export function getPiece(id: number): PieceDefinitionDto | null {
  const db = openGameDatabase();
  const row = db
    .query(
      `SELECT p.*, s.head_key, s.body_key, s.foot_key
       FROM piece_definitions p
       LEFT JOIN piece_sprites s ON s.piece_definition_id = p.id
       WHERE p.id = ?`,
    )
    .get(id) as PieceRow | null;
  db.close();
  return row ? toPieceDto(row) : null;
}

/**
 * Validate the move vectors in a piece's move states.
 *
 * @param moveStates Move states to inspect.
 * @returns Error message, or null when every vector is valid.
 */
function validateMoveStates(moveStates: unknown[]): string | null {
  for (const state of moveStates) {
    if (typeof state !== 'object' || state === null) continue;
    const vectors = (state as { vectors?: unknown }).vectors;
    if (!Array.isArray(vectors)) continue;
    for (const vector of vectors) {
      if (typeof vector !== 'object' || vector === null) continue;
      const { dx, dy, range } = vector as { dx?: unknown; dy?: unknown; range?: unknown };
      if (typeof dx !== 'number' || typeof dy !== 'number') continue;
      if (dx === 0 && dy === 0) {
        return 'A piece cannot move to its own square';
      }
      if (range === 'slide' && !isCompassDirection(dx, dy)) {
        return 'Slide moves must follow one of the eight compass directions';
      }
    }
  }
  return null;
}

/**
 * Save a piece definition.
 *
 * @param input Piece input.
 * @returns Saved piece id.
 */
export function savePiece(input: PieceInput): number {
  const validationError = validateMoveStates(input.moveStates);
  if (validationError) {
    throw new MutationError(validationError, 400);
  }
  const db = openGameDatabase();
  const slugOwner = db.query('SELECT id FROM piece_definitions WHERE slug = ?').get(input.slug) as {
    id: number;
  } | null;
  if (slugOwner && slugOwner.id !== input.id) {
    db.close();
    throw new MutationError('A piece with that identifier already exists', 400);
  }
  const now = new Date().toISOString();
  const targets = JSON.stringify(input.promotionTargets);
  const ranks = JSON.stringify(input.promotionRanks);
  const states = JSON.stringify(input.moveStates);

  if (input.id) {
    const existing = db
      .query('SELECT is_system FROM piece_definitions WHERE id = ?')
      .get(input.id) as { is_system: number } | null;
    if (!existing) {
      db.close();
      throw new Error('Piece not found');
    }
    if (existing.is_system) {
      db.close();
      throw new MutationError('System pieces cannot be edited', 400);
    }
    db.run(
      `UPDATE piece_definitions SET
        slug = ?, name = ?, description = ?, is_king = ?, promotion_targets = ?,
        promotion_ranks = ?, move_states = ?, state_transition = ?, edge_reset = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        input.slug,
        input.name,
        input.description ?? null,
        input.isKing ? 1 : 0,
        targets,
        ranks,
        states,
        input.stateTransition,
        input.edgeReset ? 1 : 0,
        now,
        input.id,
      ],
    );
    db.run(
      `INSERT INTO piece_sprites (piece_definition_id, head_key, body_key, foot_key)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(piece_definition_id) DO UPDATE SET
         head_key = excluded.head_key,
         body_key = excluded.body_key,
         foot_key = excluded.foot_key`,
      [input.id, input.sprite.headKey, input.sprite.bodyKey, input.sprite.footKey],
    );
    db.close();
    return input.id;
  }

  db.run(
    `INSERT INTO piece_definitions (
      slug, name, description, is_king, promotion_targets, promotion_ranks,
      move_states, state_transition, edge_reset, created_by, created_at, updated_at, is_system
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      input.slug,
      input.name,
      input.description ?? null,
      input.isKing ? 1 : 0,
      targets,
      ranks,
      states,
      input.stateTransition,
      input.edgeReset ? 1 : 0,
      null,
      now,
      now,
    ],
  );
  const id = Number((db.query('SELECT last_insert_rowid() AS id').get() as { id: number }).id);
  db.run(
    `INSERT INTO piece_sprites (piece_definition_id, head_key, body_key, foot_key)
     VALUES (?, ?, ?, ?)`,
    [id, input.sprite.headKey, input.sprite.bodyKey, input.sprite.footKey],
  );
  db.close();
  return id;
}

/**
 * Delete a non-system piece.
 *
 * @param id Piece id.
 * @returns True if deleted.
 */
export function deletePiece(id: number): boolean {
  const db = openGameDatabase();
  const existing = db.query('SELECT is_system FROM piece_definitions WHERE id = ?').get(id) as {
    is_system: number;
  } | null;
  if (!existing || existing.is_system) {
    db.close();
    return false;
  }
  db.run('DELETE FROM piece_definitions WHERE id = ?', [id]);
  db.close();
  return true;
}

/**
 * Convert a database set row into a DTO.
 *
 * @param setId Set id.
 * @param db Database handle.
 * @returns Piece set DTO.
 */
function toSetDto(setId: number, db: ReturnType<typeof openGameDatabase>): PieceSetDto {
  const set = db.query('SELECT * FROM piece_sets WHERE id = ?').get(setId) as PieceSetRow;
  const members = db
    .query('SELECT slot, piece_definition_id FROM piece_set_members WHERE piece_set_id = ?')
    .all(setId) as MemberRow[];
  return {
    id: set.id,
    name: set.name,
    description: set.description,
    startingFen: set.starting_fen,
    isSystem: Boolean(set.is_system),
    createdAt: set.created_at,
    members: members.map((member) => ({
      slot: member.slot,
      pieceDefinitionId: member.piece_definition_id,
    })),
  };
}

/**
 * List all piece sets.
 *
 * @returns Piece set DTOs.
 */
export function listSets(): PieceSetDto[] {
  const db = openGameDatabase();
  const ids = db.query('SELECT id FROM piece_sets ORDER BY id').all() as { id: number }[];
  const sets = ids.map((row) => toSetDto(row.id, db));
  db.close();
  return sets;
}

/**
 * Get one piece set.
 *
 * @param id Set id.
 * @returns Piece set DTO or null.
 */
export function getSet(id: number): PieceSetDto | null {
  const db = openGameDatabase();
  const exists = db.query('SELECT id FROM piece_sets WHERE id = ?').get(id);
  if (!exists) {
    db.close();
    return null;
  }
  const set = toSetDto(id, db);
  db.close();
  return set;
}

/**
 * Save a piece set.
 *
 * @param input Piece set input.
 * @returns Saved set id.
 */
export function saveSet(input: PieceSetInput): number {
  const db = openGameDatabase();
  const now = new Date().toISOString();

  let id: number;
  if (input.id) {
    const existing = db.query('SELECT is_system FROM piece_sets WHERE id = ?').get(input.id) as {
      is_system: number;
    } | null;
    if (!existing) {
      db.close();
      throw new Error('Piece set not found');
    }
    db.run('UPDATE piece_sets SET name = ?, description = ?, starting_fen = ? WHERE id = ?', [
      input.name,
      input.description ?? null,
      input.startingFen,
      input.id,
    ]);
    db.run('DELETE FROM piece_set_members WHERE piece_set_id = ?', [input.id]);
    id = input.id;
  } else {
    db.run(
      `INSERT INTO piece_sets (name, description, starting_fen, created_by, created_at, is_system)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [input.name, input.description ?? null, input.startingFen, null, now],
    );
    id = Number((db.query('SELECT last_insert_rowid() AS id').get() as { id: number }).id);
  }

  const insertMember = db.prepare(
    `INSERT INTO piece_set_members (piece_set_id, slot, piece_definition_id) VALUES (?, ?, ?)`,
  );
  for (const member of input.members) {
    insertMember.run(id, member.slot, member.pieceDefinitionId);
  }

  db.close();
  return id;
}

/**
 * Delete a non-system piece set.
 *
 * @param id Set id.
 * @returns True if deleted.
 */
export function deleteSet(id: number): boolean {
  const db = openGameDatabase();
  const existing = db.query('SELECT is_system FROM piece_sets WHERE id = ?').get(id) as {
    is_system: number;
  } | null;
  if (!existing || existing.is_system) {
    db.close();
    return false;
  }
  db.run('DELETE FROM piece_sets WHERE id = ?', [id]);
  db.close();
  return true;
}
