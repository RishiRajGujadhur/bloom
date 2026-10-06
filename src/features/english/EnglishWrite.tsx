import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import type { AppData } from '../../model'
import { analyseWriting } from './englishWriting'
import { subOn } from '../subFeatures'

const on = (id: string) => subOn('englishLearning', id)
const prompts = [
  'Describe your perfect morning.',
  'What did you do last weekend?',
  'Write about a person who inspires you.',
  'What would you do with a free day?',
  'Describe a place that makes you calm.',
  'What habit do you want to build, and why?',
]

/**
 * Writing coach: write in English and get suggestions (write-good), a
 * readability score (Flesch, ARI), a CEFR estimate, tone and keywords.
 * It can import today's Daybook entry, so journalling doubles as practice.
 */
export function EnglishWrite({ data, onFeedback }: { data: AppData; onFeedback: () => void }) {
  const [text, setText] = useState('')
  const [shown, setShown] = useState<ReturnType<typeof analyseWriting> | null>(null)
  const [prompt, setPrompt] = useState(() => prompts[Math.floor(Math.random() * prompts.length)])
  const meter = useRef<HTMLDivElement>(null)
  const live = useMemo(() => analyseWriting(text), [text])
  const lastEntry = useMemo(() => {
    const s = [...(data?.sessions ?? [])].reverse().find((x) => x.messages.some((m) => m.sender === 'user' && m.text.trim().length > 20))
    return s ? s.messages.filter((m) => m.sender === 'user').map((m) => m.text).join(' ') : ''
  }, [data])

  useLayoutEffect(() => {
    if (shown && meter.current) gsap.fromTo(meter.current.querySelectorAll('i'), { scaleX: 0 }, { scaleX: 1, transformOrigin: 'left', duration: 0.8, stagger: 0.1, ease: 'power3.out' })
  }, [shown])

  const highlighted = useMemo(() => {
    if (!shown) return null
    const out: React.ReactNode[] = []
    let at = 0
    const sorted = [...shown.suggestions].sort((a, b) => a.index - b.index)
    for (const s of sorted) {
      if (s.index < at) continue
      out.push(text.slice(at, s.index))
      out.push(<mark key={s.index} title={s.reason}>{text.slice(s.index, s.index + s.offset)}</mark>)
      at = s.index + s.offset
    }
    out.push(text.slice(at))
    return out
  }, [shown, text])

  return (
    <div className="en-grid">
      <section className="studio-card en-write bloom-stack">
        <h3>✍️ Writing coach</h3>
        <p className="quick-note">Prompt: <strong>{prompt}</strong> <button type="button" className="en-link" onClick={() => setPrompt(prompts[(prompts.indexOf(prompt) + 1) % prompts.length])}>another</button></p>
        <textarea className="studio-input" rows={7} value={text} aria-label="Your writing" placeholder="Write a few sentences in English…" onChange={(e) => { setText(e.target.value); setShown(null) }} />
        <div className="en-inline bloom-controls">
          <small>{live.words} words · {live.sentences} sentences</small>
          {on('daybookLink') && lastEntry && <button type="button" className="studio-btn" onClick={() => setText(lastEntry)}>Use my last Daybook entry</button>}
          <button type="button" className="en-check" disabled={live.words < 5} onClick={() => { setShown(analyseWriting(text)); onFeedback() }}>Get feedback</button>
        </div>
      </section>
      {shown && (
        <section className="studio-card en-feedback">
          <h3>Feedback</h3>
          {shown.foreign && <p className="en-warn">This looks like it isn’t English — try writing it in English.</p>}
          <div ref={meter} className="en-meters">
            <div><span>Level</span><strong>{shown.cefr}</strong></div>
            <div><span>Readability</span><em><i style={{ width: `${Math.max(0, Math.min(100, shown.ease))}%` }} /></em><small>{shown.ease}/100</small></div>
            <div><span>Vocabulary variety</span><em><i style={{ width: `${shown.variety}%` }} /></em><small>{shown.variety}%</small></div>
            <div><span>Tone</span><strong>{shown.tone}</strong></div>
          </div>
          <p className="en-marked">{highlighted}</p>
          {shown.suggestions.length ? (
            <ul className="en-sugg">{shown.suggestions.slice(0, 8).map((s, k) => <li key={k}><mark>{s.text}</mark> {s.reason}</li>)}</ul>
          ) : (
            <p>✅ No style issues found. Nice writing!</p>
          )}
          {shown.keywords.length > 0 && <div className="en-tags bloom-wrap">{shown.keywords.map((k) => <span key={k}>{k}</span>)}</div>}
        </section>
      )}
    </div>
  )
}
