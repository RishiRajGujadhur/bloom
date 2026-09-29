/**
 * PFFFT compiled to WebAssembly: the SIMD128 build where the CPU supports it,
 * the scalar Wasm build otherwise, and a plain JS FFT as the last resort.
 * Works on the main thread and in workers. Output uses PFFFT's ordered real
 * layout: [re0, reN/2, re1, im1, re2, im2, …]; the inverse is unnormalised.
 */
import { hasCap } from './caps'
import { jsFft, type RealFft } from './fftCore'

export { jsFft, type RealFft }
import simdUrl from '../../node_modules/@echogarden/pffft-wasm/dist/simd/pffft.wasm?url'
import scalarUrl from '../../node_modules/@echogarden/pffft-wasm/dist/non-simd/pffft.wasm?url'

export type FftBackend = 'simd' | 'wasm' | 'js'

type PffftModule = {
  _pffft_new_setup: (n: number, t: number) => number
  _pffft_aligned_malloc: (bytes: number) => number
  _pffft_transform_ordered: (s: number, i: number, o: number, w: number, dir: number) => void
  HEAPF32: Float32Array
}

let mod: Promise<{ m: PffftModule; backend: FftBackend } | null> | null = null
const load = () =>
  (mod ??= (async () => {
    const simd = hasCap('simd')
    try {
      const factory = (simd ? await import('@echogarden/pffft-wasm/simd') : await import('@echogarden/pffft-wasm')).default as (o: object) => Promise<PffftModule>
      const url = simd ? simdUrl : scalarUrl
      return { m: await factory({ locateFile: () => url }), backend: simd ? 'simd' : 'wasm' }
    } catch {
      return null
    }
  })())

const cache = new Map<number, Promise<{ fft: RealFft; backend: FftBackend }>>()

/** A real FFT of size n (a multiple of 32 whose other factors are 2, 3 or 5). */
export function getFft(n: number) {
  let p = cache.get(n)
  if (!p) {
    p = load().then((l) => {
      if (!l) return { fft: jsFft(n), backend: 'js' as const }
      const { m } = l
      const setup = m._pffft_new_setup(n, 0)
      const inP = m._pffft_aligned_malloc(n * 4)
      const outP = m._pffft_aligned_malloc(n * 4)
      const workP = m._pffft_aligned_malloc(n * 4)
      const run = (input: Float32Array, out: Float32Array, dir: number) => {
        m.HEAPF32.set(input, inP >> 2)
        m._pffft_transform_ordered(setup, inP, outP, workP, dir)
        out.set(m.HEAPF32.subarray(outP >> 2, (outP >> 2) + n))
      }
      return { fft: { n, forward: (i, o) => run(i, o, 0), inverse: (i, o) => run(i, o, 1) }, backend: l.backend }
    })
    cache.set(n, p)
  }
  return p
}
