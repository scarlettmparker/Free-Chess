/**
 * @fileoverview Transport for the loopback matchmaking admin API.
 * @module utils/admin-command
 */

import { MutationError } from '@sun/ssr';

/**
 * Colour targeted by a clear command.
 */
export type AdminColor = 'white' | 'black' | 'all';

/**
 * Commands accepted by the matchmaking admin API.
 */
export type AdminCommand = 'cw' | 'cb' | 'clear' | 'list' | 'reset';

/**
 * Connected or recently disconnected player session.
 */
export type AdminSession = {
  /**
   * Session id.
   */
  sessionId: string;
  /**
   * Colour held by the session, or "none".
   */
  color: string;
  /**
   * Whether a socket is currently attached.
   */
  connected: boolean;
  /**
   * Last disconnect time, if the session has dropped.
   */
  disconnectedAt: number | null;
};

/**
 * Result returned by an admin command.
 */
export type AdminCommandResult = {
  /**
   * Whether the command did something.
   */
  ok: boolean;
  /**
   * Human-readable result.
   */
  message: string;
  /**
   * Session list for the list command.
   */
  sessions?: AdminSession[];
};

/**
 * Request options for an admin command.
 */
export type AdminCommandOptions = {
  /**
   * Base URL of the admin API.
   */
  baseUrl?: string;
  /**
   * Bearer token sent to the admin API.
   */
  token?: string;
  /**
   * JSON body sent with the command.
   */
  body?: unknown;
  /**
   * Fetch implementation, used by tests.
   */
  fetchImpl?: typeof fetch;
};

/**
 * Calls one loopback admin command.
 *
 * @param command Command to run.
 * @param options Base URL, token, body, and fetch override.
 * @returns Parsed command result.
 */
export async function runAdminCommand(
  command: AdminCommand,
  options: AdminCommandOptions = {},
): Promise<AdminCommandResult> {
  const baseUrl = options.baseUrl ?? process.env.MATCHMAKING_ADMIN_URL ?? 'http://127.0.0.1:4002';
  const token = options.token ?? process.env.ADMIN_TOKEN ?? '';
  const fetchImpl = options.fetchImpl ?? fetch;
  const headers: Record<string, string> = {};
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }
  const hasBody = options.body !== undefined;
  if (hasBody) {
    headers['content-type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/${command}`, {
      method: 'POST',
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(5_000),
    });
  } catch (error) {
    throw new MutationError(
      error instanceof Error ? error.message : 'Admin API request failed',
      502,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new MutationError('Admin API returned invalid JSON', 502);
  }

  if (response.status === 401 || response.status === 403) {
    throw new MutationError('Admin API rejected the request', 502);
  }
  if (response.status >= 500) {
    throw new MutationError('Admin API is unavailable', 502);
  }

  if (
    !body ||
    typeof body !== 'object' ||
    typeof (body as { ok?: unknown }).ok !== 'boolean' ||
    typeof (body as { message?: unknown }).message !== 'string'
  ) {
    throw new MutationError('Admin API returned an unexpected response', 502);
  }

  return body as AdminCommandResult;
}
