import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bloom-welcome-v1', '{}'))
})

test('companion previews and applies a plan once, surviving reload', async ({
  page,
}) => {
  await page.goto('/#todos')
  await page.getByLabel('New task', { exact: true }).fill('A small next step')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await page.getByRole('button', { name: 'Talk to Bloom', exact: true }).click()
  const dialog = page.getByRole('region', { name: 'Talk to Bloom', exact: true })
  await dialog.getByRole('tab', { name: 'Plan with Bloom', exact: true }).click()
  await dialog
    .getByRole('button', { name: 'I have 40 minutes', exact: true })
    .click()
  await expect(
    dialog.getByRole('region', { name: 'Suggested session' }),
  ).toContainText('A small next step')
  await dialog
    .getByRole('button', { name: 'Add to today’s intentions', exact: true })
    .click()
  await expect(
    dialog.getByRole('button', { name: 'Added to today’s intentions' }),
  ).toBeDisabled()
  await dialog.getByRole('button', { name: 'Open daily intentions' }).click()
  await expect(page).toHaveURL(/#planning$/)
  await expect(
    page.getByText('A small next step', { exact: true }),
  ).toHaveCount(1)
  await page.reload()
  await expect(
    page.getByText('A small next step', { exact: true }),
  ).toHaveCount(1)
  await page.getByRole('button', { name: 'Talk to Bloom', exact: true }).click()
  await dialog.getByRole('tab', { name: 'Plan with Bloom', exact: true }).click()
  await dialog
    .getByRole('button', { name: 'I have 40 minutes', exact: true })
    .click()
  await dialog
    .getByRole('button', { name: 'Add to today’s intentions', exact: true })
    .click()
  await dialog.getByRole('button', { name: 'Open daily intentions' }).click()
  await expect(
    page.getByText('A small next step', { exact: true }),
  ).toHaveCount(1)
})

test('empty plan is useful without downloading AI and fits the viewport', async ({
  page,
}, testInfo) => {
  const remoteRequests: string[] = []
  page.on('request', (request) => {
    if (/huggingface|mlc-ai/.test(request.url()))
      remoteRequests.push(request.url())
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Talk to Bloom', exact: true }).click()
  const dialog = page.getByRole('region', { name: 'Talk to Bloom', exact: true })
  await dialog.getByRole('tab', { name: 'Plan with Bloom', exact: true }).click()
  await dialog
    .getByRole('button', { name: 'I’m tired today', exact: true })
    .click()
  await expect(
    dialog.getByText('No available tasks fit this session.', { exact: false }),
  ).toBeVisible()
  await expect(
    dialog.getByRole('button', {
      name: 'Add to today’s intentions',
      exact: true,
    }),
  ).toBeDisabled()
  await expect(
    dialog.getByRole('combobox', { name: 'Energy', exact: true }),
  ).toHaveValue('low')
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true)
  expect(remoteRequests).toEqual([])
  await page.screenshot({ path: testInfo.outputPath('companion.png') })
})

test('failed local AI setup leaves the lightweight planner usable', async ({
  page,
}) => {
  await page.route('https://huggingface.co/**', (route) => route.abort())
  await page.route('https://raw.githubusercontent.com/**', (route) =>
    route.abort(),
  )
  await page.goto('/')
  await page.getByRole('button', { name: 'Talk to Bloom', exact: true }).click()
  const dialog = page.getByRole('region', { name: 'Talk to Bloom', exact: true })
  await dialog.getByRole('tab', { name: 'Plan with Bloom', exact: true }).click()
  await dialog.getByText('Try private, local AI', { exact: true }).click()
  await dialog
    .getByRole('button', { name: 'Download & enable local AI' })
    .click()
  await expect(dialog.getByText(/Local AI could not start/)).toBeVisible({
    timeout: 20000,
  })
  await dialog
    .getByRole('button', { name: 'I have 40 minutes', exact: true })
    .click()
  await expect(
    dialog.getByRole('heading', { name: 'Your next small steps' }),
  ).toBeVisible()
})
