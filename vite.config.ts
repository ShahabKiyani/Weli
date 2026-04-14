/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

  build: {
    // Output sourcemaps for production error tracking
    sourcemap: true,

    rollupOptions: {
      output: {
        // Split large vendor bundles to improve initial load performance
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-maps': ['@vis.gl/react-google-maps'],
          'vendor-ui': ['lucide-react', 'date-fns'],
        },
      },
    },
  },

  test: {
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    globals: true,
    // Playwright e2e tests live in e2e/ and must NOT be picked up by Vitest
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // Source files to measure; exclude test files and config
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/__tests__/**',
        'src/test-setup.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
})
