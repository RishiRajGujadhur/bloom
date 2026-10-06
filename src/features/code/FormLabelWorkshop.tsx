import { LearningExercise } from './LearningExercise'
import { useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { checkFormLabels, FORM_STARTER } from './formLabelModel'
import './headingRepair.css'

const DRAFT_KEY = 'bloom-form-label-draft-v1'
const DONE_KEY = 'bloom-form-label-done-v1'
const readDraft = () => { try { return localStorage.getItem(DRAFT_KEY) ?? FORM_STARTER } catch { return FORM_STARTER } }

export function FormLabelWorkshop({ onClose }: { onClose: () => void }) {
  const [source, setSource] = useState(readDraft)
  const [checked, setChecked] = useState(false)
  const [done, setDone] = useState(() => { try { return localStorage.getItem(DONE_KEY) === 'true' && checkFormLabels(readDraft()).every((item) => item.pass) } catch { return false } })
  const checks = checkFormLabels(source)
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
    setSource(value); setChecked(false); setDone(false)
    try { localStorage.removeItem(DONE_KEY) } catch { /* continue editing */ }
  }
  const doc = new DOMParser().parseFromString(source, 'text/html')
  const fields = Array.from(doc.querySelectorAll('input,select,textarea'))
  return <LearningExercise className="heading-repair" aria-label="Accessible form labeling workshop" title={<>Connect form labels</>} description={<>A label tells people what to enter and gives screen readers a name for each field. Its <code>for</code> value should match the field’s <code>id</code>.</>} onClose={onClose} backSizing="minimum">

    <p className="heading-repair-objective"><strong>Objective:</strong> Repair the name and email labels. Keep all three fields, then check their connections.</p>
    <div className="heading-repair-grid bloom-columns"><div><label htmlFor="form-label-source">Editable HTML</label><textarea id="form-label-source" spellCheck={false} value={source} onChange={(event) => change(event.target.value)} onKeyDown={(event) => { if (event.ctrlKey && event.key === 'Enter') { event.preventDefault(); run() } }} /><div className="heading-repair-actions"><button type="button" onClick={run}>Check labels <kbd>Ctrl ↵</kbd></button><button type="button" onClick={() => change(FORM_STARTER)}><RotateCcw size={15} /> Reset</button></div></div><div><h3>Field names a screen reader finds</h3><ul className="heading-repair-checks">{fields.map((field, index) => { const label = Array.from(doc.querySelectorAll('label')).find((item) => item.htmlFor === field.id && !!field.id || item.contains(field)); return <li key={index}><strong>{field.tagName.toLowerCase()}#{field.id || '(no id)'}</strong><span>{label?.textContent?.trim() || 'No connected label'}</span></li> })}</ul><p role="status">{done ? 'All three fields have connected labels. Workshop complete.' : checked ? `${passed} of 5 checks pass. Review the feedback below.` : 'Edit the labels, then check your work.'}</p><ul className="heading-repair-checks" aria-label="Form label checks">{checks.map((item) => <li key={item.label}><strong>{checked ? item.pass ? '✓ ' : '○ ' : ''}{item.label}</strong>{checked && !item.pass && <span>{item.hint}</span>}</li>)}</ul></div></div>
  </LearningExercise>
}
