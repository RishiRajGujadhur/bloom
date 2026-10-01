import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Ellipsis, Leaf, Sparkles } from 'lucide-react'
import type { AppData } from '../../model'
import { dayKey, toggleHabit } from '../../model'
import './habitCalendar.css'

type CalendarItem = {
  id: string
  title: string
  day: string
  hour: number
  duration: number
  tone: string
  description: string
  kind: 'preview' | 'habit'
  habitId?: string
  completed?: boolean
}

const sampleItems = [
  { title: 'Book Hotel', offset: 1, hour: 6.5, duration: 1.5, tone: 'mint', description: 'A preview of a planned task. Calendar scheduling is coming soon.' },
  { title: 'Zoom Meeting', offset: 3, hour: 8, duration: 1.5, tone: 'blue', description: 'A preview meeting. Calendar connections are coming soon.' },
  { title: 'Project Design', offset: 5, hour: 10.5, duration: 1.5, tone: 'lilac', description: 'A preview project block. Planning tools are coming soon.' },
  { title: 'Define Product Problems', offset: 3, hour: 13, duration: 1.5, tone: 'plain', description: 'From the raw data, find trends and insights that span users and scenarios. This is a sample calendar item.' },
  { title: 'Time Track', offset: 0, hour: 16, duration: 1.5, tone: 'blue', description: 'A preview time block. Time tracking is coming soon.' },
  { title: 'New Tool Lesson', offset: 4, hour: 18, duration: 1.5, tone: 'rose', description: 'A preview learning block. Calendar scheduling is coming soon.' },
  { title: 'Notes', offset: 3, hour: 19.5, duration: 0.5, tone: 'mint', description: 'A preview note. Calendar notes are coming soon.' },
] as const

const startHour = 6
const endHour = 21
const dateAt = (day: string, offset: number) => {
  const date = new Date(`${day}T12:00:00`)
  date.setDate(date.getDate() + offset)
  return dayKey(date)
}
const mondayOf = (day: string) => {
  const weekday = new Date(`${day}T12:00:00`).getDay()
  return dateAt(day, -(weekday + 6) % 7)
}
const timeLabel = (hour: number) => new Date(2026, 0, 1, Math.floor(hour), (hour % 1) * 60).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

