import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { checkScopeScene, SCOPE_SCENES } from './scopeStoryModel'
import './scopeStory.css'

const STORAGE_KEY = 'bloom-scope-story-done-v1'
const readDone = (): Record<string, boolean> => {
  try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {} } catch { return {} }
}

export function ScopeStory({ onClose }: { onClose: () => void }) {
  const [done, setDone] = useState(readDone)
  const [index, setIndex] = useState(0)
  const [choice, setChoice] = useState<string | null>(null)
  const [focus, setFocus] = useState<'outer' | 'inner'>('outer')
  const outerRing = useRef<SVGCircleElement>(null)
  const innerRing = useRef<SVGCircleElement>(null)
  const scene = SCOPE_SCENES[index]
  const result = choice === null ? null : checkScopeScene(scene, choice)
  const count = SCOPE_SCENES.filter((item) => done[item.id]).length

  useLayoutEffect(() => {
    const active = focus === 'outer' ? outerRing.current : innerRing.current
    const inactive = focus === 'outer' ? innerRing.current : outerRing.current
    if (!active || !inactive) return
    if (prefersReducedMotion()) { gsap.set(active, { strokeWidth: 6, opacity: 1 }); gsap.set(inactive, { strokeWidth: 2, opacity: .5 }); return }
    const one = gsap.to(active, { strokeWidth: 6, opacity: 1, duration: .3 })
    const two = gsap.to(inactive, { strokeWidth: 2, opacity: .5, duration: .3 })
    return () => { one.kill(); two.kill() }
  }, [focus, index])

  const pick = (value: string) => {
    setChoice(value)
    if (checkScopeScene(scene, value).correct && !done[scene.id]) {
      const next = { ...done, [scene.id]: true }; setDone(next)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* keep in memory */ }
    }
  }
  const chooseScene = (next: number) => { setIndex(next); setChoice(null); setFocus('outer') }
  return <section className="scope-story" aria-label="Variables and scope story level">
    <header><button type="button" onClick={onClose} aria-label="Back to learning path"><ArrowLeft size={18} /></button><div><h2>Mira’s garden: variables and scope</h2><p>Follow Mira through four scenes. Use the scope map to predict what each line of JavaScript does.</p></div></header>
    <div className="scope-story-scenes" role="group" aria-label="Scope story scenes">{SCOPE_SCENES.map((item, sceneIndex) => <button type="button" key={item.id} aria-pressed={index === sceneIndex} onClick={() => chooseScene(sceneIndex)}>{done[item.id] ? '✓ ' : ''}{sceneIndex + 1}. {item.title}</button>)}</div>
    <p className="scope-story-objective"><strong>Objective:</strong> Predict the result by deciding which variable binding the code can see. {scene.story}</p>
    <div className="scope-story-grid"><div><h3>{scene.title}</h3><pre>{scene.code}</pre><p><strong>{scene.question}</strong></p><div className="scope-story-choices" role="group" aria-label="Choose the result">{scene.choices.map((item) => <button key={item} type="button" aria-pressed={choice === item} onClick={() => pick(item)}>{item}</button>)}</div><p role="status">{result ? result.correct ? `Correct. ${result.explanation}` : `${choice} is not the result. ${result.explanation}` : `${count} of ${SCOPE_SCENES.length} scenes solved.`}</p>{index + 1 < SCOPE_SCENES.length && <button type="button" className="scope-story-next" onClick={() => chooseScene(index + 1)}>Next scene <ChevronRight size={15} /></button>}</div><div><div className="scope-story-focus" role="group" aria-label="Inspect a scope"><button type="button" aria-pressed={focus === 'outer'} onClick={() => setFocus('outer')}>Garden scope</button><button type="button" aria-pressed={focus === 'inner'} onClick={() => setFocus('inner')}>Plot scope</button></div><svg viewBox="0 0 460 300" className="scope-story-svg" role="img" aria-label={`Garden scope has ${scene.outer.map((item) => `${item.name} ${item.value}`).join(', ') || 'no local variables'}; plot scope has ${scene.inner.map((item) => `${item.name} ${item.value}`).join(', ') || 'no new variables'}`}><rect x="1" y="1" width="458" height="298" rx="16" className="scope-story-bg" /><circle ref={outerRing} cx="230" cy="155" r="132" className="scope-story-outer" /><circle ref={innerRing} cx="230" cy="165" r="72" className="scope-story-inner" /><text x="230" y="48" textAnchor="middle" className="scope-story-label">GARDEN SCOPE</text><text x="230" y="130" textAnchor="middle" className="scope-story-label">PLOT SCOPE</text>{scene.outer.map((item, tokenIndex) => <g key={item.name} transform={`translate(${88 + tokenIndex * 86} 72)`}><rect width="100" height="32" rx="9" className="scope-story-token" /><text x="50" y="21" textAnchor="middle">{item.name} = {item.value}</text></g>)}{scene.inner.map((item, tokenIndex) => <g key={item.name} transform={`translate(${181 + tokenIndex * 80} 178)`}><rect width="100" height="32" rx="9" className="scope-story-token-inner" /><text x="50" y="21" textAnchor="middle">{item.name} = {item.value}</text></g>)}</svg><p className="scope-story-note">{scene.scopeNote} Select a scope to highlight it.</p></div></div>{count === SCOPE_SCENES.length && <p className="scope-story-complete">All four scenes solved. You can revisit each scope map.</p>}
  </section>
}
