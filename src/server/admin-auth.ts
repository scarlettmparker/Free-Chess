/**
 * @fileoverview Shared helpers for authenticated admin API calls.
 * @module server/admin-auth
 */

import { MutationError } from '@sun/ssr';

/**
 * Builds request headers from the caller's cookie header.
 *
 * @param cookie Raw request cookie header.
 * @returns Headers accepted by better-auth.
 */
export function callerHeaders(cookie?: string) {
  return new Headers(cookie ? { cookie } : {});
}

/**
 * Converts a thrown better-auth error into a mutation error.
 *
 * @param error Error thrown by an auth API call.
 * @returns Mutation error carrying the original status and message.
 */
export function asMutationError(error: unknown) {
  if (error instanceof MutationError) return error;

  const status =
    error && typeof error === 'object'
      ? Number(
          ('statusCode' in error && error.statusCode) || ('status' in error && error.status) || 400,
        )
      : 400;
  const message = error instanceof Error ? error.message : 'User action failed';

  return new MutationError(message, Number.isFinite(status) ? status : 400);
}
