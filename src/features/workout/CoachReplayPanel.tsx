import { useEffect, useState } from 'react'
import type { PoseFrame } from './CoachTrails'
import { CoachGhost } from './CoachGhost'
import type { Exercise } from './formModel'
export type RepReplay = { exercise: Exercise; frames: PoseFrame[]; score: number; compensation: number }
export function CoachReplayPanel({ replay }: { replay: RepReplay }) {
  const [index, setIndex] = useState(0), [playing, setPlaying] = useState(true)
  useEffect(() => { setIndex(0) }, [replay])
  useEffect(() => {
    if (!playing || replay.frames.length < 2) return
    const interval = setInterval(() => setIndex(previous => (previous + 1) % replay.frames.length), 80)
    return () => clearInterval(interval)
  }, [playing, replay])
  const frame = replay.frames[Math.min(index, replay.frames.length - 1)]
  return <div className="fc-diagnostics"><h4>Lowest-scoring rep · {replay.score}%</h4><div className="fc-replay-view">{frame && <CoachGhost exercise={replay.exercise} pose={frame.pose} />}</div><label>Replay position<input aria-label="Rep replay position" type="range" min="0" max={Math.max(0, replay.frames.length - 1)} value={index} onChange={event => { setPlaying(false); setIndex(Number(event.target.value)) }} /></label><button onClick={() => setPlaying(!playing)}>{playing ? 'Pause replay' : 'Play replay'}</button><p>Alignment changed in {Math.round(replay.compensation * 100)}% of tracked set frames.</p><div className="fc-compensation" style={{ background: `linear-gradient(90deg,#5dffc0 ${100 - replay.compensation * 100}%,#ffb74d 0)` }} role="img" aria-label="Upper-body compensation summary" /><small>Skeletal replay only; no video recording. Colors summarize deviation from your neutral baseline, not injury risk.</small></div>
}
