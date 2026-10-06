import { chromium } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const option = (name, fallback) => process.argv.find(arg => arg.startsWith(`--${name}=`))?.split('=').slice(1).join('=') ?? fallback
const baseURL = option('url', 'http://localhost:5173')
const source = await readFile('src/components/layout/Sidebar.tsx', 'utf8')
const routes = [...source.split('export type NavKey =')[1].split('interface SidebarProps')[0].matchAll(/\| '([^']+)'/g)].map(match => match[1])
const selected = option('pages', '').split(',').filter(Boolean)
const mobile = option('profile', 'desktop') === 'mobile'
const mode = option('mode', 'basic')
if (!['basic', 'advanced'].includes(mode)) throw new Error('Mode must be basic or advanced')
for (let attempt = 0; ; attempt++) {
  try { if ((await fetch(baseURL, { signal: AbortSignal.timeout(3000) })).ok) break } catch { /* server may still be starting */ }
  if (attempt >= 30) throw new Error(`Server unavailable: ${baseURL}`)
  await new Promise(resolve => setTimeout(resolve, 500))
}
const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
  isMobile: mobile, hasTouch: mobile, serviceWorkers: 'block', reducedMotion: 'reduce',
})
await context.addInitScript(mode => {
  localStorage.setItem('bloom-welcome-v1', JSON.stringify({ at: Date.now(), answers: null }))
  const page = location.hash.slice(1).split('/')[0] || 'overview'
  localStorage.setItem(`bloom-page-mode:${page}`, mode)
  if (page === 'todos') localStorage.setItem('bloom-todo-mode', mode === 'advanced' ? 'pro' : 'simple')
}, mode)
const results = []
try {
  for (const route of routes.filter(route => !selected.length || selected.includes(route))) {
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    const result = { route, errors, violations: [] }
    try {
      await page.goto(`${baseURL}/#${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
      await page.locator('#page-heading').waitFor({ timeout: 30000 })
      await page.waitForFunction(() => ![...document.querySelectorAll('[role="status"]')].some(node => /^Loading/.test(node.textContent.trim())), undefined, { timeout: 30000 })
      await page.waitForTimeout(300)
      if (await page.locator('.page-crash').count()) errors.push(await page.locator('.page-crash code').innerText())
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') })
      result.violations = await page.evaluate(async () => {
        const audit = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })
        return audit.violations.map(item => ({ id: item.id, impact: item.impact, help: item.help, nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) }))
      })
      result.markup = await page.evaluate(() => {
        const counts = new Map()
        document.querySelectorAll('[id]').forEach(node => counts.set(node.id, (counts.get(node.id) ?? 0) + 1))
        return { duplicateIds: [...counts].filter(([, count]) => count > 1).map(([id]) => id), nestedButtons: document.querySelectorAll('button button, a a').length, horizontalOverflow: document.documentElement.scrollWidth > innerWidth }
      })
    } catch (error) { errors.push(error.message) }
    results.push(result)
    console.log(`${route}: ${errors.length} errors; ${result.violations.map(item => `${item.id} (${item.nodes.length})`).join(', ') || 'no automated WCAG violations'}`)
    await page.close()
    await writeFile(option('output', `docs/standards-${mobile ? 'mobile' : 'desktop'}-${mode}.json`), JSON.stringify({ date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Indian/Mauritius' }).format(new Date()), baseURL, mode, profile: mobile ? 'mobile' : 'desktop', results }, null, 2) + '\n')
  }
} finally { await browser.close() }
if (results.some(result => result.errors.length || result.violations.length || result.markup?.duplicateIds.length || result.markup?.nestedButtons || result.markup?.horizontalOverflow)) process.exitCode = 1
