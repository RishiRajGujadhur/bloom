import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { resolve } from 'node:path'
import { createBloomServer } from '../server.mjs'

const server = await createBloomServer(resolve('dist'))
await new Promise((done) => server.listen(0, '127.0.0.1', done))
const origin = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
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
  tab.on('pageerror', (error) => errors.push(error.message))
  await tab.goto(origin, { waitUntil: 'networkidle' })
  await tab.evaluate(() => navigator.serviceWorker.ready)
  await tab.reload({ waitUntil: 'networkidle' })
  await tab.waitForFunction(() => !!navigator.serviceWorker.controller)
  await tab.goto(`${origin}/#habits`, { waitUntil: 'networkidle' })
  await tab.locator('.habits-workspace').waitFor()
  await context.setOffline(true)
  await tab.reload({ waitUntil: 'networkidle' })
  await tab.locator('.habits-workspace').waitFor()
  assert.ok(!(await tab.getByText('This page tripped over a root.').count()))
  assert.deepEqual(errors, [])
  console.log(
    'Offline shell and previously visited Habits route reload successfully.',
  )
  await context.close()
} finally {
  await browser.close()
  await new Promise((done) => server.close(done))
}
