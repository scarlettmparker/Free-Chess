import { describe, expect, test } from 'vitest';
import { BUILTIN_DEFINITIONS } from '~/game/piece/builtins';
import type { BoardPlacement } from '~/game/board/validate-layout';
import { validateBoardLayout } from '~/game/board/validate-layout';

const bySlug = new Map(BUILTIN_DEFINITIONS.map((def) => [def.slug, def]));
const defs = [...BUILTIN_DEFINITIONS];

/**
 * Build a placement.
 *
 * @param slug Piece slug.
 * @param color Piece colour.
 * @param square Square index.
 * @returns The placement.
 */
function at(slug: string, color: 0 | 1, square: number): BoardPlacement {
  const def = bySlug.get(slug);
  if (!def) throw new Error(`Unknown slug ${slug}`);
  return { definitionId: def.id, color, square };
}

/**
 * Standard back rank with fairy corners.
 *
 * @param color Piece colour.
 * @param back Back rank index.
 * @returns Placements for the back rank.
 */
function backRank(color: 0 | 1, back: number): BoardPlacement[] {
  const order = [
    'spongebob',
    'knight',
    'bishop',
    'balloon',
    'king',
    'bishop',
    'knight',
    'spongebob',
  ];
  return order.map((slug, file) => at(slug, color, back * 8 + file));
}

/**
 * Standard opening layout.
 */
const standard: BoardPlacement[] = [
  ...backRank(1, 0),
  ...[0, 1, 2].map((file) => at('pawn', 1, 8 + file)),
  ...[3, 4, 5].map((file) => at('pogo', 1, 8 + file)),
  ...[6, 7].map((file) => at('pawn', 1, 8 + file)),
  ...[0, 1].map((file) => at('pawn', 0, 48 + file)),
  ...[2, 3, 4].map((file) => at('pogo', 0, 48 + file)),
  ...[5, 6, 7].map((file) => at('pawn', 0, 48 + file)),
  ...backRank(0, 7),
];

describe('validateBoardLayout', () => {
  test('accepts the standard layout', () => {
    expect(validateBoardLayout(standard, defs)).toEqual({ ok: true, errors: [] });
  });

  test('rejects a missing white king', () => {
    const kingId = bySlug.get('king')?.id;
    const without = standard.filter((p) => !(p.color === 0 && p.definitionId === kingId));
    const result = validateBoardLayout(without, defs);
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(['missing-white-king']);
  });

  test('rejects kings next to each other', () => {
    const placements: BoardPlacement[] = [
      at('king', 0, 60),
      at('queen', 0, 59),
      at('king', 1, 51),
      at('queen', 1, 3),
    ];
    const result = validateBoardLayout(placements, defs);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('kings-adjacent');
  });

  test('rejects white starting in check', () => {
    const placements: BoardPlacement[] = [
      at('king', 0, 60),
      at('pawn', 0, 48),
      at('rook', 1, 4),
      at('king', 1, 11),
    ];
    const result = validateBoardLayout(placements, defs);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('white-in-check');
  });

  test('rejects bare kings', () => {
    const placements: BoardPlacement[] = [at('king', 0, 60), at('king', 1, 4)];
    const result = validateBoardLayout(placements, defs);
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(['bare-kings']);
  });

  test('rejects a stalemated side to move', () => {
    const placements: BoardPlacement[] = [
      at('king', 0, 60),
      at('pawn', 0, 59),
      at('pawn', 0, 51),
      at('pawn', 0, 61),
      at('king', 1, 0),
      at('queen', 1, 43),
      at('rook', 1, 5),
      at('knight', 1, 53),
    ];
    const result = validateBoardLayout(placements, defs);
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(['no-legal-moves']);
  });

  test('rejects unknown pieces and bad squares', () => {
    const placements: BoardPlacement[] = [
      { definitionId: 9999, color: 0, square: 60 },
      at('king', 0, 60),
      at('king', 1, 64),
    ];
    const result = validateBoardLayout(placements, defs);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('unknown-piece');
    expect(result.errors).toContain('off-board');
    expect(result.errors).toContain('overlapping-pieces');
  });
});
