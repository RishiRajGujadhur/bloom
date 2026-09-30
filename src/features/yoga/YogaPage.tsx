import { prefersReducedMotion } from '../../utils/motion'
import { useKeepAwake } from '../../platform/presence'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BookOpen, Flower2, Pause, Play, Plus, RotateCcw, Save, Trash2, Waves } from 'lucide-react'
import { Rail, Slider, Studio, StudioScene, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { FigureSvg } from '../exercise/ExerciseFigure'
import { flowSeconds, newStep, poseById, poses, presetFlows, stepAt, type Flow, type Step } from './yogaModel'
import '../exercise/exercise.css'
import { Lotus } from '../showcase/Lotus'
import { usePageActions } from '../../components/ui/PageMenu'
import './yoga.css'

const on = (id: string) => subOn('yogaFlow', id)
const KEY = 'bloom-yoga-v1'
type Store = { breath: number; saved: Flow[]; draft: Flow }
const initial: Store = { breath: 5, saved: [], draft: { id: 'draft', name: 'My flow', emoji: '🪷', steps: presetFlows[0].steps.slice(0, 4) } }
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const say = (t: string) => {
  try {
    speechSynthesis.cancel()
    speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(t), { rate: 0.9 }))
  } catch {
    /* optional */
  }
}

/** Soft circle that swells on the inhale and settles on the exhale. */
function BreathCue({ seconds, running }: { seconds: number; running: boolean }) {
  const el = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('Inhale')
  useLayoutEffect(() => {
    if (!el.current || !running || prefersReducedMotion()) return
    const tl = gsap
      .timeline({ repeat: -1 })
      .call(() => setLabel('Inhale'))
      .fromTo(el.current, { scale: 0.7 }, { scale: 1.15, duration: seconds / 2, ease: 'sine.inOut' })
      .call(() => setLabel('Exhale'))
      .to(el.current, { scale: 0.7, duration: seconds / 2, ease: 'sine.inOut' })
    return () => void tl.kill()
  }, [seconds, running])
  return (
    <div className="yg-breath" aria-live="off">
      <div ref={el} className="yg-breath-orb" />
      <span>{running ? label : 'Breathe'}</span>
    </div>
  )
}

function LibraryPose({ id, onAdd }: { id: string; onAdd: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `lib:${id}` })
  const p = poseById(id)
  return (
    <div role="listitem">
      <div ref={setNodeRef} className="yg-lib" data-dragging={isDragging} style={{ transform: CSS.Translate.toString(transform) }} {...attributes} {...listeners}>
        <FigureSvg pose={p.pose} floor={p.floor} small label={p.name} />
        <strong>{p.name}</strong>
        {on('sanskrit') && <small>{p.sanskrit}</small>}
        <button type="button" className="yg-add" aria-label={`Add ${p.name}`} onPointerDown={(e) => e.stopPropagation()} onClick={onAdd}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}

function FlowStep({ step, onBreaths, onRemove }: { step: Step; onBreaths: (n: number) => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.key })
  const p = poseById(step.poseId)
  return (
    <div ref={setNodeRef} className="yg-step" data-dragging={isDragging} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <div className="yg-step-grip" {...attributes} {...listeners} aria-label={`Move ${p.name}`}>
        <FigureSvg pose={p.pose} floor={p.floor} small label={p.name} />
        <strong>{p.name}</strong>
      </div>
      <Slider label="Breaths" value={step.breaths} min={1} max={10} compact onChange={onBreaths} />
      <button type="button" className="yg-remove" aria-label={`Remove ${p.name}`} onClick={onRemove}>
        <Trash2 size={13} />
      </button>
    </div>
  )
}

function FlowDrop({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'flow' })
  return (
    <div ref={setNodeRef} className="yg-flow" data-over={isOver}>
      {children}
    </div>
  )
}

