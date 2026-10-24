/**
 * @fileoverview Login and logout routes for the native form flow.
 * @module server/auth-routes
 */

import type { SunApp, SunReply, SunRequest } from '@sun/ssr/server';
import { isGoogleConfigured } from './auth.ts';
import { recordAudit } from './audit.ts';
import { isMailerConfigured } from './mailer.ts';
import { rateLimit } from './rate-limit.ts';
import { getSession, type Auth } from './session.ts';
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
 * Extracts every Set-Cookie value from a better-auth response.
 *
 * @param response Response returned by better-auth.
 * @returns Cookie values, or an empty array.
 */
function cookiesOf(response: Response) {
  const list = response.headers.getSetCookie?.() ?? [];
  if (list.length) return list;
  const single = response.headers.get('set-cookie');
  return single ? [single] : [];
}

/**
 * Picks the session cookie, falling back to the first cookie.
 *
 * @param response Response returned by better-auth.
 * @returns The session `Set-Cookie` value, or undefined.
 */
function authCookie(response: Response) {
  const cookies = cookiesOf(response);
  return cookies.find((cookie) => cookie.includes('session_token')) ?? cookies[0];
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

    if (
      !rateLimit(`login:${request.ip || 'unknown'}:${email}`, { windowMs: 15 * 60_000, max: 10 })
    ) {
      recordAudit({
        action: 'auth.login',
        outcome: 'failure',
        target: email,
        detail: 'rate-limited',
        ip: request.ip,
      });
      loginError(reply, 'rate', redirectTo);
      return;
    }

    try {
      const response = await auth.api.signInEmail({
        body: { email, password },
        headers: requestHeaders(request),
        asResponse: true,
      });
      const cookie = authCookie(response);
      if (!response.ok || !cookie) {
        recordAudit({
          action: 'auth.login',
          outcome: 'failure',
          target: email,
          detail: 'invalid',
          ip: request.ip,
        });
        loginError(reply, 'invalid', redirectTo);
        return;
      }

      const session = await getSession(auth, cookie.split(';')[0]);
      recordAudit({
        action: 'auth.login',
        outcome: 'success',
        target: email,
        actor: session?.user ?? null,
        ip: request.ip,
      });

      reply.header('Set-Cookie', cookie);
      reply.redirect(redirectTo);
    } catch (error) {
      const code = errorStatus(error) === 429 ? 'rate' : 'invalid';
      recordAudit({
        action: 'auth.login',
        outcome: 'failure',
        target: email,
        detail: code,
        ip: request.ip,
      });
      loginError(reply, code, redirectTo);
    }
  });

  app.post('/__logout', async (request, reply) => {
    const session = await getSession(auth, request.headers.cookie);
    try {
      const response = await auth.api.signOut({
        headers: new Headers({ cookie: request.headers.cookie ?? '' }),
        asResponse: true,
      });
      const cookie = authCookie(response);
      if (cookie) {
        reply.header('Set-Cookie', cookie);
      }
    } catch {
      // The cookie is cleared below even when the session is already gone.
    }

    recordAudit({
      action: 'auth.logout',
      outcome: 'success',
      actor: session?.user ?? null,
      ip: request.ip,
    });

    reply.redirect('/login');
  });

  app.post('/__magic-link', async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const redirectTo = safeRedirect(body.redirect ?? request.query.redirect);

    if (!email) {
      recordAudit({
        action: 'auth.magic-link.request',
        outcome: 'failure',
        detail: 'empty-email',
        ip: request.ip,
      });
      magicLinkSent(reply, redirectTo);
      return;
    }

    if (process.env.NODE_ENV === 'production' && !isMailerConfigured()) {
      recordAudit({
        action: 'auth.magic-link.request',
        outcome: 'failure',
        target: email,
        detail: 'mail-unconfigured',
        ip: request.ip,
      });
      loginError(reply, 'mail', redirectTo);
      return;
    }

    if (!rateLimit(`${request.ip || 'unknown'}:${email}`, { windowMs: 15 * 60_000, max: 5 })) {
      recordAudit({
        action: 'auth.magic-link.request',
        outcome: 'failure',
        target: email,
        detail: 'rate-limited',
        ip: request.ip,
      });
      magicLinkSent(reply, redirectTo);
      return;
    }

    try {
      const context = await auth.$context;
      const existing = await context.internalAdapter.findUserByEmail(email, {
        includeAccounts: false,
      });
      if (!existing || (existing.user as { banned?: boolean | null }).banned) {
        recordAudit({
          action: 'auth.magic-link.request',
          outcome: 'failure',
          target: email,
          detail: existing ? 'banned' : 'unknown-account',
          ip: request.ip,
        });
        magicLinkSent(reply, redirectTo);
        return;
      }
    } catch (error) {
      console.error('Magic link lookup failed:', error);
      recordAudit({
        action: 'auth.magic-link.request',
        outcome: 'failure',
        target: email,
        detail: 'lookup-failed',
        ip: request.ip,
      });
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
      recordAudit({
        action: 'auth.magic-link.request',
        outcome: 'success',
        target: email,
        ip: request.ip,
      });
    } catch (error) {
      console.error('Magic link request failed:', error);
      recordAudit({
        action: 'auth.magic-link.request',
        outcome: 'failure',
        target: email,
        detail: 'send-failed',
        ip: request.ip,
      });
    }

    magicLinkSent(reply, redirectTo);
  });

  app.get('/__magic-link/verify', async (request, reply) => {
    const query = (request.query ?? {}) as Record<string, unknown>;
    const token = typeof query.token === 'string' ? query.token : '';
    const redirectTo = safeRedirect(query.redirect);

    if (!token) {
      recordAudit({
        action: 'auth.magic-link.verify',
        outcome: 'failure',
        detail: 'invalid-token',
        ip: request.ip,
      });
      loginError(reply, 'link', redirectTo);
      return;
    }

    try {
      const response = await auth.api.magicLinkVerify({
        query: { token },
        headers: requestHeaders(request),
        asResponse: true,
      });
      const cookie = authCookie(response);

      if (!response.ok || !cookie) {
        const banned = await isBannedResponse(response);
        recordAudit({
          action: 'auth.magic-link.verify',
          outcome: 'failure',
          detail: banned ? 'banned' : 'invalid-token',
          ip: request.ip,
        });
        loginError(reply, banned ? 'banned' : 'link', redirectTo);
        return;
      }

      const result = (await response.clone().json()) as {
        user?: { id?: string; email?: string; banned?: boolean | null };
      };

      if (result.user?.banned) {
        try {
          const signOutResponse = await auth.api.signOut({
            headers: new Headers({ cookie: cookie.split(';')[0] }),
            asResponse: true,
          });
          const cleared = authCookie(signOutResponse);
          if (cleared) reply.header('Set-Cookie', cleared);
        } catch {
          // A banned account stays locked out even if the session lingers.
        }

        recordAudit({
          action: 'auth.magic-link.verify',
          outcome: 'failure',
          target: result.user.email ?? null,
          detail: 'banned',
          ip: request.ip,
        });
        loginError(reply, 'banned', redirectTo);
        return;
      }

      recordAudit({
        action: 'auth.magic-link.verify',
        outcome: 'success',
        target: result.user?.email ?? null,
        actor: result.user ?? null,
        ip: request.ip,
      });

      reply.header('Set-Cookie', cookie);
      reply.redirect(redirectTo);
    } catch (error) {
      if (isBannedError(error)) {
        recordAudit({
          action: 'auth.magic-link.verify',
          outcome: 'failure',
          detail: 'banned',
          ip: request.ip,
        });
        loginError(reply, 'banned', redirectTo);
        return;
      }

      console.error('Magic link verify failed:', error);
      recordAudit({
        action: 'auth.magic-link.verify',
        outcome: 'failure',
        detail: 'verify-failed',
        ip: request.ip,
      });
      loginError(reply, 'link', redirectTo);
    }
  });

  app.post('/__google', async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const redirectTo = safeRedirect(body.redirect ?? request.query.redirect);

    if (!isGoogleConfigured()) {
      loginError(reply, 'google', redirectTo);
      return;
    }

    try {
      const response = await auth.api.signInSocial({
        body: {
          provider: 'google',
          callbackURL: `/__google/verify?redirect=${encodeURIComponent(redirectTo)}`,
          errorCallbackURL: '/__google/error',
          newUserCallbackURL: '/__google/error',
          disableRedirect: true,
        },
        headers: requestHeaders(request),
        asResponse: true,
      });
      const result = (await response.json()) as { url?: string };
      const cookie = authCookie(response);

      if (!response.ok || !result.url) {
        throw new Error('Google sign-in did not return an authorization URL');
      }

      if (cookie) reply.header('Set-Cookie', cookie);
      reply.redirect(result.url);
    } catch (error) {
      console.error('Google sign-in failed:', error);
      recordAudit({
        action: 'auth.login',
        outcome: 'failure',
        detail: 'google',
        ip: request.ip,
      });
      loginError(reply, 'google', redirectTo);
    }
  });

  app.get('/api/auth/callback/google', async (request, reply) => {
    try {
      const response = await auth.api.callbackOAuth({
        params: { id: 'google' },
        query: (request.query ?? {}) as Record<string, string>,
        headers: requestHeaders(request),
        asResponse: true,
      });
      const cookie = authCookie(response);
      const location = response.headers.get('location') ?? '';

      if (cookie) reply.header('Set-Cookie', cookie);
      reply.redirect(location.startsWith('/__google/') ? location : '/login?error=google');
    } catch (error) {
      console.error('Google callback failed:', error);
      recordAudit({
        action: 'auth.login',
        outcome: 'failure',
        detail: 'google',
        ip: request.ip,
      });
      loginError(reply, 'google', '/');
    }
  });

  app.get('/__google/verify', async (request, reply) => {
    const query = (request.query ?? {}) as Record<string, unknown>;
    const redirectTo = safeRedirect(query.redirect);
    const session = await getSession(auth, request.headers.cookie);

    if (!session) {
      recordAudit({
        action: 'auth.login',
        outcome: 'failure',
        detail: 'google-session',
        ip: request.ip,
      });
      loginError(reply, 'google', redirectTo);
      return;
    }

    if ((session.user as { banned?: boolean | null }).banned) {
      try {
        const response = await auth.api.signOut({
          headers: new Headers({ cookie: request.headers.cookie ?? '' }),
          asResponse: true,
        });
        const cleared = authCookie(response);
        if (cleared) reply.header('Set-Cookie', cleared);
      } catch {
        // A banned account stays locked out even if the session lingers.
      }

      recordAudit({
        action: 'auth.login',
        outcome: 'failure',
        target: session.user.email,
        detail: 'banned',
        ip: request.ip,
      });
      loginError(reply, 'banned', redirectTo);
      return;
    }

    recordAudit({
      action: 'auth.login',
      outcome: 'success',
      target: session.user.email,
      actor: session.user,
      ip: request.ip,
    });
    reply.redirect(redirectTo);
  });

  app.get('/__google/error', async (request, reply) => {
    const query = (request.query ?? {}) as Record<string, unknown>;
    const code = typeof query.error === 'string' ? query.error : 'google';
    const banned = code === 'BANNED_USER';

    recordAudit({
      action: 'auth.login',
      outcome: 'failure',
      detail: banned ? 'banned' : 'google',
      ip: request.ip,
    });
    loginError(reply, banned ? 'banned' : 'google', '/');
  });
}
