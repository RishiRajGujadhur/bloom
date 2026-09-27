import { useState } from 'react'
import { MousePointer2, MousePointerClick } from 'lucide-react'
import { Slider, Studio, StudioScene } from '../../components/studio/Studio'
import { usePageActions } from '../../components/ui/PageMenu'
import {
  cursorCss,
  defaultPointer,
  effectNames,
  pageEffects,
  readPointer,
  savePointer,
  shapeNames,
  type Effect,
  type PointerPrefs,
  type Shape,
} from '../../components/ui/PointerFx'
import { subOn } from '../subFeatures'

const colours = ['#e0703f', '#3f7fd0', '#3f8a5a', '#8f7ae5', '#d64545', '#f0a500', '#212121']
const emojis = ['🌸', '✨', '🌱', '💎', '⭐', '🫧', '🍀', '🔥']

export function PointerPage() {
  const [p, setP] = useState<PointerPrefs>(readPointer)
  const set = (patch: Partial<PointerPrefs>) => {
    const next = { ...p, ...patch }
    setP(next)
    savePointer(next)
  }
  usePageActions([
    { id: 'pointer-reset', label: 'Reset my pointer', icon: '↺', run: () => set(defaultPointer) },
    { id: 'pointer-big', label: p.size > 1.4 ? 'Normal-size pointer' : 'Big pointer', icon: '🔍', run: () => set({ size: p.size > 1.4 ? 1 : 2, shape: p.shape === 'system' ? 'arrow' : p.shape }) },
  ])
  const style = () => (
    <div className="pt-grid">
      {subOn('pointerFx', 'shapes') && (
        <section className="studio-card">
          <h3>Pointer shape</h3>
          <div className="pt-options" role="group" aria-label="Pointer shape">
            {(Object.keys(shapeNames) as Shape[]).map((s) => (
              <button key={s} type="button" className="pt-option" aria-pressed={p.shape === s} onClick={() => set({ shape: s })}>
                <span className="pt-swatch" style={{ cursor: cursorCss(s, p.color, p.size) || 'auto' }}>
                  {s === 'system' ? <MousePointer2 size={22} /> : <img alt="" src={cursorCss(s, p.color, 1.6).match(/url\("(.*)"\)/)?.[1]} />}
                </span>
                {shapeNames[s]}
              </button>
            ))}
          </div>
          <Slider label="Size" min={1} max={subOn('pointerFx', 'bigPointer') ? 2.5 : 1.5} step={0.25} value={p.size} onChange={(v) => set({ size: v })} format={(v) => `${Math.round(v * 24)} px`} />
          <div className="studio-chip-row" role="group" aria-label="Colour">
            {colours.map((c) => (
              <button key={c} type="button" className="pt-colour" aria-label={`Colour ${c}`} aria-pressed={p.color === c} style={{ background: c }} onClick={() => set({ color: c })} />
            ))}
          </div>
        </section>
      )}
      {subOn('pointerFx', 'effects') && (
        <section className="studio-card">
          <h3>Effect</h3>
          <div className="pt-options" role="group" aria-label="Pointer effect">
            {(Object.keys(effectNames) as Effect[]).map((e) => (
              <button key={e} type="button" className="pt-option" aria-pressed={p.effect === e} onClick={() => set({ effect: e })}>
                {effectNames[e]}
              </button>
            ))}
          </div>
          {(p.effect === 'emoji' || p.effect === 'springy') && (
            <div className="studio-chip-row" role="group" aria-label="Emoji">
              {emojis.map((e) => (
                <button key={e} type="button" className="studio-chip" aria-pressed={p.emoji === e} onClick={() => set({ emoji: e })}>
                  {e}
                </button>
              ))}
            </div>
          )}
          {p.effect === 'auto' && (
            <ul className="pt-auto">
              {Object.entries(pageEffects).map(([page, fx]) => (
                <li key={page}>
                  <a href={`#${page}`}>{page}</a> · {effectNames[fx.effect]} {fx.emoji?.join('')}
                </li>
              ))}
            </ul>
          )}
          <p className="quick-note">Effects are skipped on touch screens and when your device asks for reduced motion.</p>
        </section>
      )}
      <section className="studio-card pt-try">
        <h3>Try it here</h3>
        <p>Move around, hover the buttons, and right-click anywhere for this page’s menu.</p>
        <div className="studio-chip-row">
          <button type="button" className="studio-btn primary" data-cursor-stick data-cursor-text="Hi!">Magnetic button</button>
          <button type="button" className="studio-btn" data-cursor-text="Click">Label on hover</button>
        </div>
      </section>
    </div>
  )
  return (
    <Studio
      name="pointer"
      accent="#e0703f"
      scene={<StudioScene colors={['#ffd89b', '#f4a7b9', '#c9b8ff']} line="pulse" />}
      aside={<span className="ex-aside"><MousePointerClick size={16} aria-hidden="true" /> {effectNames[p.effect]}</span>}
      tabs={[{ id: 'style', label: 'Pointer', icon: <MousePointer2 size={15} />, render: style }]}
    />
  )
}
