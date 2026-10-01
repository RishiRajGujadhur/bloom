import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import Fuse from 'fuse.js'
import { Award, BookOpen, Code2, HelpCircle, Lightbulb, Play, RotateCcw, Swords, Trophy } from 'lucide-react'
import { Studio, StudioScene, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { burst } from '../../components/ui/celebrate'
import { setQuiz } from '../../companion/quizContext'
import { subOn } from '../subFeatures'
import { challenges, cheatsheets, lessons, modules, quiz, type Check } from './codeCourse'
import { runCode, type RunResult } from './codeRunner'
import './code.css'

const CodeStory = lazy(() => import('./CodeStory').then((m) => ({ default: m.CodeStory })))
const Editor = lazy(() => import('./Editor').then((m) => ({ default: m.Editor })))
const CodeQuestStory = lazy(() => import('./CodeQuestStory').then((m) => ({ default: m.CodeQuestStory })))
const on = (id: string) => subOn('codeLearning', id)
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const CODE_KEY = 'bloom-code-v1'
const CodePaths = lazy(() => import('./CodePaths').then((m) => ({ default: m.CodePaths })))
type CodeStore = { done: Record<string, boolean>; drafts: Record<string, string>; xp: number; quiz: Record<string, boolean>; certificate: boolean }
const empty: CodeStore = { done: {}, drafts: {}, xp: 0, quiz: {}, certificate: false }
const md = (s: string) => DOMPurify.sanitize(marked.parse(s, { async: false }) as string)

/* ---------- The workspace: instructions | editor | console + checklist ---------- */
function Workspace({ title, body, starter, solution, checks, hint, draft, onDraft, onPass, done, nav }: {
  title: string; body: string; starter: string; solution: string; checks: Check[]; hint?: string
  draft?: string; onDraft: (code: string) => void; onPass: () => void; done: boolean; nav?: React.ReactNode
}) {
  const [code, setCode] = useState(draft ?? starter)
  const [result, setResult] = useState<RunResult | null>(null)
  const [running, setRunning] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const list = useRef<HTMLUListElement>(null)
  const consoleRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    setCode(draft ?? starter)
    setResult(null)
    setShowHint(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title])
  useEffect(() => {
    setQuiz({ source: 'Code lesson', question: title, answer: solution, explain: hint })
    return () => setQuiz(null)
  }, [title, solution, hint])
  const run = async () => {
    setRunning(true)
    const r = await runCode(code, checks)
    setResult(r)
    setRunning(false)
    onDraft(code)
    if (list.current && !reduced()) gsap.fromTo(list.current.children, { x: -8, opacity: 0.4 }, { x: 0, opacity: 1, stagger: 0.08, duration: 0.3, ease: 'back.out(2)' })
    if (consoleRef.current && !reduced()) gsap.fromTo(consoleRef.current, { boxShadow: 'inset 0 0 0 999px #58cc0222' }, { boxShadow: 'inset 0 0 0 999px #58cc0200', duration: 0.8, clearProps: 'boxShadow' })
    if (r.checks.length && r.checks.every((c) => c.pass)) {
      if (!done) onPass()
      burst(list.current ?? undefined, 'stars')
    }
  }
  const passCount = result?.checks.filter((c) => c.pass).length ?? 0
  return (
    <div className="cd-work">
      <section className="cd-pane cd-learn">
        <header><h3>{title}</h3>{done && <span className="cd-done">✓ Done</span>}</header>
        <div className="cd-body" dangerouslySetInnerHTML={{ __html: md(body) }} />
        <ul ref={list} className="cd-checks" aria-label="Checklist">
          {checks.map((c, i) => {
            const r = result?.checks[i]
            return (
              <li key={c.label} className={r ? (r.pass ? 'pass' : 'fail') : ''}>
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="10" cy="10" r="8" />
                  {r?.pass && <path d="M5.5 10.5 L8.5 13.5 L14.5 6.5" />}
                  {r && !r.pass && <path d="M6.5 6.5 L13.5 13.5 M13.5 6.5 L6.5 13.5" />}
                </svg>
                <span>{c.label}{r && !r.pass && r.got && !r.got.startsWith('__err') ? <small> — got {r.got}</small> : null}</span>
              </li>
            )
          })}
        </ul>
        <div className="cd-help">
          {hint && <button type="button" className="studio-btn" onClick={() => setShowHint((v) => !v)}><Lightbulb size={14} /> Hint</button>}
          <button type="button" className="studio-btn" onClick={() => { if (code !== starter && code !== solution && !window.confirm('Replace your code with the solution?')) return; setCode(solution); setResult(null) }}>Get unstuck</button>
          {nav}
        </div>
        {showHint && hint && <p className="cd-hint">💡 {hint}</p>}
      </section>
      <section className="cd-pane cd-editor">
        <Suspense fallback={<textarea className="cd-fallback" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Code editor" />}>
          <Editor value={code} onChange={setCode} onRun={run} />
        </Suspense>
        <div className="cd-bar">
          <button type="button" className="cd-run" onClick={run} disabled={running}><Play size={15} /> {running ? 'Running…' : 'Run'} <kbd>Ctrl ↵</kbd></button>
          <button type="button" className="studio-btn" onClick={() => { if (code !== starter && !window.confirm('Reset to the starter code? Your changes will be lost.')) return; setCode(starter); setResult(null) }}><RotateCcw size={14} /> Reset</button>
          <button type="button" className="studio-btn" title="Copy your code" onClick={() => void navigator.clipboard?.writeText(code).then(() => window.dispatchEvent(new CustomEvent('bloom:toast', { detail: 'Code copied' })))}>📋 Copy</button>
          {result && <span className={`cd-score ${passCount === checks.length ? 'all' : ''}`}>{passCount}/{checks.length} checks</span>}
        </div>
      </section>
      <section ref={consoleRef} className="cd-pane cd-console" aria-live="polite">
        <header>Console {result && <small>{result.ms} ms</small>}</header>
        <pre>
          {!result && <span className="cd-muted">Press Run to see output.</span>}
          {result?.syntax && <span className="cd-err">SyntaxError (line {result.syntax.line}): {result.syntax.message}</span>}
          {result?.logs.map((l, i) => <span key={i}>{'› '}{l}{'\n'}</span>)}
          {result?.error && <span className="cd-err">{result.error}</span>}
        </pre>
      </section>
    </div>
  )
}

/* ---------- Course map: module path with animated SVG progress rings ---------- */
function CourseMap({ store, open }: { store: CodeStore; open: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!ref.current || reduced()) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.cd-mod', { y: 16, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.4, ease: 'back.out(1.8)' })
      gsap.utils.toArray<SVGCircleElement>('.cd-ring-arc').forEach((c) => gsap.fromTo(c, { strokeDashoffset: 113 }, { strokeDashoffset: Number(c.dataset.off), duration: 1, ease: 'power3.out' }))
    }, ref)
    return () => ctx.revert()
  }, [store.done])
  return (
    <div ref={ref} className="cd-map">
      {modules.map((m) => {
        const ls = lessons.filter((l) => l.module === m.id)
        const n = ls.filter((l) => store.done[l.id]).length
        const off = 113 * (1 - n / ls.length)
        return (
          <div key={m.id} className="cd-mod" style={{ ['--m' as string]: m.color }}>
            <svg viewBox="0 0 44 44" className="cd-ring" aria-hidden="true">
              <circle cx="22" cy="22" r="18" className="cd-ring-track" />
              <circle cx="22" cy="22" r="18" className="cd-ring-arc" strokeDasharray="113" strokeDashoffset={off} data-off={off} />
              <text x="22" y="27" textAnchor="middle">{m.emoji}</text>
            </svg>
            <div className="cd-mod-main">
              <strong>{m.title}</strong>
              <div className="cd-mod-lessons">
                {ls.map((l) => (
                  <button key={l.id} type="button" className={`cd-chip ${store.done[l.id] ? 'done' : ''}`} onClick={() => open(l.id)}>{store.done[l.id] ? '✓ ' : ''}{l.title}</button>
                ))}
              </div>
            </div>
            <small>{n}/{ls.length}</small>
          </div>
        )
      })}
    </div>
  )
}

