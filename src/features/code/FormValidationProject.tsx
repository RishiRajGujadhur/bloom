import { LearningExercise } from './LearningExercise'
import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'

import { prefersReducedMotion } from '../../utils/motion'
import { checkValidationRules, STARTER_RULES, validateForm, type FormValues, type Rules } from './formValidationModel'
import './formValidationProject.css'

const KEY = 'bloom-form-validation-v1'
const empty: FormValues = { name: '', email: '', password: '' }
function readSaved(): { rules: Rules; done: boolean } {
  try { const value = JSON.parse(localStorage.getItem(KEY) ?? 'null'); if (value?.rules?.name && value?.rules?.email && value?.rules?.password) return value } catch { /* use starter */ }
  return { rules: STARTER_RULES, done: false }
}

export function FormValidationProject({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(readSaved)
  const [values, setValues] = useState<FormValues>(empty)
  const [attempted, setAttempted] = useState(false)
  const [checked, setChecked] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const paths = useRef<SVGGElement>(null)
  const check = checkValidationRules(saved.rules)
  const errors = attempted ? validateForm(values, saved.rules) : {}
  const fields = ['name', 'email', 'password'] as const

  useLayoutEffect(() => {
    if (!paths.current || prefersReducedMotion()) return
    const tween = gsap.fromTo(paths.current.children, { opacity: .25, y: -6 }, { opacity: 1, y: 0, duration: .3, stagger: .07 })
    return () => { tween.progress(1).kill() }
  }, [checked, saved.rules])
  const persist = (next: { rules: Rules; done: boolean }) => { setSaved(next); try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* retain session state */ } }
  const update = (key: keyof Rules, patch: Partial<Rules[typeof key]>) => {
    persist({ rules: { ...saved.rules, [key]: { ...saved.rules[key], ...patch } }, done: false })
    setChecked(false); setSubmitted(false)
  }
  const run = () => { setChecked(true); if (check.pass) persist({ ...saved, done: true }) }
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setAttempted(true)
    setSubmitted(Object.keys(validateForm(values, saved.rules)).length === 0)
  }

  return <LearningExercise className="form-validation-project" aria-label="Form validation project" title={<>Make a signup form reliable</>} description={<>Set validation rules, try the form, then run seven cases. A good form catches missing and malformed values before accepting a signup.</>} onClose={onClose}>

    <p className="form-validation-objective"><strong>Objective:</strong> Require a name of at least two characters, a valid email, and a password of at least eight characters. {saved.done ? '✓ All cases passed.' : ''}</p>
    <div className="form-validation-grid bloom-columns"><div><h3>Validation rules</h3>{fields.map((key) => <fieldset key={key}><legend>{key[0].toUpperCase() + key.slice(1)}</legend><label><input type="checkbox" checked={saved.rules[key].required} onChange={(event) => update(key, { required: event.target.checked })} /> Required</label><label>Format<select value={saved.rules[key].format} onChange={(event) => update(key, { format: event.target.value as 'text' | 'email' })}><option value="text">Any text</option><option value="email">Email address</option></select></label><label>Minimum characters<input type="number" min="0" max="30" value={saved.rules[key].minLength} onChange={(event) => update(key, { minLength: Math.max(0, Math.min(30, Number(event.target.value) || 0)) })} /></label></fieldset>)}</div>
    <div><h3>Try your form</h3><form noValidate onSubmit={submit}>{fields.map((key) => <label key={key}>{key[0].toUpperCase() + key.slice(1)}<input type={key === 'password' ? 'password' : 'text'} value={values[key]} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined} onChange={(event) => { setValues({ ...values, [key]: event.target.value }); setSubmitted(false) }} />{errors[key] && <small id={`${key}-error`}>{errors[key]}</small>}</label>)}<button type="submit">Submit signup</button><p role="status">{submitted ? 'Signup accepted by your current rules.' : attempted && Object.keys(errors).length ? 'Fix the highlighted fields and try again.' : 'Fill the form to test your rules.'}</p></form></div></div>
    <button type="button" className="form-validation-run" onClick={run}>Run seven cases</button>
    <p role="status">{checked ? check.pass ? 'All seven cases pass. Your validation protects the signup.' : 'Some cases fail. Adjust the rules and run them again.' : 'Run cases to check empty, short, malformed, and valid input.'}</p>
    <svg viewBox="0 0 510 318" role="img" aria-label={`Validation case paths: ${check.results.map((item) => `${item.label} ${item.pass ? 'pass' : 'needs work'}`).join(', ')}`}><g ref={paths}>{check.results.map((item, at) => { const y = 25 + at * 44; return <g key={item.label}><text x="5" y={y + 5}>{item.label}</text><path d={`M145 ${y} H395`} stroke={checked ? item.pass ? '#4da785' : '#d77b64' : '#a7b4c2'} strokeWidth="4" /><circle cx="400" cy={y} r="10" fill={checked ? item.pass ? '#4da785' : '#d77b64' : '#a7b4c2'} /><text x="420" y={y + 5}>{checked ? item.pass ? 'PASS' : 'FIX' : 'TEST'}</text></g> })}</g></svg>
    {checked && <ul aria-label="Case feedback">{check.results.map((item) => <li key={item.label}>{item.label}: {item.pass ? 'correct' : `expected ${item.expected ?? 'accepted'}, got ${item.actual ?? 'accepted'}`}</li>)}</ul>}
  </LearningExercise>
}
