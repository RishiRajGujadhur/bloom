import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import rough from 'roughjs'
import { Slider, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { ExerciseFigure } from './ExerciseFigure'
import { programExercises, programMinutes, programs, type Program } from './moves'

const on = (id: string) => subOn('exerciseGuides', id)
const KEY = 'bloom-exercise-programs-v1'
type Saved = { sets: number; rest: number; level: 'easy' | 'normal' | 'hard'; done: Record<string, number> }
const start: Saved = { sets: 2, rest: 20, level: 'normal', done: {} }
const levelReps = { easy: 0.6, normal: 1, hard: 1.5 }

/** Hand-drawn (rough.js) badge for a program, drawn in with GSAP. */
function ProgramArt({ p }: { p: Program }) {
  const svg = useRef<SVGSVGElement>(null)
  useLayoutEffect(() => {
    const el = svg.current
    if (!el) return
    el.innerHTML = ''
    const rc = rough.svg(el)
    const seed = [...p.id].reduce((a, c) => a + c.charCodeAt(0), 0)
    el.append(
      rc.circle(40, 40, 64, { stroke: '#e0703f', strokeWidth: 2, fill: '#f7b27a55', fillStyle: 'hachure', seed }),
      rc.arc(40, 40, 76, 76, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * Math.min(p.ids.length, 8)) / 8, false, { stroke: '#3f7fd0', strokeWidth: 2.5, seed }),
    )
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const tw = gsap.from(el.querySelectorAll('path'), { opacity: 0, scale: 0.6, transformOrigin: '40px 40px', duration: 0.6, stagger: 0.04, ease: 'back.out(2)' })
    return () => void tw.revert()
  }, [p.id, p.ids.length])
  return (
    <span className="ex-prog-art">
      <svg ref={svg} viewBox="0 0 80 80" aria-hidden="true" />
      <b aria-hidden="true">{p.emoji}</b>
    </span>
  )
}

export function Programs({ seatedOnly }: { seatedOnly: boolean }) {
  const [s, setS] = useState<Saved>(() => ({ ...start, ...readStore(KEY, start) }))
  const save = (p: Partial<Saved>) => setS((c) => { const n = { ...c, ...p }; writeStore(KEY, n); return n })
  const [active, setActive] = useState<Program | null>(null)
  const [step, setStep] = useState(0) // index into exercises × sets
  const [resting, setResting] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [reps, setReps] = useState(0)
  const doneBtn = useRef<HTMLButtonElement>(null)

  const list = active ? programExercises(active, seatedOnly) : []
  const total = list.length * s.sets
  const ex = list[step % Math.max(list.length, 1)]
  const target = active ? Math.max(3, Math.round(active.reps * levelReps[s.level])) : 0

  useEffect(() => {
    if (resting <= 0) return
    const t = setTimeout(() => setResting((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [resting])
  useEffect(() => {
    if (!playing || !ex?.hold) return
    const t = setInterval(() => setReps((r) => r + 1), 1000)
    return () => clearInterval(t)
  }, [playing, ex])
  const next = () => {
    setReps(0)
    if (step + 1 >= total) {
      setPlaying(false)
      burst(doneBtn.current, 'stars')
      logActivity('exercise', { id: `program-${active!.id}`, amount: total })
      save({ done: { ...s.done, [active!.id]: (s.done[active!.id] ?? 0) + 1 } })
      setActive(null)
      return
    }
    setStep(step + 1)
    if (on('rest') && s.rest) setResting(s.rest)
  }
  useEffect(() => {
    if (playing && ex && reps >= (ex.hold ? 30 : target) && on('autoAdvance')) next()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reps])

  if (active && ex)
    return (
      <div className="ex-player studio-card">
        <div className="ex-player-top">
          <strong>{active.emoji} {active.name}</strong>
          <span>Set {Math.floor(step / list.length) + 1}/{s.sets} · move {(step % list.length) + 1}/{list.length}</span>
        </div>
        <div className="ex-player-bar" aria-hidden="true"><i style={{ width: `${(step / total) * 100}%` }} /></div>
        {resting > 0 ? (
          <div className="ex-rest" role="timer">
            <b>{resting}</b> s rest · next: {ex.emoji} {ex.name}
            <button type="button" className="studio-btn" onClick={() => setResting(0)}>Skip rest</button>
          </div>
        ) : (
          <>
            <ExerciseFigure exercise={ex} playing={playing} speed={1} onRep={() => !ex.hold && setReps((r) => r + 1)} />
            <p className="ex-player-name">{ex.emoji} {ex.name} — {reps}/{ex.hold ? '30 s' : target}</p>
            <p className="ex-player-cue">{ex.cues[0]}</p>
            <div className="studio-chip-row">
              <button type="button" className="studio-btn primary" onClick={() => setPlaying(!playing)}>{playing ? 'Pause' : 'Go'}</button>
              <button ref={doneBtn} type="button" className="studio-btn" onClick={next}>Next move</button>
              <button type="button" className="studio-btn" onClick={() => { setActive(null); setPlaying(false) }}>End</button>
            </div>
          </>
        )}
      </div>
    )

  return (
    <div className="ex-programs">
      <div className="studio-card ex-prog-settings">
        <Slider label="Sets" min={1} max={5} value={s.sets} onChange={(v) => save({ sets: v })} />
        {on('rest') && <Slider label="Rest between moves (s)" min={0} max={90} step={5} value={s.rest} onChange={(v) => save({ rest: v })} />}
        {on('difficulty') && (
          <div className="studio-chip-row" role="group" aria-label="Difficulty">
            {(['easy', 'normal', 'hard'] as const).map((l) => (
              <button key={l} type="button" className="studio-chip" aria-pressed={s.level === l} onClick={() => save({ level: l })}>{l}</button>
            ))}
          </div>
        )}
      </div>
      <div className="ex-prog-grid">
        {programs
          .filter((p) => programExercises(p, seatedOnly).length >= 3)
          .map((p) => (
            <article key={p.id} className="studio-card ex-prog">
              <ProgramArt p={p} />
              <div>
                <h3>{p.name}</h3>
                <p>{p.goal}</p>
                <small>{programExercises(p, seatedOnly).length} moves · ~{programMinutes(p) * s.sets} min{s.done[p.id] ? ` · done ${s.done[p.id]}×` : ''}</small>
                <ul>{programExercises(p, seatedOnly).map((e) => <li key={e.id}>{e.emoji} {e.name}</li>)}</ul>
                <div className="studio-chip-row">
                  <button type="button" className="studio-btn primary" onClick={() => { setActive(p); setStep(0); setReps(0); setPlaying(false) }}>Start</button>
                  {on('printPlan') && <button type="button" className="studio-btn" onClick={() => window.print()}>Print</button>}
                </div>
              </div>
            </article>
          ))}
      </div>
    </div>
  )
}
