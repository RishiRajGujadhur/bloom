import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { BookOpen, Dumbbell, Flame, Gem, Heart, Languages, Mic, PenLine, Swords, Trophy, Zap } from 'lucide-react'
import { Studio, StudioScene, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { burst } from '../../components/ui/celebrate'
import type { AppData } from '../../model'
import { subOn } from '../subFeatures'
import { leagueColors, leagues, units } from './englishCourse'
import {
  ENGLISH_KEY, LESSONS_PER_UNIT, MAX_HEARTS, applyFreezes, badgeDefs, earn, emptyEnglish, goals, heartsNow, leagueTable,
  loseHeart, newBadges, questsFor, reviewWord, rollLeague, streak, totalXp, unitProgress, unitUnlocked, weekXp,
  wordOfDay, xpToday, type EnglishStore,
} from './englishModel'
import { speak } from './englishNlp'
import { makeLesson, makeMistakes, makePlacement, makeReview, type Exercise } from './lessonGen'
import { LessonPlayer, type LessonResult } from './LessonPlayer'
import { sfx } from './sfx'
import { BloomFace } from '../../components/ui/BloomFace'
import { UnitScene, unitThemes } from './UnitScene'
import './english.css'

const EnglishPractice = lazy(() => import('./EnglishPractice').then((m) => ({ default: m.EnglishPractice })))
const EnglishLab = lazy(() => import('./EnglishLab').then((m) => ({ default: m.EnglishLab })))
const EnglishWrite = lazy(() => import('./EnglishWrite').then((m) => ({ default: m.EnglishWrite })))
const StoryMode = lazy(() => import('./StoryMode').then((m) => ({ default: m.StoryMode })))
const XpChart = lazy(() => import('./XpChart').then((m) => ({ default: m.XpChart })))

export const on = (id: string) => subOn('englishLearning', id)
export type Session = { title: string; exercises: Exercise[]; unit?: string; kind: 'lesson' | 'review' | 'mistakes' | 'placement' }

/** The daily-goal ring (GSAP-animated SVG). */
function GoalRing({ value, goal }: { value: number; goal: number }) {
  const arc = useRef<SVGCircleElement>(null)
  const pct = Math.min(1, value / goal)
  useLayoutEffect(() => {
    if (arc.current) gsap.to(arc.current, { strokeDashoffset: 176 * (1 - pct), duration: 1, ease: 'power3.out' })
  }, [pct])
  return (
    <svg className="en-ring" viewBox="0 0 64 64" role="img" aria-label={`${value} of ${goal} XP today`}>
      <circle cx="32" cy="32" r="28" className="track" />
      <circle ref={arc} cx="32" cy="32" r="28" className="arc" strokeDasharray="176" strokeDashoffset="176" />
      <text x="32" y="36" textAnchor="middle">{value}</text>
    </svg>
  )
}

/** The winding learning path: units are sections, lessons are round nodes. */
function PathMap({ store, onStart }: { store: EnglishStore; onStart: (unitIndex: number) => void }) {
  const host = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!host.current) return
    const ctx = gsap.context(() => {
      gsap.from('.en-node', { scale: 0, opacity: 0, duration: 0.45, stagger: 0.03, ease: 'back.out(2)' })
      gsap.to('.en-node.is-current', { y: -6, duration: 1.2, yoyo: true, repeat: -1, ease: 'sine.inOut' })
      gsap.fromTo('.en-trail', { strokeDashoffset: 1200 }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.out' })
    }, host)
    return () => ctx.revert()
  }, [])
  let currentFound = false
  return (
    <div ref={host} className="en-path">
      {units.map((u, ui) => {
        const done = unitProgress(store, u.id)
        const open = unitUnlocked(store, ui)
        return (
          <section key={u.id} className="en-unit" style={{ ['--u' as string]: u.color }}>
            <header className="en-unit-head">
              {unitThemes[u.id] && <UnitScene theme={unitThemes[u.id]} className="en-unit-fx" />}
              <span className="en-unit-emoji">{u.emoji}</span>
              <div className="en-unit-text">
                <small>Unit {ui + 1} · {u.level}{unitThemes[u.id] ? ` · ${unitThemes[u.id].place}` : ''}</small>
                <strong>{u.title}</strong>
                {unitThemes[u.id] && <p className="en-unit-story">{unitThemes[u.id].story}</p>}
              </div>
              <span className="en-unit-cast">
                {unitThemes[u.id]?.cast.map((c) => <BloomFace key={c.name} variant={c.face} size={52} follow={false} waveOnMount={false} label={c.name} />)}
              </span>
              <span className="en-unit-count">{done}/{LESSONS_PER_UNIT}</span>
            </header>
            <div className="en-nodes">
              <svg className="en-trail-svg" viewBox="0 0 200 330" preserveAspectRatio="none" aria-hidden="true">
                <path className="en-trail" d="M100 20 C 160 60, 160 90, 100 120 C 40 150, 40 180, 100 210 C 160 240, 160 270, 100 310" strokeDasharray="1200" />
              </svg>
              {Array.from({ length: LESSONS_PER_UNIT }, (_, li) => {
                const state = li < done ? 'done' : open && li === done && !currentFound ? 'current' : 'locked'
                if (state === 'current') currentFound = true
                return (
                  <button
                    key={li}
                    type="button"
                    className={`en-node is-${state}`}
                    style={{ ['--x' as string]: `${[0, 34, 0, -34][li % 4]}px` }}
                    disabled={state === 'locked'}
                    aria-label={`${u.title} lesson ${li + 1}${state === 'done' ? ' (done — practise again)' : state === 'locked' ? ' (locked)' : ''}`}
                    onClick={() => onStart(ui)}
                  >
                    {state === 'done' ? '★' : state === 'current' ? '▶' : '🔒'}
                    {state === 'current' && <span className="en-start">Start</span>}
                  </button>
                )
              })}
              {done >= LESSONS_PER_UNIT && <span className="en-chest" aria-label="Unit complete">🏆</span>}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export function EnglishPage({ data, today, onNavigate }: { data: AppData; setData?: unknown; today: string; onNavigate?: (page: 'habits') => void }) {
  const [store, setStore] = useState<EnglishStore>(() => ({ ...emptyEnglish, ...readStore(ENGLISH_KEY, emptyEnglish) }))
  const save = (fn: (s: EnglishStore) => EnglishStore) =>
    setStore((s) => {
      const n = fn(s)
      writeStore(ENGLISH_KEY, n)
      return n
    })
  const [tab, setTab] = useState('learn')
  const [session, setSession] = useState<Session | null>(null)
  const [summary, setSummary] = useState<{ xp: number; acc: number; badges: string[] } | null>(null)
  const [, tick] = useState(0)

  // New day / new week housekeeping: freezes and league promotion.
  useEffect(() => {
    save((s) => rollLeague(applyFreezes(s, today), today))
    const t = window.setInterval(() => tick((n) => n + 1), 30_000)
    return () => window.clearInterval(t)
  }, [today])

  const hearts = heartsNow(store)
  const days = streak(store, today)
  const xp = xpToday(store, today)
  const wod = useMemo(() => wordOfDay(today), [today])
  const quests = useMemo(() => questsFor(today), [today])

  const start = (s: Session) => {
    if (s.kind === 'lesson' && on('hearts') && hearts.hearts <= 0) {
      setTab('shop')
      return
    }
    setSummary(null)
    setSession(s)
  }
  const startUnit = (ui: number) => {
    const u = units[ui]
    start({ title: u.title, unit: u.id, kind: 'lesson', exercises: makeLesson(u, unitProgress(store, u.id) % LESSONS_PER_UNIT, { speak: on('speaking'), listen: on('listening') }) })
  }

  const finish = (r: LessonResult) => {
    if (!session) return
    const perfect = r.mistakes.length === 0
    const base = session.kind === 'placement' ? 0 : session.kind === 'lesson' ? 10 : 5
    const gain = base + (perfect && base ? 5 : 0)
    let next = earn(store, today, gain)
    for (const w of r.words) next = reviewWord(next, w.en, w.good)
    if (session.kind === 'lesson' && session.unit) next = { ...next, done: { ...next.done, [session.unit]: (next.done[session.unit] ?? 0) + 1 }, perfect: next.perfect + (perfect ? 1 : 0) }
    if (session.kind === 'lesson') {
      const u = units.find((x) => x.id === session.unit)
      for (const w of u?.words ?? []) if (!next.cards[w.en]) next = reviewWord(next, w.en, true)
    }
    if (session.kind === 'mistakes') next = { ...next, mistakes: [] }
    else next = { ...next, mistakes: [...next.mistakes, ...r.mistakes.map((m) => ({ ...m, at: today }))].slice(-40) }
    if (session.kind === 'placement') {
      // Unlock every unit up to the first one with a wrong answer.
      const wrong = new Set(r.mistakes.map((m) => m.prompt))
      const ps = session.exercises as (Exercise & { unit?: number })[]
      const firstMiss = ps.find((e) => wrong.has('text' in e ? e.text : 'prompt' in e ? e.prompt : ''))?.unit ?? units.length
      const done = { ...next.done }
      units.slice(0, firstMiss).forEach((u) => (done[u.id] = Math.max(done[u.id] ?? 0, LESSONS_PER_UNIT)))
      next = { ...next, done, placed: true }
    }
    const got = newBadges(next, today)
    next = { ...next, badges: [...next.badges, ...got] }
    save(() => next)
    setSession(null)
    setSummary({ xp: gain, acc: r.total ? Math.round((r.correct / r.total) * 100) : 100, badges: got })
    sfx('done')
    burst(undefined, 'stars')
    logActivity('english', { kind: session.kind, xp: gain, accuracy: r.total ? r.correct / r.total : 1 })
  }

  if (session) {
    return (
      <LessonPlayer
        title={session.title}
        exercises={session.exercises}
        hearts={on('hearts') && session.kind === 'lesson' ? heartsNow(store).hearts : MAX_HEARTS}
        onHeartLost={() => on('hearts') && session.kind === 'lesson' && save((s) => loseHeart(s))}
        onDone={finish}
        onQuit={() => setSession(null)}
        theme={session.unit ? unitThemes[session.unit] : undefined}
      />
    )
  }

  const header = (
    <div className="en-stats" aria-label="Your stats">
      <span className="en-stat flame" data-hint="Day streak"><Flame size={18} /> {days}</span>
      <span className="en-stat gem" data-hint="Gems"><Gem size={18} /> {store.gems}</span>
      {on('hearts') && <span className="en-stat heart" data-hint="Hearts"><Heart size={18} fill="currentColor" /> {hearts.hearts}</span>}
      <span className="en-stat xp" data-hint="XP today"><Zap size={18} /> {xp}</span>
    </div>
  )

  const learnTab = () => (
    <div className="en-learn">
      <div className="en-main">
        {summary && (
          <section className="studio-card en-summary" role="status">
            <h3>Lesson complete! 🎉</h3>
            <div className="en-summary-stats">
              <span><strong>+{summary.xp}</strong> XP</span>
              <span><strong>{summary.acc}%</strong> accuracy</span>
            </div>
            {summary.badges.map((b) => {
              const d = badgeDefs.find((x) => x.id === b)!
              return <p key={b} className="en-badge-new">{d.emoji} New badge: <strong>{d.title}</strong></p>
            })}
          </section>
        )}
        {on('placement') && !store.placed && totalXp(store) === 0 && (
          <section className="studio-card en-callout">
            <h3>Already know some English?</h3>
            <p>Take a 2-minute placement test and skip what you know.</p>
            <button type="button" className="en-check" onClick={() => start({ title: 'Placement test', kind: 'placement', exercises: makePlacement() })}>Find my level</button>
          </section>
        )}
        <PathMap store={store} onStart={startUnit} />
      </div>
      <aside className="en-side">
        <section className="studio-card en-goal">
          <GoalRing value={xp} goal={store.goal} />
          <div>
            <strong>Daily goal</strong>
            <small>{Math.min(xp, store.goal)}/{store.goal} XP</small>
            <select className="studio-input" aria-label="Daily goal" value={store.goal} onChange={(e) => save((s) => ({ ...s, goal: Number(e.target.value) }))}>
              {goals.map((g) => <option key={g.xp} value={g.xp}>{g.label} · {g.xp} XP</option>)}
            </select>
          </div>
        </section>
        {on('wordOfDay') && (
          <section className="studio-card en-wod">
            <small>Word of the day</small>
            <button type="button" className="en-wod-word" onClick={() => speak(wod.en)}><span>{wod.emoji}</span> {wod.en}</button>
            <p>{wod.meaning}</p>
            <em>“{wod.example}”</em>
          </section>
        )}
        {on('quests') && (
          <section className="studio-card">
            <h3>Daily quests</h3>
            <ul className="en-quests">
              {quests.map((q) => {
                const v = Math.min(q.target, q.measure(store, today))
                const claimed = store.questsClaimed[today]?.includes(q.id)
                return (
                  <li key={q.id}>
                    <span>{q.title}</span>
                    <div className="en-qbar"><i style={{ width: `${(v / q.target) * 100}%` }} /></div>
                    {v >= q.target && !claimed ? (
                      <button type="button" className="en-claim" onClick={(e) => { burst(e.currentTarget, 'coins'); save((s) => ({ ...s, gems: s.gems + q.gems, questsClaimed: { ...s.questsClaimed, [today]: [...(s.questsClaimed[today] ?? []), q.id] } })) }}>+{q.gems} 💎</button>
                    ) : (
                      <small>{claimed ? '✓' : `${v}/${q.target}`}</small>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}
        {on('review') && (
          <section className="studio-card en-practice-quick">
            <button type="button" className="studio-btn" onClick={() => setTab('practice')}><Dumbbell size={15} /> Practice hub</button>
            {onNavigate && <button type="button" className="studio-btn" onClick={() => onNavigate('habits')}>Make it a habit</button>}
          </section>
        )}
      </aside>
    </div>
  )

  const leagueTab = () => {
    const table = leagueTable(store, today)
    return (
      <div className="en-grid">
        {on('leagues') && (
          <section className="studio-card en-league" style={{ ['--lg' as string]: leagueColors[store.league] }}>
            <h3><Trophy size={16} /> {leagues[store.league]} league</h3>
            <p className="quick-note">Top 5 move up next Monday · you have {weekXp(store, today)} XP this week</p>
            <ol className="en-table">
              {table.map((r, k) => (
                <li key={r.name} className={`${r.me ? 'is-me' : ''} ${k < 5 ? 'up' : k >= 10 ? 'down' : ''}`}>
                  <span className="en-rank">{k + 1}</span>
                  <span className="en-avatar" aria-hidden="true">{r.name[0]}</span>
                  <span className="en-name">{r.name}</span>
                  <strong>{r.xp} XP</strong>
                </li>
              ))}
            </ol>
          </section>
        )}
        {on('shop') && (
          <section className="studio-card">
            <h3><Gem size={16} /> Gem shop</h3>
            <ul className="en-shop">
              {[
                { id: 'freeze', emoji: '🧊', title: 'Streak freeze', desc: `Keeps your streak if you miss a day (own ${store.freezes}/2)`, cost: 20, can: store.freezes < 2, buy: (s: EnglishStore) => ({ ...s, freezes: s.freezes + 1 }) },
                { id: 'hearts', emoji: '❤️', title: 'Refill hearts', desc: 'Back to 5 hearts now', cost: 30, can: hearts.hearts < MAX_HEARTS, buy: (s: EnglishStore) => ({ ...s, hearts: MAX_HEARTS, heartsAt: Date.now() }) },
                { id: 'double', emoji: '⚡', title: 'Double XP (15 min)', desc: 'Every lesson earns twice the XP', cost: 40, can: Date.now() > store.doubleXpUntil, buy: (s: EnglishStore) => ({ ...s, doubleXpUntil: Date.now() + 15 * 60 * 1000 }) },
              ].map((it) => (
                <li key={it.id}>
                  <span className="en-shop-emoji">{it.emoji}</span>
                  <span><strong>{it.title}</strong><small>{it.desc}</small></span>
                  <button type="button" className="studio-btn" disabled={!it.can || store.gems < it.cost} onClick={(e) => { burst(e.currentTarget, 'coins'); save((s) => ({ ...it.buy(s), gems: s.gems - it.cost })) }}>💎 {it.cost}</button>
                </li>
              ))}
            </ul>
            {on('hearts') && hearts.hearts < MAX_HEARTS && <p className="quick-note">Next heart in {Math.ceil(hearts.nextIn / 60000)} min — or practise to earn XP without hearts.</p>}
          </section>
        )}
        {on('badges') && (
          <section className="studio-card">
            <h3>Achievements</h3>
            <div className="en-badges">
              {badgeDefs.map((b) => (
                <div key={b.id} className={`en-badge ${store.badges.includes(b.id) ? 'got' : ''}`} title={b.desc}>
                  <span>{b.emoji}</span>
                  <strong>{b.title}</strong>
                  <small>{b.desc}</small>
                </div>
              ))}
            </div>
          </section>
        )}
        {on('charts') && (
          <section className="studio-card" data-matrix-native>
            <h3>Your XP</h3>
            <p className="quick-note">{totalXp(store)} XP in total · {Object.keys(store.cards).length} words learned · {days}-day streak</p>
            <Suspense fallback={<p role="status">Loading chart…</p>}><XpChart store={store} today={today} /></Suspense>
          </section>
        )}
      </div>
    )
  }

  const lazyTab = (node: React.ReactNode) => <Suspense fallback={<p role="status">Loading…</p>}>{node}</Suspense>

  return (
    <Studio
      name="english"
      accent="#58cc02"
      tab={tab}
      onTab={setTab}
      scene={<StudioScene colors={['#58cc02', '#1cb0f6', '#ffc800']} line="pulse" />}
      aside={header}
      tabs={[
        { id: 'learn', label: 'Learn', icon: <Languages size={15} />, render: learnTab },
        ...(on('storyMode') ? [{ id: 'story', label: 'Story', icon: <Swords size={15} />, render: () => lazyTab(<StoryMode onXp={(n) => save((st) => earn(st, today, n))} onGems={(n) => save((st) => ({ ...st, gems: st.gems + n }))} onFreeze={() => save((st) => ({ ...st, freezes: Math.min(2, st.freezes + 1) }))} />) }] : []),
        ...(on('review') ? [{ id: 'practice', label: 'Practice', icon: <Dumbbell size={15} />, render: () => lazyTab(<EnglishPractice store={store} save={save} today={today} onStart={(exs: Exercise[], title: string, kind: Session['kind']) => start({ title, exercises: exs, kind })} makeReview={makeReview} makeMistakes={makeMistakes} />) }] : []),
        ...(on('pronunciation') ? [{ id: 'speak', label: 'Speak', icon: <Mic size={15} />, render: () => lazyTab(<EnglishLab onXp={(n: number) => save((s) => earn(s, today, n))} />) }] : []),
        ...(on('writing') ? [{ id: 'write', label: 'Write', icon: <PenLine size={15} />, render: () => lazyTab(<EnglishWrite data={data} onFeedback={() => save((s) => ({ ...earn(s, today, 10), writings: s.writings + 1 }))} />) }] : []),
        { id: 'shop', label: 'League', icon: <Trophy size={15} />, render: leagueTab },
        ...(on('stories') ? [{ id: 'stories', label: 'Stories', icon: <BookOpen size={15} />, render: () => lazyTab(<EnglishPractice mode="stories" store={store} save={save} today={today} onStart={() => {}} makeReview={makeReview} makeMistakes={makeMistakes} />) }] : []),
      ]}
    />
  )
}
