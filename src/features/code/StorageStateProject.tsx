import { LearningExercise } from './LearningExercise'
import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'

import { prefersReducedMotion } from '../../utils/motion'
import { checkStorageRules, parseStoredStories, STARTER_STORAGE_RULES, STORAGE_CASES, type StorageRules } from './storageStateModel'
import './storageStateProject.css'

const RULES_KEY = 'bloom-storage-project-rules-v1'
const DATA_KEY = 'bloom-storage-project-stories-v1'
function readRules(): { rules: StorageRules; done: boolean } {
  try { const value = JSON.parse(localStorage.getItem(RULES_KEY) ?? 'null'); if (value?.rules) return value } catch { /* use starter */ }
  return { rules: STARTER_STORAGE_RULES, done: false }
}
function readStories() { try { return parseStoredStories(localStorage.getItem(DATA_KEY)) } catch { return [] } }
function writeStories(stories: string[]) { try { localStorage.setItem(DATA_KEY, JSON.stringify(stories)) } catch { /* preview still works in memory */ } }

export function StorageStateProject({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(readRules)
  const [stories, setStories] = useState<string[]>(() => saved.rules.restoreOnMount ? readStories() : [])
  const [draft, setDraft] = useState('')
  const [checked, setChecked] = useState(false)
  const [feedback, setFeedback] = useState('Add a story, then remount the preview to test persistence.')
  const lanes = useRef<SVGGElement>(null)
  const result = checkStorageRules(saved.rules)

  useLayoutEffect(() => {
    if (!lanes.current || prefersReducedMotion()) return
    const tween = gsap.fromTo(lanes.current.children, { opacity: .3, x: -8 }, { opacity: 1, x: 0, duration: .3, stagger: .08 })
    return () => { tween.progress(1).kill() }
  }, [checked, stories.length])
  const persist = (next: { rules: StorageRules; done: boolean }) => { setSaved(next); try { localStorage.setItem(RULES_KEY, JSON.stringify(next)) } catch { /* retain session state */ } }
  const update = (key: keyof StorageRules, value: boolean) => { persist({ rules: { ...saved.rules, [key]: value }, done: false }); setChecked(false) }
  const add = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = draft.trim(); if (!title) return
    const next = [...stories, title].slice(-20); setStories(next); setDraft('')
    if (saved.rules.saveOnAdd) writeStories(next)
    setFeedback(saved.rules.saveOnAdd ? 'Added and saved. Remount to confirm it survives.' : 'Added in memory only. Remount to see what happens.')
  }
  const remove = (at: number) => {
    const next = stories.filter((_, index) => index !== at); setStories(next)
    if (saved.rules.syncOnRemove) writeStories(next)
    setFeedback(saved.rules.syncOnRemove ? 'Removed and saved. Remount to confirm it stays gone.' : 'Removed in memory only. Remount may bring it back.')
  }
  const remount = () => {
    const next = saved.rules.restoreOnMount ? readStories() : []
    setStories(next); setFeedback(`Preview remounted: ${next.length} ${next.length === 1 ? 'story' : 'stories'} restored from storage.`)
  }
  const run = () => { setChecked(true); if (result.pass) persist({ ...saved, done: true }) }

  return <LearningExercise className="storage-state" aria-label="Local storage state project" title={<>Keep a reading list</>} description={<>Connect app state to localStorage. Try adding, removing, and remounting the preview to see which data survives.</>} onClose={onClose}>

    <p className="storage-state-objective"><strong>Objective:</strong> Save every change and restore saved stories when the app opens. {saved.done ? '✓ All persistence cases passed.' : ''}</p>
    <div className="storage-state-grid bloom-columns"><div><h3>Choose storage behavior</h3>{STORAGE_CASES.map((item) => <label className="storage-state-rule" key={item.id}><input type="checkbox" checked={saved.rules[item.key]} onChange={(event) => update(item.key, event.target.checked)} /><span><strong>{item.title}</strong><small>{item.reason}</small></span></label>)}<button type="button" className="storage-state-check" onClick={run}>Check three cases</button><p role="status">{checked ? result.pass ? 'All three storage transitions are connected.' : 'Some transitions are missing. Check the paths below.' : 'Choose when state is written and restored.'}</p></div>
    <div><h3>Reading list preview</h3><div className="storage-state-preview"><form onSubmit={add}><label htmlFor="story-title">Story title</label><div><input id="story-title" value={draft} maxLength={80} onChange={(event) => setDraft(event.target.value)} placeholder="A story to read" /><button type="submit">Add</button></div></form><ul>{stories.map((story, at) => <li key={`${at}-${story}`}><span>{story}</span><button type="button" aria-label={`Remove ${story}`} onClick={() => remove(at)}>Remove</button></li>)}</ul>{stories.length === 0 && <p>No stories yet.</p>}<button type="button" onClick={remount}>Remount preview</button><p role="status">{feedback}</p></div></div></div>
    <svg viewBox="0 0 530 200" role="img" aria-label={`Storage routes: ${result.cases.map((item) => `${item.title} ${item.pass ? 'connected' : 'missing'}`).join(', ')}`}><g ref={lanes}>{result.cases.map((item, at) => { const y = 42 + at * 57; return <g key={item.id}><text x="8" y={y + 5}>{item.title}</text><path d={`M165 ${y} H415`} stroke={checked ? item.pass ? '#5ba78e' : '#d87864' : '#a8b8c0'} strokeWidth="5" /><circle cx="422" cy={y} r="11" fill={checked ? item.pass ? '#5ba78e' : '#d87864' : '#a8b8c0'} /><text x="444" y={y + 5}>{checked ? item.pass ? 'SAVED' : 'FIX' : 'TEST'}</text></g> })}</g></svg>
  </LearningExercise>
}
