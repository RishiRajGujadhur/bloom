import { prefersReducedMotion } from '../../utils/motion'
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { BloomFace } from '../../components/ui/BloomFace'
import { announceAchievement } from '../achievements/DrawnAchievement'
import { CodeGame } from './CodeGame'
import { questAchievement, questCast, questInterludes, questPrologue, type QuestLine } from './questStory'
import './codeQuestStory.css'

const LostArtPlayer = lazy(() => import('./video/LostArtPlayer').then((module) => ({ default: module.LostArtPlayer })))
const introKey = 'bloom-code-lost-art-intro-v1'
const interludeKey = 'bloom-code-lost-art-scenes-v1'
type Phase = 'introVideo' | 'prologue' | 'game' | 'interlude' | 'finaleVideo'

function readSeen() {
  try { return new Set<number>(JSON.parse(localStorage.getItem(interludeKey) || '[]') as number[]) } catch { return new Set<number>() }
}

function StoryDialogue({ lines, restored, onDone }: { lines: QuestLine[]; restored?: boolean; onDone: () => void }) {
  const [index, setIndex] = useState(0)
  const [shown, setShown] = useState(0)
  const host = useRef<HTMLDivElement>(null)
  const [who, words] = lines[index]
  const person = questCast[who]
  const reduced = typeof window !== 'undefined' && prefersReducedMotion()
  useLayoutEffect(() => {
    if (!host.current || reduced) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.cq-story-portrait', { x: -80, opacity: 0, rotate: -6 }, { x: 0, opacity: 1, rotate: 0, duration: 0.48, ease: 'back.out(1.5)' })
      gsap.fromTo('.cq-story-box', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.32, ease: 'power3.out' })
      gsap.fromTo('.cq-story-tablet', { y: -12, rotate: -8 }, { y: 0, rotate: 0, duration: 0.6, ease: 'sine.out' })
    }, host)
    return () => ctx.revert()
  }, [index, reduced])
  useEffect(() => { setShown(reduced ? words.length : 0) }, [index, reduced, words])
  useEffect(() => {
    if (shown >= words.length || reduced) return
    const timer = window.setTimeout(() => setShown((value) => Math.min(words.length, value + 2)), 22)
    return () => window.clearTimeout(timer)
  }, [shown, words, reduced])
  const next = () => {
    if (shown < words.length) return setShown(words.length)
    if (index + 1 >= lines.length) onDone()
    else setIndex((value) => value + 1)
  }
  return <div ref={host} className={`cq-story-scene${restored ? ' restored' : ''}`}>
    <img className="cq-story-bg" src={restored ? '/code-quest/restored-archive.png' : '/code-quest/lost-archive.png'} alt="" />
    <div className="cq-story-shade" />
    <img className="cq-story-tablet" src="/code-quest/code-tablet.png" alt="" />
    <div className="cq-story-portrait" style={{ ['--speaker-color' as string]: person.color, filter: person.tint }}><BloomFace variant={person.face} size={175} follow={false} waveOnMount={false} label={person.name} /></div>
    <div className="cq-story-box" style={{ ['--speaker-color' as string]: person.color }}><strong>{person.name}</strong><p aria-live="polite">{words.slice(0, shown)}</p><span>{index + 1} / {lines.length}</span></div>
    <div className="cq-story-controls"><button type="button" onClick={next}>{shown < words.length ? 'Show line' : index + 1 === lines.length ? 'Continue to quest →' : 'Next →'}</button><button type="button" onClick={onDone}>Skip dialogue</button></div>
  </div>
}

export function CodeQuestStory() {
  const [phase, setPhase] = useState<Phase>(() => { try { return localStorage.getItem(introKey) === 'seen' ? 'game' : 'introVideo' } catch { return 'introVideo' } })
  const [milestone, setMilestone] = useState(0)
  const seen = useRef(readSeen())
  const onMilestone = (level: number) => {
    if (seen.current.has(level)) return
    seen.current.add(level)
    try { localStorage.setItem(interludeKey, JSON.stringify([...seen.current])) } catch { /* storage unavailable */ }
    setMilestone(level)
    setPhase(level === 12 ? 'finaleVideo' : 'interlude')
  }
  const endDialogue = () => {
    if (phase === 'prologue') {
      try { localStorage.setItem(introKey, 'seen') } catch { /* storage unavailable */ }
    } else if (phase === 'interlude' && questAchievement[milestone]) {
      const reward = questAchievement[milestone]
      announceAchievement({ kind: milestone === 12 ? 'levels' : 'skills', title: reward.title, subtitle: reward.subtitle })
    }
    setPhase('game')
  }
  return <div className="cq-story-wrap">
    {phase === 'game' && <button type="button" className="cq-story-replay studio-btn" onClick={() => setPhase('introVideo')}>Watch story intro</button>}
    <div className={phase === 'game' ? 'cq-story-game' : 'cq-story-game is-covered'} aria-hidden={phase !== 'game'}><CodeGame onMilestone={onMilestone} /></div>
    {(phase === 'introVideo' || phase === 'finaleVideo') && <Suspense fallback={<p role="status">Loading story video…</p>}><LostArtPlayer finale={phase === 'finaleVideo'} onEnd={() => setPhase(phase === 'finaleVideo' ? 'interlude' : 'prologue')} /></Suspense>}
    {phase === 'prologue' && <StoryDialogue lines={questPrologue} onDone={endDialogue} />}
    {phase === 'interlude' && <StoryDialogue key={milestone} lines={questInterludes[milestone]} restored={milestone === 12} onDone={endDialogue} />}
  </div>
}
