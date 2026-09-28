import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
for (const [label, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' })
  await context.addInitScript(() => localStorage.setItem('bloom-welcome-v1', JSON.stringify({ at: Date.now(), answers: null })))
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:5176/#sounds')
  await page.getByRole('tab', { name: 'Rhythm lab' }).click()
  await page.getByRole('button', { name: 'Start practice' }).click()
  await page.waitForFunction(() => document.activeElement?.textContent?.includes('Tap the beat'))
  await page.keyboard.press('Space')
  if (!(await page.locator('.rhythm-feedback').innerText()).includes('1 recent taps')) throw new Error(`${label}: keyboard tap was not scored`)
  await page.screenshot({ path: `docs/screenshots/page-audit-2026-09-29/${label}-rhythm-lab.png` })
  await page.getByRole('button', { name: 'Stop' }).click()
  if (await page.locator('html').evaluate((node) => node.scrollWidth > innerWidth + 2)) throw new Error(`${label}: horizontal overflow`)
  await context.close()
}
await browser.close()
console.log('Rhythm practice works at desktop and mobile widths')
