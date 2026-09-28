// Smoke test for Learn to code: runs every lesson solution in the real editor + sandbox,
// checks the infinite-loop guard, and saves docs/screenshots/code-light.png.
// Usage: npm run dev, then node scripts/code-smoke.mjs
import { chromium } from 'playwright'
const b = await chromium.launch({ channel: 'chrome' })
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
await ctx.addInitScript(() => { if (location.protocol !== 'about:') localStorage.setItem('bloom-welcome-v1', '{}') })
const p = await ctx.newPage()
const errs = []
p.on('pageerror', (e) => errs.push(e.message))
p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 200)))
await p.goto('http://127.0.0.1:5173/#code', { waitUntil: 'networkidle' })
await p.waitForTimeout(3000)
await p.locator('.cd-hero .cd-run').click()
await p.waitForTimeout(1500)
const out = []
for (let i = 0; i < 11; i++) {
  await p.getByRole('button', { name: 'Get unstuck' }).click()
  await p.waitForTimeout(300)
  await p.locator('.cd-bar .cd-run').click()
  await p.waitForTimeout(1200)
  const title = await p.locator('.cd-learn h3').innerText()
  const score = await p.locator('.cd-score').innerText().catch(() => '?')
  out.push(`${title}: ${score}`)
  const next = p.getByRole('button', { name: 'Next lesson →' })
  if (!(await next.count())) break
  await next.click()
  await p.waitForTimeout(700)
}
// infinite loop protection
await p.locator('.cm-content').click()
await p.keyboard.press('Control+A')
await p.keyboard.type('while (true) {}')
await p.locator('.cd-bar .cd-run').click()
await p.waitForTimeout(3000)
out.push('loop: ' + (await p.locator('.cd-console pre').innerText()))
await p.goto('about:blank')
await p.goto('http://127.0.0.1:5173/#code', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)
await p.locator('.cd-chip').nth(3).click({ force: true })
await p.waitForTimeout(1200)
await p.getByRole('button', { name: 'Get unstuck' }).click()
await p.locator('.cd-bar .cd-run').click()
await p.waitForTimeout(1500)
await p.mouse.move(2, 2)
await p.screenshot({ path: 'docs/screenshots/code-light.png' })
console.log('scrollTops', await p.evaluate(() => [document.scrollingElement.scrollTop, document.querySelector('.studio-panel')?.scrollTop, document.querySelector('.cd-learn')?.scrollTop]))
console.log(out.join('\n'))
console.log('errors:', errs)
await b.close()
