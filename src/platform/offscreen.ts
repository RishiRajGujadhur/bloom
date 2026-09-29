/**
 * Off-main-thread rendering. A scene is written once as a factory that takes
 * a canvas (HTMLCanvasElement or OffscreenCanvas) and returns a controller.
 * `mountScene` transfers a fresh canvas to a dedicated worker with
 * `transferControlToOffscreen()` when the browser supports it — so typing,
 * scrolling or heavy page work can never make the animation stutter — and
 * falls back to running the same factory on the main thread otherwise.
 */
export type SceneOptions<D> = { width: number; height: number; dpr: number; data: D; reducedMotion: boolean; post: (type: string, payload?: unknown) => void }
export type SceneController = { resize: (w: number, h: number) => void; message: (type: string, payload: unknown) => void; dispose: () => void; backend: string }
export type SceneFactory<D> = (canvas: HTMLCanvasElement | OffscreenCanvas, o: SceneOptions<D>) => Promise<SceneController>

export type MountedScene = { send: (type: string, payload?: unknown) => void; dispose: () => void; offscreen: boolean }
type Ev = { type: string; payload?: unknown }

export const canOffscreen = () => typeof HTMLCanvasElement !== 'undefined' && 'transferControlToOffscreen' in HTMLCanvasElement.prototype && typeof Worker !== 'undefined'

/** Forwards pointer input so scenes in a worker can still orbit and hover. */
function forwardPointer(canvas: HTMLCanvasElement, send: (type: string, p: unknown) => void) {
  const f = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect()
    send('pointer', { kind: e.type, x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height, buttons: e.buttons })
  }
  const kinds = ['pointerdown', 'pointermove', 'pointerup', 'pointerleave'] as const
  kinds.forEach((k) => canvas.addEventListener(k, f))
  return () => kinds.forEach((k) => canvas.removeEventListener(k, f))
}

export function mountScene<D>(
  host: HTMLElement,
  opts: { data: D; makeWorker: () => Worker; loadFactory: () => Promise<SceneFactory<D>>; onEvent?: (e: Ev) => void; forceMain?: boolean },
): MountedScene {
  const canvas = document.createElement('canvas')
  canvas.setAttribute('data-matrix-native', '')
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none'
  host.appendChild(canvas)
  const size = () => ({ width: Math.max(1, host.clientWidth), height: Math.max(1, host.clientHeight) })
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  let disposed = false
  let ro: ResizeObserver | null = null
  let unPointer = () => {}

  if (canOffscreen() && !opts.forceMain) {
    const worker = opts.makeWorker()
    const off = canvas.transferControlToOffscreen()
    worker.onmessage = (e: MessageEvent<Ev>) => opts.onEvent?.(e.data)
    const { width, height } = size()
    worker.postMessage({ type: 'init', canvas: off, width, height, dpr, reducedMotion, data: opts.data }, [off])
    const send = (type: string, payload?: unknown) => { if (!disposed) worker.postMessage({ type, payload }) }
    ro = new ResizeObserver(() => { const s = size(); send('resize', s) })
    ro.observe(host)
    unPointer = forwardPointer(canvas, send)
    return {
      offscreen: true,
      send,
      dispose: () => { disposed = true; ro?.disconnect(); unPointer(); worker.postMessage({ type: 'dispose' }); setTimeout(() => worker.terminate(), 200); canvas.remove() },
    }
  }

  // Main-thread fallback: the very same scene code.
  let ctrl: SceneController | null = null
  const queue: [string, unknown][] = []
  const send = (type: string, payload?: unknown) => { if (ctrl) ctrl.message(type, payload); else queue.push([type, payload]) }
  const { width, height } = size()
  canvas.width = width * dpr
  canvas.height = height * dpr
  void opts.loadFactory().then(async (factory) => {
    if (disposed) return
    ctrl = await factory(canvas, { width, height, dpr, data: opts.data, reducedMotion, post: (type, payload) => opts.onEvent?.({ type, payload }) })
    if (disposed) { ctrl.dispose(); return }
    opts.onEvent?.({ type: 'ready', payload: { backend: ctrl.backend, offscreen: false } })
    queue.splice(0).forEach(([t, p]) => ctrl!.message(t, p))
  })
  ro = new ResizeObserver(() => { const s = size(); ctrl?.resize(s.width, s.height) })
  ro.observe(host)
  unPointer = forwardPointer(canvas, send)
  return { offscreen: false, send, dispose: () => { disposed = true; ro?.disconnect(); unPointer(); ctrl?.dispose(); canvas.remove() } }
}

/** Worker side: runs a scene factory on the transferred OffscreenCanvas. */
export function serveScene<D>(factory: SceneFactory<D>) {
  let ctrl: SceneController | null = null
  const pending: [string, unknown][] = []
  const post = (type: string, payload?: unknown) => (self as unknown as Worker).postMessage({ type, payload })
  self.onmessage = async (e: MessageEvent<{ type: string; canvas?: OffscreenCanvas; width?: number; height?: number; dpr?: number; reducedMotion?: boolean; data?: D; payload?: unknown }>) => {
    const m = e.data
    if (m.type === 'init') {
      ctrl = await factory(m.canvas!, { width: m.width!, height: m.height!, dpr: m.dpr!, data: m.data as D, reducedMotion: !!m.reducedMotion, post })
      post('ready', { backend: ctrl.backend, offscreen: true })
      pending.splice(0).forEach(([t, p]) => ctrl!.message(t, p))
      return
    }
    if (m.type === 'dispose') { ctrl?.dispose(); ctrl = null; return }
    if (!ctrl) { pending.push([m.type, m.payload]); return }
    if (m.type === 'resize') { const s = m.payload as { width: number; height: number }; ctrl.resize(s.width, s.height); return }
    ctrl.message(m.type, m.payload)
  }
}

/** A rolling frames-per-second counter for scenes to report. */
export function fpsMeter(report: (fps: number) => void) {
  let frames = 0
  let last = performance.now()
  return () => {
    frames++
    const now = performance.now()
    if (now - last >= 1000) { report(Math.round((frames * 1000) / (now - last))); frames = 0; last = now }
  }
}
