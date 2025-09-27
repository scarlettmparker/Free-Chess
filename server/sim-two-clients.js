// Simulate two clients: first connects as white and holds open; second tries white then falls back to black
const WebSocket = require('ws');

function connectWith(color, sessionId) {
  let url = 'ws://localhost:4000';
  const params = [];
  if (color) params.push(`color=${encodeURIComponent(color)}`);
  if (sessionId) params.push(`sessionId=${encodeURIComponent(sessionId)}`);
  if (params.length) url += '/?' + params.join('&');

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const t = setTimeout(() => {
      ws.close();
      reject(new Error('timeout'));
    }, 3000);

    ws.on('message', (m) => {
      try {
        const msg = JSON.parse(m.toString());
        if (msg.type === 'reject') {
          clearTimeout(t);
          ws.close();
          reject(new Error('rejected:' + (msg.reason || '')));
        }
        if (msg.type === 'session') {
          clearTimeout(t);
          resolve({ ws, sessionId: msg.sessionId, color: msg.color });
        }
      } catch (e) {}
    });

    ws.on('error', (e) => {
      clearTimeout(t);
      reject(e);
    });
    ws.on('close', () => {
      /* noop */
    });
  });
}

(async () => {
  try {
    const a = await connectWith('white');
    console.log('A connected white sessionId=', a.sessionId);

    // second client tries white
    try {
      const b = await connectWith('white');
      console.log('B unexpectedly connected as white', b.sessionId);
    } catch (e) {
      console.log('B white rejected, trying black');
      const b2 = await connectWith('black');
      console.log('B connected as black sessionId=', b2.sessionId);
      // close both
      setTimeout(() => {
        a.ws.close();
        b2.ws.close();
      }, 500);
    }
  } catch (e) {
    console.error('Test failure', e);
  }
})();
