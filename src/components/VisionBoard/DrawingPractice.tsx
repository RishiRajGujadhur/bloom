import { useEffect, useRef, useState, type PointerEvent } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '../../utils/motion'
import styles from './DrawingPractice.module.css'

type Point = { x: number; y: number }
const lessons = [
  { name: 'Steady line', tip: 'Move slowly from the left dot to the right dot.', path: 'M 45 120 L 275 120', sample: (t: number): Point => ({ x: 45 + 230 * t, y: 120 }) },
  { name: 'Round circle', tip: 'Keep your hand moving smoothly and meet your starting point.', path: 'M 160 42 A 78 78 0 1 1 159.9 42', sample: (t: number): Point => ({ x: 160 + 78 * Math.sin(2 * Math.PI * t), y: 120 - 78 * Math.cos(2 * Math.PI * t) }) },
  { name: 'Triangle turn', tip: 'Pause at each corner before changing direction.', path: 'M 160 40 L 275 205 L 45 205 Z', sample: (t: number): Point => t < 1 / 3 ? ({ x: 160 + 345 * t, y: 40 + 495 * t }) : t < 2 / 3 ? ({ x: 275 - 690 * (t - 1 / 3), y: 205 }) : ({ x: 45 + 345 * (t - 2 / 3), y: 205 - 495 * (t - 2 / 3) }) },
] as const

function scoreStroke(points: Point[], index: number): number {
  if (points.length < 3) return 0
  const lengths = [0]
  for (let i = 1; i < points.length; i++) lengths.push(lengths[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y))
  const total = lengths[lengths.length - 1]
  if (total < 30) return 0
  let distance = 0
  for (let i = 0; i <= 40; i++) {
    const target = total * i / 40
    let segment = 1
    while (segment < lengths.length - 1 && lengths[segment] < target) segment++
    const ratio = (target - lengths[segment - 1]) / Math.max(0.001, lengths[segment] - lengths[segment - 1])
    const actual = { x: points[segment - 1].x + (points[segment].x - points[segment - 1].x) * ratio, y: points[segment - 1].y + (points[segment].y - points[segment - 1].y) * ratio }
    const expected = lessons[index].sample(i / 40)
    distance += Math.hypot(actual.x - expected.x, actual.y - expected.y)
  }
  return Math.max(0, Math.round(100 - distance / 41 * 1.5))
}

const key = 'bloom-drawing-practice-v1'
export default function DrawingPractice({ onBack }: { onBack: () => void }) {
  const [index, setIndex] = useState(0)
  const [points, setPoints] = useState<Point[]>([])
  const [drawing, setDrawing] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [bests, setBests] = useState<number[]>(() => {
    try { const saved = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(saved) ? lessons.map((_, i) => Number(saved[i]) || 0) : [0, 0, 0] } catch { return [0, 0, 0] }
  })
  const guide = useRef<SVGPathElement>(null)
  const trace = useRef<SVGPolylineElement>(null)
  const activePointer = useRef<number | null>(null)
  const strokePoints = useRef<Point[]>([])

  useEffect(() => {
    if (!guide.current || prefersReducedMotion()) return
    const path = guide.current
    const length = path.getTotalLength()
    gsap.fromTo(path, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.out', onComplete: () => path.removeAttribute('style') })
    return () => { gsap.killTweensOf(path); path.removeAttribute('style') }
  }, [index])

  const position = (event: PointerEvent<SVGSVGElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: Math.max(0, Math.min(320, (event.clientX - rect.left) * 320 / rect.width)), y: Math.max(0, Math.min(240, (event.clientY - rect.top) * 240 / rect.height)) }
  }
  const finish = (event: PointerEvent<SVGSVGElement>) => {
    if (activePointer.current !== event.pointerId) return
    activePointer.current = null
    setDrawing(false)
    const final = [...strokePoints.current, position(event)]
    strokePoints.current = final
    setPoints(final)
    const result = scoreStroke(final, index)
    setScore(result)
    if (result > bests[index]) {
      const next = [...bests]
      next[index] = result
      setBests(next)
      try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* Private browsing can block storage. */ }
    }
  }
  const select = (next: number) => { setIndex(next); strokePoints.current = []; setPoints([]); setScore(null) }
  const replay = () => {
    const line = trace.current
    if (!line || points.length < 3 || prefersReducedMotion()) return
    const length = line.getTotalLength()
    gsap.fromTo(line, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: 1.1, ease: 'power1.inOut', onComplete: () => line.removeAttribute('style') })
  }
  const lesson = lessons[index]
  return <section className={styles.practice} aria-label="Drawing practice">
    <div className={styles.top}><button onClick={onBack} aria-label="Back to vision board" title="Back to vision board">←</button><span role="heading" aria-level={2}>✎ <span className={styles.srOnly}>Drawing practice</span></span><p>Trace the guide. Every stroke is practice.</p></div>
    <div className={styles.tabs} role="group" aria-label="Drawing exercises">{lessons.map((item, i) => <button key={item.name} aria-pressed={index === i} onClick={() => select(i)}>{i + 1}. {item.name}{bests[i] > 0 ? ` · ${bests[i]} best` : ''}</button>)}</div>
    <p className={styles.tip}>{lesson.tip}</p>
    <svg className={styles.pad} viewBox="0 0 320 240" role="img" aria-label={`Trace the ${lesson.name.toLowerCase()} with a mouse, pen, or finger`} onPointerDown={event => { activePointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); strokePoints.current = [position(event)]; setPoints(strokePoints.current); setScore(null); setDrawing(true) }} onPointerMove={event => { if (drawing && activePointer.current === event.pointerId && strokePoints.current.length < 2000) { const next = position(event); const last = strokePoints.current[strokePoints.current.length - 1]; if (Math.hypot(next.x - last.x, next.y - last.y) >= 1) { strokePoints.current = [...strokePoints.current, next]; setPoints(strokePoints.current) } } }} onPointerUp={finish} onPointerCancel={() => { activePointer.current = null; setDrawing(false) }}>
      <rect x="0" y="0" width="320" height="240" rx="18" className={styles.backdrop} />
      <path ref={guide} key={index} d={lesson.path} className={styles.guide} />
      <polyline ref={trace} points={points.map(point => `${point.x},${point.y}`).join(' ')} className={styles.trace} />
      {!points.length && <text x="160" y="225" textAnchor="middle" className={styles.prompt}>Draw over the dotted guide</text>}
    </svg>
    <div className={styles.actions}><button onClick={() => { strokePoints.current = []; setPoints([]); setScore(null) }}>Clear stroke</button><button disabled={points.length < 3} onClick={replay}>Replay stroke</button><button onClick={() => select((index + 1) % lessons.length)}>Next shape →</button></div>
    <p className={styles.feedback} role="status">{score === null ? 'Draw a shape to get gentle feedback.' : score === 0 ? 'Try a longer stroke along the guide.' : `${score}/100 · ${score >= 80 ? 'Lovely control!' : score >= 50 ? 'Good start. Try a slower stroke.' : 'Keep practicing—the next line can be steadier.'}`}</p>
  </section>
}
