/**
 * @fileoverview Login and logout routes backed by Sun (Gaia).
 * @module server/auth-routes
 */

import type { SunApp } from '@sun/ssr/server';
import { buildAuthCookie, clearAuthCookie, loginViaGaia, requestMagicLink, verifyMagicLink, loginWithGoogle } from '~/utils/auth';
import { safeRedirect } from './redirect.ts';

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

    const token = await loginViaGaia(email, password);
    if (!token) {
      reply.redirect(`/login?error=invalid&redirect=${encodeURIComponent(redirectTo)}`);
      return;
    }
    reply.header('Set-Cookie', buildAuthCookie(token));
    reply.redirect(redirectTo);
  });

  app.post('/__logout', async (_request, reply) => {
    reply.header('Set-Cookie', clearAuthCookie());
    reply.redirect('/login');
  });

  app.post('/__magic-link', async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const redirectTo = safeRedirect(body.redirect ?? (request.query as Record<string, unknown>).redirect);

    if (email) {
      await requestMagicLink(email);
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

    const jwt = await verifyMagicLink(token);
    if (!jwt) {
      reply.redirect(`/login?error=link&redirect=${encodeURIComponent(redirectTo)}`);
      return;
    }
    reply.header('Set-Cookie', buildAuthCookie(jwt));
    reply.redirect(redirectTo);
  });

  app.post('/__google', async (_request, reply) => {
    const googleAuthUrl =
      'https://accounts.google.com/o/oauth2/v2/auth' +
      '?client_id=' + encodeURIComponent(process.env.GOOGLE_CLIENT_ID || '') +
      '&redirect_uri=' + encodeURIComponent(
        (process.env.BETTER_AUTH_URL || 'http://localhost:5179') + '/api/auth/callback/google',
      ) +
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
    const redirectUri =
      (process.env.BETTER_AUTH_URL || 'http://localhost:5179') + '/api/auth/callback/google';
    const token = await loginWithGoogle(code, redirectUri);
    if (!token) {
      reply.redirect('/login?error=google');
      return;
    }
    reply.header('Set-Cookie', buildAuthCookie(token));
    reply.redirect(redirectTo || '/');
  });
}