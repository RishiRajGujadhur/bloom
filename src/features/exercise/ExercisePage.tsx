import { bodySilent } from '../body/bodyPreferences'
import { setBodySeated, useBodySeated } from '../body/bodyPreferences'
import { useBodyPractice } from '../body/bodyPractice'
import { useTabTitle } from '../../utils/useTabTitle'
import Fuse from 'fuse.js'
import { seatedExercises } from './seated'
import { useEffect, useRef, useState } from 'react'
import {
  Dumbbell,
  FlipHorizontal2,
  Library,
  Pause,
  Play,
  RotateCcw,
  Star,
  Target,
  Volume2,
  VolumeX,
} from 'lucide-react'
import {
  Rail,
  Segmented,
  Slider,
  Stat,
  Studio,
  StudioScene,
  logActivity,
  readStore,
  writeStore,
} from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { ExerciseFigure } from './ExerciseFigure'
import { MuscleMap } from './MuscleMap'
import {
  exercises,
  filterExercises,
  muscleNames,
  repSeconds,
  type Exercise,
  type Muscle,
} from './exercises'
import './exercise.css'
import { areaNames, filterLibrary, library as allMoves, positionNames } from './moves'
import { Programs } from './Programs'
import type { Area, Position } from './exercises'

const KEY = 'bloom-exercise-v1'
type Prefs = {
  wheelchair?: boolean
  favourites: string[]
  target: number
  speed: number
  voice: boolean
  metronome: boolean
  mirror: boolean
}
const defaults: Prefs = {
  favourites: [],
  target: 10,
  speed: 1,
  voice: false,
  metronome: true,
  mirror: false,
}

const on = (id: string) => subOn('exerciseGuides', id)
const FILTER_KEY = 'bloom-exercise-filters-v1'
function savedFilter<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const saved = readStore<Record<string, unknown>>(FILTER_KEY, {})[key]
  return typeof saved === 'string' && allowed.includes(saved as T) ? saved as T : fallback
}


function click(high: boolean) {
  if (bodySilent()) return
  try {
    const ac = new AudioContext()
    const o = ac.createOscillator()
    const g = ac.createGain()
    o.frequency.value = high ? 1320 : 880
    g.gain.setValueAtTime(0.08, ac.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.08)
    o.connect(g).connect(ac.destination)
    o.start()
    o.stop(ac.currentTime + 0.09)
    setTimeout(() => void ac.close(), 200)
  } catch {
    /* optional */
  }
}
const say = (text: string) => {
  if (bodySilent()) return
  try {
    speechSynthesis.cancel()
    speechSynthesis.speak(
      Object.assign(new SpeechSynthesisUtterance(text), { rate: 1.05 }),
    )
  } catch {
    /* optional */
  }
}

function RepRing({
  value,
  of,
  hold,
}: {
  value: number
  of: number
  hold?: boolean
}) {
  const C = 2 * Math.PI * 54
  return (
    <svg
      className="ex-ring"
      viewBox="0 0 130 130"
      aria-label={`${value} of ${of} ${hold ? 'seconds' : 'reps'}`}
    >
      <circle cx="65" cy="65" r="54" className="ex-ring-track" />
      <circle
        cx="65"
        cy="65"
        r="54"
        className="ex-ring-arc"
        strokeDasharray={C}
        strokeDashoffset={C * (1 - Math.min(1, value / Math.max(1, of)))}
        transform="rotate(-90 65 65)"
      />
      <text x="65" y="66" textAnchor="middle">
        {value}
      </text>
      <text x="65" y="86" textAnchor="middle" className="ex-ring-sub">
        / {of} {hold ? 's' : 'reps'}
      </text>
    </svg>
  )
}

