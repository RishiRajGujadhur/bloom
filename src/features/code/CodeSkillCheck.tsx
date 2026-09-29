import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Check, ChevronRight, RotateCcw, X } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import type { CodePath } from './learningPaths'
import { recommendChapter, skillQuestions } from './skillCheck'
import './codeSkillCheck.css'

export function CodeSkillCheck({ path, onClose, onRecommend }: { path: CodePath; onClose: () => void; onRecommend: (index: number) => void }) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Array<number | null>>(() => skillQuestions[path.id].map(() => null))
  const card = useRef<HTMLDivElement>(null)
  const questions = skillQuestions[path.id]
  const question = questions[index]
  const picked = answers[index]
  const finished = index === questions.length
  const recommended = recommendChapter(path, answers)
  const correctCount = answers.filter((answer, at) => answer === questions[at].answer).length

  useLayoutEffect(() => {
    if (!card.current || prefersReducedMotion()) return
    const tween = gsap.fromTo(card.current, { y: 8, opacity: .5 }, { y: 0, opacity: 1, duration: .28, ease: 'power2.out' })
    return () => { tween.progress(1).kill() }
  }, [index])

  const choose = (choice: number) => {
    if (picked !== null) return
    setAnswers((current) => current.map((answer, at) => at === index ? choice : answer))
  }
  const restart = () => { setAnswers(questions.map(() => null)); setIndex(0) }

  return <section className="code-skill-check" style={{ ['--path-color' as string]: path.color }} aria-label={`${path.name} skill check`}>
    <div className="code-skill-head"><div><span>QUICK ORIENTATION</span><h2>{path.name}</h2><p>Four questions help you choose a starting chapter. This is a guide, not a certification.</p></div><button type="button" aria-label="Close skill check" onClick={onClose}><X size={18} /></button></div>
    <svg className="code-skill-progress" viewBox="0 0 440 28" role="img" aria-label={`${Math.min(index + 1, questions.length)} of ${questions.length} questions`}><path d="M30 14 H410" /><path d="M30 14 H410" className="code-skill-progress-fill" style={{ strokeDasharray: `${index / questions.length * 380} 380` }} />{questions.map((_, at) => <circle key={at} cx={30 + at * 380 / (questions.length - 1)} cy="14" r="9" className={at < index ? 'done' : at === index ? 'current' : ''} />)}</svg>
    <div ref={card} className="code-skill-card">
      {finished ? <><span className="code-skill-kicker">START HERE</span><h3>{path.chapters[recommended].title}</h3><p>{correctCount} of {questions.length} correct. {correctCount === questions.length ? 'Try this chapter to build beyond the concepts in this check.' : 'Your first gap points to this chapter.'} Earlier chapters can be marked practiced if you already know them.</p><div className="code-skill-actions"><button type="button" onClick={restart}><RotateCcw size={16} /> Try again</button><button type="button" className="primary" onClick={() => onRecommend(recommended)}>See chapter <ChevronRight size={16} /></button></div></> : <><span className="code-skill-kicker">QUESTION {index + 1} OF {questions.length}</span><h3>{question.prompt}</h3><div className="code-skill-options">{question.options.map((option, at) => <button key={option} type="button" disabled={picked !== null} data-result={picked === null ? undefined : at === question.answer ? 'correct' : picked === at ? 'wrong' : undefined} onClick={() => choose(at)}><span>{'ABC'[at]}</span>{option}{picked !== null && at === question.answer && <Check size={16} aria-hidden="true" />}</button>)}</div>{picked !== null && <div className="code-skill-feedback" role="status"><strong>{picked === question.answer ? 'Correct.' : 'Good try.'}</strong> {question.why}</div>}<div className="code-skill-actions"><button type="button" className="primary" disabled={picked === null} onClick={() => setIndex((value) => value + 1)}>{index === questions.length - 1 ? 'See recommendation' : 'Next question'} <ChevronRight size={16} /></button></div></>}
    </div>
  </section>
}
