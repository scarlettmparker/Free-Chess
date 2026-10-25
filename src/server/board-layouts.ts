import { MutationError } from '@sun/ssr';
import { BUILTIN_DEFINITIONS } from '~/game/piece/builtins';
import type { PieceDefinition } from '~/game/piece/piece-definition';
import { validateBoardLayout } from '~/game/board/validate-layout';
import type { BoardPlacement } from '~/game/board/validate-layout';
import { openGameDatabase } from '~/server/game-db';

type BoardLayoutRow = {
  /**
   * Layout id.
   */
  id: number;
  /**
   * Layout slug.
   */
  slug: string;
  /**
   * Layout name.
   */
  name: string;
  /**
   * Layout description.
   */
  description: string | null;
  /**
   * Placements JSON.
   */
  placements: string;
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
};

export type BoardLayoutDto = {
  /**
   * Layout id.
   */
  id: number;
  /**
   * Layout slug.
   */
  slug: string;
  /**
   * Layout name.
   */
  name: string;
  /**
   * Layout description.
   */
  description: string | null;
  /**
   * Piece placements.
   */
  placements: BoardPlacement[];
  /**
   * Whether this is a system layout.
   */
  isSystem: boolean;
  /**
   * Creation timestamp.
   */
  createdAt: string;
  /**
   * Update timestamp.
   */
  updatedAt: string;
};

export type BoardLayoutInput = {
  /**
   * Layout id.
   */
  id?: number;
  /**
   * Layout slug.
   */
  slug: string;
  /**
   * Layout name.
   */
  name: string;
  /**
   * Layout description.
   */
  description?: string | null;
  /**
   * Piece placements.
   */
  placements: BoardPlacement[];
};

/**
 * Loaded layout with engine definitions for mounting.
 */
export type LoadedLayout = {
  /**
   * Placements to mount.
   */
  placements: BoardPlacement[];
  /**
   * Definitions referenced by the placements.
   */
  definitions: PieceDefinition[];
};

const bySlug = new Map(BUILTIN_DEFINITIONS.map((def) => [def.slug, def]));

/**
 * Convert a database row into a layout DTO.
 *
 * @param row Database row.
 * @returns Layout DTO.
 */
