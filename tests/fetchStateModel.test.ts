import { checkFetchViews, STARTER_VIEWS } from '../src/features/code/fetchStateModel'

describe('fetch loading and error challenge', () => {
  it('checks loading, success, and failure separately', () => {
    const starter = checkFetchViews(STARTER_VIEWS)
    expect(starter.pass).toBe(false)
    expect(starter.cases.map((item) => item.pass)).toEqual([false, true, false])
    expect(checkFetchViews({ loading: 'spinner', success: 'cards', error: 'error-retry' }).pass).toBe(true)
  })
})
