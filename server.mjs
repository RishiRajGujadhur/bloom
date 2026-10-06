import http from 'node:http'
import { createReadStream } from 'node:fs'
import { readFile, realpath, stat } from 'node:fs/promises'
import { dirname, extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'
import { createBrotliCompress, createGzip, constants } from 'node:zlib'

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'audio/ogg',
}
const compressible = new Set([
  '.html',
  '.js',
  '.css',
  '.svg',
  '.json',
  '.webmanifest',
  '.wasm',
])

export function acceptedEncoding(header = '') {
  const quality = new Map(
    header
      .toLowerCase()
      .split(',')
      .map((part) => {
        const [name, ...parameters] = part.trim().split(';')
        const q = parameters.find((value) => value.trim().startsWith('q='))
        const weight = q ? Number(q.trim().slice(2)) : 1
        return [
          name,
          Number.isFinite(weight) && weight >= 0 && weight <= 1 ? weight : 0,
        ]
      }),
  )
  return ['br', 'gzip']
    .filter((name) => (quality.get(name) ?? quality.get('*') ?? 0) > 0)
    .sort(
      (a, b) =>
        (quality.get(b) ?? quality.get('*') ?? 0) -
        (quality.get(a) ?? quality.get('*') ?? 0),
    )[0]
}

export async function createBloomServer(directory) {
  const root = await realpath(directory)
  const html = await readFile(resolve(root, 'index.html'), 'utf8')
  const style = /<link\b[^>]*rel="stylesheet"[^>]*href="(\/assets\/[^"<>]+)"/.exec(html)?.[1]
  const script = /<script\b[^>]*type="module"[^>]*src="(\/assets\/[^"<>]+)"/.exec(html)?.[1]
  const hints = [style && `<${style}>; rel=preload; as=style`, script && `<${script}>; rel=modulepreload`].filter(Boolean)
  return http.createServer(async (req, res) => {
    res.setHeader('X-Bloom-App', '1')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    // Cross-origin isolation: SharedArrayBuffer + Atomics for multi-core features.
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless')
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' })
      res.end()
      return
    }
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, 'http://127.0.0.1:5173').pathname,
      )
      if ((pathname === '/' || pathname === '/index.html') && hints.length) {
        res.writeEarlyHints?.({ link: hints })
        res.setHeader('Link', hints.join(', '))
      }
      const target = await realpath(
        resolve(root, pathname === '/' ? 'index.html' : `.${pathname}`),
      )
      if (!target.startsWith(root + sep)) {
        res.writeHead(404)
        res.end()
        return
      }
      const info = await stat(target)
      if (!info.isFile()) {
        res.writeHead(404)
        res.end()
        return
      }
      const extension = extname(target)
      const encoding =
        compressible.has(extension) && info.size >= 1024 && !req.headers.range
          ? acceptedEncoding(req.headers['accept-encoding'])
          : undefined
      const etag = `W/"${info.size.toString(16)}-${Math.trunc(info.mtimeMs).toString(16)}-${encoding ?? 'identity'}"`
      res.setHeader(
        'Content-Type',
        types[extension] ?? 'application/octet-stream',
      )
      // Only Vite's content-hashed assets are immutable. HTML and SW must revalidate.
      res.setHeader(
        'Cache-Control',
        /^\/assets\/.+-[\w-]{8,}\.[\w]+$/.test(pathname)
          ? 'public, max-age=31536000, immutable'
          : 'no-cache',
      )
      res.setHeader('ETag', etag)
      res.setHeader('Last-Modified', info.mtime.toUTCString())
      res.setHeader('Vary', 'Accept-Encoding')
      if (
        req.headers['if-none-match']
          ?.split(',')
          .some((value) => value.trim() === etag || value.trim() === '*') ||
        (!req.headers['if-none-match'] &&
          req.headers['if-modified-since'] &&
          Math.floor(info.mtimeMs / 1000) <=
            Date.parse(req.headers['if-modified-since']) / 1000)
      ) {
        res.writeHead(304)
        res.end()
        return
      }
      let start = 0
      let end = info.size - 1
      let status = 200
      res.setHeader('Accept-Ranges', 'bytes')
      if (
        req.headers.range &&
        (!req.headers['if-range'] ||
          req.headers['if-range'] === info.mtime.toUTCString())
      ) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range)
        if (match && (match[1] || match[2])) {
          start = match[1]
            ? Number(match[1])
            : Math.max(0, info.size - Number(match[2]))
          end = match[1] && match[2] ? Math.min(Number(match[2]), end) : end
          if (start > end || start >= info.size) {
            res.writeHead(416, { 'Content-Range': `bytes */${info.size}` })
            res.end()
            return
          }
          status = 206
          res.setHeader('Content-Range', `bytes ${start}-${end}/${info.size}`)
        }
      }
      if (encoding) res.setHeader('Content-Encoding', encoding)
      else res.setHeader('Content-Length', Math.max(0, end - start + 1))
      res.writeHead(status)
      if (req.method === 'HEAD' || info.size === 0) {
        res.end()
        return
      }
      const source = createReadStream(target, { start, end })
      if (encoding)
        await pipeline(
          source,
          encoding === 'br'
            ? createBrotliCompress({
                params: { [constants.BROTLI_PARAM_QUALITY]: 4 },
              })
            : createGzip({ level: 6 }),
          res,
        )
      else await pipeline(source, res)
    } catch {
      if (!res.headersSent) {
        res.writeHead(404)
        res.end('Not found')
      } else res.destroy()
    }
  })
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const server = await createBloomServer(
    resolve(dirname(fileURLToPath(import.meta.url)), 'dist'),
  )
  server.listen(Number(process.env.PORT) || 5173, '127.0.0.1', () =>
    console.log(
      `Bloom is running at http://127.0.0.1:${server.address().port}/`,
    ),
  )
}
