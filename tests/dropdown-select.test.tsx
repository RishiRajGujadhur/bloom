import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { DropdownSelect } from '../src/components/ui/DropdownSelect'
import { Select } from '../src/components/ui/Menu'
import { changeField } from './helpers/dropdown'


test('preserves empty values and delivers a real select change event', () => {
  const changed = jest.fn()
  function Example() {
    const [value, setValue] = useState('one')
    return <DropdownSelect aria-label="Choice" name="choice" value={value} onChange={(event) => {
      changed(event.target.value, event.currentTarget instanceof HTMLSelectElement)
      setValue(event.target.value)
    }}><option value="">Off</option><option value="one">One</option></DropdownSelect>
  }
  render(<Example />)
  changeField(screen.getByRole('combobox', { name: 'Choice' }), { target: { value: '' } })
  expect(changed).toHaveBeenCalledWith('', true)
  expect(screen.getByRole('combobox')).toHaveTextContent('Off')
})

test('keeps uncontrolled defaults, implicit labels and form values', () => {
  const view = render(<form><label>Duration<DropdownSelect name="duration" defaultValue={30}>
    <option value="15">15 days</option><option value="30">30 days</option>
  </DropdownSelect></label></form>)
  const picker = screen.getByRole('combobox', { name: 'Duration' })
  expect(picker).toHaveTextContent('30 days')
  changeField(picker, { target: { value: '15' } })
  expect(picker).toHaveTextContent('15 days')
  expect(new FormData(view.container.querySelector('form')!).getAll('duration')).toEqual(['15'])
  fireEvent.reset(view.container.querySelector('form')!)
  expect(picker).toHaveTextContent('30 days')
})

test('supports linked labels, disabled options, groups and keyboard dismissal', () => {
  render(<><label htmlFor="picker">Grouped choices</label><DropdownSelect id="picker" defaultValue="first">
    <optgroup label="Available"><option value="first">First</option></optgroup>
    <optgroup label="Unavailable" disabled><option value="second">Second</option></optgroup>
  </DropdownSelect></>)
  const picker = screen.getByRole('combobox', { name: 'Grouped choices' })
  fireEvent.keyDown(picker, { key: 'ArrowDown' })
  expect(screen.getByRole('option', { name: 'Second' })).toHaveAttribute('data-disabled')
  fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' })
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})

test('disabled pickers cannot open', () => {
  render(<DropdownSelect aria-label="Locked" disabled><option value="a">A</option></DropdownSelect>)
  const picker = screen.getByRole('combobox', { name: 'Locked' })
  expect(picker).toBeDisabled()
  fireEvent.click(picker)
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})

test('the existing Select API shares the picker and accepts an empty option', () => {
  const changed = jest.fn()
  render(<Select value="" onValueChange={changed} label="Legacy picker" options={[{ value: '', label: 'None' }, { value: 'a', label: 'A' }]} />)
  changeField(screen.getByRole('combobox', { name: 'Legacy picker' }), { target: { value: 'a' } })
  expect(changed).toHaveBeenCalledWith('a')
})

test('portals stay inside native dialogs so their options remain interactive', () => {
  render(<dialog open><DropdownSelect aria-label="Dialog choice"><option value="a">A</option></DropdownSelect></dialog>)
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Dialog choice' }), { key: 'ArrowDown' })
  expect(screen.getByRole('listbox').closest('dialog')).not.toBeNull()
})
