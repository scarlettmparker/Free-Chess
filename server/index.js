require('dotenv').config();
import express from 'express';
import { createServer } from 'http';
import { Server } from 'ws';

const app = express();
const port = process.env.PORT || 4000;

app.get('/', (_, res) => {
  res.send('Free Chess WebSocket server is running.');
});

const server = createServer(app);
const wss = new Server({ server });

// simple in-memory session store
// sessionId -> { color, ws }
const sessions = new Map();
// color -> sessionId
const colorMap = new Map();

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

wss.on('connection', function connection(ws, req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestedColor = url.searchParams.get('color');
  const sessionId = url.searchParams.get('sessionId');

  // helper to send json safely
  const send = (obj) => {
    try {
      ws.send(JSON.stringify(obj));
    } catch (e) {
      // ignore
    }
  };

  // If client provides a sessionId and it's known, reattach
  if (sessionId && sessions.has(sessionId)) {
    const sess = sessions.get(sessionId);
    sess.ws = ws; // reassign live socket
    ws._clientColor = sess.color;
    ws._sessionId = sessionId;
    console.log('Session reattached:', sessionId, 'color:', sess.color);
    send({ type: 'session', sessionId, color: sess.color, status: 'restored' });
    return;
  }

  // If requested color already taken, reject with a reason
  if (requestedColor && colorMap.has(requestedColor)) {
    console.log('Rejecting connection: color already taken', requestedColor);
    // Close with a normal close but with a reason encoded in a message first
    send({ type: 'reject', reason: 'color-taken' });
    try {
      ws.close(4000, 'color-taken');
    } catch (e) {
      // ignore
    }
    return;
  }

  // Accept connection and create a session if a color was requested
  const newSessionId = makeId();
  const color = requestedColor || null;
  sessions.set(newSessionId, { color, ws });
  if (color) colorMap.set(color, newSessionId);

  ws._clientColor = color;
  ws._sessionId = newSessionId;

  console.log(
    'Client connected',
    req.socket.remoteAddress,
    'assigned session:',
    newSessionId,
    'color:',
    color,
  );
  send({ type: 'session', sessionId: newSessionId, color, status: 'accepted' });

  ws.on('message', function incoming(message) {
    let parsed = message.toString();
    try {
      parsed = JSON.parse(parsed);
    } catch (e) {
      // leave as string
    }

    if (parsed && typeof parsed === 'object') {
      // handle hello messages that set/confirm color
      if (parsed.type === 'hello' && parsed.color) {
        // If color is already taken by another session, reject
        const takenSession = colorMap.get(parsed.color);
        if (takenSession && takenSession !== ws._sessionId) {
          send({ type: 'reject', reason: 'color-taken' });
          try {
            ws.close(4000, 'color-taken');
          } catch (e) {}
          return;
        }

        // Assign color to this session
        const sess = sessions.get(ws._sessionId);
        if (sess.color) colorMap.delete(sess.color);
        sess.color = parsed.color;
        colorMap.set(parsed.color, ws._sessionId);
        ws._clientColor = parsed.color;
        console.log('Client announced color:', parsed.color, 'session:', ws._sessionId);
        send({ type: 'ack', message: 'color set', color: parsed.color });
        return;
      }
    }

    console.log('Received message from client (color=%s):', ws._clientColor, parsed);
  });

  ws.on('close', () => {
    console.log(
      'Client disconnected',
      req.socket.remoteAddress,
      'color:',
      ws._clientColor,
      'session:',
      ws._sessionId,
    );
    // we intentionally do not delete the session on disconnect so a reconnect can reclaim it.
    // this is lightweight enough where ts doesn't even matter
  });
});

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
