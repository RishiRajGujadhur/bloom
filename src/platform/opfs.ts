/**
 * Origin Private File System helpers: a private, fast folder per feature.
 * Falls back to an in-memory map where OPFS is unavailable (tests, old browsers).
 */
const memory = new Map<string, Blob>()
const ok = () => typeof navigator !== 'undefined' && typeof navigator.storage?.getDirectory === 'function'

async function dir(path: string[], create = true) {
  let d = await navigator.storage.getDirectory()
  for (const p of path) d = await d.getDirectoryHandle(p, { create })
  return d
}
const split = (path: string) => {
  const parts = path.split('/').filter(Boolean)
  return { folders: parts.slice(0, -1), name: parts[parts.length - 1] }
}

export async function opfsWrite(path: string, data: Blob | ArrayBuffer | string) {
  const blob = data instanceof Blob ? data : new Blob([data])
  if (!ok()) { memory.set(path, blob); return }
  const { folders, name } = split(path)
  const fh = await (await dir(folders)).getFileHandle(name, { create: true })
  const w = await fh.createWritable()
  await w.write(blob)
  await w.close()
}

export async function opfsRead(path: string): Promise<Blob | null> {
  if (!ok()) return memory.get(path) ?? null
  try {
    const { folders, name } = split(path)
    return await (await (await dir(folders, false)).getFileHandle(name)).getFile()
  } catch { return null }
}

export async function opfsDelete(path: string) {
  if (!ok()) { memory.delete(path); return }
  try {
    const { folders, name } = split(path)
    await (await dir(folders, false)).removeEntry(name)
  } catch { /* already gone */ }
}

export async function opfsUsage() {
  const e = await navigator.storage?.estimate?.()
  return { used: e?.usage ?? 0, quota: e?.quota ?? 0 }
}
