import { test, expect } from '@playwright/test'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(resolve('package.json'))
test.setTimeout(120000)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bloom-welcome-v1', '{}'))
})

async function checkAccessibility(page: import('@playwright/test').Page) {
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') })
  const violations = await page.evaluate(async () => {
    const axe = (window as Window & { axe: typeof import('axe-core') }).axe
    const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })
    return result.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) }))
  })
  expect(violations).toEqual([])
}

test('Soundscape sits beside Search and its visibility preference survives refresh', async ({ page }) => {
  await page.goto('/#settings', { waitUntil: 'domcontentloaded' })
  const soundscape = page.getByRole('button', { name: 'Soundscape', exact: true })
  await expect(soundscape).toBeVisible()
  const search = (await page.locator('.topbar-search').boundingBox())!
  const sound = (await soundscape.boundingBox())!
  expect(sound.x - search.x - search.width).toBeGreaterThanOrEqual(6)
  expect(sound.x - search.x - search.width).toBeLessThanOrEqual(12)
  await soundscape.click()
  const mixer = page.locator('#ambient-mixer')
  await expect(mixer).toBeVisible()
  const popup = (await mixer.boundingBox())!
  expect(popup.x).toBeGreaterThanOrEqual(12)
  expect(popup.x + popup.width).toBeLessThanOrEqual(page.viewportSize()!.width - 12)
  await checkAccessibility(page)
  await page.getByRole('button', { name: 'Close sound mixer', exact: true }).click()
  const preference = page.getByRole('checkbox', { name: 'Show Soundscape button', exact: true })
  await preference.uncheck()
  await expect(soundscape).toHaveCount(0)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(preference).not.toBeChecked()
  await expect(soundscape).toHaveCount(0)
  await preference.check()
  await expect(soundscape).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
})

test('conversation tools use right-click, keyboard and the compact overflow menu', async ({ page }) => {
  await page.goto('/#code', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Talk to Bloom', exact: true }).click()
  const messages = page.getByRole('region', { name: 'Conversation messages', exact: true })
  await messages.click({ button: 'right', position: { x: 16, y: 16 } })
  const menu = page.getByRole('menu', { name: 'Conversation tools', exact: true })
  await expect(menu.getByRole('menuitem')).toHaveCount(3)
  await menu.getByRole('menuitem', { name: 'Show command examples', exact: true }).click()
  await expect(messages.getByText(/Your guide uses local commands/)).toBeVisible()
  await messages.focus()
  await messages.press('Shift+F10')
  await expect(menu).toBeVisible()
  await page.keyboard.press('Escape')
  const input = page.getByRole('searchbox', { name: 'Ask Bloom or find a page', exact: true })
  await input.fill('Draft to clear')
  await page.getByRole('button', { name: 'Conversation tools', exact: true }).click()
  await expect(menu).toBeVisible()
  await checkAccessibility(page)
  await menu.getByRole('menuitem', { name: 'Restart this page guide', exact: true }).click()
  await expect(input).toHaveValue('')
  await expect(page.locator('.chat-tools')).toHaveCount(0)
})

test('Mind maps keeps tools above the diagram and avoids empty More below destinations', async ({ page }, info) => {
  await page.goto('/#mindmaps', { waitUntil: 'domcontentloaded' })
  const diagram = page.locator('.mm-svg')
  await expect(diagram).toBeVisible()
  const tools = (await page.locator('.mm-tools').boundingBox())!
  const map = (await diagram.boundingBox())!
  expect(tools.y + tools.height).toBeLessThanOrEqual(map.y + 1)
  if (info.project.name === 'desktop') {
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 2)).toBe(true)
    await expect(page.getByText('More below', { exact: true })).toHaveCount(0)
  } else {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect(page.getByText('More below', { exact: true })).toHaveCount(0)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
})
