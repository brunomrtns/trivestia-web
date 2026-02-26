import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
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
    // sim-core é CJS (CommonJS); forçar pré-bundling via esbuild p/ converter em ESM
    include: ['@trivestia/sim-core']
  },
  build: {
    commonjsOptions: {
      include: [/packages\/sim-core/, /node_modules/]
    }
  }
});
