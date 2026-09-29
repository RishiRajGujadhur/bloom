import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import gsap from 'gsap'
import { motion } from 'framer-motion'
import { arc } from 'd3-shape'
import chroma from 'chroma-js'
import * as Tooltip from '@radix-ui/react-tooltip'
import { z } from 'zod'
import { Compass, Info } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import './energyCompass.css'

const KEY = 'bloom-innovation-energy-compass-v1'
const energySchema = z.number().int().min(0).max(100)
function readEnergy() {
  try { return energySchema.parse(JSON.parse(localStorage.getItem(KEY) ?? '50')) } catch { return 50 }
}
export function energyAction(value: number) {
  if (value < 26) return { title: 'Recover first', detail: 'Choose a gentle reset: breathe, stretch, or step away for a moment.' }
  if (value < 51) return { title: 'Start small', detail: 'Pick one brief task and leave room for a pause afterward.' }
  if (value < 76) return { title: 'Find your flow', detail: 'A focused block may fit. Choose a clear stopping point.' }
  return { title: 'Use the momentum', detail: 'Tackle a meaningful task, then plan a recovery break.' }
}

const center = { x: 180, y: 170 }
const angleFor = (value: number) => (-135 + (value / 100) * 270) * Math.PI / 180
const pointFor = (value: number, radius = 118) => ({ x: center.x + Math.sin(angleFor(value)) * radius, y: center.y - Math.cos(angleFor(value)) * radius })
const track = arc()({ innerRadius: 105, outerRadius: 111, startAngle: -135 * Math.PI / 180, endAngle: 135 * Math.PI / 180 }) ?? ''

export function EnergyCompass() {
  const [energy, setEnergy] = useState(readEnergy)
  const svg = useRef<SVGSVGElement>(null)
  const needle = useRef<SVGCircleElement>(null)
  const previous = useRef(energy)
  const dragging = useRef(false)
  const point = pointFor(energy)
  const action = energyAction(energy)
  const color = chroma.mix('#607ec9', '#dc9f57', energy / 100, 'lab').hex()
  const motionOff = prefersReducedMotion()

  useLayoutEffect(() => {
    if (!needle.current || motionOff) { previous.current = energy; return }
    const from = pointFor(previous.current)
    const tween = gsap.fromTo(needle.current, { attr: { cx: from.x, cy: from.y } }, { attr: { cx: point.x, cy: point.y }, duration: .35, ease: 'power2.out' })
    previous.current = energy
    return () => { tween.progress(1).kill() }
  }, [energy, motionOff, point.x, point.y])

  const update = (value: number) => {
    const next = Math.min(100, Math.max(0, Math.round(value)))
    setEnergy(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* keep session state */ }
  }
  const updateFromPointer = (event: PointerEvent<SVGSVGElement>) => {
    const node = svg.current; if (!node) return
    const bounds = node.getBoundingClientRect()
    const x = (event.clientX - bounds.left) * 360 / bounds.width - center.x
    const y = (event.clientY - bounds.top) * 310 / bounds.height - center.y
    const degrees = Math.atan2(x, -y) * 180 / Math.PI
    update((Math.max(-135, Math.min(135, degrees)) + 135) / 270 * 100)
  }
  const pointerDown = (event: PointerEvent<SVGSVGElement>) => { dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); updateFromPointer(event) }
  const pointerMove = (event: PointerEvent<SVGSVGElement>) => { if (dragging.current) updateFromPointer(event) }
  const pointerUp = () => { dragging.current = false }

  return <motion.section className="energy-compass" id="innovation-energy-compass" initial={motionOff ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }} aria-labelledby="energy-compass-title">
    <div className="energy-compass-head"><div><span className="energy-compass-kicker"><Compass size={15} aria-hidden="true" /> INNOVATION STUDIO · 01</span><h3 id="energy-compass-title">Energy compass</h3><p>Turn the needle to match how much energy you have right now. Bloom suggests a fitting next step.</p></div><Tooltip.Provider delayDuration={200}><Tooltip.Root><Tooltip.Trigger asChild><button type="button" aria-label="How to use the energy compass"><Info size={17} /></button></Tooltip.Trigger><Tooltip.Portal><Tooltip.Content className="energy-compass-tip" sideOffset={5}>Drag the SVG needle or focus the dial and use arrow keys.<Tooltip.Arrow /></Tooltip.Content></Tooltip.Portal></Tooltip.Root></Tooltip.Provider></div>
    <div className="energy-compass-body"><svg ref={svg} viewBox="0 0 360 310" role="slider" tabIndex={0} aria-label="Current energy" aria-valuemin={0} aria-valuemax={100} aria-valuenow={energy} aria-valuetext={`${energy} out of 100, ${action.title}`} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onKeyDown={(event) => { if (event.key === 'ArrowRight' || event.key === 'ArrowUp') { event.preventDefault(); update(energy + 5) } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') { event.preventDefault(); update(energy - 5) } else if (event.key === 'Home') { event.preventDefault(); update(0) } else if (event.key === 'End') { event.preventDefault(); update(100) } }}>
      <defs><radialGradient id="energy-compass-glow"><stop stopColor={color} stopOpacity=".24" /><stop offset="1" stopColor={color} stopOpacity="0" /></radialGradient></defs>
      <circle cx="180" cy="170" r="145" fill="url(#energy-compass-glow)" />
      <path d={track} transform="translate(180 170)" fill="var(--border-color)" />
      {[0, 25, 50, 75, 100].map((value) => { const pos = pointFor(value); return <circle key={value} cx={pos.x} cy={pos.y} r="4" fill={value <= energy ? color : 'var(--text-muted)'} /> })}
      <path d={`M180 170 L${point.x} ${point.y}`} stroke={color} strokeWidth="4" strokeLinecap="round" />
      <circle cx="180" cy="170" r="10" fill={color} />
      <circle ref={needle} cx={point.x} cy={point.y} r="16" fill={color} stroke="white" strokeWidth="4" />
      <text x="180" y="205" textAnchor="middle" className="energy-compass-number">{energy}</text>
      <text x="180" y="228" textAnchor="middle" className="energy-compass-caption">ENERGY NOW</text>
      <text x="28" y="284" className="energy-compass-end">REST</text><text x="332" y="284" textAnchor="end" className="energy-compass-end">READY</text>
    </svg><div className="energy-compass-result" style={{ ['--energy-accent' as string]: color }}><span>Your next move</span><h4>{action.title}</h4><p>{action.detail}</p><small>Saved on this device. This is a reflection tool, not a health assessment.</small></div></div>
  </motion.section>
}
