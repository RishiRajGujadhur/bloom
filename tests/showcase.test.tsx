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

import { BulbGarland, recallNow } from '../src/features/showcase/BulbGarland'
import { createEpiphany } from '../src/features/epiphany/epiphanyModel'

test('epiphany garland glows by recall and flips to show details', () => {
  const e = createEpiphany('Small steps compound', { kind: 'manual', title: 'Added by hand', date: '2026-09-27' }, '2026-09-27')
  expect(recallNow(e, e.createdAt)).toBeCloseTo(1)
  expect(recallNow(e, e.createdAt + 10 * 864e5)).toBeLessThan(0.1)
  render(<BulbGarland list={[e]} />)
  fireEvent.click(document.querySelector('.bg-bulb')!)
  expect(document.querySelector('.bg-card')!.textContent).toContain('From Added by hand')
})

import { FocusDiorama } from '../src/features/showcase/FocusDiorama'
import { defaults } from '../src/model'

test('focus diorama puts each session on its day shelf', () => {
  const data = defaults()
  data.rpg.focusHistory = [
    { id: 'f1', completedAt: Date.now(), minutes: 25, taskTitle: 'Write' },
    { id: 'f2', completedAt: Date.now() - 864e5, minutes: 50, taskTitle: '' },
  ]
  render(<FocusDiorama data={data} />)
  expect(document.querySelectorAll('.fd-tile')).toHaveLength(2)
  expect(screen.getByRole('region', { name: "This week's focus diorama" }).textContent).toContain('2 sessions')
})
