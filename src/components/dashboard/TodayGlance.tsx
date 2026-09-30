import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import type { AppData } from '../../model'
import type { NavKey } from '../layout/Sidebar'
import { readStore } from '../studio/Studio'
import { MONEY_KEY, emptyMoney, formatMoney, toMinor, type MoneyStore } from '../../features/money/moneyModel'
import { daysUntil } from '../../features/money/billsModel'
import { suggestions, type Person } from '../../features/people/peopleModel'
import { loadScans } from '../../features/readiness/sources'
import './todayGlance.css'

/**
 * Today at a glance (QoL 262, 268–273, 281): one row of chips that pulls the
 * day's most useful signals from across Bloom — readiness, bills due, people
 * to reach out to, habits at risk after 8 pm, a wind-down nudge after 9 pm,
 * tomorrow's first block after 6 pm, and a one-tap briefing. Each chip jumps
 * to its page.
 */
type Chip = { id: string; icon: string; text: string; tone: 'good' | 'warn' | 'info' | 'accent'; go: NavKey }

const streakLen = (dates: string[], today: string) => {
  const set = new Set(dates)
  const d = new Date(`${today}T12:00:00`)
  d.setDate(d.getDate() - 1)
  let n = 0
  while (set.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1) }
  return n
}

export function TodayGlance({ data, today, onNavigate }: { data: AppData; today: string; onNavigate: (k: NavKey) => void }) {
  const [readiness, setReadiness] = useState<number | null>(null)
  const row = useRef<HTMLDivElement>(null)
  useEffect(() => { void loadScans().then((s) => { const t = s.find((x) => x.date === today); setReadiness(t?.score ?? null) }) }, [today])

  const hour = new Date().getHours()
  const chips: Chip[] = []
  if (readiness != null) chips.push({ id: 'ready', icon: '💓', text: `Readiness ${readiness}${readiness >= 70 ? ' · push day' : readiness < 45 ? ' · take it easy' : ''}`, tone: readiness >= 70 ? 'good' : readiness < 45 ? 'warn' : 'info', go: 'readiness' as NavKey })
  else if (hour < 12) chips.push({ id: 'ready', icon: '💓', text: 'Take your 60-second readiness scan', tone: 'info', go: 'readiness' as NavKey })

  const money = readStore<MoneyStore>(MONEY_KEY, emptyMoney)
  const due = (money.bills ?? []).filter((b) => !b.paid && (b.due ?? b.renews)).map((b) => ({ b, d: daysUntil((b.due ?? b.renews)!) })).filter((x) => x.d >= -3 && x.d <= 7).sort((a, b) => a.d - b.d)
  if (due[0]) chips.push({ id: 'bill', icon: '🧾', text: `${due[0].b.biller}${due[0].b.amount != null ? ` ${formatMoney(toMinor(due[0].b.amount), money.currency)}` : ''} ${due[0].d < 0 ? 'overdue' : due[0].d === 0 ? 'due today' : `in ${due[0].d}d`}${due.length > 1 ? ` +${due.length - 1}` : ''}`, tone: due[0].d <= 1 ? 'warn' : 'info', go: 'money' })

  const people = readStore<Person[]>('bloom-people-v1', [])
  const reach = suggestions(people).slice(0, 2)
  if (reach.length) chips.push({ id: 'people', icon: '💬', text: `Reach out: ${reach.map((r) => r.p.name).join(', ')}`, tone: 'accent', go: 'people' })

  const atRisk = data.habits.filter((h) => !h.dates.includes(today) && streakLen(h.dates, today) >= 3)
  if (hour >= 20 && atRisk.length) chips.push({ id: 'risk', icon: '🔥', text: `${atRisk.length === 1 ? `“${atRisk[0].title}”` : `${atRisk.length} streaks`} at risk tonight`, tone: 'warn', go: 'habits' })

  if (hour >= 18) {
    const tmr = new Date(`${today}T12:00:00`)
    tmr.setDate(tmr.getDate() + 1)
    const key = tmr.toISOString().slice(0, 10)
    const blocks = (data.calendarBlocks ?? []).filter((b) => b.start.slice(0, 10) === key).sort((a, b) => a.start.localeCompare(b.start))
    if (blocks[0]) chips.push({ id: 'tomorrow', icon: '📅', text: `Tomorrow: ${blocks[0].title} at ${new Date(blocks[0].start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}${blocks.length > 1 ? ` +${blocks.length - 1}` : ''}`, tone: 'info', go: 'calendar' })
  }
  if (hour >= 21) chips.push({ id: 'wind', icon: '🌙', text: 'Start your wind-down', tone: 'accent', go: 'sleep' })
  if (hour >= 5 && hour < 12) chips.push({ id: 'brief', icon: '📻', text: 'Play your morning briefing', tone: 'accent', go: 'briefing' as NavKey })

  useLayoutEffect(() => {
    if (!row.current || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const t = gsap.fromTo(row.current.children, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.07, ease: 'back.out(1.6)' })
    return () => { t.kill() }
  }, [chips.length])

  if (!chips.length) return null
  return (
    <div ref={row} className="tg" role="list" aria-label="Today at a glance">
      {chips.map((c) => (
        <button key={c.id} type="button" role="listitem" className={`tg-chip ${c.tone}`} onClick={() => onNavigate(c.go)}>
          <span aria-hidden="true">{c.icon}</span>{c.text}
        </button>
      ))}
    </div>
  )
}
