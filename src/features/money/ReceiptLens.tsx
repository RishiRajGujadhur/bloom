import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Camera, FolderOpen, Sparkles } from 'lucide-react'
import { CapsBadge } from '../../platform/CapsBadge'
import { onLaunchFiles, openFiles } from '../../platform/fsa'
import { opfsWrite } from '../../platform/opfs'
import { burst } from '../../components/ui/celebrate'
import { categories, formatMoney, guessCategory, toMinor, type Txn } from './moneyModel'
import { parseReceipt, type OcrLine, type Parsed } from './receiptModel'
import { getScheduler, laneCount, ocr, onLane, sampleReceipts, toImage, type LaneEvent } from './receiptOcr'

/**
 * Receipt Lens: drop in receipt photos or PDFs (or a whole folder's worth).
 * Tesseract reads them on every core at once; a laser sweeps each receipt,
 * then the shop, date and total light up where they were found and the
 * receipt becomes a Money transaction, with the image kept privately in OPFS.
 */
type Item = {
  id: string
  name: string
  image: Blob
  url: string
  status: 'queued' | 'reading' | 'ready' | 'added' | 'error'
  lines?: OcrLine[]
  size?: { width: number; height: number }
  parsed?: Parsed
  draft?: { place: string; date: string; total: string; category: string }
  error?: string
}
const ACCEPT = { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.heic'], 'application/pdf': ['.pdf'] }
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function Highlights({ item }: { item: Item }) {
  const g = useRef<SVGGElement>(null)
  useLayoutEffect(() => {
    if (!g.current || reduced()) return
    const rects = g.current.querySelectorAll('rect')
    gsap.fromTo(rects, { strokeDasharray: '0 4000', opacity: 0 }, { strokeDasharray: '4000 0', opacity: 1, duration: 0.9, stagger: 0.25, ease: 'power2.out' })
  }, [item.parsed])
  if (!item.parsed || !item.lines || !item.size) return null
  const { hits } = item.parsed
  const boxes = ([['place', hits.place, '#7df9ff'], ['date', hits.date, '#facc15'], ['total', hits.total, '#4ade80']] as const).filter(([, i]) => i >= 0 && item.lines![i]?.bbox)
  return (
    <svg className="rl-overlay" viewBox={`0 0 ${item.size.width} ${item.size.height}`} preserveAspectRatio="none" aria-hidden="true" data-matrix-native>
      <g ref={g}>
        {boxes.map(([k, i, c]) => {
          const b = item.lines![i].bbox!
          return <rect key={k} x={b.x0 - 6} y={b.y0 - 4} width={b.x1 - b.x0 + 12} height={b.y1 - b.y0 + 8} rx="6" fill={`${c}22`} stroke={c} strokeWidth="3" vectorEffect="non-scaling-stroke" />
        })}
      </g>
    </svg>
  )
}

export function ReceiptLens({ code, onAdd }: { code: string; onAdd: (txns: Txn[]) => void }) {
  const [items, setItems] = useState<Item[]>([])
  const [lanes, setLanes] = useState<Record<number, LaneEvent>>({})
  const [warming, setWarming] = useState(false)
  const nLanes = laneCount()
  const itemsRef = useRef(items)
  itemsRef.current = items
  useEffect(() => onLane((e) => setLanes((l) => ({ ...l, [e.lane]: e }))), [])
  useEffect(() => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url)), [])

  const patch = (id: string, p: Partial<Item>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)))

  const add = async (files: File[]) => {
    if (!files.length) return
    setWarming(true)
    const fresh: Item[] = []
    for (const f of files) {
      const image = await toImage(f).catch(() => null)
      if (!image) continue
      fresh.push({ id: crypto.randomUUID(), name: f.name, image, url: URL.createObjectURL(image), status: 'queued' })
    }
    setItems((xs) => [...fresh, ...xs])
    await getScheduler()
    setWarming(false)
    // All receipts go to the scheduler at once; it spreads them over the workers.
    await Promise.all(fresh.map(async (it) => {
      patch(it.id, { status: 'reading' })
      try {
        const { lines, width, height } = await ocr(it.image, it.id)
        const parsed = parseReceipt(lines)
        patch(it.id, {
          status: 'ready',
          lines,
          size: { width, height },
          parsed,
          draft: { place: parsed.place, date: parsed.date ?? new Date().toISOString().slice(0, 10), total: parsed.total?.toFixed(2) ?? '', category: guessCategory(parsed.place) === 'other' ? 'groceries' : guessCategory(parsed.place) },
        })
      } catch (e) {
        patch(it.id, { status: 'error', error: (e as Error).message })
      }
    }))
  }
  useEffect(() => onLaunchFiles((fs) => void add(fs.map((f) => f.file))), []) // eslint-disable-line react-hooks/exhaustive-deps

  const commit = async (list: Item[]) => {
    const txns: Txn[] = []
    for (const it of list) {
      const d = it.draft
      const n = Number(d?.total)
      if (!d || !n || n <= 0) continue
      const id = crypto.randomUUID()
      const path = `receipts/${id}.png`
      await opfsWrite(path, it.image)
      txns.push({ id, date: d.date, amount: toMinor(n), category: d.category, place: d.place.trim() || 'Receipt', receipt: path, note: it.parsed?.items.length ? it.parsed.items.map((x) => x.name).slice(0, 6).join(', ') : undefined })
      patch(it.id, { status: 'added' })
    }
    if (txns.length) {
      onAdd(txns)
      burst(undefined, 'coins')
    }
  }
  const ready = items.filter((i) => i.status === 'ready')
  const busy = items.some((i) => i.status === 'reading' || i.status === 'queued')

  return (
    <section className="rl" aria-label="Receipt Lens">
      <header className="rl-head">
        <div>
          <p className="rl-eyebrow">Receipt Lens</p>
          <h3>Snap it. It becomes a transaction.</h3>
        </div>
        <CapsBadge caps={['mt', 'simd', 'opfs', 'fsa']} />
      </header>
      <div className="rl-actions">
        <button type="button" className="rl-cta" onClick={() => void openFiles('Receipts', ACCEPT, true).then((fs) => add(fs.map((f) => f.file)))}><FolderOpen size={16} /> Scan receipts</button>
        <label className="rl-ghost">
          <Camera size={16} /> Take a photo
          <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => void add([...(e.target.files ?? [])])} />
        </label>
        <button type="button" className="rl-ghost" onClick={() => void sampleReceipts().then(add)}><Sparkles size={16} /> Try sample receipts</button>
        {ready.length > 1 && <button type="button" className="rl-ghost rl-all" onClick={() => void commit(ready)}>Add all {ready.length} to Money</button>}
      </div>
      <svg className="rl-lanes" viewBox={`0 0 600 ${nLanes * 26 + 6}`} role="img" aria-label={`${nLanes} OCR workers`}>
        {Array.from({ length: nLanes }, (_, i) => {
          const l = lanes[i]
          const active = busy && l && l.progress < 1
          const who = items.find((x) => x.id === l?.job)?.name ?? ''
          return (
            <g key={i} transform={`translate(0 ${i * 26 + 4})`}>
              <text x="0" y="14" className="rl-lane-name">core {i + 1}</text>
              <rect x="70" y="4" width="420" height="12" rx="6" className="rl-lane-track" />
              <rect x="70" y="4" width={420 * (active ? l.progress : 0)} height="12" rx="6" className={`rl-lane-fill ${active ? 'on' : ''}`} />
              <text x="500" y="14" className="rl-lane-job">{warming ? 'warming up…' : active ? who.slice(0, 16) : 'idle'}</text>
            </g>
          )
        })}
      </svg>
      {items.length === 0 ? (
        <div className="rl-drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void add([...e.dataTransfer.files]) }}>
          Drop receipt photos or PDFs here. Everything is read on this device; nothing is uploaded.
        </div>
      ) : (
        <ul className="rl-grid">
          {items.map((it) => (
            <li key={it.id} className={`rl-card ${it.status}`}>
              <div className="rl-img" data-matrix-native>
                <img loading="lazy" decoding="async" src={it.url} alt={`Receipt ${it.name}`} />
                {(it.status === 'reading' || it.status === 'queued') && <div className="rl-laser" aria-hidden="true" />}
                <Highlights item={it} />
              </div>
              <div className="rl-form bloom-start-stack">
                {it.status === 'reading' || it.status === 'queued' ? (
                  <p className="rl-status">{it.status === 'queued' ? 'Waiting for a free core…' : 'Reading…'}</p>
                ) : it.status === 'error' ? (
                  <p className="voice-error">{it.error}</p>
                ) : it.draft ? (
                  <>
                    <label><span className="rl-key place">Shop</span><input className="studio-input" value={it.draft.place} disabled={it.status === 'added'} onChange={(e) => patch(it.id, { draft: { ...it.draft!, place: e.target.value } })} /></label>
                    <label><span className="rl-key date">Date</span><input type="date" className="studio-input" value={it.draft.date} disabled={it.status === 'added'} onChange={(e) => patch(it.id, { draft: { ...it.draft!, date: e.target.value } })} /></label>
                    <label><span className="rl-key total">Total</span><input className="studio-input" inputMode="decimal" value={it.draft.total} disabled={it.status === 'added'} onChange={(e) => patch(it.id, { draft: { ...it.draft!, total: e.target.value } })} /></label>
                    <label><span className="rl-key">Category</span>
                      <select className="studio-input" value={it.draft.category} disabled={it.status === 'added'} onChange={(e) => patch(it.id, { draft: { ...it.draft!, category: e.target.value } })}>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                      </select>
                    </label>
                    {it.parsed!.items.length > 0 && (
                      <details className="rl-items">
                        <summary>{it.parsed!.items.length} items</summary>
                        <ul>{it.parsed!.items.map((x, i) => <li key={i}><span>{x.name}</span><b>{formatMoney(toMinor(x.amount), code)}</b></li>)}</ul>
                      </details>
                    )}
                    {it.status === 'added' ? <p className="rl-added">✓ Added to Money</p> : <button type="button" className="rl-cta" onClick={() => void commit([it])}>Add {it.draft.total ? formatMoney(toMinor(Number(it.draft.total) || 0), code) : ''} to Money</button>}
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
