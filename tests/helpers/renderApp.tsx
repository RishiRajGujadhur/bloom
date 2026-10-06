import { act, render } from '@testing-library/react'
import App from '../../src/App'

/** Route chunks resolve asynchronously in production and in navigation tests. */
export async function renderApp() {
  const view = render(<App />)
  await act(async () => {})
  return view
}
