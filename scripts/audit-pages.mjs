import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const source = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8')
const navType = source.split('export type NavKey =')[1].split('interface SidebarProps')[0]
const pages = [...navType.matchAll(/\| '([^']+)'/g)].map((match) => match[1])
const output = 'docs/screenshots/page-audit-2026-09-29'
const baseURL = process.env.BLOOM_AUDIT_URL ?? 'http://127.0.0.1:5173'
fs.mkdirSync(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const findings = []
for (const [label, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' })
  await context.addInitScript(() => localStorage.setItem('bloom-welcome-v1', JSON.stringify({ at: Date.now(), answers: null })))
  const tab = await context.newPage()
  const errors = []
  tab.on('pageerror', (error) => errors.push(error.message))
  for (const page of pages) {
    try {
      await tab.goto(`${baseURL}/#${page}`, { waitUntil: 'domcontentloaded', timeout: 20000 })
      await tab.getByText('Loading…', { exact: true }).waitFor({ state: 'hidden', timeout: 12000 }).catch(() => undefined)
      await tab.waitForTimeout(150)
      await tab.screenshot({ path: path.join(output, `${label}-${page}.png`), timeout: 15000 })
      const state = await tab.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth + 2, heading: document.querySelector('#page-heading')?.textContent?.trim() ?? '', errorScreen: document.body.innerText.includes('This page tripped over a root.'), stuckLoading: document.body.innerText.includes('Loading…') }))
      findings.push({ label, page, ...state, errors: errors.splice(0) })
    } catch (error) {
      findings.push({ label, page, captureError: String(error), errors: errors.splice(0) })
    }
  }
  await context.close()
}
await browser.close()
fs.writeFileSync(path.join(output, 'findings.json'), JSON.stringify(findings, null, 2))
console.log(`Captured ${findings.filter((entry) => !entry.captureError).length}/${findings.length} pages; ${findings.filter((entry) => entry.overflow || entry.errors.length || entry.captureError || entry.errorScreen || entry.stuckLoading).length} findings.`)
