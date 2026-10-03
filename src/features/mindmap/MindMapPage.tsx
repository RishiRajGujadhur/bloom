import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Transformer } from 'markmap-lib'
import { Markmap } from 'markmap-view'
import { BookOpen, Copy, Download, Expand, ImageDown, Maximize, Network, Plus, Shrink, Trash2 } from 'lucide-react'
import { Rail, Slider, Studio, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { journalText } from '../../search/db'
import { DAYBOOK_STORAGE_KEY } from '../../components/daybook/storage'
import { MAP_KEY, branches, fromText, templates, titleOf, type MapStore, type MindMap } from './mindmapModel'
import gsap from 'gsap'
import { usePageActions } from '../../components/ui/PageMenu'
import './mindmap.css'

const on = (id: string) => subOn('mindMaps', id)
const transformer = new Transformer()
const palette = ['#e2703f', '#8f7ae5', '#3f8a76', '#5aa9e6', '#e27396', '#c99a4b']

function MapView({ md, colorful, maxWidth, onReady }: { md: string; colorful: boolean; maxWidth: number; onReady: (m: Markmap) => void }) {
  const svg = useRef<SVGSVGElement>(null)
  const mm = useRef<Markmap | null>(null)
  useEffect(() => {
    if (!svg.current) return
    mm.current = Markmap.create(svg.current, { autoFit: true, duration: 500 })
    onReady(mm.current)
    return () => mm.current?.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- create once
  }, [])
  useEffect(() => {
    const m = mm.current
    if (!m) return
    const { root } = transformer.transform(md)
    void m.setData(root, { maxWidth, color: colorful ? (node) => palette[Number(node.state?.path?.split('.')[1] ?? 0) % palette.length] : () => '#8f7ae5' }).then(() => m.fit())
  }, [md, colorful, maxWidth])
  return <svg ref={svg} className="mm-svg" aria-label="Mind map" />
}

export function MindMapPage() {
  const [store, setStoreState] = useState<MapStore>(() => {
    const s = readStore<MapStore>(MAP_KEY, { maps: [], current: '', colorful: true, maxWidth: 260 })
    if (!s.maps.length) {
      const first: MindMap = { id: crypto.randomUUID(), title: 'My goal', md: templates[0].md, updatedAt: Date.now() }
      return { ...s, maps: [first], current: first.id }
    }
    // Deep link: #mindmaps/<id> opens that map.
    const linked = decodeURIComponent(location.hash.match(/^#mindmaps\/(.+)$/)?.[1] ?? '')
    return linked && s.maps.some((m) => m.id === linked) ? { ...s, current: linked } : s
  })
  const setStore = (fn: (s: MapStore) => MapStore) =>
    setStoreState((c) => {
      const n = fn(c)
      writeStore(MAP_KEY, n)
      return n
    })
  const [tab, setTab] = useState('map')
  const [mapQuery, setMapQuery] = useState('')
  const [full, setFull] = useState(false)
  const narrow = typeof window !== 'undefined' && window.innerWidth < 720
  const [editing, setEditing] = useState(!narrow)
  // Branches grow in one after another when a map opens (GSAP stagger).
  const revealed = useRef('')
  const reveal = () => {
    if (revealed.current === map.id) return
    revealed.current = map.id
    const nodes = wrap.current?.querySelectorAll('g.markmap-node')
    if (!nodes?.length || !subOn('mindMaps', 'grow') || prefersReducedMotion()) return
    // Only fade the node groups: markmap positions them with their own transform,
    // and tweening scale there would overwrite it. The pop comes from the children.
    gsap.from(nodes, { opacity: 0, stagger: 0.04, duration: 0.45, ease: 'power1.out' })
    nodes.forEach((n, i) => gsap.from(n.children, { scale: 0.4, transformOrigin: '0% 50%', delay: i * 0.04, duration: 0.45, ease: 'back.out(2)', clearProps: 'transform,scale' }))
  }
  const view = useRef<Markmap | null>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const map = store.maps.find((m) => m.id === store.current) ?? store.maps[0]
  // Keep the URL pointing at the open map so it can be bookmarked or shared between tabs.
  useEffect(() => {
    if (location.hash.slice(1).split('/')[0] === 'mindmaps') history.replaceState(null, '', `#mindmaps/${encodeURIComponent(map.id)}`)
  }, [map.id])
  const pages = useMemo(() => {
    try {
      return (JSON.parse(localStorage.getItem(DAYBOOK_STORAGE_KEY) ?? '[]') as { id: string; modeTitle: string; updatedAt: string; content: unknown }[]).slice(-12).reverse()
    } catch {
      return []
    }
  }, [])

  const edit = (md: string) => setStore((s) => ({ ...s, maps: s.maps.map((m) => (m.id === map.id ? { ...m, md, title: titleOf(md), updatedAt: Date.now() } : m)) }))
  /** Set a map's title by rewriting its root heading. */
  const retitle = (md: string, t: string) => (/^# .*$/m.test(md) ? md.replace(/^# .*$/m, `# ${t}`) : `# ${t}\n${md}`)
  const rename = (m: MindMap) => {
    const t = window.prompt('Rename map', m.title)?.trim()
    if (!t) return
    setStore((s) => ({ ...s, maps: s.maps.map((x) => (x.id === m.id ? { ...x, title: t, md: retitle(x.md, t), updatedAt: Date.now() } : x)) }))
  }
  const create = (md: string) => {
    const m: MindMap = { id: crypto.randomUUID(), title: titleOf(md), md, updatedAt: Date.now() }
    setStore((s) => ({ ...s, maps: [...s.maps, m], current: m.id }))
    setTab('map')
    logActivity('mindmap')
  }
  const [exportMessage, setExportMessage] = useState('')
  const exportSvg = () => {
    const el = wrap.current?.querySelector('svg')
    if (!el) return
    const blob = new Blob([new XMLSerializer().serializeToString(el)], { type: 'image/svg+xml' })
    const a = document.createElement('a')
    const url = URL.createObjectURL(blob)
    a.href = url
    a.download = `${map.title.replace(/\W+/g, '-')}.svg`
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setExportMessage('SVG download started.')
  }
  // PNG: the whole map (not just the visible part), at print-friendly resolution.
  const [pngBusy, setPngBusy] = useState(false)
  const exportPng = async () => {
    const el = wrap.current?.querySelector('svg')
    const g = el?.querySelector('g')
    if (!el || !g) return
    setPngBusy(true)
    try {
      const box = g.getBBox()
      const pad = 24
      const w = box.width + pad * 2
      const h = box.height + pad * 2
      const clone = el.cloneNode(true) as SVGSVGElement
      clone.querySelector('g')?.removeAttribute('transform')
      // Export the finished map even if the grow-in animation is still running.
      clone.querySelectorAll<SVGElement>('g.markmap-node, g.markmap-node *').forEach((n) => {
        n.style.opacity = '1'
        n.style.removeProperty('scale')
      })
      // Swap HTML labels for plain SVG text so they rasterise with the right font everywhere.
      const live = [...el.querySelectorAll('foreignObject')]
      const font = getComputedStyle(live[0]?.firstElementChild ?? el)
      ;[...clone.querySelectorAll('foreignObject')].forEach((fo, i) => {
        const src = live[i]
        const label = src?.textContent?.trim()
        if (!src || !label) return fo.remove()
        const cs = getComputedStyle(src.firstElementChild ?? src)
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        const x = Number(fo.getAttribute('x') ?? 0)
        const y = Number(fo.getAttribute('y') ?? 0)
        const fh = Number(fo.getAttribute('height') ?? 20)
        text.setAttribute('x', String(x))
        text.setAttribute('y', String(y + fh * 0.72))
        text.setAttribute('font-family', font.fontFamily)
        text.setAttribute('font-size', cs.fontSize)
        text.setAttribute('font-weight', cs.fontWeight)
        text.setAttribute('fill', cs.color.replace(/rgba\((\d+), (\d+), (\d+), [\d.]+\)/, 'rgb($1, $2, $3)'))
        text.textContent = label
        fo.replaceWith(text)
      })
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      clone.setAttribute('viewBox', `${box.x - pad} ${box.y - pad} ${w} ${h}`)
      clone.setAttribute('width', String(w))
      clone.setAttribute('height', String(h))
      const img = new Image()
      await new Promise((ok, fail) => {
        img.onload = ok
        img.onerror = fail
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`
      })
      const scale = Math.min(4, Math.max(2, 1600 / w))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(w * scale)
      canvas.height = Math.round(h * scale)
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = getComputedStyle(wrap.current!).backgroundColor || '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0, w, h)
      const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/png'))
      if (!blob) throw new Error('empty')
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${map.title.replace(/\W+/g, '-')}.png`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
      setExportMessage('PNG download started.')
    } catch {
      // Some browsers refuse to rasterise HTML labels; SVG export still works there.
      exportSvg()
    } finally {
      setPngBusy(false)
    }
  }
  const toggleAll = (expand: boolean) => {
    const m = view.current
    const root = m?.state.data
    if (!m || !root) return
    const walk = (n: typeof root, depth: number) => {
      n.payload = { ...n.payload, fold: expand ? 0 : depth >= 1 ? 1 : 0 }
      n.children?.forEach((c) => walk(c, depth + 1))
    }
    walk(root, 0)
    void m.renderData().then(() => m.fit())
  }

  useEffect(() => {
    if (tab !== 'map') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || !event.shiftKey || event.altKey) return
      if ((event.target as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable="true"]')) return
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        void view.current?.fit()
      } else if (event.key.toLowerCase() === 'e') {
        event.preventDefault()
        toggleAll(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [tab])

  usePageActions([
    { id: 'mm-expand', label: 'Expand every branch', icon: '🌳', run: () => toggleAll(true) },
    { id: 'mm-collapse', label: 'Collapse to main branches', icon: '🌱', run: () => toggleAll(false) },
    { id: 'mm-full', label: full ? 'Exit full view' : 'Full view', icon: '⛶', run: () => setFull(!full) },
    { id: 'mm-export', label: 'Download as SVG', icon: '⬇️', run: exportSvg },
  ])
  const mapTab = () => (
    <div className={`mm-layout${full ? ' is-full' : ''}`}>
      {!full && narrow && (
        <button type="button" className="quiet-button mm-edit-toggle" aria-expanded={editing} onClick={() => setEditing(!editing)}>
          {editing ? 'Hide outline' : 'Edit outline'}
        </button>
      )}
      {!full && editing && (
        <div className="studio-card mm-editor">
          <textarea
            className="mm-text"
            aria-label="Outline (Tab indents, Shift+Tab outdents)"
            value={map.md}
            spellCheck={false}
            onChange={(e) => edit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Tab') return
              e.preventDefault()
              const ta = e.currentTarget
              const { selectionStart: a, selectionEnd: b, value } = ta
              const lineStart = value.lastIndexOf('\n', a - 1) + 1
              const block = value.slice(lineStart, b)
              const next = e.shiftKey ? block.replace(/^ {1,2}/gm, '') : block.replace(/^/gm, '  ')
              edit(value.slice(0, lineStart) + next + value.slice(b))
              const delta = next.length - block.length
              requestAnimationFrame(() => ta.setSelectionRange(Math.max(lineStart, a + (e.shiftKey ? Math.min(0, delta) : 2)), b + delta))
            }}
          />
          <p className="studio-empty">Use # for the centre, ## for branches, - for leaves. {branches(map.md)} branches.</p>
        </div>
      )}
      <div className="studio-card mm-canvas" ref={wrap}>
        <MapView md={map.md} colorful={on('colours') && store.colorful} maxWidth={store.maxWidth} onReady={(m) => {
            view.current = m
            requestAnimationFrame(reveal)
          }} />
        <div className="mm-tools">
          <span className="sr-only" role="status">{exportMessage}</span>
          {on('collapse') && (
            <>
              <button type="button" aria-label="Collapse branches" onClick={() => toggleAll(false)}>
                <Shrink size={16} />
              </button>
              <button type="button" aria-label="Expand all (Ctrl+Shift+E)" aria-keyshortcuts="Control+Shift+E" title="Expand all · Ctrl+Shift+E" onClick={() => toggleAll(true)}>
                <Expand size={16} />
              </button>
            </>
          )}
          {on('zoom') && (
            <button type="button" aria-label="Fit (Ctrl+Shift+F)" aria-keyshortcuts="Control+Shift+F" title="Fit map · Ctrl+Shift+F" onClick={() => void view.current?.fit()}>
              <Network size={16} />
            </button>
          )}
          {on('fullscreen') && (
            <button type="button" aria-label={full ? 'Exit full view' : 'Full view'} onClick={() => setFull(!full)}>
              <Maximize size={16} />
            </button>
          )}
          {on('export') && (
            <button type="button" aria-label="Export SVG" title="Download as SVG" onClick={exportSvg}>
              <Download size={16} />
            </button>
          )}
          {on('export') && (
            <button type="button" aria-label="Export PNG" title="Download the whole map as a PNG image" disabled={pngBusy} onClick={() => void exportPng()}>
              <ImageDown size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )

  const maps = () => (
    <div className="iv-programs">
      {on('templates') && (
        <>
          <h3>Start from a template</h3>
          <Rail label="Templates">
            {templates.map((t) => (
              <div key={t.id} role="listitem">
                <button type="button" className="iv-card" onClick={() => create(t.md)}>
                  <span aria-hidden="true">{t.emoji}</span>
                  <strong>{t.name}</strong>
                  <small>{branches(t.md)} branches</small>
                </button>
              </div>
            ))}
          </Rail>
        </>
      )}
      {on('saved') && (
        <>
          <h3>Your maps</h3>
          <label className="mm-search">
            <Network size={15} aria-hidden="true" />
            <input
              type="search"
              aria-label="Search saved maps"
              placeholder="Find a map by name…"
              value={mapQuery}
              onChange={(event) => setMapQuery(event.target.value)}
            />
            {mapQuery && <button type="button" onClick={() => setMapQuery('')}>Clear</button>}
          </label>
          <Rail label="Saved maps">
            <div role="listitem">
              <button type="button" className="iv-card mm-new" onClick={() => create('# New idea\n## Branch\n- Leaf')}>
                <Plus size={26} />
                <strong>Blank map</strong>
              </button>
            </div>
            {[...store.maps].filter((m) => m.title.toLocaleLowerCase().includes(mapQuery.trim().toLocaleLowerCase())).sort((a, b) => b.updatedAt - a.updatedAt).map((m) => (
              <div key={m.id} role="listitem" className="yg-saved">
                <button type="button" className="iv-card" data-on={m.id === map.id} title="Double-click to rename" onDoubleClick={() => rename(m)} onClick={() => (setStore((s) => ({ ...s, current: m.id })), setTab('map'))}>
                  <span aria-hidden="true">🗺️</span>
                  <strong>{m.title}</strong>
                  <small><time dateTime={new Date(m.updatedAt).toISOString()}>{new Date(m.updatedAt).toLocaleDateString()}</time></small>
                </button>
                <button
                  type="button"
                  className="yg-remove"
                  style={{ right: store.maps.length > 1 ? 28 : undefined }}
                  aria-label={`Duplicate ${m.title}`}
                  title="Duplicate"
                  onClick={() => {
                    const t = `${m.title} (copy)`
                    const copy: MindMap = { ...m, id: crypto.randomUUID(), title: t, md: retitle(m.md, t), updatedAt: Date.now() }
                    setStore((s) => ({ ...s, maps: [...s.maps, copy], current: copy.id }))
                  }}
                >
                  <Copy size={13} />
                </button>
                {store.maps.length > 1 && (
                  <button type="button" className="yg-remove" aria-label={`Delete ${m.title}`} onClick={() => setStore((s) => ({ ...s, maps: s.maps.filter((x) => x.id !== m.id), current: s.current === m.id ? s.maps[0].id : s.current }))}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </Rail>
          {mapQuery.trim() && !store.maps.some((m) => m.title.toLocaleLowerCase().includes(mapQuery.trim().toLocaleLowerCase())) && (
            <p className="mm-search-empty" role="status">
              No saved maps match “{mapQuery.trim()}”.
              <button type="button" onClick={() => setMapQuery('')}>Clear search</button>
            </p>
          )}
        </>
      )}
      {on('fromJournal') && pages.length > 0 && (
        <>
          <h3>
            <BookOpen size={16} /> From a Daybook page
          </h3>
          <div className="yg-pose-chips">
            {pages.map((p) => (
              <button key={p.id} type="button" className="studio-chip" onClick={() => create(fromText(p.modeTitle, journalText(p.content)))}>
                {p.modeTitle} · {p.updatedAt.slice(5, 10)}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="st-scale">
        {on('colours') && (
          <button type="button" className="studio-chip" aria-pressed={store.colorful} onClick={() => setStore((s) => ({ ...s, colorful: !s.colorful }))}>
            Colourful branches
          </button>
        )}
        <Slider label="Node width" value={store.maxWidth} min={120} max={480} step={20} unit="px" onChange={(v) => setStore((s) => ({ ...s, maxWidth: v }))} />
      </div>
    </div>
  )

  return (
    <Studio
      name="mindmap"
      accent="#8f7ae5"
      tab={tab}
      onTab={setTab}
      tabs={[
        { id: 'map', label: map.title, icon: <Network size={15} />, render: mapTab },
        { id: 'maps', label: 'Maps', icon: <Plus size={15} />, render: maps },
      ]}
    />
  )
}
