import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Camera, FileDown, FolderOpen, Search, Sparkles, Trash2 } from 'lucide-react'
import { CapsBadge } from '../../platform/CapsBadge'
import { openFiles, saveFile } from '../../platform/fsa'
import { opfsDelete, opfsRead, opfsWrite } from '../../platform/opfs'
import { burst } from '../../components/ui/celebrate'
import { formatMoney, toMinor, type Txn } from './moneyModel'
import { answer, daysUntil, parseBill, type Bill } from './billsModel'
import { ask, embed } from './billsSearch'
import { flatten, sampleBillPhoto, searchablePdf } from './billsVision'
import { ocr, toImage } from './receiptOcr'

/**
 * Bills Inbox: photograph a letter or bill. OpenCV (Wasm) finds the page and
 * flattens it, Tesseract reads it on a free core, and the amount and due date
 * become an upcoming bill with a countdown. Ask questions about your paperwork;
 * answers come from on-device semantic search. Save a searchable PDF to disk.
 */
type Scan = { id: string; photo: string; corners: { x: number; y: number }[] | null; size: { w: number; h: number }; page?: string; stage: 'finding' | 'reading' | 'done' | 'error'; error?: string }
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const ACCEPT = { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'], 'application/pdf': ['.pdf'] }

function ScanStage({ scan }: { scan: Scan }) {
  const poly = useRef<SVGPolygonElement>(null)
  const dots = useRef<SVGGElement>(null)
  const flat = useRef<HTMLImageElement>(null)
  useLayoutEffect(() => {
    if (!scan.corners || reduced()) return
    const tl = gsap.timeline()
    if (dots.current) tl.fromTo(dots.current.children, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.4, stagger: 0.12, ease: 'back.out(3)' })
    if (poly.current) {
      const len = poly.current.getTotalLength?.() || 3000
      tl.fromTo(poly.current, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' })
    }
    return () => { tl.kill() }
  }, [scan.corners])
  useLayoutEffect(() => {
    if (!scan.page || !flat.current || reduced()) return
    gsap.fromTo(flat.current, { opacity: 0, rotateX: 25, scale: 0.85 }, { opacity: 1, rotateX: 0, scale: 1, duration: 0.9, ease: 'power3.out' })
  }, [scan.page])
  const pts = scan.corners?.map((c) => `${c.x},${c.y}`).join(' ')
  return (
    <div className="bi-stage" data-matrix-native>
      <div className="bi-photo">
        <img src={scan.photo} alt="Photo of the letter" />
        <svg viewBox={`0 0 ${scan.size.w} ${scan.size.h}`} preserveAspectRatio="none" aria-hidden="true">
          {pts && <polygon ref={poly} points={pts} className="bi-poly" vectorEffect="non-scaling-stroke" />}
          <g ref={dots}>{scan.corners?.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={Math.max(8, scan.size.w / 90)} className="bi-corner" />)}</g>
        </svg>
        {scan.stage === 'finding' && <div className="bi-scan" />}
      </div>
      <div className="bi-arrow" aria-hidden="true">→</div>
      <div className="bi-flat">
        {scan.page ? <img ref={flat} src={scan.page} alt="Flattened page" /> : <span>{scan.stage === 'error' ? scan.error : 'Finding the page…'}</span>}
        {scan.stage === 'reading' && <div className="bi-scan" />}
      </div>
    </div>
  )
}

function Countdown({ days }: { days: number }) {
  const arc = useRef<SVGCircleElement>(null)
  const frac = Math.max(0, Math.min(1, days / 30))
  const C = 2 * Math.PI * 26
  const color = days < 0 ? '#ef4444' : days <= 3 ? '#f97316' : days <= 10 ? '#facc15' : '#4ade80'
  useLayoutEffect(() => {
    if (!arc.current || reduced()) return
    gsap.fromTo(arc.current, { strokeDashoffset: C }, { strokeDashoffset: C * (1 - frac), duration: 1.2, ease: 'power3.out' })
  }, [frac, C])
  return (
    <svg className="bi-count" viewBox="0 0 64 64" data-matrix-native role="img" aria-label={days < 0 ? `${-days} days overdue` : `${days} days left`}>
      <circle cx="32" cy="32" r="26" className="bi-count-track" />
      <circle ref={arc} cx="32" cy="32" r="26" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform="rotate(-90 32 32)" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      <text x="32" y="34" textAnchor="middle" className="bi-count-n">{Math.abs(days)}</text>
      <text x="32" y="45" textAnchor="middle" className="bi-count-u">{days < 0 ? 'late' : days === 1 ? 'day' : 'days'}</text>
    </svg>
  )
}

