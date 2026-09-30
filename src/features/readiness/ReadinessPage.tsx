import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import { mean, standardDeviation } from 'simple-statistics'
import { CapsBadge } from '../../platform/CapsBadge'
import { useKeepAwake } from '../../platform/presence'
import { hasCap } from '../../platform/caps'
import { getFft } from '../../platform/pffft'
import { burst } from '../../components/ui/celebrate'
import { cleanRR, dayKey, heartRate, lfhf, readiness, rmssd, scansToCsv, sdnn, TACHO_N, type Scan, type Verdict } from './readinessModel'
import { download } from '../lab/exportSuite'
import { cameraPpg, connectBluetooth, loadScans, saveScan, simulate, type Session, type Source } from './sources'
import './readiness.css'

/**
 * Morning Readiness Scan: a 60-second heart-rate-variability reading from a
 * Bluetooth strap, your fingertip on the camera, or a simulated strap. A
 * holographic HUD pulses with every beat; the result is a readiness score
 * against your own baseline, with a push / steady / recover suggestion.
 */
const SCAN_S = 60
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
type Phase = 'idle' | 'connecting' | 'scanning' | 'done'

function Hud({ phase, left, bpm, beats, pulse }: { phase: Phase; left: number; bpm: number; beats: number; pulse: number }) {
  const ring = useRef<SVGGElement>(null)
  const heart = useRef<SVGGElement>(null)
  useLayoutEffect(() => {
    if (!ring.current || reduced()) return
    const t = gsap.to(ring.current, { rotation: 360, svgOrigin: '160 160', duration: 40, ease: 'none', repeat: -1 })
    return () => { t.kill() }
  }, [])
  useLayoutEffect(() => {
    if (!pulse || !heart.current || reduced()) return
    gsap.fromTo(heart.current, { scale: 1.28 }, { scale: 1, transformOrigin: '50% 50%', duration: 0.45, ease: 'elastic.out(1.2, 0.4)' })
  }, [pulse])
  const C = 2 * Math.PI * 128
  const done = phase === 'scanning' ? 1 - left / SCAN_S : phase === 'done' ? 1 : 0
  return (
    <svg className="rd-hud" data-matrix-native viewBox="0 0 320 320" role="img" aria-label={phase === 'scanning' ? `${bpm} beats per minute, ${left} seconds left` : 'Readiness scanner'}>
      <defs>
        <radialGradient id="rd-core"><stop offset="0" stopColor="#ff4d6d" stopOpacity="0.5" /><stop offset="1" stopColor="#ff4d6d" stopOpacity="0" /></radialGradient>
        <linearGradient id="rd-arc" x1="0" x2="1"><stop offset="0" stopColor="#7df9ff" /><stop offset="1" stopColor="#ff4d6d" /></linearGradient>
      </defs>
      <circle cx="160" cy="160" r="150" className="rd-glow" />
      <g ref={ring}>
        {Array.from({ length: 72 }, (_, i) => {
          const a = (i / 72) * Math.PI * 2
          const r1 = i % 6 === 0 ? 140 : 145
          return <line key={i} x1={160 + Math.cos(a) * r1} y1={160 + Math.sin(a) * r1} x2={160 + Math.cos(a) * 150} y2={160 + Math.sin(a) * 150} className="rd-tick" />
        })}
      </g>
      <circle cx="160" cy="160" r="128" className="rd-track" />
      <circle cx="160" cy="160" r="128" className="rd-progress" stroke="url(#rd-arc)" strokeDasharray={`${done * C} ${C}`} transform="rotate(-90 160 160)" />
      <circle cx="160" cy="160" r="100" fill="url(#rd-core)" />
      <g ref={heart}>
        <path d="M160 214 C 112 180, 104 146, 126 130 C 142 119, 156 126, 160 138 C 164 126, 178 119, 194 130 C 216 146, 208 180, 160 214 Z" className="rd-heart" />
      </g>
      <text x="160" y="170" textAnchor="middle" className="rd-bpm">{phase === 'idle' ? '—' : bpm || '··'}</text>
      <text x="160" y="190" textAnchor="middle" className="rd-unit">{phase === 'scanning' ? `bpm · ${left}s` : 'bpm'}</text>
      <text x="160" y="248" textAnchor="middle" className="rd-beats">{beats ? `${beats} beats` : ''}</text>
    </svg>
  )
}

