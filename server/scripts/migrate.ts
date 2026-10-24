/**
 * @fileoverview Applies better-auth migrations to the auth database.
 * @module scripts/migrate
 */

import { migrateAuth } from '~/server/auth';
import { resolveAuthDbPath } from '~/server/db';

const path = resolveAuthDbPath();
await migrateAuth(path);
console.log(`Auth database ready: ${path}`);
