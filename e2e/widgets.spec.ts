import { test, expect } from '@playwright/test'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(resolve('package.json'))
test.setTimeout(90000)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bloom-welcome-v1', '{}'))
})

test('Todo resizes to mobile width, preserves a draft and restores its layout', async ({ page }) => {
  await page.goto('/#todos', { waitUntil: 'domcontentloaded' })
  const widget = page.locator('#todo-page')
  await widget.getByLabel('New task', { exact: true }).fill('Draft survives resizing')
  const resizeHandle = widget.getByRole('button', { name: 'Resize Your to-dos', exact: true })
  await resizeHandle.scrollIntoViewIfNeeded()
  const initial = (await widget.boundingBox())!
  const corner = (await resizeHandle.boundingBox())!
  await page.mouse.move(corner.x + corner.width / 2, corner.y + corner.height / 2)
  await page.mouse.down()
  await page.mouse.move(corner.x + corner.width / 2 + 320 - initial.width, corner.y + corner.height / 2 + 440 - initial.height, { steps: 12 })
  await page.mouse.up()
  await expect(widget).toHaveCSS('height', '440px')
  const width = (await widget.boundingBox())!.width
  expect(width).toBeLessThanOrEqual(320)
  expect(width).toBeGreaterThanOrEqual(280)
  expect(await widget.evaluate(element => element.scrollWidth > element.clientWidth + 1)).toBe(false)
  await page.getByRole('button', { name: 'Talk to Bloom', exact: true }).click()
  await page.locator('.chat-layout-options > summary').click()
  await page.locator('.chat-layout-options').getByRole('button', { name: 'Collapse Your to-dos', exact: true }).click()
  await expect(widget.getByLabel('New task', { exact: true })).toBeHidden()
  await page.locator('.chat-layout-options').getByRole('button', { name: 'Expand Your to-dos', exact: true }).click()
  await page.getByRole('button', { name: 'Close Bloom', exact: true }).click()
  await expect(widget.getByLabel('New task', { exact: true })).toHaveValue('Draft survives resizing')
  const handle = widget.getByRole('button', { name: 'Resize Your to-dos', exact: true })
  await handle.focus()
  await handle.press('ArrowDown')
  await expect(widget).toHaveCSS('height', '472px')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(widget).toHaveCSS('height', '472px')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
})

test('home Todo widget adds tasks and shares completion with the full page', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bloom-home-widgets-v1', JSON.stringify([{ page: 'todos', size: 1 }])))
  await page.goto('/#overview', { waitUntil: 'domcontentloaded' })
  const widget = page.getByRole('article', { name: 'To-dos', exact: true })
  await widget.getByRole('textbox', { name: 'New widget task' }).fill('Task from my widget')
  await widget.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(widget.getByRole('checkbox', { name: 'Task from my widget', exact: true })).toBeVisible()
  await widget.getByRole('checkbox', { name: 'Task from my widget', exact: true }).click()
  await expect(widget.getByRole('checkbox', { name: 'Task from my widget', exact: true })).toHaveCount(0)
  await widget.getByRole('button', { name: /Open feature/ }).click()
  await page.getByRole('tab', { name: /^Done/ }).click()
  await expect(page.getByText('Task from my widget', { exact: true })).toBeVisible()
})

test('arranged sections stay accessible and focus view reduces page length', async ({ page }) => {
  await page.goto('/#settings', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Talk to Bloom', exact: true }).click()
  await page.locator('.chat-layout-options > summary').click()
  const select = page.getByRole('combobox', { name: 'Visible section', exact: true })
  const option = await select.locator('option').nth(1).getAttribute('value')
  await select.selectOption(option!)
  await expect(page.locator('[data-resizable-widget]:visible')).toHaveCount(1)
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') })
  const violations = await page.evaluate(async () => {
    const axe = (window as Window & { axe: typeof import('axe-core') }).axe
    const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })
    return result.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) }))
  })
  expect(violations).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
})

test('existing widget library can run the full Todo feature inline', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bloom-home-widgets-v1', JSON.stringify([{ page: 'todos', size: 1 }])))
  await page.goto('/#overview', { waitUntil: 'domcontentloaded' })
  const widget = page.getByRole('article', { name: 'To-dos', exact: true })
  await widget.getByRole('button', { name: 'Use feature here', exact: true }).click()
  const embedded = widget.frameLocator('iframe')
  await expect(embedded.getByLabel('New task', { exact: true })).toBeVisible()
  await expect(embedded.getByRole('button', { name: 'Talk to Bloom', exact: true })).toHaveCount(0)
  await embedded.getByLabel('New task', { exact: true }).fill('Task from embedded feature')
  await embedded.getByLabel('New task', { exact: true }).press('Enter')
  await expect(embedded.getByText('Task from embedded feature', { exact: true })).toBeVisible()
  await widget.getByRole('button', { name: 'Show quick view', exact: true }).click()
  await widget.getByRole('button', { name: /Open feature/ }).click()
  await expect(page.getByText('Task from embedded feature', { exact: true })).toBeVisible()
})


test('Bloom stays compact at bottom-left and media cards stop before content overlaps', async ({ page }) => {
  await page.goto('/#code', { waitUntil: 'domcontentloaded' })
  const launcher = page.getByRole('button', { name: 'Talk to Bloom', exact: true })
  await expect(launcher).toBeVisible()
  const bounds = (await launcher.boundingBox())!
  expect(bounds.width).toBeLessThanOrEqual(56)
  expect(bounds.height).toBeLessThanOrEqual(56)
  expect(bounds.x).toBeLessThanOrEqual(16)
  expect(page.viewportSize()!.height - bounds.y - bounds.height).toBeLessThanOrEqual(16)
  await expect(page.locator('.page-content > .page-layout-controls')).toHaveCount(0)
  const card = page.locator('.cd-hero')
  const handle = card.getByRole('button', { name: 'Resize Learn JavaScript', exact: true })
  await handle.focus()
  for (let i = 0; i < 15; i++) await handle.press('ArrowUp')
  const visual = (await card.locator('.cd-hero-art').boundingBox())!
  const heading = (await card.getByRole('heading', { name: 'Learn JavaScript', exact: true }).boundingBox())!
  expect(visual.y + visual.height).toBeLessThanOrEqual(heading.y + 1)
  expect(await card.evaluate(node => node.clientHeight >= node.scrollHeight - 1)).toBe(true)
  await launcher.click()
  await page.locator('.chat-layout-options > summary').click()
  await expect(page.locator('.chat-layout-options').getByRole('button', { name: 'Reset size of Learn JavaScript', exact: true })).toBeVisible()
})
