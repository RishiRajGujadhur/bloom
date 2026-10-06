import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import Fuse from 'fuse.js'
import { Volume2 } from 'lucide-react'
import { ShowMore } from '../../components/ui/Flow'
import { burst } from '../../components/ui/celebrate'
import { allWords, roleplays, stories, units, type Word } from './englishCourse'
import { dueWords, earn, learnedWords, strength, type EnglishStore, type Mistake } from './englishModel'
import { norm, shuffle, speak } from './englishNlp'
import type { Exercise } from './lessonGen'
import type { Session } from './EnglishPage'
import { sfx } from './sfx'
import { subOn } from '../subFeatures'

const on = (id: string) => subOn('englishLearning', id)

/** Match madness: pair words and meanings against a 60-second clock. */
function MatchMadness({ onXp }: { onXp: (n: number) => void }) {
  const [round, setRound] = useState<Word[] | null>(null)
  const [left, setLeft] = useState(60)
  const [score, setScore] = useState(0)
  const [pick, setPick] = useState<string | null>(null)
  const [gone, setGone] = useState<string[]>([])
  const right = useMemo(() => (round ? shuffle(round) : []), [round])
  useEffect(() => {
    if (!round) return
    if (left <= 0) {
      onXp(Math.ceil(score / 2))
      setRound(null)
      return
    }
    const t = window.setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, left])
  const deal = () => {
    setRound(shuffle(allWords).slice(0, 5))
    setGone([])
  }
  const tap = (en: string, side: 'l' | 'r') => {
    if (side === 'l') return setPick(en)
    if (pick === en) {
      sfx('tick')
      const g = [...gone, en]
      setGone(g)
      setScore((s) => s + 1)
      if (g.length === 5) deal()
    } else sfx('wrong')
    setPick(null)
  }
  if (!round)
    return (
      <div className="en-madness-start">
        {score > 0 && <p>Last round: <strong>{score}</strong> pairs</p>}
        <button type="button" className="en-check" onClick={() => { setScore(0); setLeft(60); deal() }}>Start Match Madness ⏱️</button>
      </div>
    )
  return (
    <div>
      <div className="en-madness-bar"><i style={{ width: `${(left / 60) * 100}%` }} /></div>
      <p className="quick-note">{left}s · {score} pairs</p>
      <div className="en-match bloom-columns">
        <div>{round.map((w) => <button key={w.en} type="button" className="en-option" aria-pressed={pick === w.en} disabled={gone.includes(w.en)} onClick={() => tap(w.en, 'l')}>{w.en}</button>)}</div>
        <div>{right.map((w) => <button key={w.en} type="button" className="en-option" disabled={gone.includes(w.en)} onClick={() => tap(w.en, 'r')}>{w.emoji} {w.meaning}</button>)}</div>
      </div>
    </div>
  )
}

/** A story: lines appear one by one (GSAP), then comprehension questions. */
function StoryPlayer({ id, onDone }: { id: string; onDone: (score: number) => void }) {
  const s = stories.find((x) => x.id === id)!
  const [shown, setShown] = useState(1)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const box = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const last = box.current?.querySelector('.en-line:last-child')
    if (last) gsap.fromTo(last, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' })
    speak(s.lines[shown - 1].text)
  }, [shown, s])
  const finished = shown >= s.lines.length
  const allAnswered = Object.keys(answers).length === s.questions.length
  return (
    <div className="en-story">
      <div ref={box} className="en-lines bloom-stack">
        {s.lines.slice(0, shown).map((l, k) => (
          <p key={k} className={`en-line ${k % 2 ? 'right' : ''}`}>
            <span className="en-who">{l.who}</span>
            <button type="button" className="en-say" aria-label="Hear line" onClick={() => speak(l.text)}><Volume2 size={14} /></button>
            {l.text}
          </p>
        ))}
      </div>
      {!finished ? (
        <button type="button" className="en-check" onClick={() => setShown((n) => n + 1)}>Continue</button>
      ) : (
        <div className="en-questions bloom-stack">
          {s.questions.map((q, qi) => (
            <div key={q.q}>
              <strong>{q.q}</strong>
              <div className="en-options bloom-stack">
                {q.options.map((o) => (
                  <button key={o} type="button" className={`en-option ${answers[qi] !== undefined && o === q.answer ? 'is-right' : ''} ${answers[qi] === o && o !== q.answer ? 'is-wrong' : ''}`} disabled={answers[qi] !== undefined} onClick={() => { sfx(o === q.answer ? 'right' : 'wrong'); setAnswers((a) => ({ ...a, [qi]: o })) }}>{o}</button>
                ))}
              </div>
            </div>
          ))}
          {allAnswered && <button type="button" className="en-check" onClick={() => onDone(s.questions.filter((q, qi) => answers[qi] === q.answer).length)}>Finish story</button>}
        </div>
      )}
    </div>
  )
}

