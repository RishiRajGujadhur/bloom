import { useEffect, useRef, useState } from 'react'
import { Gamepad2, History, Play, Radar, Volume2, VolumeX } from 'lucide-react'
import { Rail, Stat, Studio, StudioScene, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { dayKey } from '../../dates'
import { PixiBoard, type CellState } from './PixiBoard'
import { GAMES_KEY, dailyWorkout, games, mathsProblem, memoryPattern, memorySetup, nbackSequence, nextLevel, reactionScore, scoreNback, skillScores, stroopColors, stroopTrial, type GameId, type GamesStore, type Result } from './gamesModel'
import './games.css'
import { FocusTracker, MentalRotation, NumberStream, PatternEcho, WordScramble } from './NewGames'
import { Fireworks } from 'fireworks-js'

const on = (id: string) => subOn('brainGames', id)
const initialStore: GamesStore = { levels: { nback: 1, memory: 1, stroop: 1, reaction: 1, maths: 1, simon: 1, rotate: 1, scramble: 1, track: 1, stream: 1 }, results: [], sound: true }

/** Fireworks over the stage for a new personal best. */
function celebrateBest(el: HTMLElement | null) {
  if (!el || !on('personalBest') || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const fw = new Fireworks(el, { particles: 60, traceSpeed: 4, explosion: 6, intensity: 25 })
  fw.start()
  setTimeout(() => fw.waitStop(true), 2600)
}

function blip(ok: boolean, sound: boolean) {
  if (!sound || !on('sounds')) return
  try {
    const ac = new AudioContext()
    const o = ac.createOscillator()
    const g = ac.createGain()
    o.type = 'triangle'
    o.frequency.value = ok ? 880 : 180
    g.gain.setValueAtTime(0.08, ac.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.18)
    o.connect(g).connect(ac.destination)
    o.start()
    o.stop(ac.currentTime + 0.2)
    setTimeout(() => void ac.close(), 300)
  } catch {
    /* optional */
  }
}

type Finish = (score: number, accuracy: number) => void

function NBack({ level, finish, sound }: { level: number; finish: Finish; sound: boolean }) {
  const n = Math.min(4, 1 + Math.floor((level - 1) / 3))
  const [seq] = useState(() => nbackSequence(n, 18 + n))
  const [i, setI] = useState(-1)
  const [flash, setFlash] = useState(false)
  const pressed = useRef(new Set<number>())
  useEffect(() => {
    if (i >= seq.length) {
      const r = scoreNback(seq, n, pressed.current)
      finish(r.hits * 10 - r.false * 5, r.accuracy)
      return
    }
    const show = setTimeout(() => setFlash(false), 1500 - Math.min(700, level * 40))
    const next = setTimeout(() => {
      setI((x) => x + 1)
      setFlash(true)
    }, 2400 - Math.min(900, level * 50))
    return () => (clearTimeout(show), clearTimeout(next))
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps
  const press = () => {
    if (i < n || pressed.current.has(i)) return
    pressed.current.add(i)
    blip(seq[i] === seq[i - n], sound)
  }
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.code === 'Space' && (e.preventDefault(), press())
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  })
  const cells: CellState[] = Array.from({ length: 9 }, (_, k) => (flash && seq[i] === k ? 'lit' : 'off'))
  return (
    <div className="bg-play">
      <PixiBoard size={3} cells={cells} label="N-back grid" />
      <div className="bg-controls">
        <p>
          Tap <strong>Match</strong> when the square is where it was <strong>{n}</strong> step{n > 1 ? 's' : ''} ago.
        </p>
        <button type="button" className="studio-go" onClick={press}>
          Match <small>space</small>
        </button>
        <small className="studio-empty">
          {Math.max(0, i + 1)} / {seq.length}
        </small>
      </div>
    </div>
  )
}

function MemoryGrid({ level, finish, sound }: { level: number; finish: Finish; sound: boolean }) {
  const { size, tiles } = memorySetup(level)
  const [pattern] = useState(() => memoryPattern(size, tiles))
  const [phase, setPhase] = useState<'show' | 'recall'>('show')
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [wrong, setWrong] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setPhase('recall'), 1200 + tiles * 180)
    return () => clearTimeout(t)
  }, [tiles])
  const tap = (i: number) => {
    if (phase !== 'recall' || picked.has(i)) return
    const ok = pattern.has(i)
    blip(ok, sound)
    const next = new Set(picked).add(i)
    setPicked(next)
    const w = wrong + (ok ? 0 : 1)
    setWrong(w)
    const found = [...next].filter((x) => pattern.has(x)).length
    if (found === tiles || w >= 3) setTimeout(() => finish(found * 10 - w * 5, found / (found + w + (tiles - found))), 500)
  }
  const cells: CellState[] = Array.from({ length: size * size }, (_, k) => (phase === 'show' ? (pattern.has(k) ? 'lit' : 'off') : picked.has(k) ? (pattern.has(k) ? 'hit' : 'miss') : 'off'))
  return (
    <div className="bg-play">
      <PixiBoard size={size} cells={cells} onTap={tap} label="Memory grid" />
      <div className="bg-controls">
        <p>{phase === 'show' ? `Remember ${tiles} tiles…` : 'Tap the tiles that were lit.'}</p>
        <small className="studio-empty">{3 - wrong} mistakes left</small>
      </div>
    </div>
  )
}

