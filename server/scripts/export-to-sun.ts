/**
 * @fileoverview Exports Free-Chess SQLite data to JSON for migration into Sun.
 * @module scripts/export-to-sun
 */

import { Database } from 'bun:sqlite';
import { resolveGameDbPath } from '~/server/game-db';
import { writeFileSync } from 'node:fs';

const gameDb = new Database(resolveGameDbPath());

const pieces = gameDb.query('SELECT * FROM piece_definitions').all();
const sprites = gameDb.query('SELECT * FROM piece_sprites').all();
const sets = gameDb.query('SELECT * FROM piece_sets').all();
const members = gameDb.query('SELECT * FROM piece_set_members').all();
const layouts = gameDb.query('SELECT * FROM board_layouts').all();

const bundle = {
  pieces,
  sprites,
  sets,
  members,
  layouts,
};

writeFileSync('/tmp/opencode/free-chess-export.json', JSON.stringify(bundle, null, 2));
console.log('Exported to /tmp/opencode/free-chess-export.json');
console.log(`Pieces: ${pieces.length}, Sets: ${sets.length}, Layouts: ${layouts.length}`);

gameDb.close();