// Capture README screenshots with Playwright (uses the installed Chrome).
// Usage: start the dev server (npm run dev), then: node scripts/screenshots.mjs
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

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
  ['english', 'english-speak', [tab('Speak')]],
  ['english', 'english-write', [tab('Write')]],
  ['money', 'money-charts', [tab('Charts'), async (page) => page.waitForTimeout(2500)]],
  ['joys', 'little-joys-sky', [tab('Sky')]],
  ['joys', 'little-joys-postcard', [tab('Postcard')]],
  ['todos', 'todos'],
  ['calendar', 'calendar'],
  ['focus', 'focus'],
  ['daybook', 'daybook'],
  ['meditate', 'meditate'],
  ['sleep', 'sleep'],
  ['release', 'let-it-go'],
  ['workouts', 'workouts'],
  ['yoga', 'yoga'],
  ['dojo', 'dojo'],
  ['world', 'bloom-world'],
  ['settings', 'settings-avatars', [async (page) => { await page.locator('.avatar-picker').scrollIntoViewIfNeeded(); await page.waitForTimeout(1500) }]],
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

const problems = []
const browser = await chromium.launch({ channel: 'chrome' })
for (const [themeId, themeName] of themes) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  await ctx.addInitScript((id) => {
    if (location.protocol === 'about:') return // blank pages between shots have no storage
    localStorage.setItem('bloom-welcome-v1', JSON.stringify({ done: true }))
    localStorage.setItem('mindfulness-dashboard-theme-settings', JSON.stringify({ themeId: id, fontId: 'default' }))
  }, themeId)
  const page = await ctx.newPage()
  let current = ''
  const noise = /favicon|Download the React DevTools|\[vite\]|WebGPU|webgpu|net::ERR_ABORTED/
  page.on('console', (m) => { if (m.type() === 'error' && !noise.test(m.text())) problems.push({ shot: current, kind: 'console', text: m.text().slice(0, 300) }) })
  page.on('pageerror', (e) => problems.push({ shot: current, kind: 'exception', text: String(e.message).slice(0, 300) }))
  for (const [hash, name, steps = []] of pages) {
    current = `${name}-${themeName}`
    await page.goto('about:blank')
    await page.goto(`${base}/#${hash}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(3500)
    try {
      for (const step of steps) await step(page)
    } catch (e) {
      problems.push({ shot: current, kind: 'steps', text: e.message.split(String.fromCharCode(10))[0] })
    }
    await page.mouse.move(2, 2) // keep pointer trails out of the shot
    await page.waitForTimeout(600)
    const text = await page.locator('main').innerText().catch(() => '')
    if (/tripped over a root/.test(text)) problems.push({ shot: current, kind: 'crash', text: text.slice(0, 200) })
    if (!text.trim()) problems.push({ shot: current, kind: 'blank', text: 'main is empty' })
    await page.screenshot({ path: `${out}/${name}-${themeName}.png` })
    console.log('saved', `${name}-${themeName}.png`)
  }
  await ctx.close()
}
await browser.close()
writeFileSync(`${out}/report.json`, JSON.stringify(problems, null, 2))
console.log(problems.length ? `${problems.length} problem(s) — see ${out}/report.json` : 'No problems found')
