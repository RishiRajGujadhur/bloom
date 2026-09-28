import gsap from 'gsap'
import { pauseGsapWhenHidden } from '../src/utils/gsapVisibility'

describe('GSAP visibility lifecycle', () => {
  const hidden = Object.getOwnPropertyDescriptor(document, 'hidden')

  afterEach(() => {
    if (hidden) Object.defineProperty(document, 'hidden', hidden)
    gsap.globalTimeline.resume()
  })

  it('pauses hidden-tab work and resumes when visible', () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    const cleanup = pauseGsapWhenHidden()
    expect(gsap.globalTimeline.paused()).toBe(false)
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(gsap.globalTimeline.paused()).toBe(true)
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(gsap.globalTimeline.paused()).toBe(false)
    cleanup()
  })

  it('preserves an existing pause', () => {
    gsap.globalTimeline.pause()
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    const cleanup = pauseGsapWhenHidden()
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(gsap.globalTimeline.paused()).toBe(true)
    cleanup()
  })
})
