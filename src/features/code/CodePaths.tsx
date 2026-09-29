import { lazy, Suspense, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Compass, FileCode2, LockKeyhole } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { codePaths, nextChapter, toggleChapter } from './learningPaths'
import { CodeSkillCheck } from './CodeSkillCheck'
import './codePaths.css'

const STORAGE_KEY = 'bloom-code-paths-v1'
const HtmlDocumentBuilder = lazy(() => import('./HtmlDocumentBuilder').then((module) => ({ default: module.HtmlDocumentBuilder })))
const HeadingRepair = lazy(() => import('./HeadingRepair').then((module) => ({ default: module.HeadingRepair })))
const FormLabelWorkshop = lazy(() => import('./FormLabelWorkshop').then((module) => ({ default: module.FormLabelWorkshop })))
const LinkNavigationLab = lazy(() => import('./LinkNavigationLab').then((module) => ({ default: module.LinkNavigationLab })))
const SelectorDetective = lazy(() => import('./SelectorDetective').then((module) => ({ default: module.SelectorDetective })))
const BoxModelLab = lazy(() => import('./BoxModelLab').then((module) => ({ default: module.BoxModelLab })))
const FlexboxPlayground = lazy(() => import('./FlexboxPlayground').then((module) => ({ default: module.FlexboxPlayground })))
const GridPuzzle = lazy(() => import('./GridPuzzle').then((module) => ({ default: module.GridPuzzle })))
const BreakpointSimulator = lazy(() => import('./BreakpointSimulator').then((module) => ({ default: module.BreakpointSimulator })))
const ContrastChallenge = lazy(() => import('./ContrastChallenge').then((module) => ({ default: module.ContrastChallenge })))
const KeyboardAudit = lazy(() => import('./KeyboardAudit').then((module) => ({ default: module.KeyboardAudit })))
const ReducedMotionExercise = lazy(() => import('./ReducedMotionExercise').then((module) => ({ default: module.ReducedMotionExercise })))
const ProfileProject = lazy(() => import('./ProfileProject').then((module) => ({ default: module.ProfileProject })))
const ExpressionTraceCards = lazy(() => import('./ExpressionTraceCards').then((module) => ({ default: module.ExpressionTraceCards })))
const ScopeStory = lazy(() => import('./ScopeStory').then((module) => ({ default: module.ScopeStory })))
const CoercionKata = lazy(() => import('./CoercionKata').then((module) => ({ default: module.CoercionKata })))
const ConditionGate = lazy(() => import('./ConditionGate').then((module) => ({ default: module.ConditionGate })))
const LoopDebugger = lazy(() => import('./LoopDebugger').then((module) => ({ default: module.LoopDebugger })))
const ParameterPlayground = lazy(() => import('./ParameterPlayground').then((module) => ({ default: module.ParameterPlayground })))
const ArrayKataPack = lazy(() => import('./ArrayKataPack').then((module) => ({ default: module.ArrayKataPack })))
type Progress = Record<string, boolean>

function readProgress(): Progress {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch { return {} }
}

