/**
 * File System Access: open and save real files on disk, and receive files the
 * OS opens with the installed app (manifest file_handlers + launchQueue).
 * Falls back to <input type=file> and a download link.
 */
type Accept = Record<string, string[]>
type Pickers = {
  showOpenFilePicker?: (o: unknown) => Promise<FileSystemFileHandle[]>
  showSaveFilePicker?: (o: unknown) => Promise<FileSystemFileHandle>
  showDirectoryPicker?: (o?: unknown) => Promise<FileSystemDirectoryHandle>
}
const w = () => window as unknown as Pickers

export type Opened = { file: File; handle: FileSystemFileHandle | null }

export async function openFiles(description: string, accept: Accept, multiple = false): Promise<Opened[]> {
  const pick = w().showOpenFilePicker
  if (pick) {
    try {
      const hs = await pick({ multiple, types: [{ description, accept }] })
      return Promise.all(hs.map(async (h) => ({ file: await h.getFile(), handle: h })))
    } catch (e) {
      if ((e as Error).name === 'AbortError') return []
      throw e
    }
  }
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = multiple
    input.accept = Object.values(accept).flat().join(',')
    input.onchange = () => resolve([...(input.files ?? [])].map((file) => ({ file, handle: null })))
    input.click()
  })
}

/** Writes back to the same file when we have its handle, otherwise asks where (or downloads). */
export async function saveFile(blob: Blob, suggestedName: string, accept: Accept, handle?: FileSystemFileHandle | null) {
  try {
    const save = w().showSaveFilePicker
    const h = handle ?? (save ? await save({ suggestedName, types: [{ description: 'File', accept }] }) : null)
    if (h) {
      const perm = (h as unknown as { requestPermission?: (o: unknown) => Promise<string> }).requestPermission
      if (perm && (await perm.call(h, { mode: 'readwrite' })) !== 'granted') return false
      const wr = await h.createWritable()
      await wr.write(blob)
      await wr.close()
      return true
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return false
    throw e
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = suggestedName
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  return true
}

export async function pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
  const pick = w().showDirectoryPicker
  if (!pick) return null
  try { return await pick({ mode: 'read' }) } catch { return null }
}

/** Files handed to the installed app by the OS (manifest file_handlers). */
export function onLaunchFiles(cb: (files: Opened[]) => void) {
  type LQ = { setConsumer: (f: (p: { files: FileSystemFileHandle[] }) => void) => void }
  const lq = (window as unknown as { launchQueue?: LQ }).launchQueue
  lq?.setConsumer(async (params) => {
    if (!params.files?.length) return
    cb(await Promise.all(params.files.map(async (h) => ({ file: await h.getFile(), handle: h }))))
  })
}
