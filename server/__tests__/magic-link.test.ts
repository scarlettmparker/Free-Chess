import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { SunApp, SunReply, SunRequest } from '@sun/ssr/server';
import { createAuth, migrateAuth } from '~/server/auth';
import { registerAuthRoutes } from '~/server/auth-routes';
import type { MailMessage } from '~/server/mailer';
import { resetRateLimits } from '~/server/rate-limit';
import { getSession } from '~/server/session';
import { createUser } from '~/server/users';

const password = 'correct-horse-battery';
const origin = 'http://localhost:5179';
const sent: MailMessage[] = [];
let directory: string;
let auth: ReturnType<typeof createAuth>;
let handlers: Map<string, (request: SunRequest, reply: SunReply) => Promise<void>>;
let bannedEmail: string;
let linkEmail: string;

/**
 * Captures magic-link messages instead of sending them.
 *
 * @param message Message that would be delivered.
 */
async function capture(message: MailMessage) {
  sent.push(message);
}

/**
 * Creates a minimal server surface that records auth handlers.
 *
 * @returns Captured handlers.
 */
function createApp() {
  const map = new Map<string, (request: SunRequest, reply: SunReply) => Promise<void>>();
  const app = {
    post(path: string, handler: (request: SunRequest, reply: SunReply) => Promise<void>) {
      map.set(`POST ${path}`, handler);
    },
    get(path: string, handler: (request: SunRequest, reply: SunReply) => Promise<void>) {
      map.set(`GET ${path}`, handler);
    },
    route() {},
    register() {},
    addHook() {},
    setNotFoundHandler() {},
  } as unknown as SunApp;
  return { app, map };
}

/**
 * Builds a native form request.
 *
 * @param body Form fields.
 * @param headers Extra headers.
 * @returns Request shaped for the magic-link handler.
 */
function postRequest(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return {
    method: 'POST',
    url: '/__magic-link',
    raw: { url: '/__magic-link', method: 'POST' },
    headers: { origin, ...headers },
    body,
    query: {},
    params: {},
    ip: '127.0.0.1',
    protocol: 'http',
  } satisfies SunRequest;
}

/**
 * Builds a verify request.
 *
 * @param query Query parameters.
 * @returns Request shaped for the verify handler.
 */
function verifyRequest(query: Record<string, string>) {
  return {
    method: 'GET',
    url: '/__magic-link/verify',
    raw: { url: '/__magic-link/verify', method: 'GET' },
    headers: { origin },
    body: undefined,
    query,
    params: {},
    ip: '127.0.0.1',
    protocol: 'http',
  } satisfies SunRequest;
}

/**
 * Records reply state.
 *
 * @returns A reply and its captured state.
 */
function captureReply() {
  const headers = new Map<string, string>();
  const state = { statusCode: 200, redirectTo: '', body: undefined as unknown };
  const reply = {
    header(name: string, value: string) {
      headers.set(name, value);
      return reply;
    },
    status(code: number) {
      state.statusCode = code;
      return reply;
    },
    send(body: unknown) {
      state.body = body;
      return reply;
    },
    redirect(target: string) {
      state.redirectTo = target;
      return reply;
    },
  } as unknown as SunReply;
  return { reply, headers, state };
}

/**
 * Reads the token out of a captured email.
 *
 * @param message Captured message.
 * @returns Verify token.
 */
function tokenFrom(message: MailMessage) {
  const match = message.text.match(/https?:\/\/\S+/);
  if (!match) throw new Error('Email has no link');
  return new URL(match[0]).searchParams.get('token') ?? '';
}

/**
 * Requests a link through the route and returns its token.
 *
 * @param email Account email.
 * @returns Verify token.
 */
async function requestToken(email: string) {
  const handler = handlers.get('POST /__magic-link');
  if (!handler) throw new Error('Missing request handler');
  const before = sent.length;
  const { reply, state } = captureReply();
  await handler(postRequest({ email, redirect: '/admin' }), reply);
  expect(state.redirectTo).toContain('/login?sent=1');
  const message = sent[before];
  if (!message) throw new Error('No message sent');
  return tokenFrom(message);
}

beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), 'free-chess-magic-'));

  process.env.AUTH_DB_PATH = join(directory, 'auth.db');
  process.env.BETTER_AUTH_URL = origin;

  await migrateAuth(process.env.AUTH_DB_PATH);
  auth = createAuth(process.env.AUTH_DB_PATH, { sendMagicLink: capture });

  const { app, map } = createApp();
  registerAuthRoutes(app, auth);
  handlers = map;

  await createUser(auth, {
    email: 'admin@example.com',
    name: 'Admin',
    password,
    role: 'admin',
  });
  await createUser(auth, {
    email: 'link@example.com',
    name: 'Link',
    password,
    role: 'user',
  });
  linkEmail = 'link@example.com';
  await createUser(auth, {
    email: 'throttle@example.com',
    name: 'Throttle',
    password,
    role: 'user',
  });
  await createUser(auth, {
    email: 'redirect@example.com',
    name: 'Redirect',
    password,
    role: 'user',
  });
  const banned = await createUser(auth, {
    email: 'banned@example.com',
    name: 'Banned',
    password,
    role: 'user',
  });
  bannedEmail = banned.email;

  const signIn = await auth.api.signInEmail({
    body: { email: 'admin@example.com', password },
    headers: new Headers({ origin }),
    asResponse: true,
  });
  const cookie = signIn.headers.getSetCookie()[0].split(';')[0];
  await auth.api.banUser({
    body: { userId: banned.id, banReason: 'Testing' },
    headers: new Headers({ cookie, origin }),
  });
});