function Gauge({ v }: { v: Verdict }) {
  const needle = useRef<SVGGElement>(null)
  const angle = v.score == null ? -90 : -90 + (v.score / 100) * 180
  useLayoutEffect(() => {
    if (!needle.current) return
    if (reduced()) gsap.set(needle.current, { rotation: angle, transformOrigin: '50% 100%' })
    else gsap.fromTo(needle.current, { rotation: -90, transformOrigin: '50% 100%' }, { rotation: angle, duration: 1.8, ease: 'elastic.out(1, 0.35)' })
  }, [angle])
  const arc = (a0: number, a1: number) => {
    const p = (a: number) => `${120 + 96 * Math.cos(((a - 180) * Math.PI) / 180)} ${120 + 96 * Math.sin(((a - 180) * Math.PI) / 180)}`
    return `M${p(a0)} A96 96 0 0 1 ${p(a1)}`
  }
  return (
    <svg className="rd-gauge" data-matrix-native viewBox="0 0 240 168" role="img" aria-label={v.score == null ? v.label : `Readiness ${v.score} of 100, ${v.label}`}>
      <path d={arc(0, 80)} className="rd-zone recover" />
      <path d={arc(82, 124)} className="rd-zone steady" />
      <path d={arc(126, 180)} className="rd-zone push" />
      <g ref={needle}><path d="M116 120 L120 42 L124 120 Z" className="rd-needle" /></g>
      <circle cx="120" cy="120" r="8" className="rd-hub" />
      <text x="120" y="160" textAnchor="middle" className="rd-score">{v.score ?? '…'}</text>
    </svg>
  )
}

