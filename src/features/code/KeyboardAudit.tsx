import { Checkbox } from '../../components/ui/Checkbox'
import { DropdownSelect } from '../../components/ui/DropdownSelect'
import { LearningExercise } from './LearningExercise'
import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { auditKiosk, KIOSK_FIXED, KIOSK_ITEMS, KIOSK_START, kioskTabOrder, type KioskRepair } from './keyboardAuditModel'
import './keyboardAudit.css'

const KEY = 'bloom-keyboard-audit-v1'
const readSaved = (): KioskRepair => {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (value && ['div', 'button'].includes(value.menuElement) && [0, 2].includes(value.ticketsTabIndex) && [-1, 0].includes(value.helpTabIndex) && typeof value.focusRing === 'boolean') return value
  } catch { /* use starter */ }
  return KIOSK_START
}

export function KeyboardAudit({ onClose }: { onClose: () => void }) {
  const [repair, setRepair] = useState(readSaved)
  const [checked, setChecked] = useState(false)
  const [step, setStep] = useState(-1)
  const halo = useRef<SVGCircleElement>(null)
  const order = kioskTabOrder(repair)
  const checks = auditKiosk(repair)
  const passed = checks.filter((item) => item.pass).length
  const current = order[step] ?? ''
  const x = KIOSK_ITEMS.find((item) => item.id === current)?.x ?? 65
  useLayoutEffect(() => {
    if (!halo.current) return
    if (step < 0 || !repair.focusRing) { gsap.set(halo.current, { opacity: 0 }); return }
    if (prefersReducedMotion()) { gsap.set(halo.current, { attr: { cx: x }, opacity: 1 }); return }
    const tween = gsap.to(halo.current, { attr: { cx: x }, opacity: 1, duration: .28, ease: 'power2.out' })
    return () => { tween.kill() }
  }, [step, x, repair.focusRing])
  const update = (patch: Partial<KioskRepair>) => {
    const next = { ...repair, ...patch }
    setRepair(next); setChecked(false); setStep(-1)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* keep in memory */ }
  }
  const move = (delta: number) => setStep((at) => Math.max(-1, Math.min(order.length - 1, at + delta)))
  return <LearningExercise className="keyboard-audit" aria-label="Keyboard navigation audit game" title={<>Audit the ticket kiosk</>} description={<>The kiosk looks fine with a pointer, but its keyboard route is confusing. Repair it and follow the focus path.</>} onClose={onClose}>

    <p className="keyboard-audit-objective"><strong>Goal:</strong> A visitor should reach Menu → Tickets → Search, with a visible focus ring. Hidden Help waits outside the route until it opens.</p>
    <div className="keyboard-audit-grid bloom-columns"><div className="keyboard-audit-controls"><label>Menu control <DropdownSelect value={repair.menuElement} onChange={(event) => update({ menuElement: event.target.value as KioskRepair['menuElement'] })}><option value="div">Clickable div</option><option value="button">Native button</option></DropdownSelect></label><label>Tickets tabindex <DropdownSelect value={repair.ticketsTabIndex} onChange={(event) => update({ ticketsTabIndex: Number(event.target.value) as KioskRepair['ticketsTabIndex'] })}><option value="2">2 — jump ahead</option><option value="0">0 — document order</option></DropdownSelect></label><label>Offscreen Help tabindex <DropdownSelect value={repair.helpTabIndex} onChange={(event) => update({ helpTabIndex: Number(event.target.value) as KioskRepair['helpTabIndex'] })}><option value="0">0 — still focusable</option><option value="-1">-1 — skip until shown</option></DropdownSelect></label><label className="keyboard-audit-toggle"><Checkbox checked={repair.focusRing} onCheckedChange={(checked) => update({ focusRing: checked })} /> Show a visible focus ring</label><div className="keyboard-audit-actions"><button type="button" onClick={() => setChecked(true)}>Run audit</button><button type="button" onClick={() => update(KIOSK_START)}><RotateCcw size={15} /> Reset</button>{checked && passed < checks.length && <button type="button" onClick={() => update(KIOSK_FIXED)}>Compare solution</button>}</div><p role="status">{checked ? passed === checks.length ? 'Audit complete: the kiosk has a clear keyboard route.' : `${passed} of ${checks.length} checks pass. Use the feedback below.` : 'Change the controls, then run the audit.'}</p><ul>{checks.map((item) => <li key={item.label}><strong>{checked ? item.pass ? '✓ ' : '○ ' : ''}{item.label}</strong>{checked && !item.pass && <span>{item.hint}</span>}</li>)}</ul></div><div><h3>Focus route</h3><svg viewBox="0 0 460 180" role="img" aria-label={`Tab order: ${order.map((id) => KIOSK_ITEMS.find((item) => item.id === id)?.label).join(', ')}`}><path d="M65 72 H395" className="keyboard-audit-track" /><g>{KIOSK_ITEMS.map((item) => { const active = current === item.id; const reachable = order.includes(item.id); return <g key={item.id}><circle cx={item.x} cy="72" r="26" className={reachable ? 'keyboard-audit-node' : 'keyboard-audit-node keyboard-audit-node-muted'} /><text x={item.x} y="78" textAnchor="middle" className="keyboard-audit-index">{reachable ? order.indexOf(item.id) + 1 : '×'}</text><text x={item.x} y="127" textAnchor="middle" className="keyboard-audit-label">{item.label}</text>{active && !repair.focusRing && <text x={item.x} y="151" textAnchor="middle" className="keyboard-audit-warning">ring missing</text>}</g> })}</g><circle ref={halo} cx={x} cy="72" r="32" className="keyboard-audit-halo" style={{ opacity: step < 0 || !repair.focusRing ? 0 : 1 }} /></svg><div className="keyboard-audit-preview" role="group" aria-label="Preview keyboard focus order" onKeyDown={(event) => { if (event.key === 'ArrowRight') { event.preventDefault(); move(1) } if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) } }}><button type="button" onClick={() => move(-1)} disabled={step < 0} aria-label="Previous focus stop"><ChevronLeft size={16} /></button><button type="button" onClick={() => move(1)} disabled={step >= order.length - 1} aria-label="Next focus stop"><ChevronRight size={16} /></button><span>{current ? `Focus ${step + 1} of ${order.length}: ${KIOSK_ITEMS.find((item) => item.id === current)?.label}` : 'Choose next to begin. Arrow keys also work here.'}</span></div><p className="keyboard-audit-note">The preview shows the route; your browser’s Tab key keeps its normal behavior on this page.</p></div></div>
  </LearningExercise>
}
