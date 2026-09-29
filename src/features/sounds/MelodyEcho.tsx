import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Music2, Play, RotateCcw } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { midiFrequency, midiName } from './pitchModel'
import './melodyEcho.css'

const keys = [60, 62, 64, 67] as const
const rounds = [
  { notes: [60, 64, 67], tip: 'Listen for a melody that climbs.' },
  { notes: [67, 64, 60], tip: 'This one walks back down.' },
  { notes: [60, 67, 64], tip: 'Hear the leap, then the little step.' },
] as const
const STORE = 'bloom-melody-echo-v1'

export function MelodyEcho() {
  const [round, setRound] = useState(0)
  const [input, setInput] = useState<number[]>([])
  const [heard, setHeard] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(false)
  const [complete, setComplete] = useState(false)
  const [sessions, setSessions] = useState(() => {
    try { return Number(localStorage.getItem(STORE)) || 0 } catch { return 0 }
  })
  const [score, setScore] = useState(0)
  const audio = useRef<AudioContext | null>(null)
  const timers = useRef<number[]>([])
  const svg = useRef<SVGSVGElement>(null)
  const active = useRef(true)

  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
      timers.current.forEach(clearTimeout)
      void audio.current?.close()
      if (svg.current) gsap.killTweensOf(svg.current.querySelectorAll('.melody-dot'))
    }
  }, [])

  const note = (midi: number, start: number, length = .34) => {
    const ctx = audio.current
    if (!ctx) return
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = midiFrequency(midi)
    gain.gain.setValueAtTime(.001, start)
    gain.gain.exponentialRampToValueAtTime(.1, start + .02)
    gain.gain.exponentialRampToValueAtTime(.001, start + length)
    oscillator.connect(gain).connect(ctx.destination)
    oscillator.start(start)
    oscillator.stop(start + length + .02)
  }
  const play = async () => {
    if (playing) return
    setError(false)
    setPlaying(true)
    try {
      audio.current ??= new AudioContext()
      await audio.current.resume()
      const now = audio.current.currentTime
      rounds[round].notes.forEach((midi, i) => note(midi, now + .05 + i * .48))
      if (!prefersReducedMotion() && svg.current) {
        const dots = svg.current.querySelectorAll('.melody-dot')
        gsap.fromTo(dots, { scale: 1 }, { scale: 1.35, duration: .18, yoyo: true, repeat: 1, stagger: .48, transformOrigin: 'center' })
      }
      timers.current.push(window.setTimeout(() => { if (active.current) { setHeard(true); setPlaying(false) } }, 1530))
    } catch {
      setError(true)
      setHeard(true)
      setPlaying(false)
    }
  }
  const press = (midi: number) => {
    if (!heard || playing || input.length >= 3) return
    if (audio.current) note(midi, audio.current.currentTime + .01, .25)
    const next = [...input, midi]
    setInput(next)
    if (next.length === 3) setScore(next.filter((value, i) => value === rounds[round].notes[i]).length)
  }
  const advance = () => {
    if (round === rounds.length - 1) {
      const total = sessions + 1
      setSessions(total)
      try { localStorage.setItem(STORE, String(total)) } catch { /* Optional progress. */ }
      setComplete(true)
      return
    }
    setRound(value => value + 1)
    setInput([])
    setHeard(false)
    setScore(0)
  }
  const restart = () => { setRound(0); setInput([]); setHeard(false); setScore(0); setComplete(false); setError(false) }
  const target = rounds[round]
  return <section className="studio-card melody-echo" aria-label="Melody echo session">
    <div className="melody-head"><Music2 size={22} aria-hidden="true" /><p>Three tiny melodies. Listen, then echo each phrase.</p></div>
    {complete ? <div className="melody-finish" role="status"><strong>Session complete ✨</strong><p>You practiced listening, pitch, and musical memory. Completed sessions: {sessions}.</p><button onClick={restart}><RotateCcw size={16} /> Play again</button></div> : <>
      <div className="melody-progress" aria-label={`Melody ${round + 1} of 3`}>{rounds.map((_, i) => <span key={i} aria-current={round === i ? 'step' : undefined} />)}</div>
      <p className="melody-tip">Melody {round + 1} of 3 · {target.tip}</p>
      <svg ref={svg} className="melody-staff" viewBox="0 0 320 130" role="img" aria-label={input.length === 3 || error ? `Target notes: ${target.notes.map(midiName).join(', ')}` : 'Three hidden notes on a musical staff'}>
        {[26, 48, 70, 92].map(y => <line key={y} x1="20" x2="300" y1={y} y2={y} className="melody-line" />)}
        <path d="M55 65 Q160 20 265 65" className="melody-path" />
        {target.notes.map((midi, i) => <circle key={i} className="melody-dot" cx={55 + i * 105} cy={input.length === 3 || error ? 95 - (midi - 60) * 8 : 65} r="13" />)}
        <text x="160" y="122" textAnchor="middle">{input.length === 3 || error ? target.notes.map(midiName).join(' · ') : 'Listen first, then echo'}</text>
      </svg>
      <button className="melody-play" onClick={() => void play()} disabled={playing}><Play size={16} /> {playing ? 'Playing melody…' : heard ? 'Hear it again' : 'Play melody'}</button>
      {error && <p role="alert">Audio is unavailable here. Use the note names shown above to practice visually.</p>}
      <div className="melody-keys" role="group" aria-label="Echo the melody">{keys.map(midi => <button key={midi} disabled={!heard || input.length === 3 || playing} onClick={() => press(midi)}>{midiName(midi)}</button>)}</div>
      <p className="melody-answer" role="status">{input.length === 3 ? `${score} of 3 notes in place. ${score === 3 ? 'Perfect echo!' : 'Listen once more and notice the shape.'}` : input.length ? `Your echo: ${input.map(midiName).join(' · ')} · ${3 - input.length} to go` : 'Your notes will appear here.'}</p>
      {input.length === 3 && <div className="melody-actions"><button onClick={() => { setInput([]); setScore(0) }}>Try this melody again</button><button onClick={advance}>{round === rounds.length - 1 ? 'Finish session' : 'Next melody →'}</button></div>}
    </>}
  </section>
}