export function HabitCalendar({ data, setData, today }: { data: AppData; setData: Dispatch<SetStateAction<AppData>>; today: string }) {
  const [weekStart, setWeekStart] = useState(() => mondayOf(today))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showPreviews, setShowPreviews] = useState(true)
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => dateAt(weekStart, index)), [weekStart])
  const items = useMemo<CalendarItem[]>(() => {
    const previews: CalendarItem[] = showPreviews ? sampleItems.map((item, index) => ({
      ...item, id: `preview-${index}`, day: days[item.offset], kind: 'preview',
    })) : []
    const habits: CalendarItem[] = data.habits.flatMap((habit, habitIndex) => days
      .filter((day) => day <= today && (day === today || habit.dates.includes(day)))
      .map((day) => ({
        id: `habit-${habit.id}-${day}`, title: habit.title, day,
        hour: 7 + (habitIndex % 4) * 1.5, duration: 0.75,
        tone: 'habit', description: habit.detail || 'A small daily practice.',
        kind: 'habit' as const, habitId: habit.id, completed: habit.dates.includes(day),
      })))
    return [...previews, ...habits]
  }, [data.habits, days, showPreviews, today])
  const selected = items.find((item) => item.id === selectedId) ?? items[0]
  const monthLabel = new Date(`${weekStart}T12:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const dayIndex = days.indexOf(today)

  return <section className="habit-calendar" aria-label="Habit calendar">
    <div className="habit-calendar-main">
      <div className="habit-calendar-toolbar">
        <div className="habit-calendar-nav">
          <button type="button" className="icon-button" aria-label="Previous week" onClick={() => { setWeekStart(dateAt(weekStart, -7)); setSelectedId(null) }}><ChevronLeft size={18} /></button>
          <button type="button" className="icon-button" aria-label="Next week" onClick={() => { setWeekStart(dateAt(weekStart, 7)); setSelectedId(null) }}><ChevronRight size={18} /></button>
          <h2>{monthLabel}</h2>
        </div>
        <div className="habit-calendar-controls">
          <span className="habit-calendar-view"><CalendarDays size={15} /> Week</span>
          <button type="button" className="habit-calendar-today" onClick={() => { setWeekStart(mondayOf(today)); setSelectedId(null) }}>Today</button>
          <button type="button" className="icon-button" aria-label={showPreviews ? 'Hide preview items' : 'Show preview items'} aria-pressed={showPreviews} title={showPreviews ? 'Hide preview items' : 'Show preview items'} onClick={() => { setShowPreviews((value) => !value); setSelectedId(null) }}><Ellipsis size={18} /></button>
        </div>
      </div>
      <div className="habit-calendar-scroll">
        <div className="habit-calendar-days"><span className="habit-calendar-corner" />{days.map((day) => <div key={day} className={`habit-calendar-day ${day === today ? 'is-today' : ''}`}><strong>{new Date(`${day}T12:00:00`).getDate().toString().padStart(2, '0')}</strong><span>{new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}</span></div>)}</div>
        <div className="habit-calendar-grid">
          <div className="habit-calendar-times">{Array.from({ length: endHour - startHour + 1 }, (_, index) => <span key={index} style={{ top: `${(index / (endHour - startHour)) * 100}%` }}>{timeLabel(index + startHour)}</span>)}</div>
          <div className="habit-calendar-canvas">
            <svg className="habit-calendar-lines" viewBox="0 0 700 900" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="habitCalendarGrid" width="100" height="60" patternUnits="userSpaceOnUse"><path d="M 100 0 H 0 V 60" fill="none" stroke="currentColor" strokeWidth="1" /></pattern></defs><rect width="700" height="900" fill="url(#habitCalendarGrid)" /></svg>
            {dayIndex >= 0 && <div className="habit-calendar-today-line" style={{ left: `${(dayIndex + 0.5) * 100 / 7}%` }} aria-hidden="true"><svg viewBox="0 0 12 900" preserveAspectRatio="none"><circle cx="6" cy="5" r="5" /><path d="M6 10V900" /></svg></div>}
            {items.map((item) => <button type="button" key={item.id} className={`habit-calendar-event tone-${item.tone} ${selected?.id === item.id ? 'is-selected' : ''}`} style={{ left: `calc(${days.indexOf(item.day) * 100 / 7}% + 4px)`, width: `calc(${100 / 7}% - 8px)`, top: `${((item.hour - startHour) / (endHour - startHour)) * 100}%`, height: `${Math.max((item.duration / (endHour - startHour)) * 100, 5)}%` }} aria-label={`${item.title}, ${item.day}, ${timeLabel(item.hour)}${item.kind === 'preview' ? ', preview' : ''}`} aria-pressed={selected?.id === item.id} onClick={() => setSelectedId(item.id)}><span className="habit-calendar-event-icon" aria-hidden="true">{item.kind === 'habit' ? <Leaf size={13} /> : <Sparkles size={13} />}</span><span className="habit-calendar-event-copy"><strong>{item.title}</strong><small>{timeLabel(item.hour)} – {timeLabel(item.hour + item.duration)}</small></span></button>)}
          </div>
        </div>
      </div>
      <p className="habit-calendar-caption">Your habits appear alongside sample calendar items. <span>Sample items are previews of upcoming planning features.</span></p>
    </div>
    <aside className="habit-calendar-detail" aria-label="Calendar item details">
      {selected ? <>
        <span className={`habit-calendar-detail-tag ${selected.kind}`}>{selected.kind === 'preview' ? 'Feature preview' : 'Your habit'}</span>
        <h3>{selected.title}</h3>
        <p className="habit-calendar-detail-date">{new Date(`${selected.day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}<br /><Clock3 size={14} /> {timeLabel(selected.hour)} – {timeLabel(selected.hour + selected.duration)}</p>
        <h4>Description</h4><p>{selected.description}</p>
        {selected.kind === 'preview' ? <><h4>Coming soon</h4><p>Scheduling, attendees, and connected tools will appear here when available.</p><div className="habit-calendar-detail-foot"><button type="button" className="quiet-button" onClick={() => setSelectedId(null)}>Close details</button><button type="button" disabled title="This feature is coming soon">Confirm · soon</button></div></> : <><h4>Progress</h4><p>{selected.completed ? 'Checked in on this day.' : 'Ready for a check-in.'}</p><div className="habit-calendar-detail-foot"><button type="button" className="quiet-button" onClick={() => setSelectedId(null)}>Close details</button><button type="button" className="primary" onClick={() => selected.habitId && setData((current) => toggleHabit(current, selected.habitId!, selected.day))}><Check size={16} /> {selected.completed ? 'Undo check-in' : 'Check in'}</button></div></>}
      </> : <div className="habit-calendar-empty"><Leaf size={28} /><h3>No items this week</h3><p>Add a habit or show preview items to explore the calendar.</p></div>}
    </aside>
  </section>
}
