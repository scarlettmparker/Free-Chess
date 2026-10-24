/**
 * @fileoverview Defines and sets up all application routes.
 * @module routes
 */
import { renderApp } from '@sun/ssr/server';
import { base, isProduction, manifestPath } from '../config.js';
import { auth } from '../src/server/auth-instance.ts';
import { registerAuthRoutes } from '../src/server/auth-routes.ts';
import { getSession, hasAnyRole } from '../src/server/session.ts';

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
  registerAuthRoutes(app, auth);

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
      reply.status(500).send('Internal Server Error: ' + e.message);
    }
  });
}
