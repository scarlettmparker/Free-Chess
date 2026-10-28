// Small helper utilities for WebSocket session connection flow
export type SessionMsg = {
  type: 'session';
  sessionId?: string;
  color?: string;
  status?: string;
  gameId?: string;
  accountId?: string;
  seat?: string;
};

export type RejectMsg = { type: 'reject'; reason?: string };

export const getStoredSession = () => localStorage.getItem('fc_sessionId');
export const setStoredSession = (id: string | null) => {
  if (id) localStorage.setItem('fc_sessionId', id);
  else localStorage.removeItem('fc_sessionId');
};

/**
 * Adds query parameters to a WebSocket URL.
 *
 * @param baseUrl WebSocket URL.
 * @param params Query parameters to add.
 * @returns URL with parameters.
 */
function withParams(baseUrl: string, params: Array<[string, string]>): string {
  if (params.length === 0) return baseUrl;
  const query = params
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${query}`;
}

/**
 * Opens a WebSocket and resolves when the server sends a session message.
 *
 * @param url WebSocket URL.
 * @param onSession Session callback.
 * @returns Connected socket.
 */
function connectUrl(url: string, onSession?: (msg: SessionMsg) => void): Promise<WebSocket> {
  return new Promise<WebSocket>((resolve, reject) => {
    try {
      const ws = new WebSocket(url);
      let settled = false;

      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          try {
            ws.close();
          } catch (_error) {
            // ignore
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

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as { type?: string; reason?: string };
          if (msg.type === 'reject') {
            cleanup();
            if (!settled) {
              settled = true;
              try {
                ws.close();
              } catch (_error) {
                // ignore
              }
              reject(new Error(msg.reason || 'rejected'));
            }
            return;
          }

          if (msg.type === 'session') {
            if (onSession) onSession(msg as SessionMsg);
            if (!settled) {
              settled = true;
              cleanup();
              resolve(ws);
            }
          }
        } catch (_error) {
          // ignore non-json messages
        }
      };

      ws.onerror = () => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(new Error('ws-error'));
        }
      };

      ws.onclose = (event) => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(new Error(`closed-${event.code}`));
        }
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Connects to a WebSocket with optional colour and session id.
 *
 * @param baseUrl URL of the WebSocket.
 * @param color Colour trying to connect as.
 * @param sessionId Session id for reconnects.
 * @param onSession Session callback.
 * @returns Connected socket.
 */
export const connectWith = (
  baseUrl: string,
  color: string | null,
  sessionId?: string,
  onSession?: (msg: SessionMsg) => void,
): Promise<WebSocket> => {
  const params: Array<[string, string]> = [];
  if (color) params.push(['color', color]);
  if (sessionId) params.push(['sessionId', sessionId]);
  return connectUrl(withParams(baseUrl, params), onSession);
};

/**
 * Connects to a specific game using a signed token.
 *
 * @param baseUrl URL of the WebSocket.
 * @param gameId Game id.
 * @param token Signed game token.
 * @param onSession Session callback.
 * @returns Connected socket.
 */
export const connectToGame = (
  baseUrl: string,
  gameId: string,
  token: string | null,
  onSession?: (msg: SessionMsg) => void,
): Promise<WebSocket> => {
  const params: Array<[string, string]> = [['gameId', gameId]];
  if (token) params.push(['token', token]);
  return connectUrl(withParams(baseUrl, params), onSession);
};

/**
 * Tries to restore a stored session then white then black.
 *
 * @param baseUrl URL of the WebSocket.
 * @param onSession Session callback.
 * @returns Connected socket or null.
 */
export const tryConnectFlow = async (
  baseUrl: string,
  onSession: (msg: SessionMsg) => void,
): Promise<WebSocket | null> => {
  const stored = getStoredSession();
  if (stored) {
    try {
      return await connectWith(baseUrl, null, stored, onSession);
    } catch (_error) {
      // Continue to try new connections
    }
  }

  try {
    return await connectWith(baseUrl, 'white', undefined, onSession);
  } catch (_error) {
    // try black
  }

  try {
    return await connectWith(baseUrl, 'black', undefined, onSession);
  } catch (_error) {
    // try spectator
  }

  try {
    const ws = await connectWith(baseUrl, null, undefined, onSession);
    onSession({ type: 'session', status: 'spectator' });
    return ws;
  } catch (_error) {
    onSession({ type: 'session', status: 'spectator' });
    return null;
  }
};
