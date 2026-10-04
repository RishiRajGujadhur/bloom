import { test, expect } from '@playwright/test'
test.use({ serviceWorkers: 'allow' })
test('prepared production tracking initializes with the network disconnected', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'One desktop run downloads the real versioned tracking assets')
  test.setTimeout(180000)
  await page.addInitScript(() => {
    localStorage.setItem('bloom-welcome-v1', '{}'); localStorage.setItem('bloom-coach-accessible', 'true')
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: async () => {
      const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480
      const timer = window.setInterval(() => canvas.getContext('2d')!.fillRect(0, 0, 640, 480), 50)
      const stream = canvas.captureStream(20)
      stream.getTracks().forEach(track => { const stop = track.stop.bind(track); track.stop = () => { clearInterval(timer); stop() } })
      return stream
    } })
  })
  await page.goto('/#workouts/coach', { waitUntil: 'domcontentloaded' })
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 30000 }).toBe(true)
  await page.getByText('Training insights, history & connections', { exact: true }).click()
  await page.getByRole('button', { name: 'Prepare offline tracking' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Tracking files cached' })).toBeVisible({ timeout: 90000 })
  const shellAssets = await page.locator('link[rel="modulepreload"]').evaluateAll(nodes => nodes.map(node => (node as HTMLLinkElement).href))
  for (const url of shellAssets) {
    expect(await page.evaluate(async asset => !!await caches.match(asset, { ignoreVary: true }), url), `Offline shell dependency: ${url}`).toBe(true)
  }
  await context.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Start camera' }).click()
  await expect(page.getByRole('button', { name: 'Finish', exact: true })).toBeVisible({ timeout: 30000 })
  await expect(page.locator('.fc-angle')).toContainText('No upper body detected', { timeout: 10000 })
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.getByRole('button', { name: 'Finish', exact: true }).click()
  await context.setOffline(false)
})
