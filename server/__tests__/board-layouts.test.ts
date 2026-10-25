import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const directory = mkdtempSync(join(tmpdir(), 'free-chess-boards-'));
process.env.GAME_DB_PATH = join(directory, 'game.db');

await import('../scripts/migrate-game');

import { listPieces, savePiece } from '~/server/game-pieces';
import {
  listLayouts,
  getLayout,
  saveLayout,
  deleteLayout,
  loadLayout,
  upsertSyncedLayout,
} from '~/server/board-layouts';
import { validateBoardLayout } from '~/game/board/validate-layout';
import { mountGame } from '~/utils/index';
import { gameState } from '~/game/consts/board';
import { perft } from '~/game/perft';
import { runCommand } from '~server/admin';

const bySlug = new Map(listPieces().map((piece) => [piece.slug, piece]));

/**
 * Placement input for a slug.
 *
 * @param slug Piece slug.
 * @param color Piece colour.
 * @param square Square index.
 * @returns Placement entry.
 */
function at(slug: string, color: 0 | 1, square: number) {
  const piece = bySlug.get(slug);
  if (!piece) throw new Error(`Unknown slug ${slug}`);
  return { definitionId: piece.id, color, square };
}

afterAll(() => {
  delete process.env.GAME_DB_PATH;
  rmSync(directory, { recursive: true, force: true });
});

/**
 * Run a layout save and return the thrown error.
 *
 * @param input Layout input.
 * @returns The thrown error.
 */
function saveError(input: Parameters<typeof saveLayout>[0]): unknown {
  try {
    saveLayout(input);
  } catch (error) {
    return error;
  }
  throw new Error('Expected saveLayout to throw');
}

test('seeds the standard layout', () => {
  const layouts = listLayouts();
  const standard = layouts.find((layout) => layout.slug === 'standard');
  expect(standard).toMatchObject({ name: 'Standard', isSystem: true });
  expect(standard?.placements.length).toBe(32);
});

test('the seeded standard layout validates', () => {
  const standard = listLayouts().find((layout) => layout.slug === 'standard');
  const loaded = loadLayout(standard!.id);
  expect(loaded).not.toBeNull();
  expect(validateBoardLayout(loaded!.placements, loaded!.definitions)).toEqual({
    ok: true,
    errors: [],
  });
});

test('saving requires a name and pieces', () => {
  const king = at('king', 0, 60);
  expect(saveError({ slug: 'x', name: '  ', placements: [king] })).toMatchObject({
    statusCode: 400,
  });
  expect(saveError({ slug: 'x', name: 'X', placements: [] })).toMatchObject({ statusCode: 400 });
});

test('saving rejects illegal positions', () => {
  expect(
    saveError({
      slug: 'bare',
      name: 'Bare',
      placements: [at('king', 0, 60), at('king', 1, 4)],
    }),
  ).toMatchObject({ statusCode: 400 });
});

test('saving rejects unknown pieces and guards system rows', () => {
  const standard = listLayouts().find((layout) => layout.slug === 'standard');
  const placements = [
    ...standard!.placements,
    { definitionId: 9999, color: 0, square: 27 } as never,
  ];
  expect(saveError({ slug: 'bad', name: 'Bad', placements })).toMatchObject({ statusCode: 400 });
  expect(
    saveError({
      id: standard!.id,
      slug: 'standard',
      name: 'Standard',
      placements: standard!.placements,
    }),
  ).toMatchObject({ statusCode: 400 });
  expect(deleteLayout(standard!.id)).toBe(false);
  expect(deleteLayout(9999)).toBe(false);
});

test('duplicate slugs are rejected', () => {
  const placements = [at('king', 0, 60), at('queen', 0, 59), at('king', 1, 4), at('queen', 1, 3)];
  const id = saveLayout({ slug: 'dupe', name: 'Dupe', placements });
  expect(saveError({ slug: 'dupe', name: 'Dupe 2', placements })).toMatchObject({
    statusCode: 400,
  });
  expect(deleteLayout(id)).toBe(true);
  expect(getLayout(id)).toBeNull();
});