function toLayoutDto(row: BoardLayoutRow): BoardLayoutDto {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    placements: JSON.parse(row.placements) as BoardPlacement[],
    isSystem: Boolean(row.is_system),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Shape check for one placement entry.
 *
 * @param placement Placement to inspect.
 * @returns True when the entry has the expected shape.
 */
function isPlacementShape(placement: unknown): placement is BoardPlacement {
  if (typeof placement !== 'object' || placement === null) return false;
  const entry = placement as { definitionId?: unknown; color?: unknown; square?: unknown };
  return (
    Number.isInteger(entry.definitionId) &&
    (entry.color === 0 || entry.color === 1) &&
    Number.isInteger(entry.square)
  );
}

/**
 * Load engine definitions for placements using an open database handle.
 *
 * @param db Open database handle.
 * @param placements Placements to resolve.
 * @returns Definitions, or null when a piece is missing.
 */
function loadLayoutDefinitions(
  db: ReturnType<typeof openGameDatabase>,
  placements: BoardPlacement[],
): PieceDefinition[] | null {
  const ids = [...new Set(placements.map((placement) => placement.definitionId))];
  const definitions: PieceDefinition[] = [];
  for (const definitionId of ids) {
    const defRow = db
      .query(
        `SELECT p.*, s.head_key, s.body_key, s.foot_key
         FROM piece_definitions p
         LEFT JOIN piece_sprites s ON s.piece_definition_id = p.id
         WHERE p.id = ?`,
      )
      .get(definitionId) as {
      id: number;
      slug: string;
      name: string;
      is_king: number;
      promotion_targets: string;
      promotion_ranks: string;
      move_states: string;
      state_transition: string;
      edge_reset: number;
      head_key: string;
      body_key: string;
      foot_key: string;
    } | null;
    if (!defRow) return null;
    const builtin = bySlug.get(defRow.slug);
    const base = {
      id: defRow.id,
      slug: defRow.slug,
      name: defRow.name,
      isKing: Boolean(defRow.is_king),
      promotionTargets: JSON.parse(defRow.promotion_targets) as number[],
      promotionRanks: JSON.parse(defRow.promotion_ranks) as number[],
      moveStates: JSON.parse(defRow.move_states) as PieceDefinition['moveStates'],
      stateTransition: defRow.state_transition as PieceDefinition['stateTransition'],
      edgeReset: Boolean(defRow.edge_reset),
      sprite: {
        headKey: defRow.head_key,
        bodyKey: defRow.body_key,
        footKey: defRow.foot_key,
      },
    };
    definitions.push(builtin ? { ...base, legacy: builtin.legacy } : base);
  }
  return definitions;
}

/**
 * Load a layout with engine definitions for mounting.
 *
 * @param id Layout id.
 * @returns Placements and definitions, or null when missing.
 */
export function loadLayout(id: number): LoadedLayout | null {
  const db = openGameDatabase();
  const row = db.query('SELECT * FROM board_layouts WHERE id = ?').get(id) as BoardLayoutRow | null;
  if (!row) {
    db.close();
    return null;
  }
  const placements = JSON.parse(row.placements) as BoardPlacement[];
  const definitions = loadLayoutDefinitions(db, placements);
  db.close();
  if (!definitions) return null;
  return { placements, definitions };
}

/**
 * List all board layouts.
 *
 * @returns Layout DTOs.
 */
export function listLayouts(): BoardLayoutDto[] {
  const db = openGameDatabase();
  const rows = db.query('SELECT * FROM board_layouts ORDER BY id').all() as BoardLayoutRow[];
  db.close();
  return rows.map(toLayoutDto);
}

/**
 * Get one board layout.
 *
 * @param id Layout id.
 * @returns Layout DTO or null.
 */
export function getLayout(id: number): BoardLayoutDto | null {
  const db = openGameDatabase();
  const row = db.query('SELECT * FROM board_layouts WHERE id = ?').get(id) as BoardLayoutRow | null;
  db.close();
  return row ? toLayoutDto(row) : null;
}

/**
 * Save a board layout.
 *
 * @param input Layout input.
 * @returns Saved layout id.
 */
export function saveLayout(input: BoardLayoutInput): number {
  if (!input.name.trim()) {
    throw new MutationError('Layout name is required', 400);
  }
  if (!Array.isArray(input.placements) || input.placements.length === 0) {
    throw new MutationError('Layout needs at least one piece', 400);
  }
  if (!input.placements.every(isPlacementShape)) {
    throw new MutationError('Invalid placements', 400);
  }
  const db = openGameDatabase();
  const slugOwner = db.query('SELECT id FROM board_layouts WHERE slug = ?').get(input.slug) as {
    id: number;
  } | null;
  if (slugOwner && slugOwner.id !== input.id) {
    db.close();
    throw new MutationError('A layout with that identifier already exists', 400);
  }

  const loaded = loadLayoutDefinitions(db, input.placements);
  if (!loaded) {
    db.close();
    throw new MutationError('Layout refers to unknown pieces', 400);
  }
  const result = validateBoardLayout(input.placements, loaded);
  if (!result.ok) {
    db.close();
    throw new MutationError(`Illegal starting position: ${result.errors.join(', ')}`, 400);
  }

  const now = new Date().toISOString();
  const placements = JSON.stringify(input.placements);
  if (input.id) {
    const existing = db.query('SELECT is_system FROM board_layouts WHERE id = ?').get(input.id) as {
      is_system: number;
    } | null;
    if (!existing) {
      db.close();
      throw new Error('Board layout not found');
    }
    if (existing.is_system) {
      db.close();
      throw new MutationError('System layouts cannot be edited', 400);
    }
    db.run(
      'UPDATE board_layouts SET slug = ?, name = ?, description = ?, placements = ?, updated_at = ? WHERE id = ?',
      [input.slug, input.name, input.description ?? null, placements, now, input.id],
    );
    db.close();
    return input.id;
  }

  db.run(
    `INSERT INTO board_layouts (slug, name, description, placements, created_by, created_at, updated_at, is_system)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [input.slug, input.name, input.description ?? null, placements, null, now, now],
  );
  const id = Number((db.query('SELECT last_insert_rowid() AS id').get() as { id: number }).id);
  db.close();
  return id;
}

/**
 * Delete a non-system board layout.
 *
 * @param id Layout id.
 * @returns True if deleted.
 */
export function deleteLayout(id: number): boolean {
  const db = openGameDatabase();
  const existing = db.query('SELECT is_system FROM board_layouts WHERE id = ?').get(id) as {
    is_system: number;
  } | null;
  if (!existing || existing.is_system) {
    db.close();
    return false;
  }
  db.run('DELETE FROM board_layouts WHERE id = ?', [id]);
  db.close();
  return true;
}
