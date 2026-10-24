import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAuth, migrateAuth } from '~/server/auth';
import { listAudit, migrateAudit, pruneAudit, recordAudit } from '~/server/audit';
import { createUser } from '~/server/users';

const password = 'correct-horse-battery';
let directory: string;
let auth: ReturnType<typeof createAuth>;

beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), 'free-chess-audit-'));
  const dbPath = join(directory, 'auth.db');
  process.env.AUTH_DB_PATH = dbPath;
  await migrateAuth(dbPath);
  migrateAudit();
  auth = createAuth(dbPath);
});

afterAll(() => {
  delete process.env.AUTH_DB_PATH;
  rmSync(directory, { recursive: true, force: true });
});

test('records entries newest first', () => {
  recordAudit({
    action: 'user.create',
    outcome: 'success',
    actor: { id: 'actor', email: 'admin@example.com' },
    target: 'new@example.com',
    detail: 'role=user',
    ip: '127.0.0.1',
  });
  recordAudit({
    action: 'user.ban',
    outcome: 'failure',
    actor: { id: 'actor', email: 'admin@example.com' },
    target: 'bad@example.com',
    detail: 'nope',
  });

  const events = listAudit(10);
  expect(events[0]).toMatchObject({
    action: 'user.ban',
    outcome: 'failure',
    target: 'bad@example.com',
    detail: 'nope',
  });
  expect(events[1]).toMatchObject({
    action: 'user.create',
    outcome: 'success',
    actorEmail: 'admin@example.com',
    ip: '127.0.0.1',
  });
});

test('only the admin role can read the audit log', async () => {
  const admin = await createUser(auth, {
    email: 'audit-admin@example.com',
    name: 'Admin',
    password,
    role: 'admin',
  });
  const user = await createUser(auth, {
    email: 'audit-user@example.com',
    name: 'User',
    password,
    role: 'user',
  });

  const adminCheck = await auth.api.userHasPermission({
    body: { userId: admin.id, permissions: { audit: ['read'] } },
  });
  const userCheck = await auth.api.userHasPermission({
    body: { userId: user.id, permissions: { audit: ['read'] } },
  });

  expect(adminCheck.success).toBe(true);
  expect(userCheck.success).toBe(false);
});

test('pruning removes entries older than the cutoff', () => {
  recordAudit({ action: 'game.reset', outcome: 'success' });
  expect(listAudit(1)).toHaveLength(1);

  expect(pruneAudit(0)).toBeGreaterThan(0);
  expect(listAudit(10)).toHaveLength(0);
});