function Stroop({ level, finish, sound }: { level: number; finish: Finish; sound: boolean }) {
  const [trial, setTrial] = useState(() => stroopTrial(level))
  const [n, setN] = useState(0)
  const [right, setRight] = useState(0)
  const [left, setLeft] = useState(30)
  useEffect(() => {
    if (left <= 0) return finish(right * 10, n ? right / n : 0)
    const t = setTimeout(() => setLeft((x) => x - 1), 1000)
    return () => clearTimeout(t)
  }, [left]) // eslint-disable-line react-hooks/exhaustive-deps
  const pick = (name: string) => {
    const ok = name === trial.ink
    blip(ok, sound)
    setN((x) => x + 1)
    if (ok) setRight((x) => x + 1)
    setTrial(stroopTrial(level))
  }
  const hex = stroopColors.find((c) => c.name === trial.ink)!.hex
  return (
    <div className="bg-play bg-stroop">
      <div className="bg-word" style={{ color: hex }} key={n}>
        {trial.word}
      </div>
      <div className="bg-controls">
        <p>What colour is the ink? {left}s</p>
        <div className="bg-options">
          {trial.options.map((o) => (
            <button key={o} type="button" className="studio-chip" onClick={() => pick(o)}>
              {o}
            </button>
          ))}
        </div>
        <small className="studio-empty">
          {right} / {n} right
        </small>
      </div>
    </div>
  )
}

function Reaction({ finish, sound }: { finish: Finish; sound: boolean }) {
  const [state, setState] = useState<'wait' | 'go' | 'early'>('wait')
  const [times, setTimes] = useState<number[]>([])
  const shownAt = useRef(0)
  useEffect(() => {
    if (state !== 'wait') return
    const t = setTimeout(() => {
      shownAt.current = performance.now()
      setState('go')
    }, 1200 + Math.random() * 2500)
    return () => clearTimeout(t)
  }, [state, times.length])
  const tap = () => {
    if (state === 'wait') {
      blip(false, sound)
      setState('early')
      setTimeout(() => setState('wait'), 900)
      return
    }
    if (state !== 'go') return
    const ms = performance.now() - shownAt.current
    blip(true, sound)
    const next = [...times, ms]
    setTimes(next)
    if (next.length >= 5) {
      const avg = next.reduce((a, b) => a + b, 0) / next.length
      finish(reactionScore(avg), Math.min(1, reactionScore(avg) / 80))
    } else setState('wait')
  }
  return (
    <div className="bg-play">
      <PixiBoard size={1} cells={[state === 'go' ? 'go' : state === 'early' ? 'miss' : 'wait']} onTap={tap} label="Reaction target" />
      <div className="bg-controls">
        <p>{state === 'go' ? 'Tap now!' : state === 'early' ? 'Too early!' : 'Wait for green…'}</p>
        <small className="studio-empty">{times.length ? `Last ${Math.round(times[times.length - 1])} ms` : `${5 - times.length} taps`}</small>
      </div>
    </div>
  )
}

