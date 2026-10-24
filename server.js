/**
 * @fileoverview Main entry point for the Fastify server application.
 * Sets up middleware, Vite integration (for development), and routes, then starts the server.
 */

import { WebSocket, WebSocketServer } from 'ws';
import { createServer } from '@sun/ssr/server';
import {
  port,
  host,
  base,
  isProduction,
  backendHost,
  backendPort,
  allowedOrigins,
  clientSecret,
  matchmakingUrl,
} from './config.js';
import { setupRoutes } from './routes/index.js';

/**
 * Proxies /ws to the matchmaking service. Frames from the client are buffered
 * until the upstream socket opens, so the first session/state messages are not
 * lost.
 */
function registerWebSocketProxy(app) {
  const upstreamUrl = matchmakingUrl.replace(/^http/, 'ws');

  return app.register(async (instance) => {
    const wss = new WebSocketServer({ noServer: true });

    instance.server.on('upgrade', (request, socket, head) => {
      const { pathname } = new URL(request.url ?? '/', 'http://localhost');
      if (pathname !== '/ws') {
        return;
      }
      wss.handleUpgrade(request, socket, head, (client) => {
        wss.emit('connection', client, request);
      });
    });

    wss.on('connection', (client, request) => {
      const origin = request.headers.origin;
      const upstream = new WebSocket(
        upstreamUrl + (request.url ?? '/'),
        origin ? { origin } : undefined,
      );
      const pending = [];
      let open = false;

      upstream.on('open', () => {
        open = true;
        for (const frame of pending.splice(0)) upstream.send(frame);
      });
      upstream.on('message', (data) => {
        try {
          client.send(data);
        } catch {
          // client already closed
        }
      });
      upstream.on('close', (code, reason) => {
        try {
          client.close(code, reason);
        } catch {
          // client already closed
        }
      });
      upstream.on('error', () => {
        try {
          client.close(1011, 'upstream error');
        } catch {
          // client already closed
        }
      });

      client.on('message', (data) => {
        if (open) {
          upstream.send(data);
        } else {
          pending.push(data);
        }
      });
      client.on('close', () => {
        try {
          upstream.close();
        } catch {
          // upstream already closed
        }
      });
      client.on('error', () => {
        try {
          upstream.close();
        } catch {
          // upstream already closed
        }
      });
    });
  });
}

const configure = async (app) => {
  if (!isProduction) {
    const { default: formbody } = await import('@fastify/formbody');
    await app.register(formbody);
  }

  const { default: compress } = await import('@fastify/compress');
  await app.register(compress, {
    global: true,
    threshold: 1024,
    encodings: ['gzip', 'br'],
  });

  app.addHook('onSend', async (_request, reply, payload) => {
    const csp = reply.getHeader('content-security-policy');
    if (typeof csp === 'string' && !csp.includes('wss://')) {
      reply.header(
        'Content-Security-Policy',
        csp.replace(
          "connect-src 'self' https://*.scarlettparker.co.uk",
          "connect-src 'self' https://*.scarlettparker.co.uk wss://*.scarlettparker.co.uk",
        ),
      );
    }
    return payload;
  });

  await registerWebSocketProxy(app);
};

await createServer({
  config: {
    port,
    host,
    base,
    isProduction,
    backendHost,
    backendPort,
    allowedOrigins,
    clientSecret,
  },
  setupRoutes,
  configure,
});
