// Capture README screenshots with Playwright (uses the installed Chrome).
// Usage: start the dev server (npm run dev), then: node scripts/screenshots.mjs
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const base = process.env.BLOOM_URL ?? 'http://127.0.0.1:5173'
const out = 'docs/screenshots'
mkdirSync(out, { recursive: true })

const pages = [
  ['overview', 'home'],
  ['english', 'english'],
  ['money', 'money'],
  ['joys', 'little-joys'],
  ['taichi', 'tai-chi'],
]
const themes = [
  ['bloom-light', 'light'],
  ['matrix', 'matrix'],
]

const browser = await chromium.launch({ channel: 'chrome' })
for (const [themeId, themeName] of themes) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  await ctx.addInitScript((id) => {
    localStorage.setItem('bloom-welcome-v1', JSON.stringify({ done: true }))
    localStorage.setItem('mindfulness-dashboard-theme-settings', JSON.stringify({ themeId: id, fontId: 'default' }))
  }, themeId)
  const page = await ctx.newPage()
  for (const [hash, name] of pages) {
    await page.goto(`${base}/#${hash}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(3500)
    await page.screenshot({ path: `${out}/${name}-${themeName}.png` })
    console.log('saved', `${name}-${themeName}.png`)
  }
  await ctx.close()
}
await browser.close()
