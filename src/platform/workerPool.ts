/**
 * A multi-core worker pool. When the page is cross-origin isolated, workers
 * share a SharedArrayBuffer progress counter they bump with Atomics.add, so the
 * page can read live progress with Atomics.load and no messages. Without
 * isolation it still runs in parallel with an ordinary counter.
 */
import { threads } from './caps'

type Task<I, O> = { input: I; transfer: Transferable[]; resolve: (o: O) => void; reject: (e: unknown) => void }
type Reply<O> = { ok: boolean; value?: O; error?: string }

export class WorkerPool<I, O> {
  private idle: Worker[] = []
  private all: Worker[] = []
  private queue: Task<I, O>[] = []
  /** Slot 0 counts finished tasks. */
  readonly progress: Int32Array
  readonly shared: boolean

  constructor(make: () => Worker, size = threads()) {
    this.shared = typeof SharedArrayBuffer === 'function' && (globalThis as { crossOriginIsolated?: boolean }).crossOriginIsolated === true
    this.progress = new Int32Array(this.shared ? new SharedArrayBuffer(8) : new ArrayBuffer(8))
    for (let i = 0; i < size; i++) {
      const wk = make()
      if (this.shared) wk.postMessage({ type: 'progress', buffer: this.progress.buffer })
      this.all.push(wk)
      this.idle.push(wk)
    }
  }

  get size() { return this.all.length }
  get done() { return this.shared ? Atomics.load(this.progress, 0) : this.progress[0] }

  run(input: I, transfer: Transferable[] = []) {
    return new Promise<O>((resolve, reject) => {
      this.queue.push({ input, transfer, resolve, reject })
      this.pump()
    })
  }

  private pump() {
    while (this.idle.length && this.queue.length) {
      const wk = this.idle.pop()!
      const t = this.queue.shift()!
      wk.onmessage = (e: MessageEvent<Reply<O>>) => {
        if (!this.shared) this.progress[0]++
        this.idle.push(wk)
        if (e.data.ok) t.resolve(e.data.value as O)
        else t.reject(new Error(e.data.error))
        this.pump()
      }
      wk.onerror = (e) => {
        this.idle.push(wk)
        t.reject(e)
        this.pump()
      }
      wk.postMessage({ type: 'task', input: t.input }, t.transfer)
    }
  }

  dispose() {
    this.all.forEach((w) => w.terminate())
    this.all = []
    this.idle = []
    this.queue = []
  }
}

/** Worker side: answers the pool's protocol with a task function. */
export function servePool<I, O>(fn: (input: I) => O | Promise<O>, transferOf?: (o: O) => Transferable[]) {
  let progress: Int32Array | null = null
  const post = (m: Reply<O>, t: Transferable[] = []) => (self as unknown as Worker).postMessage(m, t)
  self.onmessage = async (e: MessageEvent<{ type: string; input?: I; buffer?: SharedArrayBuffer }>) => {
    if (e.data.type === 'progress') {
      progress = new Int32Array(e.data.buffer!)
      return
    }
    try {
      const value = await fn(e.data.input as I)
      if (progress) Atomics.add(progress, 0, 1)
      post({ ok: true, value }, transferOf?.(value) ?? [])
    } catch (err) {
      if (progress) Atomics.add(progress, 0, 1)
      post({ ok: false, error: String((err as Error)?.message ?? err) })
    }
  }
}
