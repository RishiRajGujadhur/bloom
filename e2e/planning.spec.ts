import { chooseSelectOption } from './helpers/dropdown'
import { test, expect } from '@playwright/test'

test('nested projects and perspectives survive reload', async ({
  page,
}, testInfo) => {
  await page.goto('/#todos')
  await page.getByRole('button', { name: 'New project', exact: true }).click()
  await page.getByLabel('Project name', { exact: true }).fill('Product launch')
  await chooseSelectOption(page.getByLabel('Action order'), 'sequential')
  await page.getByRole('button', { name: 'Save project' }).click()
  await page.getByRole('button', { name: /Product launch 0\/0/ }).click()
  await page.getByRole('button', { name: 'New project', exact: true }).click()
  await page.getByLabel('Project name', { exact: true }).fill('Research')
  await page.getByRole('button', { name: 'Save project' }).click()
  await chooseSelectOption(page
    .getByLabel('Filter project'), { label: 'Product launch / Research' })
  await page.getByLabel('New task').fill('Review customer interviews')
  await page.getByRole('button', { name: /Details/ }).click()
  await page.getByLabel('Context', { exact: true }).fill('Office')
  await chooseSelectOption(page
    .getByRole('combobox', { name: 'Energy', exact: true }), 'high')
  await chooseSelectOption(page
    .getByRole('combobox', { name: 'Time of day', exact: true }), 'morning')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await chooseSelectOption(page.getByLabel('Filter energy'), 'high')
  await chooseSelectOption(page.getByLabel('Filter context'), 'Office')
  await chooseSelectOption(page.getByLabel('Filter time of day'), 'morning')
  await page
    .getByRole('button', { name: 'Save perspective', exact: true })
    .click()
  await page.getByLabel('Perspective name').fill('Morning deep work')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Save perspective', exact: true })
    .click()
  await page.reload()
  await chooseSelectOption(page
    .getByLabel('Perspective', { exact: true }), { label: 'Morning deep work' })
  await expect(page.getByLabel('Filter context')).toHaveAttribute('data-value', 'Office')
  await expect(
    page.getByRole('button', {
      name: 'Complete Review customer interviews',
      exact: true,
    }),
  ).toBeEnabled()
  await expect(page.getByLabel('Filter project')).toContainText(
    'Product launch / Research',
  )
  await page.screenshot({
    path: testInfo.outputPath('projects.png'),
    fullPage: true,
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('time blocks support scheduling, resizing, overlap protection, and settings persistence', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/#todos')
  await page.getByLabel('New task').fill('Write project brief')
  await page.getByRole('button', { name: /Details/ }).click()
  await page.getByLabel('Estimated minutes').fill('60')
  await page.getByLabel('Deep work', { exact: true }).check()
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await page.goto('/#calendar')
  await chooseSelectOption(page.getByLabel('Calendar view'), 'timeGridDay')
  if (testInfo.project.name === 'desktop') {
    const source = page.locator('.calendar-draggable')
    const target = page.locator('.fc-timegrid-slot-lane[data-time="09:00:00"]')
    await target.scrollIntoViewIfNeeded()
    const from = (await source.boundingBox())!
    const to = (await target.boundingBox())!
    await page.mouse.move(from.x + 50, from.y + 20)
    await page.mouse.down()
    await page.mouse.move(from.x + 65, from.y + 25, { steps: 5 })
    await page.mouse.move(to.x + to.width / 2, to.y + 4, { steps: 30 })
    await page.mouse.up()
  } else {
    await page
      .getByRole('button', {
        name: 'Schedule Write project brief',
        exact: true,
      })
      .click()
    await page.getByRole('button', { name: 'Save block', exact: true }).click()
  }
  await expect(page.getByRole('status')).toHaveText('Time block saved.')
  await expect(page.getByText('1h', { exact: true })).toHaveCount(2)
  if (testInfo.project.name === 'desktop') {
    const scheduled = page.getByRole('button', {
      name: 'Edit block Write project brief',
      exact: true,
    })
    await scheduled.scrollIntoViewIfNeeded()
    const position = (await scheduled.boundingBox())!
    await page.mouse.move(position.x + 40, position.y + 20)
    await page.mouse.down()
    await page.mouse.move(position.x + 40, position.y + 116, { steps: 25 })
    await page.mouse.up()
    await expect(page.locator('.calendar-day-list time')).toContainText('10:00')
    const handle = scheduled.locator('.fc-event-resizer-end')
    const resize = (await handle.boundingBox())!
    await page.mouse.move(
      resize.x + resize.width / 2,
      resize.y + resize.height / 2,
    )
    await page.mouse.down()
    await page.mouse.move(
      resize.x + resize.width / 2,
      resize.y + resize.height / 2 + 48,
      { steps: 25 },
    )
    await page.mouse.up()
    await expect(page.getByText('1.5h', { exact: true })).toHaveCount(2)
  }
  await page
    .getByRole('button', { name: 'Write project brief', exact: true })
    .click()
  const start = await page.getByLabel('Starts', { exact: true }).inputValue()
  const end =
    start.slice(0, 11) +
    String(Number(start.slice(11, 13)) + 2).padStart(2, '0') +
    ':00'
  await page.getByLabel('Ends', { exact: true }).fill(end)
  await page.getByRole('button', { name: 'Save block', exact: true }).click()
  await expect(page.getByText('2h', { exact: true })).toHaveCount(2)
  await page.getByRole('button', { name: 'New block', exact: true }).click()
  await page.getByLabel('Block title').fill('Conflicting meeting')
  await page.getByLabel('Starts', { exact: true }).fill(start)
  await page.getByLabel('Ends', { exact: true }).fill(end)
  await page.getByRole('button', { name: 'Save block', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText(
    'This time overlaps another block.',
  )
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Write project brief', exact: true }),
  ).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('calendar.png'),
    fullPage: true,
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.goto('/#settings')
  await page
    .locator('label')
    .filter({
      has: page.getByRole('checkbox', { name: 'Enable Full calendar' }),
    })
    .click()
  await expect(
    page.getByRole('checkbox', { name: 'Enable Full calendar' }),
  ).not.toBeChecked()
  await page.goto('/#calendar')
  await expect(
    page.getByRole('heading', { name: 'This feature is turned off' }),
  ).toBeVisible()
  await page.goto('/#settings')
  await page
    .locator('label')
    .filter({
      has: page.getByRole('checkbox', { name: 'Enable Full calendar' }),
    })
    .click()
  await expect(
    page.getByRole('checkbox', { name: 'Enable Full calendar' }),
  ).toBeChecked()
  await page.goto('/#calendar')
  await page
    .getByRole('button', { name: 'Write project brief', exact: true })
    .click()
  await page.getByRole('button', { name: 'Unschedule' }).click()
  await expect(
    page.getByRole('button', {
      name: 'Schedule Write project brief',
      exact: true,
    }),
  ).toBeVisible()
  expect(errors).toEqual([])
})
