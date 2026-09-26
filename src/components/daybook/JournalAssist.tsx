import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { CalendarPlus, Clock, Sparkles } from 'lucide-react'
import { subOn } from '../../features/subFeatures'

/**
 * Small, mode-aware helpers under a Daybook page. They reuse libraries that
 * other features already ship: reading-time (all pages), compromise (clear
 * writing), ics (meeting prep export).
 */
const GOAL_KEY = 'bloom-daybook-wordgoal-v1'

function WordRing({ words, goal }: { words: number; goal: number }) {
  const arc = useRef<SVGCircleElement>(null)
  const C = 2 * Math.PI * 16
  const frac = Math.min(1, words / Math.max(1, goal))
  useLayoutEffect(() => {
    if (arc.current) gsap.to(arc.current, { strokeDashoffset: C * (1 - frac), duration: 0.8, ease: 'power2.out' })
  }, [frac, C])
  return (
    <svg className="ja-ring" viewBox="0 0 40 40" aria-label={`${words} of ${goal} words`}>
      <circle cx="20" cy="20" r="16" className="ja-ring-track" />
      <circle ref={arc} cx="20" cy="20" r="16" className="ja-ring-arc" data-done={frac >= 1} strokeDasharray={C} strokeDashoffset={C} transform="rotate(-90 20 20)" />
    </svg>
  )
}

export function JournalAssist({ modeId, text }: { modeId: string; text: string }) {
  const [minutes, setMinutes] = useState(0)
  const [clarity, setClarity] = useState<string[]>([])
  const [goal, setGoal] = useState(() => Number(localStorage.getItem(GOAL_KEY) ?? 150) || 150)
  const words = text.trim() ? text.trim().split(/\s+/).length : 0

  useEffect(() => {
    let live = true
    void import('reading-time').then(({ default: rt }) => live && setMinutes(rt(text).minutes))
    return () => {
      live = false
    }
  }, [text])
  useEffect(() => {
    if (modeId !== 'clear-writing' || !subOn('daybookModes', 'writingCoach') || words < 12) return setClarity([])
    let live = true
    const t = setTimeout(() => {
      void import('compromise').then(({ default: nlp }) => {
        if (!live) return
        const doc = nlp(text)
        const long = (doc.sentences().out('array') as string[]).filter((s) => s.split(/\s+/).length > 25).length
        const adverbs = doc.adverbs().length
        const passive = doc.match('#Auxiliary #PastTense').length
        setClarity([long ? `${long} long sentence${long > 1 ? 's' : ''} to split` : 'Sentences are a good length', `${adverbs} adverb${adverbs === 1 ? '' : 's'}`, passive ? `${passive} possible passive phrase${passive > 1 ? 's' : ''}` : 'Active voice'])
      })
    }, 600)
    return () => {
      live = false
      clearTimeout(t)
    }
  }, [modeId, text, words])

  const exportMeeting = async () => {
    const { createEvent } = await import('ics')
    const d = new Date(Date.now() + 86400000)
    const { value } = createEvent({ title: text.split('\n')[0].slice(0, 80) || 'Meeting', start: [d.getFullYear(), d.getMonth() + 1, d.getDate(), 9, 0], duration: { minutes: 30 }, description: text })
    if (!value) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([value], { type: 'text/calendar' }))
    a.download = 'meeting.ics'
    a.click()
  }

  if (!subOn('daybookModes', 'assist')) return null
  return (
    <div className="ja" aria-live="polite">
      {subOn('daybookModes', 'wordGoal') && (
        <label className="ja-goal" title="Word goal">
          <WordRing words={words} goal={goal} />
          <span>
            {words}/
            <input
              type="number"
              min={25}
              step={25}
              aria-label="Word goal"
              value={goal}
              onChange={(e) => {
                const v = Math.max(25, Number(e.target.value) || 150)
                setGoal(v)
                localStorage.setItem(GOAL_KEY, String(v))
              }}
            />
          </span>
        </label>
      )}
      {subOn('daybookModes', 'readingTime') && words > 0 && (
        <span className="ja-chip">
          <Clock size={13} /> {Math.max(1, Math.round(minutes))} min read
        </span>
      )}
      {clarity.map((c) => (
        <span key={c} className="ja-chip">
          <Sparkles size={13} /> {c}
        </span>
      ))}
      {modeId === 'meeting-prep' && subOn('daybookModes', 'meetingExport') && words > 0 && (
        <button type="button" className="ja-chip ja-btn" onClick={() => void exportMeeting()}>
          <CalendarPlus size={13} /> Add to calendar (.ics)
        </button>
      )}
    </div>
  )
}
