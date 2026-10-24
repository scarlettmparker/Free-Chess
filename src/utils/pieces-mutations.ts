import { defineMutation, MutationError } from '@sun/ssr';
import { auth } from '~/server/auth-instance';
import { getSession, requirePermission } from '~/server/session';
import { savePiece, deletePiece, saveSet, deleteSet } from '~/server/game-pieces';
import type { PieceInput, PieceSetInput } from '~/server/game-pieces';
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
 * Save a piece definition.
 */
defineMutation({
  path: 'pieces/save',
  async handler(body: PieceInput, context) {
    await guard(context.cookie, { piece: ['create'] } satisfies Permission);
    const id = savePiece(body);
    return { id };
  },
});

/**
 * Delete a piece definition.
 */
defineMutation({
  path: 'pieces/delete',
  async handler(body: { id: number }, context) {
    await guard(context.cookie, { piece: ['delete'] } satisfies Permission);
    const ok = deletePiece(body.id);
    if (!ok) throw new MutationError('Cannot delete piece', 400);
    return { ok: true };
  },
});

/**
 * Save a piece set.
 */
defineMutation({
  path: 'piecesets/save',
  async handler(body: PieceSetInput, context) {
    await guard(context.cookie, { pieceset: ['create'] } satisfies Permission);
    const id = saveSet(body);
    return { id };
  },
});

/**
 * Delete a piece set.
 */
defineMutation({
  path: 'piecesets/delete',
  async handler(body: { id: number }, context) {
    await guard(context.cookie, { pieceset: ['delete'] } satisfies Permission);
    const ok = deleteSet(body.id);
    if (!ok) throw new MutationError('Cannot delete piece set', 400);
    return { ok: true };
  },
});
