import { DropdownSelect } from '../../../components/ui/DropdownSelect'
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'
import { COLOURS, gardenTick, handPoints, hoverPause, multiplier, newGarden, overPause, PAUSE_RECT, ROUND_SECONDS, STREAK_SECONDS, VISION_HEIGHT as H, VISION_WIDTH as W, type GardenMode, type HoverState, type VisionPoint } from './visionModel'
import { visionCamera } from './visionCamera'
import './bloomVision.css'

type InputMode = 'idle' | 'loading' | 'camera' | 'practice'
type Result = { headline: string; lines: string[]; record: boolean }
const MODES: { id: GardenMode; title: string; text: string }[] = [
  { id: 'colour', title: 'Colour Garden', text: '90 gentle seconds · match the named colour' },
  { id: 'order', title: 'Garden Order', text: 'Follow a 3-colour mini-quest · +105 per order' },
  { id: 'zen', title: 'Zen Mode', text: 'No timer, no thorns · finish whenever you like' },
]
const special = { pollen: { label: 'Pollen', symbol: '✺', fill: '#fbbf24' }, freeze: { label: 'Freeze', symbol: '❄', fill: '#a5e8ff' }, prism: { label: 'Prism', symbol: '◇', fill: '#c4b5fd' }, thorn: { label: 'Thorn', symbol: '✹', fill: '#fda4af' } }

