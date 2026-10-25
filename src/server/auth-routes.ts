/**
 * @fileoverview Login and logout routes using Sun (Gaia) auth.
 * @module server/auth-routes
 */

import type { SunApp } from '@sun/ssr/server';


const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || 'http://localhost:8083/graphql';

/**
 * Runs a GraphQL operation against Sun.
 *
 * @param query GraphQL document.
 * @param variables operation variables.
 * @param token optional bearer token.
 * @returns operation data.
 */
async function gql<T>(query: string, variables: Record<string, unknown>, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const clientSecret = process.env.CSRF_SECRET || process.env.BETTER_AUTH_SECRET || '';
  if (clientSecret) {
    headers['X-Client-Secret'] = clientSecret;
    headers['X-Client-Id'] = 'free-chess';
  }
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join(', '));
  if (!json.data) throw new Error('No data returned');
  return json.data;
}

/**
 * Returns a safe redirect path.
 *
 * @param value raw redirect value
 * @returns a safe path
 */
function safeRedirect(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/')) return '/';
  return value;
}

/**
 * Registers native auth routes backed by Sun (Gaia).
 *
 * @param app server instance.
 * @param _auth unused legacy parameter.
 */
export function registerAuthRoutes(app: SunApp, _auth: unknown) {
  app.post('/__login', async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const redirectTo = safeRedirect(body.redirect ?? (request.query as Record<string, unknown>).redirect);

    if (!email || !password) {
      reply.redirect(`/login?error=invalid&redirect=${encodeURIComponent(redirectTo)}`);
      return;
    }

    try {
      const data = await gql<{ gaiaMutations: { login: { token: string } | null } }>(
        'mutation Login($input: LoginInput!) { gaiaMutations { login(input: $input) { token } } }',
        { input: { username: email, password } },
      );
      const token = data.gaiaMutations.login?.token;
      if (!token) throw new Error('Login failed');
      reply.header('Set-Cookie', `free_chess_auth=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=43200`);
      reply.redirect(redirectTo);
    } catch (error) {
      reply.redirect(`/login?error=invalid&redirect=${encodeURIComponent(redirectTo)}`);
    }
  });

  app.post('/__logout', async (_request, reply) => {
    reply.header('Set-Cookie', 'free_chess_auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    reply.redirect('/login');
  });

  app.post('/__magic-link', async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const redirectTo = safeRedirect(body.redirect ?? (request.query as Record<string, unknown>).redirect);

    try {
      await gql(
        'mutation RequestMagicLink($email: String!) { gaiaMutations { requestMagicLink(email: $email) { message } } }',
        { email },
      );
    } catch {
      // silent
    }
    reply.redirect(`/login?sent=1&redirect=${encodeURIComponent(redirectTo)}`);
  });

  app.get('/__magic-link/verify', async (request, reply) => {
    const query = (request.query ?? {}) as Record<string, unknown>;
    const token = typeof query.token === 'string' ? query.token : '';
    const redirectTo = safeRedirect(query.redirect);
    if (!token) {
      reply.redirect(`/login?error=link&redirect=${encodeURIComponent(redirectTo)}`);
      return;
    }
    try {
      const data = await gql<{ gaiaMutations: { verifyMagicLink: { token: string } } }>(
        'mutation VerifyMagicLink($token: String!) { gaiaMutations { verifyMagicLink(token: $token) { token } } }',
        { token },
      );
      const jwt = data.gaiaMutations.verifyMagicLink.token;
      reply.header('Set-Cookie', `free_chess_auth=${encodeURIComponent(jwt)}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=43200`);
      reply.redirect(redirectTo);
    } catch {
      reply.redirect(`/login?error=link&redirect=${encodeURIComponent(redirectTo)}`);
    }
  });

  app.post('/__google', async (_request, reply) => {
    const googleAuthUrl =
      'https://accounts.google.com/o/oauth2/v2/auth' +
      '?client_id=' + encodeURIComponent(process.env.GOOGLE_CLIENT_ID || '') +
      '&redirect_uri=' + encodeURIComponent(process.env.BETTER_AUTH_URL ? `${process.env.BETTER_AUTH_URL}/api/auth/callback/google` : 'http://localhost:5179/api/auth/callback/google') +
      '&response_type=code' +
      '&scope=' + encodeURIComponent('openid email profile') +
      '&access_type=offline';
    reply.redirect(googleAuthUrl);
  });

  app.get('/api/auth/callback/google', async (request, reply) => {
    const query = (request.query ?? {}) as Record<string, unknown>;
    const code = typeof query.code === 'string' ? query.code : '';
    const redirectTo = safeRedirect(query.state);
    if (!code) {
      reply.redirect('/login?error=google');
      return;
    }
    const redirectUri = process.env.BETTER_AUTH_URL
      ? `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`
      : 'http://localhost:5179/api/auth/callback/google';
    try {
      const data = await gql<{ gaiaMutations: { loginWithGoogle: { token: string } } }>(
        'mutation LoginWithGoogle($code: String!, $redirectUri: String!) { gaiaMutations { loginWithGoogle(code: $code, redirectUri: $redirectUri) { token } } }',
        { code, redirectUri },
      );
      const token = data.gaiaMutations.loginWithGoogle.token;
      reply.header('Set-Cookie', `free_chess_auth=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=43200`);
      reply.redirect(redirectTo || '/');
    } catch {
      reply.redirect('/login?error=google');
    }
  });
}