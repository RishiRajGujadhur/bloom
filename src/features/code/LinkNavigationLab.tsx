import { LearningExercise } from './LearningExercise'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { RotateCcw } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { checkLinkNavigation, LINK_STARTER, navigationNodes } from './linkNavigationModel'
import './linkNavigationLab.css'

const DRAFT_KEY = 'bloom-link-navigation-draft-v1'
const DONE_KEY = 'bloom-link-navigation-done-v1'
const readDraft = () => { try { return localStorage.getItem(DRAFT_KEY) ?? LINK_STARTER } catch { return LINK_STARTER } }

export function LinkNavigationLab({ onClose }: { onClose: () => void }) {
  const [source, setSource] = useState(readDraft)
  const [checked, setChecked] = useState(false)
  const [done, setDone] = useState(() => { try { return localStorage.getItem(DONE_KEY) === 'true' && checkLinkNavigation(readDraft()).every((item) => item.pass) } catch { return false } })
  const [selected, setSelected] = useState('')
  const route = useRef<SVGGElement>(null)
  const checks = checkLinkNavigation(source)
  const nodes = navigationNodes(source)
  const passed = checks.filter((item) => item.pass).length
  useEffect(() => { try { localStorage.setItem(DRAFT_KEY, source) } catch { /* keep draft in memory */ } }, [source])
  useLayoutEffect(() => {
    if (!route.current || prefersReducedMotion()) return
    const tween = gsap.fromTo(route.current, { opacity: .25, scale: .96, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .35, ease: 'power2.out' })
    return () => { tween.progress(1).kill() }
  }, [source, checked])
  const change = (value: string) => {
    setSource(value); setChecked(false); setDone(false); setSelected('')
    try { localStorage.removeItem(DONE_KEY) } catch { /* continue editing */ }
  }
  const run = () => {
    setChecked(true)
    if (checks.every((item) => item.pass)) {
      setDone(true)
      try { localStorage.setItem(DONE_KEY, 'true') } catch { /* keep result in memory */ }
    }
  }
  return <LearningExercise className="link-lab" aria-label="Links and navigation mini project" title={<>Connect the studio</>} description={<>Visitors need clear routes through this tiny site. Edit the HTML, then test each link on the map.</>} onClose={onClose} backSizing="minimum">

    <p className="link-lab-objective"><strong>Mission:</strong> Repair the Gallery link so it reaches <code>#work</code>, name the Contact link clearly, and keep the navigation landmark and three sections.</p>
    <div className="link-lab-grid bloom-columns"><div><label htmlFor="link-lab-source">Studio HTML</label><textarea id="link-lab-source" spellCheck={false} value={source} onChange={(event) => change(event.target.value)} onKeyDown={(event) => { if (event.ctrlKey && event.key === 'Enter') { event.preventDefault(); run() } }} /><div className="link-lab-actions"><button type="button" onClick={run}>Check routes <kbd>Ctrl ↵</kbd></button><button type="button" onClick={() => change(LINK_STARTER)}><RotateCcw size={15} /> Reset</button></div></div><div><h3>Route map</h3><svg className="link-lab-map" viewBox="0 0 440 230" role="img" aria-label={`Route map: ${nodes.map((node) => `${node.text} to ${node.target}`).join(', ')}`}><g ref={route}>{nodes.slice(0, 3).map((node, index) => { const y = 48 + index * 72; return <g key={`${index}-${node.href}`}><path d={`M130 ${y} C210 ${y}, 210 ${y}, 290 ${y}`} stroke={node.valid ? '#3a9a8b' : '#dc7359'} strokeWidth="3" strokeDasharray={node.valid ? undefined : '6 5'} fill="none" /><circle cx="122" cy={y} r="8" fill="#6671b4" /><circle cx="298" cy={y} r="8" fill={node.valid ? '#3a9a8b' : '#dc7359'} /><text x="12" y={y + 5}>{node.text.slice(0, 17)}</text><text x="310" y={y + 5}>{node.target.slice(0, 15)}</text></g> })}</g></svg><div className="link-lab-routes" role="group" aria-label="Try navigation links">{nodes.map((node, index) => <button type="button" key={index} onClick={() => setSelected(node.valid ? `${node.text} opens ${node.target}.` : `${node.text} has no matching section.`)}>{node.text} →</button>)}</div><p role="status">{selected || (done ? 'All routes connect. Mini project complete!' : checked ? `${passed} of ${checks.length} checks pass.` : 'Choose a route to test it, or check your HTML.')}</p><ul className="link-lab-checks" aria-label="Navigation checks">{checks.map((item) => <li key={item.label}><strong>{checked ? item.pass ? '✓ ' : '○ ' : ''}{item.label}</strong>{checked && !item.pass && <span>{item.hint}</span>}</li>)}</ul></div></div>
  </LearningExercise>
}