/** Roleplay: a scripted chat; answers are graded on keywords. */
function RoleplayChat({ id, onDone }: { id: string; onDone: () => void }) {
  const r = roleplays.find((x) => x.id === id)!
  const [step, setStep] = useState(0)
  const [log, setLog] = useState<{ who: 'bot' | 'me'; text: string; ok?: boolean }[]>([{ who: 'bot', text: r.steps[0].bot }])
  const [text, setText] = useState('')
  useEffect(() => speak(r.steps[0].bot), [r])
  const send = () => {
    if (!text.trim()) return
    const cur = r.steps[step]
    const words = new Set(norm(text).split(' '))
    const ok = cur.keywords.some((k) => words.has(k)) && text.trim().split(/\s+/).length >= 2
    const next = step + 1
    const add: typeof log = [{ who: 'me', text, ok }]
    if (!ok) add.push({ who: 'bot', text: `Hmm, try something like: “${cur.hint}”` })
    else if (next < r.steps.length) add.push({ who: 'bot', text: r.steps[next].bot })
    else add.push({ who: 'bot', text: 'Perfect — that went really well! 🎉' })
    setLog((l) => [...l, ...add])
    setText('')
    sfx(ok ? 'right' : 'wrong')
    const say = add[add.length - 1].text
    speak(say)
    if (ok) {
      if (next >= r.steps.length) onDone()
      else setStep(next)
    }
  }
  return (
    <div className="en-roleplay">
      <div className="en-chat bloom-stack">
        {log.map((m, k) => <p key={k} className={`en-bubble ${m.who} ${m.ok === false ? 'miss' : ''}`}>{m.text}</p>)}
      </div>
      <form className="en-chat-form" onSubmit={(e) => { e.preventDefault(); send() }}>
        <input className="studio-input" value={text} aria-label="Your reply" placeholder="Reply in English…" onChange={(e) => setText(e.target.value)} />
        <button type="submit" className="en-check">Send</button>
      </form>
      <p className="quick-note">Hint: {r.steps[step].hint}</p>
    </div>
  )
}

