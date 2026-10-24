/**
 * @fileoverview Removes old audit entries.
 * @module scripts/prune-audit
 */

import { pruneAudit } from '~/server/audit';

const days = Number(process.argv[2] || 180);
const removed = pruneAudit(Number.isFinite(days) && days > 0 ? days : 180);
console.log(`Removed ${removed} audit entries`);
