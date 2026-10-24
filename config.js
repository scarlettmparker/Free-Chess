/**
 * @fileoverview Configuration settings for the server, loaded from environment variables.
 * @module config
 */

import { config } from 'dotenv';

export const isProduction = process.env.NODE_ENV === 'production';

config({
  path: `.env${isProduction ? '.production' : ''}`,
});

export const port = parseInt(process.env.SERVER_PORT || '5177', 10);

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

export const manifestPath = './dist/client/.vite/manifest.json';
