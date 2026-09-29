export type FetchPhase = 'idle' | 'loading' | 'success' | 'error'
export type View = 'none' | 'spinner' | 'cards' | 'error-retry'
export type FetchViews = Record<Exclude<FetchPhase, 'idle'>, View>
export const STARTER_VIEWS: FetchViews = { loading: 'none', success: 'cards', error: 'none' }
export const VIEW_OPTIONS: { id: View; label: string }[] = [
  { id: 'none', label: 'Nothing' }, { id: 'spinner', label: 'Loading indicator' },
  { id: 'cards', label: 'Result cards' }, { id: 'error-retry', label: 'Error message and Retry' },
]
export const FETCH_CASES = [
  { id: 'slow', label: 'Slow response', phase: 'loading', expected: 'spinner', reason: 'Show loading feedback while the request is pending.' },
  { id: 'ok', label: 'Successful response', phase: 'success', expected: 'cards', reason: 'Render the returned data after success.' },
  { id: 'fail', label: 'Failed response', phase: 'error', expected: 'error-retry', reason: 'Explain the failure and offer Retry.' },
] as const

export function checkFetchViews(views: FetchViews) {
  const cases = FETCH_CASES.map((item) => ({ ...item, actual: views[item.phase], pass: views[item.phase] === item.expected }))
  return { pass: cases.every((item) => item.pass), cases }
}