export function EnglishPractice({ store, save, today, onStart, makeReview, makeMistakes, mode = 'practice' }: {
  store: EnglishStore
  save: (fn: (s: EnglishStore) => EnglishStore) => void
  today: string
  onStart: (exs: Exercise[], title: string, kind: Session['kind']) => void
  makeReview: (w: Word[]) => Exercise[]
  makeMistakes: (m: Mistake[]) => Exercise[]
  mode?: 'practice' | 'stories'
}) {
  const [story, setStory] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const due = dueWords(store)
  const learned = learnedWords(store)
  const fuse = useMemo(() => new Fuse(allWords, { keys: ['en', 'meaning'], threshold: 0.35 }), [])
  const list = query ? fuse.search(query).map((r) => r.item) : learned
  const xp = (n: number) => save((s) => earn(s, today, n))

  if (mode === 'stories') {
    if (story) return <StoryPlayer id={story} onDone={(sc) => { xp(5 + sc * 2); burst(undefined, 'stars'); setStory(null) }} />
    if (role) return <RoleplayChat id={role} onDone={() => { xp(15); burst(undefined, 'stars'); setTimeout(() => setRole(null), 1500) }} />
    return (
      <div className="en-grid">
        <section className="studio-card">
          <h3>📖 Stories</h3>
          <div className="en-cards">
            {stories.map((s) => (
              <button key={s.id} type="button" className="en-card-btn" onClick={() => setStory(s.id)}>
                <span className="en-big-emoji">{s.emoji}</span><strong>{s.title}</strong><small>{s.level}</small>
              </button>
            ))}
          </div>
        </section>
        {on('roleplay') && (
          <section className="studio-card">
            <h3>🎭 Roleplay</h3>
            <p className="quick-note">Chat through a real situation. Bloom checks you said the right kind of thing.</p>
            <div className="en-cards">
              {roleplays.map((r) => (
                <button key={r.id} type="button" className="en-card-btn" onClick={() => setRole(r.id)}>
                  <span className="en-big-emoji">{r.emoji}</span><strong>{r.title}</strong>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  return (
    <div className="en-grid">
      <section className="studio-card en-hub bloom-stack">
        <h3>🏋️ Practice hub</h3>
        <button type="button" className="en-hub-btn" disabled={!due.length} onClick={() => onStart(makeReview(due), 'Word review', 'review')}>
          <span>🔁</span><strong>Review due words</strong><small>{due.length ? `${due.length} ready` : 'Nothing due — come back later'}</small>
        </button>
        {on('mistakes') && (
          <button type="button" className="en-hub-btn" disabled={!store.mistakes.length} onClick={() => onStart(makeMistakes(store.mistakes), 'Mistakes', 'mistakes')}>
            <span>🩹</span><strong>Fix your mistakes</strong><small>{store.mistakes.length} saved</small>
          </button>
        )}
        <button type="button" className="en-hub-btn" disabled={learned.length < 4} onClick={() => onStart(makeReview(learned), 'Speed review', 'review')}>
          <span>⚡</span><strong>Speed review</strong><small>Mixed words you know</small>
        </button>
      </section>
      {on('matchMadness') && (
        <section className="studio-card">
          <h3>⏱️ Match madness</h3>
          <MatchMadness onXp={xp} />
        </section>
      )}
      {on('grammarTips') && (
        <section className="studio-card">
          <h3>📐 Grammar tips</h3>
          <ShowMore initial={3} label="tips">
            {units.map((u) => (
              <details key={u.id} className="en-tip">
                <summary>{u.emoji} {u.grammar.title} <small>{u.level}</small></summary>
                <p>{u.grammar.rule}</p>
                <ul>{u.grammar.examples.map((e) => <li key={e}><button type="button" className="en-say" aria-label="Hear example" onClick={() => speak(e)}><Volume2 size={13} /></button> {e}</li>)}</ul>
              </details>
            ))}
          </ShowMore>
        </section>
      )}
      <section className="studio-card en-words">
        <h3>📚 Words <small>{learned.length}/{allWords.length}</small></h3>
        <input className="studio-input" placeholder="Search words or meanings" aria-label="Search words" value={query} onChange={(e) => setQuery(e.target.value)} />
        <ShowMore as="ul" initial={8} className="en-wordlist" label="words">
          {list.map((w) => {
            const st = strength(store.cards[w.en])
            return (
              <li key={w.en}>
                <button type="button" className="en-say" aria-label={`Hear ${w.en}`} onClick={() => speak(w.en)}><Volume2 size={14} /></button>
                <span className="en-word-main"><strong>{w.emoji} {w.en}</strong><small>{w.meaning}</small></span>
                <span className="en-strength" aria-label={`Strength ${st} of 4`}>{[1, 2, 3, 4].map((k) => <i key={k} className={k <= st ? 'on' : ''} />)}</span>
              </li>
            )
          })}
        </ShowMore>
      </section>
    </div>
  )
}
