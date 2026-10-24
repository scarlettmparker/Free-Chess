/**
 * @fileoverview Applies better-auth migrations to the auth database.
 * @module scripts/migrate
 */

import { migrateAuth } from '~/server/auth';
import { migrateAudit } from '~/server/audit';
import { resolveAuthDbPath } from '~/server/db';

const path = resolveAuthDbPath();
await migrateAuth(path);
migrateAudit();
console.log(`Auth database ready: ${path}`);
console.log('Audit table ready');