export function BillsInbox({ code, bills, onBills, onPaid }: { code: string; bills: Bill[]; onBills: (f: (b: Bill[]) => Bill[]) => void; onPaid: (t: Txn) => void }) {
  const [scans, setScans] = useState<Scan[]>([])
  const [q, setQ] = useState('')
  const [reply, setReply] = useState<{ text: string; bill: Bill | null; semantic: boolean } | null>(null)
  const [asking, setAsking] = useState(false)
  const replyEl = useRef<HTMLParagraphElement>(null)
  const fmt = (n: number) => formatMoney(toMinor(n), code)
  const patch = (id: string, p: Partial<Scan>) => setScans((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)))
  useEffect(() => () => scans.forEach((s) => { URL.revokeObjectURL(s.photo); if (s.page) URL.revokeObjectURL(s.page) }), []) // eslint-disable-line react-hooks/exhaustive-deps

  const scan = async (files: File[]) => {
    for (const f of files) {
      const id = crypto.randomUUID()
      const img = await toImage(f)
      const bmp = await createImageBitmap(img)
      const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
      const size = { w: Math.round(bmp.width * scale), h: Math.round(bmp.height * scale) }
      bmp.close()
      setScans((xs) => [{ id, photo: URL.createObjectURL(img), corners: null, size, stage: 'finding' }, ...xs])
      try {
        const { page, corners } = await flatten(img)
        patch(id, { corners, page: URL.createObjectURL(page), stage: 'reading' })
        const { lines } = await ocr(page, id)
        const text = lines.map((l) => l.text).join('\n')
        const parsed = parseBill(text)
        const path = `bills/${id}.png`
        await opfsWrite(path, page)
        const embedding = (await embed(`${parsed.biller}\n${text}`)) ?? undefined
        const bill: Bill = { ...parsed, id, scannedAt: Date.now(), image: path, embedding }
        // The OCR lines are kept only long enough to build the searchable PDF on request.
        pdfLines.current.set(id, lines)
        onBills((bs) => [bill, ...bs])
        patch(id, { stage: 'done' })
        burst(undefined, 'stars')
      } catch (e) {
        patch(id, { stage: 'error', error: (e as Error).message })
      }
    }
  }
  const pdfLines = useRef(new Map<string, Awaited<ReturnType<typeof ocr>>['lines']>())

  const exportPdf = async (b: Bill) => {
    const img = await opfsRead(b.image)
    if (!img) return
    const lines = pdfLines.current.get(b.id) ?? (await ocr(img, `pdf-${b.id}`)).lines
    const pdf = await searchablePdf(img, lines, `${b.biller} ${b.due ?? b.renews ?? ''}`.trim())
    await saveFile(pdf, `${b.biller.replace(/[^\w -]+/g, '').trim() || 'bill'} ${b.due ?? b.renews ?? ''}.pdf`.trim(), { 'application/pdf': ['.pdf'] })
  }
  const pay = (b: Bill) => {
    if (b.amount == null) return
    onPaid({ id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), amount: toMinor(b.amount), category: 'home', place: b.biller, note: 'Paid from Bills Inbox', receipt: b.image })
    onBills((bs) => bs.map((x) => (x.id === b.id ? { ...x, paid: true } : x)))
    burst(undefined, 'coins')
  }
  const remove = (b: Bill) => { onBills((bs) => bs.filter((x) => x.id !== b.id)); void opfsDelete(b.image) }

  const doAsk = async () => {
    if (!q.trim()) return
    setAsking(true)
    const hit = await ask(q, bills)
    setReply(hit ? { text: answer(q, hit.bill, fmt), bill: hit.bill, semantic: hit.semantic } : { text: 'I couldn’t find a letter or bill about that yet. Scan it and ask again.', bill: null, semantic: false })
    setAsking(false)
  }
  useLayoutEffect(() => {
    const el = replyEl.current
    if (!el || !reply || reduced()) return
    const full = reply.text
    const o = { n: 0 }
    const t = gsap.to(o, { n: full.length, duration: Math.min(1.6, full.length / 60), ease: 'none', onUpdate: () => { el.textContent = full.slice(0, Math.round(o.n)) } })
    return () => { t.kill(); el.textContent = full }
  }, [reply])

  const upcoming = [...bills].filter((b) => !b.paid).sort((a, b) => (a.due ?? a.renews ?? '9999').localeCompare(b.due ?? b.renews ?? '9999'))
  return (
    <section className="bi" aria-label="Bills Inbox">
      <header className="rl-head">
        <div>
          <p className="rl-eyebrow">Bills inbox</p>
          <h3>Paper in. Deadlines out.</h3>
        </div>
        <CapsBadge caps={['simd', 'mt', 'gpu', 'opfs', 'fsa']} />
      </header>
      <div className="rl-actions">
        <button type="button" className="rl-cta" onClick={() => void openFiles('Bills and letters', ACCEPT, true).then((fs) => scan(fs.map((f) => f.file)))}><FolderOpen size={16} /> Scan a bill</button>
        <label className="rl-ghost"><Camera size={16} /> Photograph a letter<input type="file" accept="image/*" capture="environment" hidden onChange={(e) => void scan([...(e.target.files ?? [])])} /></label>
        <button type="button" className="rl-ghost" onClick={() => void Promise.all([sampleBillPhoto(0), sampleBillPhoto(1)]).then(scan)}><Sparkles size={16} /> Try sample letters</button>
      </div>
      {scans.slice(0, 1).map((s) => <ScanStage key={s.id} scan={s} />)}
      <form className="bi-ask" onSubmit={(e) => { e.preventDefault(); void doAsk() }}>
        <Search size={16} aria-hidden="true" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask your paperwork… e.g. When does my car insurance renew?" aria-label="Ask about your bills" />
        <button type="submit" className="rl-cta" disabled={asking || !bills.length}>{asking ? 'Thinking…' : 'Ask'}</button>
      </form>
      {reply && (
        <div className="bi-reply">
          <p ref={replyEl}>{reply.text}</p>
          <small>{reply.semantic ? 'Found by on-device semantic search (MiniLM + Orama).' : 'Found by keyword match.'}</small>
        </div>
      )}
      {upcoming.filter((b) => b.amount != null).length > 1 && (
        <button
          type="button"
          className="rl-ghost"
          onClick={() => {
            const due = upcoming.filter((b) => b.amount != null)
            if (window.confirm(`Mark all ${due.length} bills as paid and log them as spending?`)) due.forEach(pay)
          }}
        >
          ✓ Mark all paid
        </button>
      )}
      {upcoming.length > 0 ? (
        <ul className="bi-list">
          {upcoming.map((b) => {
            const when = b.due ?? b.renews
            return (
              <li key={b.id} className="bi-bill">
                {when ? <Countdown days={daysUntil(when)} /> : <span className="bi-count bi-none">✉️</span>}
                <div className="bi-main">
                  <strong>{b.biller}</strong>
                  <small>{b.kind === 'renewal' ? `Renews ${when}` : when ? `Due ${when}` : 'Letter'}{b.reference ? ` · ${b.reference}` : ''}</small>
                </div>
                <b className="bi-amt">{b.amount != null ? fmt(b.amount) : '—'}</b>
                <div className="bi-acts">
                  {b.amount != null && <button type="button" className="rl-ghost" onClick={() => pay(b)}>Mark paid</button>}
                  <button type="button" className="rl-ghost" onClick={() => void exportPdf(b)} aria-label={`Save ${b.biller} as a searchable PDF`}><FileDown size={15} /> PDF</button>
                  <button type="button" className="rl-ghost" onClick={() => remove(b)} aria-label={`Remove ${b.biller}`}><Trash2 size={15} /></button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="rl-status">No bills yet. Scan a letter and its deadline appears here with a countdown.</p>
      )}
    </section>
  )
}
