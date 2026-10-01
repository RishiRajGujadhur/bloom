// usage: node _g.mjs <gameId> <clicks> <shotAt> <waitMs> [fx,fy;fx,fy...]
import { chromium } from 'playwright'
const [id, clicks = '10', shotAt = '6', wait = '600', pts = ''] = process.argv.slice(2)
const P = pts ? pts.split(';').map((p) => p.split(',').map(Number)) : null
const b = await chromium.launch({ channel: 'chrome' }); const errs = []
for (const theme of ['light', 'matrix']) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1050 } })
  await ctx.addInitScript((t) => { localStorage.setItem('bloom-welcome-v1', '{}'); if (t === 'matrix') localStorage.setItem('mindfulness-dashboard-theme-settings', JSON.stringify({ themeId: 'matrix', fontId: 'default' })) }, theme)
  const A = await ctx.newPage()
  A.on('pageerror', (e) => errs.push(e.message)); A.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
  await A.goto(`http://localhost:5173/#arcade/${id}`, { waitUntil: 'networkidle' }); await A.waitForTimeout(2000)
  await A.locator('.ar-stage').scrollIntoViewIfNeeded()
  const box = await A.locator('.ar-stage canvas, .ar-stage > svg, .ar-stage > div').first().boundingBox()
  for (let i = 0; i < +clicks; i++) {
    const [fx, fy, tx, ty] = P ? P[i % P.length] : [0.2 + 0.6 * Math.random(), 0.08]
    if (tx != null) { await A.mouse.move(box.x + box.width * fx, box.y + box.height * fy); await A.mouse.down(); for (let k = 1; k <= 8; k++) { await A.mouse.move(box.x + box.width * (fx + (tx - fx) * k / 8), box.y + box.height * (fy + (ty - fy) * k / 8)); await A.waitForTimeout(16) } await A.mouse.up() }
    else { await A.mouse.move(box.x + box.width * fx, box.y + box.height * fy); await A.mouse.click(box.x + box.width * fx, box.y + box.height * fy) }
    await A.waitForTimeout(+wait)
    if (i === +shotAt) await A.screenshot({ path: `docs/screenshots/arcade-${id}${theme === 'matrix' ? '-matrix' : ''}.png` })
  }
  await A.waitForTimeout(4000)
  console.log(theme, 'result:', (await A.locator('.ar-result').innerText().catch(() => '-')).replace(/\n+/g, ' | '))
  await ctx.close()
}
console.log('errors', errs); await b.close()
