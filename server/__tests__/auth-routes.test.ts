/**
 * @fileoverview Native login/logout routes.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { SunApp, SunReply, SunRequest } from '@sun/ssr/server';
import { createAuth, migrateAuth } from '~/server/auth';
import { registerAuthRoutes } from '~/server/auth-routes';
import { resetRateLimits } from '~/server/rate-limit';
import { safeRedirect } from '~/server/redirect';
import { createUser } from '~/server/users';

const password = 'correct-horse-battery';
const googleClientId = 'test-client-id';
const googleClientSecret = 'test-client-secret';
let directory: string;
let auth: ReturnType<typeof createAuth>;
let login: Handler;
let logout: Handler;
let google: Handler;
let googleCallback: Handler;
let googleVerify: Handler;
let googleError: Handler;

/**
 * Handler signature captured by the fake server surface.
 */
type Handler = (request: SunRequest, reply: SunReply) => Promise<void>;

/**
 * Creates a minimal server surface that captures the auth handlers.
 *
 * @returns Captured handlers.
 */
function createApp() {
  const handlers = new Map<string, Handler>();
  const app = {
    post(path: string, handler: Handler) {
      handlers.set(path, handler);
    },
    get(path: string, handler: Handler) {
      handlers.set(path, handler);
    },
    route() {},
    register() {},
    addHook() {},
    setNotFoundHandler() {},
  } as unknown as SunApp;
  return { app, handlers };
}

/**
 * Builds a request for a native form post.
 *
 * @param body Form fields.
 * @param headers Extra headers.
 * @returns Request shaped for the auth handlers.
 */
function formRequest(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return {
    method: 'POST',
    url: '/__login',
    raw: { url: '/__login', method: 'POST' },
    headers: {
      origin: 'http://localhost:5179',
      ...headers,
    },
    body,
    query: {},
    params: {},
    ip: '127.0.0.1',
    protocol: 'http',
  } satisfies SunRequest;
}

/**
 * Builds a request for a GET handler.
 *
 * @param query Query parameters.
 * @param headers Extra headers.
 * @returns Request shaped for the auth handlers.
 */
function getRequest(query: Record<string, string> = {}, headers: Record<string, string> = {}) {
  return {
    method: 'GET',
    url: '/__google',
    raw: { url: '/__google', method: 'GET' },
    headers: {
      origin: 'http://localhost:5179',
      ...headers,
    },
    body: {},
    query,
    params: {},
    ip: '127.0.0.1',
    protocol: 'http',
  } satisfies SunRequest;
}

/**
 * Records the reply state the handlers produce.
 *
 * @returns A reply and its captured state.
 */
function captureReply() {
  const headers = new Map<string, string>();
  const state = {
    statusCode: 200,
    redirectTo: '',
    body: undefined as unknown,
  };
  const reply: SunReply = {
    header(name: string, value: string) {
      headers.set(name, value);
      return reply;
    },
    getHeader(name: string) {
      return headers.get(name);
    },
    removeHeader(name: string) {
      headers.delete(name);
    },
    status(code: number) {
      state.statusCode = code;
      return reply;
    },
    code(code: number) {
      state.statusCode = code;
      return reply;
    },
    send(body?: unknown) {
      state.body = body;
    },
    redirect(url: string, code = 302) {
      state.redirectTo = url;
      state.statusCode = code;
      return reply;
    },
    callNotFound() {},
    raw: {
      statusCode: 200,
      setHeader() {},
      getHeader() {
        return undefined;
      },
      removeHeader() {},
      write() {},
      end() {},
    },
  };
  return { reply, headers, state };
}

beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), 'free-chess-routes-'));
  const dbPath = join(directory, 'auth.db');
  process.env.AUTH_DB_PATH = dbPath;
  process.env.GOOGLE_CLIENT_ID = googleClientId;
  process.env.GOOGLE_CLIENT_SECRET = googleClientSecret;
  await migrateAuth(dbPath);
  auth = createAuth(dbPath);
  await createUser(auth, {
    email: 'admin@example.com',
    name: 'Admin',
    password,
    role: 'admin',
  });

  const { app, handlers } = createApp();
  registerAuthRoutes(app, auth);
  login = handlers.get('/__login')!;
  logout = handlers.get('/__logout')!;
  google = handlers.get('/__google')!;
  googleCallback = handlers.get('/api/auth/callback/google')!;
  googleVerify = handlers.get('/__google/verify')!;
  googleError = handlers.get('/__google/error')!;
});

