import { LearningExercise } from './LearningExercise'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'

import { prefersReducedMotion } from '../../utils/motion'
import { checkFetchViews, FETCH_CASES, STARTER_VIEWS, VIEW_OPTIONS, type FetchPhase, type FetchViews, type View } from './fetchStateModel'
import './fetchStateChallenge.css'

const KEY = 'bloom-fetch-state-v1'
function readSaved(): { views: FetchViews; done: boolean } {
  try { const value = JSON.parse(localStorage.getItem(KEY) ?? 'null'); if (value?.views) return value } catch { /* use starter */ }
  return { views: STARTER_VIEWS, done: false }
}

export function FetchStateChallenge({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(readSaved)
  const [phase, setPhase] = useState<FetchPhase>('idle')
  const [checked, setChecked] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [failure, setFailure] = useState(false)
  const lanes = useRef<SVGGElement>(null)
  const check = checkFetchViews(saved.views)
  const selectedView = phase === 'idle' ? 'none' : saved.views[phase]

  useEffect(() => {
    if (!attempt) return
    const timer = window.setTimeout(() => setPhase(failure ? 'error' : 'success'), 900)
    return () => window.clearTimeout(timer)
  }, [attempt, failure])
  useLayoutEffect(() => {
    if (!lanes.current || prefersReducedMotion()) return
    const tween = gsap.fromTo(lanes.current.children, { x: -9, opacity: .4 }, { x: 0, opacity: 1, duration: .3, stagger: .08 })
    return () => { tween.progress(1).kill() }
  }, [phase, checked])
  const persist = (next: { views: FetchViews; done: boolean }) => { setSaved(next); try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* retain session state */ } }
  const update = (key: keyof FetchViews, value: View) => { persist({ views: { ...saved.views, [key]: value }, done: false }); setChecked(false) }
  const start = (shouldFail: boolean) => { setFailure(shouldFail); setPhase('loading'); setAttempt((value) => value + 1) }
  const run = () => { setChecked(true); if (check.pass) persist({ ...saved, done: true }) }

  return <LearningExercise className="fetch-state" aria-label="Fetch loading and error challenge" title={<>Handle every fetch state</>} description={<>Decide what a visitor sees while a request is pending, after success, and after failure. Try both outcomes in the preview.</>} onClose={onClose}>

    <p className="fetch-state-objective"><strong>Objective:</strong> Show loading feedback, results on success, and a useful error with Retry. {saved.done ? '✓ All states handled.' : ''}</p>
    <div className="fetch-state-grid bloom-columns"><div><h3>Choose the UI for each state</h3>{FETCH_CASES.map((item) => <label key={item.id}>{item.label}<select value={saved.views[item.phase]} onChange={(event) => update(item.phase, event.target.value as View)}>{VIEW_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>)}<button type="button" className="fetch-state-check" onClick={run}>Check all states</button><p role="status">{checked ? check.pass ? 'All three states use the right UI.' : 'Some states need a different UI. Review the paths below.' : 'Choose a UI for each state, then check.'}</p></div>
    <div><h3>Request preview</h3><div className="fetch-state-preview"><div className="fetch-state-actions bloom-wrap"><button type="button" onClick={() => start(false)} disabled={phase === 'loading'}>Load posts</button><button type="button" onClick={() => start(true)} disabled={phase === 'loading'}>Simulate failure</button></div><div className="fetch-state-result" aria-live="polite">{phase === 'idle' ? <p>Choose a request outcome.</p> : selectedView === 'spinner' ? <p role="status">Loading posts…</p> : selectedView === 'cards' ? <div><h4>Latest posts</h4><p>Building with JavaScript</p><p>Designing accessible forms</p></div> : selectedView === 'error-retry' ? <div><p>Could not load posts. Check your connection and try again.</p><button type="button" onClick={() => start(false)}>Retry</button></div> : <p>No feedback is shown for this state.</p>}</div><small>Current state: {phase}</small></div></div></div>
    <svg viewBox="0 0 520 190" role="img" aria-label={`Fetch states: ${check.cases.map((item) => `${item.phase} ${item.pass ? 'correct' : 'needs work'}`).join(', ')}`}><g ref={lanes}>{check.cases.map((item, at) => { const y = 35 + at * 55; return <g key={item.id}><text x="5" y={y + 5}>{item.phase}</text><path d={`M105 ${y} H390`} stroke={checked ? item.pass ? '#54a889' : '#d77963' : '#9aaeb9'} strokeWidth="5" /><circle cx="400" cy={y} r="11" fill={checked ? item.pass ? '#54a889' : '#d77963' : '#9aaeb9'} /><text x="422" y={y + 5}>{checked ? item.pass ? 'READY' : 'FIX' : 'WAIT'}</text></g> })}</g></svg>
    {checked && <ul aria-label="State feedback">{check.cases.map((item) => <li key={item.id}><strong>{item.label}:</strong> {item.pass ? 'correct' : item.reason}</li>)}</ul>}
  </LearningExercise>
}
