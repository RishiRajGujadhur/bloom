import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowDown, ArrowUp, Music2, Play, RotateCcw } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { makePitchRound, midiFrequency, midiName, type PitchAnswer } from './pitchModel'
import './pitchPractice.css'

const BEST_KEY = 'bloom-pitch-best'
const ROUNDS = 10

export function PitchPractice() {
  const [level, setLevel] = useState<'gentle' | 'close'>('gentle')
  const [round, setRound] = useState(() => makePitchRound('gentle'))
  const [number, setNumber] = useState(1)
  const [correct, setCorrect] = useState(0)
  const [answered, setAnswered] = useState<PitchAnswer | null>(null)
  const [heard, setHeard] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const [finished, setFinished] = useState(false)
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY)) || 0)
  const audio = useRef<AudioContext | null>(null)
  const timer = useRef<number | null>(null)
  const notes = useRef<SVGSVGElement>(null)
  const animation = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    animation.current?.kill()
    void audio.current?.close()
  }, [])

  const play = async () => {
    if (playing) return
    setAudioError(false)
    setHeard(false)
    setPlaying(true)
    try {
      audio.current ??= new AudioContext()
      const ctx = audio.current
      await ctx.resume()
      for (const [index, midi] of [round.firstMidi, round.secondMidi].entries()) {
        const start = ctx.currentTime + .04 + index * .65
        const oscillator = ctx.createOscillator()
        const gain = ctx.createGain()
        oscillator.type = 'sine'
        oscillator.frequency.value = midiFrequency(midi)
        gain.gain.setValueAtTime(.001, start)
        gain.gain.exponentialRampToValueAtTime(.12, start + .025)
        gain.gain.exponentialRampToValueAtTime(.001, start + .48)
        oscillator.connect(gain).connect(ctx.destination)
        oscillator.start(start)
        oscillator.stop(start + .5)
      }
    } catch {
      setPlaying(false)
      setAudioError(true)
      return
    }
    if (!prefersReducedMotion() && notes.current) {
      animation.current?.kill()
      animation.current = gsap.timeline().fromTo(notes.current.querySelectorAll('circle'), { scale: 1 }, { scale: 1.25, duration: .2, yoyo: true, repeat: 1, stagger: .65, transformOrigin: 'center' })
    }
    timer.current = window.setTimeout(() => { setPlaying(false); setHeard(true) }, 1150)
  }
  const answer = (choice: PitchAnswer) => {
    if (!heard || answered) return
    setAnswered(choice)
    if (choice === round.answer) setCorrect((value) => value + 1)
  }
  const next = () => {
    if (number === ROUNDS) {
      const result = Math.round((correct / ROUNDS) * 100)
      if (result > best) { setBest(result); localStorage.setItem(BEST_KEY, String(result)) }
      setFinished(true)
      return
    }
    setNumber((value) => value + 1)
    setRound(makePitchRound(level))
    setAnswered(null)
    setHeard(false)
  }
  const restart = () => { setNumber(1); setCorrect(0); setAnswered(null); setHeard(false); setFinished(false); setRound(makePitchRound(level)) }
  return (
    <section className="studio-card pitch-lab" aria-label="Pitch practice">
      <div className="pitch-head"><Music2 size={20} aria-hidden="true" /><div><strong>Pitch lab</strong><p>Listen to two notes. Is the second higher or lower?</p></div></div>
      <div className="pitch-level" role="radiogroup" aria-label="Pitch difficulty">
        <button type="button" role="radio" aria-checked={level === 'gentle'} disabled={playing} onClick={() => { setLevel('gentle'); setRound(makePitchRound('gentle')); setAnswered(null); setHeard(false) }}>Clear difference</button>
        <button type="button" role="radio" aria-checked={level === 'close'} disabled={playing} onClick={() => { setLevel('close'); setRound(makePitchRound('close')); setAnswered(null); setHeard(false) }}>Close notes</button>
      </div>
      {finished ? <div className="pitch-finish" role="status"><strong>{correct} / {ROUNDS} correct</strong><span>Best {best}%</span><button type="button" onClick={restart}><RotateCcw size={16} /> Try again</button></div> : <>
        <span className="pitch-count">Question {number} of {ROUNDS} · {correct} correct</span>
        <svg ref={notes} className="pitch-staff" viewBox="0 0 320 130" role="img" aria-label={answered ? `First note ${midiName(round.firstMidi)}, second note ${midiName(round.secondMidi)}` : 'Two notes to compare'}>
          {[39, 57, 75, 93].map((y) => <line key={y} x1="25" x2="295" y1={y} y2={y} />)}
          <circle cx="100" cy="75" r="17" />
          <circle cx="220" cy={answered ? (round.answer === 'higher' ? 48 : 100) : 75} r="17" />
          <text x="100" y="124">First</text><text x="220" y="124">Second</text>
        </svg>
        <button type="button" className="pitch-play" onClick={() => void play()} disabled={playing}><Play size={17} /> {playing ? 'Playing notes…' : 'Play two notes'}</button>
        {audioError && <p role="alert">Audio is unavailable in this browser. Try again after checking sound permissions.</p>}
        <div className="pitch-choices"><button type="button" disabled={!heard || !!answered} onClick={() => answer('higher')}><ArrowUp size={17} /> Higher</button><button type="button" disabled={!heard || !!answered} onClick={() => answer('lower')}><ArrowDown size={17} /> Lower</button></div>
        {answered && <div className="pitch-feedback" role="status"><strong>{answered === round.answer ? 'Correct!' : `The second note is ${round.answer}.`}</strong><span>{midiName(round.firstMidi)} → {midiName(round.secondMidi)} · {round.semitones} semitones apart</span><button type="button" onClick={next}>{number === ROUNDS ? 'See results' : 'Next pair'}</button></div>}
      </>}
    </section>
  )
}