export default function BloomVision() {
  const [gardenMode, setGardenMode] = useState<GardenMode>('colour')
  const [hands, setHands] = useState<1 | 2>(2)
  // Separate mode records; old 60-second records are not compared to new rules.
  const colourRecord = useBest('vision-v2-colour')
  const orderRecord = useBest('vision-v2-order')
  const zenRecord = useBest('vision-v2-zen')
  const [best, submit] = { colour: colourRecord, order: orderRecord, zen: zenRecord }[gardenMode]
  const [mode, setMode] = useState<InputMode>('idle')
  const [error, setError] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [round, setRound] = useState(0)
  const [view, setView] = useState(() => newGarden('colour'))
  const [tracking, setTracking] = useState({ points: [] as VisionPoint[], count: 0 })
  const [paused, setPaused] = useState(false)
  const [hover, setHover] = useState(0)
  const video = useRef<HTMLVideoElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const effects = useRef<SVGGElement>(null)
  const camera = useRef<ReturnType<typeof visionCamera> | null>(null)
  const pointer = useRef<VisionPoint[]>([])
  const engine = useRef(newGarden('colour'))
  const pausedRef = useRef(false)
  const hoverRef = useRef<HoverState>({ progress: 0, latched: false, away: 0 })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])
  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current
    hoverRef.current = { progress: 0, latched: true, away: 0 }
    setPaused(pausedRef.current); setHover(0)
  }, [])
  const restart = useCallback(() => {
    camera.current?.stop(); camera.current = null; pointer.current = []
    pausedRef.current = false; setPaused(false)
    hoverRef.current = { progress: 0, latched: false, away: 0 }; setHover(0)
    setMode('idle'); setError(''); setResult(null); setRound((r) => r + 1)
  }, [])
  useEffect(() => () => { camera.current?.stop() }, [])
  const finish = useCallback(() => {
    const s = engine.current
    if (s.finished && camera.current === null && result) return
    s.finished = true; camera.current?.stop(); camera.current = null
    setResult({ headline: 'Your colour garden bloomed!', lines: [`${s.hits} matching bubbles · ${s.score} points`, `Best streak: ${s.maxCombo}${s.mode === 'order' ? ` · ${s.orders} garden orders` : ''}`, s.mode === 'zen' ? 'A peaceful moment, at your pace.' : 'Small reaches, brighter focus. Ready for another round?'], record: submitRef.current(s.score) })
  }, [result])
  const finishRef = useRef(finish)
  useEffect(() => { finishRef.current = finish }, [finish])
  const startCamera = async () => {
    if (!video.current || mode === 'loading') return
    camera.current?.stop()
    const session = visionCamera(video.current, hands); camera.current = session
    setError(''); setMode('loading')
    try { if (await session.start() && camera.current === session) setMode('camera') }
    catch (e) {
      if (camera.current !== session) return
      setError(e instanceof Error ? e.message : 'Hand tracking could not start. Try practice mode.'); setMode('idle')
    }
  }
  useEffect(() => {
    engine.current = newGarden(gardenMode); setView(engine.current)
    setTracking({ points: [], count: 0 })
    if (mode !== 'camera' && mode !== 'practice') return
    let raf = 0, last = performance.now(), inferenceAt = 0, previousVideoTime = -1
    let points: VisionPoint[] = [], count = 0
    const layer = effects.current
    const onVisibility = () => {
      pointer.current = []
      if (document.hidden) { pausedRef.current = true; setPaused(true); hoverRef.current = { progress: 0, latched: true, away: 0 } }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat || (e.target as HTMLElement)?.closest('button, input, select, textarea')) return
      e.preventDefault(); togglePause()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('keydown', onKey)
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, .05); last = now
      if (engine.current.finished) return
      if (document.hidden) { raf = requestAnimationFrame(loop); return }
      if (mode === 'camera' && now - inferenceAt >= 50 && video.current && video.current.currentTime !== previousVideoTime) {
        inferenceAt = now; previousVideoTime = video.current.currentTime
        try {
          const detected = camera.current?.detect(now) ?? []
          points = handPoints(detected); count = detected.length
        } catch {
          camera.current?.stop(); camera.current = null
          setError('Hand tracking stopped. Please retry, or use practice mode.'); setMode('idle'); return
        }
      } else if (mode === 'practice') points = pointer.current
      if (mode === 'camera' && now - inferenceAt > 300) { points = []; count = 0 }
      const dwell = hoverPause(hoverRef.current, overPause(points), dt)
      hoverRef.current = dwell.state
      if (dwell.toggle) togglePause()
      setHover(dwell.toggle ? 0 : dwell.state.progress)
      setTracking({ points, count })
      // Tracking continues during pause so a hand can press Resume.
      if (!pausedRef.current && (mode === 'practice' || points.length > 0)) {
        const tick = gardenTick(engine.current, dt, points)
        engine.current = tick.state
        for (const b of tick.popped) {
          const node = svg.current?.querySelector(`[data-bubble="${b.id}"]`)
          if (node && layer && !reducedMotion()) {
            const burst = node.cloneNode(true) as SVGElement
            burst.removeAttribute('data-bubble'); layer.appendChild(burst)
            gsap.to(burst, { opacity: 0, attr: { transform: `translate(${b.x} ${b.y}) scale(${b.kind === 'pollen' ? 3 : 1.5})` }, duration: .4, onComplete: () => burst.remove() })
          }
        }
        setView(tick.state)
        if (tick.state.finished) { finishRef.current(); return }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('keydown', onKey)
      layer?.querySelectorAll('*').forEach((node) => gsap.killTweensOf(node)); layer?.replaceChildren()
    }
  }, [mode, round, gardenMode, togglePause])
  const practice = () => { camera.current?.stop(); camera.current = null; setError(''); setMode('practice') }
  const move = (e: PointerEvent) => {
    if (mode !== 'practice') return
    const m = svg.current?.getScreenCTM(); if (!m) return
    pointer.current = [new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())]
  }
  const active = (mode === 'camera' || mode === 'practice') && !result
  const streakRemaining = view.combo ? Math.max(0, 1 - (view.elapsed - view.lastMatch) / STREAK_SECONDS) : 0
  return <div className="bv-shell"><GameShell title="Bloom Vision Game" score={view.score} best={best} result={result} onRestart={restart} gentleResult hint="35 points per match · larger, slower bubbles · brush past other colours freely · hover Pause for a moment or press Space.">
    <div className="bv-game">
      <div className="bv-toolbar">
        <span><i style={{ background: COLOURS[view.target].fill }} /> Reach for <b>{COLOURS[view.target].name}</b></span>
        <span>{gardenMode === 'zen' ? '∞ Zen' : `${Math.max(0, Math.ceil(ROUND_SECONDS - view.elapsed))}s`} · {view.hits} matches</span>
        {active && <><button type="button" onClick={restart}>Menu{mode === 'camera' ? ' / stop camera' : ''}</button><button type="button" onClick={finish}>Finish round</button></>}
      </div>
      <div className="bv-progress-row"><span>{view.combo} streak · ×{multiplier(view.combo)} multiplier</span><meter min="0" max="1" value={streakRemaining} aria-label="Streak time remaining" /><span>{view.freeze > 0 ? `❄ Freeze ${Math.ceil(view.freeze)}s` : '5 matches → ×2 · up to ×4'}</span></div>
      {gardenMode === 'order' && <div className="bv-order" aria-label="Garden order"><span>Order {view.orders + 1}:</span>{view.sequence.map((c, i) => <span key={i} aria-current={i === view.orderStep ? 'step' : undefined} className={i < view.orderStep ? 'done' : i === view.orderStep ? 'current' : ''}><i style={{ background: COLOURS[c].fill }} />{i < view.orderStep ? '✓ ' : ''}{COLOURS[c].name}</span>)}</div>}
      <div className={`bv-field ${mode === 'idle' || mode === 'loading' ? 'bv-menu-field' : ''}`} onPointerMove={move} onPointerDown={move} onPointerLeave={() => { pointer.current = [] }} onPointerUp={(e) => { if (e.pointerType !== 'mouse') pointer.current = [] }}>
        <video ref={video} muted playsInline className={mode === 'camera' && !result ? 'bv-video on' : 'bv-video'} aria-label="Mirrored camera preview" />
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Floating colour bubbles and tracked fingertips">
          <defs><radialGradient id="bv-glow"><stop stopColor="#fff" stopOpacity=".6" /><stop offset="1" stopColor="#fff" stopOpacity=".05" /></radialGradient><linearGradient id="bv-prism"><stop stopColor="#fb7185" /><stop offset=".5" stopColor="#38bdf8" /><stop offset="1" stopColor="#34d399" /></linearGradient></defs>
          {view.bubbles.map((b) => {
            const kind = b.kind ?? 'colour', power = kind === 'colour' ? null : special[kind]
            const fill = kind === 'prism' ? 'url(#bv-prism)' : power?.fill ?? COLOURS[b.colour].fill
            return <g key={b.id} data-bubble={b.id} data-kind={kind} transform={`translate(${b.x} ${b.y})`}>
              {kind === 'thorn' && <path d="M0-48l10 15 24-1-1 23 15 11-15 10 1 24-23-1-11 15-10-15-24 1 1-23-15-11 15-10-1-24 23 1z" fill="#623144" stroke="#fda4af" strokeWidth="2" />}
              <circle r={b.radius} fill={fill} fillOpacity={kind === 'thorn' ? .16 : .5} stroke={power?.fill ?? fill} strokeWidth={power ? 4 : 3} />
              <circle r={b.radius - 4} fill="url(#bv-glow)" />
              <text textAnchor="middle" y={power ? -3 : 5} fill="#fff" fontSize={power ? 25 : 15} fontWeight="700">{power?.symbol ?? COLOURS[b.colour].name}</text>
              {power && <text textAnchor="middle" y="22" fill="#fff" fontSize="12" fontWeight="700">{power.label}</text>}
            </g>
          })}
          <g ref={effects} aria-hidden="true" />
          {active && <rect x={PAUSE_RECT.x} y={PAUSE_RECT.y} width={PAUSE_RECT.width} height={PAUSE_RECT.height} rx="18" fill="none" stroke="#c9fbe6" strokeWidth="3" opacity={hover > 0 ? 1 : .3} />}
          {tracking.points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="15" fill={i < 6 ? '#96e4c4' : '#c4b5fd'} fillOpacity=".5" stroke={i < 6 ? '#c9fbe6' : '#e2d6ff'} strokeWidth="3" />)}
        </svg>
        {active && <>
          <button type="button" className="bv-pause" aria-label={paused ? 'Resume game' : 'Pause game'} onClick={togglePause} style={{ '--bv-hover': `${hover * 100}%` } as React.CSSProperties}><b>{paused ? '▶ Resume' : 'Ⅱ Pause'}</b><small>{hoverRef.current.latched ? 'Move away, then hover' : 'Hover hand or tap'}</small></button>
          {paused && <div className="bv-paused"><h3>Take a breath.</h3><p>Garden paused. Hover your hand over Resume, tap it, or press Space.</p></div>}
          {mode === 'camera' && <div className="bv-tracking" role="status">{tracking.count}/{hands} {hands === 1 ? 'hand' : 'hands'} detected{!tracking.count ? ' · clock held' : ''}{hands === 2 && tracking.count === 1 ? ' · either hand can play' : ''}</div>}
        </>}
        {(mode === 'idle' || mode === 'loading') && !result && <div className="bv-intro">
          <span className="bv-eyebrow">MOVE · MATCH · BLOOM</span><h3>Your garden, your pace.</h3>
          <p>Bigger bubbles. Smaller reaches. One hand or both — you choose.</p>
          <div className="bv-modes" role="group" aria-label="Game mode">{MODES.map((m) => <button type="button" key={m.id} disabled={mode === 'loading'} aria-pressed={gardenMode === m.id} onClick={() => setGardenMode(m.id)}><b>{m.title}</b><small>{m.text}</small></button>)}</div>
          <label className="bv-hands">Camera controls <DropdownSelect value={hands} disabled={mode === 'loading'} onChange={(e) => setHands(Number(e.target.value) as 1 | 2)}><option value="2">Both hands (or either hand)</option><option value="1">One hand</option></DropdownSelect></label>
          <small>For both hands, keep them apart and visible in good light. A live counter shows what the camera sees. Tracking loss holds the clock.</small>
          <div className="bv-legend" aria-label="Bubble guide"><span>✺ <b>Pollen Storm</b> · nearby matching pops</span><span>❄ <b>Time Freeze</b> · 8s slow motion</span><span>◇ <b>Prism</b> · any requested colour</span><span>✹ <b>Thorn</b> · −35 & streak reset{gardenMode === 'zen' ? ' (off in Zen)' : ''}</span></div>
          <small>Match within 6 seconds to grow your streak. Missed matches reset it; your score stays safe. Wrong colours stay intact.</small>
          <div className="bv-actions"><button type="button" className="primary" disabled={mode === 'loading'} onClick={() => void startCamera()}>{mode === 'loading' ? 'Preparing hand tracking…' : 'Enable camera & play'}</button><button type="button" onClick={practice}>Practise with mouse or touch</button>{mode === 'loading' && <button type="button" onClick={restart}>Cancel</button>}</div>
          <small>Camera processing stays on your device. No frames are saved or uploaded. Tracking files download on first use.</small>
          {error && <p role="alert" className="bv-error">{error}</p>}
        </div>}
        {result && <div className="bv-petals" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ '--petal-x': `${(i * 37) % 100}%`, '--petal-delay': `${i * .07}s`, '--petal-colour': COLOURS[i % 3].fill } as React.CSSProperties} />)}</div>}
      </div>
      <p className="bv-status" role="status">{paused ? 'Paused · your score, streak and power-ups are saved.' : mode === 'camera' && active && !tracking.points.length ? 'Show your hand(s) to start. Keep both palms separate; your clock waits for you.' : view.message}</p>
    </div>
  </GameShell></div>
}
