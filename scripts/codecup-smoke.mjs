// Smoke test for the Code Cup story: intro video → prologue → win round 1 → wheel,
// then win the final → finale video. Saves screenshots to docs/screenshots/codecup-*.png.
// Usage: npm run dev, then node scripts/codecup-smoke.mjs
import { chromium } from 'playwright'
const base = process.env.BLOOM_URL ?? 'http://127.0.0.1:5173'
const b = await chromium.launch({ channel: 'chrome' })
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
await ctx.addInitScript(() => { if (location.protocol !== 'about:') localStorage.setItem('bloom-welcome-v1', '{}') })
const p = await ctx.newPage()
const errs = []
p.on('pageerror', (e) => errs.push(e.message))
p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 200)))
const shot = async (name) => { await p.mouse.move(2, 2); await p.waitForTimeout(500); await p.screenshot({ path: `docs/screenshots/codecup-${name}.png` }) }
const log = []
await p.goto(`${base}/#code`, { waitUntil: 'networkidle' })
await p.waitForTimeout(3000)
await p.getByRole('tab', { name: 'Code Cup', exact: true }).click()
await p.waitForTimeout(3500)
log.push('intro video: ' + (await p.locator('.st-video').count()))
await shot('intro')
await p.locator('.st-video-skip').click()
await p.waitForTimeout(800)
log.push('prologue: ' + (await p.locator('.st-box').innerText()).slice(0, 60))
await shot('dialogue')
await p.locator('.st-skip').click()
await p.waitForTimeout(1200)

async function playRound(nodeIndex, answers) {
  await p.locator('.st-node').nth(nodeIndex).click({ force: true })
  await p.waitForTimeout(800)
  await p.locator('.st-skip').click()
  await p.waitForTimeout(1200)
  await p.getByRole('button', { name: /Fight/ }).click()
  await p.waitForTimeout(1200)
  for (const a of answers) {
    await p.locator('.cd-opt').nth(a).click()
    await p.waitForTimeout(400)
    await p.locator('.cs-card .cd-run').click()
    await p.waitForTimeout(600)
  }
}
await playRound(0, [0, 1, 2, 1, 1])
await p.waitForTimeout(800)
log.push('after round 1: ' + (await p.locator('.st-box').innerText()).slice(0, 80))
await p.locator('.st-skip').click()
await p.waitForTimeout(1000)
log.push('wheel: ' + (await p.locator('.st-wheel').count()))
await shot('wheel')
await p.getByRole('button', { name: 'Back to the bracket' }).click()
await p.waitForTimeout(1000)

// Unlock the final, then take a duel screenshot mid-match and win it.
await p.evaluate(() => localStorage.setItem('bloom-code-story-v1', JSON.stringify({ cleared: 2, seenIntro: true, seenFinale: false })))
await p.goto('about:blank')
await p.goto(`${base}/#code`, { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)
await p.getByRole('tab', { name: 'Code Cup', exact: true }).click()
await p.waitForTimeout(1500)
await shot('bracket')
await p.locator('.st-node').nth(2).click({ force: true })
await p.waitForTimeout(800)
await p.locator('.st-skip').click()
await p.waitForTimeout(1200)
await shot('versus')
await p.getByRole('button', { name: /Fight/ }).click()
await p.waitForTimeout(1500)
await p.locator('.cd-opt').nth(1).click()
await p.waitForTimeout(600)
await shot('duel')
await p.locator('.cs-card .cd-run').click()
await p.waitForTimeout(600)
for (const a of [1, 0, 0, 1, 1]) {
  await p.locator('.cd-opt').nth(a).click()
  await p.waitForTimeout(400)
  await p.locator('.cs-card .cd-run').click()
  await p.waitForTimeout(600)
}
await p.waitForTimeout(800)
log.push('after final: ' + (await p.locator('.st-box').innerText()).slice(0, 80))
await p.locator('.st-skip').click()
await p.waitForTimeout(1000)
await p.getByRole('button', { name: /Watch the finale/ }).click()
await p.waitForTimeout(3500)
log.push('finale video: ' + (await p.locator('.st-video').count()))
await shot('finale')
console.log(log.join('\n'))
console.log('errors:', errs)
await b.close()
