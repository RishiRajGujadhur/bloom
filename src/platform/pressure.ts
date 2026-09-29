/**
 * Compute Pressure: a stream of CPU stress states (nominal → critical) so
 * heavy scenes can calm down before the fans spin up. Where the API isn't
 * available, a frame-time monitor stands in: sustained slow frames count as
 * "serious". Returns an unsubscribe function.
 */
export type Pressure = 'nominal' | 'fair' | 'serious' | 'critical'
type PO = { observe: (s: string, o?: { sampleInterval?: number }) => Promise<void>; disconnect: () => void }
type POCtor = new (cb: (records: { state: Pressure }[]) => void) => PO

export function watchPressure(cb: (p: Pressure, source: 'compute-pressure' | 'frame-time') => void): () => void {
  const Ctor = (globalThis as { PressureObserver?: POCtor }).PressureObserver
  if (Ctor) {
    const obs = new Ctor((records) => { const last = records[records.length - 1]; if (last) cb(last.state, 'compute-pressure') })
    obs.observe('cpu', { sampleInterval: 2000 }).catch(() => {})
    return () => obs.disconnect()
  }
  // Fallback: rolling average frame time.
  let raf = 0
  let last = performance.now()
  let avg = 16
  let state: Pressure = 'nominal'
  const tick = (t: number) => {
    avg = avg * 0.95 + Math.min(200, t - last) * 0.05
    last = t
    const next: Pressure = avg > 60 ? 'critical' : avg > 34 ? 'serious' : avg > 22 ? 'fair' : 'nominal'
    if (next !== state) { state = next; cb(state, 'frame-time') }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}