beforeEach(() => {
  resetRateLimits();
});

afterAll(() => {
  delete process.env.AUTH_DB_PATH;
  delete process.env.BETTER_AUTH_URL;
  rmSync(directory, { recursive: true, force: true });
});

test('sends a link that points at the app verify route', async () => {
  const before = sent.length;
  const handler = handlers.get('POST /__magic-link');
  if (!handler) throw new Error('Missing request handler');
  const { reply, state } = captureReply();

  await handler(postRequest({ email: linkEmail, redirect: '/admin' }), reply);

  expect(state.redirectTo).toBe('/login?sent=1&redirect=%2Fadmin');
  expect(sent).toHaveLength(before + 1);
  expect(sent[before].to).toBe(linkEmail);
  expect(sent[before].subject).toBe('Sign in to Free Chess');
  expect(sent[before].text).toContain('/__magic-link/verify?token=');
  expect(sent[before].text).toContain('redirect=%2Fadmin');
});

test('verifies a token, sets a session, and redirects', async () => {
  const token = await requestToken(linkEmail);
  const handler = handlers.get('GET /__magic-link/verify');
  if (!handler) throw new Error('Missing verify handler');
  const { reply, headers, state } = captureReply();

  await handler(verifyRequest({ token, redirect: '/admin' }), reply);

  const cookie = headers.get('Set-Cookie');
  expect(state.redirectTo).toBe('/admin');
  expect(cookie).toContain('session_token');

  const session = await getSession(auth, cookie?.split(';')[0]);
  expect(session?.user.email).toBe(linkEmail);
});

test('a token only works once', async () => {
  const token = await requestToken(linkEmail);
  const handler = handlers.get('GET /__magic-link/verify');
  if (!handler) throw new Error('Missing verify handler');

  const first = captureReply();
  await handler(verifyRequest({ token }), first.reply);
  expect(first.state.redirectTo).toBe('/');

  const second = captureReply();
  await handler(verifyRequest({ token }), second.reply);
  expect(second.state.redirectTo).toContain('/login?error=link');
});

test('unknown accounts get the same page and no email', async () => {
  const before = sent.length;
  const handler = handlers.get('POST /__magic-link');
  if (!handler) throw new Error('Missing request handler');
  const { reply, state } = captureReply();

  await handler(postRequest({ email: 'nobody@example.com' }), reply);

  expect(state.redirectTo).toContain('/login?sent=1');
  expect(sent).toHaveLength(before);
});

test('banned accounts get no email and cannot verify a token', async () => {
  const before = sent.length;
  const handler = handlers.get('POST /__magic-link');
  if (!handler) throw new Error('Missing request handler');
  const request = captureReply();

  await handler(postRequest({ email: bannedEmail }), request.reply);

  expect(request.state.redirectTo).toContain('/login?sent=1');
  expect(sent).toHaveLength(before);

  await auth.api.signInMagicLink({
    body: { email: bannedEmail, callbackURL: '/', metadata: { redirect: '/' } },
    headers: new Headers({ origin }),
  });
  const message = sent[sent.length - 1];
  const token = tokenFrom(message);

  const verify = handlers.get('GET /__magic-link/verify');
  if (!verify) throw new Error('Missing verify handler');
  const reply = captureReply();
  await verify(verifyRequest({ token, redirect: '/admin' }), reply.reply);

  expect(reply.state.redirectTo).toContain('/login?error=banned');
});

test('invalid tokens go back to the login page', async () => {
  const handler = handlers.get('GET /__magic-link/verify');
  if (!handler) throw new Error('Missing verify handler');
  const { reply, state } = captureReply();

  await handler(verifyRequest({ token: 'not-a-token' }), reply);

  expect(state.redirectTo).toContain('/login?error=link');
});

test('open redirects are dropped on request and verify', async () => {
  const handler = handlers.get('POST /__magic-link');
  if (!handler) throw new Error('Missing request handler');
  const before = sent.length;
  const request = captureReply();

  await handler(
    postRequest({ email: 'redirect@example.com', redirect: 'https://evil.example' }),
    request.reply,
  );

  const token = tokenFrom(sent[before]);
  expect(sent[before].text).toContain('redirect=%2F');

  const verify = handlers.get('GET /__magic-link/verify');
  if (!verify) throw new Error('Missing verify handler');
  const reply = captureReply();
  await verify(verifyRequest({ token, redirect: '//evil.example' }), reply.reply);

  expect(reply.state.redirectTo).toBe('/');
});

test('the request route throttles after five attempts', async () => {
  const handler = handlers.get('POST /__magic-link');
  if (!handler) throw new Error('Missing request handler');
  const before = sent.length;

  for (let index = 0; index < 6; index += 1) {
    const { reply } = captureReply();
    await handler(postRequest({ email: 'throttle@example.com' }), reply);
  }

  expect(sent).toHaveLength(before + 5);
});

test('production without SMTP refuses to send', async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousUser = process.env.SMTP_USER;
  const previousPassword = process.env.SMTP_PASSWORD;

  process.env.NODE_ENV = 'production';
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASSWORD;

  try {
    const handler = handlers.get('POST /__magic-link');
    if (!handler) throw new Error('Missing request handler');
    const { reply, state } = captureReply();

    await handler(postRequest({ email: linkEmail }), reply);

    expect(state.redirectTo).toContain('/login?error=mail');
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
    if (previousUser === undefined) delete process.env.SMTP_USER;
    else process.env.SMTP_USER = previousUser;
    if (previousPassword === undefined) delete process.env.SMTP_PASSWORD;
    else process.env.SMTP_PASSWORD = previousPassword;
  }
});
