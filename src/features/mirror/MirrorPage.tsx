import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { CalendarDays, Cloud, HeartHandshake, LineChart, Lock, ScanFace } from 'lucide-react'
import type { FeaturePageProps } from '../shared/pageProps'
import { Segmented, Stat, Studio, StudioScene } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { journalText } from '../../search/db'
import { DAYBOOK_STORAGE_KEY } from '../../components/daybook/storage'
import { GRATITUDE_KEY, MOOD_KEY } from '../wellbeing/store'
import { agreement, byWeekday, daily, label, reframesFor, score, topWords, type Scored, type Source, type Text } from './mirrorModel'
import './mirror.css'
import { pathLength } from '../../utils/svgLength'

const on = (id: string) => subOn('moodMirror', id)
const readArray = <T,>(key: string): T[] => {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(v) ? (v as T[]) : []
  } catch {
    return []
  }
}

function collect(data: FeaturePageProps['data']): Text[] {
  const out: Text[] = []
  for (const s of data.sessions) {
    const text = s.messages.filter((m) => m.sender === 'user').map((m) => m.text).join(' ')
    if (text.trim()) out.push({ id: `j:${s.metadata.id}`, at: new Date(s.metadata.date).getTime(), text, source: 'journal' })
  }
  for (const p of readArray<{ id: string; updatedAt: string; content: unknown }>(DAYBOOK_STORAGE_KEY)) {
    const text = journalText(p.content)
    if (text.trim()) out.push({ id: `d:${p.id}`, at: Date.parse(p.updatedAt), text, source: 'daybook' })
  }
  for (const g of readArray<{ id: string; at: number; text: string }>(GRATITUDE_KEY)) if (g.text) out.push({ id: `g:${g.id}`, at: g.at, text: g.text, source: 'gratitude' })
  for (const m of readArray<{ id: string; at: number; note: string }>(MOOD_KEY)) if (m.note) out.push({ id: `m:${m.id}`, at: m.at, text: m.note, source: 'mood' })
  return out
}

function Trend({ days }: { days: { date: string; value: number }[] }) {
  const path = useRef<SVGPathElement>(null)
  useLayoutEffect(() => {
    if (!path.current) return
    const len = pathLength(path.current, 300)
    gsap.fromTo(path.current, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.out' })
  }, [days.length])
  if (days.length < 2) return <p className="studio-empty">Write on two different days to see your tone over time.</p>
  const W = 600
  const H = 220
  const x = (i: number) => 20 + (i / (days.length - 1)) * (W - 40)
  const y = (v: number) => H / 2 - Math.max(-1, Math.min(1, v * 2)) * (H / 2 - 20)
  const d = days.map((p, i) => `${i ? 'L' : 'M'}${x(i)} ${y(p.value)}`).join(' ')
  return (
    <svg className="mr-trend" viewBox={`0 0 ${W} ${H}`} aria-label="Tone over time">
      <defs>
        <linearGradient id="mr-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f2c14e" />
          <stop offset="0.5" stopColor="#c9b8ff" />
          <stop offset="1" stopColor="#5a7aa6" />
        </linearGradient>
      </defs>
      <line x1="0" x2={W} y1={H / 2} y2={H / 2} className="mr-zero" />
      <path d={`${d} L${x(days.length - 1)} ${H / 2} L${x(0)} ${H / 2} Z`} fill="url(#mr-grad)" opacity="0.18" />
      <path ref={path} d={d} className="mr-line" />
      {days.map((p, i) => (
        <circle key={p.date} cx={x(i)} cy={y(p.value)} r="4" className="mr-dot">
          <title>
            {p.date}: {label(p.value)}
          </title>
        </circle>
      ))}
    </svg>
  )
}

function WordCloud({ words, tone }: { words: [string, number][]; tone: 'pos' | 'neg' }) {
  const root = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!root.current) return
    const t = gsap.from(root.current.children, { scale: 0, opacity: 0, duration: 0.6, stagger: 0.04, ease: 'back.out(2)' })
    return () => void t.progress(1).kill()
  }, [words.length])
  const max = Math.max(1, ...words.map((w) => w[1]))
  return (
    <div ref={root} className="mr-cloud" data-tone={tone}>
      {words.length ? words.map(([w, n]) => <span key={w} style={{ fontSize: `${14 + (n / max) * 22}px` }}>{w}</span>) : <span className="studio-empty">Nothing yet</span>}
    </div>
  )
}

