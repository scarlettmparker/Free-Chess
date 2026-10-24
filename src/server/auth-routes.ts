/**
 * @fileoverview Login and logout routes for the native form flow.
 * @module server/auth-routes
 */

import type { SunApp, SunReply, SunRequest } from '@sun/ssr/server';
import { isMailerConfigured } from './mailer.ts';
import { rateLimit } from './rate-limit.ts';
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
 * Checks whether an auth error marks a banned account.
 *
 * @param error Error thrown by better-auth.
 * @returns True when the account is banned.
 */
function isBannedError(error: unknown) {
  if (!error || typeof error !== 'object' || !('body' in error)) return false;
  const body = error.body;
  return Boolean(body && typeof body === 'object' && 'code' in body && body.code === 'BANNED_USER');
}

/**
 * Checks whether a response body reports a banned account.
 *
 * @param response Response returned by better-auth.
 * @returns True when the body carries the banned code.
 */
async function isBannedResponse(response: Response) {
  try {
    const body = (await response.clone().json()) as { code?: string };
    return body.code === 'BANNED_USER';
  } catch {
    return false;
  }
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
 * Redirects to the login page with a link-sent notice.
 *
 * @param reply Response being built.
 * @param redirectTo Page to open after sign-in.
 */
function magicLinkSent(reply: SunReply, redirectTo: string) {
  reply.redirect(`/login?sent=1&redirect=${encodeURIComponent(redirectTo)}`);
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

  app.post('/__magic-link', async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const redirectTo = safeRedirect(body.redirect ?? request.query.redirect);

    if (!email) {
      magicLinkSent(reply, redirectTo);
      return;
    }

    if (process.env.NODE_ENV === 'production' && !isMailerConfigured()) {
      loginError(reply, 'mail', redirectTo);
      return;
    }

    if (!rateLimit(`${request.ip || 'unknown'}:${email}`, { windowMs: 15 * 60_000, max: 5 })) {
      magicLinkSent(reply, redirectTo);
      return;
    }

    try {
      const context = await auth.$context;
      const existing = await context.internalAdapter.findUserByEmail(email, {
        includeAccounts: false,
      });
      if (!existing || (existing.user as { banned?: boolean | null }).banned) {
        magicLinkSent(reply, redirectTo);
        return;
      }
    } catch (error) {
      console.error('Magic link lookup failed:', error);
      magicLinkSent(reply, redirectTo);
      return;
    }

    try {
      await auth.api.signInMagicLink({
        body: {
          email,
          callbackURL: redirectTo,
          metadata: { redirect: redirectTo },
        },
        headers: requestHeaders(request),
      });
    } catch (error) {
      console.error('Magic link request failed:', error);
    }

    magicLinkSent(reply, redirectTo);
  });

  app.get('/__magic-link/verify', async (request, reply) => {
    const query = (request.query ?? {}) as Record<string, unknown>;
    const token = typeof query.token === 'string' ? query.token : '';
    const redirectTo = safeRedirect(query.redirect);

    if (!token) {
      loginError(reply, 'link', redirectTo);
      return;
    }

    try {
      const response = await auth.api.magicLinkVerify({
        query: { token },
        headers: requestHeaders(request),
        asResponse: true,
      });
      const cookie = sessionCookie(response);

      if (!response.ok || !cookie) {
        const banned = await isBannedResponse(response);
        loginError(reply, banned ? 'banned' : 'link', redirectTo);
        return;
      }

      const result = (await response.clone().json()) as {
        user?: { banned?: boolean | null };
      };

      if (result.user?.banned) {
        try {
          const signOutResponse = await auth.api.signOut({
            headers: new Headers({ cookie: cookie.split(';')[0] }),
            asResponse: true,
          });
          const cleared = sessionCookie(signOutResponse);
          if (cleared) reply.header('Set-Cookie', cleared);
        } catch {
          // A banned account stays locked out even if the session lingers.
        }

        loginError(reply, 'banned', redirectTo);
        return;
      }

      reply.header('Set-Cookie', cookie);
      reply.redirect(redirectTo);
    } catch (error) {
      if (isBannedError(error)) {
        loginError(reply, 'banned', redirectTo);
        return;
      }

      console.error('Magic link verify failed:', error);
      loginError(reply, 'link', redirectTo);
    }
  });
}
