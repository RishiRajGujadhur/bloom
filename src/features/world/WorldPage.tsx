import { subOn } from '../subFeatures'
import { Component, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import type { AppData } from '../../model'
import type { NavKey } from '../../components/layout/Sidebar'
import { buildWorld, futureWorld, growthSince } from './worldModel'
import type { DistrictId, WorldState } from './worldModel'
import { WorldScene, timeOfDay } from './WorldScene'
import { shopItems, useShop } from '../rewards/shop'
import './world.css'

const SNAPSHOT_KEY = 'bloom-world-snapshot-v1'

function readSnapshot(): WorldState['scene'] | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    return raw ? (JSON.parse(raw) as WorldState['scene']) : null
  } catch {
    return null
  }
}

/** WebGL can be unavailable (old GPUs, locked-down browsers); keep the page usable. */
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? (
      <div className="world-fallback" role="status">
        Your world needs WebGL to render in 3D. Your progress below is still
        growing.
      </div>
    ) : (
      this.props.children
    )
  }
}

const skyClass = {
  dawn: 'sky-dawn',
  day: 'sky-day',
  dusk: 'sky-dusk',
  night: 'sky-night',
} as const

export function WorldPage({
  data,
  today,
  onNavigate,
}: {
  data: AppData
  today: string
  onNavigate: (key: NavKey) => void
}) {
  const reduced = useReducedMotion() ?? false
  const { shop } = useShop()
  const worldShop = {
    owned: shop.owned,
    equipped: shop.equipped,
    outfitColor: shopItems.find((i) => i.id === shop.equipped.outfit)?.color,
  }
  const world = useMemo(() => buildWorld(data, today), [data, today])
  const [focus, setFocus] = useState<DistrictId | null>(null)
  const [peek, setPeek] = useState(false)
  const shown = useMemo(() => (peek ? futureWorld(world) : world), [peek, world])
  const [time] = useState(() => (subOn('bloomWorld', 'dayNight') ? timeOfDay() : 'day'))
  // Captured once on arrival, so the note describes this visit's growth.
  const [grown] = useState(() => growthSince(readSnapshot(), world.scene))
  const cards = useRef<HTMLUListElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(world.scene))
    } catch {
      /* The world still renders; only the "since last visit" note is lost. */
    }
  }, [world.scene])

  useEffect(() => {
    if (reduced || !cards.current) return
    const tween = gsap.from(cards.current.children, {
      y: 18,
      opacity: 0,
      duration: 0.5,
      stagger: 0.06,
      ease: 'power2.out',
    })
    return () => {
      tween.revert()
    }
  }, [reduced])

  useEffect(
    () => () => {
      document.body.style.cursor = ''
    },
    [],
  )

  const selected = world.districts.find((d) => d.id === focus) ?? null
  const unlocked = world.decorations.filter((d) => d.unlocked).length

  return (
    <section className="bloom-world" aria-labelledby="world-heading">
      <header className="world-header">
        <div>
          <p className="world-eyebrow">Bloom World</p>
          <h2 id="world-heading">Your living little world</h2>
          <p>
            Every task, focus session, journal entry and habit adds something
            here. Drag to look around and select a district to visit it.
          </p>
        </div>
        <dl className="world-stats">
          <div>
            <dt>Level</dt>
            <dd>{world.level}</dd>
          </div>
          <div>
            <dt>Streak</dt>
            <dd>
              {world.streak}
              <small> day{world.streak === 1 ? '' : 's'}</small>
            </dd>
          </div>
          <div>
            <dt>Decor</dt>
            <dd>
              {unlocked}
              <small>/{world.decorations.length}</small>
            </dd>
          </div>
        </dl>
      </header>

      <div className={`world-stage ${skyClass[time]}`}>
        <div className="world-canvas">
          <SceneBoundary>
            <WorldScene
              key={peek ? 'future' : 'now'}
              world={shown}
              shop={subOn('bloomWorld', 'avatar') ? worldShop : undefined}
              focus={focus}
              onSelect={(id) => setFocus((f) => (f === id ? null : id))}
              reduced={reduced}
              time={time}
            />
          </SceneBoundary>
        </div>
        {peek && (
          <p className="world-toast world-toast-peek" role="status">
            A glimpse of what your habits can grow into
          </p>
        )}
        {!peek && grown.length > 0 && (
          <p className="world-toast" role="status">
            <strong>While you were away</strong> {grown.join(' · ')}
          </p>
        )}
        {selected && (
          <aside className="world-focus" aria-live="polite">
            <span aria-hidden="true">{selected.emoji}</span>
            <div>
              <strong>{selected.name}</strong>
              <p>{selected.nextHint}</p>
            </div>
            <button className="primary" onClick={() => onNavigate(selected.go)}>
              {selected.verb}
            </button>
            <button onClick={() => setFocus(null)} aria-label="Show whole island">
              ✕
            </button>
          </aside>
        )}
        <div className="world-controls">
          {subOn('bloomWorld', 'futurePeek') && (
            <button aria-pressed={peek} onClick={() => setPeek((p) => !p)}>
              {peek ? 'Back to today' : '✨ Peek at your future world'}
            </button>
          )}
          {focus && (
            <button onClick={() => setFocus(null)}>Whole island</button>
          )}
        </div>
      </div>

      <ul className="world-districts" ref={cards}>
        {world.districts.map((d) => (
          <li key={d.id}>
            <button
              className="world-district"
              aria-pressed={focus === d.id}
              onClick={() => setFocus((f) => (f === d.id ? null : d.id))}
            >
              <span className="world-district-emoji" aria-hidden="true">
                {d.emoji}
              </span>
              <span className="world-district-body">
                <span className="world-district-title">
                  {d.name}
                  <small>
                    Stage {d.stage}/{d.maxStage}
                  </small>
                </span>
                <span className="world-district-verb">{d.verb}</span>
                <span
                  className="world-meter"
                  role="progressbar"
                  aria-label={`${d.name} progress to next stage`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(d.progress * 100)}
                >
                  <span style={{ width: `${Math.round(d.progress * 100)}%` }} />
                </span>
                <span className="world-district-hint">{d.nextHint}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <section className="world-decor" aria-labelledby="world-decor-heading">
        <h3 id="world-decor-heading">Decorations</h3>
        <ul>
          {world.decorations.map((d) => (
            <li key={d.id} data-unlocked={d.unlocked}>
              <span aria-hidden="true">{d.unlocked ? d.emoji : '🔒'}</span>
              <strong>{d.name}</strong>
              <small>{d.unlocked ? 'Unlocked' : d.requirement}</small>
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}
