import { fireEvent, screen } from '@testing-library/react'

/** Choose through the visible Radix menu, keeping ordinary input edits unchanged. */
export function changeField(
  field: HTMLElement,
  event: { target: { value: string } },
) {
  if (!field.hasAttribute('data-bloom-select'))
    return fireEvent.change(field, event)
  fireEvent.keyDown(field, { key: 'ArrowDown' })
  const option = screen
    .getAllByRole('option')
    .find((item) => item.dataset.value === event.target.value)
  if (!option) throw new Error(`Missing dropdown option: ${event.target.value}`)
  fireEvent.click(option)
}

export function dropdownValues(field: HTMLElement): string[] {
  fireEvent.keyDown(field, { key: 'ArrowDown' })
  const values = screen
    .getAllByRole('option')
    .map((option) => option.dataset.value!)
  fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' })
  return values
}
