/**
 * @fileoverview Configuration settings for the server, loaded from environment variables.
 * @module config
 */

import { config } from 'dotenv';

export const isProduction = process.env.NODE_ENV === 'production';

config({
  path: `.env${isProduction ? '.production' : ''}`,
});

export const port = parseInt(process.env.SERVER_PORT || '5179', 10);

export const host = process.env.SERVER_HOST || '0.0.0.0';

export const base = process.env.VITE_SERVER_BASE || '/';

export const backendHost = process.env.BACKEND_HOST || '0.0.0.0';

export const backendPort = parseInt(process.env.BACKEND_PORT || '443', 10);

/**
 * Hostname suffixes the SSR origin gate accepts, comma-separated. Empty keeps
 * the package defaults; setting it replaces them, so list every host you serve
 * from.
 */
export const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

/**
 * HMAC key for Sun's CSRF tokens. Empty disables CSRF protection.
 */
export const clientSecret = process.env.CSRF_SECRET || process.env.BETTER_AUTH_SECRET || '';

export const manifestPath = './dist/client/.vite/manifest.json';

/**
 * Upstream URL of the matchmaking service. The web app proxies /ws to it.
 */
export const matchmakingUrl = process.env.MATCHMAKING_URL || 'http://127.0.0.1:4001';

/**
 * Loopback URL of the matchmaking admin API.
 */
export const matchmakingAdminUrl =
  process.env.MATCHMAKING_ADMIN_URL || 'http://127.0.0.1:4002';

/**
 * Bearer token for the matchmaking admin API.
 */
export const adminToken = process.env.ADMIN_TOKEN || '';
