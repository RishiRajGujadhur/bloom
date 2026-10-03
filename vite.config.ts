import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'

const commit = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'dev'
  }
})()

// Cross-origin isolation unlocks SharedArrayBuffer + Atomics (multi-core
// workers, threaded Wasm). `credentialless` keeps cross-origin CDN/model
// downloads working without each one sending CORP headers.
const isolation = { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'credentialless' }

// https://vite.dev/config/
export default defineConfig({
  define: { __BUILD_TIME__: JSON.stringify(new Date().toISOString()), __COMMIT__: JSON.stringify(commit) },
  optimizeDeps: {
    include: ['@react-three/drei', 'gsap/Draggable'],
  },
  server: { headers: isolation },
  preview: { headers: isolation },
  plugins: [
    react(),
    tailwindcss(),
    // Installable and offline: the app shell and assets are cached by a service
    // worker; big language data (word lists, pronouncing dictionary, AI models)
    // is cached the first time it is used instead of up front.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Bloom — your mindfulness dashboard',
        short_name: 'Bloom',
        description: 'Habits, calm, journalling, English and more — a little better every day.',
        theme_color: '#7044ac',
        background_color: '#fbf6f1',
        display: 'standalone',
        // Installed on desktop, Bloom draws its own title bar in every theme (Window Controls Overlay).
        display_override: ['window-controls-overlay', 'standalone'],
        start_url: '/',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
        // The installed app can be the OS handler for these files (see src/platform/fileHandlers.ts).
        file_handlers: [
          { action: '/#voice', accept: { 'audio/wav': ['.wav'], 'audio/mp4': ['.m4a'], 'audio/webm': ['.webm'] } },
          { action: '/#run', accept: { 'application/gpx+xml': ['.gpx'] } },
          { action: '/#money', accept: { 'application/pdf': ['.pdf'] } },
          { action: '/#vision-board', accept: { 'application/vnd.bloom.board+zip': ['.bloomboard'] } },
        ],
      },
      workbox: {
        // Precache only the shell; every page chunk is cached on first visit (runtime rule below).
        globPatterns: ['index.html', 'favicon.svg', 'assets/index-*.{js,css}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: 'index.html',
        runtimeCaching: [
          { urlPattern: ({ url }) => url.pathname.startsWith('/assets/'), handler: 'CacheFirst', options: { cacheName: 'bloom-lazy-assets', expiration: { maxEntries: 60 } } },
          { urlPattern: ({ url }) => url.pathname.startsWith('/audio/'), handler: 'CacheFirst', options: { cacheName: 'bloom-audio', expiration: { maxEntries: 40 } } },
        ],
      },
    }),
  ],
  resolve: {
    alias: [
      // Pixel icon mode: every `lucide-react` import goes through a wrapper
      // that can draw pixelarticons instead (see src/icons/pixelated.tsx).
      { find: /^lucide-react$/, replacement: fileURLToPath(new URL('./src/icons/lucidePixel.ts', import.meta.url)) },
    ],
  },
})
