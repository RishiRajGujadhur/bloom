import { useEffect, useState } from 'react'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { checkHeadingHierarchy, HEADING_STARTER } from './headingRepairModel'
import './headingRepair.css'

const DRAFT_KEY = 'bloom-heading-repair-draft-v1'
const DONE_KEY = 'bloom-heading-repair-done-v1'
const readDraft = () => { try { return localStorage.getItem(DRAFT_KEY) ?? HEADING_STARTER } catch { return HEADING_STARTER } }

export function HeadingRepair({ onClose }: { onClose: () => void }) {
  const [source, setSource] = useState(readDraft)
  const [checked, setChecked] = useState(false)
  const [done, setDone] = useState(() => { try { return localStorage.getItem(DONE_KEY) === 'true' && checkHeadingHierarchy(readDraft()).every((item) => item.pass) } catch { return false } })
  const checks = checkHeadingHierarchy(source)
  const passed = checks.filter((item) => item.pass).length
  useEffect(() => { try { localStorage.setItem(DRAFT_KEY, source) } catch { /* keep draft in memory */ } }, [source])
  const run = () => {
    setChecked(true)
    if (checks.every((item) => item.pass)) {
      setDone(true)
      try { localStorage.setItem(DONE_KEY, 'true') } catch { /* keep result in memory */ }
    }
  }
  const change = (value: string) => {
    setSource(value)
    setChecked(false)
    setDone(false)
    try { localStorage.removeItem(DONE_KEY) } catch { /* continue editing */ }
  }
  return <section className="heading-repair" aria-label="Heading hierarchy repair challenge">
    <header><button type="button" onClick={onClose} aria-label="Back to learning path"><ArrowLeft size={18} /></button><div><h2>Repair the heading hierarchy</h2><p>Headings form an outline. Start with the page title, then move one level deeper for each nested section. You can return to a higher level for a new section.</p></div></header>
    <p className="heading-repair-objective"><strong>Objective:</strong> Fix the heading tags while keeping all six titles and their order. Edit the HTML, then check your outline.</p>
    <div className="heading-repair-grid"><div><label htmlFor="heading-repair-source">Editable HTML</label><textarea id="heading-repair-source" spellCheck={false} value={source} onChange={(event) => change(event.target.value)} onKeyDown={(event) => { if (event.ctrlKey && event.key === 'Enter') { event.preventDefault(); run() } }} /><div className="heading-repair-actions"><button type="button" onClick={run}>Check outline <kbd>Ctrl ↵</kbd></button><button type="button" onClick={() => change(HEADING_STARTER)}><RotateCcw size={15} /> Reset</button></div></div><div><h3>Document outline</h3><ol className="heading-repair-outline">{Array.from(new DOMParser().parseFromString(source, 'text/html').body.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((heading, index) => <li key={index} style={{ marginInlineStart: `${(Number(heading.tagName.slice(1)) - 1) * .8}rem` }}><code>{heading.tagName.toLowerCase()}</code> {heading.textContent?.trim() || '(empty heading)'}</li>)}</ol><p role="status">{done ? 'Outline repaired. All five checks pass.' : checked ? `${passed} of 5 checks pass. Review the feedback below.` : 'Edit the HTML, then check your outline.'}</p><ul className="heading-repair-checks" aria-label="Heading checks">{checks.map((item) => <li key={item.label}><strong>{checked ? item.pass ? '✓ ' : '○ ' : ''}{item.label}</strong>{checked && !item.pass && <span>{item.hint}</span>}</li>)}</ul></div></div>
  </section>
}
