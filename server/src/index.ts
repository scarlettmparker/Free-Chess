import type { ServerWebSocket } from 'bun';
import {
  sessions,
  colorMap,
  chooseColorForReattach,
  createSession,
  assignColor,
  clearColor,
} from './sessions.ts';
import { mountGame } from '~/utils/index.ts';
import { charPieces, colors, gameState, getBitboard, moveType } from '~/game/consts/board.ts';
import { serializeGameState } from '~/utils/game-serialize.ts';
import { makeMove } from '~/game/move/move.ts';
import { isSquareAttacked } from '~/game/board/attacks.ts';
import { lsbIndex } from '~/game/board/bb.ts';

type Color = 'white' | 'black' | null;

type SocketData = {
  sessionId: string | null;
  clientColor: Color;
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
  const { sessionId, requestedColor } = ws.data;

  if (sessionId && sessions.has(sessionId)) {
    const sess = sessions.get(sessionId)!;
    const desired = chooseColorForReattach(sessionId, requestedColor || undefined);
    if (desired === null && requestedColor) {
      reject(ws, 'color-taken');
      return;
    }

    sess.ws = ws;
    ws.data.clientColor = sess.color;

    safeSend(ws, { type: 'session', sessionId, color: sess.color, status: 'restored' });
    sendGameState(ws);
    return;
  }

  if (requestedColor && colorMap.has(requestedColor)) {
    reject(ws, 'color-taken');
    return;
  }

  const created = createSession(requestedColor, ws);
  ws.data.sessionId = created.sessionId;
  ws.data.clientColor = created.color;

  safeSend(ws, {
    type: 'session',
    sessionId: created.sessionId,
    color: created.color,
    status: 'accepted',
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
 * Log a client disconnect. Sessions are kept for reconnect.
 */
function handleClose(ws: ServerWebSocket<SocketData>) {
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

process.stdin.setEncoding('utf8');
process.stdin.on('data', (data) => {
  const cmd = String(data || '').trim();
  if (!cmd) return;

  switch (cmd) {
    case 'cb':
      const cbOk = clearColor('black');
      if (!cbOk) console.log('No session for color black');
      break;

    case 'cw':
      const cwOk = clearColor('white');
      if (!cwOk) console.log('No session for color white');
      break;

    case 'list':
      console.log('Sessions:');
      for (const [sid, s] of sessions.entries()) {
        console.log(' ', sid, 'color:', s.color || '<none>', 'connected:', !!s.ws);
      }
      break;

    case 'reset':
      console.log('Resetting game state');
      mountGame();
      gameState.moveHistory = [];
      console.log('Game state reset, broadcasting new state');
      broadcast({ type: 'state', state: serializeGameState(gameState) });
      break;

    default:
      console.log('Unknown command. Supported: cb (clear black), cw (clear white), list, reset');
      break;
  }
});
