import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Music2, Pause, Play, RotateCcw } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { scoreTap, type TapResult } from './rhythmModel'
import './rhythmPractice.css'

const BEST_KEY = 'bloom-rhythm-best'

export function RhythmPractice() {
  const [bpm, setBpm] = useState(80)
  const [running, setRunning] = useState(false)
  const [beat, setBeat] = useState(0)
  const [taps, setTaps] = useState<TapResult[]>([])
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY)) || 0)
  const startedAt = useRef(0)
  const interval = useRef<number | null>(null)
  const audio = useRef<AudioContext | null>(null)
  const circles = useRef<SVGSVGElement>(null)
  const tapButton = useRef<HTMLButtonElement>(null)
  const score = taps.length ? Math.round(taps.reduce((total, tap) => total + tap.accuracy, 0) / taps.length) : 0

  const click = (accent: boolean) => {
    const ctx = audio.current
    if (!ctx) return
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.frequency.value = accent ? 880 : 660
    oscillator.type = 'sine'
    gain.gain.setValueAtTime(0.06, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
    oscillator.connect(gain).connect(ctx.destination)
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.06)
  }

  const stop = () => {
    if (interval.current !== null) window.clearInterval(interval.current)
    interval.current = null
    setRunning(false)
    void audio.current?.close()
    audio.current = null
  }
  useEffect(() => () => {
    if (interval.current !== null) window.clearInterval(interval.current)
    void audio.current?.close()
  }, [])
  useEffect(() => {
    if (!running || prefersReducedMotion()) return
    const circle = circles.current?.querySelector(`[data-beat="${beat % 4}"]`)
    if (!circle) return
    const tween = gsap.fromTo(circle, { scale: 1 }, { scale: 1.18, duration: .18, yoyo: true, repeat: 1, transformOrigin: 'center' })
    return () => { tween.progress(1).kill() }
  }, [beat, running])
  useEffect(() => { if (running) tapButton.current?.focus() }, [running])
  const start = async () => {
    stop()
    setTaps([])
    setBeat(0)
    try {
      audio.current = new AudioContext()
      await audio.current.resume()
    } catch { audio.current = null }
    startedAt.current = performance.now()
    click(true)
    let count = 0
    interval.current = window.setInterval(() => {
      count++
      setBeat(count)
      click(count % 4 === 0)
    }, 60000 / bpm)
    setRunning(true)
  }
  const tap = () => {
    if (!running) return
    const result = scoreTap(performance.now(), startedAt.current, bpm)
    const next = [...taps, result].slice(-16)
    setTaps(next)
    const average = Math.round(next.reduce((total, item) => total + item.accuracy, 0) / next.length)
    if (average > best && next.length >= 4) {
      setBest(average)
      localStorage.setItem(BEST_KEY, String(average))
    }
  }
  return (
    <section className="studio-card rhythm-lab" aria-label="Rhythm practice">
      <div className="rhythm-head"><Music2 size={20} aria-hidden="true" /><div><strong>Rhythm lab</strong><p>Hear the beat, then tap along. Aim for the center of each pulse.</p></div></div>
      <label className="rhythm-tempo">Tempo <span>{bpm} BPM</span><input type="range" min="50" max="160" step="5" value={bpm} disabled={running} onChange={(event) => setBpm(Number(event.target.value))} aria-label="Practice tempo" /></label>
      <svg ref={circles} className="rhythm-score" viewBox="0 0 320 92" role="img" aria-label={`Beat ${(beat % 4) + 1} of 4`}>
        <path d="M40 46 H280" />
        {[0, 1, 2, 3].map((index) => <circle key={index} data-beat={index} cx={40 + index * 80} cy="46" r={beat % 4 === index && running ? 22 : 16} className={beat % 4 === index && running ? 'is-active' : ''} />)}
      </svg>
      <div className="rhythm-actions"><button type="button" onClick={() => void (running ? stop() : start())}>{running ? <Pause size={17} /> : <Play size={17} />}{running ? 'Stop' : 'Start practice'}</button><button ref={tapButton} type="button" className="rhythm-tap" disabled={!running} onClick={tap}>Tap the beat <span>Space</span></button><button type="button" aria-label="Reset taps" disabled={!taps.length} onClick={() => setTaps([])}><RotateCcw size={17} /></button></div>
      <div className="rhythm-feedback" role="status"><strong>{taps.at(-1)?.hint ?? 'Start to hear the metronome'}</strong><span>{taps.length ? `${score}% timing · ${taps.length} recent taps` : `Best ${best}%`}</span></div>
    </section>
  )
}
