import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
for (const [label, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' })
  await context.addInitScript(() => localStorage.setItem('bloom-welcome-v1', JSON.stringify({ at: Date.now(), answers: null })))
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('requestfailed', (request) => errors.push(`${request.url()}: ${request.failure()?.errorText}`))
  await page.goto('http://127.0.0.1:5176/#diet')
  await page.waitForTimeout(5000)
  if (await page.getByText('This page tripped over a root.').isVisible()) {
    await page.getByText('Details').click()
    throw new Error((await page.locator('body').innerText()).slice(-1800))
  }
  try { await page.getByRole('tab', { name: 'Recipes' }).click({ timeout: 60000 }) }
  catch (error) { if (await page.getByText('Details').isVisible()) await page.getByText('Details').click(); throw new Error(`${String(error)}\n${(await page.locator('body').innerText()).slice(-1800)}\n${errors.join('\n')}`) }
  await page.locator('.rb-foods button').first().click()
  await page.getByRole('textbox', { name: 'Recipe name' }).fill('Practice supper')
  await page.getByRole('textbox', { name: 'New preparation step' }).fill('Wash and prepare the ingredients')
  await page.getByRole('button', { name: 'Add step' }).click()
  await page.getByRole('textbox', { name: 'New preparation step' }).fill('Cook until ready, then serve')
  await page.getByRole('button', { name: 'Add step' }).click()
  await page.getByRole('button', { name: 'Save recipe' }).click()
  await page.reload()
  await page.getByRole('tab', { name: 'Recipes' }).click()
  await page.getByRole('button', { name: 'Cook along' }).click()
  await page.getByText('Wash and prepare the ingredients').last().waitFor()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByText('Cook until ready, then serve').last().waitFor()
  await page.getByRole('button', { name: 'Start timer' }).click()
  await page.waitForTimeout(1300)
  if (await page.locator('.cook-timer span').innerText() === '05:00') throw new Error('Kitchen timer did not advance')
  await page.getByRole('button', { name: 'Pause timer' }).click()
  await page.screenshot({ path: `docs/screenshots/page-audit-2026-09-29/${label}-cook-along.png` })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2)
  if (overflow) throw new Error(`${label} layout overflows`)
  await context.close()
}
await browser.close()
console.log('Cook-along steps, saving, navigation, and layout verified')
