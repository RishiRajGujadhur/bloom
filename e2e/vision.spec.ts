import { test, expect } from '@playwright/test'

test.use({ serviceWorkers: 'block' })

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bloom-welcome-v1', '{}'))
})

test('Bloom Vision is discoverable and practice bubbles respond to touches', async ({ page }) => {
  await page.goto('/#arcade', { waitUntil: 'domcontentloaded' })
  await page.getByRole('searchbox', { name: 'Find a game' }).fill('Bloom Vision')
  await page.locator('.ar-card').filter({ hasText: 'Bloom Vision Game' }).click()
  await expect(page).toHaveURL(/#arcade\/vision$/)
  await page.getByRole('button', { name: 'Practise with mouse or touch' }).click()
  const bubble = page.locator('[data-bubble]').filter({ hasText: 'Rose' }).first()
  await expect(bubble).toBeVisible()
  await expect.poll(async () => {
    const transform = await bubble.getAttribute('transform').catch(() => '')
    return Number(transform?.match(/translate\([^ ]+ ([^)]+)/)?.[1] ?? 600)
  }).toBeLessThan(540)
  await bubble.dispatchEvent('pointermove', { clientX: (await bubble.boundingBox())!.x + (await bubble.boundingBox())!.width / 2, clientY: (await bubble.boundingBox())!.y + (await bubble.boundingBox())!.height / 2 })
  await expect(page.locator('.ar-score')).toHaveText('35')
  await page.getByRole('button', { name: 'Finish round' }).click()
  await expect(page.getByRole('dialog', { name: 'Result' })).toContainText('35 points')
  await expect(page.locator('.ar-record')).toContainText('New best')
  await page.getByRole('button', { name: /Restart/ }).click()
  await expect(page.getByRole('button', { name: 'Enable camera & play' })).toBeVisible()
  await expect(page.locator('.ar-score')).toHaveText('0')
})

test('camera permission failure offers a usable practice mode', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: () => Promise.reject(new DOMException('Denied', 'NotAllowedError')) })
  })
  await page.goto('/#arcade/vision', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Enable camera & play' }).click()
  await expect(page.getByRole('alert')).toContainText('Camera permission was declined')
  await page.getByRole('button', { name: 'Practise with mouse or touch' }).click()
  await expect(page.locator('[data-bubble]').first()).toBeVisible()
})

test('hover pause holds the garden and requires leaving before resume', async ({ page }) => {
  await page.goto('/#arcade/vision', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Practise with mouse or touch' }).click()
  await expect(page.locator('[data-bubble]').first()).toBeVisible()
  const pause = page.getByRole('button', { name: 'Pause game' })
  const box = (await pause.boundingBox())!
  await pause.dispatchEvent('pointermove', { clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 })
  await expect(page.getByRole('button', { name: 'Resume game' })).toBeVisible()
  const bubble = page.locator('[data-bubble]').first()
  const position = await bubble.getAttribute('transform')
  const clock = await page.locator('.bv-toolbar').innerText()
  await page.waitForTimeout(1200)
  await expect(bubble).toHaveAttribute('transform', position!)
  expect(await page.locator('.bv-toolbar').innerText()).toBe(clock)
  const field = (await page.locator('.bv-field').boundingBox())!
  await page.locator('.bv-field').dispatchEvent('pointermove', { clientX: field.x + 5, clientY: field.y + 5 })
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: 'Resume game' }).dispatchEvent('pointermove', { clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 })
  await expect(page.getByRole('button', { name: 'Pause game' })).toBeVisible()
  await expect.poll(() => bubble.getAttribute('transform')).not.toBe(position)
})

test('menu modes, peaceful Zen and the animated result are usable', async ({ page }) => {
  await page.goto('/#arcade/vision', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: /Garden Order Follow/ }).click()
  await expect(page.getByLabel('Garden order')).toContainText('Rose')
  await page.getByRole('button', { name: /Zen Mode No timer/ }).click()
  await page.getByRole('button', { name: 'Practise with mouse or touch' }).click()
  await expect(page.locator('.bv-toolbar')).toContainText('∞ Zen')
  await page.getByRole('button', { name: 'Pause game' }).click()
  await expect(page.getByRole('button', { name: 'Resume game' })).toBeVisible()
  await page.getByRole('button', { name: 'Finish round' }).click()
  await expect(page.getByRole('dialog', { name: 'Result' })).toContainText('Your colour garden bloomed!')
  await expect(page.locator('.bv-petals i')).toHaveCount(18)
  await page.getByRole('button', { name: 'Play again' }).click()
  await expect(page.getByRole('group', { name: 'Game mode' })).toBeVisible()
})

