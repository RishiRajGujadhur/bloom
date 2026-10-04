import { test, expect } from '@playwright/test'
import { upperPose } from '../src/features/workout/formModel'

test.use({ serviceWorkers: 'block' })
test.setTimeout(60000)
test.beforeEach(async ({ page }) => { await page.addInitScript(() => { localStorage.setItem('bloom-welcome-v1', '{}'); localStorage.setItem('bloom-coach-accessible', 'true'); localStorage.setItem('bloom-coach-view', 'advanced') }) })

test('accessible library, visual metrics, demo and guided fullscreen are usable', async ({ page }) => {
  await page.goto('/#workouts/coach', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('switch', { name: 'Accessible Mode' })).toBeChecked()
  await page.getByRole('button', { name: 'Exercise library', exact: true }).click()
  await expect(page.getByRole('radiogroup', { name: 'Seated Basic' })).toContainText('Chair Push-up')
  await expect(page.getByRole('radiogroup', { name: 'Martial Arts' })).toContainText('Boxing')
  await expect(page.locator('.fc-instructions')).toHaveText('Face camera. Calibrated for upper-body forms.')
  await page.getByRole('button', { name: 'Watch the demo athlete' }).click()
  await expect(page.locator('.fc-calibration')).toContainText('Neutral position calibrated', { timeout: 10000 })
  await expect.poll(async () => Number(await page.locator('.fc-count').textContent()), { timeout: 15000 }).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Fullscreen workout' }).click()
  await expect(page.locator('.fc-split')).toHaveClass(/fc-workout-focused/)
  await expect(page.getByRole('button', { name: 'Exit fullscreen' })).toBeVisible()
  await page.getByRole('button', { name: 'Exit fullscreen' }).click()
  await expect(page.locator('.fc-split')).not.toHaveClass(/fc-workout-focused/)
  await page.getByRole('button', { name: 'Finish', exact: true }).click()
  await expect(page.locator('.fc-message')).toContainText('Demo movements are not saved')
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('bloom-workouts-v1') ?? '{"workouts":[]}'))
  expect(saved.workouts).toHaveLength(0)
})

test('camera denial recovers with clear feedback and a working demo', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: () => Promise.reject(new DOMException('Denied', 'NotAllowedError')) }))
  await page.goto('/#workouts/coach', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Start camera' }).click()
  await expect(page.getByRole('alert')).toContainText('Camera permission was declined')
  await page.getByRole('button', { name: 'Watch the demo athlete' }).click()
  await expect(page.getByRole('button', { name: 'Finish', exact: true })).toBeVisible()
})

test('either-hand hovering changes exercises, logs one set, and finishes from fullscreen', async ({ page }) => {
  await page.route(/(?:node_modules\/\.vite\/deps\/@mediapipe_tasks-vision|assets\/vision_bundle)[^/]*\.js(?:\?.*)?$/, async (route) => route.fulfill({ contentType: 'text/javascript', body: `
    export const FilesetResolver = { forVisionTasks: async () => ({}) };
    export const PoseLandmarker = { createFromOptions: async () => ({ detectForVideo: () => ({ landmarks: window.__coachPose ? [window.__coachPose] : [] }), close: () => { window.__coachClosed = true; } }) };
  ` }))
  await page.addInitScript((pose) => {
    const w = window as typeof window & { __coachPose: typeof pose; __coachStopped: boolean }
    w.__coachPose = pose
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: async () => {
      const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480
      const context = canvas.getContext('2d')!
      const timer = window.setInterval(() => context.fillRect(0, 0, 640, 480), 30)
      const stream = canvas.captureStream(30)
      stream.getTracks().forEach((track) => { const stop = track.stop.bind(track); track.stop = () => { w.__coachStopped = true; clearInterval(timer); stop() } })
      return stream
    } })
  }, upperPose('seatedTwist', 0))
  await page.goto('/#workouts/coach', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Start camera' }).click()
  await expect(page.locator('.fc-calibration')).toContainText('Neutral position calibrated', { timeout: 10000 })
  const send = (pose: ReturnType<typeof upperPose>) => page.evaluate((value) => { (window as typeof window & { __coachPose: typeof value }).__coachPose = value }, pose)
  await send(upperPose('seatedTwist', .5)); await page.waitForTimeout(900)
  await send(upperPose('seatedTwist', 0))
  await expect(page.locator('.fc-count')).toHaveText('1')
  await send([])
  await expect(page.locator('.fc-beat')).not.toHaveClass(/running/)
  await send(upperPose('seatedTwist', 0))
  await expect(page.locator('.fc-beat')).toHaveClass(/running/)
  const hover = async (id: string, wrist: 15 | 16) => {
    await page.locator(`[data-gesture="${id}"]`).scrollIntoViewIfNeeded()
    const box = (await page.locator(`[data-gesture="${id}"]`).boundingBox())!
    const feed = (await page.locator('.fc-canvas').boundingBox())!
    const pose = upperPose('seatedTwist', 0)
    pose[wrist] = { x: 1 - (box.x + box.width / 2 - feed.x) / feed.width, y: (box.y + box.height / 2 - feed.y) / feed.height, visibility: 1, z: 0 }
    pose[wrist + 4] = { ...pose[wrist] }; pose[wrist + 6] = { ...pose[wrist] }
    await send(pose)
  }
  await hover('log', 15)
  await expect(page.locator('.fc-message')).toContainText('1 reps logged', { timeout: 9000 })
  await page.waitForTimeout(3200)
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('bloom-workouts-v1')!))
  expect(stored.workouts[0].sets).toHaveLength(1)
  expect(stored.workouts[0].sets[0].liftId).toBe('seatedtwist')
  await send(upperPose('seatedTwist', 0)); await page.waitForTimeout(1000)
  await hover('next', 16)
  await expect(page.getByRole('radio', { name: 'Wheelchair Dips', exact: true })).toBeChecked({ timeout: 9000 })
  await send(upperPose('wheelchairDip', 0)); await page.waitForTimeout(1000)
  await page.getByRole('button', { name: 'Fullscreen workout' }).click()
  await hover('finish', 16)
  await expect(page.getByRole('button', { name: 'Start camera' })).toBeVisible({ timeout: 9000 })
  const finished = await page.evaluate(() => JSON.parse(localStorage.getItem('bloom-workouts-v1')!))
  expect(finished.workouts[0].finishedAt).toBeGreaterThan(0)
  expect(await page.evaluate(() => (window as typeof window & { __coachStopped: boolean }).__coachStopped)).toBe(true)
  expect(await page.evaluate(() => (window as typeof window & { __coachClosed: boolean }).__coachClosed)).toBe(true)
})


