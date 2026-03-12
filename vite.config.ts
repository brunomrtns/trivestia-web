import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    base: '/trivestia/',
    plugins: [react()],
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: [
        { find: '@', replacement: path.resolve(__dirname, './src') },
        {
          find: '@trivestia/sim-core',
          replacement: path.resolve(
            __dirname,
            './packages/sim-core/dist/index.js'
          )
        },
        // --- Redirecionamento Chat Widget e Tipos para Hot-Reload em Dev ---
        {
          find: '@chat-platform/chat-widget/react',
          replacement: isDev
            ? path.resolve(
                __dirname,
                '../chat-platform/packages/chat-widget/src/react-wrapper/index.ts'
              )
            : path.resolve(
                __dirname,
                '../chat-platform/packages/chat-widget/dist/react.mjs'
              )
        },
        {
          find: '@chat-platform/chat-widget',
          replacement: isDev
            ? path.resolve(
                __dirname,
                '../chat-platform/packages/chat-widget/src/index.ts'
              )
            : path.resolve(
                __dirname,
                '../chat-platform/packages/chat-widget/dist/index.mjs'
              )
        },
        {
          find: '@chat-platform/chat-types',
          replacement: isDev
            ? path.resolve(
                __dirname,
                '../chat-platform/packages/chat-types/src/index.ts'
              )
            : path.resolve(
                __dirname,
                '../chat-platform/packages/chat-types/dist/index.mjs'
              )
        }
      ]
    },
    optimizeDeps: {
      // Quando em dev, excluímos do pré-bundling para o Vite monitorar os arquivos fonte
      exclude: isDev
        ? ['@chat-platform/chat-widget', '@chat-platform/chat-types']
        : [],
      include: ['@trivestia/sim-core'],
      esbuildOptions: {
        mainFields: ['module', 'main']
      }
    },
    server: {
      watch: {
        // Garante que o Vite observe mudanças fora da pasta do projeto (no monorepo)
        ignored: [
          '!**/chat-platform/packages/chat-widget/src/**',
          '!**/chat-platform/packages/chat-types/src/**'
        ]
      }
    },
    build: {
      commonjsOptions: {
        include: [/node_modules/],
        exclude: [/packages\/sim-core/]
      }
    }
  };
});
