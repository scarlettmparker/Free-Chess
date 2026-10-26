import { adminCommands, isAdminAuthorized, runCommand, runConsoleCommand } from './admin.ts';
import { broadcast, handleClose, handleMessage, handleOpen, type SocketData } from './socket.ts';
import { captureInitialState } from './initial-state.ts';
import { isOriginAllowed, parseAllowedOrigins } from './origin.ts';
import { resetGameStatus } from './rules.ts';
import { pruneSessions } from './sessions.ts';
import { adminToken } from '../../config.js';
import { mountGame } from '~/utils/index.ts';
import { listLayouts, loadLayout } from '~/server/board-layouts';

/**
 * HTTP and WebSocket host for the matchmaking service.
 */
const host = Bun.env.HOST || '0.0.0.0';

/**
 * WebSocket port.
 */
const port = Number(Bun.env.PORT) || 4001;

/**
 * Optional comma-separated host allowlist for browser connections.
 */
const allowedOrigins = parseAllowedOrigins(Bun.env.ALLOWED_WS_ORIGINS, Bun.env.ALLOWED_ORIGINS);

/**
 * Loopback-only admin port. Not reverse-proxied.
 */
const adminPort = Number(Bun.env.ADMIN_PORT) || port + 1;

/**
 * Largest client message accepted by the websocket.
 */
const maxPayloadLength = 16 * 1024;

/**
 * Largest queued payload before Bun closes a slow connection.
 */
const backpressureLimit = 1_000_000;

/**
 * How often disconnected sessions are pruned.
 */
const sessionPruneIntervalMs = 30_000;

/**
 * Mount the standard board layout, falling back to the default mount when the
 * database has not been migrated yet.
 */
function mountStandardLayout() {
  const standard = listLayouts().find((layout) => layout.slug === 'standard');
  const loaded = standard ? loadLayout(standard.id) : null;
  if (loaded) mountGame(loaded);
  else mountGame();
}

/**
 * Start the matchmaking and admin servers.
 */
function start() {
  if (process.env.NODE_ENV === 'production' && !adminToken) {
    throw new Error('ADMIN_TOKEN is required in production');
  }
  if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
    throw new Error('ALLOWED_WS_ORIGINS or ALLOWED_ORIGINS is required in production');
  }

  mountStandardLayout();
  captureInitialState();
  resetGameStatus();

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

      if (!isOriginAllowed(req.headers.get('origin'), allowedOrigins)) {
        return new Response('Origin not allowed', { status: 403 });
      }

      const colorParam = url.searchParams.get('color');
      const requestedColor: SocketData['requestedColor'] =
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
      backpressureLimit,
      closeOnBackpressureLimit: true,
      idleTimeout: 60,
      sendPings: true,
      perMessageDeflate: false,
      open: handleOpen,
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
    runConsoleCommand(cmd, broadcast);
  });

  const pruneTimer = setInterval(() => {
    pruneSessions();
  }, sessionPruneIntervalMs);
  pruneTimer.unref();
}

if (import.meta.main) {
  start();
}
