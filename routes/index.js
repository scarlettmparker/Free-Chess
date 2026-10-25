/**
 * @fileoverview Defines and sets up all application routes.
 * @module routes
 */
import { renderApp } from '@sun/ssr/server';
import { base, isProduction, manifestPath } from '../config.js';
import { registerAuthRoutes } from '../src/server/auth-routes.ts';

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || 'http://localhost:8083/graphql';

/**
 * Runs a GraphQL query against Sun (Gaia).
 *
 * @param {string} cookie JWT.
 * @param {string} query GraphQL query text.
 * @param {object} variables query variables.
 * @returns {Promise<any>} query data.
 */
async function gaiaQuery(cookie, query, variables = {}) {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cookie}`,
      'X-Client-Id': 'free-chess',
      'X-Client-Secret': process.env.CSRF_SECRET || process.env.BETTER_AUTH_SECRET || '',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  return json.data;
}

/**
 * Resolves a session from the auth cookie.
 *
 * @param {string} cookie raw cookie header.
 * @returns {Promise<object|null>} session.
 */
async function getSession(cookie) {
  if (!cookie) return null;
  const token = cookie.split(';').map((p) => p.trim()).find((p) => p.startsWith('free_chess_auth='))?.split('=')[1];
  if (!token) return null;
  try {
    const data = await gaiaQuery(decodeURIComponent(token), 'query { gaiaQueries { me { id username } myRoles } }');
    if (!data?.gaiaQueries?.me) return null;
    return { user: { id: data.gaiaQueries.me.id, email: data.gaiaQueries.me.username, role: (data.gaiaQueries.myRoles || []).join(',') } };
  } catch {
    return null;
  }
}

/**
 * Checks whether a session holds any allowed role.
 *
 * @param {object} session session payload.
 * @param {string[]} allowed allowed roles.
 * @returns {boolean} true when allowed.
 */
function hasAnyRole(session, allowed) {
  if (!session) return false;
  const held = new Set((session.user.role || 'user').split(',').map((r) => r.trim()).filter(Boolean));
  return allowed.some((role) => held.has(role));
}

/**
 * Roles allowed into the admin area.
 */
const ADMIN_ROLES = ['admin', 'game-admin', 'user-admin'];

/**
 * Sets up routes for the Fastify application.
 *
 * @param {import("fastify").FastifyInstance} app - The Fastify application instance.
 * @param {object} vite - The Vite dev server instance (optional, only in development).
 */
export function setupRoutes(app, vite) {
  registerAuthRoutes(app, null);

  /**
   * Catch-all route for server-side rendering of pages.
   *
   * @param {import("fastify").FastifyRequest} request - Fastify request object.
   * @param {import("fastify").FastifyReply} reply - Fastify reply object.
   */
  app.setNotFoundHandler({ method: ['GET'] }, async (request, reply) => {
    const requestUrl = new URL(request.raw.url, 'http://localhost');
    const pathname = requestUrl.pathname;
    if (/\.[^/]+$/.test(pathname)) {
      return reply.callNotFound();
    }

    if (pathname === '/login') {
      const session = await getSession(auth, request.headers.cookie);
      if (session) return reply.redirect('/');
    }

    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      const session = await getSession(auth, request.headers.cookie);
      if (!session) {
        const target = `${pathname}${requestUrl.search}`;
        return reply.redirect(`/login?redirect=${encodeURIComponent(target)}`);
      }
      if (!hasAnyRole(session, ADMIN_ROLES)) {
        return reply.status(403).send('Forbidden');
      }
      if (
        (pathname === '/admin/users' || pathname.startsWith('/admin/users/')) &&
        !hasAnyRole(session, ['admin', 'user-admin'])
      ) {
        return reply.status(403).send('Forbidden');
      }
      if (
        (pathname === '/admin/audit' || pathname.startsWith('/admin/audit/')) &&
        !hasAnyRole(session, ['admin'])
      ) {
        return reply.status(403).send('Forbidden');
      }
      if (
        (pathname === '/admin/pieces' || pathname.startsWith('/admin/pieces/')) &&
        !hasAnyRole(session, ['admin'])
      ) {
        return reply.status(403).send('Forbidden');
      }
      if (
        (pathname === '/admin/boards' || pathname.startsWith('/admin/boards/')) &&
        !hasAnyRole(session, ['admin'])
      ) {
        return reply.status(403).send('Forbidden');
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
