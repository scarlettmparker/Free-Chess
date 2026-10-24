/**
 * @fileoverview Guarded user and session administration mutations.
 * @module utils/admin-users-mutations
 */

import { defineMutation, getRequestIp, MutationError } from '@sun/ssr';
import { asMutationError, callerHeaders } from '~/server/admin-auth';
import { recordAudit } from '~/server/audit';
import { auth } from '~/server/auth-instance';
import type { Permission } from '~/server/permissions';
import { getSession, requirePermission, type SessionData } from '~/server/session';
import { toAdminUser } from './admin-user-types';
import { ROLE_OPTIONS } from './roles';

type CreateUserBody = {
  /**
   * Email address used for sign-in.
   */
  email: string;
  /**
   * Display name.
   */
  name: string;
  /**
   * Initial password.
   */
  password: string;
  /**
   * Role assigned to the account.
   */
  role: string;
};

type SetRoleBody = {
  /**
   * Account being changed.
   */
  userId: string;
  /**
   * New role.
   */
  role: string;
};

type SetPasswordBody = {
  /**
   * Account being changed.
   */
  userId: string;
  /**
   * New password.
   */
  password: string;
};

type BanBody = {
  /**
   * Account being banned.
   */
  userId: string;
  /**
   * Reason shown to the account.
   */
  reason?: string;
  /**
   * Ban duration in days, or indefinite.
   */
  expiresInDays?: number;
};

type UserIdBody = {
  /**
   * Account being changed.
   */
  userId: string;
};

type UpdateUserBody = {
  /**
   * Account being changed.
   */
  userId: string;
  /**
   * New display name.
   */
  name?: string;
  /**
   * New email address.
   */
  email?: string;
};

type RevokeSessionBody = {
  /**
   * Token of the session being revoked.
   */
  sessionToken: string;
};

/**
 * Rejects callers without the requested permission.
 *
 * @param cookie Raw request cookie header.
 * @param permission Permission the caller must hold.
 * @returns The authenticated session.
 */
async function guard(cookie: string | undefined, permission: Permission) {
  const session = await getSession(auth, cookie);
  if (!session) {
    throw new MutationError('Forbidden', 403);
  }
  const allowed = await requirePermission(auth, session, permission);
  if (!allowed) {
    throw new MutationError('Forbidden', 403);
  }
  return session;
}

/**
 * Validates a role before it reaches better-auth.
 *
 * @param role Role name.
 */
function assertRole(role: string) {
  if (!ROLE_OPTIONS.includes(role as (typeof ROLE_OPTIONS)[number])) {
    throw new MutationError('Unknown role', 400);
  }
}

/**
 * Validates a password before it reaches better-auth.
 *
 * @param password Plain password.
 */
function assertPassword(password: string) {
  if (password.length < 12) {
    throw new MutationError('Password must be at least 12 characters', 400);
  }
}

/**
 * Runs an admin action and records its outcome.
 *
 * @param session Caller session.
 * @param action Audit action name.
 * @param target Affected resource.
 * @param run Action to run.
 * @param successDetail Extra context for a successful action.
 * @returns Action result.
 */
async function audited<T>(
  session: SessionData,
  action: string,
  target: string,
  run: () => Promise<T>,
  successDetail?: string,
) {
  try {
    const result = await run();
    recordAudit({
      action,
      target,
      outcome: 'success',
      detail: successDetail,
      actor: session.user,
      ip: getRequestIp(),
    });
    return result;
  } catch (error) {
    recordAudit({
      action,
      target,
      outcome: 'failure',
      detail: error instanceof Error ? error.message : 'Action failed',
      actor: session.user,
      ip: getRequestIp(),
    });
    throw error;
  }
}

defineMutation({
  path: 'user/create',
  async handler(body: CreateUserBody, context) {
    const session = await guard(context.cookie, { user: ['create', 'set-role'] });
    if (!body.email.trim() || !body.name.trim()) {
      throw new MutationError('Email and name are required', 400);
    }
    assertPassword(body.password);
    assertRole(body.role);

    return audited(
      session,
      'user.create',
      body.email.trim().toLowerCase(),
      async () => {
        try {
          const result = await auth.api.createUser({
            body: {
              email: body.email.trim().toLowerCase(),
              name: body.name.trim(),
              password: body.password,
              role: body.role as (typeof ROLE_OPTIONS)[number],
            },
            headers: callerHeaders(context.cookie),
          });
          return toAdminUser(result.user);
        } catch (error) {
          throw asMutationError(error);
        }
      },
      `role=${body.role}`,
    );
  },
});