export function ExercisePage() {
  const [prefs, setPrefsState] = useState<Prefs>(() => readStore(KEY, defaults))
  const setPrefs = (p: Partial<Prefs>) =>
    setPrefsState((cur) => {
      const next = { ...cur, ...p }
      writeStore(KEY, next)
      return next
    })
  const seatedMode = useBodySeated()
  const [search, setSearch] = useState(() => { const saved = readStore<Record<string, unknown>>(FILTER_KEY, {}).search; return typeof saved === 'string' ? saved.slice(0, 100) : '' })
  const [area, setArea] = useState<Area | 'all'>(() => savedFilter('area', ['all', ...Object.keys(areaNames)] as (Area | 'all')[], 'all'))
  const [position, setPosition] = useState<Position | 'all'>(() => savedFilter('position', ['all', ...Object.keys(positionNames)] as (Position | 'all')[], 'all'))
  const everything = on('moreMoves') ? allMoves : [...exercises, ...seatedExercises]
  const available = filterLibrary(
    prefs.wheelchair ? everything.filter((e) => e.wheelchair) : everything,
    { area: on('areaFilter') ? area : 'all', position: on('positionFilter') && !prefs.wheelchair ? position : 'all' },
  )
  const [tab, setTab] = useState('library')
  const [pick, setPickState] = useState<Exercise>(() => {
    try {
      const id = localStorage.getItem('bloom-exercise-pick')
      const found = everything.find((e) => e.id === id)
      if (found && (!prefs.wheelchair || found.wheelchair)) return found
    } catch { /* optional */ }
    return prefs.wheelchair ? seatedExercises[0] : exercises[0]
  })
  const setPick = (e: Exercise) => {
    setPickState(e)
    try { localStorage.setItem('bloom-exercise-pick', e.id) } catch { /* optional */ }
  }
  useEffect(() => {
    if (!!prefs.wheelchair === seatedMode) return
    setPrefs({ wheelchair: seatedMode }); setPlaying(false); setCount(0)
    if (seatedMode && !pick.wheelchair) setPick(seatedExercises[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shared preference changes
  }, [seatedMode])
  const [muscle, setMuscle] = useState<Muscle | 'all'>(() => savedFilter('muscle', ['all', ...Object.keys(muscleNames)] as (Muscle | 'all')[], 'all'))
  const [equipment, setEquipment] = useState<Exercise['equipment'] | 'all'>(
    () => savedFilter('equipment', ['all', 'none', 'dumbbells', 'wall'], 'all'),
  )
  const [level, setLevel] = useState<Exercise['level'] | 'all'>('all')
  const [favOnly, setFavOnly] = useState(() => readStore<Record<string, unknown>>(FILTER_KEY, {}).favOnly === true)
  useEffect(() => { writeStore(FILTER_KEY, { search, area, position, muscle, equipment, level, favOnly }) }, [search, area, position, muscle, equipment, level, favOnly])
  const [playing, setPlaying] = useState(false)
  const [count, setCount] = useState(0)
  const [phase, setPhase] = useState<'down' | 'up'>('down')
  const goBtn = useRef<HTMLButtonElement>(null)
  const filtered =
    on('filters') || on('favourites')
      ? filterExercises(available, {
          muscle,
          equipment,
          level,
          favourites: favOnly ? prefs.favourites : null,
        })
      : available
  const list = search.trim()
    ? new Fuse(filtered, { keys: ['name', 'cues', 'primary'], threshold: 0.35 })
        .search(search)
        .map((r) => r.item)
    : filtered
  useBodyPractice('exercises', pick.id, pick.name, () => setPlaying(false))
  const speed = on('slowMo') ? prefs.speed : 1
  useEffect(() => { return () => window.speechSynthesis?.cancel() }, [playing, pick.id])
  const resetFilters = () => { setSearch(''); setArea('all'); setPosition('all'); setMuscle('all'); setEquipment('all'); setLevel('all'); setFavOnly(false) }

  // Holds count seconds; reps come from the animation loop.
  useEffect(() => {
    if (!playing || !pick.hold) return
    const t = setInterval(() => setCount((c) => c + 1), 1000)
    return () => clearInterval(t)
  }, [playing, pick])
  useEffect(() => {
    if (count > 0 && count >= prefs.target && playing) {
      setPlaying(false)
      burst(goBtn.current, 'stars')
      logActivity('exercise', { id: pick.id, amount: count })
      if (prefs.voice && on('voice'))
        say(pick.hold ? 'Time. Well held.' : 'Set complete. Nice work.')
    }
  }, [count, prefs.target, playing, pick, prefs.voice])

  const onRep = () => {
    if (pick.hold) return
    setCount((c) => {
      const n = c + 1
      if (prefs.voice && on('voice'))
        say(
          n % 5 === 0 && pick.cues[n / 5 - 1]
            ? `${n}. ${pick.cues[(n / 5 - 1) % pick.cues.length]}`
            : String(n),
        )
      return n
    })
  }
  const onPhase = (p: 'down' | 'up') => {
    setPhase(p)
    if (prefs.metronome && on('tempo')) click(p === 'down')
  }
  const choose = (e: Exercise) => {
    setPick(e)
    setCount(0)
    setPlaying(false)
    setTab('coach')
  }
  const fav = (id: string) =>
    setPrefs({
      favourites: prefs.favourites.includes(id)
        ? prefs.favourites.filter((x) => x !== id)
        : [...prefs.favourites, id],
    })
  const muscles = Object.keys(muscleNames) as Muscle[]
  useTabTitle(playing ? `💪 ${pick.name} ${count}/${prefs.target}${pick.hold ? 's' : ''}` : '', 'Exercises', 'exercises')
  // Space starts or stops the coach.
  const tabRef = useRef(tab)
  tabRef.current = tab
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || tabRef.current !== 'coach' || (e.target as HTMLElement | null)?.closest?.('input, textarea, button, select')) return
      e.preventDefault()
      setPlaying((p) => !p)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  const library = () => (
    <div className="ex-library">
      <div className="studio-card">
        <label>
          Find a movement
          <input
            type="search"
            maxLength={100}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Try seated, elbow, or shoulder"
          />
        </label>
        <div className="studio-chip-row"><button type="button" className="studio-chip" disabled={!search} onClick={() => setSearch('')}>Clear search</button><button type="button" className="studio-chip" onClick={resetFilters}>Reset filters</button></div>
        {on('wheelchair') && (
          <label>
            <input
              type="checkbox"
              checked={!!prefs.wheelchair}
              onChange={(e) => {
                setBodySeated(e.target.checked)
                setPrefs({ wheelchair: e.target.checked })
                setPlaying(false)
                setCount(0)
                setMuscle('all')
                setEquipment('all')
                setLevel('all')
                setPick(e.target.checked ? seatedExercises[0] : exercises[0])
              }}
            />{' '}
            Wheelchair / seated-only mode
          </label>
        )}
        {prefs.wheelchair && (
          <p>
            Supported, seated movements with no standing or floor transfers.
            Choose movements appropriate to your own mobility and any advice
            from your clinician. The figure is an illustration, not a form
            assessment.
          </p>
        )}
        {!list.length && (
          <p>No movements match. Clear your search or filters.</p>
        )}
      </div>
      {(on('areaFilter') || on('positionFilter')) && (
        <div className="ex-filters">
          {on('areaFilter') && (
            <div className="studio-chip-row" role="group" aria-label="Body area">
              {(['all', ...Object.keys(areaNames)] as (Area | 'all')[]).map((a) => (
                <button key={a} type="button" className="studio-chip" aria-pressed={area === a} onClick={() => setArea(a)}>
                  {a === 'all' ? 'Whole body' : areaNames[a]}
                </button>
              ))}
            </div>
          )}
          {on('positionFilter') && !prefs.wheelchair && (
            <Segmented
              label="Position"
              value={position}
              onChange={setPosition}
              options={[{ id: 'all', label: 'Any position' }, ...(Object.keys(positionNames) as Position[]).map((id) => ({ id, label: positionNames[id] }))]}
            />
          )}
        </div>
      )}
      {on('filters') && (
        <div className="ex-filters">
          <div className="studio-chip-row" role="group" aria-label="Muscle">
            {(['all', ...muscles] as const).map((m) => (
              <button
                key={m}
                type="button"
                className="studio-chip"
                aria-pressed={muscle === m}
                onClick={() => setMuscle(m)}
              >
                {m === 'all' ? 'All muscles' : muscleNames[m]}
              </button>
            ))}
          </div>
          <div className="ex-filter-line">
            <Segmented
              label="Equipment"
              value={equipment}
              onChange={setEquipment}
              options={[
                { id: 'all', label: 'Any kit' },
                { id: 'none', label: 'Bodyweight' },
                { id: 'dumbbells', label: 'Dumbbells' },
                { id: 'wall', label: 'Wall' },
              ]}
            />
            <Segmented
              label="Level"
              value={level}
              onChange={setLevel}
              options={[
                { id: 'all', label: 'All levels' },
                { id: 'beginner', label: 'Beginner' },
                { id: 'intermediate', label: 'Intermediate' },
              ]}
            />
            {on('favourites') && (
              <button
                type="button"
                className="studio-chip"
                aria-pressed={favOnly}
                onClick={() => setFavOnly(!favOnly)}
              >
                <Star size={13} /> Favourites
              </button>
            )}
          </div>
        </div>
      )}
      <p className="studio-empty" role="status">{list.length} matching {list.length === 1 ? 'movement' : 'movements'}{prefs.wheelchair ? ' · seated only' : ''}</p>
      {list.length ? (
        <Rail label="Exercises">
          {list.map((e) => (
            <article
              key={e.id}
              className="ex-card"
              role="listitem"
              data-on={pick.id === e.id}
            >
              <button
                type="button"
                className="ex-card-main"
                onClick={() => choose(e)}
                aria-label={`Open ${e.name}`}
              >
                <ExerciseFigure
                  exercise={e}
                  playing={false}
                  animate={false}
                  small
                />
                <strong>{e.name}</strong>
                <small>
                  {e.level} · {e.primary.map((m) => muscleNames[m]).join(', ')}
                </small>
              </button>
              {on('favourites') && (
                <button
                  type="button"
                  className="ex-fav"
                  aria-pressed={prefs.favourites.includes(e.id)}
                  aria-label={`Favourite ${e.name}`}
                  onClick={() => fav(e.id)}
                >
                  <Star size={15} />
                </button>
              )}
            </article>
          ))}
        </Rail>
      ) : (
        <div className="studio-empty"><p>No movements match these filters.</p><button type="button" className="studio-chip" onClick={resetFilters}>Show all {prefs.wheelchair ? 'seated ' : ''}movements</button></div>
      )}
    </div>
  )

  const coach = () => (
    <div className="studio-split">
      <div
        className="studio-card ex-stage"
        data-phase={phase}
        data-playing={playing}
      >
        {on('animation') ? (
          <ExerciseFigure
            exercise={pick}
            playing={playing}
            speed={speed}
            mirror={on('mirror') && prefs.mirror}
            onRep={onRep}
            onPhase={onPhase}
          />
        ) : (
          <ExerciseFigure exercise={pick} playing={false} animate={false} />
        )}
        <div className="ex-stage-bar">
          {on('mirror') && (
            <button
              type="button"
              className="studio-chip"
              aria-pressed={prefs.mirror}
              onClick={() => setPrefs({ mirror: !prefs.mirror })}
            >
              <FlipHorizontal2 size={14} /> Mirror
            </button>
          )}
          {on('voice') && (
            <button
              type="button"
              className="studio-chip"
              aria-pressed={prefs.voice}
              onClick={() => setPrefs({ voice: !prefs.voice })}
            >
              {prefs.voice ? <Volume2 size={14} /> : <VolumeX size={14} />}{' '}
              Coach voice
            </button>
          )}
          {on('tempo') && (
            <button
              type="button"
              className="studio-chip"
              aria-pressed={prefs.metronome}
              onClick={() => setPrefs({ metronome: !prefs.metronome })}
            >
              Metronome
            </button>
          )}
          <span className="ex-phase">
            {pick.hold ? 'Hold' : phase === 'down' ? 'Lower' : 'Drive up'}
          </span>
        </div>
      </div>
      <div className="studio-card ex-panel">
        <p className="studio-empty" role="note">Animated guide · counts follow the demonstration, not your body. Use Camera pose coach for measured movement tracking.</p>
        <h3>
          <span aria-hidden="true">{pick.emoji}</span> {pick.name}
        </h3>
        <div className="ex-count">
          <RepRing value={count} of={prefs.target} hold={pick.hold} />
          <div className="ex-controls">
            <button
              ref={goBtn}
              type="button"
              className="studio-go"
              onClick={() => setPlaying(!playing)}
            >
              {playing ? <Pause size={18} /> : <Play size={18} />}{' '}
              {playing ? 'Pause' : count ? 'Resume' : 'Start'}
            </button>
            <button
              type="button"
              className="studio-go"
              data-variant="quiet"
              onClick={() => (setCount(0), setPlaying(false))}
            >
              <RotateCcw size={16} /> Reset
            </button>
          </div>
        </div>
        <button
          type="button"
          className="studio-chip"
          onClick={() => {
            setPlaying(false)
            setCount((c) => c + 1)
          }}
        >
          Count one rep manually
        </button>
        <Slider
          label={pick.hold ? 'Hold for' : 'Target reps'}
          value={prefs.target}
          min={pick.hold ? 10 : 3}
          max={pick.hold ? 120 : 30}
          step={pick.hold ? 5 : 1}
          unit={pick.hold ? 's' : ''}
          onChange={(v) => setPrefs({ target: v })}
        />
        {on('slowMo') && (
          <Slider
            label="Speed"
            value={prefs.speed}
            min={0.25}
            max={1.5}
            step={0.05}
            unit="×"
            format={(v) => v.toFixed(2)}
            onChange={(v) => setPrefs({ speed: v })}
          />
        )}
        {on('tempo') && !pick.hold && (
          <p className="ex-tempo">
            Tempo {pick.tempo.join('-')} · {repSeconds(pick, speed).toFixed(1)}{' '}
            s per rep
          </p>
        )}
        {on('cues') && (
          <ul className="ex-cues" aria-label="Form cues">
            {pick.cues.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        )}
        {on('mistakes') && (
          <ul className="ex-mistakes" aria-label="Common mistakes">
            {pick.mistakes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )

  const musclesTab = () => (
    <div className="studio-split">
      <div className="studio-card">
        <MuscleMap
          primary={pick.primary}
          secondary={pick.secondary}
          onPick={(m) => {
            setMuscle(m)
            setTab('library')
          }}
        />
      </div>
      <div className="studio-card">
        <h3>{pick.name}</h3>
        <div className="studio-stats">
          <Stat
            value={pick.primary.map((m) => muscleNames[m]).join(' · ')}
            label="Primary"
          />
          <Stat
            value={pick.secondary.map((m) => muscleNames[m]).join(' · ') || '—'}
            label="Supporting"
          />
          <Stat
            value={pick.equipment === 'none' ? 'Bodyweight' : pick.equipment}
            label="Equipment"
          />
        </div>
        <p className="studio-empty">Tap a muscle to find exercises for it.</p>
        <h3>Also trains {muscleNames[pick.primary[0]]}</h3>
        <Rail label="Similar exercises">
          {available
            .filter(
              (e) =>
                e.id !== pick.id &&
                e.primary.some((m) => pick.primary.includes(m)),
            )
            .map((e) => (
              <div key={e.id} role="listitem">
                <button
                  type="button"
                  className="ex-card ex-card-main"
                  onClick={() => choose(e)}
                >
                  <ExerciseFigure
                    exercise={e}
                    playing={false}
                    animate={false}
                    small
                  />
                  <strong>{e.name}</strong>
                </button>
              </div>
            ))}
        </Rail>
      </div>
    </div>
  )

  return (
    <Studio
      name="exercises"
      accent="#e0703f"
      tab={tab}
      onTab={setTab}
      scene={
        <StudioScene colors={['#f7b27a', '#f4a7b9', '#ffd89b']} line="pulse" />
      }
      aside={
        <span className="ex-aside">
          <Dumbbell size={16} aria-hidden="true" /> {pick.name}
        </span>
      }
      tabs={[
        {
          id: 'library',
          label: 'Library',
          icon: <Library size={15} />,
          render: library,
        },
        {
          id: 'coach',
          label: 'Coach',
          icon: <Target size={15} />,
          render: coach,
        },
        ...(on('programs')
          ? [
              {
                id: 'programs',
                label: 'Programs',
                icon: <Target size={15} />,
                render: () => <Programs seatedOnly={!!prefs.wheelchair} />,
              },
            ]
          : []),
        ...(on('muscleMap')
          ? [
              {
                id: 'muscles',
                label: 'Muscles',
                icon: <Dumbbell size={15} />,
                render: musclesTab,
              },
            ]
          : []),
      ]}
    />
  )
}
