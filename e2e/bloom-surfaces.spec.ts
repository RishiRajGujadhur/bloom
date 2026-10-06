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
    const canReachEnd = await page.evaluate(() => {
      const node = document.scrollingElement!
      const maximum = node.scrollHeight - node.clientHeight
      window.scrollTo({ top: maximum, behavior: 'instant' })
      return maximum <= 1 || Math.abs(node.scrollTop - maximum) <= 1
    })
    expect(canReachEnd).toBe(true)
  }
})
