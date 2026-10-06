import { PageBoundary } from '../src/components/ui/PageBoundary'

test('ordinary page errors reset on retry', () => {
  const boundary = new PageBoundary({ children: null })
  boundary.state = { error: new Error('Unexpected page state') }
  boundary.setState = jest.fn()
  boundary.retry()
  expect(boundary.setState).toHaveBeenCalledWith({ error: null })
})

test('rejected lazy imports reload the document instead of retrying a cached rejection', () => {
  const boundary = new PageBoundary({ children: null })
  boundary.state = { error: new Error('Failed to fetch dynamically imported module: /assets/page.js') }
  boundary.setState = jest.fn()
  // jsdom intentionally reports navigation as unsupported; the reset path must
  // still remain unused for a cached import rejection.
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  boundary.retry()
  expect(boundary.setState).not.toHaveBeenCalled()
  consoleError.mockRestore()
})
