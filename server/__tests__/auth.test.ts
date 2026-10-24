/**
 * @fileoverview Auth provisioning, sign-in, and permission checks.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAuth, migrateAuth } from '~/server/auth';
import { getSession, requirePermission, rolesOf } from '~/server/session';
import { createUser } from '~/server/users';

const password = 'correct-horse-battery';
let directory: string;
let auth: ReturnType<typeof createAuth>;

/**
 * Signs in a provisioned user.
 *
 * @param email Email address to sign in with.
 * @returns Sign-in response, including the session cookie.
 */
async function signIn(email: string) {
  return auth.api.signInEmail({
    body: { email, password },
    asResponse: true,
  });
}

/**
 * Extracts the session cookie from a sign-in response.
 *
 * @param response Response returned by `signIn`.
 * @returns Cookie header value, or an empty string.
 */
function cookieFrom(response: Response) {
  return response.headers.get('set-cookie')?.split(';')[0] || '';
}

beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), 'free-chess-auth-'));
  const dbPath = join(directory, 'auth.db');
  await migrateAuth(dbPath);
  auth = createAuth(dbPath);

  await createUser(auth, {
    email: 'admin@example.com',
    name: 'Admin',
    password,
    role: 'admin',
  });
  await createUser(auth, {
    email: 'games@example.com',
    name: 'Game Admin',
    password,
    role: 'game-admin',
  });
  await createUser(auth, {
    email: 'users@example.com',
    name: 'User Admin',
    password,
    role: 'user-admin',
  });
  await createUser(auth, {
    email: 'player@example.com',
    name: 'Player',
    password,
  });
});

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

test('guests have no session', async () => {
  expect(await getSession(auth)).toBeNull();
});

test('disabled sign-up rejects new users', async () => {
  await expect(
    auth.api.signUpEmail({
      body: {
        email: 'new@example.com',
        name: 'New',
        password,
      },
    }),
  ).rejects.toThrow();
});

test('a provisioned admin can sign in and read the session', async () => {
  const response = await signIn('admin@example.com');
  expect(response.status).toBe(200);

  const session = await getSession(auth, cookieFrom(response));
  expect(session?.user.email).toBe('admin@example.com');
  expect(rolesOf(session?.user)).toEqual(['admin']);
});

test('roles separate game and user administration', async () => {
  const gameSession = await getSession(auth, cookieFrom(await signIn('games@example.com')));
  const userSession = await getSession(auth, cookieFrom(await signIn('users@example.com')));
  const playerSession = await getSession(auth, cookieFrom(await signIn('player@example.com')));

  expect(await requirePermission(auth, gameSession, { game: ['reset'] })).toBe(true);
  expect(await requirePermission(auth, gameSession, { user: ['list'] })).toBe(false);

  expect(await requirePermission(auth, userSession, { user: ['list'] })).toBe(true);
  expect(await requirePermission(auth, userSession, { game: ['reset'] })).toBe(false);

  expect(await requirePermission(auth, playerSession, { game: ['reset'] })).toBe(false);
  expect(await requirePermission(auth, null, { game: ['reset'] })).toBe(false);
});

test('sign-out revokes the session', async () => {
  const cookie = cookieFrom(await signIn('player@example.com'));
  expect(await getSession(auth, cookie)).not.toBeNull();

  await auth.api.signOut({ headers: new Headers({ cookie }) });
  expect(await getSession(auth, cookie)).toBeNull();
});

test('provisioning rejects duplicate emails, weak passwords, and unknown roles', async () => {
  await expect(
    createUser(auth, {
      email: 'admin@example.com',
      name: 'Duplicate',
      password,
    }),
  ).rejects.toThrow('User already exists');

  await expect(
    createUser(auth, {
      email: 'weak@example.com',
      name: 'Weak',
      password: 'short',
    }),
  ).rejects.toThrow('at least 12');

  await expect(
    createUser(auth, {
      email: 'unknown@example.com',
      name: 'Unknown',
      password,
      role: 'owner',
    }),
  ).rejects.toThrow('Unknown role');
});

test('migrations are idempotent', async () => {
  await expect(migrateAuth(join(directory, 'auth.db'))).resolves.toBeUndefined();
});
