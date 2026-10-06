import { useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { AppData } from '../../model'

/**
 * Trust layer (QoL 221–223, 229–230, 241, 249):
 * - Anything deleted (habits, to-dos, calendar blocks, projects) lands in a
 *   30-day Trash, detected at the data level so every page gets it for free,
 *   with an Undo toast (pauses while hovered, Esc dismisses).
 * - A storage-nearly-full warning, and a quiet "Copied" confirmation.
 */
type Kind = 'habits' | 'todos' | 'calendarBlocks' | 'projects'
export type Trashed = { id: string; kind: Kind; at: number; label: string; item: unknown }
const KINDS: Kind[] = ['habits', 'todos', 'calendarBlocks', 'projects']
const LABEL: Record<Kind, string> = { habits: 'habit', todos: 'to-do', calendarBlocks: 'calendar block', projects: 'project' }
export const TRASH_KEY = 'bloom-trash'
const DAYS = 30

export function readTrash(): Trashed[] {
  try {
    const all = JSON.parse(localStorage.getItem(TRASH_KEY) ?? '[]') as Trashed[]
    return all.filter((t) => Date.now() - t.at < DAYS * 864e5)
  } catch { return [] }
}
const writeTrash = (t: Trashed[]) => { try { localStorage.setItem(TRASH_KEY, JSON.stringify(t.slice(0, 200))) } catch { /* optional */ } }

export function restoreTrashed(t: Trashed, setData: Dispatch<SetStateAction<AppData>>) {
  setData((d) => {
    const list = (d[t.kind] as unknown as { id: string }[]) ?? []
    if (list.some((x) => x.id === (t.item as { id: string }).id)) return d
    return { ...d, [t.kind]: [...list, t.item] } as AppData
  })
  writeTrash(readTrash().filter((x) => x.id !== t.id))
  window.dispatchEvent(new Event('bloom:trash'))
}

export function TrashAndSync({ data, setData }: { data: AppData; setData: Dispatch<SetStateAction<AppData>> }) {
  const prev = useRef<Record<Kind, Map<string, unknown>> | null>(null)
  const [toast, setToast] = useState<{ items: Trashed[] } | null>(null)
  const [hover, setHover] = useState(false)
  const [warn, setWarn] = useState('')
  const [copied, setCopied] = useState(false)

  // Changes adopted from another tab aren't deletions made here.
  const remoteSync = useRef(false)
  useEffect(() => {
    const on = () => { remoteSync.current = true }
    window.addEventListener('bloom:remote-sync', on)
    return () => window.removeEventListener('bloom:remote-sync', on)
  }, [])
  // Detect deletions by diffing ids between renders.
  useEffect(() => {
    const now: Record<Kind, Map<string, unknown>> = Object.fromEntries(KINDS.map((k) => [k, new Map(((data[k] as unknown as { id: string }[]) ?? []).map((x) => [x.id, x]))])) as Record<Kind, Map<string, unknown>>
    const before = prev.current
    prev.current = now
    if (!before) return
    if (remoteSync.current) { remoteSync.current = false; return }
    const gone: Trashed[] = []
    for (const k of KINDS) for (const [id, item] of before[k]) if (!now[k].has(id)) {
      const it = item as { title?: string; name?: string }
      gone.push({ id: `${k}-${id}-${Date.now()}`, kind: k, at: Date.now(), label: it.title ?? it.name ?? LABEL[k], item })
    }
    // Bulk resets (e.g. importing a backup) aren't "deletes".
    if (!gone.length || gone.length > 25) return
    writeTrash([...gone, ...readTrash()])
    setToast({ items: gone })
    window.dispatchEvent(new Event('bloom:trash'))
  }, [data])

  useEffect(() => {
    if (!toast || hover) return
    const t = setTimeout(() => setToast(null), 8000)
    return () => clearTimeout(t)
  }, [toast, hover])
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setToast(null) }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [])

  // Storage nearly full, checked on load and hourly.
  useEffect(() => {
    const check = async () => {
      const e = await navigator.storage?.estimate?.()
      if (e?.quota && e.usage && e.usage / e.quota > 0.85) setWarn(`Storage is ${Math.round((e.usage / e.quota) * 100)}% full — export a backup or clear old recordings in Settings.`)
    }
    void check()
    const t = setInterval(() => void check(), 3600_000)
    return () => clearInterval(t)
  }, [])

  // "Copied" confirmation for any copy action in the app.
  useEffect(() => {
    let timer = 0
    const onCopy = () => { setCopied(true); clearTimeout(timer); timer = window.setTimeout(() => setCopied(false), 1400) }
    document.addEventListener('copy', onCopy)
    return () => { document.removeEventListener('copy', onCopy); clearTimeout(timer) }
  }, [])

  return (
    <>
      {toast && (
        <div className="trash-toast" role="status" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
          <span>🗑 Deleted {toast.items.length === 1 ? `“${toast.items[0].label}”` : `${toast.items.length} items`} — kept in Trash for 30 days.</span>
          <button type="button" onClick={() => { toast.items.forEach((t) => restoreTrashed(t, setData)); setToast(null) }}>Undo</button>
          <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}>✕</button>
        </div>
      )}
      {warn && <div className="storage-warn" role="alert"><span>⚠ {warn}</span><button type="button" onClick={() => setWarn('')} aria-label="Dismiss">✕</button></div>}
      {copied && <div className="copied-toast" role="status">✓ Copied</div>}
    </>
  )
}

/** Settings → Trash: everything deleted in the last 30 days, restorable. */
export function TrashList({ setData }: { setData: Dispatch<SetStateAction<AppData>> }) {
  const [items, setItems] = useState(readTrash)
  useEffect(() => {
    const r = () => setItems(readTrash())
    window.addEventListener('bloom:trash', r)
    return () => window.removeEventListener('bloom:trash', r)
  }, [])
  if (!items.length) return <p className="trash-empty">Trash is empty. Deleted habits, to-dos and calendar blocks stay here for 30 days.</p>
  return (
    <ul className="trash-list bloom-list">
      {items.slice(0, 40).map((t) => (
        <li key={t.id}>
          <span><b>{t.label}</b><small>{LABEL[t.kind]} · deleted {new Date(t.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</small></span>
          <button type="button" onClick={() => restoreTrashed(t, setData)}>Restore</button>
        </li>
      ))}
      <li className="trash-actions"><button type="button" onClick={() => { writeTrash([]); setItems([]) }}>Empty trash</button></li>
    </ul>
  )
}
