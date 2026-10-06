import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

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
const isolation = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless',
}

// Concurrent local and browser-test servers must not replace one another's
// optimized dependency graph. Use the final CLI port override (npm adds one).
const portArgument = process.argv.lastIndexOf('--port')
const devPort = portArgument >= 0 ? process.argv[portArgument + 1] : '5173'

// https://vite.dev/config/
export default defineConfig({
  cacheDir: `node_modules/.vite/bloom-${devPort}`,
  build: {
    manifest: true,
    cssCodeSplit: true,
    minify: true,
    cssMinify: true,
    sourcemap: false,
    assetsInlineLimit: 1024,
  },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __COMMIT__: JSON.stringify(commit),
  },
  optimizeDeps: {
    include: ['@react-three/drei', 'gsap/Draggable'],
  },
  server: { headers: isolation },
  preview: { headers: isolation },
  plugins: [
    {
      name: 'bloom-compact-html',
      apply: 'build',
      transformIndexHtml: {
        order: 'post',
        handler: (html) =>
          html
            .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
            .replace(/>\s+</g, '><')
            .trim(),
      },
    },
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
        description:
          'Habits, calm, journalling, English and more — a little better every day.',
        theme_color: '#7044ac',
        background_color: '#fbf6f1',
        display: 'standalone',
        // Installed on desktop, Bloom draws its own title bar in every theme (Window Controls Overlay).
        display_override: ['window-controls-overlay', 'standalone'],
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
        // The installed app can be the OS handler for these files (see src/platform/fileHandlers.ts).
        file_handlers: [
          {
            action: '/#voice',
            accept: {
              'audio/wav': ['.wav'],
              'audio/mp4': ['.m4a'],
              'audio/webm': ['.webm'],
            },
          },
          { action: '/#run', accept: { 'application/gpx+xml': ['.gpx'] } },
          { action: '/#money', accept: { 'application/pdf': ['.pdf'] } },
          {
            action: '/#vision-board',
            accept: { 'application/vnd.bloom.board+zip': ['.bloomboard'] },
          },
        ],
      },
      workbox: {
        // Precache only the shell; every page chunk is cached on first visit (runtime rule below).
        globPatterns: [
          'index.html',
          'registerSW.js',
          'favicon.svg',
          'assets/index-*.{js,css}',
        ],
        // Cache the entire static entry graph, not just index.js: otherwise its
        // shared imports may be missing on the first offline revisit. Dynamic
        // page/AI chunks remain on-demand and are never precached en masse.
        manifestTransforms: [
          async (entries) => {
            const manifest = JSON.parse(
              await readFile(resolve('dist/.vite/manifest.json'), 'utf8'),
            ) as Record<
              string,
              {
                file: string
                isEntry?: boolean
                imports?: string[]
                css?: string[]
              }
            >
            const shell = new Set([
              'index.html',
              'registerSW.js',
              'favicon.svg',
            ])
            const visited = new Set<string>()
            const visit = (key: string) => {
              if (visited.has(key)) return
              visited.add(key)
              const chunk = manifest[key]
              if (!chunk) return
              shell.add(chunk.file)
              chunk.css?.forEach((file) => shell.add(file))
              chunk.imports?.forEach(visit)
            }
            Object.keys(manifest)
              .filter((key) => manifest[key].isEntry)
              .forEach(visit)
            const retained = entries.filter((entry) => shell.has(entry.url))
            const present = new Set(retained.map((entry) => entry.url))
            // Add hashed static imports directly rather than globbing all lazy
            // chunks (OpenCV alone is 15 MB and must remain runtime-only).
            const imports = await Promise.all(
              [...shell]
                .filter((url) => url.startsWith('assets/') && !present.has(url))
                .map(async (url) => ({
                  url,
                  revision: null,
                  size: (await stat(resolve('dist', url))).size,
                })),
            )
            return { manifest: [...retained, ...imports], warnings: [] }
          },
        ],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.href.startsWith(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm/',
              ) ||
              url.href.startsWith(
                'https://storage.googleapis.com/mediapipe-models/pose_landmarker/',
              ) ||
              url.href.startsWith(
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/',
              ),
            handler: 'CacheFirst',
            options: {
              cacheName: 'bloom-coach-tracking-v1',
              cacheableResponse: { statuses: [200] },
              expiration: {
                maxEntries: 16,
                maxAgeSeconds: 90 * 24 * 60 * 60,
                purgeOnQuotaError: true,
              },
            },
          },
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && url.pathname.startsWith('/assets/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'bloom-lazy-assets',
              cacheableResponse: { statuses: [200] },
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60,
                purgeOnQuotaError: true,
              },
            },
          },
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && url.pathname.startsWith('/audio/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'bloom-audio',
              rangeRequests: true,
              cacheableResponse: { statuses: [200] },
              expiration: {
                maxEntries: 40,
                maxAgeSeconds: 30 * 24 * 60 * 60,
                purgeOnQuotaError: true,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: [
      // Pixel icon mode: every `lucide-react` import goes through a wrapper
      // that can draw pixelarticons instead (see src/icons/pixelated.tsx).
      {
        find: /^lucide-react$/,
        replacement: fileURLToPath(
          new URL('./src/icons/lucidePixel.ts', import.meta.url),
        ),
      },
    ],
  },
})
