import { prefersReducedMotion } from '../../utils/motion'
import { NextStep } from '../dailyFlow/DailyFlow'
import { subOn } from '../subFeatures'
import { useEffect, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { animated, useSpring } from '@react-spring/web'
import { Flame, Heart, RotateCcw } from 'lucide-react'
import { useStoredValue } from '../sleep/useStoredValue'
import { burst } from '../../components/ui/celebrate'
import './release.css'
import gsap from 'gsap'
import { usePageActions } from '../../components/ui/PageMenu'

const RELEASE_KEY = 'bloom-release-v1'

/**
 * Burn & release: a worry becomes a card with real weight. Drag (or use the
 * button) to drop it into the fire, where it curls, shrinks and turns to
 * smoke. Only a count is kept — the words themselves are never saved.
 */
export function ReleasePage() {
  const [text, setText] = useState('')
  const [card, setCard] = useState<string | null>(null)
  const [burning, setBurning] = useState(false)
  const [stats, setStats] = useStoredValue(RELEASE_KEY, { released: 0 })
  const fire = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [{ x, y, scale, rotate, opacity }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    opacity: 1,
    config: { tension: 320, friction: 22 },
  }))
  const reduced =
    typeof window !== 'undefined' &&
    prefersReducedMotion()

  const overFire = () => {
    const a = cardRef.current?.getBoundingClientRect()
    const b = fire.current?.getBoundingClientRect()
    if (!a || !b) return false
    const cx = a.left + a.width / 2
    const cy = a.top + a.height / 2
    return cx > b.left - 30 && cx < b.right + 30 && cy > b.top - 40 && cy < b.bottom + 20
  }

  // The words crumble into ash letters that drift up and away (GSAP).
  const ash = (words: string | null) => {
    const a = cardRef.current?.getBoundingClientRect()
    if (!a || !words || reduced || !subOn('burnRelease', 'ash')) return
    const layer = document.createElement('div')
    layer.className = 'release-ash'
    document.body.append(layer)
    const letters = [...words.slice(0, 90)].map((ch, i) => {
      const el = document.createElement('span')
      el.textContent = ch
      el.style.left = `${a.left + 16 + ((i * 11) % Math.max(40, a.width - 32))}px`
      el.style.top = `${a.top + 20 + Math.floor((i * 11) / Math.max(40, a.width - 32)) * 20}px`
      layer.append(el)
      return el
    })
    gsap.to(letters, {
      y: () => gsap.utils.random(-260, -120),
      x: () => gsap.utils.random(-60, 60),
      rotate: () => gsap.utils.random(-180, 180),
      opacity: 0,
      color: '#9e9e9e',
      duration: () => gsap.utils.random(1.2, 2.2),
      stagger: 0.015,
      ease: 'power1.out',
      onComplete: () => layer.remove(),
    })
  }
  const embers = () => {
    const f = fire.current
    if (!f || reduced) return
    const sparks = Array.from({ length: 14 }, () => {
      const el = document.createElement('i')
      el.className = 'release-ember'
      f.append(el)
      return el
    })
    gsap.fromTo(sparks, { x: () => gsap.utils.random(-30, 30), y: 0, opacity: 1, scale: () => gsap.utils.random(0.5, 1.2) }, { y: () => gsap.utils.random(-200, -90), opacity: 0, duration: () => gsap.utils.random(0.9, 1.8), stagger: 0.05, ease: 'power1.out', onComplete: () => sparks.forEach((e) => e.remove()) })
  }

  const release = () => {
    ash(card)
    embers()
    const a = cardRef.current?.getBoundingClientRect()
    const b = fire.current?.getBoundingClientRect()
    setBurning(true)
    const dx = a && b ? b.left + b.width / 2 - (a.left + a.width / 2) + x.get() : 0
    const dy = a && b ? b.top + b.height * 0.45 - (a.top + a.height / 2) + y.get() : 0
    api.start({
      x: dx,
      y: dy,
      scale: 0.05,
      rotate: 25,
      opacity: 0,
      config: { duration: reduced ? 1 : 1100 },
      onRest: () => {
        setCard(null)
        setBurning(false)
        setStats((s) => ({ released: s.released + 1 }))
        api.set({ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 })
      },
    })
    burst(fire.current, 'stars', 'release')
  }

  const bind = useDrag(
    ({ down, movement: [mx, my], velocity: [vx], direction: [dx] }) => {
      if (burning) return
      if (down) {
        api.start({ x: mx, y: my, scale: 1.05, rotate: mx / 20, immediate: (k) => k === 'x' || k === 'y' })
        fire.current?.classList.toggle('is-hungry', overFire())
        return
      }
      fire.current?.classList.remove('is-hungry')
      if (overFire()) release()
      // A flick towards the fire with momentum also counts.
      else if (subOn('burnRelease', 'flick') && vx > 1.2 && dx > 0 && mx > 120) release()
      else api.start({ x: 0, y: 0, scale: 1, rotate: 0 })
    },
    { filterTaps: true },
  )

  // Enter burns the card, Esc puts it back.
  const releaseRef = useRef(release)
  releaseRef.current = release
  useEffect(() => {
    if (!card || burning) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.('input, textarea')) return
      if (e.key === 'Enter') { e.preventDefault(); releaseRef.current() }
      if (e.key === 'Escape') setCard(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [card, burning])
  usePageActions(card ? [{ id: 'rl-go', label: 'Release it', icon: '🔥', run: release }, { id: 'rl-not', label: 'Not yet', icon: '↩️', run: () => setCard(null) }] : [])
  return (
    <section className="release-page" aria-label="Burn and release">
      <div className="release-stage">
        <div className="release-left">
          {!card ? (
            <form
              className="release-input"
              onSubmit={(e) => {
                e.preventDefault()
                if (!text.trim()) return
                setCard(text.trim())
                setText('')
              }}
            >
              <label htmlFor="release-text">What would you like to let go of?</label>
              <textarea
                id="release-text"
                value={text}
                maxLength={220}
                rows={4}
                placeholder="A worry, a fear, a heavy thought…"
                onChange={(e) => setText(e.target.value)}
              />
              <button className="ov-primary" type="submit" disabled={!text.trim()}>
                Write it on a card
              </button>
            </form>
          ) : (
            <div className="release-card-slot">
              <animated.div
                ref={cardRef}
                {...bind()}
                className="release-card"
                style={{ x, y, scale, rotate, opacity, touchAction: 'none' }}
                aria-label="Worry card, drag it into the fire"
              >
                <p>{card}</p>
                <small>Drag me into the fire → (or press Enter)</small>
              </animated.div>
              <div className="release-actions">
                <button className="ov-primary" onClick={release} disabled={burning}>
                  <Flame size={17} aria-hidden="true" /> Release
                </button>
                <button className="ov-secondary" onClick={() => setCard(null)} disabled={burning}>
                  <RotateCcw size={16} aria-hidden="true" /> Not yet
                </button>
              </div>
            </div>
          )}
        </div>
        <div className={`release-fire${burning ? ' is-burning' : ''}`} ref={fire} aria-hidden="true" data-hint="Drop your card here to let it go">
          <div className="release-smoke">
            <i />
            <i />
            <i />
          </div>
          <div className="release-flames">
            <i />
            <i />
            <i />
          </div>
          <div className="release-logs">
            <i />
            <i />
          </div>
        </div>
      </div>
      {stats.released > 0 && !card && !burning && (
        <NextStep
          icon={<Heart size={18} />}
          text="Space made. Fill it with something good that happened today."
          action="Gratitude jar"
          page="gratitude"
        />
      )}
      <p className="release-count" role="status">
        {burning
          ? 'Letting it go…'
          : stats.released
            ? `${stats.released} ${stats.released === 1 ? 'thought' : 'thoughts'} released. Nothing you write here is saved.`
            : 'Nothing you write here is saved.'}
      </p>
    </section>
  )
}
