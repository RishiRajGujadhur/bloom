import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Download, Eraser, Film, Highlighter, Lightbulb, Pen, Plus, Redo2, Trash2, Undo2 } from 'lucide-react'
import { Segmented, Slider, Studio, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { dayKey } from '../../dates'
import { INK_KEY, colors, hit, pathFor, promptFor, push, redo, undo, type History, type Page, type Paper, type Stroke, type Tool } from './inkModel'
import './ink.css'

const on = (id: string) => subOn('inkJournal', id)
type Store = { pages: Page[]; current: string; color: string; size: number }
const W = 900
const H = 1200
const newPage = (): Page => ({ id: crypto.randomUUID(), date: dayKey(), paper: 'lined', strokes: [], prompt: promptFor(dayKey()) })

function PaperBg({ kind }: { kind: Paper }) {
  if (kind === 'blank') return null
  return (
    <g className="ink-paper">
      {kind === 'lined' && Array.from({ length: 36 }, (_, i) => <line key={i} x1="40" x2={W - 40} y1={120 + i * 30} y2={120 + i * 30} />)}
      {kind === 'dotted' && Array.from({ length: 38 * 28 }, (_, i) => <circle key={i} cx={40 + (i % 28) * 30} cy={60 + Math.floor(i / 28) * 30} r="1.6" />)}
      {kind === 'grid' && (
        <>
          {Array.from({ length: 29 }, (_, i) => <line key={`v${i}`} x1={30 + i * 30} x2={30 + i * 30} y1="0" y2={H} />)}
          {Array.from({ length: 40 }, (_, i) => <line key={`h${i}`} x1="0" x2={W} y1={30 + i * 30} y2={30 + i * 30} />)}
        </>
      )}
    </g>
  )
}

export function InkPage() {
  const [store, setStoreState] = useState<Store>(() => {
    const s = readStore<Store>(INK_KEY, { pages: [], current: '', color: colors[0], size: 8 })
    if (!s.pages.length) {
      const p = newPage()
      return { ...s, pages: [p], current: p.id }
    }
    return s
  })
  const setStore = (fn: (s: Store) => Store) =>
    setStoreState((c) => {
      const n = fn(c)
      writeStore(INK_KEY, n)
      return n
    })
  const page = store.pages.find((p) => p.id === store.current) ?? store.pages[store.pages.length - 1]
  const [tool, setTool] = useState<Tool>('pen')
  const [draft, setDraft] = useState<Stroke | null>(null)
  const [history, setHistory] = useState<History>({ past: [], future: [] })
  const [replaying, setReplaying] = useState<number | null>(null)
  const svg = useRef<SVGSVGElement>(null)

  const setStrokes = (strokes: Stroke[], record = true) => {
    if (record) setHistory((h) => push(h, page.strokes))
    setStore((s) => ({ ...s, pages: s.pages.map((p) => (p.id === page.id ? { ...p, strokes } : p)) }))
  }
  const point = (e: PointerEvent): [number, number, number] => {
    const r = svg.current!.getBoundingClientRect()
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H, e.pressure || 0.5]
  }
  const down = (e: PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = point(e)
    if (tool === 'eraser') {
      const ids = hit(page.strokes, p[0], p[1], store.size * 2)
      if (ids.length) setStrokes(page.strokes.filter((s) => !ids.includes(s.id)))
      setDraft({ id: 'eraser', tool, color: '', size: store.size, points: [p], t0: Date.now() })
      return
    }
    setDraft({ id: crypto.randomUUID(), tool, color: store.color, size: store.size, points: [p], t0: Date.now() })
  }
  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (!draft) return
    const p = point(e)
    if (draft.tool === 'eraser') {
      const ids = hit(page.strokes, p[0], p[1], store.size * 2)
      if (ids.length) setStrokes(page.strokes.filter((s) => !ids.includes(s.id)), false)
      return
    }
    setDraft({ ...draft, points: [...draft.points, p] })
  }
  const up = () => {
    if (draft && draft.tool !== 'eraser' && draft.points.length > 1) {
      setStrokes([...page.strokes, draft])
      if (page.strokes.length === 0) logActivity('ink')
    }
    setDraft(null)
  }
  const doUndo = () => {
    const r = undo(history, page.strokes)
    if (r) {
      setHistory(r.history)
      setStrokes(r.strokes, false)
    }
  }
  const doRedo = () => {
    const r = redo(history, page.strokes)
    if (r) {
      setHistory(r.history)
      setStrokes(r.strokes, false)
    }
  }
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest?.('input, textarea, select')
      if (!typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const key = e.key.toLowerCase()
        // Claimed with preventDefault so the sidebar's "[" collapse doesn't also fire.
        const act = key === 'p' ? () => setTool('pen')
          : key === 'h' && on('highlighter') ? () => setTool('marker')
          : key === 'e' && on('eraser') ? () => setTool('eraser')
          : key === '[' ? () => setStore((s) => ({ ...s, size: Math.max(2, s.size - 2) }))
          : key === ']' ? () => setStore((s) => ({ ...s, size: Math.min(24, s.size + 2) }))
          : null
        if (act) {
          e.preventDefault()
          act()
        }
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        doRedo()
        return
      }
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z') return
      e.preventDefault()
      if (e.shiftKey) doRedo()
      else doUndo()
    }
    window.addEventListener('keydown', k, true)
    return () => window.removeEventListener('keydown', k, true)
  })

  // Replay: reveal strokes one by one, each drawn point by point.
  useEffect(() => {
    if (replaying === null) return
    const total = page.strokes.reduce((t, s) => t + s.points.length, 0)
    if (replaying >= total) {
      const t = setTimeout(() => setReplaying(null), 800)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setReplaying((r) => (r ?? 0) + 3), 16)
    return () => clearTimeout(t)
  }, [replaying, page.strokes])
  const visible = (() => {
    if (replaying === null) return page.strokes
    let left = replaying
    const out: Stroke[] = []
    for (const s of page.strokes) {
      if (left <= 0) break
      out.push({ ...s, points: s.points.slice(0, Math.max(2, left)) })
      left -= s.points.length
    }
    return out
  })()

  const exportPng = async () => {
    const el = svg.current
    if (!el) return
    const xml = new XMLSerializer().serializeToString(el)
    const img = new Image()
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`
    await img.decode()
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    const g = c.getContext('2d')!
    g.fillStyle = '#fffdf8'
    g.fillRect(0, 0, W, H)
    g.drawImage(img, 0, 0, W, H)
    const a = document.createElement('a')
    a.href = c.toDataURL('image/png')
    a.download = `bloom-ink-${page.date}.png`
    a.click()
  }

  const draw = () => (
    <div className="ink-layout">
      <div className="ink-tools studio-card">
        <div className="ink-toolrow" role="radiogroup" aria-label="Tool">
          <button type="button" role="radio" aria-checked={tool === 'pen'} aria-label="Pen" title="Pen (P)" onClick={() => setTool('pen')}>
            <Pen size={18} />
          </button>
          {on('highlighter') && (
            <button type="button" role="radio" aria-checked={tool === 'marker'} aria-label="Highlighter" title="Highlighter (H)" onClick={() => setTool('marker')}>
              <Highlighter size={18} />
            </button>
          )}
          {on('eraser') && (
            <button type="button" role="radio" aria-checked={tool === 'eraser'} aria-label="Eraser" title="Eraser (E)" onClick={() => setTool('eraser')}>
              <Eraser size={18} />
            </button>
          )}
        </div>
        {on('colours') && (
          <div className="ink-colors" role="radiogroup" aria-label="Colour">
            {colors.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={store.color === c} aria-label={`Colour ${c}`} style={{ background: c }} onClick={() => setStore((s) => ({ ...s, color: c }))} />
            ))}
          </div>
        )}
        <Slider label="Thickness" value={store.size} min={2} max={24} compact onChange={(v) => setStore((s) => ({ ...s, size: v }))} />
        {on('undo') && (
          <div className="ink-toolrow">
            <button type="button" aria-label="Undo" onClick={doUndo} disabled={!history.past.length}>
              <Undo2 size={18} />
            </button>
            <button type="button" aria-label="Redo" onClick={doRedo} disabled={!history.future.length}>
              <Redo2 size={18} />
            </button>
            <button type="button" aria-label="Clear page" onClick={() => setStrokes([])} disabled={!page.strokes.length}>
              <Trash2 size={18} />
            </button>
          </div>
        )}
        {on('paper') && <Segmented label="Paper" value={page.paper} onChange={(p) => setStore((s) => ({ ...s, pages: s.pages.map((x) => (x.id === page.id ? { ...x, paper: p } : x)) }))} options={[{ id: 'blank', label: 'Blank' }, { id: 'lined', label: 'Lined' }, { id: 'dotted', label: 'Dots' }, { id: 'grid', label: 'Grid' }]} />}
        <div className="ink-toolrow">
          {on('replay') && (
            <button type="button" aria-label="Replay drawing" onClick={() => setReplaying(0)} disabled={!page.strokes.length}>
              <Film size={18} />
            </button>
          )}
          {on('export') && (
            <button type="button" aria-label="Export PNG" onClick={() => void exportPng()}>
              <Download size={18} />
            </button>
          )}
        </div>
        {on('prompts') && page.prompt && (
          <p className="ink-prompt">
            <Lightbulb size={14} /> {page.prompt}
          </p>
        )}
      </div>
      <div className="ink-sheet-wrap">
        <svg
          ref={svg}
          className="ink-sheet"
          viewBox={`0 0 ${W} ${H}`}
          data-tool={tool}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          role="img"
          aria-label="Drawing page"
        >
          <rect width={W} height={H} fill="#fffdf8" />
          <PaperBg kind={page.paper} />
          {visible.map((s) => (
            <path key={s.id} d={pathFor(s)} fill={s.color} opacity={s.tool === 'marker' ? 0.35 : 1} />
          ))}
          {draft && draft.tool !== 'eraser' && <path d={pathFor(draft, false)} fill={draft.color} opacity={draft.tool === 'marker' ? 0.35 : 1} />}
        </svg>
      </div>
    </div>
  )

  const pagesTab = () => (
    <div className="ink-pages">
      <button
        type="button"
        className="ink-thumb ink-new"
        onClick={() => {
          const p = newPage()
          setStore((s) => ({ ...s, pages: [...s.pages, p], current: p.id }))
          setHistory({ past: [], future: [] })
        }}
      >
        <Plus size={28} /> New page
      </button>
      {[...store.pages].reverse().map((p) => (
        <button
          key={p.id}
          type="button"
          className="ink-thumb"
          data-on={p.id === page.id}
          onClick={() => {
            setStore((s) => ({ ...s, current: p.id }))
            setHistory({ past: [], future: [] })
          }}
        >
          <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
            <rect width={W} height={H} fill="#fffdf8" />
            {p.strokes.map((s) => (
              <path key={s.id} d={pathFor(s)} fill={s.color} opacity={s.tool === 'marker' ? 0.35 : 1} />
            ))}
          </svg>
          <small>{p.date}</small>
        </button>
      ))}
    </div>
  )

  return (
    <Studio
      name="ink"
      accent="#3f6fb5"
      tabs={[
        { id: 'draw', label: 'Draw', icon: <Pen size={15} />, render: draw },
        ...(on('pages') ? [{ id: 'pages', label: 'Pages', icon: <Plus size={15} />, render: pagesTab }] : []),
      ]}
    />
  )
}
