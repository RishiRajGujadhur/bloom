import { Checkbox } from '../ui/Checkbox'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { readComfort, saveComfort, type Comfort } from '../../settings/comfort'
import './comfort.css'

/** Settings → Comfort & motion: sizing, density and motion preferences with a live "Saved" tick. */
export function ComfortCard() {
  const [c, setC] = useState<Comfort>(readComfort)
  const [saved, setSaved] = useState(0)
  const tick = useRef<HTMLSpanElement>(null)
  const set = <K extends keyof Comfort>(k: K, v: Comfort[K]) => {
    const n = { ...c, [k]: v }
    setC(n)
    saveComfort(n)
    setSaved((s) => s + 1)
  }
  useEffect(() => {
    if (!saved || !tick.current || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(tick.current, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(2)' })
    const t = gsap.to(tick.current, { opacity: 0, delay: 1.6, duration: 0.4 })
    return () => { t.kill() }
  }, [saved])
  const seg = <K extends keyof Comfort>(k: K, opts: [Comfort[K], string][]) => (
    <div className="cf-seg" role="radiogroup">
      {opts.map(([v, label]) => <button key={String(v)} type="button" role="radio" aria-checked={c[k] === v} className={c[k] === v ? 'on' : ''} onClick={() => set(k, v)}>{label}</button>)}
    </div>
  )
  const toggle = (k: 'scenes' | 'transitions' | 'keepAwake' | 'pauseWhenAway', label: string, hint: string) => (
    <label className="cf-toggle"><Checkbox  checked={c[k]} onCheckedChange={(checked) => set(k, checked)} /><span><b>{label}</b><small>{hint}</small></span></label>
  )
  return (
    <div className="cf">
      <div className="cf-head"><h3>Comfort &amp; motion</h3><span ref={tick} className="cf-saved" aria-live="polite">{saved ? '✓ Saved' : ''}</span></div>
      <label className="cf-row">Text size <input type="range" min={85} max={130} step={5} value={c.textScale} onChange={(e) => set('textScale', Number(e.target.value))} /><b>{c.textScale}%</b></label>
      <label className="cf-row">Reading line height <input type="range" min={1.3} max={1.9} step={0.05} value={c.lineHeight} onChange={(e) => set('lineHeight', Number(e.target.value))} /><b>{c.lineHeight.toFixed(2)}</b></label>
      <div className="cf-row">Density {seg('density', [['comfortable', 'Comfortable'], ['compact', 'Compact']])}</div>
      <div className="cf-row">Page width {seg('width', [['narrow', 'Narrow'], ['standard', 'Standard'], ['wide', 'Wide']])}</div>
      {toggle('scenes', 'Animated page scenes', 'Houdini headers and studio motifs')}
      {toggle('transitions', 'Page transitions', 'Pages morph as you move between them')}
      {toggle('keepAwake', 'Keep the screen on in sessions', 'Meditate, yoga, focus, workouts…')}
      {toggle('pauseWhenAway', 'Pause timers when I step away', 'Uses idle detection in Focus')}
    </div>
  )
}

/** Filters Settings cards by what you type (searches their visible text). */
export function SettingsSearch({ root }: { root: React.RefObject<HTMLElement | null> }) {
  const [q, setQ] = useState('')
  useEffect(() => {
    const el = root.current
    if (!el) return
    const cards = [...el.querySelectorAll<HTMLElement>(':scope > section, :scope > details, :scope > div > section')]
    const needle = q.trim().toLowerCase()
    let shown = 0
    cards.forEach((card) => {
      const hit = !needle || (card.textContent ?? '').toLowerCase().includes(needle)
      card.style.display = hit ? '' : 'none'
      if (hit) shown++
      if (hit && needle && card.tagName === 'DETAILS') (card as HTMLDetailsElement).open = true
    })
    el.dataset.searchEmpty = needle && !shown ? 'true' : 'false'
  }, [q, root])
  return (
    <div className="cf-search">
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search settings… (fonts, motion, currency)" aria-label="Search settings" />
    </div>
  )
}
