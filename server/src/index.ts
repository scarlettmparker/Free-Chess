import type { ServerWebSocket } from 'bun';
import {
  sessions,
  assignColor,
  attachSession as openSession,
  clearColor,
  detachSession,
} from './sessions.ts';
import { mountGame } from '~/utils/index.ts';
import { charPieces, colors, gameState, getBitboard, moveType } from '~/game/consts/board.ts';
import { serializeGameState } from '~/utils/game-serialize.ts';
import { makeMove } from '~/game/move/move.ts';
import { isSquareAttacked } from '~/game/board/attacks.ts';
import { lsbIndex } from '~/game/board/bb.ts';

type Color = 'white' | 'black' | null;

type SocketData = {
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

const host = Bun.env.HOST || '0.0.0.0';
const port = Number(Bun.env.PORT) || 4001;

/**
 * Optional comma-separated host allowlist for browser connections. Empty
 * accepts every origin, which is what local development uses.
 */
const allowedOrigins = (Bun.env.ALLOWED_WS_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

/**
 * Loopback-only admin port. Not reverse-proxied.
 */
const adminPort = Number(Bun.env.ADMIN_PORT) || port + 1;

function isOriginAllowed(origin: string | null) {
  if (!allowedOrigins.length) return true;
  if (!origin) return false;
  try {
    return allowedOrigins.includes(new URL(origin).host);
  } catch {
    return false;
  }
}

// initialize game state on server startup
mountGame();

/**
 * Send a JSON object safely over a WebSocket.
 */
function safeSend(ws: { send(data: string): unknown }, obj: unknown) {
  try {
    ws.send(JSON.stringify(obj));
  } catch {
    // ignore send errors
  }
}

/**
 * Broadcast a message to all connected sessions.
 */
function broadcast(obj: unknown) {
  for (const sess of sessions.values()) {
    if (sess.ws) {
      safeSend(sess.ws, obj);
    }
  }
}

/**
 * Send the current serialized game state to a client.
 */
function sendGameState(ws: { send(data: string): unknown }) {
  safeSend(ws, { type: 'state', state: serializeGameState(gameState) });
}

/**
 * Reject a connection that cannot be assigned the requested color.
 */
function reject(ws: ServerWebSocket<SocketData>, reason: string) {
  safeSend(ws, { type: 'reject', reason });
  ws.close(4000, reason);
}

/**
 * Assign a session on connect: reattach if known, create otherwise.
 */
function attachSession(ws: ServerWebSocket<SocketData>) {
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
 * Handle a client message.
 */
function handleMessage(ws: ServerWebSocket<SocketData>, raw: string | Buffer) {
  let parsed: any = raw.toString();
  try {
    parsed = JSON.parse(parsed);
  } catch {
    return; // ignore non-json
  }

  console.log(
    'Received message from client (color=%s, session=%s):',
    ws.data.clientColor,
    ws.data.sessionId,
    parsed,
  );

  if (parsed?.type === 'hello' && parsed.color) {
    const ok = ws.data.sessionId ? assignColor(ws.data.sessionId, parsed.color) : false;
    if (!ok) {
      reject(ws, 'color-taken');
      return;
    }
    ws.data.clientColor = parsed.color;
    safeSend(ws, { type: 'ack', message: 'color set', color: parsed.color });
    return;
  }

  if (parsed?.type === 'move' && parsed.move !== undefined) {
    const color = ws.data.clientColor;
    const oldStateJson = serializeGameState(gameState);

    if (!color || gameState.side !== (color === 'white' ? 0 : 1)) {
      console.log("Ignoring move: not player's turn or no color");
      broadcast({ type: 'state', state: oldStateJson });
      return;
    }

    const accepted = makeMove(parsed.move, moveType.ALL_MOVES, 0);
    if (accepted === 1) {
      console.log('Move accepted, updating state');
      gameState.moveHistory.push(parsed.move);
      gameState.checked = [false, false];

      // check if king is in check
      const sideToMove = gameState.side;
      const opponent = sideToMove ^ 1;

      // we probably shouldn't care about this server side
      const whiteKing =
        sideToMove === colors.WHITE ? getBitboard(charPieces.K) : getBitboard(charPieces.k);
      const kingSquare = lsbIndex(whiteKing.lo, whiteKing.hi);

      gameState.checked[gameState.side] = isSquareAttacked(kingSquare, opponent);

      // Notify opponent of the move
      const oppColor = color === 'white' ? 'black' : 'white';
      const oppSess = Array.from(sessions.values()).find((s) => s.color === oppColor && s.ws);
      if (oppSess?.ws) {
        safeSend(oppSess.ws, { type: 'opponent_move', move: parsed.move });
      }

      // Broadcast updated state
      broadcast({ type: 'state', state: serializeGameState(gameState) });
    } else {
      console.log('Move rejected, sending old state');
      broadcast({ type: 'state', state: oldStateJson });
    }
  }
}

/**
 * Log a client disconnect and start the session's grace period.
 */
function handleClose(ws: ServerWebSocket<SocketData>) {
  if (ws.data.sessionId) {
    detachSession(ws.data.sessionId, ws);
  }
  console.log('Client disconnected', 'color:', ws.data.clientColor, 'session:', ws.data.sessionId);
}

Bun.serve<SocketData>({
  hostname: host,
  port,
  fetch(req, server) {
    const url = new URL(req.url);
    const isUpgrade = req.headers.get('upgrade')?.toLowerCase() === 'websocket';

    if (!isUpgrade) {
      if (url.pathname === '/') {
        return new Response('Free-Chess WebSocket server is running.');
      }
      return new Response('Expected a WebSocket upgrade', { status: 400 });
    }

    if (!isOriginAllowed(req.headers.get('origin'))) {
      return new Response('Origin not allowed', { status: 403 });
    }

    const colorParam = url.searchParams.get('color');
    const requestedColor: Color =
      colorParam === 'white' || colorParam === 'black' ? colorParam : null;

    const data: SocketData = {
      sessionId: url.searchParams.get('sessionId'),
      clientColor: null,
      requestedColor,
    };

    if (server.upgrade(req, { data })) {
      return;
    }
    return new Response('Expected a WebSocket upgrade', { status: 400 });
  },
  websocket: {
    open(ws) {
      console.log('Client connected');
      attachSession(ws);
    },
    message: handleMessage,
    close: handleClose,
  },
});

console.log(`Server listening on http://${host}:${port}`);

type SessionSummary = {
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

type CommandResult = {
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
 * Run one admin/CLI command. Shared by stdin and the loopback HTTP server.
 */
function runCommand(cmd: string): CommandResult {
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
      for (const [sessionId, sess] of sessions.entries()) {
        list.push({
          sessionId,
          color: sess.color || 'none',
          connected: Boolean(sess.ws),
          disconnectedAt: sess.disconnectedAt ?? null,
        });
      }
      return { ok: true, message: `${list.length} session(s)`, sessions: list };
    }

    case 'reset':
      mountGame();
      gameState.moveHistory = [];
      broadcast({ type: 'state', state: serializeGameState(gameState) });
      return { ok: true, message: 'Game state reset and broadcast' };

    default:
      return {
        ok: false,
        message: 'Unknown command. Supported: cb, cw, clear, list, reset',
      };
  }
}

try {
  Bun.serve({
    hostname: '127.0.0.1',
    port: adminPort,
    fetch(req) {
      const url = new URL(req.url);
      if (req.method === 'GET' && url.pathname === '/') {
        return Response.json({
          commands: ['cw', 'cb', 'clear', 'list', 'reset'],
          usage: 'POST /<command>',
        });
      }
      if (req.method !== 'POST') {
        return Response.json({ error: 'POST required' }, { status: 405 });
      }

      const cmd = url.pathname.split('/').filter(Boolean).pop() || '';
      const result = runCommand(cmd);
      return Response.json(result, { status: result.ok ? 200 : 400 });
    },
  });
  console.log(`Admin listening on http://127.0.0.1:${adminPort}`);
} catch (error) {
  console.error('Admin server failed to start:', error);
}

process.stdin.setEncoding('utf8');
process.stdin.on('data', (data) => {
  const cmd = String(data || '').trim();
  if (!cmd) return;
  console.log(runCommand(cmd).message);
});
