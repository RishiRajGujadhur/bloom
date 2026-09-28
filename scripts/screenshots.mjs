// Capture README screenshots with Playwright (uses the installed Chrome).
// Usage: start the dev server (npm run dev), then: node scripts/screenshots.mjs
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const base = process.env.BLOOM_URL ?? 'http://127.0.0.1:5173'
const out = 'docs/screenshots'
mkdirSync(out, { recursive: true })

const click = (sel) => async (page) => { await page.locator(sel).first().click({ force: true }); await page.waitForTimeout(1500) }
const tab = (name) => async (page) => { await page.getByRole('tab', { name, exact: true }).first().click({ force: true }); await page.waitForTimeout(2500) }
// [hash, file name, optional steps to run before the shot]
const pages = [
  ['overview', 'home'],
  ['english', 'english'],
  ['money', 'money'],
  ['joys', 'little-joys'],
  ['taichi', 'tai-chi'],
  ['games', 'games'],
  ['english', 'english-lesson', [click('.en-node.is-current'), click('.en-pic')]],
  ['english', 'english-story', [tab('Story'), click('.st-video-skip')]],
  ['english', 'english-league', [tab('League')]],
  // Last, because the chat stays open: open it and type a command so a reply shows.
  ['habits', 'chat', [click('.bloom-companion-launch'), async (page) => {
    await page.fill('.bg-guide-search input', 'add todo call mum')
    await page.press('.bg-guide-search input', 'Enter')
    await page.waitForTimeout(1500)
  }]],
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
  for (const [hash, name, steps = []] of pages) {
    await page.goto('about:blank')
    await page.goto(`${base}/#${hash}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(3500)
    try {
      for (const step of steps) await step(page)
    } catch (e) {
      console.warn('steps failed for', name, e.message)
    }
    await page.screenshot({ path: `${out}/${name}-${themeName}.png` })
    console.log('saved', `${name}-${themeName}.png`)
  }
  await ctx.close()
}
await browser.close()