afterAll(() => {
  delete process.env.AUTH_DB_PATH;
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  rmSync(directory, { recursive: true, force: true });
});

beforeEach(() => {
  resetRateLimits();
});

test('safeRedirect keeps paths and rejects off-site targets', () => {
  expect(safeRedirect('/admin')).toBe('/admin');
  expect(safeRedirect('/admin?tab=users')).toBe('/admin?tab=users');
  expect(safeRedirect('https://example.com')).toBe('/');
  expect(safeRedirect('//example.com')).toBe('/');
  expect(safeRedirect('/\\example.com')).toBe('/');
  expect(safeRedirect(undefined)).toBe('/');
});

test('valid credentials set a session cookie and redirect', async () => {
  const { reply, headers, state } = captureReply();
  await login(
    formRequest({
      email: 'admin@example.com',
      password,
      redirect: '/admin',
    }),
    reply,
  );

  expect(state.redirectTo).toBe('/admin');
  expect(headers.get('Set-Cookie')).toContain('better-auth.session_token=');
});

test('invalid credentials return to the login page', async () => {
  const { reply, state } = captureReply();
  await login(
    formRequest({
      email: 'admin@example.com',
      password: 'wrong-password',
    }),
    reply,
  );

  expect(state.redirectTo.startsWith('/login?error=invalid')).toBe(true);
});

test('off-site redirects fall back to the home page', async () => {
  const { reply, state } = captureReply();
  await login(
    formRequest({
      email: 'admin@example.com',
      password,
      redirect: 'https://example.com',
    }),
    reply,
  );

  expect(state.redirectTo).toBe('/');
});

test('logout clears the session cookie and returns to login', async () => {
  const signIn = captureReply();
  await login(formRequest({ email: 'admin@example.com', password }), signIn.reply);
  const cookie = signIn.headers.get('Set-Cookie')!;

  const { reply, headers, state } = captureReply();
  await logout(formRequest({}, { cookie }), reply);

  expect(state.redirectTo).toBe('/login');
  expect(headers.get('Set-Cookie')).toContain('better-auth.session_token=');
});

test('repeated failed logins are throttled', async () => {
  for (let index = 0; index < 10; index += 1) {
    const { reply } = captureReply();
    await login(formRequest({ email: 'admin@example.com', password: 'wrong-password' }), reply);
  }

  const { reply, state } = captureReply();
  await login(formRequest({ email: 'admin@example.com', password: 'wrong-password' }), reply);

  expect(state.redirectTo).toContain('/login?error=rate');
});

test('google sign-in redirects to the provider with a state cookie', async () => {
  const { reply, headers, state } = captureReply();
  await google(formRequest({ redirect: '/admin' }), reply);

  expect(state.redirectTo.startsWith('https://accounts.google.com/')).toBe(true);
  expect(state.redirectTo).toContain(
    encodeURIComponent('http://localhost:5179/api/auth/callback/google'),
  );
  expect(headers.get('Set-Cookie')).toContain('better-auth.state');
});

test('google sign-in is unavailable without credentials', async () => {
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;

  try {
    const { reply, state } = captureReply();
    await google(formRequest({ redirect: '/admin' }), reply);

    expect(state.redirectTo.startsWith('/login?error=google')).toBe(true);
  } finally {
    process.env.GOOGLE_CLIENT_ID = googleClientId;
    process.env.GOOGLE_CLIENT_SECRET = googleClientSecret;
  }
});

test('google callback with an invalid state returns to the login page', async () => {
  const { reply, state } = captureReply();
  await googleCallback(getRequest({ code: 'abc', state: 'bogus' }), reply);

  expect(state.redirectTo.startsWith('/login?error=google')).toBe(true);
});

test('google verify without a session returns to the login page', async () => {
  const { reply, state } = captureReply();
  await googleVerify(getRequest({ redirect: '/admin' }), reply);

  expect(state.redirectTo.startsWith('/login?error=google')).toBe(true);
});

test('google verify with a session redirects to the requested page', async () => {
  const signIn = captureReply();
  await login(formRequest({ email: 'admin@example.com', password }), signIn.reply);
  const cookie = signIn.headers.get('Set-Cookie')!;

  const { reply, state } = captureReply();
  await googleVerify(getRequest({ redirect: '/admin' }, { cookie }), reply);

  expect(state.redirectTo).toBe('/admin');
});

test('google error route maps a banned account', async () => {
  const { reply, state } = captureReply();
  await googleError(getRequest({ error: 'BANNED_USER' }), reply);

  expect(state.redirectTo.startsWith('/login?error=banned')).toBe(true);
});
