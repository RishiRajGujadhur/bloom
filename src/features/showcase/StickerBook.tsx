import { prefersReducedMotion } from '../../utils/motion'
import { useLayoutEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import gsap from 'gsap'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toggleHabit, type AppData } from '../../model'
import { dayKey } from '../../dates'
import { usePageActions } from '../../components/ui/PageMenu'
import { subOn } from '../subFeatures'
import './showcase.css'

const stickerSet = ['🌟', '🌈', '🍓', '🦋', '🌻', '🐝', '🍀', '🎈', '🐳', '🍩', '🌙', '🔥']
/** Every habit gets its own sticker and colour, stable by position. */
export const stickerFor = (index: number) => stickerSet[index % stickerSet.length]
const tape = ['#ffe082', '#f8bbd0', '#b3e5fc', '#c5e1a5']

/**
 * Habit sticker book: a month page where each check-in is a sticker. New
 * stickers stamp in with GSAP; tap a day to add today's stickers.
 */
export function StickerBook({ data, setData, today }: { data: AppData; setData: Dispatch<SetStateAction<AppData>>; today: string }) {
  const [offset, setOffset] = useState(0)
  const page = useRef<HTMLDivElement>(null)
  const base = new Date(`${today}T12:00:00`)
  const month = new Date(base.getFullYear(), base.getMonth() + offset, 1)
  const days = useMemo(() => {
    const first = (month.getDay() + 6) % 7
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    return [...Array.from({ length: first }, () => null), ...Array.from({ length: count }, (_, i) => dayKey(new Date(month.getFullYear(), month.getMonth(), i + 1, 12)))]
  }, [month.getFullYear(), month.getMonth()]) // eslint-disable-line react-hooks/exhaustive-deps
  const stickersOn = (day: string) => data.habits.map((h, i) => (h.dates.includes(day) ? { h, s: stickerFor(i), i } : null)).filter(Boolean) as { h: AppData['habits'][number]; s: string; i: number }[]
  const total = days.reduce((t, d) => t + (d ? stickersOn(d).length : 0), 0)
  const doneToday = new Set(data.habits.filter((h) => h.dates.includes(today)).map((h) => h.id))
  usePageActions(
    data.habits.some((h) => !doneToday.has(h.id))
      ? [{ id: 'stickers-all', label: 'Check in every habit today', icon: '🌟', run: () => setData((d) => d.habits.reduce((acc, h) => (h.dates.includes(today) ? acc : toggleHabit(acc, h.id, today)), d)) }]
      : [],
  )
  useLayoutEffect(() => {
    if (!page.current || prefersReducedMotion()) return
    const tw = gsap.from(page.current.querySelectorAll('.sb-sticker'), { scale: 2.2, opacity: 0, rotate: () => gsap.utils.random(-40, 40), duration: 0.35, stagger: 0.012, ease: 'back.out(2.5)' })
    return () => void tw.progress(1)
  }, [offset, total])
  if (!subOn('habitTracker', 'stickerBook') || !data.habits.length) return null
  return (
    <section className="sb-book" aria-label="Habit sticker book">
      <header className="sb-head">
        <button type="button" className="icon-button" aria-label="Previous month" onClick={() => setOffset(offset - 1)}>
          <ChevronLeft size={18} />
        </button>
        <h3>
          {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} · {total} stickers
        </h3>
        <button type="button" className="icon-button" aria-label="Next month" onClick={() => setOffset(Math.min(0, offset + 1))} disabled={offset === 0}>
          <ChevronRight size={18} />
        </button>
      </header>
      <div className="sb-legend">
        {data.habits.map((h, i) => (
          <span key={h.id}>
            {stickerFor(i)} {h.title}
          </span>
        ))}
      </div>
      <div ref={page} className="sb-page">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={`h${i}`} className="sb-dow">{d}</span>
        ))}
        {days.map((d, i) =>
          d ? (
            <div key={d} className={`sb-day ${d === today ? 'today' : ''} ${d > today ? 'future' : ''}`} style={{ ['--tape' as string]: tape[i % tape.length] }}>
              <small>{Number(d.slice(8))}</small>
              <div className="sb-stickers bloom-wrap">
                {stickersOn(d).map(({ h, s, i: k }) => (
                  <span key={h.id} className="sb-sticker" title={h.title} style={{ ['--r' as string]: `${((k * 37 + i * 13) % 30) - 15}deg` }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <span key={`e${i}`} />
          ),
        )}
      </div>
    </section>
  )
}
