/**
 * @fileoverview Defines and sets up all application routes.
 * @module routes
 */
import { renderApp } from '@sun/ssr/server';
import crypto from 'node:crypto';
import { base, isProduction, manifestPath } from '../config.js';
import { registerAuthRoutes } from '../src/server/auth-routes.ts';
import { getCookieValue } from '@sun/api';

/**
 * Verifies a JWT's HMAC-SHA256 signature using the configured secret.
 *
 * @param {string} token JWT.
 * @returns {object|null} decoded payload or null.
 */
function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const data = parts[0] + '.' + parts[1];
  const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  if (expectedSig !== parts[2]) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Resolves a session from the auth cookie.
 *
 * @param {string} cookie raw cookie header.
 * @returns {object|null} session.
 */
function getSession(cookie) {
  if (!cookie) return null;
  const token = getCookieValue(cookie, 'free_chess_auth');
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return { user: { id: payload.sub, role: 'user' } };
}

/**
 * Roles allowed into the admin area.
 */
const ADMIN_ROLES = ['admin', 'game-admin', 'user-admin'];

/**
 * Sets up routes for the Fastify application.
 *
 * @param {import("fastify").FastifyInstance} app Fastify application instance.
 * @param {object} vite Vite dev server instance (optional).
 */
export function setupRoutes(app, vite) {
  registerAuthRoutes(app, null);

  /**
   * Catch-all route for server-side rendering of pages.
   */
  app.setNotFoundHandler({ method: ['GET'] }, async (request, reply) => {
    const requestUrl = new URL(request.raw.url, 'http://localhost');
    const pathname = requestUrl.pathname;
    if (/\.[^/]+$/.test(pathname)) {
      return reply.callNotFound();
    }

    const session = await getSession(request.headers.cookie);
    if (pathname === '/login') {
      if (session) return reply.redirect('/');
    }

    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      if (!session) {
        const target = `${pathname}${requestUrl.search}`;
        return reply.redirect(`/login?redirect=${encodeURIComponent(target)}`);
      }
    }

    let url = pathname.replace(base, '');
    if (!url.startsWith('/')) url = '/' + url;
    if (requestUrl.search) url += requestUrl.search;

    const langHeader = request.headers['accept-language'] || 'en';
    const locale = langHeader.split(',')[0] || 'en';
    const pageName = url.split('/')[1] || 'home';

    try {
      await renderApp(
        {
          vite,
          isProduction,
          url,
          locale,
          pageName,
          manifestPath,
        },
        reply.raw,
      );
    } catch (e) {
      console.error('Error during route handling:', e);
      reply
        .status(500)
        .send(isProduction ? 'Internal Server Error' : `Internal Server Error: ${e.message}`);
    }
  });
}