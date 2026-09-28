import { prefersReducedMotion } from '../../utils/motion'
import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import type { AppData } from '../../model'
import { dayKey } from '../../dates'
import { GrowScene, scenes } from '../quick/GrowScene'
import { pageOn } from '../subFeatures'
import './showcase.css'

/**
 * Focus week diorama: each finished focus session this week becomes a small
 * grown scene on a wooden shelf for its day. Longer sessions grow bigger.
 */
export function FocusDiorama({ data }: { data: AppData }) {
  const root = useRef<HTMLDivElement>(null)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return dayKey(d)
  })
  const byDay = days.map((day) => ({
    day,
    sessions: data.rpg.focusHistory.filter((f) => dayKey(new Date(f.completedAt)) === day),
  }))
  const total = byDay.reduce((t, d) => t + d.sessions.length, 0)
  useLayoutEffect(() => {
    if (!root.current || prefersReducedMotion()) return
    const tw = gsap.from(root.current.querySelectorAll('.fd-tile'), { y: 30, scale: 0.6, opacity: 0, stagger: 0.05, duration: 0.5, ease: 'back.out(2)' })
    return () => void tw.progress(1)
  }, [total])
  if (!pageOn('focus', 'diorama') || !total) return null
  return (
    <section ref={root} className="fd-wrap" aria-label="This week's focus diorama">
      <h3>This week’s diorama · {total} session{total === 1 ? '' : 's'}</h3>
      <div className="fd-shelf">
        {byDay.map(({ day, sessions }) => (
          <div key={day} className="fd-day">
            <div className="fd-tiles">
              {sessions.map((s) => {
                const scene = scenes[Math.abs([...s.id].reduce((a, c) => a + c.charCodeAt(0), 0)) % scenes.length].id
                return (
                  <div key={s.id} className="fd-tile" title={`${s.minutes} min${s.taskTitle ? ` · ${s.taskTitle}` : ''}`} style={{ width: 44 + Math.min(40, s.minutes) }}>
                    <GrowScene scene={scene} progress={1} extra={Math.floor(s.minutes / 25)} />
                  </div>
                )
              })}
            </div>
            <span className="fd-plank" aria-hidden="true" />
            <small>{new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}</small>
          </div>
        ))}
      </div>
    </section>
  )
}
