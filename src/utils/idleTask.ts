/** Schedule optional work after rendering, with a bounded fallback and cleanup. */
export function idleTask(task: () => void, timeout = 1500) {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(task, { timeout })
    return () => window.cancelIdleCallback(handle)
  }
  const handle = window.setTimeout(task, 50)
  return () => window.clearTimeout(handle)
}
