import { test, expect } from '@playwright/test'
import { cars } from '../src/features/collectibles/catalog'

test('enable rewards, win once, equip a car, and keep it through reload', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => {
    Math.random = () => 0.1
  })
  await page.goto('/#settings')
  await page.getByText('Daily 7-7-7 Spin', { exact: true }).click()
  await page.getByText('My Collectibles', { exact: true }).click()
  await expect(
    page.getByRole('checkbox', { name: 'Enable Daily 7-7-7 Spin' }),
  ).toBeChecked()
  await expect(
    page.getByRole('checkbox', { name: 'Enable My Collectibles' }),
  ).toBeChecked()
  await page.goto('/#overview')
  await page.getByText('Your daily discovery · Free spin', { exact: true }).click()
  await page.screenshot({
    path: info.outputPath('daily-spin.png'),
    fullPage: true,
  })
  await page.getByRole('button', { name: 'Daily 7-7-7 Spin' }).click()
  await expect(page.getByText('Jackpot! Mint Mile is yours.')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Come back tomorrow' }),
  ).toBeDisabled()
  await page.reload()
  await page.getByText('Your daily discovery · Free spin', { exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Come back tomorrow' }),
  ).toBeDisabled()
  await page
    .locator('.daily-spin')
    .getByRole('button', { name: 'My Collectibles' })
    .click()
  await expect(page.getByText('1 of 6 cars collected')).toBeVisible()
  await page.getByRole('button', { name: 'Take to focus' }).click()
  await expect(
    page.getByRole('button', { name: 'Focus companion' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.screenshot({
    path: info.outputPath('collection.png'),
    fullPage: true,
  })
  await page.goto('/#focus')
  await expect(page.getByLabel('Focus companion')).toHaveValue('mint-mile')
  await page.getByRole('button', { name: 'Start focus' }).click()
  await expect(page.getByRole('timer')).not.toHaveText('25:00')
  await page.screenshot({
    path: info.outputPath('focus-companion.png'),
    fullPage: true,
  })
  await page.reload()
  await expect(page.getByRole('img', { name: 'Mint Mile' })).toBeVisible()
  await expect(page.getByLabel('Focus companion')).toHaveValue('mint-mile')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  expect(errors).toEqual([])
})

test('all sprites render, effects respond to focus, and the grid fits each viewport', async ({
  page,
}, info) => {
  await page.addInitScript(
    (ids) => {
      localStorage.setItem(
        'mindfulness-dashboard-settings',
        JSON.stringify({ features: { collectibles: true } }),
      )
      localStorage.setItem(
        'bloom-collectibles-v1',
        JSON.stringify({
          version: 1,
          owned: ids,
          selected: null,
          lastSpin: null,
        }),
      )
    },
    cars.map((car) => car.id),
  )
  await page.goto('/#collectibles')
  await page.getByRole('button', { name: 'Show all', exact: true }).click()
  await expect(page.locator('.car-sprite')).toHaveCount(6)
  for (const car of cars) {
    const card = page
      .locator('.collectible-card')
      .filter({ has: page.getByRole('heading', { name: car.name }) })
    await expect(card.getByRole('img', { name: car.name })).toBeVisible()
    await card.getByRole('button', { name: 'Take to focus' }).focus()
    await expect(card.locator('.car-body')).toHaveCSS(
      'animation-name',
      `car-${car.effect}`,
    )
    const size = await card.locator('.car-sprite').boundingBox()
    expect(size!.width).toBeGreaterThan(80)
  }
  await page.screenshot({
    path: info.outputPath('all-cars.png'),
    fullPage: true,
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.car-body').last()).toHaveCSS(
    'animation-name',
    'none',
  )
  await page.getByRole('button', { name: 'Switch to dark mode' }).click()
  await page.screenshot({
    path: info.outputPath('all-cars-dark.png'),
    fullPage: true,
  })
})

test('a second tab cannot consume another spin', async ({ page, context }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.1
    localStorage.setItem(
      'mindfulness-dashboard-settings',
      JSON.stringify({ features: { dailySpin: true } }),
    )
  })
  await page.goto('/#overview')
  const other = await context.newPage()
  await other.goto('/#overview')
  await page.getByText('Your daily discovery · Free spin', { exact: true }).click()
  await other.getByText('Your daily discovery · Free spin', { exact: true }).click()
  await page.getByRole('button', { name: 'Daily 7-7-7 Spin' }).click()
  await expect(
    other.getByRole('button', { name: 'Come back tomorrow' }),
  ).toBeDisabled()
  await expect(other.getByText('Jackpot! Mint Mile is yours.')).toBeVisible()
})
