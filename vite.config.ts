import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { compression, forbidModules, stripJsxPragma } from '@sun/build';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'node:path';

export default defineConfig(() => {
  const allowedHosts =
    process.env.ALLOWED_HOSTS?.split(',')
      .map((h) => h.trim())
      .filter(Boolean) ?? [];
  const port = Number(process.env.SERVER_PORT) || 5177;

  return {
    plugins: [
      preact(),
      stripJsxPragma('preact-heroicons'),
      compression(),
      forbidModules(['react', 'react-dom']),
    ],
    resolve: {
      alias: {
        '~': path.resolve(import.meta.dirname, './src'),
        '~server': path.resolve(import.meta.dirname, './server/src'),
      },
    },
    server: {
      port,
      allowedHosts,
      proxy: {
        '/ws': {
          target: process.env.MATCHMAKING_URL || 'ws://localhost:4001',
          ws: true,
        },
      },
    },
    assetsInclude: ['**/*.json'],
    json: {
      stringify: true,
    },
    build: {
      manifest: true,
      rollupOptions: {
        input: {
          client: '/src/entry-client.tsx',
        },
        plugins: [
          ...(process.env.ANALYZE
            ? [
                visualizer({
                  filename: 'stats.html',
                  open: false,
                  gzipSize: true,
                  brotliSize: true,
                }),
              ]
            : []),
        ],
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return;
            }
            if (id.includes('@sun/components')) {
              return 'vendor-components';
            }
            if (
              id.includes('/preact/') ||
              id.includes('\\preact\\') ||
              id.includes('/react-dom/') ||
              id.includes('\\react-dom\\') ||
              id.includes('/react-router-dom/') ||
              id.includes('\\react-router-dom\\') ||
              /[/\\]react[/\\]/.test(id)
            ) {
              return 'vendor-react';
            }
          },
        },
      },
      outDir: 'dist/client',
      cssCodeSplit: true,
    },
    ssr: {
      noExternal: [
        '@sun/ssr',
        '@sun/components',
        '@sun/themes',
        '@sun/utils',
        '@sun/shared',
        '@sun/i18n',
        'i18next',
        'react-router-dom',
        'react-router',
        'lucide-preact',
        'preact-heroicons',
      ],
    },
  };
});
