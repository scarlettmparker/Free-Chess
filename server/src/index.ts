import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket as WS } from 'ws';
import dotenv from 'dotenv';
import {
  sessions,
  colorMap,
  chooseColorForReattach,
  createSession,
  assignColor,
  clearColor,
} from './sessions.ts';
import { mountGame } from '~/utils/index.ts';
import { gameState, moveType } from '~/game/consts/board.ts';
import { serializeGameState } from '~/utils/game-serialize.ts';
import { makeMove } from '~/game/move/move.ts';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.get('/', (_, res) => {
  res.send('Free-Chess WebSocket server is running.');
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// initialize game state on server startup
mountGame();

/**
 * Send a JSON object safely over a WebSocket.
 */
function safeSend(ws: WS, obj: unknown) {
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
      safeSend(sess.ws as any, obj);
    }
  }
}

/**
 * Send the current serialized game state to a client.
 */
function sendGameState(ws: WS) {
  safeSend(ws, { type: 'state', state: serializeGameState(gameState) });
}

wss.on('connection', (ws: WS, req) => {
  console.log('Client connected', req.socket.remoteAddress);

  const url = new URL(String(req.url), `http://${req.headers.host}`);
  const requestedColor = (url.searchParams.get('color') as 'white' | 'black' | null) ?? null;
  const sessionId = url.searchParams.get('sessionId');

  /**
   * Handle client messages.
   */
  const messageHandler = (message: any) => {
    let parsed: any = message.toString();
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return; // ignore non-json
    }

    console.log(
      'Received message from client (color=%s, session=%s):',
      (ws as any)._clientColor,
      (ws as any)._sessionId,
      parsed,
    );

    if (parsed?.type === 'hello' && parsed.color) {
      // Assign player color
      const ok = assignColor((ws as any)._sessionId, parsed.color);
      if (!ok) {
        safeSend(ws, { type: 'reject', reason: 'color-taken' });
        ws.close(4000, 'color-taken');
        return;
      }
      (ws as any)._clientColor = parsed.color;
      safeSend(ws, { type: 'ack', message: 'color set', color: parsed.color });
      return;
    }

    if (parsed?.type === 'move' && parsed.move !== undefined) {
      const color = (ws as any)._clientColor;
      const oldStateJson = serializeGameState(gameState);

      if (!color || gameState.side !== (color === 'white' ? 0 : 1)) {
        console.log("Ignoring move: not player's turn or no color");
        broadcast({ type: 'state', state: oldStateJson });
        return;
      }

      const accepted = makeMove(parsed.move, moveType.ALL_MOVES, 0);
      if (accepted === 1) {
        console.log('Move accepted, updating state');
        // Notify opponent of the move
        const oppColor = color === 'white' ? 'black' : 'white';
        const oppSess = Array.from(sessions.values()).find((s) => s.color === oppColor && s.ws);
        if (oppSess?.ws) {
          safeSend(oppSess.ws as any, { type: 'opponent_move', move: parsed.move });
        }

        // Broadcast updated state
        broadcast({ type: 'state', state: serializeGameState(gameState) });
      } else {
        console.log('Move rejected, sending old state');
        broadcast({ type: 'state', state: oldStateJson });
      }
    }
  };

  /**
   * Handle client disconnect.
   */
  const closeHandler = () => {
    console.log(
      'Client disconnected',
      req.socket.remoteAddress,
      'color:',
      (ws as any)._clientColor,
      'session:',
      (ws as any)._sessionId,
    );
    // Keep session for reconnect
  };

  ws.on('message', messageHandler);
  ws.on('close', closeHandler);

  // reattach to existing session
  if (sessionId && sessions.has(sessionId)) {
    const sess = sessions.get(sessionId)!;
    sess.ws = ws;
    (ws as any)._sessionId = sessionId;

    console.log('Session reattach requested', sessionId, 'requestedColor:', requestedColor);

    const desired = chooseColorForReattach(sessionId, requestedColor || undefined);
    if (desired === null && requestedColor) {
      console.log('Rejecting reattach: desired color already taken', requestedColor);
      safeSend(ws, { type: 'reject', reason: 'color-taken' });
      ws.close(4000, 'color-taken');
      return;
    }

    (ws as any)._clientColor = sess.color;
    console.log('Session reattached:', sessionId, 'color:', sess.color);

    safeSend(ws, { type: 'session', sessionId, color: sess.color, status: 'restored' });
    sendGameState(ws); // Send current game state immediately
    return;
  }

  // unknown sessionId provided -> create new session
  if (sessionId && !sessions.has(sessionId)) {
    const { sessionId: newSessionId, color } = createSession(requestedColor || null, ws);
    (ws as any)._clientColor = color;
    (ws as any)._sessionId = newSessionId;

    console.log(
      'Unknown session requested, created new session:',
      newSessionId,
      'assigned color:',
      color,
    );

    safeSend(ws, { type: 'session', sessionId: newSessionId, color, status: 'accepted' });
    sendGameState(ws);
    return;
  }

  // requested color already taken -> reject
  if (requestedColor && colorMap.has(requestedColor)) {
    console.log('Rejecting connection: color already taken', requestedColor);
    safeSend(ws, { type: 'reject', reason: 'color-taken' });
    ws.close(4000, 'color-taken');
    return;
  }

  // normal connection -> create new session
  const { sessionId: newSessionId, color } = createSession(requestedColor || null, ws);
  (ws as any)._clientColor = color;
  (ws as any)._sessionId = newSessionId;

  console.log(
    'Client connected',
    req.socket.remoteAddress,
    'assigned session:',
    newSessionId,
    'color:',
    color,
  );

  safeSend(ws, { type: 'session', sessionId: newSessionId, color, status: 'accepted' });
  sendGameState(ws);
});

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
      console.log('Game state reset, broadcasting new state');
      broadcast({ type: 'state', state: serializeGameState(gameState) });
      break;

    default:
      console.log('Unknown command. Supported: cb (clear black), cw (clear white), list, reset');
      break;
  }
});

if (process.argv[1]?.endsWith('index.ts')) {
  server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}