function Maths({ level, finish, sound }: { level: number; finish: Finish; sound: boolean }) {
  const [p, setP] = useState(() => mathsProblem(level))
  const [value, setValue] = useState('')
  const [right, setRight] = useState(0)
  const [n, setN] = useState(0)
  const [left, setLeft] = useState(45)
  useEffect(() => {
    if (left <= 0) return finish(right * 10, n ? right / n : 0)
    const t = setTimeout(() => setLeft((x) => x - 1), 1000)
    return () => clearTimeout(t)
  }, [left]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="bg-play bg-stroop">
      <div className="bg-word bg-sum" key={n}>
        {p.text}
      </div>
      <form
        className="bg-controls"
        onSubmit={(e) => {
          e.preventDefault()
          const ok = Number(value) === p.answer
          blip(ok, sound)
          setN((x) => x + 1)
          if (ok) setRight((x) => x + 1)
          setValue('')
          setP(mathsProblem(level))
        }}
      >
        <p>{left}s left</p>
        <input className="studio-input bg-answer" inputMode="numeric" autoFocus aria-label="Answer" value={value} onChange={(e) => setValue(e.target.value.replace(/[^\d-]/g, ''))} />
        <small className="studio-empty">
          {right} / {n} right · Enter to submit
        </small>
      </form>
    </div>
  )
}

function SkillRadar({ scores }: { scores: Record<string, number> }) {
  const keys = Object.keys(scores)
  const pts = keys.map((k, i) => {
    const a = (i / keys.length) * Math.PI * 2 - Math.PI / 2
    const r = (scores[k] / 100) * 100
    return [150 + Math.cos(a) * r, 130 + Math.sin(a) * r]
  })
  return (
    <svg className="bg-radar" viewBox="0 0 300 260" aria-label="Skill radar">
      {[0.33, 0.66, 1].map((f) => (
        <polygon key={f} points={keys.map((_, i) => { const a = (i / keys.length) * Math.PI * 2 - Math.PI / 2; return `${150 + Math.cos(a) * 100 * f},${130 + Math.sin(a) * 100 * f}` }).join(' ')} className="bg-radar-grid" />
      ))}
      <polygon points={pts.map((p) => p.join(',')).join(' ')} className="bg-radar-shape" />
      {keys.map((k, i) => {
        const a = (i / keys.length) * Math.PI * 2 - Math.PI / 2
        return (
          <text key={k} x={150 + Math.cos(a) * 122} y={134 + Math.sin(a) * 118} textAnchor="middle">
            {k} {scores[k]}
          </text>
        )
      })}
    </svg>
  )
}

