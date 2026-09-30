import { useEffect, useRef, useState } from 'react'
import './writingAssist.css'

/**
 * Writing assist (QoL 333–340): a small toolbar that follows whichever
 * multi-line text box you're writing in, anywhere in Bloom.
 * - Live word count and reading time
 * - Writing streak (days with 50+ words written)
 * - Ctrl+Shift+D inserts today's date and time; Ctrl+B / Ctrl+I wrap **bold** / _italic_
 * - Focus mode: dims everything else (Esc leaves)
 * - Typewriter scrolling keeps the caret mid-screen
 * - Dictation via the browser's speech recognition, where available
 * - A shuffle button that drops in a fresh writing prompt
 */
const PROMPTS = ['What surprised you today?', 'What are you looking forward to?', 'Something small that went well…', 'What would make tomorrow easier?', 'Who made you smile recently?', 'What are you carrying that you could put down?', 'Describe this moment using three senses.', 'What did you learn about yourself this week?']
const STREAK_KEY = 'bloom-writing-days'
type SR = { start: () => void; stop: () => void; continuous: boolean; interimResults: boolean; lang: string; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>; resultIndex: number }) => void; onend: () => void }

const today = () => new Date().toISOString().slice(0, 10)
const readDays = (): Record<string, number> => { try { return JSON.parse(localStorage.getItem(STREAK_KEY) ?? '{}') } catch { return {} } }
const streakOf = (days: Record<string, number>) => {
  let n = 0; const d = new Date()
  if ((days[today()] ?? 0) < 50) d.setDate(d.getDate() - 1)
  while ((days[d.toISOString().slice(0, 10)] ?? 0) >= 50) { n++; d.setDate(d.getDate() - 1) }
  return n
}
// Set a textarea's value in a way React notices.
const setValue = (el: HTMLTextAreaElement, v: string, caret: number) => {
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(el, v)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.setSelectionRange(caret, caret)
}
const insert = (el: HTMLTextAreaElement, text: string) => {
  const a = el.selectionStart, b = el.selectionEnd
  setValue(el, el.value.slice(0, a) + text + el.value.slice(b), a + text.length)
}

export function WritingAssist() {
  const [el, setEl] = useState<HTMLTextAreaElement | null>(null)
  const [words, setWords] = useState(0)
  const [streak, setStreak] = useState(() => streakOf(readDays()))
  const [focus, setFocus] = useState(false)
  const [listening, setListening] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const rec = useRef<SR | null>(null)
  const base = useRef(new WeakMap<HTMLTextAreaElement, number>())

  useEffect(() => {
    const onFocus = (e: FocusEvent) => {
      const t = e.target
      if (t instanceof HTMLTextAreaElement && t.closest('main')) { setEl(t); if (!base.current.has(t)) base.current.set(t, count(t.value)) }
    }
    const onBlur = (e: FocusEvent) => { if (e.relatedTarget instanceof HTMLElement && e.relatedTarget.closest('.wa-bar')) return; setTimeout(() => { if (!(document.activeElement instanceof HTMLTextAreaElement) && !document.activeElement?.closest('.wa-bar')) setEl(null) }, 150) }
    document.addEventListener('focusin', onFocus); document.addEventListener('focusout', onBlur)
    return () => { document.removeEventListener('focusin', onFocus); document.removeEventListener('focusout', onBlur) }
  }, [])
  const count = (v: string) => (v.trim() ? v.trim().split(/\s+/).length : 0)

  useEffect(() => {
    if (!el) { setFocus(false); return }
    const place = () => { const r = el.getBoundingClientRect(); setPos({ x: r.left, y: Math.max(8, r.top - 44) }) }
    const onInput = () => {
      const n = count(el.value); setWords(n)
      const added = Math.max(0, n - (base.current.get(el) ?? n))
      if (added) { const d = readDays(); d[today()] = Math.max(d[today()] ?? 0, added); try { localStorage.setItem(STREAK_KEY, JSON.stringify(d)) } catch { /* optional */ } setStreak(streakOf(d)) }
      // Typewriter scrolling: keep the caret line near the middle of the viewport.
      if (el.scrollHeight > el.clientHeight || document.documentElement.scrollHeight > innerHeight) {
        const lines = el.value.slice(0, el.selectionStart).split('\n').length
        const lh = parseFloat(getComputedStyle(el).lineHeight) || 22
        const caretY = el.getBoundingClientRect().top + Math.min(el.clientHeight, lines * lh - el.scrollTop)
        if (Math.abs(caretY - innerHeight / 2) > innerHeight * 0.2) window.scrollBy({ top: caretY - innerHeight / 2, behavior: 'smooth' })
      }
      place()
    }
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') { e.preventDefault(); insert(el, new Date().toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' — ') }
      else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'b' || e.key === 'i')) {
        e.preventDefault()
        const m = e.key === 'b' ? '**' : '_'
        const a = el.selectionStart, b = el.selectionEnd
        setValue(el, el.value.slice(0, a) + m + el.value.slice(a, b) + m + el.value.slice(b), b + m.length * 2)
      } else if (e.key === 'Escape' && focus) setFocus(false)
    }
    onInput(); place()
    el.addEventListener('input', onInput); el.addEventListener('keydown', onKey)
    window.addEventListener('scroll', place, true); window.addEventListener('resize', place)
    return () => { el.removeEventListener('input', onInput); el.removeEventListener('keydown', onKey); window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place) }
  }, [el, focus])

  useEffect(() => {
    document.body.classList.toggle('wa-focus', focus)
    el?.classList.toggle('wa-focus-target', focus)
    return () => { document.body.classList.remove('wa-focus'); el?.classList.remove('wa-focus-target') }
  }, [focus, el])

  const dictate = () => {
    if (!el) return
    if (listening) { rec.current?.stop(); return }
    const Ctor = (window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => SR }).webkitSpeechRecognition
    if (!Ctor) return
    const r = new Ctor(); r.continuous = true; r.interimResults = false; r.lang = navigator.language
    r.onresult = (e) => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) insert(el, e.results[i][0].transcript.trim() + ' ') }
    r.onend = () => setListening(false)
    rec.current = r; r.start(); setListening(true); el.focus()
  }
  if (!el) return null
  const canDictate = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  return (
    <div className="wa-bar" style={{ left: pos.x, top: pos.y }} onMouseDown={(e) => e.preventDefault()}>
      <span title="Words and reading time">{words} words · {Math.max(1, Math.round(words / 200))} min read</span>
      {streak > 0 && <span title="Days in a row with 50+ words">✍️ {streak}-day streak</span>}
      <button type="button" title="Insert a writing prompt" onClick={() => insert(el, (el.value && !el.value.endsWith('\n') ? '\n\n' : '') + PROMPTS[Math.floor(Math.random() * PROMPTS.length)] + '\n')}>🎲 Prompt</button>
      <button type="button" title="Insert date and time (Ctrl+Shift+D)" onClick={() => insert(el, new Date().toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' — ')}>🕒</button>
      {canDictate && <button type="button" className={listening ? 'on' : ''} title="Dictate" onClick={dictate}>{listening ? '⏺ Listening' : '🎙️'}</button>}
      <button type="button" className={focus ? 'on' : ''} title="Focus mode (Esc to leave)" onClick={() => { setFocus(!focus); el.focus() }}>{focus ? '◉ Focus' : '◎ Focus'}</button>
    </div>
  )
}
