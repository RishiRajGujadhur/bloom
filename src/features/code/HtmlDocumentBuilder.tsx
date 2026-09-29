import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowLeft, Code2, Play, RotateCcw } from 'lucide-react'
import { burst } from '../../components/ui/celebrate'
import { prefersReducedMotion } from '../../utils/motion'
import { checkHtmlDocument, HTML_STARTER, previewHtml, type HtmlCheck } from './htmlBuilderModel'
import './htmlDocumentBuilder.css'

const DRAFT_KEY = 'bloom-html-builder-draft-v1'
const DONE_KEY = 'bloom-html-builder-done-v1'
const ARC = 214

function readDraft() {
  try { return localStorage.getItem(DRAFT_KEY) ?? HTML_STARTER } catch { return HTML_STARTER }
}

function readDone() {
  try { return localStorage.getItem(DONE_KEY) === 'true' && checkHtmlDocument(readDraft()).every((item) => item.pass) } catch { return false }
}

export function HtmlDocumentBuilder({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [source, setSource] = useState(readDraft)
  const [preview, setPreview] = useState(() => previewHtml(readDraft()))
  const [checks, setChecks] = useState<HtmlCheck[] | null>(() => readDone() ? checkHtmlDocument(readDraft()) : null)
  const [done, setDone] = useState(readDone)
  const arc = useRef<SVGCircleElement>(null)
  const result = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPreview(previewHtml(source))
      try { localStorage.setItem(DRAFT_KEY, source) } catch { /* editing still works for this visit */ }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [source])

  useLayoutEffect(() => {
    if (!arc.current) return
    const passed = checks?.filter((item) => item.pass).length ?? 0
    const offset = ARC * (1 - passed / 5)
    if (prefersReducedMotion()) { arc.current.setAttribute('stroke-dashoffset', String(offset)); return }
    const tween = gsap.to(arc.current, { strokeDashoffset: offset, duration: .5, ease: 'power2.out' })
    return () => { tween.kill() }
  }, [checks])

  const run = () => {
    const next = checkHtmlDocument(source)
    setChecks(next)
    if (next.every((item) => item.pass)) {
      setDone(true)
      try { localStorage.setItem(DONE_KEY, 'true') } catch { /* progress remains visible this visit */ }
      onComplete()
      if (!done) burst(result.current ?? undefined, 'stars')
    }
  }

  const reset = () => { setSource(HTML_STARTER); setChecks(null); setDone(false); try { localStorage.removeItem(DONE_KEY) } catch { /* reset this visit */ } }

  return <section className="html-builder" aria-label="HTML document builder">
    <header className="html-builder-head"><button type="button" aria-label="Back to learning path" title="Back to learning path" onClick={onClose}><ArrowLeft size={18} /></button><Code2 size={24} aria-hidden="true" /><h2 className="sr-only">HTML document builder</h2><p>Build a profile page with clear regions, a heading, and a labeled input.</p><div className="html-builder-meter"><svg viewBox="0 0 80 80" role="img" aria-label={`${checks?.filter((item) => item.pass).length ?? 0} of 5 checks passed`}><circle cx="40" cy="40" r="34" className="html-builder-track" /><circle ref={arc} cx="40" cy="40" r="34" className="html-builder-arc" strokeDasharray={ARC} strokeDashoffset={ARC} /></svg><span>{checks?.filter((item) => item.pass).length ?? 0}/5</span></div></header>
    <div className="html-builder-grid"><div className="html-builder-edit"><label htmlFor="html-builder-source">Your HTML</label><textarea id="html-builder-source" spellCheck={false} value={source} onChange={(event) => { setSource(event.target.value); setChecks(null); if (done) { setDone(false); try { localStorage.removeItem(DONE_KEY) } catch { /* continue editing */ } } }} onKeyDown={(event) => { if (event.ctrlKey && event.key === 'Enter') { event.preventDefault(); run() } }} /><div className="html-builder-actions"><button type="button" onClick={run}><Play size={16} /> Check page <kbd>Ctrl ↵</kbd></button><button type="button" onClick={reset}><RotateCcw size={15} /> Reset</button>{done && <strong>Page built ✓</strong>}</div></div><div className="html-builder-side"><div className="html-builder-preview-head"><strong>Live preview</strong><small>Scripts and external resources are blocked.</small></div><iframe title="Live HTML preview" sandbox="" srcDoc={preview} /><ul ref={result} className="html-builder-checks" aria-label="Document checks">{(checks ?? checkHtmlDocument(source)).map((item) => <li key={item.id} data-pass={item.pass}><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" /><path d={item.pass ? 'M5.5 10.5 L8.5 13 L14.5 6.5' : 'M6 10 H14'} /></svg><span><strong>{item.label}</strong>{checks && !item.pass && <small>{item.hint}</small>}</span></li>)}</ul></div></div>
  </section>
}
