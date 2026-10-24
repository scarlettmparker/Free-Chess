import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mutationRegistry } from '@sun/ssr';
import { listAudit } from '~/server/audit';
import { createAuth, migrateAuth } from '~/server/auth';
import { createUser } from '~/server/users';

const password = 'correct-horse-battery';
let directory: string;
let auth: ReturnType<typeof createAuth>;
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

beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), 'free-chess-admin-'));
  const dbPath = join(directory, 'auth.db');
  await migrateAuth(dbPath);

  process.env.AUTH_DB_PATH = dbPath;
  process.env.ADMIN_TOKEN = 'test-token';
  process.env.MATCHMAKING_ADMIN_URL = 'http://admin.test';
  process.env.GAME_DB_PATH = join(directory, 'game.db');
  await import('../scripts/migrate-game');
  await import('~/utils/admin-mutations');

  auth = createAuth(dbPath);
  await createUser(auth, {
    email: 'game@example.com',
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

  gameAdminCookie = await signIn('game@example.com');
  userCookie = await signIn('user@example.com');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

afterAll(() => {
  delete process.env.AUTH_DB_PATH;
  delete process.env.ADMIN_TOKEN;
  delete process.env.MATCHMAKING_ADMIN_URL;
  delete process.env.GAME_DB_PATH;
  rmSync(directory, { recursive: true, force: true });
});

test('guests cannot run game commands', async () => {
  await expect(mutationRegistry.executeMutation('game/reset', {}, {})).rejects.toMatchObject({
    statusCode: 403,
  });
});

test('users without the game permission cannot reset', async () => {
  await expect(
    mutationRegistry.executeMutation('game/reset', {}, { cookie: userCookie }),
  ).rejects.toMatchObject({ statusCode: 403 });
});

test('game admins can reset the game', async () => {
  const fetchMock = vi.fn(async () => Response.json({ ok: true, message: 'reset' }));
  vi.stubGlobal('fetch', fetchMock);

  const result = await mutationRegistry.executeMutation(
    'game/reset',
    {},
    { cookie: gameAdminCookie },
  );

  expect(result).toMatchObject({ ok: true, message: 'reset' });
  expect(fetchMock).toHaveBeenCalledWith(
    'http://admin.test/reset',
    expect.objectContaining({
      method: 'POST',
      headers: { authorization: 'Bearer test-token' },
    }),
  );
  expect(listAudit(1)[0]).toMatchObject({
    action: 'game.reset',
    outcome: 'success',
    actorEmail: 'game@example.com',
  });
});

test('game admins can clear a colour', async () => {
  const fetchMock = vi.fn(async () => Response.json({ ok: true, message: 'cleared' }));
  vi.stubGlobal('fetch', fetchMock);

  await mutationRegistry.executeMutation(
    'game/clear',
    { color: 'white' },
    { cookie: gameAdminCookie },
  );

  expect(fetchMock).toHaveBeenCalledWith(
    'http://admin.test/cw',
    expect.objectContaining({ method: 'POST' }),
  );
});

test('invalid clear targets are rejected before calling the worker', async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);

  await expect(
    mutationRegistry.executeMutation('game/clear', { color: 'green' }, { cookie: gameAdminCookie }),
  ).rejects.toMatchObject({ statusCode: 400 });
  expect(fetchMock).not.toHaveBeenCalled();
});

test('game admins can list sessions', async () => {
  const fetchMock = vi.fn(async () =>
    Response.json({ ok: true, message: '1 session(s)', sessions: [] }),
  );
  vi.stubGlobal('fetch', fetchMock);

  await mutationRegistry.executeMutation('game/list-sessions', {}, { cookie: gameAdminCookie });

  expect(fetchMock).toHaveBeenCalledWith(
    'http://admin.test/list',
    expect.objectContaining({ method: 'POST' }),
  );
});

test('reset rejects unknown board layouts without calling the worker', async () => {
  const fetchMock = vi.fn(async () => Response.json({ ok: true, message: 'reset' }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(
    mutationRegistry.executeMutation(
      'game/reset',
      { boardLayoutId: 9999 },
      { cookie: gameAdminCookie },
    ),
  ).rejects.toMatchObject({ statusCode: 400 });
  expect(fetchMock).not.toHaveBeenCalled();
});

test('reset with the standard layout forwards the layout id', async () => {
  const fetchMock = vi.fn(async () => Response.json({ ok: true, message: 'reset' }));
  vi.stubGlobal('fetch', fetchMock);
  const { listLayouts } = await import('~/server/board-layouts');
  const standard = listLayouts().find((layout) => layout.slug === 'standard');

  const result = await mutationRegistry.executeMutation(
    'game/reset',
    { boardLayoutId: standard!.id },
    { cookie: gameAdminCookie },
  );

  expect(result).toMatchObject({ ok: true, message: 'reset' });
  expect(fetchMock).toHaveBeenCalledWith(
    'http://admin.test/reset',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ boardLayoutId: standard!.id }),
    }),
  );
});
