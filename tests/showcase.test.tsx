import { fireEvent, render, screen } from '@testing-library/react'
import { LetterWall } from '../src/features/showcase/LetterWall'
import { defaultJars } from '../src/features/wellbeing/store'

test('letter wall pins notes, filters by jar and opens a letter', () => {
  const entries = [
    { id: 'a1', at: Date.now(), text: 'Coffee with Sam', jarId: 'people' },
    { id: 'b2', at: Date.now() - 1000, text: 'Sunlight on the desk', jarId: 'moments' },
  ]
  render(<LetterWall entries={entries} jars={defaultJars} />)
  expect(document.querySelectorAll('.lw-note')).toHaveLength(2)
  fireEvent.click(screen.getByRole('button', { name: /People/ }))
  expect(document.querySelectorAll('.lw-note')).toHaveLength(1)
  fireEvent.click(document.querySelector('.lw-note')!)
  expect(screen.getByRole('dialog', { name: 'Gratitude letter' }).textContent).toContain('Coffee with Sam')
})
