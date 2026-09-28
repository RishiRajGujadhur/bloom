import { prefersReducedMotion } from '../src/utils/motion'

describe('Bloom motion preference', () => {
  const matchMedia = window.matchMedia

  afterEach(() => {
    delete document.documentElement.dataset.reduceMotion
    window.matchMedia = matchMedia
  })

  it('uses the in-app setting even when the device allows motion', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: false })
    document.documentElement.dataset.reduceMotion = 'true'
    expect(prefersReducedMotion()).toBe(true)
  })

  it('still respects the device setting', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true })
    document.documentElement.dataset.reduceMotion = 'false'
    expect(prefersReducedMotion()).toBe(true)
  })

  it('allows motion when both settings allow it', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: false })
    document.documentElement.dataset.reduceMotion = 'false'
    expect(prefersReducedMotion()).toBe(false)
  })
})
