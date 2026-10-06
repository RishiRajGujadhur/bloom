import { DropdownSelect } from '../../components/ui/DropdownSelect'
import { useEffect, useRef, useState } from 'react'
import { COMBAT_MODES, combatTick, cutEfficiency, newCombat, rhythmHit, rhythmTarget, slashTrail, swordPose, type CombatMode } from './cameraCombatModel'
import { bodySilent } from '../body/bodyPreferences'
import { battleDrop, battleMarkdown, readBattles, saveBattle } from './cameraBattleHistory'
import type { CoachReward } from './coachRewards'
import { logActivity } from '../../components/studio/Studio'
import { download } from '../lab/exportSuite'
import type { PoseFrame } from './CoachTrails'
import type { Exercise, P } from './formModel'
import './coachBattle.css'
export function CoachBattle({ frame, frames, active, demo, source, mirror, handControls, onExercise, onReward, onActivity }: { frame?: PoseFrame; frames: PoseFrame[]; active: boolean; demo: boolean; source: string; mirror: boolean; handControls: boolean; onExercise: (exercise: Exercise) => void; onReward?: (reward: CoachReward) => void; onActivity?: (mode: CombatMode | '') => void }) {
  const [mode, setMode] = useState<CombatMode | ''>('')
  useEffect(() => { onActivity?.(mode) }, [mode, onActivity])
  const [paused, setPaused] = useState(false)
  const [weapon, setWeapon] = useState<'broadsword' | 'katana'>('broadsword')
  const [swordHand, setSwordHand] = useState<15 | 16>(15)
  const [goal, setGoal] = useState(10)
  const [defence, setDefence] = useState(true), [slipRange, setSlipRange] = useState(.22)
  const [rhythm, setRhythm] = useState(false), [bpm, setBpm] = useState(80), [audio, setAudio] = useState(false)
  const [melody, setMelody] = useState<'joy' | 'elise'>('joy')
  const [rhythmScore, setRhythmScore] = useState<{ timing: number; precision: number } | null>(null)
  const [flash, setFlash] = useState<{ point: P; damage: number; critical: boolean; at: number } | null>(null)
  const sound = useRef<AudioContext | null>(null), lastBeat = useRef(-1)
  const [state, setState] = useState(() => newCombat())
  const [history, setHistory] = useState(readBattles), [rewardStatus, setRewardStatus] = useState('')
  const session = useRef(''), rewarded = useRef(false), origin = useRef(source)
  const current = useRef(state)
  const root = useRef<HTMLDivElement>(null), pauseButton = useRef<HTMLButtonElement>(null), restartButton = useRef<HTMLButtonElement>(null)
  const [menuOpen, setMenuOpen] = useState(true), [hoverProgress, setHoverProgress] = useState(0)
  const dwell = useRef<{ id: string | null; since: number; latched: string | null }>({ id: null, since: 0, latched: null })
  useEffect(() => { if (!flash) return; const timeout = setTimeout(() => setFlash(null), 800); return () => clearTimeout(timeout) }, [flash])
  useEffect(() => {
    if (frame && active && mode && handControls && source === 'camera' && root.current) {
      const box = root.current.getBoundingClientRect()
      const hands = [15, 16].filter(j => (frame.pose[j]?.visibility ?? 0) >= .65).map(j => ({ x: box.left + (mirror ? 1 - frame.pose[j].x : frame.pose[j].x) * box.width, y: box.top + frame.pose[j].y * box.height }))
      const hover = [['pause', pauseButton.current], ['restart', restartButton.current]].find(([, button]) => { if (!button || typeof button === 'string') return false; const b = button.getBoundingClientRect(); return hands.some(p => p.x >= b.left && p.x <= b.right && p.y >= b.top && p.y <= b.bottom) })?.[0] as string | undefined
      if (!hover) { dwell.current = { id: null, since: 0, latched: null }; setHoverProgress(0) }
      else {
        if (dwell.current.id !== hover) dwell.current = { id: hover, since: frame.at, latched: null }
        const progress = Math.min(1, (frame.at - dwell.current.since) / 2500); setHoverProgress(progress)
        if (progress === 1 && dwell.current.latched !== hover) { dwell.current.latched = hover; if (hover === 'pause') setPaused(v => !v); else reset() }
        current.current.pose = null; return
      }
    } else { dwell.current = { id: null, since: 0, latched: null }; setHoverProgress(0) }
    if (!frame || !active || paused || !mode) { current.current = { ...current.current, pose: null, event: false }; return }
    const next = combatTick(current.current, mode, frame.pose, frame.at, swordHand, rhythm ? bpm : 0, defence, slipRange); current.current = next; setState(next)
    const point = mode === 'sword' ? swordPose(frame.pose, swordHand)?.tip : frame.pose[next.hand]
    if (next.damage && point) setFlash({ point, damage: next.damage, critical: (next.grade ?? 0) >= 90, at: next.elapsed })
    if (rhythm && next.event && point) setRhythmScore(rhythmHit(next.elapsed, bpm, point, Math.abs(frame.pose[11].x - frame.pose[12].x)))
    const drop = origin.current === source ? battleDrop(session.current, mode, next, source) : null
    if (drop && !rewarded.current) {
      rewarded.current = true
      try { setHistory(saveBattle(drop)); setRewardStatus(`Loot: ${drop.item} · ${drop.xp} XP${onReward ? ' · added to Bloom inventory' : ' · local battle journal only'}`) } catch { setRewardStatus('Battle complete. The local journal could not be saved; check device storage.') }
      onReward?.({ id: drop.id, damage: 0, xp: drop.xp, battle: drop })
      logActivity('cameraBattle', { id: drop.id, mode, hits: drop.hits, seconds: drop.seconds })
    }
  }, [frame, active, paused, mode, swordHand, rhythm, bpm, defence, slipRange, source, onReward, handControls, mirror]) // eslint-disable-line react-hooks/exhaustive-deps -- reset uses the current target only when the restart control fires
  useEffect(() => { const next = newCombat(goal); current.current = next; setState(next); origin.current = source; session.current = crypto.randomUUID(); rewarded.current = false; setRewardStatus(''); setFlash(null); setPaused(false); setRhythmScore(null); lastBeat.current = -1 }, [source]) // eslint-disable-line react-hooks/exhaustive-deps -- source changes must reset demo/camera provenance, not target edits
  useEffect(() => () => { void sound.current?.close() }, [])
  useEffect(() => {
    if (!audio || !rhythm || !mode || !active || paused || !state.bossHp || bodySilent() || !sound.current) return
    const beat = Math.floor(state.elapsed / (60 / bpm)); if (beat === lastBeat.current) return; lastBeat.current = beat
    const notes = melody === 'joy' ? [64,64,65,67,67,65,64,62,60,60,62,64,64,62,62] : [76,75,76,75,76,71,74,72,69]
    const ctx = sound.current, tone = ctx.createOscillator(), volume = ctx.createGain()
    tone.frequency.value = 440 * 2 ** ((notes[beat % notes.length] - 69) / 12); volume.gain.setValueAtTime(.05, ctx.currentTime); volume.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .18)
    tone.connect(volume).connect(ctx.destination); tone.start(); tone.stop(ctx.currentTime + .2); tone.onended = () => { tone.disconnect(); volume.disconnect() }
  }, [state.elapsed, state.bossHp, audio, rhythm, mode, active, paused, bpm, melody])
  const reset = () => { const next = newCombat(goal); current.current = next; setState(next); setPaused(false); setRhythmScore(null); setFlash(null); lastBeat.current = -1; session.current = crypto.randomUUID(); rewarded.current = false; origin.current = source; setRewardStatus('') }
  const blade = state.pose && active && mode === 'sword' ? swordPose(state.pose, swordHand) : null
  const x = (value: number) => (mirror ? 1 - value : value) * 640
  const y = (value: number) => value * 480
  const trail = mode === 'sword' ? slashTrail(frames, swordHand) : []
  const trailPath = trail.map((p, i) => p ? `${i === 0 || !trail[i - 1] ? 'M' : 'L'}${x(p.x)},${y(p.y)}` : '').join(' ')
  return <div ref={root} className="cb-root" data-mirror={mirror}>
    {mode && <svg className="cb-overlay" viewBox="0 0 640 480" aria-label={`Pixel boss health ${state.bossHp} of ${state.bossMax}`}><rect x="440" y="18" width="180" height="12" rx="4" fill="#262031" /><rect x="440" y="18" width={180 * state.bossHp / state.bossMax} height="12" rx="4" fill="#ff83b4" /><g className="cb-boss" transform="translate(495 42) scale(2.6)" opacity={state.bossHp ? 1 : .2}><path d="M4 8H8V4H12V0H20V4H24V8H28V24H24V28H8V24H4Z" fill="#9f82ff" shapeRendering="crispEdges" /><path d="M8 10H12V14H8ZM20 10H24V14H20ZM12 20H20V24H12Z" fill="#152639" shapeRendering="crispEdges" /><path d="M0 14H4V22H0ZM28 14H32V22H28Z" fill="#62e8d0" shapeRendering="crispEdges" /></g></svg>}
    {mode === 'sword' && <svg className="cb-overlay" viewBox="0 0 640 480" aria-label="Sword slash trajectory"><path d={trailPath} fill="none" stroke={weapon === 'katana' ? '#ee75ff' : '#6bffe2'} strokeWidth="9" strokeOpacity=".45" strokeLinecap="round" /><path d={trailPath} fill="none" stroke="#ffffff" strokeWidth="2" strokeOpacity=".7" /></svg>}
    {blade && <svg className="cb-overlay" viewBox="0 0 640 480" aria-label={`Empty-hand ${weapon} overlay`}><path className="cb-blade" d={weapon === 'katana' ? `M${x(blade.hilt.x)},${y(blade.hilt.y)} Q${x((blade.hilt.x + blade.tip.x) / 2) + 18},${y((blade.hilt.y + blade.tip.y) / 2)} ${x(blade.tip.x)},${y(blade.tip.y)}` : `M${x(blade.hilt.x)},${y(blade.hilt.y)} L${x(blade.tip.x)},${y(blade.tip.y)}`} stroke={weapon === 'katana' ? '#fd8dff' : '#74ffdb'} strokeWidth={weapon === 'katana' ? 7 : 12} strokeLinecap="round" fill="none" /><circle cx={x(blade.hilt.x)} cy={y(blade.hilt.y)} r="10" fill="#ffc36b" /></svg>}
    <details className="cb-menu" open={menuOpen} onToggle={e => setMenuOpen(e.currentTarget.open)}><summary>Seated arcade {mode ? '· ' + COMBAT_MODES.find(m => m.id === mode)?.name : '· choose activity'}</summary><div className="cb-settings"><label>Seated camera arcade<DropdownSelect aria-label="Seated camera arcade" value={mode} onChange={e => { const next = e.target.value as CombatMode | ''; reset(); setMode(next); setMenuOpen(!next); if (next) onExercise(next === 'cloud' ? 'taiChi' : next === 'ropes' || next === 'doubleRopes' || next === 'sword' ? 'observe' : 'boxing') }}><option value="">Off</option>{COMBAT_MODES.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</DropdownSelect></label>
      {mode === 'sword' && <><label>Virtual weapon<DropdownSelect aria-label="Virtual weapon" value={weapon} onChange={e => setWeapon(e.target.value as typeof weapon)}><option value="broadsword">Broadsword</option><option value="katana">Katana</option></DropdownSelect></label><label>Sword hand<DropdownSelect aria-label="Sword hand" value={swordHand} onChange={e => { setSwordHand(Number(e.target.value) as 15 | 16); reset() }}><option value={15}>Left hand</option><option value={16}>Right hand</option></DropdownSelect></label></>}
      {mode && <label>Boss target (movement cycles)<input aria-label="Boss target cycles" type="number" min="5" max="60" value={goal} onChange={e => { const value = Number(e.target.value); if (Number.isFinite(value) && value >= 5 && value <= 60) setGoal(Math.round(value)) }} /></label>}
      {mode && <><label><input type="checkbox" checked={defence} onChange={e => setDefence(e.target.checked)} />Guard & dodge attacks (off for gentle practice)</label>{mode === 'boxing' && <label>Comfortable slip range<input aria-label="Comfortable slip range" type="range" min=".1" max=".4" step=".02" value={slipRange} onChange={e => setSlipRange(Number(e.target.value))} /></label>}<p>Player HP {state.hp}/100 · {state.hp === 0 ? 'Round ended. Restart when ready.' : state.shield ? 'Posture shield ready' : 'Return to your own neutral posture / defensive cue'}</p></>}
      {mode && <><label><input type="checkbox" checked={rhythm} onChange={e => { setRhythm(e.target.checked); reset() }} />Classical rhythm targets</label>{rhythm && <><label>Rhythm BPM<input aria-label="Battle rhythm BPM" type="number" min="40" max="140" value={bpm} onChange={e => { const v = Number(e.target.value); if (v >= 40 && v <= 140) { setBpm(v); reset() } }} /></label><label>Public-domain motif<DropdownSelect aria-label="Classical motif" value={melody} onChange={e => setMelody(e.target.value as typeof melody)}><option value="joy">Ode to Joy</option><option value="elise">Für Elise</option></DropdownSelect></label><label><input type="checkbox" checked={audio} onChange={async e => { const enabled = e.target.checked; setAudio(enabled); if (enabled) try { sound.current ??= new AudioContext(); await sound.current.resume() } catch { setAudio(false) } }} />Play synthesized motif (respects Silent body cues)</label><p>Timing {rhythmScore?.timing ?? '—'}% · target precision {rhythmScore?.precision ?? '—'}% · hit near the ring on the beat</p></>}</>}
      {mode && <p role="status">{state.bossHp === 0 ? 'Boss defeated! Restart for another round.' : `Boss HP ${state.bossHp}/${state.bossMax} · ${state.damage ? `${state.damage} damage` : 'Land a movement cue above 70%'}`} · changed targets apply on restart.</p>}
      {mode && <><p>{COMBAT_MODES.find(m => m.id === mode)?.cue}</p><p role="status">{demo ? 'Demo · no rewards' : !active ? 'Start camera and calibrate to play' : paused ? 'Battle paused' : 'Camera movement estimates'} · {state.hits} strikes · {state.slips} slips · chain {state.chain} · cue match {state.grade ?? '—'}%</p></>}
      {mode === 'sword' && <p>{state.move} · {state.parries} parries · {state.guard ? 'High guard ready' : 'Raise a comfortable diagonal high guard to parry'} · cut straightness {cutEfficiency(trail) ?? '—'}% · projected path only, not 3D blade-plane accuracy</p>}
      {(mode === 'ropes' || mode === 'doubleRopes') && <p>Downward acceleration {state.acceleration.toFixed(1)} m/s² · power proxy {state.power.toFixed(0)} W. Assumes 40cm shoulder span and 1.9kg per arm; no rope resistance is measured.</p>}
    </div></details>
    {mode && <div className="cb-actions"><button ref={pauseButton} type="button" onClick={() => { current.current.pose = null; setPaused(p => !p) }}>{paused ? 'Resume battle' : 'Pause battle'}</button><button ref={restartButton} type="button" onClick={reset}>Restart battle</button><small>{demo ? 'Demo · no rewards' : paused ? 'Paused' : `${state.hits} cycles · HP ${state.hp}`} {handControls && `· hand hover ${Math.round(hoverProgress * 100)}%`}</small></div>}
    {mode && <div className="cb-journal"><p role="status">{rewardStatus}</p>{history.length > 0 && <details><summary>Battle journal · {history.length} victories</summary><ul>{history.slice(-3).reverse().map(item => <li key={item.id}>{item.item} · {item.xp} XP</li>)}</ul><button type="button" onClick={() => download(new Blob([battleMarkdown(history)], { type: 'text/markdown' }), 'bloom-camera-battle-journal.md')}>Export battle journal (.md)</button></details>}</div>}
    {mode && flash && state.elapsed - flash.at < .8 && <svg key={flash.at} className="cb-overlay" viewBox="0 0 640 480" aria-label={flash.critical ? 'Critical movement hit' : 'Movement hit'}><g className="cb-hit" transform={`translate(${x(flash.point.x)} ${y(flash.point.y)})`} fill={flash.critical ? '#fff075' : '#75ffe0'}>{Array.from({ length: 8 }, (_, i) => <rect key={i} x={Math.round(Math.cos(i * Math.PI / 4) * 22)} y={Math.round(Math.sin(i * Math.PI / 4) * 22)} width="6" height="6" shapeRendering="crispEdges" />)}<text x="0" y="-30" textAnchor="middle" fontFamily="monospace" fontWeight="bold" fontSize="21">{flash.critical ? 'CRIT ' : ''}{flash.damage}</text></g></svg>}
    {mode && defence && state.elapsed >= 5 && state.elapsed % 5 > 2 && state.elapsed % 5 < 3.5 && <svg className="cb-overlay" viewBox="0 0 640 480" aria-label="Seated defence warning"><circle cx={x(state.centre ?? .5)} cy="130" r="42" stroke="#ffad6b" strokeDasharray="8 7" fill="#ff8c4020" /><text x={x(state.centre ?? .5)} y="130" fill="#fff" textAnchor="middle" fontSize="14">{mode === 'boxing' && Math.floor(state.elapsed / 5) % 2 ? 'SLIP' : 'GUARD'}</text></svg>}
    {mode && rhythm && <svg className="cb-overlay" viewBox="0 0 640 480" aria-label="Rhythm strike target"><circle cx={x(rhythmTarget(state.elapsed, bpm).x)} cy={y(.4)} r={18 + rhythmTarget(state.elapsed, bpm).errorMs / 20} stroke="#ffe370" strokeWidth="3" fill="none" /><circle cx={x(rhythmTarget(state.elapsed, bpm).x)} cy={y(.4)} r="5" fill="#ffe370" /></svg>}
    {mode === 'sword' && state.elapsed % 4 > 1.4 && state.elapsed % 4 < 2.8 && <svg className="cb-overlay" viewBox="0 0 640 480" aria-label="Incoming parry projectile"><path d={`M${630 - (state.elapsed % 4 - 1.4) * 280} 150 l-14 -7 v14 Z`} fill="#ffc166" /></svg>}
  </div>
}
