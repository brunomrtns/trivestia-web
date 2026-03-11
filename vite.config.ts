import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  base: '/trivestia/',
  plugins: [
    react(),
    // Plugin para resolver o chat-widget antes do sistema de alias (ignora cache)
    {
      name: 'resolve-chat-widget',
      resolveId(id: string) {
        if (id === '@chat-platform/chat-widget/react') {
          return path.resolve(__dirname, '../chat-platform/packages/chat-widget/dist/react.mjs');
        }
        if (id === '@chat-platform/chat-widget') {
          return path.resolve(__dirname, '../chat-platform/packages/chat-widget/dist/index.mjs');
        }
      },
    },
  ],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      {
        find: '@trivestia/sim-core',
        replacement: path.resolve(__dirname, './packages/sim-core/dist/index.js'),
      },
    ],
  },
  optimizeDeps: {
    // sim-core é ESM; incluir para pré-bundling
    include: ['@trivestia/sim-core'],
    esbuildOptions: {
      mainFields: ['module', 'main']
    }
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      exclude: [/packages\/sim-core/]
    }
  }
});
