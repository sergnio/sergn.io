import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // Unit tests render against the committed fixtures, so image URLs resolve
    // without reaching for the real project's env vars.
    env: { VITE_CONTENT_SOURCE: 'fixtures' },
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'studio/**/*.test.ts'],
  },
})
