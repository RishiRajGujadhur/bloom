/// <reference lib="webworker" />
/**
 * Soundscape noise, generated live on the audio thread. The hand-written
 * WebAssembly SIMD kernel (noise.wat) runs four noise voices in parallel per
 * instruction; outputs 0/1/2 are white/pink/brown, each stereo from two
 * independent lanes, so nothing ever loops. A plain JS kernel is the fallback.
 */
declare const sampleRate: number
declare function registerProcessor(name: string, ctor: unknown): void
declare class AudioWorkletProcessor { readonly port: MessagePort; constructor(options?: unknown) }

type Kernel = { gen: (n: number) => void; mem: Float32Array }

function jsKernel(): Kernel {
  const mem = new Float32Array(2048)
  const s = new Uint32Array([0x9e3779b9, 0x243f6a88, 0xb7e15162, 0x12345678])
  const b = Array.from({ length: 7 }, () => new Float32Array(4))
  const brown = new Float32Array(4)
  return {
    mem,
    gen(n) {
      for (let i = 0; i < n; i++) for (let l = 0; l < 4; l++) {
        let x = s[l]
        x ^= x << 13; x ^= x >>> 17; x ^= x << 5
        s[l] = x >>> 0
        const w = ((x | 0) / 2147483648)
        b[0][l] = 0.99886 * b[0][l] + w * 0.0555179
        b[1][l] = 0.99332 * b[1][l] + w * 0.0750759
        b[2][l] = 0.969 * b[2][l] + w * 0.153852
        b[3][l] = 0.8665 * b[3][l] + w * 0.3104856
        b[4][l] = 0.55 * b[4][l] + w * 0.5329522
        b[5][l] = -0.7616 * b[5][l] - w * 0.016898
        const p = (b[0][l] + b[1][l] + b[2][l] + b[3][l] + b[4][l] + b[5][l] + b[6][l] + w * 0.5362) * 0.11
        b[6][l] = w * 0.115926
        brown[l] = (brown[l] + 0.02 * w) / 1.02
        mem[256 + i * 4 + l] = w * 0.5
        mem[768 + i * 4 + l] = p
        mem[1280 + i * 4 + l] = brown[l] * 3.5
      }
    },
  }
}

class NoiseProcessor extends AudioWorkletProcessor {
  private k: Kernel
  constructor(options: { processorOptions?: { module?: WebAssembly.Module } }) {
    super()
    const mod = options.processorOptions?.module
    let k: Kernel | null = null
    if (mod) {
      try {
        const inst = new WebAssembly.Instance(mod)
        const e = inst.exports as { memory: WebAssembly.Memory; gen: (n: number) => void; seed: (a: number, b: number, c: number, d: number) => void }
        const r = () => (Math.random() * 0xffffffff) | 1
        e.seed(r(), r(), r(), r())
        k = { gen: e.gen, mem: new Float32Array(e.memory.buffer) }
      } catch { k = null }
    }
    this.k = k ?? jsKernel()
    this.port.postMessage({ simd: !!k, sampleRate })
  }
  process(_inputs: Float32Array[][], outputs: Float32Array[][]) {
    const n = outputs[0][0].length
    this.k.gen(n)
    const m = this.k.mem
    // Float32 offsets of the white/pink/brown blocks (byte offsets 1024/3072/5120 ÷ 4).
    const base = [256, 768, 1280]
    for (let o = 0; o < 3; o++) {
      const out = outputs[o]
      if (!out) continue
      for (let c = 0; c < out.length; c++) {
        const ch = out[c]
        const lane = c === 0 ? 0 : 1
        for (let i = 0; i < n; i++) ch[i] = m[base[o] + i * 4 + lane]
      }
    }
    return true
  }
}

registerProcessor('bloom-noise', NoiseProcessor)
