/**
 * What this device can do. Each advanced feature declares the capabilities it
 * uses; the badge shows which are live here and which fall back.
 */
export type Cap = 'bt' | 'opfs' | 'gpu' | 'crdt' | 'simd' | 'mt' | 'fsa'

export const capInfo: Record<Cap, { label: string; long: string }> = {
  bt: { label: 'Bluetooth', long: 'Web Bluetooth: talks to real devices' },
  opfs: { label: 'Private files', long: 'Origin Private File System: fast on-device storage' },
  gpu: { label: 'WebGPU', long: 'WebGPU: compute shaders and on-device AI' },
  crdt: { label: 'Local-first sync', long: 'CRDT sync: devices merge edits peer to peer' },
  simd: { label: 'SIMD', long: 'WebAssembly SIMD128: vectorised maths' },
  mt: { label: 'Multi-core', long: 'SharedArrayBuffer + Atomics: true multi-threading' },
  fsa: { label: 'Disk files', long: 'File System Access: open and save real files' },
}

// A tiny module using v128 instructions; it only validates where SIMD is supported.
const SIMD_PROBE = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11])

export function hasCap(c: Cap): boolean {
  const g = globalThis as unknown as Record<string, unknown>
  const nav = (typeof navigator === 'undefined' ? {} : navigator) as unknown as Record<string, unknown>
  switch (c) {
    case 'bt': return !!nav.bluetooth
    case 'opfs': return typeof (nav.storage as { getDirectory?: unknown } | undefined)?.getDirectory === 'function'
    case 'gpu': return !!nav.gpu
    case 'crdt': return typeof g.RTCPeerConnection === 'function' || typeof g.BroadcastChannel === 'function'
    case 'simd': try { return typeof WebAssembly !== 'undefined' && WebAssembly.validate(SIMD_PROBE) } catch { return false }
    case 'mt': return typeof SharedArrayBuffer === 'function' && g.crossOriginIsolated === true
    case 'fsa': return typeof g.showOpenFilePicker === 'function'
  }
}

export const threads = () => Math.max(1, Math.min(16, (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4))
