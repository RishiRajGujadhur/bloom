import { frameThrottle } from '../src/utils/frameThrottle'

test('coalesces an event burst using the latest input and can cancel', () => {
  const frames = new Map<number, FrameRequestCallback>()
  let id = 0
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { frames.set(++id, callback); return id })
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(key => { frames.delete(key) })
  const callback = jest.fn()
  const update = frameThrottle(callback)
  try {
    for (let i = 0; i < 100; i++) update(i)
    expect(frames.size).toBe(1)
    const frame = frames.get(1)!
    frames.delete(1)
    frame(0)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(99)
    update(100)
    update.cancel()
    expect(frames.size).toBe(0)
    expect(callback).toHaveBeenCalledTimes(1)
  } finally { jest.restoreAllMocks() }
})
