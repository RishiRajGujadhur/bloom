import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
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
        start_url: '/',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
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
