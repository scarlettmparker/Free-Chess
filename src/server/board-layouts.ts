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

export type SyncedPlacement = {
  /**
   * Piece slug from the Sun piece registry.
   */
  definitionSlug: string;
  /**
   * Piece colour, 0 = white, 1 = black.
   */
  color: 0 | 1;
  /**
   * Square index, 0 = a8 through 63 = h1.
   */
  square: number;
};

export type SyncedLayoutInput = {
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
   * Piece placements using Sun piece slugs.
   */
  placements: SyncedPlacement[];
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
  const entry = placement as { definitionId?: number; color?: number; square?: number };
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
  const pending = [...new Set(placements.map((placement) => placement.definitionId))];
  const seen = new Set<number>();
  const definitions: PieceDefinition[] = [];

  while (pending.length > 0) {
    const definitionId = pending.shift() as number;
    if (seen.has(definitionId)) continue;
    seen.add(definitionId);

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
    const promotionTargets = JSON.parse(defRow.promotion_targets) as number[];
    const base = {
      id: defRow.id,
      slug: defRow.slug,
      name: defRow.name,
      isKing: Boolean(defRow.is_king),
      promotionTargets,
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
    pending.push(...promotionTargets);
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
 * Sync a Sun board layout into the local engine database.
 *
 * @param input Layout from Sun, using piece slugs.
 * @returns Local layout id.
 */
export function upsertSyncedLayout(input: SyncedLayoutInput): number {
  const db = openGameDatabase();
  const pieceRows = db.query('SELECT id, slug FROM piece_definitions').all() as {
    id: number;
    slug: string;
  }[];
  const idBySlug = new Map(pieceRows.map((row) => [row.slug, row.id]));
  const placements: BoardPlacement[] = input.placements.map((placement) => {
    const definitionId = idBySlug.get(placement.definitionSlug);
    if (!definitionId) {
      db.close();
      throw new MutationError(`Unknown piece: ${placement.definitionSlug}`, 400);
    }
    return {
      definitionId,
      color: placement.color,
      square: placement.square,
    };
  });
  const definitions = loadLayoutDefinitions(db, placements);
  if (!definitions) {
    db.close();
    throw new MutationError('Layout refers to unknown pieces', 400);
  }
  const validation = validateBoardLayout(placements, definitions);
  if (!validation.ok) {
    db.close();
    throw new MutationError(`Illegal starting position: ${validation.errors.join(', ')}`, 400);
  }

  const now = new Date().toISOString();
  const encoded = JSON.stringify(placements);
  const existing = db.query('SELECT id FROM board_layouts WHERE slug = ?').get(input.slug) as {
    id: number;
  } | null;
  if (existing) {
    db.run(
      `UPDATE board_layouts
       SET name = ?, description = ?, placements = ?, updated_at = ?
       WHERE id = ?`,
      [input.name, input.description, encoded, now, existing.id],
    );
    db.close();
    return existing.id;
  }

  db.run(
    `INSERT INTO board_layouts (slug, name, description, placements, created_by, created_at, updated_at, is_system)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [input.slug, input.name, input.description, encoded, null, now, now],
  );
  const id = Number((db.query('SELECT last_insert_rowid() AS id').get() as { id: number }).id);
  db.close();
  return id;
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
