import { test, expect } from '@playwright/test'

// Opt-in hardware test: downloads the real model. Normal CI stays offline.
test('real local model loads and understands a planning request', async ({
  page,
}, testInfo) => {
  test.skip(
    process.env.BLOOM_AI_SMOKE !== '1',
    'Requires WebGPU and a model download',
  )
  test.setTimeout(240_000)
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error')
      console.log(message.text())
  })
  page.on('pageerror', (error) => console.log(error.message))
  await page.goto('/')
  await page.getByRole('button', { name: 'Talk to Bloom', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'A little space with Bloom' })
  await dialog.getByText('Try private, local AI', { exact: true }).click()
  await dialog
    .getByRole('button', { name: 'Download & enable local AI' })
    .click()
  await expect(
    dialog
      .getByText('Local AI · running on this device', { exact: true })
      .or(dialog.getByText(/Local AI could not start/)),
  ).toBeVisible({ timeout: 180_000 })
  await testInfo.attach('model-status', {
    body: await dialog.innerText(),
    contentType: 'text/plain',
  })
  await expect(
    dialog.getByText('Local AI · running on this device', { exact: true }),
  ).toBeVisible()
  await dialog
    .getByRole('button', { name: 'I have 40 minutes', exact: true })
    .click()
  await expect(
    dialog.getByRole('heading', { name: 'Your next small steps' }),
  ).toBeVisible({ timeout: 65_000 })
  await expect(
    dialog.getByText('Local AI · running on this device', { exact: true }),
  ).toBeVisible()
  await dialog.getByRole('button', { name: 'Turn off & free memory' }).click()
  await expect(
    dialog.getByText('Lightweight planner · no model needed', { exact: true }),
  ).toBeVisible()
})
