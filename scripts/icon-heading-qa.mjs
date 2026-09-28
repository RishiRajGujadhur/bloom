import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
for (const [label, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' })
  await context.addInitScript(() => localStorage.setItem('bloom-welcome-v1', JSON.stringify({ at: Date.now(), answers: null })))
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:5176/#todos')
  await page.locator('.page-emblem').waitFor()
  const icon = page.locator('.bloom-heading .page-emblem')
  if (await icon.getAttribute('data-hint') !== 'To-dos') throw new Error('Page icon has no label')
  await icon.focus()
  const state = await page.evaluate(() => ({ heading: document.querySelector('#page-heading')?.textContent?.trim(), tooltip: getComputedStyle(document.querySelector('.bloom-heading .page-emblem'), '::after').content }))
  if (state.heading !== 'To-dos' || !state.tooltip.includes('To-dos')) throw new Error(`Heading or focus tooltip missing: ${JSON.stringify(state)}`)
  await page.screenshot({ path: `docs/screenshots/page-audit-2026-09-29/${label}-icon-heading.png` })
  await context.close()
}
await browser.close()
console.log('Icon headings preserve names and keyboard tooltip')
