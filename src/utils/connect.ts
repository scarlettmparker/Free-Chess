// Small helper utilities for WebSocket session connection flow
export type SessionMsg = { type: 'session'; sessionId?: string; color?: string; status?: string };
export type RejectMsg = { type: 'reject'; reason?: string };

export const getStoredSession = () => localStorage.getItem('fc_sessionId');
export const setStoredSession = (id: string | null) => {
  if (id) localStorage.setItem('fc_sessionId', id);
  else localStorage.removeItem('fc_sessionId');
};

/**
 * Connect to a WS url with optional color and sessionId. Resolves only when server sends a session message.
 * Rejects on explicit reject message, close, error or timeout.
 *
 * @param baseUrl URL of websocket (default ws://localhost:4000)
 * @param color Color trying to connect to (default white)
 * @param sessionId Session Id for re-connects
 * @param onSession onSession callback
 */
export const connectWith = (
  baseUrl: string,
  color: string | null,
  sessionId?: string,
  onSession?: (msg: SessionMsg) => void,
): Promise<WebSocket> => {
  let url = baseUrl;
  const params: string[] = [];
  if (color) params.push(`color=${encodeURIComponent(color)}`);
  if (sessionId) params.push(`sessionId=${encodeURIComponent(sessionId)}`);
  if (params.length) url += '/?' + params.join('&');
  // Return a promise that resolves when a session message is received, or rejects on error/timeout
  return new Promise<WebSocket>((resolve, reject) => {
    try {
      const ws = new WebSocket(url);
      let settled = false;

      // timeout after 3 seconds
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          try {
            ws.close();
          } catch (e) {
            // do nothing
          }
          reject(new Error('timeout'));
        }
      }, 3000);

      const cleanup = () => {
        clearTimeout(timeout);
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          // reject
          if (msg.type === 'reject') {
            cleanup();
            if (!settled) {
              settled = true;
              try {
                ws.close();
              } catch (e) {
                // do nothing
              }
              reject(new Error(msg.reason || 'rejected'));
            }
            return;
          }

          // resolve on session message
          if (msg.type === 'session') {
            if (onSession) onSession(msg as SessionMsg);
            if (!settled) {
              settled = true;
              cleanup();
              resolve(ws);
            }
          }
        } catch (e) {
          // ignore non-json messages
        }
      };

      // reject on error
      ws.onerror = () => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(new Error('ws-error'));
        }
      };

      // reject on close
      ws.onclose = (ev) => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(new Error(`closed-${ev.code}`));
        }
      };
    } catch (e) {
      reject(e);
    }
  });
};

/** Try restore -> white -> black; sets stored session and calls onSession for session messages. */
export const tryConnectFlow = async (
  baseUrl: string,
  onSession: (msg: SessionMsg) => void,
): Promise<WebSocket | null> => {
  const stored = getStoredSession();
  try {
    if (stored) {
      return await connectWith(baseUrl, null, stored, onSession);
    }

    try {
      return await connectWith(baseUrl, 'white', undefined, onSession);
    } catch (e) {
      // try black
    }

    try {
      return await connectWith(baseUrl, 'black', undefined, onSession);
    } catch (e) {
      // spectator
      onSession({ type: 'session', status: 'spectator' });
      return null;
    }
  } catch (e) {
    onSession({ type: 'session', status: 'spectator' });
    return null;
  }
};
