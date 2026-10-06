import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Autocomplete } from '../src/components/ui/Autocomplete'

function Example({
  submitted = () => {},
}: {
  submitted?: (name: string) => void
}) {
  const [value, setValue] = useState('')
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submitted(value)
      }}
    >
      <Autocomplete
        label="Food"
        value={value}
        onValueChange={setValue}
        options={['Apple', 'Pear']}
      />
      <button type="submit">Save</button>
    </form>
  )
}

test('filters suggestions and chooses a saved name without submitting the form', async () => {
  const submitted = jest.fn()
  const user = userEvent.setup()
  render(<Example submitted={submitted} />)
  await user.type(screen.getByRole('combobox', { name: 'Food' }), 'app')
  await user.click(screen.getByRole('option', { name: 'Apple' }))
  expect(screen.getByRole('combobox')).toHaveValue('Apple')
  expect(screen.getByRole('combobox')).toHaveFocus()
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  expect(submitted).not.toHaveBeenCalled()
})

test('supports keyboard suggestion selection and Escape without losing text', async () => {
  const user = userEvent.setup()
  render(<Example />)
  await user.tab()
  await user.keyboard('{ArrowDown}{Enter}')
  expect(screen.getByRole('combobox')).toHaveValue('Pear')
  await user.keyboard('{ArrowDown}{Escape}')
  expect(screen.getByRole('combobox')).toHaveValue('Pear')
  expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false')
})

test('accepts unmatched free text and keeps Enter form submission', async () => {
  const submitted = jest.fn()
  const user = userEvent.setup()
  render(<Example submitted={submitted} />)
  await user.type(screen.getByRole('combobox', { name: 'Food' }), 'Dragonfruit')
  await user.keyboard('{Enter}')
  expect(submitted).toHaveBeenCalledWith('Dragonfruit')
})
