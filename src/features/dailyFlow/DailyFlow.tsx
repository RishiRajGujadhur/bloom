import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { ArrowRight, Moon, Sparkles, Sunrise } from 'lucide-react'
import type { AppData } from '../../model'
import type { FeatureFlags } from '../../SettingsPage'
import type { NavKey } from '../../components/layout/Sidebar'
import { subOn } from '../subFeatures'
import { DAYBOOK_STORAGE_KEY } from '../../components/daybook/storage'
import { BREATH_KEY, GRATITUDE_KEY, MOOD_KEY } from '../wellbeing/store'
import { dueToday } from '../epiphany/epiphanyModel'
import { useEpiphanies } from '../epiphany/epiphanyStore'
import { defaultPart, eveningSteps, flowProgress, morningSteps, nextStep, type FlowInputs } from './dailyFlowModel'
import './dailyFlow.css'

function readJson<T>(key: string): T[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? (value as T[]) : []
  } catch {
    return []
  }
}

/** Progress ring drawn with SVG and eased with GSAP. */
function Ring({ value, children }: { value: number; children: ReactNode }) {
  const arc = useRef<SVGCircleElement>(null)
  const r = 26
  const c = 2 * Math.PI * r
  useLayoutEffect(() => {
    const el = arc.current
    if (!el) return
    const tween = gsap.to(el, { strokeDashoffset: c * (1 - value), duration: 0.9, ease: 'power3.out' })
    return () => {
      tween.kill()
    }
  }, [value, c])
  return (
    <span className="df-ring">
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r={r} className="df-ring-track" />
        <circle ref={arc} cx="32" cy="32" r={r} className="df-ring-arc" strokeDasharray={c} strokeDashoffset={c} />
      </svg>
      <span>{children}</span>
    </span>
  )
}

/**
 * Morning setup / evening wind-down: the day's features as one gentle path.
 * Each step lights up when you've done it anywhere in the app.
 */
export function DailyFlowCard({
  data,
  today,
  flags,
  onNavigate,
}: {
  data: AppData
  today: string
  flags: FeatureFlags
  onNavigate: (key: NavKey) => void
}) {
  const [epiphanies] = useEpiphanies()
  const auto = subOn('dailyFlow', 'autoSwitch') ? defaultPart() : 'morning'
  const [part, setPart] = useState<'morning' | 'evening'>(auto)
  const inputs: FlowInputs = {
    data,
    today,
    flags,
    moods: readJson(MOOD_KEY),
    gratitude: readJson(GRATITUDE_KEY),
    breaths: readJson(BREATH_KEY),
    daybook: readJson(DAYBOOK_STORAGE_KEY),
    epiphaniesDue: flags.epiphanies ? dueToday(epiphanies, today).length : 0,
    windDownDay: (() => {
      try {
        return localStorage.getItem('bloom-winddown-v1')
      } catch {
        return null
      }
    })(),
  }
  const allowMorning = subOn('dailyFlow', 'morning')
  const allowEvening = subOn('dailyFlow', 'evening')
  const shown = part === 'morning' && allowMorning ? 'morning' : allowEvening ? 'evening' : 'morning'
  const steps = shown === 'morning' ? morningSteps(inputs) : eveningSteps(inputs)
  const progress = flowProgress(steps)
  const next = nextStep(steps)
  const list = useRef<HTMLOListElement>(null)
  useLayoutEffect(() => {
    if (!list.current || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const tween = gsap.from(list.current.children, { x: -10, opacity: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' })
    return () => {
      tween.revert()
    }
  }, [shown])
  if (!steps.length) return null
  return (
    <section className={`daily-flow is-${shown}`} aria-labelledby="daily-flow-title">
      <header>
        {subOn('dailyFlow', 'ring') ? (
          <Ring value={progress}>{Math.round(progress * 100)}%</Ring>
        ) : shown === 'morning' ? (
          <Sunrise size={22} aria-hidden="true" />
        ) : (
          <Moon size={22} aria-hidden="true" />
        )}
        <div>
          <h2 id="daily-flow-title">{shown === 'morning' ? 'Morning setup' : 'Evening wind-down'}</h2>
          <p>{next ? `Next: ${next.title.toLowerCase()}` : 'All done — beautifully.'}</p>
        </div>
        {allowMorning && allowEvening && (
          <div className="wb-chips" role="group" aria-label="Part of day">
            <button type="button" aria-pressed={shown === 'morning'} onClick={() => setPart('morning')}>
              <Sunrise size={14} aria-hidden="true" /> Morning
            </button>
            <button type="button" aria-pressed={shown === 'evening'} onClick={() => setPart('evening')}>
              <Moon size={14} aria-hidden="true" /> Evening
            </button>
          </div>
        )}
      </header>
      <ol ref={list} className="df-steps">
        {steps.map((step, i) => (
          <li key={step.id} data-done={step.done} data-next={step.id === next?.id}>
            <button type="button" onClick={() => onNavigate(step.page)}>
              <span className="df-dot" aria-hidden="true">
                {step.done ? (
                  <svg viewBox="0 0 24 24" className="df-check">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className="df-copy">
                <strong>{step.title}</strong>
                <small>{step.hint}</small>
              </span>
              {step.done && <span className="sr-only">done</span>}
            </button>
          </li>
        ))}
      </ol>
      {next && (
        <button className="ov-primary df-next" onClick={() => onNavigate(next.page)}>
          {next.title} <ArrowRight size={16} aria-hidden="true" />
        </button>
      )}
      {!next && (
        <p className="df-done">
          <Sparkles size={16} aria-hidden="true" /> {shown === 'morning' ? 'You’re set up for the day.' : 'Rest well tonight.'}
        </p>
      )}
    </section>
  )
}

/**
 * A gentle bridge to a related feature, shown after an action
 * (e.g. a low mood suggests a breathing exercise).
 */
export function NextStep({
  icon,
  text,
  action,
  page,
}: {
  icon: ReactNode
  text: string
  action: string
  page: NavKey
}) {
  const card = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!card.current || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const tween = gsap.from(card.current, { y: 12, opacity: 0, duration: 0.45, ease: 'back.out(1.8)' })
    return () => {
      tween.revert()
    }
  }, [])
  if (!subOn('dailyFlow', 'suggestions', { ignoreParent: true })) return null
  return (
    <div className="next-step" ref={card} role="status">
      <span className="next-step-icon" aria-hidden="true">
        {icon}
      </span>
      <span>{text}</span>
      <a className="ov-secondary" href={`#${page}`}>
        {action} <ArrowRight size={15} aria-hidden="true" />
      </a>
    </div>
  )
}

