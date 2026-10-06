import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Sentiment from 'sentiment'
import { SwipeDeck } from '../../components/ui/SwipeDeck'
import { MoodGuide } from '../../components/ui/MoodGuide'
import { QuickPanel, lastMood, logMood } from '../../components/ui/QuickPanel'
import { readStore, writeStore } from '../../components/studio/Studio'
import { dueToday, review, type Epiphany } from '../epiphany/epiphanyModel'
import { useEpiphanies } from '../epiphany/epiphanyStore'
import { subOn } from '../subFeatures'

const on = (id: string) => subOn('epiphanies', id)
const sentiment = new Sentiment()
const DAYS_KEY = 'bloom-epiphany-review-days-v1'
const heavyMoods = new Set(['low', 'anxious', 'stressed', 'tired'])

/** Lightbulb whose glow grows with how much you remember. */
function Bulb({ level }: { level: number }) {
  const glow = useRef<SVGCircleElement>(null)
  useLayoutEffect(() => {
    if (!glow.current) return
    const tw = gsap.to(glow.current, { attr: { r: 18 + level * 22 }, opacity: 0.25 + level * 0.6, duration: 0.8, ease: 'elastic.out(1, 0.5)' })
    return () => void tw.kill()
  }, [level])
  return (
    <svg className="epi-bulb" viewBox="0 0 100 110" aria-hidden="true">
      <circle ref={glow} cx="50" cy="42" r="18" fill="#ffd54f" opacity="0.25" />
      <path d="M50 14a28 28 0 0 0-16 51c4 3 6 7 6 12h20c0-5 2-9 6-12a28 28 0 0 0-16-51z" fill="#fff8e1" stroke="#f0a500" strokeWidth="3" />
      <path d="M44 62l6-14 6 14" fill="none" stroke="#f0a500" strokeWidth="2.5" />
      <rect x="40" y="80" width="20" height="6" rx="3" fill="#9e9e9e" />
      <rect x="42" y="88" width="16" height="6" rx="3" fill="#bdbdbd" />
    </svg>
  )
}

export const upliftingFirst = (list: Epiphany[]) =>
  [...list].sort((a, b) => sentiment.analyze(b.text).comparative - sentiment.analyze(a.text).comparative)

export function EpiphaniesQuick({ today }: { today: string }) {
  const [list, update] = useEpiphanies()
  const [mood, setMood] = useState(() => lastMood('epiphanies'))
  const [session, setSession] = useState({ yes: 0, total: 0 })
  const [days, setDays] = useState(() => readStore<string[]>(DAYS_KEY, []))
  if (!list.length) return null
  const due = dueToday(list, today)
  const deck = mood && heavyMoods.has(mood) && on('moodLift') ? upliftingFirst(due) : due
  const pick = on('dailyPick') ? list[[...today].reduce((a, c) => a + c.charCodeAt(0), 0) % list.length] : null
  const level = session.total ? session.yes / session.total : 0.3
  const streak = (() => {
    let n = 0
    const d = new Date(`${today}T12:00:00`)
    while (days.includes(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1) }
    return n
  })()
  return (
    <QuickPanel id="epiphanies" title="Quick review">
      <div className="epi-quick-top bloom-inline">
        {on('bulbGlow') && <Bulb level={level} />}
        <div>
          {pick && <blockquote className="epi-pick">“{pick.text}”</blockquote>}
          {on('reviewStreak') && <small className="quick-note">Review streak: {streak} day{streak === 1 ? '' : 's'} · {due.length} due today</small>}
        </div>
      </div>
      {on('moodLift') && <MoodGuide value={mood} onChange={(m) => { setMood(m); logMood('epiphanies', m) }} label="Mood — heavy days show uplifting insights first" />}
      {on('swipeReview') && (
        <SwipeDeck
          label="Swipe right if you remembered it"
          yes="Knew it"
          no="Forgot"
          cards={deck.map((e) => ({ id: e.id, emoji: '💡', title: e.text.length > 140 ? `${e.text.slice(0, 140)}…` : e.text, detail: `From ${e.source.title}` }))}
          empty="Nothing due. Your insights are fresh."
          onSwipe={(card, yes) => {
            update(list.map((e) => (e.id === card.id ? review(e, yes ? 4 : 1, today) : e)))
            setSession((s) => ({ yes: s.yes + Number(yes), total: s.total + 1 }))
            if (!days.includes(today)) { const next = [...days, today].slice(-400); setDays(next); writeStore(DAYS_KEY, next) }
          }}
        />
      )}
    </QuickPanel>
  )
}
