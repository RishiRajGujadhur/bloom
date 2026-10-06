import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { resolve } from 'node:path'
import { createBloomServer } from '../server.mjs'

const server = await createBloomServer(resolve('dist'))
await new Promise((done) => server.listen(0, '127.0.0.1', done))
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })
  await context.addInitScript(() => {
    localStorage.setItem(
      'bloom-welcome-v1',
      JSON.stringify({ at: Date.now(), answers: null }),
    )
    localStorage.setItem(
      'mindfulness-dashboard-settings',
      JSON.stringify({ reducedMotion: true }),
    )
  })
  const tab = await context.newPage()
  const errors = []
  tab.on('pageerror', (error) => errors.push(error.stack ?? error.message))
  await tab.goto(`http://127.0.0.1:${server.address().port}`, {
    waitUntil: 'networkidle',
  })
  for (const route of [
    'habits',
    'journal',
    'overview',
    'settings',
    'weeks',
    'mindmaps',
    'mirror',
    'ink',
    'exercises',
    'focus',
    'overview',
  ]) {
    await tab.evaluate((route) => {
      location.hash = route
    }, route)
    await tab.locator('#page-heading').waitFor()
    await tab.waitForFunction(() => !document.querySelector('.page-loading'))
    await tab.waitForLoadState('networkidle')
    assert.equal(
      await tab.getByText('This page tripped over a root.').count(),
      0,
      route,
    )
    assert.deepEqual(errors, [], route)
    console.log(`Warm navigation #${route}: passed`)
  }
  await context.close()
} finally {
  await browser.close()
  await new Promise((done) => server.close(done))
}
