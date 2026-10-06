import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Heart, Mic, Snail, Volume2, X } from 'lucide-react'
import { canListen, checkTyped, listen, norm, soundScore, speak } from './englishNlp'
import { answerOf, promptOf, type Exercise } from './lessonGen'
import { sfx } from './sfx'
import { BloomFace, type BloomFaceHandle } from '../../components/ui/BloomFace'
import { UnitScene, type UnitTheme } from './UnitScene'
import { setQuiz } from '../../companion/quizContext'
import { prefersReducedMotion } from '../../utils/motion'

export type LessonResult = { correct: number; total: number; mistakes: { prompt: string; answer: string; given: string }[]; words: { en: string; good: boolean }[] }

function Chip({ id, label, onClick }: { id: string; label: string; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  return (
    <button ref={setNodeRef} type="button" className="en-chip" style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners} onClick={onClick}>
      {label}
    </button>
  )
}

/**
 * Plays one lesson: a progress bar, hearts, one exercise at a time, a check
 * button and a Duolingo-style feedback banner that slides up.
 */
export function LessonPlayer({ exercises, hearts, onHeartLost, onDone, onQuit, title, theme }: {
  exercises: Exercise[]
  hearts: number
  onHeartLost: () => void
  onDone: (r: LessonResult) => void
  onQuit: () => void
  title: string
  theme?: UnitTheme
}) {
  const buddy = useRef<BloomFaceHandle>(null)
  const checkBtn = useRef<HTMLButtonElement>(null)
  const [i, setI] = useState(0)
  const [queue, setQueue] = useState(exercises)
  const [status, setStatus] = useState<'idle' | 'right' | 'typo' | 'wrong'>('idle')
  const [choice, setChoice] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [bank, setBank] = useState<{ id: string; w: string }[]>([])
  const [matched, setMatched] = useState<string[]>([])
  const [pickL, setPickL] = useState<string | null>(null)
  const [heard, setHeard] = useState<string | null>(null)
  const [explain, setExplain] = useState(false)
  const [reducedAnimations, setReducedAnimationsState] = useState(() => {
    try { return localStorage.getItem('bloom-english-reduced-motion') === 'true' } catch { return false }
  })
  const reduceAnimations = reducedAnimations || prefersReducedMotion()
  const setReducedAnimations = (enabled: boolean) => {
    setReducedAnimationsState(enabled)
    try { localStorage.setItem('bloom-english-reduced-motion', String(enabled)) } catch { /* optional */ }
  }
  const results = useRef<LessonResult>({ correct: 0, total: 0, mistakes: [], words: [] })
  const card = useRef<HTMLDivElement>(null)
  const banner = useRef<HTMLDivElement>(null)
  const ex = queue[i]

  const rightSide = useMemo(() => (ex?.kind === 'match' ? [...ex.pairs].sort(() => Math.random() - 0.5) : []), [ex])

  useLayoutEffect(() => {
    if (!card.current || reduceAnimations) return
    const tl = gsap.timeline()
    tl.fromTo(card.current, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out' })
      // fromTo (not from): a killed-and-rerun effect must still end fully visible.
      .fromTo(card.current.querySelectorAll('.en-prompt .w'), { y: 14, opacity: 0, rotateX: -50 }, { y: 0, opacity: 1, rotateX: 0, duration: 0.35, stagger: 0.04, ease: 'back.out(2)' }, 0.1)
      .fromTo(card.current.querySelectorAll('.en-option, .en-pic, .en-bank .en-chip, .en-speaker, .en-mic, .en-type'), { y: 18, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, stagger: 0.05, ease: 'back.out(1.8)', clearProps: 'transform,opacity' }, 0.2)
    if (ex?.kind === 'listen') speak(ex.answer)
    return () => void tl.progress(1).kill()
  }, [i, ex, reduceAnimations])
  // Let Bloom's chat give hints for the question on screen.
  useEffect(() => {
    if (!ex) return
    setQuiz({
      source: 'English lesson',
      question: promptOf(ex),
      answer: answerOf(ex),
      options: ex.kind === 'choice' || ex.kind === 'cloze' ? ex.options : ex.kind === 'picture' ? ex.options.map((o) => o.en) : undefined,
      explain: ex.kind === 'cloze' ? ex.tip : ex.kind === 'picture' ? `${ex.word.emoji} “${ex.word.en}” means ${ex.word.meaning}.` : undefined,
    })
  }, [ex])
  useEffect(() => () => setQuiz(null), [])
  useEffect(() => {
    if (!reduceAnimations && status !== 'idle' && banner.current) gsap.fromTo(banner.current, { yPercent: 100 }, { yPercent: 0, duration: 0.3, ease: 'back.out(1.6)' })
  }, [status, reduceAnimations])

  if (!ex) return null
  const progress = i / queue.length
  const bankLine = bank.map((b) => b.w).join(' ')
  const given = () => {
    switch (ex.kind) {
      case 'bank': return bankLine
      case 'type': case 'listen': return typed
      case 'speak': return heard ?? ''
      case 'match': return matched.length === ex.pairs.length * 2 ? answerOf(ex) : ''
      default: return choice ?? ''
    }
  }
  const ready = ex.kind === 'match' ? matched.length === ex.pairs.length * 2 : given().trim().length > 0

  const check = () => {
    let verdict: 'right' | 'typo' | 'wrong'
    if (ex.kind === 'type' || ex.kind === 'listen') {
      const v = checkTyped(typed, ex.answer)
      verdict = v === 'exact' ? 'right' : v
    }
    else if (ex.kind === 'speak') verdict = soundScore(heard ?? '', ex.answer) >= 0.7 ? 'right' : 'wrong'
    else if (ex.kind === 'bank') verdict = norm(bankLine) === norm(ex.sentence) ? 'right' : 'wrong'
    else if (ex.kind === 'match') verdict = 'right'
    else verdict = norm(choice ?? '') === norm(answerOf(ex)) ? 'right' : 'wrong'
    const r = results.current
    r.total++
    const word = ex.kind === 'picture' ? ex.word.en : ex.kind === 'type' ? ex.word : ex.kind === 'choice' ? ex.word : undefined
    if (verdict === 'wrong') {
      r.mistakes.push({ prompt: promptOf(ex), answer: answerOf(ex), given: given() })
      if (word) r.words.push({ en: word, good: false })
      onHeartLost()
      sfx('wrong')
      buddy.current?.react('think')
      if (card.current && !reduceAnimations) gsap.fromTo(card.current, { x: -10 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.25)' })
      // Duolingo repeats a missed exercise at the end of the lesson.
      setQueue((q) => [...q, ex])
    } else {
      r.correct++
      if (word) r.words.push({ en: word, good: true })
      sfx('right')
      buddy.current?.react('cheer')
      if (card.current && !reduceAnimations) gsap.fromTo(card.current, { scale: 1 }, { scale: 1.03, duration: 0.15, yoyo: true, repeat: 1 })
    }
    setStatus(verdict)
  }
  const next = () => {
    if (i + 1 >= queue.length || hearts <= 0) {
      onDone(results.current)
      return
    }
    setI(i + 1)
    setStatus('idle')
    setChoice(null)
    setTyped('')
    setBank([])
    setMatched([])
    setPickL(null)
    setHeard(null)
    setExplain(false)
  }
  const onDrag = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return
    setBank((b) => arrayMove(b, b.findIndex((x) => x.id === e.active.id), b.findIndex((x) => x.id === e.over!.id)))
  }
  const tapMatch = (side: 'l' | 'r', en: string) => {
    if (matched.includes(`${side}:${en}`)) return
    if (side === 'l') return setPickL(en)
    if (!pickL) return
    if (pickL === en) {
      sfx('tick')
      setMatched((m) => [...m, `l:${en}`, `r:${en}`])
    } else {
      sfx('wrong')
      results.current.mistakes.push({ prompt: `Match “${pickL}”`, answer: pickL, given: en })
    }
    setPickL(null)
  }
  const locked = status !== 'idle'

  return (
    <div className="en-lesson" role="dialog" aria-label={`Lesson: ${title}`}>
      {theme && <UnitScene theme={theme} dense className="en-lesson-fx" />}
      <div className="en-lesson-top bloom-inline">
        <button type="button" className="en-icon-btn" aria-label="Quit lesson" onClick={onQuit}><X size={20} /></button>
        <div className="en-progress" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${progress * 100}%` }} /></div>
        {theme?.cast[0] && <BloomFace ref={buddy} variant={theme.cast[0].face} size={44} follow={false} waveOnMount={false} label={theme.cast[0].name} />}
        <span className="en-hearts" aria-label={`${hearts} hearts`}><Heart size={18} fill="currentColor" /> {hearts}</span>
        <label className="en-motion-setting">
          <input type="checkbox" checked={reducedAnimations} onChange={(event) => setReducedAnimations(event.target.checked)} />
          Reduce animations
        </label>
      </div>

      <div ref={card} className="en-ex bloom-start-stack" key={i}>
        <h3 className="en-prompt">{ex.kind === 'type' ? <><Words text="Type the word:" /> <span className="en-big-emoji w">{ex.emoji}</span> <Words text={ex.prompt} /></> : <Words text={promptOf(ex)} />}</h3>

        {ex.kind === 'picture' && (
          <div className="en-pics">
            {ex.options.map((o) => (
              <button key={o.en} type="button" disabled={locked} className="en-pic" aria-pressed={choice === o.en} onClick={() => { setChoice(o.en); speak(o.en) }}>
                <span className="en-big-emoji">{o.emoji}</span>
                <span>{o.en}</span>
              </button>
            ))}
          </div>
        )}
        {(ex.kind === 'choice' || ex.kind === 'cloze') && (
          <div className="en-options bloom-stack">
            {ex.options.map((o, k) => (
              <button key={o} type="button" disabled={locked} className="en-option" aria-pressed={choice === o} onClick={() => setChoice(o)}>
                <kbd>{k + 1}</kbd> {o}
              </button>
            ))}
          </div>
        )}
        {ex.kind === 'bank' && (
          <>
            <DndContext collisionDetection={closestCenter} onDragEnd={onDrag}>
              <SortableContext items={bank.map((b) => b.id)} strategy={horizontalListSortingStrategy}>
                <div className="en-bank-line" aria-label="Your sentence">
                  {bank.map((b) => <Chip key={b.id} id={b.id} label={b.w} onClick={() => !locked && setBank((x) => x.filter((y) => y.id !== b.id))} />)}
                </div>
              </SortableContext>
            </DndContext>
            <div className="en-bank">
              {ex.chips.map((w, k) => {
                const id = `${k}-${w}`
                const used = bank.some((b) => b.id === id)
                return (
                  <button key={id} type="button" className="en-chip" disabled={used || locked} onClick={() => { setBank((b) => [...b, { id, w }]); speak(w, 1.1) }}>{w}</button>
                )
              })}
            </div>
          </>
        )}
        {(ex.kind === 'type' || ex.kind === 'listen') && (
          <>
            {ex.kind === 'listen' && (
              <div className="en-audio bloom-controls">
                <button type="button" className="en-speaker" aria-label="Play" onClick={() => speak(ex.answer)}><Volume2 size={34} /></button>
                <button type="button" className="en-speaker small" aria-label="Play slowly" onClick={() => speak(ex.answer, 0.6)}><Snail size={22} /></button>
              </div>
            )}
            <textarea className="studio-input en-type" rows={2} value={typed} disabled={locked} aria-label="Your answer" placeholder="Type in English" onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (!locked && ready) check(); else if (locked) next() } }} />
          </>
        )}
        {ex.kind === 'speak' && (
          <div className="en-audio bloom-controls">
            <button type="button" className="en-speaker" aria-label="Hear it" onClick={() => speak(ex.answer)}><Volume2 size={30} /></button>
            {canListen() ? (
              <button type="button" className="en-mic" disabled={locked} onClick={async () => setHeard((await listen()) ?? '')}><Mic size={22} /> Tap and speak</button>
            ) : (
              <input className="studio-input" aria-label="Type what you would say" placeholder="Speech not supported — type it" value={heard ?? ''} onChange={(e) => setHeard(e.target.value)} />
            )}
            {heard !== null && <p className="quick-note">Heard: “{heard || '…'}”</p>}
          </div>
        )}
        {ex.kind === 'match' && (
          <div className="en-match bloom-columns">
            <div>{ex.pairs.map((p) => <button key={p.en} type="button" className="en-option" aria-pressed={pickL === p.en} disabled={matched.includes(`l:${p.en}`)} onClick={() => tapMatch('l', p.en)}>{p.en}</button>)}</div>
            <div>{rightSide.map((p) => <button key={p.en} type="button" className="en-option" disabled={matched.includes(`r:${p.en}`)} onClick={() => tapMatch('r', p.en)}>{p.hint}</button>)}</div>
          </div>
        )}
      </div>

      {status === 'idle' ? (
        <div className="en-footer">
          {(ex.kind === 'speak' || ex.kind === 'listen') && <button type="button" className="studio-btn" onClick={() => { results.current.total++; next() }}>Can’t {ex.kind === 'speak' ? 'speak' : 'listen'} now</button>}
          <button ref={checkBtn} type="button" className={`en-check ${ready ? 'is-ready' : ''}`} disabled={!ready} onClick={check}>Check</button>
        </div>
      ) : (
        <div ref={banner} className={`en-banner is-${status}`} role="status">
          <div>
            <strong>{status === 'right' ? pickPraise() : status === 'typo' ? 'You have a typo' : 'Correct answer:'}</strong>
            {status !== 'right' && <p>{answerOf(ex)}</p>}
            {ex.kind === 'cloze' && (
              <button type="button" className="en-link" onClick={() => setExplain((v) => !v)}>Explain my answer</button>
            )}
            {explain && ex.kind === 'cloze' && <p className="en-explain">{ex.tip}</p>}
          </div>
          <button type="button" className="en-check" autoFocus onClick={next}>Continue</button>
        </div>
      )}
    </div>
  )
}

/** Prompt text split into words (rendered by React) so GSAP can ripple them in. */
function Words({ text }: { text: string }) {
  return (
    <span aria-label={text}>
      {text.split(' ').map((w, i) => <span key={i} className="w" aria-hidden="true">{w}{' '}</span>)}
    </span>
  )
}

const praise = ['Nice!', 'Great job!', 'Excellent!', 'Correct!', 'Amazing!', 'You got it!']
const pickPraise = () => praise[Math.floor(Math.random() * praise.length)]