export function CodePaths() {
  const [pathId, setPathId] = useState(codePaths[0].id)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [completed, setCompleted] = useState<Progress>(readProgress)
  const [checking, setChecking] = useState(false)
  const [building, setBuilding] = useState(false)
  const [repairing, setRepairing] = useState(false)
  const [labeling, setLabeling] = useState(false)
  const [linking, setLinking] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [boxing, setBoxing] = useState(false)
  const [flexing, setFlexing] = useState(false)
  const [gridding, setGridding] = useState(false)
  const [resizing, setResizing] = useState(false)
  const [contrasting, setContrasting] = useState(false)
  const [auditing, setAuditing] = useState(false)
  const [calming, setCalming] = useState(false)
  const [profiling, setProfiling] = useState(false)
  const [tracing, setTracing] = useState(false)
  const [scoping, setScoping] = useState(false)
  const [coercing, setCoercing] = useState(false)
  const [gating, setGating] = useState(false)
  const [looping, setLooping] = useState(false)
  const [parameterizing, setParameterizing] = useState(false)
  const [arraying, setArraying] = useState(false)
  const detail = useRef<HTMLDivElement>(null)
  const path = codePaths.find((item) => item.id === pathId) ?? codePaths[0]
  const chapter = path.chapters[selectedIndex]
  const next = nextChapter(path, completed)
  const count = path.chapters.filter((item) => completed[`${path.id}:${item.id}`]).length
  const done = !!completed[`${path.id}:${chapter.id}`]
  const available = selectedIndex === 0 || !!completed[`${path.id}:${path.chapters[selectedIndex - 1].id}`]

  useLayoutEffect(() => {
    if (!detail.current || prefersReducedMotion()) return
    const tween = gsap.fromTo(detail.current, { y: 10, opacity: .5 }, { y: 0, opacity: 1, duration: .32, ease: 'power2.out' })
    return () => { tween.progress(1).kill() }
  }, [pathId, selectedIndex])

  const choosePath = (id: string) => { setPathId(id); setSelectedIndex(0); setBuilding(false); setRepairing(false); setLabeling(false); setLinking(false); setDetecting(false); setBoxing(false); setFlexing(false); setGridding(false); setResizing(false); setContrasting(false); setAuditing(false); setCalming(false); setProfiling(false); setTracing(false); setScoping(false); setCoercing(false); setGating(false); setLooping(false); setParameterizing(false); setArraying(false) }
  const completeHtml = () => setCompleted((current) => {
    if (current['frontend:html']) return current
    const updated = { ...current, 'frontend:html': true }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch { /* keep progress in this session */ }
    return updated
  })
  const mark = () => {
    const updated = toggleChapter(path, completed, selectedIndex)
    setCompleted(updated)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch { /* keep progress in this session */ }
  }

  return <div className="code-paths">
    <div className="code-path-intro-row"><p className="code-path-intro">Pick a direction. Practice each chapter, then build its small project. Checkmarks record practice you have done, not assessed mastery.</p><button type="button" onClick={() => setChecking(true)}>Find my starting point</button></div>
    <div className="code-path-picker" role="group" aria-label="Programming learning path">
      {codePaths.map((item) => <button key={item.id} type="button" className="code-path-pick" aria-pressed={path.id === item.id} onClick={() => choosePath(item.id)} style={{ ['--path-color' as string]: item.color }}><Compass size={18} aria-hidden="true" />{item.name}</button>)}
    </div>
    {arraying ? <Suspense fallback={<p role="status">Loading array kata…</p>}><ArrayKataPack onClose={() => setArraying(false)} /></Suspense> : parameterizing ? <Suspense fallback={<p role="status">Loading parameter playground…</p>}><ParameterPlayground onClose={() => setParameterizing(false)} /></Suspense> : looping ? <Suspense fallback={<p role="status">Loading loop debugger…</p>}><LoopDebugger onClose={() => setLooping(false)} /></Suspense> : gating ? <Suspense fallback={<p role="status">Loading condition gate…</p>}><ConditionGate onClose={() => setGating(false)} /></Suspense> : coercing ? <Suspense fallback={<p role="status">Loading coercion kata…</p>}><CoercionKata onClose={() => setCoercing(false)} /></Suspense> : scoping ? <Suspense fallback={<p role="status">Loading scope story…</p>}><ScopeStory onClose={() => setScoping(false)} /></Suspense> : tracing ? <Suspense fallback={<p role="status">Loading expression cards…</p>}><ExpressionTraceCards onClose={() => setTracing(false)} /></Suspense> : profiling ? <Suspense fallback={<p role="status">Loading profile project…</p>}><ProfileProject onClose={() => setProfiling(false)} /></Suspense> : calming ? <Suspense fallback={<p role="status">Loading reduced-motion exercise…</p>}><ReducedMotionExercise onClose={() => setCalming(false)} /></Suspense> : auditing ? <Suspense fallback={<p role="status">Loading keyboard audit…</p>}><KeyboardAudit onClose={() => setAuditing(false)} /></Suspense> : contrasting ? <Suspense fallback={<p role="status">Loading contrast challenge…</p>}><ContrastChallenge onClose={() => setContrasting(false)} /></Suspense> : resizing ? <Suspense fallback={<p role="status">Loading breakpoint simulator…</p>}><BreakpointSimulator onClose={() => setResizing(false)} /></Suspense> : gridding ? <Suspense fallback={<p role="status">Loading Grid puzzle…</p>}><GridPuzzle onClose={() => setGridding(false)} /></Suspense> : flexing ? <Suspense fallback={<p role="status">Loading Flexbox playground…</p>}><FlexboxPlayground onClose={() => setFlexing(false)} /></Suspense> : boxing ? <Suspense fallback={<p role="status">Loading box model lab…</p>}><BoxModelLab onClose={() => setBoxing(false)} /></Suspense> : detecting ? <Suspense fallback={<p role="status">Loading selector detective…</p>}><SelectorDetective onClose={() => setDetecting(false)} /></Suspense> : linking ? <Suspense fallback={<p role="status">Loading navigation project…</p>}><LinkNavigationLab onClose={() => setLinking(false)} /></Suspense> : labeling ? <Suspense fallback={<p role="status">Loading form workshop…</p>}><FormLabelWorkshop onClose={() => setLabeling(false)} /></Suspense> : repairing ? <Suspense fallback={<p role="status">Loading heading challenge…</p>}><HeadingRepair onClose={() => setRepairing(false)} /></Suspense> : building ? <Suspense fallback={<p role="status">Loading HTML builder…</p>}><HtmlDocumentBuilder onClose={() => setBuilding(false)} onComplete={completeHtml} /></Suspense> : checking ? <CodeSkillCheck key={path.id} path={path} onClose={() => setChecking(false)} onRecommend={(index) => { setSelectedIndex(index); setChecking(false) }} /> : <section className="code-path-board" style={{ ['--path-color' as string]: path.color }} aria-label={`${path.name} learning path`}>
      <div className="code-path-top"><div><span className="code-path-kicker">YOUR ROUTE</span><h2>{path.name}</h2><p>{count} of {path.chapters.length} practiced{next ? ` · next: ${next.title}` : ' · route complete'}</p></div><a href={path.source} target="_blank" rel="noopener noreferrer" aria-label={`Explore ${path.name} roadmap at roadmap.sh`}>Explore roadmap <ArrowUpRight size={16} aria-hidden="true" /></a></div>
      {path.id === 'frontend' && selectedIndex === 1 && <button type="button" className="code-path-open" onClick={() => setBoxing(true)}><FileCode2 size={16} aria-hidden="true" /> Open box model lab</button>}
      {path.id === 'frontend' && selectedIndex === 1 && <button type="button" className="code-path-open" onClick={() => setFlexing(true)}><FileCode2 size={16} aria-hidden="true" /> Open Flexbox playground</button>}
      {path.id === 'frontend' && selectedIndex === 1 && <button type="button" className="code-path-open" onClick={() => setGridding(true)}><FileCode2 size={16} aria-hidden="true" /> Solve Grid puzzle</button>}
      {path.id === 'frontend' && selectedIndex === 1 && <button type="button" className="code-path-open" onClick={() => setResizing(true)}><FileCode2 size={16} aria-hidden="true" /> Simulate breakpoints</button>}
      {path.id === 'frontend' && selectedIndex === 1 && <button type="button" className="code-path-open" onClick={() => setContrasting(true)}><FileCode2 size={16} aria-hidden="true" /> Repair color contrast</button>}
      {path.id === 'frontend' && selectedIndex === 3 && <button type="button" className="code-path-open" onClick={() => setAuditing(true)} title="Practice keyboard navigation"><FileCode2 size={16} aria-hidden="true" /> Audit keyboard route</button>}
      {path.id === 'frontend' && selectedIndex === 3 && <button type="button" className="code-path-open" onClick={() => setCalming(true)}><FileCode2 size={16} aria-hidden="true" /> Design reduced motion</button>}
      {path.id === 'frontend' && selectedIndex === 5 && <button type="button" className="code-path-open" onClick={() => setProfiling(true)}><FileCode2 size={16} aria-hidden="true" /> Plan and ship profile page</button>}
      {path.id === 'frontend' && selectedIndex === 2 && <button type="button" className="code-path-open" onClick={() => setTracing(true)}><FileCode2 size={16} aria-hidden="true" /> Trace JavaScript expressions</button>}
      {path.id === 'frontend' && selectedIndex === 2 && <button type="button" className="code-path-open" onClick={() => setScoping(true)}><FileCode2 size={16} aria-hidden="true" /> Play variables and scope story</button>}
      {path.id === 'frontend' && selectedIndex === 2 && <button type="button" className="code-path-open" onClick={() => setCoercing(true)}><FileCode2 size={16} aria-hidden="true" /> Predict type coercion</button>}
      {path.id === 'frontend' && selectedIndex === 2 && <button type="button" className="code-path-open" onClick={() => setGating(true)}><FileCode2 size={16} aria-hidden="true" /> Build a condition gate</button>}
      {path.id === 'frontend' && selectedIndex === 2 && <button type="button" className="code-path-open" onClick={() => setLooping(true)}><FileCode2 size={16} aria-hidden="true" /> Debug a loop</button>}
      {path.id === 'frontend' && selectedIndex === 2 && <button type="button" className="code-path-open" onClick={() => setParameterizing(true)}><FileCode2 size={16} aria-hidden="true" /> Practice function parameters</button>}
      {path.id === 'frontend' && selectedIndex === 2 && <button type="button" className="code-path-open" onClick={() => setArraying(true)}><FileCode2 size={16} aria-hidden="true" /> Solve array kata</button>}
      <div className="code-path-map" role="group" aria-label={`${path.name} chapters`}>
        <svg viewBox="0 0 600 12" preserveAspectRatio="none" aria-hidden="true"><path d="M30 6 H570" className="code-path-line-track" /><path d="M30 6 H570" className="code-path-line-fill" style={{ strokeDasharray: `${Math.min(1, count / (path.chapters.length - 1)) * 540} 540` }} /></svg>
        {path.chapters.map((item, index) => <button key={item.id} type="button" className="code-path-stop" aria-label={`Chapter ${index + 1}: ${item.title}${completed[`${path.id}:${item.id}`] ? ', practiced' : ''}`} aria-current={selectedIndex === index ? 'step' : undefined} onClick={() => setSelectedIndex(index)}>{completed[`${path.id}:${item.id}`] ? <Check size={18} aria-hidden="true" /> : index + 1}</button>)}
      </div>
      <div ref={detail} className="code-path-detail"><div className="code-path-detail-copy"><span className="code-path-kicker">CHAPTER {selectedIndex + 1} OF {path.chapters.length}</span><h3>{chapter.title}</h3><p>{chapter.practice}</p><small>Build: {chapter.project}</small>{path.id === 'frontend' && selectedIndex === 0 && <><button type="button" className="code-path-open" onClick={() => setBuilding(true)}><FileCode2 size={16} aria-hidden="true" /> Open HTML builder</button><button type="button" className="code-path-open" onClick={() => setRepairing(true)}><FileCode2 size={16} aria-hidden="true" /> Repair heading hierarchy</button><button type="button" className="code-path-open" onClick={() => setLabeling(true)}><FileCode2 size={16} aria-hidden="true" /> Practice form labels</button><button type="button" className="code-path-open" onClick={() => setLinking(true)} title="Build and test site navigation"><FileCode2 size={16} aria-hidden="true" /> Connect site pages</button></>}{path.id === 'frontend' && selectedIndex === 1 && <button type="button" className="code-path-open" onClick={() => setDetecting(true)} title="Practice CSS selectors"><FileCode2 size={16} aria-hidden="true" /> Solve selector cases</button>}</div><div className="code-path-actions"><button type="button" className="code-path-nav" aria-label="Previous chapter" disabled={selectedIndex === 0} onClick={() => setSelectedIndex((value) => value - 1)}><ChevronLeft size={18} aria-hidden="true" /></button><button type="button" className="code-path-mark" onClick={mark} disabled={!available} aria-label={`${done ? 'Clear practice mark for' : 'Mark practiced'} ${chapter.title}`}>{done ? 'Practiced ✓' : available ? 'Mark practiced' : <><LockKeyhole size={15} aria-hidden="true" /> Finish previous chapter</>}</button><button type="button" className="code-path-nav" aria-label="Next chapter" disabled={selectedIndex === path.chapters.length - 1} onClick={() => setSelectedIndex((value) => value + 1)}><ChevronRight size={18} aria-hidden="true" /></button></div></div>
    </section>}
  </div>
}
