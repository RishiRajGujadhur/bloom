import { useEffect, useRef, useState } from 'react'
import { COMBAT_MODES, combatTick, newCombat, swordPose, type CombatMode } from './cameraCombatModel'
import type { PoseFrame } from './CoachTrails'
import type { Exercise } from './formModel'
import './coachBattle.css'
export function CoachBattle({ frame, active, demo, mirror, onExercise }: { frame?: PoseFrame; active: boolean; demo: boolean; mirror: boolean; onExercise: (exercise: Exercise) => void }) {
  const [mode, setMode] = useState<CombatMode | ''>('')
  const [paused, setPaused] = useState(false)
  const [weapon, setWeapon] = useState<'broadsword' | 'katana'>('broadsword')
  const [swordHand, setSwordHand] = useState<15 | 16>(15)
  const [state, setState] = useState(newCombat)
  const current = useRef(state)
  useEffect(() => {
    if (!frame || !active || paused || !mode) { current.current = { ...current.current, pose: null, event: false }; return }
    const next = combatTick(current.current, mode, frame.pose, frame.at); current.current = next; setState(next)
  }, [frame, active, paused, mode])
  const reset = () => { const next = newCombat(); current.current = next; setState(next); setPaused(false) }
  const blade = state.pose && mode === 'sword' ? swordPose(state.pose, swordHand) : null
  const x = (value: number) => (mirror ? 1 - value : value) * 640
  const y = (value: number) => value * 480
  return <div className="cb-root" data-mirror={mirror}>
    {blade && <svg className="cb-overlay" viewBox="0 0 640 480" aria-label={`Empty-hand ${weapon} overlay`}><path className="cb-blade" d={weapon === 'katana' ? `M${x(blade.hilt.x)},${y(blade.hilt.y)} Q${x((blade.hilt.x + blade.tip.x) / 2) + 18},${y((blade.hilt.y + blade.tip.y) / 2)} ${x(blade.tip.x)},${y(blade.tip.y)}` : `M${x(blade.hilt.x)},${y(blade.hilt.y)} L${x(blade.tip.x)},${y(blade.tip.y)}`} stroke={weapon === 'katana' ? '#fd8dff' : '#74ffdb'} strokeWidth={weapon === 'katana' ? 7 : 12} strokeLinecap="round" fill="none" /><circle cx={x(blade.hilt.x)} cy={y(blade.hilt.y)} r="10" fill="#ffc36b" /></svg>}
    <div className="cb-menu"><label>Seated camera arcade<select aria-label="Seated camera arcade" value={mode} onChange={e => { const next = e.target.value as CombatMode | ''; reset(); setMode(next); if (next) onExercise(next === 'cloud' ? 'taiChi' : next === 'ropes' || next === 'doubleRopes' || next === 'sword' ? 'observe' : 'boxing') }}><option value="">Off</option>{COMBAT_MODES.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
      {mode === 'sword' && <><label>Virtual weapon<select aria-label="Virtual weapon" value={weapon} onChange={e => setWeapon(e.target.value as typeof weapon)}><option value="broadsword">Broadsword</option><option value="katana">Katana</option></select></label><label>Sword hand<select aria-label="Sword hand" value={swordHand} onChange={e => { setSwordHand(Number(e.target.value) as 15 | 16); reset() }}><option value={15}>Left hand</option><option value={16}>Right hand</option></select></label></>}
      {mode && <><p>{COMBAT_MODES.find(m => m.id === mode)?.cue}</p><button type="button" onClick={() => { current.current.pose = null; setPaused(p => !p) }}>{paused ? 'Resume battle' : 'Pause battle'}</button><button type="button" onClick={reset}>Restart battle</button><p role="status">{demo ? 'Demo · no rewards' : !active ? 'Start camera and calibrate to play' : paused ? 'Battle paused' : 'Camera movement estimates'} · {state.hits} strikes · {state.slips} slips · chain {state.chain} · cue match {state.grade ?? '—'}%</p></>}
      {(mode === 'ropes' || mode === 'doubleRopes') && <p>Downward acceleration {state.acceleration.toFixed(1)} m/s² · power proxy {state.power.toFixed(0)} W. Assumes 40cm shoulder span and 1.9kg per arm; no rope resistance is measured.</p>}
    </div>
  </div>
}
