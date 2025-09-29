import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [solidPlugin()],
    server: {
      host: env.VITE_HOST,
      port: Number(env.VITE_PORT),
    },
    build: {
      target: 'esnext',
    },
    resolve: {
      alias: {
        '~': path.resolve(__dirname, 'src'),
        '~server': path.resolve(__dirname, 'server/src'),
      },
    },
  };
});
