/**
 * @fileoverview Main entry point for the Fastify server application.
 * Sets up middleware, Vite integration (for development), and routes, then starts the server.
 */

import { createServer } from '@sun/ssr/server';
import {
  port,
  host,
  base,
  isProduction,
  backendHost,
  backendPort,
  allowedOrigins,
} from './config.js';
import { setupRoutes } from './routes/index.js';

const configure = async (app) => {
  const { default: compress } = await import('@fastify/compress');
  await app.register(compress, {
    global: true,
    threshold: 1024,
    encodings: ['gzip', 'br'],
  });
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
  },
  setupRoutes,
  configure,
});
