import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bloom-welcome-v1', '{}'))
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test('blossom garden renders and survives losing its WebGL context', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/#focus')
  const garden = page.locator('.focus-room .focus-tree')
  await expect(garden).toHaveAttribute('aria-label', /0% of session grown/)
  await expect(garden).toHaveAttribute('data-rendered', 'true', { timeout: 30000 })
  const canvas = garden.locator('canvas')
  const still = await canvas.screenshot()
  await page.waitForTimeout(200)
  expect(await canvas.screenshot()).toEqual(still)
  await canvas.evaluate(node => {
    const context = (node as HTMLCanvasElement).getContext('webgl2')
    context?.getExtension('WEBGL_lose_context')?.loseContext()
  })
  await expect(garden).toHaveAttribute('data-rendered', 'false')
  await expect(garden.locator('.focus-tree-fallback')).toBeVisible()
  expect(errors).toEqual([])
})

test('SVG garden works when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null
      return Reflect.apply(original, this, [type, ...args])
    } as typeof original
  })
  await page.goto('/#focus')
  const garden = page.locator('.focus-room .focus-tree')
  await expect(garden).toBeVisible()
  await expect(garden.locator('.focus-tree-fallback')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start focus', exact: true })).toBeEnabled()
  await expect(page.locator('.page-crash')).toHaveCount(0)
})

test('tree animates, obeys the motion switch, and tracks session growth', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/#focus')
  const garden = page.locator('.focus-room .focus-tree')
  await expect(garden).toHaveAttribute('data-rendered', 'true', { timeout: 30000 })
  const canvas = garden.locator('canvas')
  const moving = await canvas.screenshot()
  await page.waitForTimeout(400)
  expect(await canvas.screenshot()).not.toEqual(moving)
  await page.evaluate(() => { document.documentElement.dataset.bloomMotion = 'paused' })
  await page.waitForTimeout(100)
  const paused = await canvas.screenshot()
  await page.waitForTimeout(200)
  expect(await canvas.screenshot()).toEqual(paused)
  await page.getByRole('button', { name: '5 min', exact: true }).click()
  await page.getByRole('checkbox', { name: /Pause when I step away/ }).uncheck()
  const now = await page.evaluate(() => Date.now())
  await page.clock.setFixedTime(now)
  await page.getByRole('button', { name: 'Start focus', exact: true }).click()
  await page.clock.setFixedTime(now + 150000)
  await expect(garden).toHaveAttribute('aria-label', /50% of session grown/, { timeout: 10000 })
  expect(await canvas.screenshot()).not.toEqual(paused)
  await garden.screenshot({ path: testInfo.outputPath('blossom-half-grown.png') })
})
