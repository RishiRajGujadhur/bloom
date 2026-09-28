import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
for (const [label, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' })
  await context.addInitScript(() => localStorage.setItem('bloom-welcome-v1', JSON.stringify({ at: Date.now(), answers: null })))
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:5176/#sounds')
  await page.getByRole('tab', { name: 'Pitch lab' }).click()
  await page.getByRole('radio', { name: 'Close notes' }).click()
  await page.getByRole('button', { name: 'Play two notes' }).click()
  await page.waitForFunction(() => !(document.querySelector('.pitch-choices button')?.disabled))
  await page.getByRole('button', { name: 'Higher' }).click()
  if (!(await page.locator('.pitch-feedback').innerText()).includes('semitones apart')) throw new Error(`${label}: pitch answer was not explained`)
  const layout = await page.evaluate(() => { const panel = document.querySelector('.studio-panel'); const card = document.querySelector('.pitch-lab'); const box = card?.getBoundingClientRect(); return { panelScroll: panel?.scrollLeft, panelWidth: panel?.clientWidth, panelContent: panel?.scrollWidth, cardLeft: box?.left, cardRight: box?.right } })
  if ((layout.panelContent ?? 0) > (layout.panelWidth ?? 0) + 2 || (layout.cardLeft ?? 0) < -1 || (layout.cardRight ?? 0) > width + 1) throw new Error(`${label}: pitch panel clips content ${JSON.stringify(layout)}`)
  await page.screenshot({ path: `docs/screenshots/page-audit-2026-09-29/${label}-pitch-lab.png` })
  await page.getByRole('button', { name: 'Next pair' }).click()
  if (!(await page.locator('.pitch-count').innerText()).includes('Question 2 of 10')) throw new Error(`${label}: next question did not open`)
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2)) throw new Error(`${label}: horizontal overflow`)
  await context.close()
}
await browser.close()
console.log('Pitch practice works at desktop and mobile widths')
