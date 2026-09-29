// Compiles src/features/mixer/noise.wat (WebAssembly SIMD) to noise.wasm. Run: node scripts/build-noise-wasm.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import wabtInit from 'wabt'
const wabt = await wabtInit()
const src = new URL('../src/features/mixer/noise.wat', import.meta.url)
const mod = wabt.parseWat('noise.wat', readFileSync(src, 'utf8'), { simd: true })
mod.validate()
const { buffer } = mod.toBinary({})
writeFileSync(new URL('../src/features/mixer/noise.wasm', import.meta.url), buffer)
console.log('noise.wasm', buffer.length, 'bytes')
