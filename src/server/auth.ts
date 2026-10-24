/**
 * @fileoverview Auth configuration and database migration helpers.
 * @module server/auth
 */

import type { Database } from 'bun:sqlite';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { admin } from 'better-auth/plugins';
import { openAuthDatabase, resolveAuthDbPath } from './db.ts';
import { createMagicLink, type SendMagicLink } from './magic-link.ts';
import { ac, adminRoles, defaultRole, roles } from './permissions.ts';

const devSecret = '3f9a2c7e1b8d4056a1c4e7f29b6d0835';
const configPath = join(dirname(fileURLToPath(import.meta.url)), 'auth-cli.ts');

/**
 * Optional collaborators replaced in tests.
 */
export type AuthDeps = {
  /**
   * Delivers magic-link messages.
   */
  sendMagicLink?: SendMagicLink;
};

/**
 * Builds the better-auth configuration for a database path.
 *
 * @param dbPath Path to the auth database.
 * @param database Open database handle. Created from `dbPath` when omitted.
 * @returns Options accepted by `betterAuth`.
 */
export function buildAuthOptions(
  dbPath = resolveAuthDbPath(),
  database: Database = openAuthDatabase(dbPath),
  deps: AuthDeps = {},
) {
  const isProduction = process.env.NODE_ENV === 'production';
  const secret = process.env.BETTER_AUTH_SECRET || (isProduction ? '' : devSecret);
  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET is required in production');
  }

  const baseURL =
    process.env.BETTER_AUTH_URL || `http://localhost:${process.env.SERVER_PORT || 5179}`;
  const configuredOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      if (value.includes('://')) return value.replace(/\/$/, '');
      const scheme =
        value.startsWith('localhost') || value.startsWith('127.0.0.1') ? 'http' : 'https';
      return `${scheme}://${value}`;
    });
  const trustedOrigins = [new URL(baseURL).origin, ...configuredOrigins, ...allowedOrigins];

  return {
    appName: 'Free Chess',
    baseURL,
    secret,
    database,
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
    },
    plugins: [
      admin({
        ac,
        roles,
        defaultRole,
        adminRoles,
      }),
      createMagicLink(deps.sendMagicLink),
    ],
    trustedOrigins: [...new Set(trustedOrigins)],
    advanced: {
      useSecureCookies: isProduction,
    },
    rateLimit: {
      customRules: {
        '/sign-in/email': {
          window: 60,
          max: 5,
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 12,
      updateAge: 60 * 60,
    },
  } satisfies BetterAuthOptions;
}

/**
 * Creates an auth instance for a database path.
 *
 * @param dbPath Path to the auth database.
 * @returns Configured better-auth instance.
 */
export function createAuth(dbPath = resolveAuthDbPath(), deps: AuthDeps = {}) {
  return betterAuth(buildAuthOptions(dbPath, undefined, deps));
}

/**
 * Creates the better-auth tables in the configured database.
 *
 * @param dbPath Path to the auth database.
 */
export async function migrateAuth(dbPath = resolveAuthDbPath()) {
  const cli = join(process.cwd(), 'node_modules', '.bin', 'auth');
  const result = spawnSync(process.execPath, [cli, 'migrate', '--config', configPath, '--yes'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      AUTH_DB_PATH: dbPath,
    },
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'Auth migration failed');
  }
}
