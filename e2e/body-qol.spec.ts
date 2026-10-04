import { test, expect } from '@playwright/test'
test.use({ serviceWorkers: 'block' })
test.setTimeout(120000)
test.beforeEach(async ({ page }) => { await page.addInitScript(() => { localStorage.setItem('bloom-welcome-v1', '{}'); if (!localStorage.getItem('bloom-coach-accessible')) localStorage.setItem('bloom-coach-accessible', 'false') }) })

test('all body pages expose a private in-page camera coach with keyboard dismissal', async ({ page }) => {
  for (const pageId of ['exercises', 'workouts', 'intervals', 'yoga', 'stretch', 'run', 'body', 'eyes', 'daylight', 'dojo', 'readiness', 'taichi', 'posture']) {
    await page.goto('/#' + pageId, { waitUntil: 'domcontentloaded' })
    const launch = page.getByRole('button', { name: 'Camera pose coach', exact: true }); await expect(launch).toBeVisible()
    await launch.click(); const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Start camera', exact: true })).toBeVisible({ timeout: 15000 })
    if (['run', 'body', 'eyes', 'daylight', 'readiness', 'stretch'].includes(pageId)) await expect(dialog).toContainText('observation')
    await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(launch).toBeFocused()
  }
})
test('body measurements support exact values and reversible history', async ({ page }) => {
  await page.goto('/#body'); await page.getByRole('spinbutton', { name: 'Exact weight', exact: true }).fill('72.25')
  await page.getByRole('button', { name: 'Save today’s check-in', exact: true }).click(); await expect(page.getByRole('status')).toContainText('Check-in saved')
  await page.getByRole('tab', { name: 'Measurements', exact: true }).click()
  await expect(page.getByRole('cell', { name: '72.3 kg', exact: true })).toBeVisible()
  await page.getByRole('button', { name: /Delete check-in/ }).click(); await expect(page.getByRole('cell', { name: '72.3 kg', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Undo check-in deletion' }).click(); await expect(page.getByRole('cell', { name: '72.3 kg', exact: true })).toBeVisible()
})
test('demo runs are excluded and manual entries can be undone', async ({ page }) => {
  await page.goto('/#run'); await page.getByRole('button', { name: 'Demo route', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Demo only'); await page.getByRole('button', { name: 'Finish', exact: true }).click()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('bloom-runs-v1') ?? '{"runs":[]}').runs.length)).toBe(0)
  await page.getByRole('tab', { name: 'Log & goal' }).click(); await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Undo saved activity' })).toBeVisible(); await page.getByRole('button', { name: 'Undo saved activity' }).click()
  await page.getByRole('tab', { name: 'Records', exact: true }).click(); await expect(page.getByText('Your runs and walks will appear here.')).toBeVisible()
})
test('daylight entries undo and dojo empty searches recover', async ({ page }) => {
  await page.goto('/#daylight'); await page.getByRole('button', { name: '+10 min outside', exact: true }).click()
  await expect(page.getByText('Morning light 10/20 min')).toBeVisible(); await page.getByRole('button', { name: 'Undo last daylight entry' }).click()
  await expect(page.getByText('Morning light 0/20 min')).toBeVisible()
  await page.goto('/#dojo'); await page.getByRole('searchbox', { name: 'Search Dojo techniques' }).fill('no-such-technique')
  await expect(page.getByRole('status')).toContainText('0 matching techniques'); await page.getByRole('button', { name: 'Clear technique filters' }).click()
  await expect(page.getByRole('status')).not.toContainText('0 matching techniques')
})
test('camera coach pauses eye practice and observation has no score reference', async ({ page }) => {
  await page.goto('/#eyes'); await page.getByRole('button', { name: 'Start 2-minute routine', exact: true }).click()
  await page.getByRole('button', { name: 'Camera pose coach', exact: true }).click()
  const dialog = page.getByRole('dialog'); await expect(dialog).toContainText('observation'); await expect(dialog.locator('.fc-reference')).toHaveCount(0)
  await page.getByRole('button', { name: 'Close camera pose coach' }).click(); await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible()
})

test('private notes persist per page and seated preferences follow navigation', async ({ page }) => {
  await page.goto('/#body'); await page.locator('.body-practice-note summary').click()
  await page.getByRole('textbox', { name: 'Body progress practice note' }).fill('Keep the shoulders relaxed.')
  await page.getByRole('checkbox', { name: 'Seated / wheelchair mode', exact: true }).check()
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export practice note (.md)' }).click(); expect((await download).suggestedFilename()).toMatch(/^bloom-body-note-.*\.md$/)
  await page.goto('/#dojo'); await expect(page.getByRole('checkbox', { name: 'Seated / wheelchair mode', exact: true })).toBeChecked()
  await page.goto('/#body'); await page.locator('.body-practice-note summary').click(); await expect(page.getByRole('textbox', { name: 'Body progress practice note' })).toHaveValue('Keep the shoulders relaxed.')
})
