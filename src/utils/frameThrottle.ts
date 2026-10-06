/** Coalesce event storms into one visual update. Release the latest event on cancel. */
export function frameThrottle<T extends unknown[]>(callback: (...args: T) => void) {
  let frame = 0
  let latest: T | undefined
  const run = (...args: T) => {
    latest = args
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      const value = latest
      latest = undefined
      if (value) callback(...value)
    })
  }
  run.cancel = () => {
    cancelAnimationFrame(frame)
    frame = 0
    latest = undefined
  }
  return run
}
