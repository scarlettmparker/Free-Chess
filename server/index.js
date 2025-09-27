require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 4000;

app.get('/', (_, res) => {
  res.send('Free-Chess WebSocket server is running.');
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

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
    ws._sessionId = sessionId;
    // Decide which color this reattached session should have.
    // Priority:
    // 1) requestedColor if provided and free (or already assigned to this session)
    // 2) existing session color if set
    // 3) prefer white if free, then black
    let desiredColor = null;
    if (requestedColor) desiredColor = requestedColor;
    else if (sess.color) desiredColor = sess.color;
    else if (!colorMap.has('white')) desiredColor = 'white';
    else if (!colorMap.has('black')) desiredColor = 'black';

    // If desiredColor is taken by another session, reject.
    if (desiredColor) {
      const takenBy = colorMap.get(desiredColor);
      if (takenBy && takenBy !== sessionId) {
        console.log('Rejecting reattach: desired color already taken', desiredColor);
        send({ type: 'reject', reason: 'color-taken' });
        try {
          ws.close(4000, 'color-taken');
        } catch (e) {}
        return;
      }

      // Assign or reassign color mapping for this session
      if (sess.color && sess.color !== desiredColor) {
        colorMap.delete(sess.color);
      }
      sess.color = desiredColor;
      colorMap.set(desiredColor, sessionId);
    }

    ws._clientColor = sess.color;
    console.log('Session reattached:', sessionId, 'color:', sess.color);
    send({ type: 'session', sessionId, color: sess.color, status: 'restored' });
    return;
  }

  // if client provides a sessionId but server doesn't know it, create a new session
  // and assign whichever player is available (prefer white, then black, then spectator/null).
  if (sessionId && !sessions.has(sessionId)) {
    let chosenColor = null;
    if (requestedColor && !colorMap.has(requestedColor)) {
      chosenColor = requestedColor;
    } else if (!colorMap.has('white')) {
      chosenColor = 'white';
    } else if (!colorMap.has('black')) {
      chosenColor = 'black';
    } else {
      chosenColor = null;
    }

    // create a new session id
    const newSessionId = makeId();
    sessions.set(newSessionId, { color: chosenColor, ws });
    if (chosenColor) colorMap.set(chosenColor, newSessionId);

    ws._clientColor = chosenColor;
    ws._sessionId = newSessionId;

    console.log(
      'Unknown session requested, created new session:',
      newSessionId,
      'assigned color:',
      chosenColor,
    );
    send({ type: 'session', sessionId: newSessionId, color: chosenColor, status: 'accepted' });
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

/**
 * cli helper, allow clearing sessions for a color so a new client can join.
 */
function clearColor(color) {
  const sid = colorMap.get(color);
  if (!sid) {
    console.log(`No session for color ${color}`);
    return false;
  }
  const sess = sessions.get(sid);
  // close socket if connected
  try {
    sess.ws && sess.ws.close && sess.ws.close(1000, 'cleared-by-cli');
  } catch (e) {}
  colorMap.delete(color);
  // remove color assignment but keep session so reconnection with sessionId will not reassign color
  if (sess) sess.color = null;
  console.log(`Cleared color ${color} (session ${sid})`);
  return true;
}

function listSessions() {
  console.log('Sessions:');
  for (const [sid, s] of sessions.entries()) {
    console.log(' ', sid, 'color:', s.color ? s.color : '<none>', 'connected:', !!s.ws);
  }
}

// Read simple commands from stdin
process.stdin.setEncoding('utf8');
process.stdin.on('data', (data) => {
  const cmd = String(data || '').trim();
  if (!cmd) return;
  if (cmd === 'cb') {
    clearColor('black');
  } else if (cmd === 'cw') {
    clearColor('white');
  } else if (cmd === 'list') {
    listSessions();
  } else {
    console.log('Unknown command. Supported: cb (clear black), cw (clear white), list');
  }
});

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
