import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'no-preference' })
await context.addInitScript(() => localStorage.setItem('bloom-welcome-v1', JSON.stringify({ at: Date.now(), answers: null })))
const page = await context.newPage()
await page.goto('http://127.0.0.1:5173/#settings')
await page.getByText('Reduce motion', { exact: true }).click()
if (await page.locator('html').getAttribute('data-reduce-motion') !== 'true') throw new Error('Motion preference was not applied')
await page.screenshot({ path: 'docs/screenshots/page-audit-2026-09-29/reduced-motion-settings.png' })
await page.goto('http://127.0.0.1:5173/#focus')
if (await page.locator('html').getAttribute('data-reduce-motion') !== 'true') throw new Error('Motion preference was not restored')
console.log('Reduced motion persists across pages')
await browser.close()
