import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: { 
    port: 5173,
    watch: {
      ignored: ['**/playwright-report/**', '**/test-results/**'],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 600,
    modulePreload: {
      resolveDependencies: (filename, deps) => {
        return deps.filter(dep => !dep.includes('vendor-charts'));
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-vendor')) {
            return 'vendor-charts';
          }
          if (id.includes('node_modules/@tanstack/react-router')) {
            return 'vendor-router';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['tests/**', 'node_modules/**'],
  },
})
