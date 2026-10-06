import { act, render } from '@testing-library/react'
import { GalaxyGlyph } from '../src/components/studio/GalaxyGlyph'

test('mounts the alternate icon only for Galaxy and reacts to theme changes', async () => {
  document.documentElement.dataset.theme = 'bloom-light'
  const view = render(<GalaxyGlyph id="menu" label="Menu" />)
  expect(view.container.querySelector('svg')).toBeNull()
  await act(async () => { document.documentElement.dataset.theme = 'galaxy' })
  expect(view.container.querySelector('svg')).toBeInTheDocument()
  await act(async () => { document.documentElement.dataset.theme = 'bloom-dark' })
  expect(view.container.querySelector('svg')).toBeNull()
  view.unmount()
})
