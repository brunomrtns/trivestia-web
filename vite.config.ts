import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  base: '/trivestia/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@trivestia/sim-core': path.resolve(
        __dirname,
        './packages/sim-core/dist/index.js'
      )
    }
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