export function YogaPage() {
  const [store, setStoreState] = useState<Store>(() => readStore(KEY, initial))
  const setStore = (fn: (s: Store) => Store) =>
    setStoreState((c) => {
      const n = fn(c)
      writeStore(KEY, n)
      return n
    })
  const [current, setCurrent] = useState<Flow>(presetFlows[0])
  const [tab, setTab] = useState('practice')
  const [running, setRunning] = useState(false)
  // Keep the screen on while the session runs (Screen Wake Lock).
  useKeepAwake(running)
  const [elapsed, setElapsed] = useState(0)
  const [focus, setFocus] = useState(poses[0].id)
  const goRef = useRef<HTMLButtonElement>(null)
  const breath = store.breath
  const length = flowSeconds(current, breath)
  const at = stepAt(current, breath, elapsed)
  const step = at ? current.steps[at.index] : current.steps[current.steps.length - 1]
  const pose = poseById(step?.poseId ?? 'mountain')
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setElapsed((e) => e + 0.25), 250)
    return () => clearInterval(t)
  }, [running])
  const lastIndex = useRef(-1)
  useEffect(() => {
    if (!running || !at) return
    if (at.index !== lastIndex.current) {
      lastIndex.current = at.index
      if (on('voice')) say(`${pose.name}${on('sanskrit') ? `. ${pose.sanskrit}` : ''}. ${pose.cue}`)
    }
  }, [running, at, pose])
  useEffect(() => {
    if (running && elapsed >= length) {
      setRunning(false)
      logActivity('yoga', { flow: current.name, seconds: length })
      burst(goRef.current, 'stars')
      if (on('voice')) say('Namaste. Take a moment to notice how you feel.')
    }
  }, [elapsed, length, running, current.name])

  const play = (f: Flow) => {
    setCurrent(f)
    setElapsed(0)
    lastIndex.current = -1
    setRunning(true)
    setTab('practice')
  }
  const draft = store.draft
  const setDraft = (steps: Step[]) => setStore((s) => ({ ...s, draft: { ...s.draft, steps } }))
  const onDragEnd = (e: DragEndEvent) => {
    const a = String(e.active.id)
    const over = e.over ? String(e.over.id) : null
    if (a.startsWith('lib:')) {
      if (!over) return
      const idx = draft.steps.findIndex((x) => x.key === over)
      const next = [...draft.steps]
      next.splice(idx < 0 ? next.length : idx, 0, newStep(a.slice(4)))
      setDraft(next)
    } else if (over && a !== over) {
      const from = draft.steps.findIndex((x) => x.key === a)
      const to = draft.steps.findIndex((x) => x.key === over)
      if (from >= 0 && to >= 0) setDraft(arrayMove(draft.steps, from, to))
    }
  }

  usePageActions([{ id: 'yg-go', label: running ? 'Pause flow' : 'Begin flow', icon: '🧘', run: () => (elapsed >= length ? play(current) : setRunning(!running)) }])
  const practice = () => (
    <div className="studio-split">
      <div className="studio-card yg-stage">
        {on('lotus') && <Lotus seconds={breath} running={running} />}
        <div className="yg-figure">
          <FigureSvg pose={pose.pose} floor={pose.floor} label={pose.name} className="yg-morph" />
        </div>
        {on('timeline') && (
          <div className="yg-timeline" aria-hidden="true">
            {current.steps.map((s, i) => (
              <i key={s.key} style={{ flex: s.breaths }} data-past={at ? i < at.index : elapsed >= length} data-now={at?.index === i} data-hint={`${poseById(s.poseId)?.name ?? s.poseId} · ${s.breaths} breaths`} />
            ))}
          </div>
        )}
      </div>
      <div className="studio-card yg-side">
        <span className="now-kicker">{current.name}</span>
        <h3 className="yg-pose-name">{pose.name}</h3>
        {on('sanskrit') && <p className="yg-sanskrit">{pose.sanskrit}</p>}
        <p className="yg-cue">{pose.cue}</p>
        {on('breathCue') && <BreathCue seconds={breath} running={running} />}
        <div className="iv-buttons">
          <button ref={goRef} type="button" className="studio-go" onClick={() => (elapsed >= length ? play(current) : setRunning(!running))}>
            {running ? <Pause size={18} /> : <Play size={18} />} {running ? 'Pause' : elapsed > 0 && elapsed < length ? 'Resume' : 'Begin'}
          </button>
          <button type="button" className="studio-go" data-variant="quiet" aria-label="Restart" onClick={() => (setElapsed(0), setRunning(false))}>
            <RotateCcw size={16} />
          </button>
        </div>
        <p className="studio-empty">
          {fmt(Math.max(0, length - elapsed))} left · step {Math.min((at?.index ?? current.steps.length - 1) + 1, current.steps.length)} of {current.steps.length}
        </p>
        <Slider label="Breath length" value={breath} min={3} max={8} step={0.5} unit="s" compact onChange={(v) => setStore((s) => ({ ...s, breath: v }))} />
      </div>
    </div>
  )

  const build = () => (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <div className="yg-build">
        <div className="yg-build-head">
          <input className="studio-input" aria-label="Flow name" value={draft.name} onChange={(e) => setStore((s) => ({ ...s, draft: { ...s.draft, name: e.target.value } }))} />
          <span className="studio-empty">{fmt(flowSeconds(draft, breath))}</span>
          <button type="button" className="studio-go" onClick={() => play({ ...draft, id: `draft-${Date.now()}` })} disabled={!draft.steps.length}>
            <Play size={16} /> Practise
          </button>
          {on('savedFlows') && (
            <button type="button" className="studio-go" data-variant="quiet" disabled={!draft.steps.length} onClick={() => setStore((s) => ({ ...s, saved: [...s.saved, { ...s.draft, id: crypto.randomUUID() }] }))}>
              <Save size={16} /> Save
            </button>
          )}
        </div>
        <FlowDrop>
          <SortableContext items={draft.steps.map((s) => s.key)} strategy={horizontalListSortingStrategy}>
            {draft.steps.map((s) => (
              <FlowStep
                key={s.key}
                step={s}
                onBreaths={(n) => setDraft(draft.steps.map((x) => (x.key === s.key ? { ...x, breaths: n } : x)))}
                onRemove={() => setDraft(draft.steps.filter((x) => x.key !== s.key))}
              />
            ))}
          </SortableContext>
          {!draft.steps.length && <p className="studio-empty">Drag poses here.</p>}
        </FlowDrop>
        <Rail label="Pose library">
          {poses.map((p) => (
            <LibraryPose key={p.id} id={p.id} onAdd={() => setDraft([...draft.steps, newStep(p.id)])} />
          ))}
        </Rail>
      </div>
    </DndContext>
  )

  const focusPose = poseById(focus)
  const library = () => (
    <div className="studio-split">
      <div className="studio-card yg-stage">
        <div className="yg-figure">
          <FigureSvg pose={focusPose.pose} floor={focusPose.floor} label={focusPose.name} className="yg-morph" />
        </div>
      </div>
      <div className="studio-card yg-side">
        <h3 className="yg-pose-name">{focusPose.name}</h3>
        {on('sanskrit') && <p className="yg-sanskrit">{focusPose.sanskrit}</p>}
        {on('benefits') && <p className="yg-benefit">✦ {focusPose.benefit}</p>}
        <p className="yg-cue">{focusPose.cue}</p>
        <div className="yg-pose-chips">
          {poses.map((p) => (
            <button key={p.id} type="button" className="studio-chip" aria-pressed={focus === p.id} onClick={() => setFocus(p.id)}>
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const flows = () => (
    <div className="iv-programs">
      {on('presets') && (
        <>
          <h3>Flows</h3>
          <Rail label="Preset flows">
            {presetFlows.map((f) => (
              <div key={f.id} role="listitem">
                <button type="button" className="iv-card" onClick={() => play(f)}>
                  <span aria-hidden="true">{f.emoji}</span>
                  <strong>{f.name}</strong>
                  <small>
                    {f.steps.length} poses · {fmt(flowSeconds(f, breath))}
                  </small>
                </button>
              </div>
            ))}
          </Rail>
        </>
      )}
      {on('savedFlows') && store.saved.length > 0 && (
        <>
          <h3>Your flows</h3>
          <Rail label="Saved flows">
            {store.saved.map((f) => (
              <div key={f.id} role="listitem" className="yg-saved">
                <button type="button" className="iv-card" onClick={() => play(f)}>
                  <span aria-hidden="true">{f.emoji}</span>
                  <strong>{f.name}</strong>
                  <small>
                    {f.steps.length} poses · {fmt(flowSeconds(f, breath))}
                  </small>
                </button>
                <button type="button" className="yg-remove" aria-label={`Delete ${f.name}`} onClick={() => setStore((s) => ({ ...s, saved: s.saved.filter((x) => x.id !== f.id) }))}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </Rail>
        </>
      )}
    </div>
  )

  return (
    <Studio
      name="yoga"
      accent="#8f7ae5"
      tab={tab}
      onTab={setTab}
      scene={<StudioScene colors={['#c9b8ff', '#f4c7d8', '#b8e0d2']} line="wave" />}
      tabs={[
        ...(on('player') ? [{ id: 'practice', label: 'Practice', icon: <Flower2 size={15} />, render: practice }] : []),
        { id: 'flows', label: 'Flows', icon: <Waves size={15} />, render: flows },
        ...(on('builder') ? [{ id: 'build', label: 'Build', icon: <Plus size={15} />, render: build }] : []),
        ...(on('library') ? [{ id: 'poses', label: 'Poses', icon: <BookOpen size={15} />, render: library }] : []),
      ]}
    />
  )
}
