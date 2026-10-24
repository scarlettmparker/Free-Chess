/**
 * @fileoverview Shared auth instance for the web process.
 * @module server/auth-instance
 */

import { createAuth } from './auth.ts';

/**
 * Auth instance used by server routes and loaders.
 */
export const auth = createAuth();
