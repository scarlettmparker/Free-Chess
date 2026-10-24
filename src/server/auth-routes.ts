/**
 * @fileoverview Login and logout routes for the native form flow.
 * @module server/auth-routes
 */

import type { SunApp, SunReply, SunRequest } from '@sun/ssr/server';
import type { Auth } from './session.ts';
import { safeRedirect } from './redirect.ts';

/**
 * Copies request headers into a Headers object.
 *
 * @param request Incoming request.
 * @returns Headers with undefined values removed.
 */
function requestHeaders(request: SunRequest) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value) headers.set(key, value);
  }
  return headers;
}

/**
 * Reads the HTTP status from a thrown auth error.
 *
 * @param error Error thrown by better-auth.
 * @returns Status code, or zero when absent.
 */
function errorStatus(error: unknown) {
  if (!error || typeof error !== 'object') return 0;
  if ('statusCode' in error) return Number(error.statusCode);
  if ('status' in error) return Number(error.status);
  return 0;
}

/**
 * Redirects back to the login page with an error code.
 *
 * @param reply Response being built.
 * @param code Error code shown by the login form.
 * @param redirectTo Page to return to after a successful retry.
 */
function loginError(reply: SunReply, code: string, redirectTo: string) {
  const target = `/login?error=${code}&redirect=${encodeURIComponent(redirectTo)}`;
  reply.redirect(target);
}

/**
 * Extracts the session cookie from a better-auth response.
 *
 * @param response Response returned by better-auth.
 * @returns The first `Set-Cookie` value, or undefined.
 */
function sessionCookie(response: Response) {
  return response.headers.getSetCookie?.()[0] ?? response.headers.get('set-cookie') ?? undefined;
}

/**
 * Registers the native login and logout form endpoints.
 *
 * @param app Server surface receiving the routes.
 * @param auth Auth instance used for sign-in and sign-out.
 */
export function registerAuthRoutes(app: SunApp, auth: Auth) {
  app.post('/__login', async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const redirectTo = safeRedirect(body.redirect ?? request.query.redirect);

    if (!email || !password) {
      loginError(reply, 'invalid', redirectTo);
      return;
    }

    try {
      const response = await auth.api.signInEmail({
        body: { email, password },
        headers: requestHeaders(request),
        asResponse: true,
      });
      const cookie = sessionCookie(response);
      if (!response.ok || !cookie) {
        loginError(reply, 'invalid', redirectTo);
        return;
      }

      reply.header('Set-Cookie', cookie);
      reply.redirect(redirectTo);
    } catch (error) {
      const code = errorStatus(error) === 429 ? 'rate' : 'invalid';
      loginError(reply, code, redirectTo);
    }
  });

  app.post('/__logout', async (request, reply) => {
    try {
      const response = await auth.api.signOut({
        headers: new Headers({ cookie: request.headers.cookie ?? '' }),
        asResponse: true,
      });
      const cookie = sessionCookie(response);
      if (cookie) {
        reply.header('Set-Cookie', cookie);
      }
    } catch {
      // The cookie is cleared below even when the session is already gone.
    }

    reply.redirect('/login');
  });
}