test('personal calibration and visual preferences survive reload without saving demo workouts', async ({ page }, testInfo) => {
  await page.goto('/#workouts/coach', { waitUntil: 'domcontentloaded' })
  await page.getByRole('checkbox', { name: 'Master reference view', exact: true }).uncheck()
  await page.getByRole('checkbox', { name: 'Battery saver', exact: true }).check()
  await page.getByRole('button', { name: 'Watch the demo athlete' }).click()
  await expect(page.locator('.fc-calibration')).toContainText('Neutral position calibrated', { timeout: 15000 })
  await page.getByRole('button', { name: 'Calibrate movement range' }).click()
  await expect(page.locator('.fc-range-calibration')).toContainText('Personal range saved', { timeout: 18000 })
  await page.getByRole('button', { name: 'Finish', exact: true }).click()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('checkbox', { name: 'Master reference view', exact: true })).not.toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'Battery saver', exact: true })).toBeChecked()
  const range = await page.evaluate(() => JSON.parse(localStorage.getItem('bloom-coach-ranges-v1') ?? '{}').seatedTwist)
  expect(range.down).toBeLessThan(range.up); expect(range.low).toBeLessThan(range.high)
  const history = await page.evaluate(() => JSON.parse(localStorage.getItem('bloom-coach-history-v1') ?? '[]'))
  expect(history).toHaveLength(0)
  await page.getByRole('checkbox', { name: 'Master reference view', exact: true }).check()
  await page.getByRole('button', { name: 'Start camera' }).scrollIntoViewIfNeeded()
  const cameraButton = await page.getByRole('button', { name: 'Start camera' }).boundingBox()
  expect(cameraButton!.x + cameraButton!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  await page.screenshot({ path: `docs/screenshots/form-coach-expanded-${testInfo.project.name}.png` })
})


test('Basic defaults to essentials and fullscreen keeps the reference, count and left controls', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('bloom-coach-view'))
  await page.goto('/#workouts/coach', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('button', { name: 'Basic', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('combobox', { name: 'Selected workout' })).toBeVisible()
  await expect(page.getByRole('radiogroup', { name: 'Pose check' })).toBeHidden()
  await expect(page.getByRole('checkbox', { name: 'Energy estimates', exact: true })).toBeHidden()
  await expect(page.getByRole('combobox', { name: 'Seated camera arcade' })).toBeHidden()
  await page.getByRole('button', { name: 'Watch the demo athlete' }).click()
  await page.getByRole('button', { name: 'Fullscreen workout' }).click()
  const reference = page.locator('.fc-split .fc-reference'), hud = page.locator('.fc-workout-hud')
  await expect(reference).toBeVisible(); await expect(hud).toContainText('/ 10 reps')
  await expect(hud.getByRole('progressbar')).toBeVisible()
  const cameraBox = (await page.locator('.fc-view').boundingBox())!, referenceBox = (await reference.boundingBox())!
  expect(referenceBox.x).toBeGreaterThan(cameraBox.x + cameraBox.width - 2)
  const controls = (await page.getByRole('button', { name: 'Log set', exact: true }).boundingBox())!
  expect(controls.x).toBeLessThan(cameraBox.x + cameraBox.width / 2)
  await page.getByRole('button', { name: 'Exit fullscreen' }).click()
  await page.getByRole('button', { name: 'Game', exact: true }).click()
  await expect(page.getByRole('combobox', { name: 'Seated camera arcade' })).toBeVisible()
})
