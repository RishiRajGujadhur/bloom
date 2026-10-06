import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bloom-welcome-v1', '{}'))
})

test('shared pages hide scrollbar chrome while keeping long content reachable', async ({ page }) => {
  for (const route of ['overview', 'habits', 'focus', 'settings']) {
    await page.goto(`/#${route}`)
    await expect(page.locator('.page-content')).toBeVisible()
    await expect.poll(() => page.evaluate(() => {
      const nodes = [document.documentElement, document.body, ...document.querySelectorAll('body *')]
      return nodes.filter(node => node.scrollHeight > node.clientHeight + 1)
        .every(node => getComputedStyle(node).scrollbarWidth === 'none')
    })).toBe(true)
    await expect.poll(() => page.evaluate(async () => {
      const node = document.scrollingElement!
      const maximum = node.scrollHeight - Math.max(node.clientHeight, window.innerHeight)
      window.scrollTo({ top: maximum, behavior: 'instant' })
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
      return maximum <= 1 || Math.abs(node.scrollTop - (node.scrollHeight - Math.max(node.clientHeight, window.innerHeight))) <= 2
    })).toBe(true)
  }
})

test('portaled AI panel follows the shared no-scrollbar policy', async ({ page }) => {
  await page.goto('/#focus')
  await page.getByRole('button', { name: 'Talk to Bloom', exact: true }).click()
  await page.getByRole('tab', { name: 'Plan with Bloom', exact: true }).click()
  await page.locator('.companion-ai-options > summary').click()
  const panel = page.locator('.bc-panel')
  await expect(panel).toBeVisible()
  await expect.poll(() => panel.evaluate(node => getComputedStyle(node).scrollbarWidth)).toBe('none')
})

test('section arrows and jump menu navigate long pages', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#settings')
  const navigator = page.getByRole('navigation', { name: 'Page sections', exact: true })
  await expect(navigator).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Install Bloom', exact: true })).toBeVisible()
  const down = navigator.getByRole('button', { name: /^Next section:/ })
  await expect(down).toBeEnabled()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  await down.click()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  const up = navigator.getByRole('button', { name: /^Previous section:/ })
  await expect(up).toBeEnabled()
  await up.click()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  await down.click()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  const menu = navigator.getByRole('combobox', { name: 'Jump to page section' })
  const last = await menu.locator('option').last().getAttribute('value')
  await menu.selectOption(last!)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100)
  await menu.selectOption('0')
  await expect(up).toBeEnabled()
  await up.focus()
  await up.press('Enter')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  await expect(up).toBeDisabled()
  const bounds = await navigator.boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  await page.screenshot({ path: testInfo.outputPath('section-navigation.png') })
})