test('syncing a Sun layout resolves pieces by slug', () => {
  const standard = listLayouts().find((layout) => layout.slug === 'standard');
  const slugById = new Map(listPieces().map((piece) => [piece.id, piece.slug]));
  const placements = standard!.placements.map((placement) => {
    const definitionSlug = slugById.get(placement.definitionId);
    if (!definitionSlug) throw new Error(`Unknown piece id ${placement.definitionId}`);
    return { definitionSlug, color: placement.color as 0 | 1, square: placement.square };
  });

  const id = upsertSyncedLayout({
    slug: 'synced-standard',
    name: 'Synced Standard',
    description: null,
    placements,
  });
  expect(getLayout(id)).toMatchObject({ slug: 'synced-standard', name: 'Synced Standard' });
  expect(loadLayout(id)?.placements).toHaveLength(standard!.placements.length);
  expect(deleteLayout(id)).toBe(true);

  expect(() =>
    upsertSyncedLayout({
      slug: 'synced-missing',
      name: 'Missing',
      description: null,
      placements: [{ definitionSlug: 'not-a-piece', color: 0, square: 0 }],
    }),
  ).toThrow('Unknown piece: not-a-piece');
});

test('mounting the standard layout matches the default mount', () => {
  const standard = listLayouts().find((layout) => layout.slug === 'standard');
  const loaded = loadLayout(standard!.id);
  expect(loaded).not.toBeNull();

  mountGame();
  const fenOccLo = [...gameState.occLo];
  const fenOccHi = [...gameState.occHi];
  const fenKings = [...gameState.kingPieceId];
  const fenNodes = perft(2).nodes;

  mountGame(loaded!);
  expect([...gameState.occLo]).toEqual(fenOccLo);
  expect([...gameState.occHi]).toEqual(fenOccHi);
  expect([...gameState.kingPieceId]).toEqual(fenKings);
  expect(gameState.side).toBe(0);
  expect(gameState.castle).toBe(15);
  expect(perft(2).nodes).toBe(fenNodes);
});

test('custom pieces mount and move', () => {
  const wazir = savePiece({
    slug: 'test-wazir',
    name: 'Test Wazir',
    description: null,
    isKing: false,
    promotionTargets: [],
    promotionRanks: [],
    moveStates: [
      {
        index: 0,
        vectors: [
          { dx: 0, dy: 1, range: 'step', capture: 'optional' },
          { dx: 0, dy: -1, range: 'step', capture: 'optional' },
          { dx: 1, dy: 0, range: 'step', capture: 'optional' },
          { dx: -1, dy: 0, range: 'step', capture: 'optional' },
        ],
      },
    ],
    stateTransition: 'none',
    edgeReset: false,
    sprite: { headKey: 'king-head', bodyKey: 'king-body', footKey: 'king-foot' },
  });
  const placements = [
    { definitionId: bySlug.get('king')!.id, color: 0 as const, square: 60 },
    { definitionId: wazir, color: 0 as const, square: 52 },
    { definitionId: bySlug.get('king')!.id, color: 1 as const, square: 4 },
    { definitionId: wazir, color: 1 as const, square: 12 },
  ];
  const id = saveLayout({ slug: 'wazir-test', name: 'Wazir Test', placements });
  const loaded = loadLayout(id);
  expect(loaded).not.toBeNull();

  mountGame(loaded!);
  expect(perft(1).nodes).toBeGreaterThan(0);

  expect(deleteLayout(id)).toBe(true);
});

test('loads promotion targets that are not placed on the board', () => {
  const id = saveLayout({
    slug: 'promotion-test',
    name: 'Promotion Test',
    placements: [
      at('king', 0, 60),
      at('king', 1, 7),
      at('pawn', 0, 12),
      at('pawn', 1, 15),
    ],
  });
  const loaded = loadLayout(id);

  expect(loaded).not.toBeNull();
  expect(loaded!.definitions.some((definition) => definition.slug === 'queen')).toBe(true);
  expect(loaded!.definitions.some((definition) => definition.slug === 'rook')).toBe(true);

  mountGame(loaded!);
  const queen = bySlug.get('queen')!;
  expect(gameState.pieces.some((piece) => piece.getDefinitionId() === queen.id)).toBe(true);

  expect(deleteLayout(id)).toBe(true);
});

test('worker reset mounts a layout and rejects unknown layouts', () => {
  const broadcast = vi.fn();
  const standard = listLayouts().find((layout) => layout.slug === 'standard');

  const result = runCommand('reset', broadcast, { boardLayoutId: standard!.id });
  expect(result).toMatchObject({ ok: true });
  expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ type: 'state' }));

  const missing = runCommand('reset', broadcast, { boardLayoutId: 9999 });
  expect(missing).toMatchObject({ ok: false, message: 'Board layout not found' });
});
