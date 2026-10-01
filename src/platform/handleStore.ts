/**
 * Remembers File System Access handles (folders/files) in IndexedDB so a page
 * can offer "Reopen <name>" next time. Handles are structured-cloneable; the
 * browser still asks for permission again before reading.
 */
const DB = 'bloom-handles'
const STORE = 'handles'

function open(): Promise<IDBDatabase> {
  return new Promise((ok, fail) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => ok(req.result)
    req.onerror = () => fail(req.error)
  })
}

export async function saveHandle(key: string, handle: FileSystemHandle) {
  try {
    const db = await open()
    await new Promise<void>((ok, fail) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(handle, key)
      tx.oncomplete = () => ok()
      tx.onerror = () => fail(tx.error)
    })
  } catch {
    /* optional convenience */
  }
}

export async function loadHandle<T extends FileSystemHandle>(key: string): Promise<T | null> {
  try {
    const db = await open()
    return await new Promise<T | null>((ok) => {
      const req = db.transaction(STORE).objectStore(STORE).get(key)
      req.onsuccess = () => ok((req.result as T) ?? null)
      req.onerror = () => ok(null)
    })
  } catch {
    return null
  }
}

/** Asks (from a click) to read the handle again; true when allowed. */
export async function regrant(handle: FileSystemHandle) {
  const h = handle as FileSystemHandle & { queryPermission?: (o: object) => Promise<string>; requestPermission?: (o: object) => Promise<string> }
  if ((await h.queryPermission?.({ mode: 'read' })) === 'granted') return true
  return (await h.requestPermission?.({ mode: 'read' })) === 'granted'
}
