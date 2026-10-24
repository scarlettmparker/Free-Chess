/**
 * @fileoverview Loopback admin commands for the matchmaking worker.
 * @module server/admin
 */

import { Buffer } from 'node:buffer';
import { timingSafeEqual } from 'node:crypto';
import { mountGame } from '~/utils/index.ts';
import { BUILTIN_DEFINITIONS } from '~/game/piece/builtins';
import { getSet, listPieces } from '~/server/game-pieces';
import { gameState } from '~/game/consts/board.ts';
import { serializeGameState } from '~/utils/game-serialize.ts';
import { clearColor, sessions } from './sessions.ts';

/**
 * Sends a JSON message to every attached socket.
 */
export type Broadcast = (message: unknown) => void;

/**
 * Connected or recently disconnected session.
 */
export type SessionSummary = {
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
 * Result of one admin command.
 */
export type CommandResult = {
  /**
   * Whether the command did something.
   */
  ok: boolean;
  /**
   * Human-readable result.
   */
  message: string;
  /**
   * Session list for the `list` command.
   */
  sessions?: SessionSummary[];
};

/**
 * Commands accepted by the admin API.
 */
export const adminCommands = ['cw', 'cb', 'clear', 'list', 'reset'] as const;

/**
 * Runs one admin command.
 *
 * @param cmd Command name.
 * @param broadcast State broadcaster used by reset.
 * @returns Command result.
 */
export function runCommand(cmd: string, broadcast: Broadcast = () => {}): CommandResult {
  switch (cmd) {
    case 'cb':
      return clearColor('black')
        ? { ok: true, message: 'Cleared black' }
        : { ok: false, message: 'No session for color black' };

    case 'cw':
      return clearColor('white')
        ? { ok: true, message: 'Cleared white' }
        : { ok: false, message: 'No session for color white' };

    case 'clear': {
      const white = clearColor('white');
      const black = clearColor('black');
      return white || black
        ? { ok: true, message: `Cleared ${white ? 'white ' : ''}${black ? 'black' : ''}`.trim() }
        : { ok: false, message: 'No colours to clear' };
    }

    case 'list': {
      const list: SessionSummary[] = [];
      for (const [sessionId, session] of sessions.entries()) {
        list.push({
          sessionId,
          color: session.color || 'none',
          connected: Boolean(session.ws),
          disconnectedAt: session.disconnectedAt ?? null,
        });
      }
      return { ok: true, message: `${list.length} session(s)`, sessions: list };
    }

    case 'reset':
      {
        const set = getSet(1);
        const pieces = listPieces();
        const defs: (typeof BUILTIN_DEFINITIONS)[number][] = [];
        if (set) {
          for (const member of set.members) {
            const piece = pieces.find((candidate) => candidate.id === member.pieceDefinitionId);
            const builtin = piece
              ? BUILTIN_DEFINITIONS.find((definition) => definition.slug === piece.slug)
              : undefined;
            if (builtin) defs.push(builtin);
          }
        }
        mountGame(undefined, defs.length ? defs : undefined);
      }
      gameState.moveHistory = [];
      broadcast({ type: 'state', state: serializeGameState(gameState) });
      return { ok: true, message: 'Game state reset and broadcast' };

    default:
      return {
        ok: false,
        message: `Unknown command. Supported: ${adminCommands.join(', ')}`,
      };
  }
}

/**
 * Checks a bearer token without leaking the comparison length.
 *
 * @param header Authorization header, when present.
 * @param token Expected token. Empty disables the check.
 * @returns True when the request may call the admin API.
 */
export function isAdminAuthorized(header: string | null, token: string) {
  if (!token) return true;
  if (!header) return false;

  const actual = Buffer.from(header);
  const expected = Buffer.from(`Bearer ${token}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