export function MirrorPage({ data }: FeaturePageProps) {
  const [source, setSource] = useState<'all' | Source>('all')
  const all = useMemo(() => collect(data).map(score), [data])
  const items: Scored[] = on('sources') && source !== 'all' ? all.filter((i) => i.source === source) : all
  const days = daily(items)
  const recent = items.filter((i) => i.at > Date.now() - 7 * 86400000)
  const avg = (l: Scored[]) => (l.length ? l.reduce((a, i) => a + i.comparative, 0) / l.length : 0)
  const moods = readArray<{ at: number; mood: number }>(MOOD_KEY)
  const r = on('compare') ? agreement(days, moods) : null
  const weekdays = byWeekday(items)

  const overview = () => (
    <div className="studio-split">
      <div className="studio-card mr-overview bloom-start-stack">
        {on('weekFace') && (
        <div className="mr-face" data-tone={label(avg(recent))}>
          <span>{{ Bright: '😊', Warm: '🙂', Neutral: '😐', Cloudy: '😕', Heavy: '😔' }[label(avg(recent))]}</span>
          <strong>{label(avg(recent))}</strong>
          <small>your writing this week</small>
        </div>
        )}
        <div className="studio-stats">
          <Stat value={items.length} label="entries read" />
          <Stat value={recent.length} label="this week" />
          {r !== null && <Stat value={r.toFixed(2)} label="matches logged mood (r)" />}
        </div>
        {on('sources') && (
          <Segmented
            label="Source"
            value={source}
            onChange={setSource}
            options={[
              { id: 'all', label: 'All' },
              { id: 'journal', label: 'Journal' },
              { id: 'daybook', label: 'Daybook' },
              { id: 'gratitude', label: 'Gratitude' },
              { id: 'mood', label: 'Mood notes' },
            ]}
          />
        )}
        {on('privacy') && (
          <p className="studio-empty">
            <Lock size={12} /> Analysed on this device only.
          </p>
        )}
      </div>
      <div className="studio-card">
        <h3>
          <LineChart size={17} /> Tone over time
        </h3>
        {on('trend') && <Trend days={days.slice(-45).map((d, i, arr) => ({ date: d.date, value: arr.slice(Math.max(0, i - 2), i + 1).reduce((a, x) => a + x.value, 0) / Math.min(3, i + 1) }))} />}
        {on('scores') && (
          <ul className="wo-sets mr-scores">
            {[...items].sort((a, b) => b.at - a.at).slice(0, 6).map((i) => (
              <li key={i.id}>
                <span>{i.text.slice(0, 60)}{i.text.length > 60 ? '…' : ''}</span>
                <strong>{label(i.comparative)}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )

  const words = () => (
    <div className="studio-split">
      <div className="studio-card">
        <h3>Words that lift you</h3>
        {on('wordCloud') && <WordCloud words={topWords(items, 'positive')} tone="pos" />}
        {on('gratitudeWords') && <p className="studio-empty">From gratitude notes: {topWords(items.filter((i) => i.source === 'gratitude'), 'positive', 5).map((w) => w[0]).join(', ') || '—'}</p>}
      </div>
      <div className="studio-card">
        <h3>Words that weigh on you</h3>
        {on('wordCloud') && <WordCloud words={topWords(items, 'negative')} tone="neg" />}
      </div>
    </div>
  )

  const patterns = () => (
    <div className="studio-card">
      <h3>
        <CalendarDays size={17} /> By weekday
      </h3>
      <div className="mr-week">
        {weekdays.map((w) => (
          <div key={w.day} className="mr-day">
            <span className="mr-bar" style={{ height: `${w.value === null ? 4 : 30 + Math.max(-1, Math.min(1, w.value * 3)) * 60}%` }} data-tone={w.value === null ? 'none' : label(w.value)} />
            <small>{w.day}</small>
          </div>
        ))}
      </div>
    </div>
  )

  const reframes = () => {
    const list = reframesFor(recent.length ? recent : items)
    return (
      <div className="iv-programs bloom-stack">
        <h3>
          <HeartHandshake size={17} /> Gentle reframes
        </h3>
        {list.length ? (
          list.map(([w, text]) => (
            <div key={w} className="studio-card mr-reframe bloom-stack">
              <strong>“{w}”</strong>
              <p>{text}</p>
            </div>
          ))
        ) : (
          <p className="studio-empty">No heavy themes lately. Keep writing honestly.</p>
        )}
      </div>
    )
  }

  return (
    <Studio
      name="mirror"
      accent="#8f7ae5"
      scene={<StudioScene colors={['#c9b8ff', '#f4c7d8', '#ffe29a']} line="wave" />}
      tabs={[
        { id: 'overview', label: 'Mirror', icon: <ScanFace size={15} />, render: overview },
        ...(on('wordCloud') ? [{ id: 'words', label: 'Words', icon: <Cloud size={15} />, render: words }] : []),
        ...(on('weekday') ? [{ id: 'patterns', label: 'Patterns', icon: <CalendarDays size={15} />, render: patterns }] : []),
        ...(on('reframes') ? [{ id: 'reframes', label: 'Reframes', icon: <HeartHandshake size={15} />, render: reframes }] : []),
      ]}
    />
  )
}
