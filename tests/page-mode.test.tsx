import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { AdvancedSection, PageModeContext, PageModeSwitch, usePageModeState } from '../src/components/ui/PageMode'

const mountAdvanced = jest.fn()
function BulkTools() { mountAdvanced(); return <p>Bulk tools</p> }
function Page({ page }: { page: string }) {
  const state = usePageModeState(page)
  const [draft, setDraft] = useState('')
  return <PageModeContext.Provider value={state}>
    <PageModeSwitch />
    <input aria-label="Essential draft" value={draft} onChange={event => setDraft(event.target.value)} />
    <AdvancedSection><BulkTools /></AdvancedSection>
  </PageModeContext.Provider>
}
beforeEach(() => { localStorage.clear(); mountAdvanced.mockClear() })

test('basic avoids mounting bulk tools and mode changes preserve essential drafts', () => {
  render(<Page page="habits" />)
  expect(screen.getByRole('button', { name: 'Basic', exact: true })).toHaveAttribute('aria-pressed', 'true')
  expect(mountAdvanced).not.toHaveBeenCalled()
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Keep this draft' } })
  fireEvent.click(screen.getByRole('button', { name: 'Advanced', exact: true }))
  expect(screen.getByText('Bulk tools')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Basic', exact: true }))
  expect(screen.getByRole('textbox')).toHaveValue('Keep this draft')
  expect(screen.queryByText('Bulk tools')).not.toBeInTheDocument()
})

test('each page remembers its mode without changing another page', () => {
  const { rerender } = render(<Page page="habits" />)
  fireEvent.click(screen.getByRole('button', { name: 'Advanced', exact: true }))
  rerender(<Page page="growth" />)
  expect(screen.getByRole('button', { name: 'Basic', exact: true })).toHaveAttribute('aria-pressed', 'true')
  rerender(<Page page="habits" />)
  expect(screen.getByRole('button', { name: 'Advanced', exact: true })).toHaveAttribute('aria-pressed', 'true')
})
