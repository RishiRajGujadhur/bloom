import { useMemo, useState } from 'react'
import Fuse from 'fuse.js'
import type { ThemeSettings } from '../../utils/themeEngine'

/**
 * Pick any font installed on your computer (Local Font Access API,
 * queryLocalFonts). Families are listed in their own face, searchable, and
 * applied instantly as Bloom's font — nothing is downloaded or uploaded.
 */
type FontData = { family: string; fullName: string; style: string }
type Query = () => Promise<FontData[]>

export function LocalFontPicker({ settings, onChange }: { settings: ThemeSettings; onChange: (s: ThemeSettings) => void }) {
  const query = (window as unknown as { queryLocalFonts?: Query }).queryLocalFonts
  const [families, setFamilies] = useState<string[]>([])
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')
  const fuse = useMemo(() => new Fuse(families, { threshold: 0.3 }), [families])
  const shown = (q ? fuse.search(q).map((r) => r.item) : families).slice(0, 60)
  if (!query) return <p className="lf-note">Using a font from your computer needs Chrome or Edge on desktop (Local Font Access).</p>

  const load = async () => {
    setErr('')
    try {
      const fonts = await query()
      setFamilies([...new Set(fonts.map((f) => f.family))].sort((a, b) => a.localeCompare(b)))
    } catch (e) {
      setErr((e as Error).name === 'NotAllowedError' ? 'Font access was not allowed.' : 'Your fonts could not be read.')
    }
  }
  return (
    <div className="lf">
      <div className="lf-head">
        <strong>Your computer’s fonts</strong>
        {settings.localFont && <span className="lf-current">Using <b style={{ fontFamily: `"${settings.localFont}"` }}>{settings.localFont}</b> <button type="button" onClick={() => onChange({ ...settings, fontId: 'system', localFont: undefined })}>Reset</button></span>}
      </div>
      {!families.length ? (
        <button type="button" className="lf-load" onClick={() => void load()}>🔤 Browse installed fonts</button>
      ) : (
        <>
          <input className="lf-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${families.length} fonts…`} aria-label="Search installed fonts" />
          <div className="lf-grid" role="listbox" aria-label="Installed fonts">
            {shown.map((f) => (
              <button key={f} type="button" data-own-font role="option" aria-selected={settings.localFont === f} className={settings.localFont === f ? 'on' : ''} style={{ fontFamily: `"${f}", system-ui` }} onClick={() => onChange({ ...settings, fontId: 'local', localFont: f })}>
                <span>{f}</span>
                <small>The quick brown fox</small>
              </button>
            ))}
          </div>
        </>
      )}
      {err && <p className="lf-note">{err}</p>}
    </div>
  )
}
