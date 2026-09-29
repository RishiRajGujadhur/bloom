// Screenshot one page (both themes) and fail on console errors, crashes or a blank page.
// Usage: npm run dev, then: node scripts/feature-shot.mjs <hash> <file-name> [tab-name]
import { chromium } from 'playwright'
const [hash, name, tabName] = process.argv.slice(2)
if (!hash || !name) {
  console.error('usage: node scripts/feature-shot.mjs <hash> <name> [tab]')
  process.exit(2)
}
const base = process.env.BLOOM_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch({ channel: 'chrome' })
const problems = []
for (const [themeId, suffix] of [['bloom-light', ''], ['matrix', '-matrix']]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript((id) => {
    if (location.protocol === 'about:') return
    localStorage.setItem('bloom-welcome-v1', '{"done":true}')
    localStorage.setItem('mindfulness-dashboard-theme-settings', JSON.stringify({ themeId: id, fontId: 'default' }))
  }, themeId)
  const page = await ctx.newPage()
  const noise = /favicon|React DevTools|\[vite\]|WebGPU|webgpu|ERR_ABORTED/
  page.on('console', (m) => m.type() === 'error' && !noise.test(m.text()) && problems.push(`${suffix || 'light'} console: ${m.text().slice(0, 240)}`))
  page.on('pageerror', (e) => problems.push(`${suffix || 'light'} exception: ${e.message.slice(0, 240)}`))
  await page.goto(`${base}/#${hash}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3500)
  if (tabName) {
    await page.getByRole('tab', { name: tabName, exact: true }).first().click({ force: true })
    await page.waitForTimeout(2500)
  }
  await page.mouse.move(2, 2)
  await page.waitForTimeout(800)
  const text = await page.locator('main').innerText().catch(() => '')
  if (/tripped over a root/.test(text)) problems.push(`${suffix || 'light'} crash: ${text.slice(0, 200)}`)
  if (!text.trim()) problems.push(`${suffix || 'light'} blank page`)
  await page.screenshot({ path: `docs/screenshots/${name}${suffix}.png` })
  await ctx.close()
}
await browser.close()
if (problems.length) {
  console.log(problems.join('\n'))
  process.exit(1)
}
console.log(`ok docs/screenshots/${name}.png + ${name}-matrix.png`)
