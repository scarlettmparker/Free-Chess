import { describe, it, expect } from 'vitest';
import { rmSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmpDb = path.join(os.tmpdir(), 'free-chess-game-test.db');
process.env.GAME_DB_PATH = tmpDb;
if (existsSync(tmpDb)) rmSync(tmpDb);

await import('../scripts/migrate-game');

import { listPieces, getPiece, savePiece, deletePiece, listSets } from '~/server/game-pieces';

describe('game db', () => {
  it('seeds built-in pieces', () => {
    const pieces = listPieces();
    expect(pieces.length).toBeGreaterThan(0);
    expect(pieces.some((piece) => piece.slug === 'king')).toBe(true);
  });

  it('seeds the standard set', () => {
    const sets = listSets();
    expect(sets.some((set) => set.name === 'Standard')).toBe(true);
  });

  it('creates and deletes a piece', () => {
    const id = savePiece({
      slug: 'test-piece',
      name: 'Test Piece',
      description: null,
      isKing: false,
      promotionTargets: [],
      promotionRanks: [],
      moveStates: [{ index: 0, vectors: [] }],
      stateTransition: 'none',
      edgeReset: false,
      sprite: { headKey: 'king-head', bodyKey: 'king-body', footKey: 'king-foot' },
    });
    expect(getPiece(id)?.slug).toBe('test-piece');
    expect(deletePiece(id)).toBe(true);
    expect(getPiece(id)).toBeNull();
  });

  it('does not delete system pieces', () => {
    const king = listPieces().find((piece) => piece.slug === 'king');
    expect(king).toBeDefined();
    expect(deletePiece(king!.id)).toBe(false);
  });
});
