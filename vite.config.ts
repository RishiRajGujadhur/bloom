import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      // Pixel icon mode: every `lucide-react` import goes through a wrapper
      // that can draw pixelarticons instead (see src/icons/pixelated.tsx).
      { find: /^lucide-react$/, replacement: fileURLToPath(new URL('./src/icons/lucidePixel.ts', import.meta.url)) },
    ],
  },
})
