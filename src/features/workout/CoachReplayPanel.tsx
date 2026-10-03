import { useEffect, useState } from 'react'
import type { PoseFrame } from './CoachTrails'
import { CoachGhost } from './CoachGhost'
import { jointCallouts, type Exercise } from './formModel'
export type RepReplay = { exercise: Exercise; frames: PoseFrame[]; score: number; compensation: number }
export function CoachReplayPanel({ replay }: { replay: RepReplay }) {
  const [index, setIndex] = useState(0), [playing, setPlaying] = useState(true)
  useEffect(() => { setIndex(0) }, [replay])
  useEffect(() => {
    if (!playing || replay.frames.length < 2) return
    const interval = setInterval(() => setIndex(previous => (previous + 1) % replay.frames.length), 80)
    return () => clearInterval(interval)
  }, [playing, replay])
  const initial = jointCallouts(replay.frames[0]?.pose ?? [])
  const excursion = (side: 'left' | 'right') => replay.frames.reduce((sum, row) => sum + Math.abs((jointCallouts(row.pose)[side] ?? 0) - (initial[side] ?? 0)), 0) / Math.max(1, replay.frames.length)
  const limbColor = (side: 'left' | 'right') => `hsl(${Math.max(30, 155 - excursion(side) * 1.5)} 85% 65%)`
  const frame = replay.frames[Math.min(index, replay.frames.length - 1)]
  return <div className="fc-diagnostics"><h4>Lowest-scoring rep · {replay.score}%</h4><div className="fc-replay-view">{frame && <CoachGhost exercise={replay.exercise} pose={frame.pose} />}</div><label>Replay position<input aria-label="Rep replay position" type="range" min="0" max={Math.max(0, replay.frames.length - 1)} value={index} onChange={event => { setPlaying(false); setIndex(Number(event.target.value)) }} /></label><button onClick={() => setPlaying(!playing)}>{playing ? 'Pause replay' : 'Play replay'}</button><p>Alignment changed in {Math.round(replay.compensation * 100)}% of tracked set frames.</p><svg className="fc-motion-map" viewBox="0 0 160 100" role="img" aria-label="Post-set torso alignment and elbow excursion map"><circle cx="80" cy="15" r="10" fill={replay.compensation > .15 ? '#ffb74d' : '#5dffc0'} /><path d="M60 32H100L92 87H68Z" fill={replay.compensation > .15 ? '#ffb74d' : '#5dffc0'} /><path d="M55 35L38 60L30 87" fill="none" stroke={limbColor('left')} strokeWidth="12" strokeLinecap="round" /><path d="M105 35L122 60L130 87" fill="none" stroke={limbColor('right')} strokeWidth="12" strokeLinecap="round" /></svg><p>Torso amber: baseline alignment changed · Arm brightness: projected elbow excursion, not stress.</p><div className="fc-compensation" style={{ background: `linear-gradient(90deg,#5dffc0 ${100 - replay.compensation * 100}%,#ffb74d 0)` }} role="img" aria-label="Upper-body compensation summary" /><small>Skeletal replay only; no video recording. Colors summarize deviation from your neutral baseline, not injury risk.</small></div>
}
