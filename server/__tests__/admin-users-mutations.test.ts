import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mutationRegistry } from '@sun/ssr';
import { createAuth, migrateAuth } from '~/server/auth';
import { getSession } from '~/server/session';
import { createUser } from '~/server/users';
import type { AdminUser } from '~/utils/admin-user-types';

const password = 'correct-horse-battery';
let directory: string;
let auth: ReturnType<typeof createAuth>;
let adminCookie: string;
let userAdminCookie: string;
let gameAdminCookie: string;
let userCookie: string;

/**
 * Signs in and returns the session cookie pair.
 *
 * @param email Account email.
 * @returns Cookie header value.
 */
async function signIn(email: string) {
  const response = await auth.api.signInEmail({
    body: { email, password },
    headers: new Headers({ origin: 'http://localhost:5179' }),
    asResponse: true,
  });
  return response.headers.getSetCookie()[0].split(';')[0];
}

/**
 * Runs a mutation for one cookie.
 *
 * @param path Mutation path.
 * @param body Mutation body.
 * @param cookie Caller cookie.
 * @returns Mutation result.
 */
function run(path: string, body: Record<string, unknown>, cookie: string) {
  return mutationRegistry.executeMutation(path, body, { cookie });
}

beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), 'free-chess-users-'));
  const dbPath = join(directory, 'auth.db');
  await migrateAuth(dbPath);

  process.env.AUTH_DB_PATH = dbPath;
  await import('~/utils/admin-users-mutations');

  auth = createAuth(dbPath);
  await createUser(auth, {
    email: 'admin@example.com',
    name: 'Admin',
    password,
    role: 'admin',
  });
  await createUser(auth, {
    email: 'useradmin@example.com',
    name: 'User Admin',
    password,
    role: 'user-admin',
  });
  await createUser(auth, {
    email: 'gameadmin@example.com',
    name: 'Game Admin',
    password,
    role: 'game-admin',
  });
  await createUser(auth, {
    email: 'user@example.com',
    name: 'User',
    password,
    role: 'user',
  });

  adminCookie = await signIn('admin@example.com');
  userAdminCookie = await signIn('useradmin@example.com');
  gameAdminCookie = await signIn('gameadmin@example.com');
  userCookie = await signIn('user@example.com');
});

afterAll(() => {
  delete process.env.AUTH_DB_PATH;
  rmSync(directory, { recursive: true, force: true });
});

test('guests and non-user admins cannot create accounts', async () => {
  await expect(
    mutationRegistry.executeMutation(
      'user/create',
      {
        email: 'new@example.com',
        name: 'New',
        password,
        role: 'user',
      },
      {},
    ),
  ).rejects.toMatchObject({ statusCode: 403 });

  await expect(
    run(
      'user/create',
      { email: 'new@example.com', name: 'New', password, role: 'user' },
      gameAdminCookie,
    ),
  ).rejects.toMatchObject({ statusCode: 403 });

  await expect(
    run(
      'user/create',
      { email: 'new@example.com', name: 'New', password, role: 'user' },
      userCookie,
    ),
  ).rejects.toMatchObject({ statusCode: 403 });
});

test('user admins can create accounts', async () => {
  const created = (await run(
    'user/create',
    {
      email: 'created@example.com',
      name: 'Created',
      password,
      role: 'user',
    },
    userAdminCookie,
  )) as AdminUser;

  expect(created).toMatchObject({
    email: 'created@example.com',
    name: 'Created',
    role: 'user',
    banned: false,
  });
});

test('user admins can change roles', async () => {
  const created = (await run(
    'user/create',
    {
      email: 'role@example.com',
      name: 'Role',
      password,
      role: 'user',
    },
    userAdminCookie,
  )) as AdminUser;

  const updated = (await run(
    'user/set-role',
    { userId: created.id, role: 'game-admin' },
    userAdminCookie,
  )) as AdminUser;

  expect(updated.role).toBe('game-admin');
});

test('invalid roles and short passwords are rejected', async () => {
  await expect(
    run(
      'user/create',
      { email: 'bad@example.com', name: 'Bad', password, role: 'owner' },
      userAdminCookie,
    ),
  ).rejects.toMatchObject({ statusCode: 400 });

  await expect(
    run('user/set-password', { userId: 'missing', password: 'short' }, userAdminCookie),
  ).rejects.toMatchObject({ statusCode: 400 });
});

test('user admins can update name, email, and password', async () => {
  const created = (await run(
    'user/create',
    {
      email: 'edit@example.com',
      name: 'Edit',
      password,
      role: 'user',
    },
    userAdminCookie,
  )) as AdminUser;

  const updated = (await run(
    'user/update',
    { userId: created.id, name: 'Edited', email: 'edited@example.com' },
    userAdminCookie,
  )) as AdminUser;

  expect(updated).toMatchObject({ name: 'Edited', email: 'edited@example.com' });

  await expect(
    run(
      'user/set-password',
      { userId: created.id, password: 'another-long-password' },
      userAdminCookie,
    ),
  ).resolves.toMatchObject({ status: true });
});

test('user admins can ban and unban accounts', async () => {
  const created = (await run(
    'user/create',
    {
      email: 'ban@example.com',
      name: 'Ban',
      password,
      role: 'user',
    },
    userAdminCookie,
  )) as AdminUser;

  const banned = (await run(
    'user/ban',
    { userId: created.id, reason: 'Testing', expiresInDays: 1 },
    userAdminCookie,
  )) as AdminUser;
  expect(banned.banned).toBe(true);
  expect(banned.banReason).toBe('Testing');

  const unbanned = (await run('user/unban', { userId: created.id }, userAdminCookie)) as AdminUser;
  expect(unbanned.banned).toBe(false);
});

test('admins cannot delete themselves', async () => {
  const session = await auth.api.getSession({
    headers: new Headers({ cookie: adminCookie }),
  });
  const adminId = session?.user.id;

  await expect(run('user/delete', { userId: adminId }, adminCookie)).rejects.toMatchObject({
    statusCode: 400,
  });
});

test('user admins can revoke every session for an account', async () => {
  const session = await auth.api.getSession({
    headers: new Headers({ cookie: userCookie }),
  });

  await expect(
    run('session/revoke-all', { userId: session?.user.id }, userAdminCookie),
  ).resolves.toMatchObject({ success: true });

  expect(await getSession(auth, userCookie)).toBeNull();
});

test('user admins can delete accounts', async () => {
  const created = (await run(
    'user/create',
    {
      email: 'delete@example.com',
      name: 'Delete',
      password,
      role: 'user',
    },
    userAdminCookie,
  )) as AdminUser;

  await expect(run('user/delete', { userId: created.id }, userAdminCookie)).resolves.toMatchObject({
    success: true,
  });

  await expect(
    auth.api.getUser({
      query: { id: created.id },
      headers: new Headers({ cookie: adminCookie }),
    }),
  ).rejects.toBeDefined();
});
