import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { checkModules, MODULE_CARDS, MODULE_FILES, MODULE_START, moduleEdges, type ModuleFile, type ModulePlacements } from './moduleOrganizerModel'
import './moduleOrganizer.css'

const KEY = 'bloom-module-organizer-v1'
const readSaved = (): ModulePlacements => {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.fromEntries(MODULE_CARDS.map((card) => [card.id, MODULE_FILES.includes(value[card.id]) ? value[card.id] : MODULE_START[card.id]])) as ModulePlacements
    }
  } catch { /* use starter */ }
  return MODULE_START
}

export function ModuleOrganizer({ onClose }: { onClose: () => void }) {
  const [placements, setPlacements] = useState(readSaved)
  const [checked, setChecked] = useState(false)
  const lines = useRef<SVGGElement>(null)
  const result = checkModules(placements)
  const edges = moduleEdges(placements)
  useLayoutEffect(() => {
    if (!lines.current || prefersReducedMotion()) return
    const tween = gsap.fromTo(lines.current.children, { opacity: .3, scale: .96, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .35, stagger: .08, ease: 'power2.out' })
    return () => { tween.progress(1).kill() }
  }, [placements])
  const update = (id: string, file: ModuleFile) => {
    const next = { ...placements, [id]: file }
    setPlacements(next); setChecked(false)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* keep work in memory */ }
  }
  const reset = () => { setPlacements(MODULE_START); setChecked(false); try { localStorage.setItem(KEY, JSON.stringify(MODULE_START)) } catch { /* keep starter in memory */ } }
  const coords: Record<ModuleFile, number> = { 'cart.js': 90, 'main.js': 245, 'receipt.js': 400 }
  return <section className="module-organizer" aria-label="JavaScript module organizer">
    <header><button type="button" onClick={onClose} aria-label="Back to learning path"><ArrowLeft size={18} /></button><div><h2>Untangle the kiosk modules</h2><p>The festival kiosk grew into one file. Move each statement to the module that owns it, then trace its imports.</p></div></header>
    <p className="module-organizer-objective"><strong>Mission:</strong> Keep the entry point in <code>main.js</code>, calculations in <code>cart.js</code>, and display code in <code>receipt.js</code>. Named imports belong where the functions are used.</p>
    <div className="module-organizer-grid"><div><div className="module-organizer-cards">{MODULE_CARDS.map((card) => <label key={card.id} className="module-organizer-card"><code>{card.code}</code><span>Place in <select value={placements[card.id]} onChange={(event) => update(card.id, event.target.value as ModuleFile)} aria-label={`Place ${card.id} in module`}>{MODULE_FILES.map((file) => <option key={file} value={file}>{file}</option>)}</select></span>{checked && <small>{result.cards.find((item) => item.id === card.id)?.pass ? '✓ Connected' : card.reason}</small>}</label>)}</div><div className="module-organizer-actions"><button type="button" onClick={() => setChecked(true)}>Check modules</button><button type="button" onClick={reset}><RotateCcw size={15} /> Reset</button></div><p role="status">{checked ? result.feedback : `${result.passed} of ${MODULE_CARDS.length} statements are in their intended files.`}</p></div><div><h3>Dependency map</h3><svg viewBox="0 0 490 260" role="img" aria-label={`Module dependencies: ${edges.map((edge) => `${edge.from} imported by ${edge.to}`).join(', ')}`}><g ref={lines}>{edges.map((edge, at) => { const x1 = coords[edge.from], x2 = coords[edge.to], y = 102 + at * 48; return <path key={at} d={`M${x1} 76 Q${(x1 + x2) / 2} ${y + 44} ${x2} 180`} fill="none" stroke={edge.valid ? '#4aab91' : '#d27c68'} strokeWidth="4" strokeDasharray={edge.valid ? undefined : '6 5'} markerEnd="url(#module-arrow)" /> })}</g><defs><marker id="module-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#4aab91" /></marker></defs>{MODULE_FILES.map((file) => <g key={file}><rect x={coords[file] - 56} y={file === 'main.js' ? 180 : 22} width="112" height="44" rx="10" className="module-organizer-node" /><text x={coords[file]} y={file === 'main.js' ? 207 : 49} textAnchor="middle">{file}</text></g>)}</svg><p className="module-organizer-note">Green arrows show a valid import into <code>main.js</code>. Dashed orange arrows show an import placed in the wrong file.</p><ul aria-label="Module contents">{MODULE_FILES.map((file) => <li key={file}><strong>{file}</strong>: {MODULE_CARDS.filter((card) => placements[card.id] === file).length} {MODULE_CARDS.filter((card) => placements[card.id] === file).length === 1 ? 'statement' : 'statements'}</li>)}</ul></div></div>
  </section>
}