export function GamesPage() {
  const [store, setStoreState] = useState<GamesStore>(() => {
    const saved = readStore(GAMES_KEY, initialStore)
    return { ...saved, levels: { ...initialStore.levels, ...saved.levels } }
  })
  const setStore = (fn: (s: GamesStore) => GamesStore) =>
    setStoreState((c) => {
      const n = fn(c)
      writeStore(GAMES_KEY, n)
      return n
    })
  const [tab, setTab] = useState('play')
  const [game, setGame] = useState<GameId | null>(null)
  const [last, setLast] = useState<Result | null>(null)
  const [round, setRound] = useState(0)
  const today = dayKey()
  const workout = dailyWorkout(today)
  const doneToday = new Set(store.results.filter((r) => dayKey(new Date(r.at)) === today).map((r) => r.game))
  const stage = useRef<HTMLDivElement>(null)

  const finish = (g: GameId): Finish => (score, accuracy) => {
    const level = store.levels[g]
    const r: Result = { at: Date.now(), game: g, level, score: Math.max(0, score), accuracy }
    setStore((s) => ({ ...s, results: [...s.results, r].slice(-500), levels: on('adaptive') ? { ...s.levels, [g]: nextLevel(level, accuracy) } : s.levels }))
    setLast(r)
    setGame(null)
    logActivity('brainGame', { game: g })
    const best = Math.max(0, ...store.results.filter((x) => x.game === g).map((x) => x.score))
    if (store.results.some((x) => x.game === g) && r.score > best) celebrateBest(stage.current)
    else if (accuracy >= 0.8) burst(stage.current, 'stars')
  }
  const start = (g: GameId) => {
    setLast(null)
    setGame(g)
    setRound((x) => x + 1)
    setTab('play')
  }
  const subId: Record<GameId, string> = { nback: 'nback', memory: 'memoryGrid', stroop: 'stroop', reaction: 'reaction', maths: 'speedMaths', simon: 'patternEcho', rotate: 'rotation3d', scramble: 'wordScramble', track: 'focusTracker', stream: 'numberStream' }
  const visible = games.filter((g) => on(subId[g.id]))
  const newProps = (g: GameId) => ({ level: store.levels[g], finish: finish(g), blip: (ok: boolean) => blip(ok, store.sound) })
  const props = (g: GameId) => ({ level: store.levels[g], finish: finish(g), sound: store.sound })

  const play = () => (
    <div ref={stage} className="bg-stage">
      {game ? (
        <div key={round} className="bg-game">
          <button type="button" className="studio-chip bg-quit" onClick={() => setGame(null)}>
            ← All games
          </button>
          {game === 'nback' && <NBack {...props('nback')} />}
          {game === 'memory' && <MemoryGrid {...props('memory')} />}
          {game === 'stroop' && <Stroop {...props('stroop')} />}
          {game === 'reaction' && <Reaction {...props('reaction')} />}
          {game === 'maths' && <Maths {...props('maths')} />}
          {game === 'simon' && <PatternEcho {...newProps('simon')} />}
          {game === 'rotate' && <MentalRotation {...newProps('rotate')} />}
          {game === 'scramble' && <WordScramble {...newProps('scramble')} />}
          {game === 'track' && <FocusTracker {...newProps('track')} />}
          {game === 'stream' && <NumberStream {...newProps('stream')} />}
        </div>
      ) : (
        <div className="iv-programs">
          {last && (
            <div className="studio-card bg-result">
              <strong>{games.find((g) => g.id === last.game)?.name}</strong>
              <div className="studio-stats">
                <Stat value={last.score} label="score" />
                <Stat value={`${Math.round(last.accuracy * 100)}%`} label="accuracy" />
                {on('adaptive') && <Stat value={`${last.level} → ${store.levels[last.game]}`} label="level" />}
              </div>
            </div>
          )}
          {on('daily') && (
            <div className="bg-daily">
              <h3>Today’s brain workout</h3>
              <div className="yg-pose-chips">
                {workout.map((id) => {
                  const g = games.find((x) => x.id === id)!
                  return (
                    <button key={id} type="button" className="studio-chip" aria-pressed={doneToday.has(id)} onClick={() => start(id)}>
                      {doneToday.has(id) ? '✓' : g.emoji} {g.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <Rail label="Games">
            {visible.map((g) => (
              <div key={g.id} role="listitem">
                <button type="button" className="iv-card" onClick={() => start(g.id)}>
                  <span aria-hidden="true">{g.emoji}</span>
                  <strong>{g.name}</strong>
                  <small>{g.blurb}</small>
                  {on('adaptive') && <small>Level {store.levels[g.id]}</small>}
                </button>
              </div>
            ))}
          </Rail>
        </div>
      )}
    </div>
  )

  const skills = skillScores(store.results)
  const stats = () => (
    <div className="studio-split">
      {on('skillRadar') && (
        <div className="studio-card studio-center">
          <SkillRadar scores={skills} />
        </div>
      )}
      {on('history') && (
        <div className="studio-card">
          <h3>Recent games</h3>
          <ul className="wo-sets" style={{ maxHeight: 'none' }}>
            {[...store.results].reverse().slice(0, 12).map((r) => (
              <li key={r.at}>
                <span>
                  {games.find((g) => g.id === r.game)?.emoji} {games.find((g) => g.id === r.game)?.name}
                </span>
                <strong>{r.score}</strong>
                <small>{Math.round(r.accuracy * 100)}%</small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )

  return (
    <Studio
      name="games"
      accent="#8f7ae5"
      tab={tab}
      onTab={(t) => (t !== 'play' && setGame(null), setTab(t))}
      scene={<StudioScene colors={['#c9b8ff', '#9fdcc8', '#ffd89b']} line="pulse" />}
      aside={
        on('sounds') ? (
          <button type="button" className="studio-chip" aria-pressed={store.sound} onClick={() => setStore((s) => ({ ...s, sound: !s.sound }))}>
            {store.sound ? <Volume2 size={13} /> : <VolumeX size={13} />} Sound
          </button>
        ) : undefined
      }
      tabs={[
        { id: 'play', label: game ? games.find((g) => g.id === game)!.name : 'Play', icon: game ? <Play size={15} /> : <Gamepad2 size={15} />, render: play },
        ...(on('skillRadar') || on('history') ? [{ id: 'stats', label: 'Skills', icon: on('skillRadar') ? <Radar size={15} /> : <History size={15} />, render: stats }] : []),
      ]}
      initial="play"
    />
  )
}

