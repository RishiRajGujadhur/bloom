import { test, expect } from '@playwright/test'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(resolve('package.json'))

test.setTimeout(60000)

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bloom-welcome-v1', '{}'))
})

test('Growth loads and Bloom uses compact scalable message text', async ({ page }) => {
  await page.goto('/#growth', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Growth', exact: true })).toBeVisible()
  await expect(page.locator('.rpg-zone')).toBeVisible({ timeout: 20000 })
  await expect(page.locator('.page-crash')).toHaveCount(0)
  await page.getByRole('button', { name: 'Talk to Bloom', exact: true }).click()
  const panel = page.getByRole('region', { name: 'Talk to Bloom', exact: true })
  const message = panel.locator('.cs-message__content').first()
  const size = await message.evaluate(element => parseFloat(getComputedStyle(element).fontSize))
  expect(size).toBeLessThanOrEqual(14)
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  expect(await message.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThan(size)
  await page.evaluate(() => { document.documentElement.style.fontSize = '' })
  await expect(panel.getByRole('group', { name: 'Choices', exact: true }).getByRole('button')).toHaveCount(3)
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') })
  const violations = await page.evaluate(async () => {
    const axe = (window as Window & { axe: typeof import('axe-core') }).axe
    const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })
    return result.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) }))
  })
  expect(violations).toEqual([])
})

test('chessboard supports arrow navigation and keyboard selection', async ({ page }) => {
  await page.goto('/#chess', { waitUntil: 'domcontentloaded' })
  const board = page.getByRole('grid', { name: 'Chessboard', exact: true })
  await expect(board).toBeVisible()
  await expect(board.getByRole('row')).toHaveCount(8)
  const start = board.locator('[data-square="a1"]')
  await start.focus()
  await start.press('ArrowRight')
  await expect(board.locator('[data-square="b1"]')).toBeFocused()
  const pieceSquare = await board.locator('[data-piece]').first().getAttribute('data-piece')
  const piece = board.locator(`[data-square="${pieceSquare}"]`)
  await piece.focus()
  await piece.press('Enter')
  await expect(piece.locator('.cb-sq')).toHaveClass(/sel/)
})

test('Settings controls every feature mode and pages keep their choices', async ({ page }) => {
  await page.goto('/#code', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('group', { name: 'Page mode', exact: true })).toHaveCount(0)
  await expect(page.locator('.studio-tabs').getByRole('tab')).toHaveCount(0)
  await page.goto('/#settings', { waitUntil: 'domcontentloaded' })
  const preferences = page.locator('.feature-mode-settings')
  const feature = preferences.getByRole('combobox', { name: 'Feature', exact: true })
  await expect(feature.locator('option')).toHaveCount(83)
  await feature.selectOption('code')
  await preferences.getByRole('button', { name: 'Advanced', exact: true }).click()
  await feature.selectOption('habits')
  await expect(preferences.getByRole('button', { name: 'Basic', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.goto('/#code', { waitUntil: 'domcontentloaded' })
  await expect.poll(() => page.locator('.studio-tabs').getByRole('tab').count()).toBeGreaterThan(1)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect.poll(() => page.locator('.studio-tabs').getByRole('tab').count()).toBeGreaterThan(1)
  await page.goto('/#habits', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.habit-calendar')).toHaveCount(0)
  await page.goto('/#todos', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('group', { name: 'Page mode', exact: true })).toHaveCount(0)
})
