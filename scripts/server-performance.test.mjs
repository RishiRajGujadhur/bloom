import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import http from 'node:http'
import { brotliDecompressSync, gunzipSync } from 'node:zlib'
import { acceptedEncoding, createBloomServer } from '../server.mjs'

test('encoding negotiation respects q=0 and preference', () => {
  assert.equal(acceptedEncoding('gzip;q=1, br;q=0.5'), 'gzip')
  assert.equal(acceptedEncoding('br;q=0, gzip;q=0'), undefined)
  assert.equal(acceptedEncoding('gzip, br'), 'br')
  assert.equal(acceptedEncoding('br;q=0, *;q=1'), 'gzip')
})

test('compressed, conditional, HEAD, cache and media range delivery', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'bloom-server-'))
  await mkdir(join(directory, 'assets'))
  const body = 'const bloom = "calm";\n'.repeat(500)
  await writeFile(join(directory, 'assets', 'index-AbCd1234.js'), body)
  await writeFile(join(directory, 'index.html'), '<title>Bloom</title><link rel="stylesheet" href="/assets/index-AbCd1234.css"><script type="module" src="/assets/index-AbCd1234.js"></script>')
  await writeFile(join(directory, 'track.mp3'), '0123456789')
  const server = await createBloomServer(directory)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const request = (path, headers = {}, method = 'GET') =>
    new Promise((resolve, reject) => {
      http
        .request(
          {
            hostname: '127.0.0.1',
            port: server.address().port,
            path,
            method,
            headers,
          },
          (res) => {
            const parts = []
            res.on('data', (part) => parts.push(part))
            res.on('end', () =>
              resolve({
                status: res.statusCode,
                headers: res.headers,
                body: Buffer.concat(parts),
              }),
            )
          },
        )
        .on('error', reject)
        .end()
    })
  try {
    for (const [encoding, decompress] of [
      ['br', brotliDecompressSync],
      ['gzip', gunzipSync],
    ]) {
      const result = await request('/assets/index-AbCd1234.js', {
        'Accept-Encoding': encoding,
      })
      assert.equal(result.headers['content-encoding'], encoding)
      assert.equal(decompress(result.body).toString(), body)
      assert.ok(result.body.length < body.length / 5)
      assert.match(result.headers['cache-control'], /immutable/)
      assert.equal(result.headers.vary, 'Accept-Encoding')
      const conditional = await request('/assets/index-AbCd1234.js', {
        'Accept-Encoding': encoding,
        'If-None-Match': result.headers.etag,
      })
      assert.equal(conditional.status, 304)
      assert.equal(conditional.body.length, 0)
    }
    const head = await request('/assets/index-AbCd1234.js', {}, 'HEAD')
    assert.equal(head.body.length, 0)
    assert.equal(
      Number(head.headers['content-length']),
      Buffer.byteLength(body),
    )
    const range = await request('/track.mp3', { Range: 'bytes=3-6' })
    assert.equal(range.status, 206)
    assert.equal(range.body.toString(), '3456')
    assert.equal(
      (await request('/track.mp3', { Range: 'bytes=-3' })).body.toString(),
      '789',
    )
    assert.equal(
      (await request('/track.mp3', { Range: 'bytes=99-100' })).status,
      416,
    )
    const html = await request('/')
    assert.equal(html.headers['cache-control'], 'no-cache')
    assert.match(html.headers.link, /rel=preload; as=style/)
    assert.match(html.headers.link, /rel=modulepreload/)
    assert.equal((await request('/missing.js')).status, 404)
    assert.equal((await request('/', {}, 'POST')).status, 405)
  } finally {
    await new Promise((resolve) => server.close(resolve))
    await rm(directory, { recursive: true, force: true })
  }
})
