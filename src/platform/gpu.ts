/** Shared WebGPU device (one per page), or null so the caller takes its fallback path. */
type GpuNav = { gpu?: { requestAdapter: (o?: unknown) => Promise<{ requestDevice: () => Promise<unknown> } | null> } }
let device: Promise<unknown | null> | null = null

export function gpuDevice(): Promise<unknown | null> {
  if (device) return device
  device = (async () => {
    try {
      const adapter = await (navigator as unknown as GpuNav).gpu?.requestAdapter({ powerPreference: 'high-performance' })
      return (await adapter?.requestDevice()) ?? null
    } catch { return null }
  })()
  return device
}
