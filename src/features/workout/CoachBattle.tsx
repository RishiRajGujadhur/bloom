import { useEffect, useRef, useState } from 'react'
import { COMBAT_MODES, combatTick, cutEfficiency, newCombat, slashTrail, swordPose, type CombatMode } from './cameraCombatModel'
import type { PoseFrame } from './CoachTrails'
import type { Exercise } from './formModel'
import './coachBattle.css'
export function CoachBattle({ frame, frames, active, demo, mirror, onExercise }: { frame?: PoseFrame; frames: PoseFrame[]; active: boolean; demo: boolean; mirror: boolean; onExercise: (exercise: Exercise) => void }) {
  const [mode, setMode] = useState<CombatMode | ''>('')
  const [paused, setPaused] = useState(false)
  const [weapon, setWeapon] = useState<'broadsword' | 'katana'>('broadsword')
  const [swordHand, setSwordHand] = useState<15 | 16>(15)
  const [state, setState] = useState(newCombat)
  const current = useRef(state)
  useEffect(() => {
    if (!frame || !active || paused || !mode) { current.current = { ...current.current, pose: null, event: false }; return }
    const next = combatTick(current.current, mode, frame.pose, frame.at, swordHand); current.current = next; setState(next)
  }, [frame, active, paused, mode, swordHand])
  const reset = () => { const next = newCombat(); current.current = next; setState(next); setPaused(false) }
  const blade = state.pose && mode === 'sword' ? swordPose(state.pose, swordHand) : null
  const x = (value: number) => (mirror ? 1 - value : value) * 640
  const y = (value: number) => value * 480
  const trail = mode === 'sword' ? slashTrail(frames, swordHand) : []
  const trailPath = trail.map((p, i) => p ? `${i === 0 || !trail[i - 1] ? 'M' : 'L'}${x(p.x)},${y(p.y)}` : '').join(' ')
  return <div className="cb-root" data-mirror={mirror}>
    {mode === 'sword' && <svg className="cb-overlay" viewBox="0 0 640 480" aria-label="Sword slash trajectory"><path d={trailPath} fill="none" stroke={weapon === 'katana' ? '#ee75ff' : '#6bffe2'} strokeWidth="9" strokeOpacity=".45" strokeLinecap="round" /><path d={trailPath} fill="none" stroke="#ffffff" strokeWidth="2" strokeOpacity=".7" /></svg>}
    {blade && <svg className="cb-overlay" viewBox="0 0 640 480" aria-label={`Empty-hand ${weapon} overlay`}><path className="cb-blade" d={weapon === 'katana' ? `M${x(blade.hilt.x)},${y(blade.hilt.y)} Q${x((blade.hilt.x + blade.tip.x) / 2) + 18},${y((blade.hilt.y + blade.tip.y) / 2)} ${x(blade.tip.x)},${y(blade.tip.y)}` : `M${x(blade.hilt.x)},${y(blade.hilt.y)} L${x(blade.tip.x)},${y(blade.tip.y)}`} stroke={weapon === 'katana' ? '#fd8dff' : '#74ffdb'} strokeWidth={weapon === 'katana' ? 7 : 12} strokeLinecap="round" fill="none" /><circle cx={x(blade.hilt.x)} cy={y(blade.hilt.y)} r="10" fill="#ffc36b" /></svg>}
    <div className="cb-menu"><label>Seated camera arcade<select aria-label="Seated camera arcade" value={mode} onChange={e => { const next = e.target.value as CombatMode | ''; reset(); setMode(next); if (next) onExercise(next === 'cloud' ? 'taiChi' : next === 'ropes' || next === 'doubleRopes' || next === 'sword' ? 'observe' : 'boxing') }}><option value="">Off</option>{COMBAT_MODES.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
      {mode === 'sword' && <><label>Virtual weapon<select aria-label="Virtual weapon" value={weapon} onChange={e => setWeapon(e.target.value as typeof weapon)}><option value="broadsword">Broadsword</option><option value="katana">Katana</option></select></label><label>Sword hand<select aria-label="Sword hand" value={swordHand} onChange={e => { setSwordHand(Number(e.target.value) as 15 | 16); reset() }}><option value={15}>Left hand</option><option value={16}>Right hand</option></select></label></>}
      {mode && <><p>{COMBAT_MODES.find(m => m.id === mode)?.cue}</p><button type="button" onClick={() => { current.current.pose = null; setPaused(p => !p) }}>{paused ? 'Resume battle' : 'Pause battle'}</button><button type="button" onClick={reset}>Restart battle</button><p role="status">{demo ? 'Demo · no rewards' : !active ? 'Start camera and calibrate to play' : paused ? 'Battle paused' : 'Camera movement estimates'} · {state.hits} strikes · {state.slips} slips · chain {state.chain} · cue match {state.grade ?? '—'}%</p></>}
      {mode === 'sword' && <p>{state.move} · {state.parries} parries · {state.guard ? 'High guard ready' : 'Raise a comfortable diagonal high guard to parry'} · cut straightness {cutEfficiency(trail) ?? '—'}% · projected path only, not 3D blade-plane accuracy</p>}
      {(mode === 'ropes' || mode === 'doubleRopes') && <p>Downward acceleration {state.acceleration.toFixed(1)} m/s² · power proxy {state.power.toFixed(0)} W. Assumes 40cm shoulder span and 1.9kg per arm; no rope resistance is measured.</p>}
    </div>
    {mode === 'sword' && state.elapsed % 4 > 1.4 && state.elapsed % 4 < 2.8 && <svg className="cb-overlay" viewBox="0 0 640 480" aria-label="Incoming parry projectile"><path d={`M${630 - (state.elapsed % 4 - 1.4) * 280} 150 l-14 -7 v14 Z`} fill="#ffc166" /></svg>}
  </div>
}
