import type { ServerWebSocket } from 'bun';
import { sessions, assignColor, attachSession as openSession, detachSession } from './sessions.ts';
import { checkedForSideToMove, isEncodedMove } from './rules.ts';
import { adminCommands, isAdminAuthorized, runCommand } from './admin.ts';
import { adminToken } from '../../config.js';
import { mountGame } from '~/utils/index.ts';
import { listLayouts, loadLayout } from '~/server/board-layouts';
import { gameState, moveType } from '~/game/consts/board.ts';
import { serializeGameState } from '~/utils/game-serialize.ts';
import { makeMove } from '~/game/move/move.ts';

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

/**
 * Largest client message accepted by the websocket.
 */
const maxPayloadLength = 16 * 1024;

if (process.env.NODE_ENV === 'production' && !adminToken) {
  throw new Error('ADMIN_TOKEN is required in production');
}

/**
 * Check whether an origin is allowed.
 *
 * @param origin Origin header.
 * @returns True if allowed.
 */
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
/**
 * Mount the standard board layout, falling back to the default mount when
 * the database has not been migrated yet.
 */
function mountStandardLayout() {
  const standard = listLayouts().find((layout) => layout.slug === 'standard');
  const loaded = standard ? loadLayout(standard.id) : null;
  if (loaded) mountGame(loaded);
  else mountGame();
}

mountStandardLayout();

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
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.toString());
  } catch {
    return; // ignore non-json
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
      sendGameState(ws);
      return;
    }

    const move = message.move;
    const color = ws.data.clientColor;
    let oldState: ReturnType<typeof serializeGameState> | null = null;

    /**
     * Serialize the pre-move state, only when a reject path needs it.
     */
    const getOldState = () => (oldState ??= serializeGameState(gameState));

    if (!color || gameState.side !== (color === 'white' ? 0 : 1)) {
      console.log("Ignoring move: not player's turn or no color");
      broadcast({ type: 'state', state: getOldState() });
      return;
    }

    const accepted = makeMove(move, moveType.ALL_MOVES, 0);
    if (accepted === 1) {
      console.log('Move accepted, updating state');
      gameState.moveHistory.push(move);
      gameState.checked = checkedForSideToMove();

      // Notify opponent of the move
      const oppColor = color === 'white' ? 'black' : 'white';
      const oppSess = Array.from(sessions.values()).find((s) => s.color === oppColor && s.ws);
      if (oppSess?.ws) {
        safeSend(oppSess.ws, { type: 'opponent_move', move });
      }

      // Broadcast updated state
      broadcast({ type: 'state', state: serializeGameState(gameState) });
    } else {
      console.log('Move rejected, sending old state');
      broadcast({ type: 'state', state: getOldState() });
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
    maxPayloadLength,
    open(ws) {
      console.log('Client connected');
      attachSession(ws);
    },
    message: handleMessage,
    close: handleClose,
  },
});

console.log(`Server listening on http://${host}:${port}`);

try {
  Bun.serve({
    hostname: '127.0.0.1',
    port: adminPort,
    fetch: async (req) => {
      if (!isAdminAuthorized(req.headers.get('authorization'), adminToken)) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const url = new URL(req.url);
      if (req.method === 'GET' && url.pathname === '/') {
        return Response.json({
          commands: adminCommands,
          usage: 'POST /<command>',
        });
      }
      if (req.method !== 'POST') {
        return Response.json({ error: 'POST required' }, { status: 405 });
      }

      const cmd = url.pathname.split('/').filter(Boolean).pop() || '';
      let options: { boardLayoutId?: number } = {};
      if (cmd === 'reset') {
        try {
          const body = (await req.json()) as { boardLayoutId?: unknown };
          if (typeof body?.boardLayoutId === 'number') {
            options = { boardLayoutId: body.boardLayoutId };
          }
        } catch {
          options = {};
        }
      }
      const result = runCommand(cmd, broadcast, options);
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