defineMutation({
  path: 'user/set-role',
  async handler(body: SetRoleBody, context) {
    const session = await guard(context.cookie, { user: ['set-role'] });
    if (body.userId === session.user.id) {
      throw new MutationError('You cannot change your own role', 400);
    }
    assertRole(body.role);

    return audited(
      session,
      'user.set-role',
      body.userId,
      async () => {
        try {
          const result = await auth.api.setRole({
            body: { userId: body.userId, role: body.role as (typeof ROLE_OPTIONS)[number] },
            headers: callerHeaders(context.cookie),
          });
          return toAdminUser(result.user);
        } catch (error) {
          throw asMutationError(error);
        }
      },
      `role=${body.role}`,
    );
  },
});

defineMutation({
  path: 'user/set-password',
  async handler(body: SetPasswordBody, context) {
    const session = await guard(context.cookie, { user: ['set-password'] });
    assertPassword(body.password);

    return audited(session, 'user.set-password', body.userId, async () => {
      try {
        await auth.api.setUserPassword({
          body: { userId: body.userId, newPassword: body.password },
          headers: callerHeaders(context.cookie),
        });
        return { status: true };
      } catch (error) {
        throw asMutationError(error);
      }
    });
  },
});

defineMutation({
  path: 'user/ban',
  async handler(body: BanBody, context) {
    const session = await guard(context.cookie, { user: ['ban'] });
    if (body.userId === session.user.id) {
      throw new MutationError('You cannot ban your own account', 400);
    }
    const expiresInDays =
      typeof body.expiresInDays === 'number' && body.expiresInDays > 0
        ? body.expiresInDays
        : undefined;

    return audited(
      session,
      'user.ban',
      body.userId,
      async () => {
        try {
          const result = await auth.api.banUser({
            body: {
              userId: body.userId,
              banReason: body.reason?.trim() || undefined,
              banExpiresIn: expiresInDays ? expiresInDays * 86_400 : undefined,
            },
            headers: callerHeaders(context.cookie),
          });
          return toAdminUser(result.user);
        } catch (error) {
          throw asMutationError(error);
        }
      },
      expiresInDays ? `expiresIn=${expiresInDays}d` : 'indefinite',
    );
  },
});

defineMutation({
  path: 'user/unban',
  async handler(body: UserIdBody, context) {
    const session = await guard(context.cookie, { user: ['ban'] });

    return audited(session, 'user.unban', body.userId, async () => {
      try {
        const result = await auth.api.unbanUser({
          body: { userId: body.userId },
          headers: callerHeaders(context.cookie),
        });
        return toAdminUser(result.user);
      } catch (error) {
        throw asMutationError(error);
      }
    });
  },
});

defineMutation({
  path: 'user/delete',
  async handler(body: UserIdBody, context) {
    const session = await guard(context.cookie, { user: ['delete'] });
    if (body.userId === session.user.id) {
      throw new MutationError('You cannot delete your own account', 400);
    }

    return audited(session, 'user.delete', body.userId, async () => {
      try {
        await auth.api.removeUser({
          body: { userId: body.userId },
          headers: callerHeaders(context.cookie),
        });
        return { success: true };
      } catch (error) {
        throw asMutationError(error);
      }
    });
  },
});

defineMutation({
  path: 'user/update',
  async handler(body: UpdateUserBody, context) {
    const name = typeof body.name === 'string' ? body.name.trim() : undefined;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : undefined;
    if (!name && !email) {
      throw new MutationError('Nothing to update', 400);
    }

    const cookie = context.cookie;
    const session = await getSession(auth, cookie);
    if (!session) {
      throw new MutationError('Forbidden', 403);
    }
    if (name && !(await requirePermission(auth, session, { user: ['update'] }))) {
      throw new MutationError('Forbidden', 403);
    }
    if (email && !(await requirePermission(auth, session, { user: ['set-email'] }))) {
      throw new MutationError('Forbidden', 403);
    }

    return audited(session, 'user.update', body.userId, async () => {
      try {
        const result = await auth.api.adminUpdateUser({
          body: {
            userId: body.userId,
            data: {
              ...(name ? { name } : {}),
              ...(email ? { email } : {}),
            },
          },
          headers: callerHeaders(cookie),
        });
        return toAdminUser(result);
      } catch (error) {
        throw asMutationError(error);
      }
    });
  },
});

defineMutation({
  path: 'session/revoke',
  async handler(body: RevokeSessionBody, context) {
    const session = await guard(context.cookie, { session: ['revoke'] });

    return audited(session, 'session.revoke', 'session', async () => {
      try {
        await auth.api.revokeUserSession({
          body: { sessionToken: body.sessionToken },
          headers: callerHeaders(context.cookie),
        });
        return { success: true };
      } catch (error) {
        throw asMutationError(error);
      }
    });
  },
});

defineMutation({
  path: 'session/revoke-all',
  async handler(body: UserIdBody, context) {
    const session = await guard(context.cookie, { session: ['revoke'] });

    return audited(session, 'session.revoke-all', body.userId, async () => {
      try {
        await auth.api.revokeUserSessions({
          body: { userId: body.userId },
          headers: callerHeaders(context.cookie),
        });
        return { success: true };
      } catch (error) {
        throw asMutationError(error);
      }
    });
  },
});
