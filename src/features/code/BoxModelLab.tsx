import { LearningExercise } from './LearningExercise'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { RotateCcw } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { BOX_START, BOX_TARGET, checkBoxModel, measureBox, type BoxSettings } from './boxModelModel'
import './boxModelLab.css'

const DRAFT_KEY = 'bloom-box-model-draft-v1'
const DONE_KEY = 'bloom-box-model-done-v1'
const readSettings = (): BoxSettings => {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null')
    if (saved && [saved.width, saved.height, saved.padding, saved.border, saved.margin].every((value) => Number.isFinite(value)) && ['content-box', 'border-box'].includes(saved.sizing)) return saved
  } catch { /* use defaults */ }
  return BOX_START
}

export function BoxModelLab({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState(readSettings)
  const [checked, setChecked] = useState(false)
  const [done, setDone] = useState(() => { try { return localStorage.getItem(DONE_KEY) === 'true' && checkBoxModel(readSettings()).every((item) => item.pass) } catch { return false } })
  const diagram = useRef<SVGGElement>(null)
  const size = measureBox(settings)
  const checks = checkBoxModel(settings)
  const passed = checks.filter((item) => item.pass).length
  useEffect(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(settings)) } catch { /* keep settings in memory */ } }, [settings])
  useLayoutEffect(() => {
    if (!diagram.current || prefersReducedMotion()) return
    const tween = gsap.fromTo(diagram.current, { opacity: .65, scale: .97, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .24, ease: 'power2.out' })
    return () => { tween.progress(1).kill() }
  }, [settings])
  const update = (patch: Partial<BoxSettings>) => {
    setSettings((current) => ({ ...current, ...patch })); setChecked(false); setDone(false)
    try { localStorage.removeItem(DONE_KEY) } catch { /* continue */ }
  }
  const run = () => {
    setChecked(true)
    if (checks.every((item) => item.pass)) { setDone(true); try { localStorage.setItem(DONE_KEY, 'true') } catch { /* keep in memory */ } }
  }
  const canvas = { x: 260 - size.outerWidth / 2, y: 190 - size.outerHeight / 2 }
  const border = { x: canvas.x + settings.margin, y: canvas.y + settings.margin }
  const padding = { x: border.x + settings.border, y: border.y + settings.border }
  const content = { x: padding.x + settings.padding, y: padding.y + settings.padding }
  const sliders: { key: 'width' | 'height' | 'padding' | 'border' | 'margin'; name: string; min: number; max: number; step: number }[] = [
    { key: 'width', name: 'Width', min: 100, max: 300, step: 2 }, { key: 'height', name: 'Height', min: 60, max: 180, step: 2 },
    { key: 'padding', name: 'Padding', min: 0, max: 40, step: 2 }, { key: 'border', name: 'Border', min: 0, max: 20, step: 2 }, { key: 'margin', name: 'Margin', min: 0, max: 40, step: 2 },
  ]
  return <LearningExercise className="box-lab" aria-label="Box model SVG manipulator" title={<>Shape the box model</>} description={<>Drag the controls or use arrow keys. The SVG shows content, padding, border, and margin as nested regions.</>} onClose={onClose}>

    <p className="box-lab-objective"><strong>Objective:</strong> Make the content {BOX_TARGET.contentWidth} × {BOX_TARGET.contentHeight} px, the border box {BOX_TARGET.borderWidth} × {BOX_TARGET.borderHeight} px, and the full footprint {BOX_TARGET.outerWidth} × {BOX_TARGET.outerHeight} px.</p>
    <div className="box-lab-grid"><div className="box-lab-controls"><fieldset><legend>Sizing rule</legend><label><input type="radio" name="box-sizing" value="content-box" checked={settings.sizing === 'content-box'} onChange={() => update({ sizing: 'content-box' })} /> Content box</label><label><input type="radio" name="box-sizing" value="border-box" checked={settings.sizing === 'border-box'} onChange={() => update({ sizing: 'border-box' })} /> Border box</label></fieldset>{sliders.map((item) => <label key={item.key} className="box-lab-slider"><span>{item.name} <strong>{settings[item.key]} px</strong></span><input type="range" min={item.min} max={item.max} step={item.step} value={settings[item.key]} onChange={(event) => update({ [item.key]: Number(event.target.value) })} /></label>)}<div className="box-lab-actions bloom-wrap"><button type="button" onClick={run}>Check dimensions</button><button type="button" onClick={() => update(BOX_START)}><RotateCcw size={15} /> Reset</button></div></div><div className="box-lab-visual"><svg viewBox="0 0 520 380" role="img" aria-label={`Box model: content ${size.contentWidth} by ${size.contentHeight}, border box ${size.borderWidth} by ${size.borderHeight}, total footprint ${size.outerWidth} by ${size.outerHeight} pixels`}><rect x="1" y="1" width="518" height="378" rx="18" className="box-lab-canvas" /><g ref={diagram}><rect x={canvas.x} y={canvas.y} width={size.outerWidth} height={size.outerHeight} className="box-lab-margin" /><rect x={border.x} y={border.y} width={size.borderWidth} height={size.borderHeight} className="box-lab-border" /><rect x={padding.x} y={padding.y} width={size.borderWidth - 2 * settings.border} height={size.borderHeight - 2 * settings.border} className="box-lab-padding" /><rect x={content.x} y={content.y} width={size.contentWidth} height={size.contentHeight} className="box-lab-content" /><text x="260" y="190" textAnchor="middle" dominantBaseline="middle" className="box-lab-center">CONTENT</text></g><text x="18" y="28" className="box-lab-caption">MARGIN</text><text x="18" y="354" className="box-lab-caption">border → padding → content</text></svg><dl><div><dt>Content</dt><dd>{size.contentWidth} × {size.contentHeight}</dd></div><div><dt>Border box</dt><dd>{size.borderWidth} × {size.borderHeight}</dd></div><div><dt>Footprint</dt><dd>{size.outerWidth} × {size.outerHeight}</dd></div></dl></div></div><p role="status">{done ? 'Target dimensions reached. Box model complete!' : checked ? `${passed} of 3 dimensions match.` : 'Adjust the controls, then check your dimensions.'}</p><ul className="box-lab-checks" aria-label="Dimension checks">{checks.map((item) => <li key={item.label}><strong>{checked ? item.pass ? '✓ ' : '○ ' : ''}{item.label}</strong>{checked && !item.pass && <span>{item.hint}</span>}</li>)}</ul>
  </LearningExercise>
}