function useUplot(host: React.RefObject<HTMLDivElement | null>, opts: () => Omit<uPlot.Options, 'width'> | null, data: uPlot.AlignedData, deps: unknown[]) {
  const plot = useRef<uPlot | null>(null)
  useEffect(() => {
    const el = host.current
    const o = opts()
    if (!el || !o) return
    const p = new uPlot({ ...o, width: el.clientWidth || 400 } as uPlot.Options, data, el)
    plot.current = p
    const ro = new ResizeObserver(() => p.setSize({ width: el.clientWidth, height: o.height }))
    ro.observe(el)
    return () => { ro.disconnect(); p.destroy(); plot.current = null }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { plot.current?.setData(data) }, [data])
}

export function ReadinessPage() {
  const [source, setSource] = useState<Source>(hasCap('bt') ? 'bluetooth' : 'simulated')
  const [phase, setPhase] = useState<Phase>('idle')
  useKeepAwake(phase === 'scanning')
  const [left, setLeft] = useState(SCAN_S)
  const [bpm, setBpm] = useState(0)
  const [rr, setRr] = useState<number[]>([])
  const [pulse, setPulse] = useState(0)
  const [device, setDevice] = useState('')
  const [err, setErr] = useState('')
  const [history, setHistory] = useState<Scan[]>([])
  const [result, setResult] = useState<{ scan: Scan; verdict: Verdict } | null>(null)
  const session = useRef<Session | null>(null)
  const beats = useRef<number[]>([])
  const video = useRef<HTMLVideoElement>(null)
  const wave = useRef<HTMLCanvasElement>(null)
  const waveBuf = useRef<number[]>([])
  const tachoHost = useRef<HTMLDivElement>(null)
  const trendHost = useRef<HTMLDivElement>(null)

  useEffect(() => { void loadScans().then(setHistory) }, [])
  useEffect(() => () => session.current?.stop(), [])

  const finish = async () => {
    session.current?.stop()
    session.current = null
    const clean = cleanRR(beats.current)
    if (clean.length < 30) {
      setErr('Not enough clean beats. Stay still and try again.')
      setPhase('idle')
      return
    }
    const { fft } = await getFft(TACHO_N)
    const r = rmssd(clean)
    const hr = heartRate(clean)
    const freq = lfhf(clean, fft)
    const past = history.filter((s) => s.date !== dayKey())
    const verdict = readiness({ lnRmssd: Math.log(r), hr }, past)
    const scan: Scan = { date: dayKey(), at: Date.now(), source, hr: Math.round(hr * 10) / 10, rmssd: Math.round(r * 10) / 10, sdnn: Math.round(sdnn(clean) * 10) / 10, lnRmssd: Math.log(r), lfhf: freq ? Math.round(freq.ratio * 100) / 100 : null, beats: clean.length, score: verdict.score }
    setHistory(await saveScan(scan, clean))
    setResult({ scan, verdict })
    setPhase('done')
    if (verdict.tone === 'push') burst(undefined, 'stars')
  }

  // Countdown while scanning.
  useEffect(() => {
    if (phase !== 'scanning') return
    const t0 = Date.now()
    const id = setInterval(() => {
      const l = Math.max(0, SCAN_S - Math.floor((Date.now() - t0) / 1000))
      setLeft(l)
      if (l === 0) { clearInterval(id); void finish() }
    }, 250)
    return () => clearInterval(id)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    setErr('')
    setResult(null)
    beats.current = []
    waveBuf.current = []
    setRr([])
    setBpm(0)
    setLeft(SCAN_S)
    setPhase('connecting')
    const h = {
      onBeat: (x: number) => { beats.current.push(x); setRr([...beats.current]); setPulse((p) => p + 1) },
      onBpm: (b: number) => setBpm(b),
      onWave: (v: number) => { const w = waveBuf.current; w.push(v); if (w.length > 240) w.shift() },
      onError: (m: string) => setErr(m),
    }
    try {
      session.current = source === 'bluetooth' ? await connectBluetooth(h) : source === 'camera' ? await cameraPpg({ ...h, onBpm: undefined }, video.current!) : simulate(h, { hr: 57, rsa: 72, seed: Date.now() % 1000 })
      setDevice(session.current.name)
      setPhase('scanning')
    } catch (e) {
      setErr((e as Error).name === 'NotFoundError' ? 'No device chosen.' : (e as Error).message)
      setPhase('idle')
    }
  }
  const cancel = () => { session.current?.stop(); session.current = null; setPhase('idle') }

  // Camera: bpm from recent beats, and the raw PPG trace on a canvas.
  useEffect(() => {
    if (source !== 'camera' || phase !== 'scanning') return
    if (rr.length) setBpm(Math.round(heartRate(rr.slice(-6))))
    const c = wave.current?.getContext('2d')
    if (!c || !wave.current) return
    const w = waveBuf.current
    const W = wave.current.width, H = wave.current.height
    const lo = Math.min(...w), hi = Math.max(...w)
    c.clearRect(0, 0, W, H)
    c.strokeStyle = '#ff4d6d'
    c.lineWidth = 2
    c.beginPath()
    w.forEach((v, i) => { const x = (i / 240) * W; const y = H - ((v - lo) / Math.max(1e-6, hi - lo)) * (H - 8) - 4; if (i) c.lineTo(x, y); else c.moveTo(x, y) })
    c.stroke()
  }, [rr, source, phase])

  // Live tachogram: every beat's RR interval.
  const tacho: uPlot.AlignedData = [rr.map((_, i) => i), rr]
  useUplot(tachoHost, () => ({
    height: 150,
    legend: { show: false },
    cursor: { show: false },
    scales: { x: { time: false }, y: { range: (_u, lo, hi) => [Math.min(lo, 800) - 40, Math.max(hi, 1200) + 40] } },
    axes: [{ show: false }, { stroke: '#8fa3c7', grid: { stroke: '#ffffff12' }, size: 44, values: (_u, v) => v.map((x) => `${Math.round(x)}`) }],
    series: [{}, { stroke: '#7df9ff', width: 2, fill: 'rgba(125,249,255,0.12)', points: { show: true, size: 4, fill: '#ff4d6d' } }],
  }), tacho, [])

  // 30-day trend of ln(RMSSD) with the baseline band.
  const hist = history.slice(-30)
  const lnVals = hist.map((s) => s.lnRmssd)
  const m = lnVals.length > 2 ? mean(lnVals) : 0
  const sd = lnVals.length > 2 ? standardDeviation(lnVals) : 0
  const trend: uPlot.AlignedData = [hist.map((s) => s.at / 1000), lnVals, hist.map(() => m + sd), hist.map(() => m - sd)]
  useUplot(trendHost, () => (hist.length > 1 ? {
    height: 150,
    legend: { show: false },
    axes: [{ stroke: '#8fa3c7', grid: { show: false } }, { stroke: '#8fa3c7', grid: { stroke: '#ffffff12' }, size: 40, values: (_u, v) => v.map((x) => x.toFixed(1)) }],
    series: [{}, { stroke: '#a3e635', width: 2.5, points: { show: true, size: 6, fill: '#a3e635' } }, { stroke: '#ffffff40', dash: [4, 4] }, { stroke: '#ffffff40', dash: [4, 4] }],
    bands: [{ series: [2, 3], fill: 'rgba(163,230,53,0.08)' }],
  } : null), trend, [hist.length])

  return (
    <div className="rd-page">
      <section className="rd-main">
        <header className="rd-head">
          <div>
            <p className="rd-eyebrow">Morning readiness</p>
            <h2>60 seconds. How ready are you today?</h2>
          </div>
          <CapsBadge caps={['bt', 'simd', 'opfs']} />
        </header>
        <div className="rd-stage">
          <Hud phase={phase} left={left} bpm={bpm} beats={rr.length} pulse={pulse} />
          <div className="rd-controls">
            <div className="rd-sources" role="radiogroup" aria-label="Heart-rate source">
              {([['bluetooth', '📡 Bluetooth strap'], ['camera', '☝️ Fingertip camera'], ['simulated', '🧪 Simulated strap']] as [Source, string][]).map(([id, label]) => (
                <button key={id} type="button" role="radio" aria-checked={source === id} className={source === id ? 'on' : ''} disabled={phase === 'scanning' || phase === 'connecting'} onClick={() => setSource(id)}>{label}</button>
              ))}
            </div>
            <p className="rd-hint">
              {source === 'bluetooth' && 'Wear a chest strap or turn on heart-rate broadcast on your watch, then pick it from the list.'}
              {source === 'camera' && 'Rest your fingertip gently over the back camera (and flash). Keep still and breathe normally.'}
              {source === 'simulated' && 'A simulated strap with realistic beat-to-beat variation, for trying it out.'}
            </p>
            {phase === 'scanning' || phase === 'connecting' ? (
              <button type="button" className="rd-ghost" onClick={cancel}>Cancel</button>
            ) : (
              <button type="button" className="rd-cta" onClick={() => void start()}>{phase === 'done' ? 'Scan again' : 'Start 60-second scan'}</button>
            )}
            {device && phase === 'scanning' && <p className="rd-device">● {device}</p>}
            {err && <p className="voice-error">{err}</p>}
            <video ref={video} className="rd-video" playsInline muted hidden={source !== 'camera' || phase !== 'scanning'} />
            {source === 'camera' && phase === 'scanning' && <canvas ref={wave} className="rd-wave" width={480} height={80} data-matrix-native aria-label="Pulse waveform" />}
          </div>
        </div>
        <div className="rd-chart">
          <h3>Beat-to-beat intervals <small>ms · each dot is one heartbeat</small></h3>
          <div ref={tachoHost} data-matrix-native />
        </div>
      </section>
      <aside className="rd-side">
        {result ? (
          <div className={`rd-card rd-result ${result.verdict.tone}`}>
            <Gauge v={result.verdict} />
            <h3>{result.verdict.label}</h3>
            <p>{result.verdict.advice}</p>
            <div className="rd-metrics">
              <div><b>{result.scan.rmssd}</b><small>RMSSD ms</small></div>
              <div><b>{Math.round(result.scan.hr)}</b><small>resting bpm</small></div>
              <div><b>{result.scan.sdnn}</b><small>SDNN ms</small></div>
              <div><b>{result.scan.lfhf ?? '—'}</b><small>LF/HF</small></div>
            </div>
            <div className="rd-links">
              {result.verdict.tone === 'push' && <a href="#workout">Plan a hard session →</a>}
              {result.verdict.tone === 'recover' && <a href="#yoga">Gentle yoga →</a>}
              <a href="#energy">Energy →</a>
            </div>
          </div>
        ) : (
          <div className="rd-card">
            <h3>How it works</h3>
            <p>Your heart doesn’t beat like a metronome. The tiny variations between beats (HRV) are driven by your nervous system. When you’re well recovered they’re larger; stress, poor sleep or illness shrink them.</p>
            <p className="rd-small">Measured each morning and compared with your own baseline, it’s one of the best signals for when to push and when to rest. A wellness indicator, not a medical test.</p>
          </div>
        )}
        <div className="rd-card">
          <h3>Your baseline <small>ln(RMSSD), last 30 scans</small></h3>
          {hist.length > 1 ? <div ref={trendHost} data-matrix-native /> : <p className="rd-small">Your trend appears after two scans.</p>}
          <p className="rd-small">{hist.length} scan{hist.length === 1 ? '' : 's'} stored privately on this device.</p>
          {history.length > 0 && (
            <button
              type="button"
              className="quiet-button"
              onClick={() => download(new Blob([scansToCsv(history)], { type: 'text/csv' }), `bloom-hrv-${new Date().toISOString().slice(0, 10)}.csv`)}
            >
              ⬇ Export all scans (CSV)
            </button>
          )}
        </div>
      </aside>
    </div>
  )
}
