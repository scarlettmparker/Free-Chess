import type { ServerWebSocket } from 'bun';
import { sessions, assignColor, attachSession as openSession, detachSession } from './sessions.ts';
import { checkServerMove, isEncodedMove, updateGameStatus } from './rules.ts';
import { getInitialState } from './initial-state.ts';
import { gameState, moveType } from '~/game/consts/board.ts';
import { makeMove } from '~/game/move/move.ts';
import {
  deserializeGameState,
  serializeGameState,
  type SerializedGameState,
} from '~/utils/game-serialize.ts';

export type Color = 'white' | 'black' | null;

export type SocketData = {
  /**
   * Session id supplied on the query string, if any.
   */
  sessionId: string | null;
  /**
   * Colour currently assigned to this socket.
   */
  clientColor: Color;
  /**
   * Colour requested on the query string.
   */
  requestedColor: Color;
};

/**
 * Send a JSON object without throwing when the socket is gone.
 *
 * @param ws Socket to send to.
 * @param obj Value to serialise.
 */
export function safeSend(ws: { send(data: string): unknown }, obj: unknown) {
  try {
    ws.send(JSON.stringify(obj));
  } catch {
    // ignore send errors
  }
}

/**
 * Send a message to every connected session.
 *
 * @param obj Value to serialise.
 */
export function broadcast(obj: unknown) {
  for (const session of sessions.values()) {
    if (session.ws) {
      safeSend(session.ws, obj);
    }
  }
}

/**
 * Send the current game state to a client.
 *
 * @param ws Socket to send to.
 */
export function sendGameState(ws: { send(data: string): unknown }) {
  safeSend(ws, {
    type: 'state',
    state: serializeGameState(gameState),
    initial: getInitialState(),
  });
}

/**
 * Reject a move and resend the authoritative state.
 *
 * @param ws Socket that sent the move.
 * @param reason Machine-readable reason.
 */
export function rejectMove(ws: ServerWebSocket<SocketData>, reason: string) {
  safeSend(ws, { type: 'move-rejected', reason });
  sendGameState(ws);
}

/**
 * Reject a connection that cannot be assigned the requested colour.
 *
 * @param ws Socket to reject.
 * @param reason Machine-readable reason.
 */
export function reject(ws: ServerWebSocket<SocketData>, reason: string) {
  safeSend(ws, { type: 'reject', reason });
  ws.close(4000, reason);
}

/**
 * Assign a session on connect: reattach if known, create otherwise.
 *
 * @param ws Socket that opened.
 */
export function handleOpen(ws: ServerWebSocket<SocketData>) {
  const result = openSession(ws.data.sessionId, ws.data.requestedColor, ws);

  if (result.status === 'rejected') {
    reject(ws, result.reason);
    return;
  }

  ws.data.sessionId = result.sessionId;
  ws.data.clientColor = result.color;

  safeSend(ws, {
    type: 'session',
    sessionId: result.sessionId,
    color: result.color,
    status: result.status,
  });
  sendGameState(ws);
}

/**
 * Handle one client message.
 *
 * @param ws Socket that sent the message.
 * @param raw Raw message payload.
 */
export function handleMessage(ws: ServerWebSocket<SocketData>, raw: string | Buffer) {
  try {
    processMessage(ws, raw);
  } catch (error) {
    console.error('WebSocket message handling failed', error);
    safeSend(ws, { type: 'error', reason: 'server-error' });
    sendGameState(ws);
  }
}

/**
 * Process one client message, letting the caller handle failures.
 *
 * @param ws Socket that sent the message.
 * @param raw Raw message payload.
 */
function processMessage(ws: ServerWebSocket<SocketData>, raw: string | Buffer) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.toString());
  } catch {
    return;
  }

  if (!parsed || typeof parsed !== 'object') {
    return;
  }

  const message = parsed as { type?: unknown; color?: unknown; move?: unknown };

  console.log(
    'Received message from client (color=%s, session=%s):',
    ws.data.clientColor,
    ws.data.sessionId,
    message,
  );

  if (message.type === 'hello') {
    if (message.color !== 'white' && message.color !== 'black') {
      return;
    }
    if (gameState.moveHistory.length > 0 && ws.data.clientColor !== message.color) {
      reject(ws, 'game-started');
      return;
    }
    const ok = ws.data.sessionId ? assignColor(ws.data.sessionId, message.color) : false;
    if (!ok) {
      reject(ws, 'color-taken');
      return;
    }
    ws.data.clientColor = message.color;
    safeSend(ws, { type: 'ack', message: 'color set', color: message.color });
    return;
  }

  if (message.type === 'move') {
    if (!isEncodedMove(message.move)) {
      rejectMove(ws, 'invalid-payload');
      return;
    }

    const move = message.move;
    const color = ws.data.clientColor;

    if (!color) {
      rejectMove(ws, 'no-color');
      return;
    }

    const side = color === 'white' ? 0 : 1;
    const rejection = checkServerMove(move, side);
    if (rejection !== null) {
      rejectMove(ws, rejection);
      return;
    }

    const snapshot: SerializedGameState = serializeGameState(gameState);
    try {
      if (makeMove(move, moveType.ALL_MOVES, 0) !== 1) {
        rejectMove(ws, 'illegal-move');
        return;
      }

      gameState.moveHistory.push(move);
      updateGameStatus(move);
    } catch (error) {
      Object.assign(gameState, deserializeGameState(snapshot));
      throw error;
    }

    console.log('Move accepted, updating state');
    const opponentColor = color === 'white' ? 'black' : 'white';
    const opponentSession = Array.from(sessions.values()).find(
      (session) => session.color === opponentColor && session.ws,
    );
    if (opponentSession?.ws) {
      safeSend(opponentSession.ws, { type: 'opponent_move', move });
    }

    broadcast({ type: 'state', state: serializeGameState(gameState), initial: getInitialState() });
  }
}

/**
 * Handle a socket close and start the session grace period.
 *
 * @param ws Socket that closed.
 */
export function handleClose(ws: ServerWebSocket<SocketData>) {
  if (ws.data.sessionId) {
    detachSession(ws.data.sessionId, ws);
  }
  console.log('Client disconnected', 'color:', ws.data.clientColor, 'session:', ws.data.sessionId);
}
