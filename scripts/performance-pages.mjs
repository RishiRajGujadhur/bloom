import { chromium } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createBloomServer } from '../server.mjs'

const source = await readFile('src/components/layout/Sidebar.tsx', 'utf8')
const navType = source
  .split('export type NavKey =')[1]
  .split('interface SidebarProps')[0]
const allPages = [...navType.matchAll(/\| '([^']+)'/g)].map((match) => match[1])
const requested = process.argv
  .find((arg) => arg.startsWith('--pages='))
  ?.slice(8)
  .split(',')
const pages = requested
  ? allPages.filter((page) => requested.includes(page))
  : allPages
const output =
  process.argv.find((arg) => arg.startsWith('--output='))?.slice(9) ??
  'docs/performance-pages.json'
const settingsSource = await readFile('src/settings/appSettings.ts', 'utf8')
const defaults = settingsSource
  .split('export const defaultSettings')[1]
  .split('export const featureKeys')[0]
const features = Object.fromEntries(
  [...defaults.matchAll(/(\w+): (?:true|false),/g)]
    .filter((match) => match[1] !== 'reducedMotion')
    .map((match) => [match[1], true]),
)
const server = await createBloomServer(resolve('dist'))
await new Promise((done) => server.listen(0, '127.0.0.1', done))
const baseURL = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ headless: true })
const results = []
try {
  for (const [profile, viewport] of [
    ['desktop', { width: 1440, height: 900 }],
    ['mobile', { width: 390, height: 844 }],
  ]) {
    const context = await browser.newContext({
      viewport,
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    })
    await context.addInitScript((flags) => {
      localStorage.setItem(
        'bloom-welcome-v1',
        JSON.stringify({ at: Date.now(), answers: null }),
      )
      localStorage.setItem(
        'mindfulness-dashboard-settings',
        JSON.stringify({ features: flags, reducedMotion: true }),
      )
      // Bound sidebar work independently of users' saved expansion preferences.
      localStorage.setItem('bloom-nav-groups', '[0]')
    }, features)
    const errors = []
    for (const page of pages) {
      const tab = await context.newPage()
      tab.on('pageerror', (error) => errors.push(error.stack ?? error.message))
      try {
        await tab.goto(`${baseURL}/#${page}`, {
          waitUntil: 'domcontentloaded',
          timeout: 45000,
        })
        await tab.locator('#page-heading').waitFor({ timeout: 30000 })
        await tab.waitForFunction(
          () =>
            ![...document.querySelectorAll('[role="status"]')].some((node) =>
              /^Loading(?: page)?[….]/.test(node.textContent.trim()),
            ),
          undefined,
          { timeout: 30000 },
        )
        await tab
          .waitForLoadState('networkidle', { timeout: 10000 })
          .catch(() => {})
        const state = await tab.evaluate(() => {
          const resources = performance.getEntriesByType('resource')
          const js = resources.filter((entry) =>
            /\.js(?:\?|$)/.test(entry.name),
          )
          const css = resources.filter((entry) =>
            /\.css(?:\?|$)/.test(entry.name),
          )
          const images = [...document.querySelectorAll('img')]
          return {
            heading: document
              .querySelector('#page-heading')
              ?.textContent.trim(),
            domNodes: document.querySelectorAll('*').length,
            mainNodes: document.querySelector('main')?.querySelectorAll('*')
              .length,
            jsBytes: js.reduce((sum, entry) => sum + entry.decodedBodySize, 0),
            cssBytes: css.reduce(
              (sum, entry) => sum + entry.decodedBodySize,
              0,
            ),
            jsRequests: js.length,
            audioRequestsBeforePlay: resources.filter((entry) =>
              /\/audio\//.test(entry.name),
            ).length,
            loadingLottieBeforeInteraction: resources.some((entry) =>
              /lottie_light/.test(entry.name),
            ),
            imageCount: images.length,
            imagesWithoutDimensions: images
              .filter(
                (image) =>
                  !image.hasAttribute('width') || !image.hasAttribute('height'),
              )
              .map((image) => image.getAttribute('src')),
            hiddenHabitsMounted:
              !location.hash.endsWith('habits') &&
              !!document.querySelector('.habits-workspace'),
            errorScreen: document.body.innerText.includes(
              'This page tripped over a root.',
            ),
            horizontalOverflow:
              document.documentElement.scrollWidth > innerWidth + 2,
          }
        })
        results.push({ profile, page, ...state, errors: errors.splice(0) })
      } catch (error) {
        results.push({
          profile,
          page,
          error: String(error),
          errors: errors.splice(0),
        })
      }
      await tab.close()
      console.log(
        `${profile} #${page}: ${results.at(-1).error ?? `${results.at(-1).domNodes} nodes`}`,
      )
    }
    await context.close()
  }
} finally {
  await browser.close()
  await new Promise((done) => server.close(done))
}
await writeFile(
  output,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      note: 'Production build, two viewports, all features enabled, reduced motion, fresh page per route, shared warm HTTP cache across routes, service workers blocked to isolate network delivery. Lab snapshot, not field Core Web Vitals.',
      results,
    },
    null,
    2,
  ) + '\n',
)
const failures = results.filter(
  (result) => result.error || result.errorScreen || result.errors.length,
)
console.log(
  `Audited ${results.length} page/viewports; ${failures.length} errors.`,
)
if (failures.length) process.exitCode = 1
// Keep a reviewable per-route checklist alongside the machine-readable results.
const rows = [...new Set(results.map((result) => result.page))].map((page) => {
  const desktop = results.find(
    (result) => result.page === page && result.profile === 'desktop',
  )
  const mobile = results.find(
    (result) => result.page === page && result.profile === 'mobile',
  )
  const pair = [desktop, mobile].filter(Boolean)
  const notes = []
  if (
    pair.some(
      (result) => result.error || result.errorScreen || result.errors.length,
    )
  )
    notes.push('runtime failure')
  if (pair.some((result) => result.domNodes > 1500)) notes.push('DOM > 1,500')
  if (pair.some((result) => result.horizontalOverflow))
    notes.push('horizontal overflow')
  return `| #${page} | 1–43, 47–74 (71 shared safeguards) | ${desktop?.domNodes ?? '—'} | ${mobile?.domNodes ?? '—'} | ${notes.join('; ') || 'Passed snapshot checks'} |`
})
if (output === 'docs/performance-pages.json')
  await writeFile(
    'docs/performance-pages.md',
    [
      '# Per-page performance matrix',
      '',
      'See [performance.md](performance.md) for source evidence and conditional applicability of each safeguard. Counts reflect shared changes, not independent per-page edits. DOM snapshots include navigation and the page shell; populated user data can change these counts.',
      '',
      '| Route | Implemented shared checklist | Desktop DOM | Mobile DOM | Observations |',
      '|---|---|---:|---:|---|',
      ...rows,
      '',
    ].join('\n'),
  )
