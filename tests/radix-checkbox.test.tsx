import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Checkbox } from '../src/components/ui/Checkbox'

test('clicking a label updates controlled state and boolean callbacks', () => {
  const changed = jest.fn()
  function Example() {
    const [checked, setChecked] = useState(false)
    return (
      <label>
        Show soundscape
        <Checkbox
          checked={checked}
          onCheckedChange={(next) => {
            changed(next)
            setChecked(next)
          }}
        />
      </label>
    )
  }
  render(<Example />)
  fireEvent.click(screen.getByText('Show soundscape'))
  expect(
    screen.getByRole('checkbox', { name: 'Show soundscape' }),
  ).toBeChecked()
  expect(changed).toHaveBeenCalledWith(true)
})

test('supports keyboard Space and uncontrolled defaults', async () => {
  const user = userEvent.setup()
  render(<Checkbox aria-label="Quiet scene" defaultChecked />)
  expect(screen.getByRole('checkbox', { name: 'Quiet scene' })).toBeChecked()
  await user.tab()
  await user.keyboard(' ')
  expect(
    screen.getByRole('checkbox', { name: 'Quiet scene' }),
  ).not.toBeChecked()
})

test('disabled controls do not call their handlers', () => {
  const changed = jest.fn()
  render(
    <Checkbox aria-label="Unavailable" disabled onCheckedChange={changed} />,
  )
  fireEvent.click(screen.getByRole('checkbox', { name: 'Unavailable' }))
  expect(changed).not.toHaveBeenCalled()
})

test('keeps checkbox form values and mixed-state semantics', () => {
  const view = render(
    <form>
      <Checkbox aria-label="Newsletter" name="newsletter" defaultChecked />
      <Checkbox aria-label="Select all" checked="indeterminate" />
    </form>,
  )
  expect(
    new FormData(view.container.querySelector('form')!).get('newsletter'),
  ).toBe('on')
  expect(screen.getByRole('checkbox', { name: 'Select all' })).toHaveAttribute(
    'aria-checked',
    'mixed',
  )
})
