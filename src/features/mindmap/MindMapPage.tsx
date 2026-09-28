import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Transformer } from 'markmap-lib'
import { Markmap } from 'markmap-view'
import { BookOpen, Download, Expand, Maximize, Network, Plus, Shrink, Trash2 } from 'lucide-react'
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
    return s
  })
  const setStore = (fn: (s: MapStore) => MapStore) =>
    setStoreState((c) => {
      const n = fn(c)
      writeStore(MAP_KEY, n)
      return n
    })
  const [tab, setTab] = useState('map')
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
    gsap.from(nodes, { opacity: 0, scale: 0.4, transformOrigin: '0% 50%', stagger: 0.04, duration: 0.45, ease: 'back.out(2)' })
  }
  const view = useRef<Markmap | null>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const map = store.maps.find((m) => m.id === store.current) ?? store.maps[0]
  const pages = useMemo(() => {
    try {
      return (JSON.parse(localStorage.getItem(DAYBOOK_STORAGE_KEY) ?? '[]') as { id: string; modeTitle: string; updatedAt: string; content: unknown }[]).slice(-12).reverse()
    } catch {
      return []
    }
  }, [])

  const edit = (md: string) => setStore((s) => ({ ...s, maps: s.maps.map((m) => (m.id === map.id ? { ...m, md, title: titleOf(md), updatedAt: Date.now() } : m)) }))
  const create = (md: string) => {
    const m: MindMap = { id: crypto.randomUUID(), title: titleOf(md), md, updatedAt: Date.now() }
    setStore((s) => ({ ...s, maps: [...s.maps, m], current: m.id }))
    setTab('map')
    logActivity('mindmap')
  }
  const exportSvg = () => {
    const el = wrap.current?.querySelector('svg')
    if (!el) return
    const blob = new Blob([new XMLSerializer().serializeToString(el)], { type: 'image/svg+xml' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${map.title.replace(/\W+/g, '-')}.svg`
    a.click()
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
          <textarea className="mm-text" aria-label="Outline" value={map.md} spellCheck={false} onChange={(e) => edit(e.target.value)} />
          <p className="studio-empty">Use # for the centre, ## for branches, - for leaves. {branches(map.md)} branches.</p>
        </div>
      )}
      <div className="studio-card mm-canvas" ref={wrap}>
        <MapView md={map.md} colorful={on('colours') && store.colorful} maxWidth={store.maxWidth} onReady={(m) => {
            view.current = m
            requestAnimationFrame(reveal)
          }} />
        <div className="mm-tools">
          {on('collapse') && (
            <>
              <button type="button" aria-label="Collapse branches" onClick={() => toggleAll(false)}>
                <Shrink size={16} />
              </button>
              <button type="button" aria-label="Expand all" onClick={() => toggleAll(true)}>
                <Expand size={16} />
              </button>
            </>
          )}
          {on('zoom') && (
            <button type="button" aria-label="Fit" onClick={() => void view.current?.fit()}>
              <Network size={16} />
            </button>
          )}
          {on('fullscreen') && (
            <button type="button" aria-label={full ? 'Exit full view' : 'Full view'} onClick={() => setFull(!full)}>
              <Maximize size={16} />
            </button>
          )}
          {on('export') && (
            <button type="button" aria-label="Export SVG" onClick={exportSvg}>
              <Download size={16} />
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
          <Rail label="Saved maps">
            <div role="listitem">
              <button type="button" className="iv-card mm-new" onClick={() => create('# New idea\n## Branch\n- Leaf')}>
                <Plus size={26} />
                <strong>Blank map</strong>
              </button>
            </div>
            {store.maps.map((m) => (
              <div key={m.id} role="listitem" className="yg-saved">
                <button type="button" className="iv-card" data-on={m.id === map.id} onClick={() => (setStore((s) => ({ ...s, current: m.id })), setTab('map'))}>
                  <span aria-hidden="true">🗺️</span>
                  <strong>{m.title}</strong>
                  <small>{new Date(m.updatedAt).toLocaleDateString()}</small>
                </button>
                {store.maps.length > 1 && (
                  <button type="button" className="yg-remove" aria-label={`Delete ${m.title}`} onClick={() => setStore((s) => ({ ...s, maps: s.maps.filter((x) => x.id !== m.id), current: s.current === m.id ? s.maps[0].id : s.current }))}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </Rail>
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
