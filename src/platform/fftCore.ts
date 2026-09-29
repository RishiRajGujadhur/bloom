/** Real FFT of size n. `forward` writes [re0, reN/2, re1, im1, re2, im2, …]; `inverse` reads that and is unnormalised. */
export type RealFft = { n: number; forward: (input: Float32Array, out: Float32Array) => void; inverse: (input: Float32Array, out: Float32Array) => void }

/** Plain radix-2 FFT with PFFFT's ordered layout (fallback and tests). n must be a power of two. */
export function jsFft(n: number): RealFft {
  const re = new Float64Array(n)
  const im = new Float64Array(n)
  const fft = (inv: boolean) => {
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1
      for (; j & bit; bit >>= 1) j ^= bit
      j ^= bit
      if (i < j) {
        ;[re[i], re[j]] = [re[j], re[i]]
        ;[im[i], im[j]] = [im[j], im[i]]
      }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = ((inv ? 2 : -2) * Math.PI) / len
      for (let i = 0; i < n; i += len) {
        for (let k = 0; k < len / 2; k++) {
          const wr = Math.cos(ang * k)
          const wi = Math.sin(ang * k)
          const a = i + k
          const b = a + len / 2
          const tr = re[b] * wr - im[b] * wi
          const ti = re[b] * wi + im[b] * wr
          re[b] = re[a] - tr
          im[b] = im[a] - ti
          re[a] += tr
          im[a] += ti
        }
      }
    }
  }
  return {
    n,
    forward(input, out) {
      for (let i = 0; i < n; i++) {
        re[i] = input[i]
        im[i] = 0
      }
      fft(false)
      out[0] = re[0]
      out[1] = re[n / 2]
      for (let k = 1; k < n / 2; k++) {
        out[2 * k] = re[k]
        out[2 * k + 1] = im[k]
      }
    },
    inverse(input, out) {
      re[0] = input[0]
      im[0] = 0
      re[n / 2] = input[1]
      im[n / 2] = 0
      for (let k = 1; k < n / 2; k++) {
        re[k] = input[2 * k]
        im[k] = input[2 * k + 1]
        re[n - k] = input[2 * k]
        im[n - k] = -input[2 * k + 1]
      }
      fft(true)
      for (let i = 0; i < n; i++) out[i] = re[i]
    },
  }
}
