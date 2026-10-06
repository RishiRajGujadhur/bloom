import type { Locator } from '@playwright/test'

/** Interact with the visible library picker rather than its hidden form control. */
export async function chooseSelectOption(
  trigger: Locator,
  choice: string | { label: string },
) {
  await trigger.click()
  const menu = trigger.page().getByRole('listbox')
  const option =
    typeof choice === 'string'
      ? menu
          .getByRole('option')
          .filter({ has: undefined })
          .locator(`xpath=.[@data-value=${xpathLiteral(choice)}]`)
      : menu.getByRole('option', { name: choice.label, exact: true })
  await option.click()
}

function xpathLiteral(value: string) {
  if (!value.includes("'")) return `'${value}'`
  return `concat('${value.split("'").join("',\"'\",'")}')`
}

export async function selectOptionValues(trigger: Locator) {
  await trigger.click()
  const values = await trigger
    .page()
    .getByRole('option')
    .evaluateAll((options) =>
      options.map((option) => (option as HTMLElement).dataset.value!),
    )
  await trigger.press('Escape')
  return values
}