test('both hands feed collisions and the camera keeps tracking a paused resume gesture', async ({ page }) => {
  // Simulate camera frames and model output; actual webcam quality remains a device check.
  await page.route(/(?:node_modules\/\.vite\/deps\/@mediapipe_tasks-vision|assets\/vision_bundle)[^/]*\.js(?:\?.*)?$/, async (route) => {
    await route.fulfill({ contentType: 'text/javascript', body: `
      export const FilesetResolver = { forVisionTasks: async () => ({}) };
      export const HandLandmarker = { createFromOptions: async (_files, options) => {
        window.__configuredHands = options.numHands;
        return { detectForVideo: () => ({ landmarks: window.__visionHands || [] }), close: () => { window.__closed = true; } };
      } };
    ` })
  })
  await page.addInitScript(() => {
    const w = window as typeof window & { __visionHands: { x: number; y: number }[][]; __stopped: boolean }
    w.__visionHands = [Array.from({ length: 21 }, () => ({ x: .25, y: .5 })), Array.from({ length: 21 }, () => ({ x: .75, y: .5 }))]
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: async () => {
      const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480
      const context = canvas.getContext('2d')!
      const timer = window.setInterval(() => context.fillRect(0, 0, 640, 480), 30)
      const stream = canvas.captureStream(30)
      stream.getTracks().forEach((track) => { const stop = track.stop.bind(track); track.stop = () => { w.__stopped = true; clearInterval(timer); stop() } })
      return stream
    } })
  })
  await page.goto('/#arcade/vision', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Enable camera & play' }).click()
  await expect(page.locator('.bv-tracking')).toContainText('2/2 hands detected')
  expect(await page.evaluate(() => (window as typeof window & { __configuredHands: number }).__configuredHands)).toBe(2)
  await expect(page.locator('.bv-field svg > circle')).toHaveCount(12)
  const first = page.locator('[data-bubble]').filter({ hasText: 'Rose' }).first()
  await expect(first).toBeVisible()
  const coordinates = (await first.getAttribute('transform'))!.match(/translate\(([^ ]+) ([^)]+)\)/)!
  await page.evaluate(({ x, y }) => {
    (window as typeof window & { __visionHands: { x: number; y: number }[][] }).__visionHands = [Array.from({ length: 21 }, () => ({ x: .02, y: .05 })), Array.from({ length: 21 }, () => ({ x: 1 - x / 800, y: y / 600 }))]
  }, { x: Number(coordinates[1]), y: Number(coordinates[2]) })
  await expect(page.locator('.ar-score')).toHaveText('35')
  await page.getByRole('button', { name: 'Pause game' }).click()
  await page.evaluate(() => { (window as typeof window & { __visionHands: { x: number; y: number }[][] }).__visionHands = [Array.from({ length: 21 }, () => ({ x: .125, y: .08 }))] })
  await expect(page.locator('.bv-tracking')).toContainText('1/2 hands detected')
  await expect(page.getByRole('button', { name: 'Resume game' })).toBeVisible()
  // Leave the hover latch, then bring the hand back to Resume.
  await page.evaluate(() => { (window as typeof window & { __visionHands: { x: number; y: number }[][] }).__visionHands = [] })
  await page.waitForTimeout(600)
  await page.evaluate(() => { (window as typeof window & { __visionHands: { x: number; y: number }[][] }).__visionHands = [Array.from({ length: 21 }, () => ({ x: .125, y: .08 }))] })
  await expect(page.getByRole('button', { name: 'Pause game' })).toBeVisible()
  await page.getByRole('button', { name: /Menu \/ stop camera/ }).click()
  expect(await page.evaluate(() => (window as typeof window & { __stopped: boolean }).__stopped)).toBe(true)
  expect(await page.evaluate(() => (window as typeof window & { __closed: boolean }).__closed)).toBe(true)
})
