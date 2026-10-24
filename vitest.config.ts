import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['server/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.{ts,tsx}'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(import.meta.dirname, './src'),
      '~server': path.resolve(import.meta.dirname, './server/src'),
    },
  },
});
