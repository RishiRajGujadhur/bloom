/** Where Daybook pages are kept; shared with search without loading the editor. */
export const DAYBOOK_STORAGE_KEY = 'mindfulness-dashboard-daybook-v1'

const LIFE_KEY = 'bloom-life-tools-v1'
const LIFE_TO_MODE: Record<string, { id: string; title: string }> = {
  decision: { id: 'decision-matrix', title: 'Decision Matrix Journal' },
  boundaries: { id: 'boundary-setting', title: 'Boundary setting' },
  connections: { id: 'connection-check-in', title: 'Connection check-in' },
  reading: { id: 'reading-notes', title: 'Reading notes' },
  writing: { id: 'clear-writing', title: 'Clear writing' },
  shutdown: { id: 'work-shutdown', title: 'Work shutdown' },
  meetings: { id: 'meeting-prep', title: 'Meeting prep' },
}
const human = (k: string) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())

/**
 * Life tools were folded into Daybook journal types. Any saved life records
 * become Daybook pages once (their notes under the first prompt), and the old
 * store is removed. Returns how many pages were created.
 */
export function migrateLifeTools(storage: Storage = localStorage) {
  const raw = storage.getItem(LIFE_KEY)
  if (!raw) return 0
  let records: { id: string; tool: string; title: string; values: Record<string, string>; created: number; updated: number; next?: string }[] = []
  try {
    records = (JSON.parse(raw) as { records?: typeof records }).records ?? []
  } catch {
    return 0
  }
  let pages: unknown[]
  try {
    pages = JSON.parse(storage.getItem(DAYBOOK_STORAGE_KEY) ?? '[]') as unknown[]
  } catch {
    pages = []
  }
  const added = records.map((r) => {
    const mode = LIFE_TO_MODE[r.tool] ?? { id: 'unsent-letter', title: 'Notes' }
    const text = [r.title, ...Object.entries(r.values).filter(([, v]) => v?.trim()).map(([k, v]) => `${human(k)}: ${v}`), r.next ? `Next: ${r.next}` : '']
      .filter(Boolean)
      .join('\n')
    return {
      id: `life-${r.id}`,
      modeId: mode.id,
      modeTitle: mode.title,
      createdAt: new Date(r.created).toISOString(),
      updatedAt: new Date(r.updated).toISOString(),
      content: { 'prompt-0': text, body: text },
    }
  })
  storage.setItem(DAYBOOK_STORAGE_KEY, JSON.stringify([...pages, ...added]))
  storage.removeItem(LIFE_KEY)
  return added.length
}
