import http from 'node:http'
import { readFile, realpath, stat } from 'node:fs/promises'
import { dirname, extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), 'dist'))
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2', '.json': 'application/json', '.wasm': 'application/wasm', '.webmanifest': 'application/manifest+json' }
http.createServer(async (req, res) => {
  res.setHeader('X-Bloom-App', '1')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  // Cross-origin isolation: SharedArrayBuffer + Atomics for multi-core features.
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless')
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1:5173').pathname)
    const target = await realpath(resolve(root, pathname === '/' ? 'index.html' : `.${pathname}`))
    if (!target.startsWith(root + sep) || !(await stat(target)).isFile()) { res.writeHead(404); res.end(); return }
    const body = await readFile(target)
    res.writeHead(200, { 'Content-Type': types[extname(target)] ?? 'application/octet-stream', 'Content-Length': body.length, 'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache' })
    res.end(req.method === 'HEAD' ? undefined : body)
  } catch { res.writeHead(404); res.end('Not found') }
}).listen(5173, '127.0.0.1', () => console.log('Bloom is running at http://127.0.0.1:5173/'))
