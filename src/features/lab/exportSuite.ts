import { db, journalText } from '../../search/db'
import { DAYBOOK_STORAGE_KEY } from '../../components/daybook/storage'

const safe = (s: string) => s.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'untitled'

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Zero lock-in backup: every Bloom value from this browser as JSON, each
 * Daybook page as Markdown, and voice memos with their transcripts.
 */
export async function buildBackupZip() {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const store: Record<string, unknown> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    const raw = localStorage.getItem(key)
    try {
      store[key] = JSON.parse(raw ?? 'null')
    } catch {
      store[key] = raw
    }
  }
  zip.file('bloom-data.json', JSON.stringify({ exportedAt: new Date().toISOString(), store }, null, 2))

  const pages = Array.isArray(store[DAYBOOK_STORAGE_KEY]) ? (store[DAYBOOK_STORAGE_KEY] as { id: string; modeTitle: string; createdAt: string; content: unknown }[]) : []
  const md = zip.folder('daybook')!
  for (const p of pages)
    md.file(`${p.createdAt.slice(0, 10)}-${safe(p.modeTitle)}-${p.id.slice(0, 6)}.md`, `# ${p.modeTitle}\n\n_${new Date(p.createdAt).toLocaleString()}_\n\n${journalText(p.content)}\n`)

  try {
    const memos = await db.voice_memos.toArray()
    const voice = zip.folder('voice')!
    for (const m of memos) {
      const ext = m.mimeType.includes('ogg') ? 'ogg' : m.mimeType.includes('mp4') ? 'm4a' : 'webm'
      const base = `${new Date(m.createdAt).toISOString().slice(0, 10)}-${safe(m.title)}`
      voice.file(`${base}.${ext}`, m.blob)
      if (m.transcript) voice.file(`${base}.txt`, m.transcript)
    }
    const attachments = await db.journal_attachments.toArray()
    const media = zip.folder('attachments')!
    for (const a of attachments) media.file(`${a.id}-${safe(a.name)}`, a.blob)
  } catch {
    /* IndexedDB unavailable: the JSON and Markdown are still complete. */
  }
  zip.file('README.txt', 'Bloom backup. bloom-data.json holds every setting and log; daybook/ has your pages as Markdown; voice/ has recordings and transcripts.\n')
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
}
