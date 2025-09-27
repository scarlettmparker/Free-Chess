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

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.get('/', (_, res) => {
  res.send('Free-Chess WebSocket server is running.');
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

/** Send a JSONable object over a websocket safely. */
function safeSend(ws: WS, obj: unknown) {
  try {
    ws.send(JSON.stringify(obj));
  } catch (e) {
    // ignore send errors
  }
}

wss.on('connection', (ws: WS, req) => {
  console.log('Client connected', req.socket.remoteAddress);
  const url = new URL(String(req.url), `http://${req.headers.host}`);
  const requestedColor = (url.searchParams.get('color') as 'white' | 'black' | null) ?? null;
  const sessionId = url.searchParams.get('sessionId');

  // If client provides a sessionId and it's known, reattach
  if (sessionId && sessions.has(sessionId)) {
    const sess = sessions.get(sessionId)!;
    sess.ws = ws;
    (ws as any)._sessionId = sessionId;

    console.log('Session reattach requested', sessionId, 'requestedColor:', requestedColor);

    const desired = chooseColorForReattach(sessionId, requestedColor || undefined);
    if (desired === null && requestedColor) {
      console.log('Rejecting reattach: desired color already taken', requestedColor);
      safeSend(ws, { type: 'reject', reason: 'color-taken' });
      try {
        ws.close(4000, 'color-taken');
      } catch (e) {}
      return;
    }

    (ws as any)._clientColor = sess.color;
    console.log('Session reattached:', sessionId, 'color:', sess.color);
    safeSend(ws, { type: 'session', sessionId, color: sess.color, status: 'restored' });
    return;
  }

  // If client provides unknown sessionId, create new session and assign color
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
    return;
  }

  // If requested color already taken, reject
  if (requestedColor && colorMap.has(requestedColor)) {
    console.log('Rejecting connection: color already taken', requestedColor);
    safeSend(ws, { type: 'reject', reason: 'color-taken' });
    try {
      ws.close(4000, 'color-taken');
    } catch (e) {}
    return;
  }

  // Accept connection and create a session if a color was requested
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

  ws.on('message', (message) => {
    let parsed: any = message.toString();
    try {
      parsed = JSON.parse(parsed);
    } catch (e) {}

    console.log('Received message from client (color=%s):', (ws as any)._clientColor, parsed);

    if (parsed && typeof parsed === 'object') {
      if (parsed.type === 'hello' && parsed.color) {
        const ok = assignColor((ws as any)._sessionId, parsed.color);
        if (!ok) {
          safeSend(ws, { type: 'reject', reason: 'color-taken' });
          try {
            ws.close(4000, 'color-taken');
          } catch (e) {}
          return;
        }
        (ws as any)._clientColor = parsed.color;
        safeSend(ws, { type: 'ack', message: 'color set', color: parsed.color });
        return;
      }
    }
  });

  ws.on('close', () => {
    console.log(
      'Client disconnected',
      req.socket.remoteAddress,
      'color:',
      (ws as any)._clientColor,
      'session:',
      (ws as any)._sessionId,
    );
    // keep session for reconnect
  });
});

// CLI helpers: allow clearing sessions for a color so a new client can join.
process.stdin.setEncoding('utf8');
process.stdin.on('data', (data) => {
  const cmd = String(data || '').trim();
  if (!cmd) return;
  if (cmd === 'cb') {
    const ok = clearColor('black');
    if (!ok) console.log('No session for color black');
  } else if (cmd === 'cw') {
    const ok = clearColor('white');
    if (!ok) console.log('No session for color white');
  } else if (cmd === 'list') {
    console.log('Sessions:');
    for (const [sid, s] of sessions.entries()) {
      console.log(' ', sid, 'color:', s.color ? s.color : '<none>', 'connected:', !!s.ws);
    }
  } else {
    console.log('Unknown command. Supported: cb (clear black), cw (clear white), list');
  }
});

if (process.argv[1] && process.argv[1].endsWith('index.ts')) {
  server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}
