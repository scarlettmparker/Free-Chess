/**
 * @fileoverview Writes a consistent copy of the auth database.
 * @module scripts/backup
 */

import { Database } from 'bun:sqlite';
import { chmodSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { resolveAuthDbPath } from '~/server/db';

const source = resolveAuthDbPath();
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = process.argv[2] || `${source}.${stamp}.bak`;

mkdirSync(dirname(target), { recursive: true });

const db = new Database(source, { readonly: true });
db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
db.close();

chmodSync(target, 0o600);
console.log(target);
