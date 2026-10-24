/**
 * @fileoverview Creates the first admin account.
 * @module scripts/create-admin
 */

import { randomBytes } from 'node:crypto';
import { createAuth, migrateAuth } from '~/server/auth';
import { resolveAuthDbPath } from '~/server/db';
import { createUser } from '~/server/users';

/**
 * Parses `--key value` and `--key=value` arguments.
 *
 * @returns Map of argument names to values.
 */
function readArgs() {
  const args = new Map<string, string>();
  const argv = process.argv.slice(2);

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value?.startsWith('--')) continue;

    const [key, inline] = value.slice(2).split('=', 2);
    const next = inline ?? argv[index + 1];
    if (inline === undefined && next && !next.startsWith('--')) {
      index += 1;
    }
    args.set(key, next ?? '');
  }

  return args;
}

const args = readArgs();
const email = (process.env.ADMIN_EMAIL || args.get('email') || '').trim().toLowerCase();
const name = (process.env.ADMIN_NAME || args.get('name') || '').trim();
const password = process.env.ADMIN_PASSWORD || args.get('password') || '';
const generatedPassword = password || randomBytes(18).toString('base64url');

if (!email || !name) {
  console.error(
    'Usage: bun run auth:create-admin --email <email> --name <name> [--password <password>]',
  );
  process.exit(1);
}

try {
  const dbPath = resolveAuthDbPath();
  await migrateAuth(dbPath);
  const auth = createAuth(dbPath);
  await createUser(auth, {
    email,
    name,
    password: generatedPassword,
    role: 'admin',
  });

  console.log(`Created admin: ${email}`);
  if (!password) {
    console.log(`Password: ${generatedPassword}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
