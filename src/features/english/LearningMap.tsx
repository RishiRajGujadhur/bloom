import { useState, type CSSProperties } from 'react'
import { BookOpen, Check, Headphones, ListPlus, Lock, Mic, Play, Sparkles } from 'lucide-react'
import { units } from './englishCourse'
import { LESSONS_PER_UNIT, unitProgress, unitUnlocked, type EnglishStore } from './englishModel'
import { unitThemes } from './UnitScene'


const topics = [
  { label: 'Hobbies' }, { label: 'Work', id: 'work' }, { label: 'School' },
  { label: 'At home', id: 'home' }, { label: 'Family' }, { label: 'Friends' },
  { label: 'Daily life', id: 'daily' }, { label: 'Food', id: 'food' },
  { label: 'Travel', id: 'travel' }, { label: 'Shopping' },
  { label: 'Wellbeing', id: 'feelings' }, { label: 'Ideas', id: 'ideas' }, { label: 'Culture' },
]
const position = (i: number) => {
  const angle = Math.PI + i * Math.PI / (topics.length - 1)
  return { x: 450 + 398 * Math.cos(angle), y: 540 + 398 * Math.sin(angle) }
}

export function LearningMap({ store, onStart, onPractice, onSpeak }: {
  store: EnglishStore; onStart: (index: number) => void; onPractice?: () => void; onSpeak?: () => void
}) {
  const current = Math.max(0, units.findIndex((u, i) => unitUnlocked(store, i) && unitProgress(store, u.id) < LESSONS_PER_UNIT))
  const [selected, setSelected] = useState(current)
  const [notice, setNotice] = useState('')
  const unit = units[selected]
  const progress = Math.min(LESSONS_PER_UNIT, unitProgress(store, unit.id))
  const choose = (id: string | undefined, label: string) => {
    const index = units.findIndex(u => u.id === id)
    if (index < 0) setNotice(`${label} is coming soon. Keep exploring the available lessons while we grow your learning map.`)
    else if (!unitUnlocked(store, index)) setNotice(`${label} is locked. Complete ${units[index - 1].title} to unlock it.`)
    else { setSelected(index); setNotice('') }
  }
  return (
    <section className="en-map-section" aria-label="Your English learning map">
      <div className="en-orbit-map">
        <svg className="en-orbits" viewBox="0 0 900 640" aria-hidden="true">
          <path className="en-orbit-line" d="M52 540 A398 398 0 0 1 848 540" />
          <path className="en-orbit-line inner" d="M150 600 A300 300 0 1 1 750 600" />
          <path className="en-orbit-line inner" d="M235 600 A220 220 0 1 1 665 600" />
          <path className="en-orbit-spoke" d="M450 260 V540 M310 370 Q320 480 450 540 M590 370 Q580 480 450 540 M225 465 Q320 540 450 540 M675 465 Q580 540 450 540" />
          {topics.slice(0, -1).map((_, i) => { const p = position(i + .5); return <circle key={i} cx={p.x} cy={p.y} r="4" className="en-orbit-dot" /> })}
          <circle className="en-orbit-spark" r="5"><animateMotion dur="18s" repeatCount="indefinite" path="M52 540 A398 398 0 0 1 848 540" /></circle>
          <circle className="en-orbit-pulse" cx="450" cy="335" r="5" />
          <circle className="en-orbit-pulse second" cx="450" cy="395" r="4" />
        </svg>
        {topics.map((topic, i) => {
          const p = position(i)
          const index = units.findIndex(u => u.id === topic.id)
          const available = index >= 0 && unitUnlocked(store, index)
          const done = index >= 0 && unitProgress(store, topic.id!) >= LESSONS_PER_UNIT
          return <button key={topic.label} type="button" className={`en-topic ${available ? 'available' : ''}`}
            style={{ '--map-x': `${p.x / 9}%`, '--map-y': `${p.y / 6.4}%` } as CSSProperties}
            aria-label={`${topic.label}: ${available ? 'open unit' : topic.id ? 'locked' : 'coming soon'}`}
            onClick={() => choose(topic.id, topic.label)}>
            <span className="en-topic-label">{topic.label}</span>
            <span className="en-topic-circle">{done ? <Check size={19} /> : available ? <BookOpen size={19} /> : <Lock size={17} />}</span>
            {!topic.id && <small>Coming soon</small>}
          </button>
        })}
        <button className="en-map-start" type="button" onClick={() => { setSelected(current); setNotice('') }} aria-label={`Select current unit: ${units[current].title}`}>
          <span className="en-map-start-label">{unitProgress(store, units[current].id) ? 'Continue' : 'Start'}</span>
          <span className="en-topic-circle"><BookOpen size={24} /></span><strong>{units[current].title}</strong>
        </button>
        <div className="en-map-skills">
          {[
            { label: 'Grammar', Icon: ListPlus, action: onPractice, cls: 'grammar' },
            { label: 'Vocabulary', Icon: BookOpen, action: onPractice, cls: 'vocabulary' },
            { label: 'Listening', Icon: Headphones, action: onPractice, cls: 'listening' },
            { label: 'Speaking', Icon: Mic, action: onSpeak, cls: 'speaking' },
          ].map(({ label, Icon, action, cls }) => <button key={label} type="button" className={`en-map-skill ${cls}`} onClick={action} disabled={!action} title={action ? `Open ${label.toLowerCase()} practice` : 'Enable this feature in settings'}><span><Icon size={23} /></span>{label}</button>)}
        </div>
        <div className="en-map-center">
          <small>Unit {selected + 1} · {unit.level}</small>
          <span>{unitThemes[unit.id]?.place ?? 'Your next chapter'}</span>
          <h3>{unit.title}</h3>
          <button type="button" className="en-map-play" aria-label={`Start ${unit.title} lesson ${progress < LESSONS_PER_UNIT ? progress + 1 : 1}`} onClick={() => onStart(selected)}><Play size={28} fill="currentColor" /></button>
          <div className="en-map-progress" role="progressbar" aria-label="Lessons completed" aria-valuemin={0} aria-valuemax={LESSONS_PER_UNIT} aria-valuenow={progress}>{Array.from({ length: LESSONS_PER_UNIT }, (_, i) => <i key={i} className={i < progress ? 'done' : ''} />)}</div>
        </div>
      </div>
      <label className="en-course-select">Explore your course<select className="studio-input" value={selected} onChange={(event) => { setSelected(Number(event.target.value)); setNotice('') }} aria-label="Choose a unit">{units.map((u, i) => <option key={u.id} value={i} disabled={!unitUnlocked(store, i)}>{i + 1}. {u.title}{!unitUnlocked(store, i) ? ' · Locked' : ''}</option>)}</select></label>
      <div className="en-map-caption" role="status"><Sparkles size={16} /><span>{notice || 'A little practice today. A world of possibilities tomorrow.'}</span></div>
    </section>
  )
}
