import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Псевдоним @/ должен быть объявлен и здесь: Rollup не читает paths
    // из tsconfig, в отличие от компилятора TypeScript.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3001,
    // При разработке проксируем API на локальный бэкенд, чтобы не упираться
    // в CORS и обойтись без отдельного адреса.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
