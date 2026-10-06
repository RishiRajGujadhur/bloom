// Start Bloom with npm run dev, then run: node scripts/technology-screenshots.mjs
// Fresh browser contexts keep showcase data separate from personal data.
import { chromium, expect } from '@playwright/test'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const base = process.env.BLOOM_URL ?? 'http://127.0.0.1:5173'
const directory = 'docs/screenshots/technology'
mkdirSync(directory, { recursive: true })
const viewport = { width: 1440, height: 1000 }
const selected = new Set(process.argv.slice(2))
const names = ['overview', 'focus', 'local-ai', 'webcam-workout', 'bluetooth', 'readiness-demo', 'life-map', 'terrain-replay', 'code-city']
for (const name of selected) if (!names.includes(name)) throw new Error(`Unknown screenshot: ${name}. Choose ${names.join(', ')}.`)
const browser = await chromium.launch()
const manifestPath = `${directory}/manifest.json`
const shots = selected.size && existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8')).screenshots.filter(shot => !selected.has(shot.file.replace(/\.png$/, '')))
  : []
const errors = []

async function capture(file, route, caption, prepare = async () => {}, focus) {
  if (selected.size && !selected.has(file)) return
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce', serviceWorkers: 'block' })
  await context.addInitScript(() => {
    localStorage.setItem('bloom-welcome-v1', JSON.stringify({ done: true }))
    localStorage.setItem('mindfulness-dashboard-theme-settings', JSON.stringify({ themeId: 'bloom-light', fontId: 'default' }))
    localStorage.setItem('bloom-companion-width', '560')
    localStorage.setItem('bloom-coach-accessible', 'true')
    localStorage.setItem('bloom-coach-view', 'advanced')
    for (const page of ['workouts', 'run', 'places', 'readiness', 'code-city']) {
      localStorage.setItem(`bloom-page-mode:${page}`, 'advanced')
    }
    const now = Date.now()
    const samples = [
      { label: 'Sample · park', lat: 51.5075, lng: -0.165, mood: 5 },
      { label: 'Sample · café', lat: 51.5105, lng: -0.133, mood: 4 },
      { label: 'Sample · riverside', lat: 51.5055, lng: -0.117, mood: 5 },
      { label: 'Sample · station', lat: 51.503, lng: -0.113, mood: 2 },
    ]
    localStorage.setItem('bloom-places-v1', JSON.stringify({
      enabled: true,
      points: samples.flatMap((point, index) => [0, 1, 2].map(visit => ({ ...point, id: `sample-${index}-${visit}`, at: now - visit * 86400000, kind: 'mood' }))),
      names: Object.fromEntries(samples.map(point => [`${Math.round(point.lat * 700)}:${Math.round(point.lng * 700)}`, point.label])),
      habits: [],
    }))
  })
  const page = await context.newPage()
  page.on('pageerror', error => errors.push({ file, message: error.message }))
  try {
    await page.goto(`${base}/#${route}`, { waitUntil: 'domcontentloaded', timeout: 120000 })
    await expect(page.locator('.page-content')).toBeVisible({ timeout: 60000 })
    await prepare(page)
    await page.evaluate(() => document.fonts.ready)
    // Let lazy scenes, map tiles and welcome notifications settle before capture.
    await page.waitForTimeout(6500)
    if (focus) await page.locator(focus).first().evaluate(node => window.scrollTo({ top: Math.max(0, window.scrollY + node.getBoundingClientRect().top - 100), behavior: 'instant' }))
    await page.mouse.move(0, 0)
    await page.waitForTimeout(400)
    await expect(page.locator('.page-crash')).toHaveCount(0)
    await page.screenshot({ path: `${directory}/${file}.png`, animations: 'disabled' })
    shots.push({ file: `${file}.png`, route: `#${route}`, caption })
    console.log(`Saved ${file}.png`)
  } finally {
    await context.close()
  }
}

try {
  await capture('overview', 'overview', 'The current dashboard and shared section navigation.')
  await capture('focus', 'focus', 'Focus sessions in the current Bloom interface.')
  await capture('local-ai', 'focus', 'Optional local AI setup alongside the lightweight planner; no model downloaded.', async page => {
    await page.getByRole('button', { name: 'Talk to Bloom', exact: true }).click()
    await page.getByRole('tab', { name: 'Plan with Bloom', exact: true }).click()
    await page.locator('.companion-ai-options > summary').click()
    await expect(page.getByRole('button', { name: 'Download & enable local AI' })).toBeVisible()
  })
  await capture('webcam-workout', 'workouts/coach', 'Form Coach running its built-in demo athlete, not a live camera.', async page => {
    await page.getByRole('button', { name: 'Watch the demo athlete' }).click()
    await expect(page.locator('.fc-calibration')).toContainText('Neutral position calibrated', { timeout: 20000 })
    await expect.poll(async () => Number(await page.locator('.fc-count').textContent()), { timeout: 20000 }).toBeGreaterThan(0)
  }, '.fc-split')
  await capture('bluetooth', 'readiness', 'Bluetooth heart-rate source selected; no physical device paired.', async page => {
    await page.getByRole('radio', { name: /Bluetooth strap/ }).click()
    await expect(page.getByRole('radio', { name: /Bluetooth strap/ })).toHaveAttribute('aria-checked', 'true')
  }, '.rd-page')
  await capture('readiness-demo', 'readiness', 'Built-in simulated heartbeats; excluded from personal baselines.', async page => {
    await page.getByRole('radio', { name: /Simulated strap/ }).click()
    await page.getByRole('button', { name: 'Start 60-second scan' }).click()
    await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible()
  }, '.rd-page')
  await capture('life-map', 'places', 'OpenStreetMap with fictional sample mood check-ins.', async page => {
    await expect(page.locator('.leaflet-container')).toBeVisible()
    await expect.poll(() => page.locator('.leaflet-tile-loaded').count(), { timeout: 30000 }).toBeGreaterThan(0)
  }, '.places-page')
  await capture('terrain-replay', 'run/terrain', 'Built-in sample hilly run in the 3D terrain replay.', async page => {
    await page.getByRole('button', { name: 'Sample hilly run' }).click()
    await expect(page.locator('.tr-canvas canvas')).toBeVisible({ timeout: 60000 })
    await expect(page.locator('.tr-backend')).toBeVisible({ timeout: 60000 })
  }, '.tr-page')
  await capture('code-city', 'code-city', 'Built-in sample repository rendered as a city; no personal repository opened.', async page => {
    await page.getByRole('button', { name: 'Try the sample city' }).click()
    await expect(page.locator('.cc-canvas canvas')).toBeVisible({ timeout: 60000 })
    await expect(page.locator('.cc-backend')).toBeVisible({ timeout: 60000 })
  }, '.cc-page')
} finally {
  writeFileSync(manifestPath, JSON.stringify({ capturedAt: new Date().toISOString(), browser: browser.version(), viewport, screenshots: shots, errors }, null, 2) + '\n')
  await browser.close()
}
if (errors.length) throw new Error(`Screenshot pages reported ${errors.length} runtime error(s); inspect ${directory}/manifest.json`)