/* ---------- Quiz with a flip-in card and progress dots ---------- */
function Quiz({ store, save }: { store: CodeStore; save: (f: (s: CodeStore) => CodeStore) => void }) {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const card = useRef<HTMLDivElement>(null)
  const q = quiz[i]
  useLayoutEffect(() => {
    if (card.current && !reduced()) gsap.fromTo(card.current, { rotateX: -70, opacity: 0, transformOrigin: '50% 0%' }, { rotateX: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.6)' })
    setQuiz({ source: 'Code quiz', question: q.q + (q.code ? ` ${q.code}` : ''), answer: q.options[q.answer], options: q.options, explain: q.why })
    return () => setQuiz(null)
  }, [i, q])
  const pick = (k: number) => {
    if (picked !== null) return
    setPicked(k)
    if (k === q.answer) {
      save((s) => ({ ...s, quiz: { ...s.quiz, [q.id]: true }, xp: s.xp + (s.quiz[q.id] ? 0 : 5) }))
      burst(card.current ?? undefined, 'stars')
    } else if (card.current && !reduced()) gsap.fromTo(card.current, { x: -10 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' })
  }
  return (
    <div className="cd-quiz">
      <div className="cd-dots" aria-label={`Question ${i + 1} of ${quiz.length}`}>{quiz.map((x, k) => <i key={x.id} className={`${k === i ? 'now' : ''} ${store.quiz[x.id] ? 'ok' : ''}`} />)}</div>
      <div ref={card} className="studio-card cd-qcard">
        <small>{modules.find((m) => m.id === q.module)?.title}</small>
        <h3>{q.q}</h3>
        {q.code && <pre className="cd-snippet">{q.code}</pre>}
        <div className="cd-opts">
          {q.options.map((o, k) => (
            <button key={o} type="button" className={`cd-opt ${picked !== null && k === q.answer ? 'right' : ''} ${picked === k && k !== q.answer ? 'wrong' : ''}`} onClick={() => pick(k)} disabled={picked !== null}>
              <kbd>{'ABCD'[k]}</kbd> <code>{o}</code>
            </button>
          ))}
        </div>
        {picked !== null && <p className="cd-why">{picked === q.answer ? '✅ ' : '❌ '}{q.why}</p>}
        <div className="cd-help">
          <button type="button" className="studio-btn" disabled={i === 0} onClick={() => { setI(i - 1); setPicked(null) }}>Back</button>
          <button type="button" className="cd-run" onClick={() => { setI((i + 1) % quiz.length); setPicked(null) }}>Next question</button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Certificate (SVG with a GSAP-drawn seal) ---------- */
function Certificate({ name }: { name: string }) {
  const ref = useRef<SVGSVGElement>(null)
  useLayoutEffect(() => {
    if (!ref.current || reduced()) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.ct-border', { strokeDashoffset: 1600 }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' })
      gsap.fromTo('.ct-seal', { scale: 0, rotate: -120, transformOrigin: '50% 50%' }, { scale: 1, rotate: 0, duration: 0.9, delay: 0.8, ease: 'back.out(2)' })
      gsap.to('.ct-ray', { rotate: 360, transformOrigin: '440px 200px', duration: 20, repeat: -1, ease: 'none' })
    }, ref)
    return () => ctx.revert()
  }, [])
  return (
    <svg ref={ref} className="cd-cert" viewBox="0 0 560 300" role="img" aria-label="Certificate of completion">
      <rect x="6" y="6" width="548" height="288" rx="16" fill="#fffaf0" />
      <rect className="ct-border" x="18" y="18" width="524" height="264" rx="10" fill="none" stroke="#d0643f" strokeWidth="3" strokeDasharray="1600" />
      <text x="40" y="70" fontSize="15" fontWeight="700" fill="#9a8a7a" letterSpacing="3">CERTIFICATE OF COMPLETION</text>
      <text x="40" y="118" fontSize="30" fontWeight="900" fill="#1f1d2b">JavaScript Foundations</text>
      <text x="40" y="160" fontSize="16" fill="#5b3a2e">awarded to</text>
      <text x="40" y="196" fontSize="28" fontFamily="Caveat, cursive" fill="#d0643f">{name}</text>
      <text x="40" y="250" fontSize="12" fill="#9a8a7a">Bloom Code · {new Date().toLocaleDateString([], { dateStyle: 'long' })}</text>
      <g className="ct-ray">{Array.from({ length: 12 }, (_, k) => <rect key={k} x="437" y="130" width="6" height="20" rx="3" fill="#ffc800" opacity="0.6" transform={`rotate(${k * 30} 440 200)`} />)}</g>
      <g className="ct-seal">
        <circle cx="440" cy="200" r="46" fill="#f7df1e" stroke="#c9a800" strokeWidth="3" />
        <text x="440" y="212" textAnchor="middle" fontSize="32" fontWeight="900" fill="#1f1d2b">JS</text>
      </g>
    </svg>
  )
}

export function CodePage() {
  const [store, setStore] = useState<CodeStore>(() => ({ ...empty, ...readStore(CODE_KEY, empty) }))
  const save = (f: (s: CodeStore) => CodeStore) =>
    setStore((s) => {
      const n = f(s)
      writeStore(CODE_KEY, n)
      return n
    })
  const [tab, setTab] = useState('learn')
  const firstOpen = lessons.find((l) => !store.done[l.id])?.id ?? lessons[0].id
  const [lessonId, setLessonId] = useState<string | null>(null)
  const [challengeId, setChallengeId] = useState(challenges[0].id)
  const [query, setQuery] = useState('')
  const [name, setName] = useState('Bloom learner')
  const lesson = lessons.find((l) => l.id === (lessonId ?? firstOpen))!
  const li = lessons.indexOf(lesson)
  const doneCount = lessons.filter((l) => store.done[l.id]).length
  const fuse = useMemo(() => new Fuse(Object.entries(cheatsheets).flatMap(([m, rows]) => rows.map((r) => ({ ...r, m }))), { keys: ['code', 'note'], threshold: 0.4 }), [])
  const pass = (id: string, xp: number) => {
    save((s) => ({ ...s, done: { ...s.done, [id]: true }, xp: s.xp + xp }))
    logActivity('code', { id, xp })
  }

  const learnTab = () =>
    lessonId === null ? (
      <div className="cd-home">
        <section className="studio-card cd-hero">
          <svg viewBox="0 0 120 80" className="cd-hero-art" aria-hidden="true">
            <rect x="4" y="6" width="112" height="68" rx="10" fill="#1f1d2b" />
            <circle cx="16" cy="16" r="3" fill="#ff5f56" /><circle cx="26" cy="16" r="3" fill="#ffbd2e" /><circle cx="36" cy="16" r="3" fill="#27c93f" />
            <text x="14" y="40" fontSize="11" fill="#f7df1e" fontFamily="Fira Code, monospace">console.log(</text>
            <text className="cd-type" x="14" y="56" fontSize="11" fill="#9ef04a" fontFamily="Fira Code, monospace">'Hello, Bloom!')</text>
            <rect className="cd-caret" x="104" y="47" width="5" height="12" fill="#fff" />
          </svg>
          <div>
            <h3>Learn JavaScript</h3>
            <p>{doneCount}/{lessons.length} lessons · {store.xp} XP. Write real code in the browser — every lesson checks your work instantly.</p>
            <button type="button" className="cd-run" onClick={() => setLessonId(firstOpen)}><Play size={15} /> {doneCount ? 'Continue' : 'Start'} learning</button>
          </div>
        </section>
        <CourseMap store={store} open={setLessonId} />
      </div>
    ) : (
      <Workspace
        key={lesson.id}
        title={`${li + 1}. ${lesson.title}`}
        body={lesson.body}
        starter={lesson.starter}
        solution={lesson.solution}
        checks={lesson.checks}
        hint={lesson.hint}
        draft={store.drafts[lesson.id]}
        onDraft={(c) => save((s) => ({ ...s, drafts: { ...s.drafts, [lesson.id]: c } }))}
        onPass={() => pass(lesson.id, 10)}
        done={!!store.done[lesson.id]}
        nav={
          <>
            <button type="button" className="studio-btn" onClick={() => setLessonId(null)}>Course map</button>
            {li + 1 < lessons.length && <button type="button" className="cd-run" onClick={() => setLessonId(lessons[li + 1].id)}>Next lesson →</button>}
          </>
        }
      />
    )

  const challenge = challenges.find((c) => c.id === challengeId)!
  return (
    <Studio
      name="code"
      accent="#f7df1e"
      tab={tab}
      onTab={setTab}
      scene={<StudioScene colors={['#f7df1e', '#1cb0f6', '#58cc02']} line="pulse" />}
      aside={<span className="cd-aside"><Trophy size={15} /> {store.xp} XP · {doneCount}/{lessons.length}</span>}
      tabs={[
        { id: 'learn', label: 'Learn', icon: <Code2 size={15} />, render: learnTab },
        { id: 'game', label: '3D Code Quest', icon: <Swords size={15} />, render: () => <Suspense fallback={<p role="status">Loading 3D Code Quest…</p>}><CodeQuestStory /></Suspense> },
        ...(on('storyMode') ? [{ id: 'story', label: 'Code Cup', icon: <Trophy size={15} />, render: () => <Suspense fallback={<p role="status">Loading…</p>}><CodeStory onXp={(n) => save((st) => ({ ...st, xp: st.xp + n }))} /></Suspense> }] : []),
        ...(on('quiz') ? [{ id: 'quiz', label: 'Quiz', icon: <HelpCircle size={15} />, render: () => <Quiz store={store} save={save} /> }] : []),
        ...(on('challenges') ? [{
          id: 'challenges', label: 'Challenges', icon: <Swords size={15} />, render: () => (
            <Workspace
              key={challenge.id}
              title={`${challenge.title} · ${challenge.level}`}
              body={challenge.body}
              starter={challenge.starter}
              solution={challenge.solution}
              checks={challenge.checks}
              draft={store.drafts[challenge.id]}
              onDraft={(c) => save((s) => ({ ...s, drafts: { ...s.drafts, [challenge.id]: c } }))}
              onPass={() => pass(challenge.id, challenge.level === 'hard' ? 30 : challenge.level === 'medium' ? 20 : 10)}
              done={!!store.done[challenge.id]}
              nav={<select className="studio-input" aria-label="Challenge" value={challengeId} onChange={(e) => setChallengeId(e.target.value)}>{challenges.map((c) => <option key={c.id} value={c.id}>{store.done[c.id] ? '✓ ' : ''}{c.title} ({c.level})</option>)}</select>}
            />
          ),
        }] : []),
        ...(on('cheatsheets') ? [{
          id: 'cheats', label: 'Cheat sheets', icon: <BookOpen size={15} />, render: () => (
            <div className="cd-cheats">
              <input className="studio-input" placeholder="Search: map, loop, template…" aria-label="Search cheat sheets" value={query} onChange={(e) => setQuery(e.target.value)} />
              <div className="cd-cheat-grid">
                {(query ? [{ m: 'results', rows: fuse.search(query).map((r) => r.item) }] : Object.entries(cheatsheets).map(([m, rows]) => ({ m, rows }))).map(({ m, rows }) => (
                  <section key={m} className="studio-card">
                    <h3>{modules.find((x) => x.id === m)?.emoji ?? '🔎'} {modules.find((x) => x.id === m)?.title ?? 'Results'}</h3>
                    {rows.map((r) => <div key={r.code} className="cd-cheat"><code>{r.code}</code><small>{r.note}</small></div>)}
                  </section>
                ))}
              </div>
            </div>
          ),
        }] : []),
        ...(on('certificate') ? [{
          id: 'cert', label: 'Certificate', icon: <Award size={15} />, render: () => (
            <div className="cd-certwrap">
              {doneCount === lessons.length ? (
                <>
                  <Certificate name={name} />
                  <input className="studio-input" value={name} maxLength={40} aria-label="Name on certificate" onChange={(e) => setName(e.target.value)} />
                </>
              ) : (
                <section className="studio-card">
                  <h3>Your certificate is waiting</h3>
                  <p>Finish all {lessons.length} lessons to earn it — {lessons.length - doneCount} to go.</p>
                  <div className="cd-bigbar"><i style={{ width: `${(doneCount / lessons.length) * 100}%` }} /></div>
                </section>
              )}
            </div>
          ),
        }] : []),
        { id: 'paths', label: 'Learning paths', icon: <Code2 size={15} />, render: () => <Suspense fallback={<p role="status">Loading learning paths…</p>}><CodePaths /></Suspense> },
      ]}
    />
  )
}
