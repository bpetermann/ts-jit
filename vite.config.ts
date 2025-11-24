/// <reference types="vitest" />
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    clearMocks: true,
    isolate: true,
    testTimeout: 5000,
    coverage: {
      enabled: false,
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
    },
    setupFiles: ['tests/setup.ts'],
  },

  plugins: [tsconfigPaths()],
});
