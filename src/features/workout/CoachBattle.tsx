import { useEffect, useRef, useState } from 'react'
import { COMBAT_MODES, combatTick, newCombat, type CombatMode } from './cameraCombatModel'
import type { PoseFrame } from './CoachTrails'
import type { Exercise } from './formModel'
import './coachBattle.css'
export function CoachBattle({ frame, active, demo, mirror, onExercise }: { frame?: PoseFrame; active: boolean; demo: boolean; mirror: boolean; onExercise: (exercise: Exercise) => void }) {
  const [mode, setMode] = useState<CombatMode | ''>('')
  const [paused, setPaused] = useState(false)
  const [state, setState] = useState(newCombat)
  const current = useRef(state)
  useEffect(() => {
    if (!frame || !active || paused || !mode) { current.current = { ...current.current, pose: null, event: false }; return }
    const next = combatTick(current.current, mode, frame.pose, frame.at); current.current = next; setState(next)
  }, [frame, active, paused, mode])
  const reset = () => { const next = newCombat(); current.current = next; setState(next); setPaused(false) }
  return <div className="cb-root" data-mirror={mirror}>
    <div className="cb-menu"><label>Seated camera arcade<select aria-label="Seated camera arcade" value={mode} onChange={e => { const next = e.target.value as CombatMode | ''; reset(); setMode(next); if (next) onExercise('boxing') }}><option value="">Off</option>{COMBAT_MODES.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
      {mode && <><p>{COMBAT_MODES.find(m => m.id === mode)?.cue}</p><button type="button" onClick={() => { current.current.pose = null; setPaused(p => !p) }}>{paused ? 'Resume battle' : 'Pause battle'}</button><button type="button" onClick={reset}>Restart battle</button><p role="status">{demo ? 'Demo · no rewards' : !active ? 'Start camera and calibrate to play' : paused ? 'Battle paused' : 'Camera movement estimates'} · {state.hits} strikes · {state.slips} slips · chain {state.chain} · cue match {state.grade ?? '—'}%</p></>}
    </div>
  </div>
}
