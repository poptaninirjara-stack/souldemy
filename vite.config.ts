/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Set BASE_PATH to deploy under a sub-path, e.g. BASE_PATH=/english/ npm run build.
// The default './' also works from any folder. HashRouter keeps all routes after
// the "#", so no server rewrites are needed.
export default defineConfig({
  base: process.env.BASE_PATH ?? './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
  },
})
