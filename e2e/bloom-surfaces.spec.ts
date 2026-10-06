import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bloom-welcome-v1', '{}'))
})

test('shared pages hide scrollbar chrome while keeping long content reachable', async ({ page }) => {
  for (const route of ['overview', 'habits', 'focus', 'settings']) {
    await page.goto(`/#${route}`)
    await expect(page.locator('.page-content')).toBeVisible()
    await expect.poll(() => page.evaluate(() => {
      const nodes = [document.documentElement, document.body, ...document.querySelectorAll('#root *')]
      return nodes.filter(node => node.scrollHeight > node.clientHeight + 1)
        .every(node => getComputedStyle(node).scrollbarWidth === 'none')
    })).toBe(true)
    await expect.poll(() => page.evaluate(async () => {
      const node = document.scrollingElement!
      const maximum = node.scrollHeight - node.clientHeight
      window.scrollTo({ top: maximum, behavior: 'instant' })
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
      return maximum <= 1 || Math.abs(node.scrollTop - (node.scrollHeight - node.clientHeight)) <= 2
    })).toBe(true)
  }
})
