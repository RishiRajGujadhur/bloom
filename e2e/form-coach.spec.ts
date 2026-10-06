import { test, expect } from '@playwright/test'
import { upperPose } from '../src/features/workout/formModel'

test.use({ serviceWorkers: 'block' })
test.setTimeout(60000)
test.beforeEach(async ({ page }) => { await page.addInitScript(() => { localStorage.setItem('bloom-welcome-v1', '{}'); localStorage.setItem('bloom-coach-accessible', 'true'); localStorage.setItem('bloom-coach-view', 'advanced') }) })

test('accessible library, visual metrics, demo and guided fullscreen are usable', async ({ page }) => {
  await page.goto('/#workouts/coach', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('switch', { name: 'Accessible Mode' })).toBeChecked()
  await page.getByText('Workout options', { exact: true }).click()
  await page.getByRole('button', { name: 'Exercise library', exact: true }).click()
  await expect(page.getByRole('radiogroup', { name: 'Seated Basic' })).toContainText('Chair Push-up')
  await expect(page.getByRole('radiogroup', { name: 'Martial Arts' })).toContainText('Boxing')
  await expect(page.locator('.fc-instructions')).toHaveText('Face camera. Calibrated for upper-body forms.')
  await page.getByRole('button', { name: 'Watch the demo athlete' }).click()
  await expect(page.locator('.fc-calibration')).toContainText('Neutral position calibrated', { timeout: 10000 })
  await expect.poll(async () => Number(await page.locator('.fc-count').textContent()), { timeout: 15000 }).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Fullscreen workout' }).click()
  await expect(page.locator('.fc-split')).toHaveClass(/fc-workout-focused/)
  await page.getByRole('button', { name: 'More controls', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Exit fullscreen' })).toBeVisible()
  if (await page.getByRole('button', { name: 'More controls', exact: true }).isEnabled()) await page.getByRole('button', { name: 'More controls', exact: true }).click()
  await page.getByRole('button', { name: 'Exit fullscreen' }).click()
  await expect(page.locator('.fc-split')).not.toHaveClass(/fc-workout-focused/)
  if (await page.getByRole('button', { name: 'Previous controls', exact: true }).isEnabled()) await page.getByRole('button', { name: 'Previous controls', exact: true }).click()
  await page.getByRole('button', { name: 'Finish', exact: true }).click()
  await page.getByRole('button', { name: 'Finish and save', exact: true }).click()
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
  test.setTimeout(120000)
  await page.route(/(?:node_modules\/\.vite\/deps\/@mediapipe_tasks-vision|assets\/vision_bundle)[^/]*\.js(?:\?.*)?$/, async (route) => route.fulfill({ contentType: 'text/javascript', body: `
    export const FilesetResolver = { forVisionTasks: async () => ({}) };
    export const PoseLandmarker = { createFromOptions: async () => ({ detectForVideo: () => ({ landmarks: window.__coachPose ? [window.__coachPose] : [], segmentationMasks: [{ width: 2, height: 2, getAsFloat32Array: () => new Float32Array([0, 1, 0, 1]), close: () => {} }] }), close: () => { window.__coachClosed = true; } }) };
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
  await page.getByRole('button', { name: 'Skip countdown', exact: true }).click()
  const send = (pose: ReturnType<typeof upperPose>) => page.evaluate((value) => { (window as typeof window & { __coachPose: typeof value }).__coachPose = value }, pose)
  if (!(await page.locator('.fc-quick-options').getAttribute('open') !== null)) await page.getByText('Workout options', { exact: true }).click()
  await page.getByRole('combobox', { name: 'Camera background' }).selectOption('black')
  await expect.poll(() => page.locator('.fc-background-mask').evaluate((node: HTMLCanvasElement) => node.getContext('2d')!.getImageData(0, 0, 1, 1).data[3])).toBe(255)
  await page.getByRole('combobox', { name: 'Camera background' }).selectOption('dim')
  await expect.poll(() => page.locator('.fc-background-mask').evaluate((node: HTMLCanvasElement) => node.getContext('2d')!.getImageData(0, 0, 1, 1).data[3])).toBe(190)
  const offBalance = upperPose('seatedTwist', 0); offBalance[12].y += .16; await send(offBalance)
  await expect.poll(() => page.locator('.fc-canvas').evaluate((node: HTMLCanvasElement) => { const data = node.getContext('2d')!.getImageData(0, 0, node.width, node.height).data; let red = 0; for (let i = 0; i < data.length; i += 4) if (data[i] > 200 && data[i + 1] < 120 && data[i + 2] < 120 && data[i + 3]) red++; return red })).toBeGreaterThan(30)
  await send(upperPose('seatedTwist', 0)); await page.waitForTimeout(600)
  await send(upperPose('seatedTwist', .5))
  await expect.poll(async () => parseInt((await page.locator('.fc-side-status').first().textContent()) ?? ''), { timeout: 10000 }).toBeGreaterThan(40)
  await send(upperPose('seatedTwist', 0))
  await expect(page.locator('.fc-count')).toHaveText('1')
  await send([])
  await expect(page.locator('.fc-beat')).not.toHaveClass(/running/)
  await expect(page.locator('.fc-camera-readiness')).toContainText('confidence 0%')
  await send(upperPose('seatedTwist', 0))
  await expect(page.locator('.fc-beat')).toHaveClass(/running/)
  const outside = upperPose('seatedTwist', 0); outside[15].x = 1.1; await send(outside)
  await expect(page.locator('.fc-camera-readiness')).toContainText('farther back')
  await send(upperPose('seatedTwist', 0))
  await expect(page.locator('.fc-camera-readiness')).toContainText('joints visible')
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
  await page.getByRole('button', { name: 'Previous workout detail', exact: true }).click()
  await expect(page.locator('.fc-set-recap')).toContainText('Last saved set · 1 reps')
  await page.waitForTimeout(3200)
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('bloom-workouts-v1')!))
  expect(stored.workouts[0].sets).toHaveLength(1)
  expect(stored.workouts[0].sets[0].liftId).toBe('seatedtwist')
  await send(upperPose('seatedTwist', 0)); await page.waitForTimeout(1000)
  await page.getByRole('button', { name: 'More controls', exact: true }).click()
  await send(upperPose('seatedTwist', 0)); await page.waitForTimeout(1000)
  await hover('next', 16)
  await expect(page.getByRole('combobox', { name: 'Selected workout', exact: true })).toHaveValue('wheelchairDip', { timeout: 9000 })
  await send(upperPose('wheelchairDip', 0)); await page.waitForTimeout(1000)
  await page.getByRole('button', { name: 'Fullscreen workout' }).click()
  await expect.poll(async () => {
    const feed = (await page.locator('.fc-view').boundingBox())!, guide = (await page.locator('.fc-reference').boundingBox())!
    return guide.x - feed.x - feed.width
  }).toBeGreaterThan(-2)
  await hover('finish', 16)
  await expect(page.getByRole('button', { name: 'Finish and save', exact: true })).toBeVisible({ timeout: 9000 })
  await page.waitForTimeout(3200)
  await expect(page.getByRole('button', { name: 'Start camera' })).toBeHidden()
  await send(upperPose('wheelchairDip', 0)); await page.waitForTimeout(1000)
  await hover('confirmFinish', 16)
  await expect(page.getByRole('button', { name: 'Start camera' })).toBeVisible({ timeout: 9000 })
  const finished = await page.evaluate(() => JSON.parse(localStorage.getItem('bloom-workouts-v1')!))
  expect(finished.workouts[0].finishedAt).toBeGreaterThan(0)
  expect(await page.evaluate(() => (window as typeof window & { __coachStopped: boolean }).__coachStopped)).toBe(true)
  expect(await page.evaluate(() => (window as typeof window & { __coachClosed: boolean }).__coachClosed)).toBe(true)
})


test('personal calibration and visual preferences survive reload without saving demo workouts', async ({ page }, testInfo) => {
  await page.goto('/#workouts/coach', { waitUntil: 'domcontentloaded' })
  await page.getByText('Coach settings', { exact: true }).click()
  await page.getByRole('checkbox', { name: 'Master reference view', exact: true }).uncheck()
  await page.getByRole('checkbox', { name: 'Battery saver', exact: true }).check()
  await page.getByRole('button', { name: 'Watch the demo athlete' }).click()
  await expect(page.locator('.fc-calibration')).toContainText('Neutral position calibrated', { timeout: 15000 })
  await page.getByText('Camera setup & personal calibration', { exact: true }).click()
  await page.getByRole('button', { name: 'Calibrate movement range' }).click()
  await expect(page.locator('.fc-range-calibration')).toContainText('Personal range saved', { timeout: 18000 })
  if (await page.getByRole('button', { name: 'Previous controls', exact: true }).isEnabled()) await page.getByRole('button', { name: 'Previous controls', exact: true }).click()
  await page.getByRole('button', { name: 'Finish', exact: true }).click()
  await page.getByRole('button', { name: 'Finish and save', exact: true }).click()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByText('Coach settings', { exact: true }).click()
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
  await expect(page.getByRole('group', { name: 'Page mode', exact: true })).toHaveCount(0)
  await expect(page.getByRole('combobox', { name: 'Selected workout' })).toBeVisible()
  await expect(page.getByRole('radiogroup', { name: 'Pose check' })).toBeHidden()
  await expect(page.getByRole('checkbox', { name: 'Energy estimates', exact: true })).toBeHidden()
  await expect(page.getByRole('combobox', { name: 'Seated camera arcade' })).toBeHidden()
  await page.getByRole('button', { name: 'Watch the demo athlete' }).click()
  await page.getByRole('button', { name: 'Fullscreen workout' }).click()
  const reference = page.locator('.fc-split .fc-reference'), hud = page.locator('.fc-workout-hud')
  await expect(reference).toBeVisible(); await expect(hud).toContainText('/ 10 reps')
  await expect(hud.getByRole('progressbar')).toBeVisible()
  await expect.poll(async () => {
    const camera = (await page.locator('.fc-view').boundingBox())!, guide = (await reference.boundingBox())!
    return guide.x - camera.x - camera.width
  }).toBeGreaterThan(-2)
  const cameraBox = (await page.locator('.fc-view').boundingBox())!
  await page.screenshot({ path: 'docs/screenshots/form-coach-reachable-fullscreen.png' })
  const controls = (await page.getByRole('button', { name: 'Log set', exact: true }).boundingBox())!
  expect(controls.x).toBeLessThan(cameraBox.x + cameraBox.width / 2)
  if (await page.getByRole('button', { name: 'More controls', exact: true }).isEnabled()) await page.getByRole('button', { name: 'More controls', exact: true }).click()
  await page.getByRole('button', { name: 'Exit fullscreen' }).click()
  await page.getByRole('button', { name: 'Game', exact: true }).click()
  await expect(page.getByRole('combobox', { name: 'Seated camera arcade' })).toBeVisible()
})


test('Basic keeps optional markers quiet, counts air punches and shows countdown and encouragement', async ({ page }) => {
  await page.addInitScript(() => { localStorage.removeItem('bloom-coach-view'); if (!localStorage.getItem('bloom-coach-settings-v1')) localStorage.setItem('bloom-coach-settings-v1', JSON.stringify({ reaction: true, ghost: true })) })
  await page.goto('/#workouts/coach', { waitUntil: 'domcontentloaded' })
  await page.getByText('Workout options', { exact: true }).click()
  await page.getByRole('button', { name: 'Air boxing', exact: true }).click()
  await expect(page.getByRole('combobox', { name: 'Selected workout' })).toHaveValue('boxing')
  await page.getByRole('button', { name: 'Watch the demo athlete', exact: true }).click()
  await expect(page.getByRole('status', { name: 'Workout start countdown' })).toContainText('3', { timeout: 10000 })
  await expect(page.locator('.fc-workout-hud')).toContainText('0 / 10 air punches')
  await expect(page.locator('.fc-reaction')).toHaveCount(0)
  await page.getByRole('button', { name: 'Skip countdown', exact: true }).click()
  await expect.poll(async () => Number((await page.locator('.fc-workout-hud b').textContent())!.split('/')[0]), { timeout: 15000 }).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Fullscreen workout', exact: true }).click()
  await expect(page.locator('.fc-encouragement')).toBeVisible()
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  const count = await page.locator('.fc-workout-hud b').textContent()
  await page.waitForTimeout(600)
  await expect(page.locator('.fc-workout-hud b')).toHaveText(count!)
  await page.getByRole('button', { name: 'Resume', exact: true }).click()
  if (await page.getByRole('button', { name: 'More controls', exact: true }).isEnabled()) await page.getByRole('button', { name: 'More controls', exact: true }).click()
  await page.getByRole('button', { name: 'Exit fullscreen', exact: true }).click()
  if (!(await page.locator('.fc-quick-options').getAttribute('open') !== null)) await page.getByText('Workout options', { exact: true }).click()
  await page.getByRole('combobox', { name: 'Camera background' }).selectOption('black')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByText('Workout options', { exact: true }).click()
  await expect(page.getByRole('combobox', { name: 'Camera background' })).toHaveValue('black')
  await page.getByRole('combobox', { name: 'Camera background' }).selectOption('dim')
  await expect(page.getByRole('combobox', { name: 'Camera background' })).toHaveValue('dim')
})

test('Game sword and ropes retain the matching reference next to the camera', async ({ page }) => {
  await page.goto('/#workouts/coach', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Game', exact: true }).click()
  await page.getByRole('combobox', { name: 'Seated camera arcade' }).selectOption('sword')
  await expect(page.locator('.fc-reference')).toContainText('Empty-hand seated sword')
  await expect(page.locator('.fc-split')).not.toHaveClass(/fc-no-reference/)
  await page.getByRole('button', { name: 'Watch the demo athlete', exact: true }).click()
  await page.getByRole('button', { name: 'Fullscreen workout', exact: true }).click()
  await expect.poll(async () => { const feed = (await page.locator('.fc-view').boundingBox())!, guide = (await page.locator('.fc-reference').boundingBox())!; return guide.x - feed.x - feed.width }).toBeGreaterThan(-2)
  if (await page.getByRole('button', { name: 'More controls', exact: true }).isEnabled()) await page.getByRole('button', { name: 'More controls', exact: true }).click()
  await page.getByRole('button', { name: 'Exit fullscreen', exact: true }).click()
  await page.getByText('Seated arcade · Empty-hand seated sword', { exact: true }).click()
  await page.getByRole('combobox', { name: 'Seated camera arcade' }).selectOption('doubleRopes')
  await expect(page.locator('.fc-reference')).toContainText('Shadow ropes · double slams')
})


test('standing workouts also show the full start countdown', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('bloom-coach-accessible', 'false'); localStorage.removeItem('bloom-coach-view') })
  await page.goto('/#workouts/coach', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Watch the demo athlete', exact: true }).click()
  await expect(page.getByRole('status', { name: 'Workout start countdown' })).toContainText('3')
  await expect(page.getByRole('status', { name: 'Workout start countdown' })).toContainText('2')
  await expect(page.getByRole('status', { name: 'Workout start countdown' })).toContainText('1')
  await expect(page.getByRole('status', { name: 'Workout start countdown' })).toBeHidden()
})


test('camera action pages are spacious and progress stays beneath the reference', async ({ page }) => {
  await page.goto('/#workouts/coach', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Watch the demo athlete', exact: true }).click()
  await expect(page.locator('.fc-control-actions button')).toHaveCount(3)
  await expect(page.getByRole('combobox', { name: 'Reference style', exact: true })).toHaveValue('person')
  await page.getByRole('combobox', { name: 'Reference view angle', exact: true }).selectOption('side')
  await page.getByRole('checkbox', { name: 'Slow reference movement', exact: true }).check()
  const feed = (await page.locator('.fc-view').boundingBox())!, hud = (await page.locator('.fc-workout-hud').boundingBox())!, guide = (await page.locator('.fc-reference').boundingBox())!
  expect(hud.x).toBeGreaterThanOrEqual(feed.x + feed.width - 2)
  expect(hud.y).toBeGreaterThanOrEqual(guide.y + guide.height - 2)
  const buttons = await page.locator('.fc-control-actions button').all()
  const boxes = await Promise.all(buttons.map(button => button.boundingBox()))
  for (const box of boxes) { expect(box!.height).toBeGreaterThanOrEqual(48); expect(box!.y + box!.height / 2).toBeGreaterThan(feed.y + feed.height / 2) }
  for (let i=1; i<boxes.length; i++) { const a=boxes[i-1]!, b=boxes[i]!; expect(Math.max(b.x-a.x-a.width, b.y-a.y-a.height)).toBeGreaterThanOrEqual(18) }
  await page.getByRole('button', { name: 'More controls', exact: true }).click()
  await expect(page.locator('.fc-control-actions button')).toHaveCount(3)
  await expect(page.getByRole('button', { name: 'Next workout', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Previous controls', exact: true }).click()
  await page.getByRole('button', { name: 'Finish', exact: true }).click()
  await expect(page.locator('.fc-control-actions button')).toHaveCount(2)
  await expect(page.locator('.fc-workout-hud')).toContainText('paused')
  await page.getByRole('button', { name: 'Keep training', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
  await page.getByText('Coach settings', { exact: true }).click()
  await page.getByRole('combobox', { name: 'Reach side', exact: true }).selectOption('right')
  await page.getByRole('combobox', { name: 'Hand hold time', exact: true }).selectOption('5')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByText('Coach settings', { exact: true }).click()
  await expect(page.getByRole('combobox', { name: 'Reach side', exact: true })).toHaveValue('right')
  await expect(page.getByRole('combobox', { name: 'Hand hold time', exact: true })).toHaveValue('5')
})


test('narrow fullscreen pages show one spacious action with reachable arrows', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => localStorage.removeItem('bloom-coach-view'))
  await page.goto('/#workouts/coach', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Watch the demo athlete', exact: true }).click()
  await page.getByRole('button', { name: 'Fullscreen workout', exact: true }).click()
  await expect(page.locator('.fc-control-actions button')).toHaveCount(1)
  const camera = (await page.locator('.fc-view').boundingBox())!, action = (await page.locator('.fc-control-actions button').boundingBox())!
  await page.screenshot({ path: 'docs/screenshots/form-coach-reachable-mobile.png' })
  expect(action.width).toBeGreaterThan(100)
  expect(action.x).toBeGreaterThanOrEqual(camera.x)
  expect(action.x + action.width).toBeLessThanOrEqual(camera.x + camera.width + 1)
  await page.getByRole('button', { name: 'More controls', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Log set', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Previous controls', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
  await expect(page.locator('.fc-guide-column .fc-workout-hud')).toBeVisible()
  await expect(page.locator('.fc-guide-column .fc-reference')).toBeVisible()
})


test('new seated movements are searchable, guided and camera-demo counted with tempo', async ({ page }) => {
  test.setTimeout(100000)
  await page.addInitScript(() => localStorage.removeItem('bloom-coach-view'))
  await page.goto('/#workouts/coach', { waitUntil: 'domcontentloaded' })
  await page.getByText('Workout options', { exact: true }).click()
  await page.getByRole('button', { name: 'Exercise library', exact: true }).click()
  await page.getByRole('searchbox', { name: 'Find a movement', exact: true }).fill('lateral')
  await expect(page.getByRole('radio', { name: 'Seated Lateral Raise', exact: true })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'Seated Bicep Curl', exact: true })).toHaveCount(0)
  await page.getByRole('searchbox', { name: 'Find a movement', exact: true }).fill('unknown-zebra')
  await expect(page.getByRole('status', { name: '' }).filter({ hasText: 'No movements match' })).toBeVisible()
  await page.getByRole('searchbox', { name: 'Find a movement', exact: true }).fill('curl')
  await page.getByRole('radio', { name: 'Seated Bicep Curl', exact: true }).click()
  await page.getByRole('combobox', { name: 'Movement tempo', exact: true }).selectOption('1:3')
  await page.getByRole('button', { name: 'Next workout detail', exact: true }).click()
  await expect(page.locator('.fc-movement-guide')).toContainText('elbows')
  await page.getByRole('button', { name: 'Watch the demo athlete', exact: true }).click()
  await expect.poll(async () => Number((await page.locator('.fc-workout-hud b').textContent())!.split('/')[0]), { timeout: 25000 }).toBeGreaterThan(0)
  await expect(page.locator('.fc-tempo-cue')).toContainText('Tempo estimate', { timeout: 12000 })
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  const count = await page.locator('.fc-workout-hud b').textContent()
  await page.waitForTimeout(700)
  await expect(page.locator('.fc-workout-hud b')).toHaveText(count!)
  await page.getByRole('button', { name: 'Resume', exact: true }).click()
  await page.getByRole('button', { name: 'Fullscreen workout', exact: true }).click()
  await expect(page.locator('.fc-split')).toHaveClass(/fc-workout-focused/)
  await page.screenshot({ path: 'docs/screenshots/form-coach-motion-practice.png' })
  await page.getByRole('button', { name: 'More controls', exact: true }).click()
  await page.getByRole('button', { name: 'Exit fullscreen', exact: true }).click()
  await page.getByRole('combobox', { name: 'Selected workout', exact: true }).selectOption('lateralRaise')
  await expect.poll(async () => Number((await page.locator('.fc-workout-hud b').textContent())!.split('/')[0]), { timeout: 25000 }).toBeGreaterThan(0)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByText('Workout options', { exact: true }).click()
  await expect(page.getByRole('combobox', { name: 'Movement tempo', exact: true })).toHaveValue('1:3')
})

test('saved set recap shows same-exercise progress and keeps details folded', async ({ page }) => {
  await page.addInitScript(() => {
    const base = {seconds:40,joules:2,kcal:1,power:1,peak:1,leftWork:1,rightWork:1,leftAngle:90,rightAngle:90,range:null,compensation:0,exercise:'bicepCurl'}
    localStorage.setItem('bloom-coach-history-v1',JSON.stringify([{...base,id:'a',at:Date.now()-1000,reps:8,score:85},{...base,id:'b',at:Date.now(),reps:10,score:95}]))
    localStorage.removeItem('bloom-coach-view')
  })
  await page.goto('/#workouts/coach', { waitUntil: 'domcontentloaded' })
  await page.getByRole('combobox', { name: 'Selected workout', exact: true }).selectOption('bicepCurl')
  await expect(page.locator('.fc-set-recap')).toHaveCount(0)
  await page.getByRole('button', { name: 'Previous workout detail', exact: true }).click()
  await expect(page.locator('.fc-set-recap')).toContainText('+10 points')
  await expect(page.locator('.fc-set-recap')).toContainText('Today: 2 sets · 18 reps')
  await expect(page.locator('.fc-movement-guide')).toHaveCount(0)
})


test('Auto is selectable and never identifies the prerecorded demo as a real workout', async ({ page }) => {
  await page.goto('/#workouts/coach')
  await page.getByLabel('Selected workout').selectOption('auto')
  await expect(page.locator('.fc-auto-help')).toContainText('first movement is not counted')
  await page.getByRole('button', { name: 'Watch the demo athlete', exact: true }).click()
  await expect(page.locator('.fc-side-status')).toContainText('Auto needs a live camera', { timeout: 20000 })
  await expect(page.locator('.fc-workout-hud')).toContainText('Auto · identifying movement')
  await expect(page.locator('.fc-workout-hud b')).toContainText('0 /')
  await expect(page.locator('.fc-movement-guide')).toHaveCount(0)
  await page.getByRole('button', { name: 'Next workout detail', exact: true }).click()
  await expect(page.locator('.fc-movement-guide')).toBeVisible()
  await page.getByRole('button', { name: 'Previous workout detail', exact: true }).click()
  await expect(page.locator('.fc-movement-guide')).toHaveCount(0)
})


for (const viewport of [{width:1440,height:900},{width:390,height:844}]) {
  test(`fullscreen keeps the reference and smaller counter visible at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/#workouts/coach')
    await page.evaluate(() => { localStorage.setItem('bloom-page-mode:workouts', 'basic'); window.dispatchEvent(new Event('bloom-page-mode-change')) })
    await page.getByRole('button', { name: 'Watch the demo athlete', exact: true }).click()
    await page.getByRole('button', { name: 'Fullscreen workout', exact: true }).click()
    for (let i=0;i<3;i++) {
      for (const selector of ['.fc-reference canvas','.fc-workout-hud','.fc-info-slider']) {
        const box=await page.locator(selector).boundingBox()
        expect(box).not.toBeNull()
        expect(box!.y).toBeGreaterThanOrEqual(0)
        expect(box!.y+box!.height).toBeLessThanOrEqual(viewport.height)
      }
      await page.getByRole('button', { name: 'Next workout detail', exact: true }).click()
    }
  })
}
