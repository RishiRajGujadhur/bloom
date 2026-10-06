import assert from 'node:assert/strict'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { gzipSync, brotliCompressSync, constants } from 'node:zlib'

const manifest = JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8'))
const files = new Set()
const visited = new Set()
function visit(key) {
  if (visited.has(key)) return
  visited.add(key)
  const chunk = manifest[key]
  if (!chunk) return
  files.add(chunk.file)
  chunk.css?.forEach((file) => files.add(file))
  chunk.imports?.forEach(visit)
}
Object.keys(manifest)
  .filter((key) => manifest[key].isEntry)
  .forEach(visit)
const assets = []
for (const file of files) {
  const body = await readFile(`dist/${file}`)
  assets.push({
    file,
    bytes: body.length,
    gzip: gzipSync(body).length,
    brotli: brotliCompressSync(body, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 4 },
    }).length,
  })
}
const jsBytes = assets
  .filter((asset) => asset.file.endsWith('.js'))
  .reduce((sum, asset) => sum + asset.bytes, 0)
const cssBytes = assets
  .filter((asset) => asset.file.endsWith('.css'))
  .reduce((sum, asset) => sum + asset.bytes, 0)
const baseline = JSON.parse(
  await readFile('docs/performance-baseline.json', 'utf8'),
)
const baselineJs = baseline.entries
  .filter((asset) => asset.file.endsWith('.js'))
  .reduce((sum, asset) => sum + asset.bytes, 0)
const baselineCss = baseline.entries
  .filter((asset) => asset.file.endsWith('.css'))
  .reduce((sum, asset) => sum + asset.bytes, 0)
const html = await readFile('dist/index.html', 'utf8')
assert.match(html, /<script[^>]*type="module"/)
assert.match(html, /rel="modulepreload"/)
assert.match(html, /<style>/)
for (const asset of assets.filter((asset) => asset.file.endsWith('.css'))) {
  const css = await readFile(`dist/${asset.file}`, 'utf8')
  assert.ok(!/@import\s/.test(css), `Runtime CSS import in ${asset.file}`)
}
// Budget the entire static import graph, not just the entry chunk.
assert.ok(
  jsBytes <= 3 * 1024 * 1024,
  `Initial JavaScript exceeds 3 MiB: ${jsBytes}`,
)
assert.ok(cssBytes <= 450 * 1024, `Initial CSS exceeds 450 KiB: ${cssBytes}`)
assert.ok(
  !assets.some((asset) =>
    /opencv|onnx|transformers|web-llm|mathjs|lottie_light/.test(asset.file),
  ),
  'A heavy optional library leaked into startup',
)
assert.ok(
  (await stat('dist/sw.js')).size > 0,
  'Missing production service worker',
)
const report = {
  jsBytes,
  cssBytes,
  baselineJsBytes: baselineJs,
  baselineCssBytes: baselineCss,
  jsReductionPercent: Number(((1 - jsBytes / baselineJs) * 100).toFixed(1)),
  cssReductionPercent: Number(((1 - cssBytes / baselineCss) * 100).toFixed(1)),
  budgets: { jsBytes: 3 * 1024 * 1024, cssBytes: 450 * 1024 },
  assets,
}
await writeFile(
  'docs/performance-build.json',
  JSON.stringify(report, null, 2) + '\n',
)
console.log(
  JSON.stringify({
    jsBytes,
    cssBytes,
    jsReductionPercent: report.jsReductionPercent,
    cssReductionPercent: report.cssReductionPercent,
  }),
)
