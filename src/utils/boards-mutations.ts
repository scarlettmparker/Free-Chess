import { defineMutation, MutationError } from '@sun/ssr';
import { auth } from '~/server/auth-instance';
import { getSession, requirePermission } from '~/server/session';
import { saveLayout, deleteLayout } from '~/server/board-layouts';
import type { BoardLayoutInput } from '~/server/board-layouts';
import type { Permission } from '~/server/permissions';

/**
 * Guard a mutation with a permission check.
 *
 * @param cookie Request cookie.
 * @param permission Required permission.
 * @returns Authenticated session.
 */
async function guard(cookie: string | undefined, permission: Permission) {
  const session = await getSession(auth, cookie);
  if (!session) throw new MutationError('Forbidden', 403);
  const allowed = await requirePermission(auth, session, permission);
  if (!allowed) throw new MutationError('Forbidden', 403);
  return session;
}

/**
 * Save a board layout.
 */
defineMutation({
  path: 'boards/save',
  async handler(body: BoardLayoutInput, context) {
    await guard(context.cookie, { board: ['create'] } satisfies Permission);
    const id = saveLayout(body);
    return { id };
  },
});

/**
 * Delete a board layout.
 */
defineMutation({
  path: 'boards/delete',
  async handler(body: { id: number }, context) {
    await guard(context.cookie, { board: ['delete'] } satisfies Permission);
    const ok = deleteLayout(body.id);
    if (!ok) throw new MutationError('Cannot delete board layout', 400);
    return { ok: true };
  },
});
