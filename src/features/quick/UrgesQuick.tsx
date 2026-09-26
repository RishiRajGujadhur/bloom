import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { createNoise2D } from 'simplex-noise'
import { SwipeDeck } from '../../components/ui/SwipeDeck'
import { MoodGuide } from '../../components/ui/MoodGuide'
import { QuickPanel, lastMood, logMood } from '../../components/ui/QuickPanel'
import { readStore, writeStore } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'

const on = (id: string) => subOn('urgeTracker', id)
const KEY = 'bloom-urge-surf-v1'
type Surf = { surfed: number; passed: number; tried: Record<string, number> }

/** Alternatives, ordered by the mood they help most. */
export const alternatives = [
  { id: 'water', emoji: '💧', title: 'Drink a glass of water', moods: ['tired', 'stressed'] },
  { id: 'walk', emoji: '🚶', title: 'Walk for five minutes', moods: ['low', 'anxious', 'tired'] },
  { id: 'breathe', emoji: '🌬️', title: 'Four slow breaths', moods: ['anxious', 'stressed'] },
  { id: 'text', emoji: '💬', title: 'Message a friend', moods: ['low'] },
  { id: 'stretch', emoji: '🙆', title: 'Stretch your shoulders', moods: ['stressed', 'tired'] },
  { id: 'music', emoji: '🎧', title: 'Play one favourite song', moods: ['low', 'happy', 'calm'] },
  { id: 'write', emoji: '✍️', title: 'Write the urge down', moods: ['anxious', 'focused'] },
  { id: 'cold', emoji: '🧊', title: 'Cold water on your face', moods: ['stressed', 'energised'] },
]
export const alternativesFor = (mood: string | null) =>
  [...alternatives].sort((a, b) => Number(!!mood && b.moods.includes(mood)) - Number(!!mood && a.moods.includes(mood)))

/** Urge-surfing: a simplex-noise wave that rises, crests and falls over 90 s. */
function SurfWave({ seconds }: { seconds: number }) {
  const path = useRef<SVGPathElement>(null)
  const noise = useRef(createNoise2D())
  useEffect(() => {
    const draw = (t: number) => {
      const crest = Math.sin(Math.min(1, seconds / 90) * Math.PI) // 0 → 1 → 0
      let d = 'M0 80'
      for (let x = 0; x <= 300; x += 10) {
        const y = 60 - crest * 38 * Math.exp(-(((x - 150) / 90) ** 2)) + noise.current(x / 60, t / 1.5) * 6
        d += ` L${x} ${y.toFixed(1)}`
      }
      path.current?.setAttribute('d', `${d} L300 80 Z`)
    }
    draw(0)
    const tick = (t: number) => draw(t)
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [seconds])
  return (
    <svg className="urge-surf" viewBox="0 0 300 80" aria-hidden="true">
      <defs>
        <linearGradient id="surfFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4fb3d9" />
          <stop offset="1" stopColor="#2a6f97" />
        </linearGradient>
      </defs>
      <path ref={path} fill="url(#surfFill)" />
    </svg>
  )
}

export function UrgesQuick() {
  const [mood, setMood] = useState(() => lastMood('urges'))
  const [surf, setSurf] = useState<Surf>(() => readStore(KEY, { surfed: 0, passed: 0, tried: {} }))
  const [running, setRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const save = (s: Surf) => { setSurf(s); writeStore(KEY, s) }
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setSeconds((s) => (s >= 90 ? s : s + 1)), 1000)
    return () => clearInterval(t)
  }, [running])
  const finished = running && seconds >= 90

  return (
    <QuickPanel id="urges" title="Ride it out">
      {on('moodTag') && <MoodGuide value={mood} onChange={(m) => { setMood(m); logMood('urges', m) }} label="What's under the urge?" />}
      {on('surfWave') && (
        <div className="urge-surf-box">
          <SurfWave seconds={seconds} />
          <p className="quick-note">
            {!running ? 'Urges peak and pass, usually within 90 seconds. Surf the wave.' : finished ? 'The wave has passed. Did the urge pass too?' : seconds < 45 ? `Rising… breathe with it (${90 - seconds}s)` : `Cresting and falling… (${90 - seconds}s)`}
          </p>
          {!running ? (
            <button type="button" className="primary" onClick={() => { setSeconds(0); setRunning(true) }}>Surf the urge</button>
          ) : finished && on('passedCheck') ? (
            <div className="studio-chip-row">
              <button type="button" className="primary" onClick={() => { save({ ...surf, surfed: surf.surfed + 1, passed: surf.passed + 1 }); setRunning(false) }}>It passed 🌊</button>
              <button type="button" className="quiet-button" onClick={() => { save({ ...surf, surfed: surf.surfed + 1 }); setSeconds(0) }}>Surf again</button>
            </div>
          ) : (
            <button type="button" className="quiet-button" onClick={() => setRunning(false)}>Stop</button>
          )}
          {on('surfStats') && surf.surfed > 0 && <small className="quick-note">Surfed {surf.surfed}× · passed {surf.passed}×</small>}
        </div>
      )}
      {on('alternatives') && (
        <SwipeDeck
          label="Swipe right on something you'll try instead"
          yes="Try it"
          no="Nope"
          cards={alternativesFor(mood).map((a) => ({ id: a.id, emoji: a.emoji, title: a.title, detail: surf.tried[a.id] ? `Tried ${surf.tried[a.id]}×` : undefined }))}
          empty="Pick again tomorrow — you've seen them all."
          onSwipe={(card, yes) => yes && save({ ...surf, tried: { ...surf.tried, [card.id]: (surf.tried[card.id] ?? 0) + 1 } })}
        />
      )}
    </QuickPanel>
  )
}
