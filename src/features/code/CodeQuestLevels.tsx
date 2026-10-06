import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls, Sparkles } from '@react-three/drei'
import { CuboidCollider, Physics, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { isQuestAnswer, questLevels, type QuestLevel } from './questLevels'
import './codeQuestLevels.css'

const progressKey = 'bloom-code-quest-level-v2'
const groupColors: Record<QuestLevel['group'], string> = { JavaScript: '#f7df1e', HTML: '#ff9264', CSS: '#61c9ff', Flexbox: '#a9ed86' }

function Label({ text, y = 0.55 }: { text: string; y?: number }) {
  return <Html center position={[0, y, 0]} distanceFactor={8} style={{ pointerEvents: 'none' }}><span className="cql-3d-label">{text}</span></Html>
}

function Plinth({ x, z = 0, width = 1.35, color = '#5377b8', label, height = 0.5, onClick }: { x: number; z?: number; width?: number; color?: string; label: string; height?: number; onClick?: () => void }) {
  return <group position={[x, 0, z]} onClick={onClick}>
    <mesh castShadow position={[0, height / 2, 0]}><boxGeometry args={[width, height, 1]} /><meshStandardMaterial color={color} roughness={0.34} metalness={0.2} /></mesh>
    <Label text={label} y={height + 0.24} />
  </group>
}

function FloatingCrate({ pick }: { pick: string | undefined }) {
  const body = useRef<RapierRigidBody>(null)
  const target = pick === 'float: left' ? -1.9 : pick === 'float: right' ? 1.9 : 0
  useFrame((_, delta) => {
    const rigid = body.current
    if (!rigid) return
    const p = rigid.translation(), v = rigid.linvel(), mass = rigid.mass(), dt = Math.min(delta, 0.05)
    const targetY = pick && pick !== 'float: none' ? 1.18 : 0.64
    rigid.applyImpulse({ x: ((target - p.x) * 18 - v.x * 6) * mass * dt, y: (9.81 + (targetY - p.y) * 22 - v.y * 8) * mass * dt, z: (-p.z * 18 - v.z * 6) * mass * dt }, true)
  })
  return <RigidBody ref={body} colliders={false} position={[0, 0.64, 0]} angularDamping={5} linearDamping={0.5}>
    <CuboidCollider args={[0.63, 0.48, 0.55]} />
    <mesh castShadow><boxGeometry args={[1.26, 0.96, 1.1]} /><meshStandardMaterial color="#f9b65f" roughness={0.4} /></mesh>
    <Label text="rescue crate" y={0.76} />
  </RigidBody>
}

function FlexDisplay({ level, pick }: { level: QuestLevel; pick: string | undefined }) {
  const positions = level.kind === 'direction'
    ? (pick === 'column' ? [[0, 0.6, -1.1], [0, 0.6, 0], [0, 0.6, 1.1]] : [[-1.7, 0.6, 0], [0, 0.6, 0], [1.7, 0.6, 0]])
    : level.kind === 'justify'
      ? (pick === 'space-between' ? [[-2.7, 0.6, 0], [0, 0.6, 0], [2.7, 0.6, 0]] : pick === 'center' ? [[-1.1, 0.6, 0], [0, 0.6, 0], [1.1, 0.6, 0]] : [[-2.7, 0.6, 0], [-1.6, 0.6, 0], [-0.5, 0.6, 0]])
      : [[-1.8, pick === 'center' ? 1.25 : pick === 'flex-end' ? 0.45 : 2.05, 0], [0, pick === 'center' ? 1.25 : pick === 'flex-end' ? 0.65 : 1.85, 0], [1.8, pick === 'center' ? 1.25 : pick === 'flex-end' ? 0.85 : 1.65, 0]]
  return <>
    <mesh receiveShadow position={[0, 0.02, 0]}><boxGeometry args={[7.1, 0.08, level.kind === 'direction' ? 4.5 : 2.4]} /><meshStandardMaterial color="#25345c" /></mesh>
    {positions.map(([x, y, z], i) => <group key={i} position={[x, y, z]}>
      <mesh castShadow><boxGeometry args={[0.88, level.kind === 'align' ? 0.65 + i * 0.4 : 0.76, 0.78]} /><meshStandardMaterial color={['#f8ba62', '#72d6f8', '#a6ee87'][i]} /></mesh>
      <Label text={String.fromCharCode(65 + i)} y={0.7 + (level.kind === 'align' ? i * 0.2 : 0)} />
    </group>)}
  </>
}

function QuestScene({ level, picks, choose, solved }: { level: QuestLevel; picks: string[]; choose: (option: string) => void; solved: boolean }) {
  const kind = level.kind, pick = picks[0]
  return <Canvas shadows camera={{ position: [0, 5.2, 8.5], fov: 44 }}>
    <color attach="background" args={[kind === 'float' ? '#13324a' : '#111b38']} />
    <ambientLight intensity={1.5} />
    <directionalLight position={[4, 8, 5]} intensity={2.5} castShadow />
    <pointLight position={[-3, 2, 0]} color={groupColors[level.group]} intensity={5} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshStandardMaterial color="#182747" roughness={0.75} /></mesh>
    {kind === 'gate' && level.options.map((option, i) => <group key={option} position={[(i - 1) * 2.4, 0, 0]} onClick={(e) => { e.stopPropagation(); choose(option) }}>
      <mesh castShadow position={[0, 1.1, 0]}><torusGeometry args={[0.8, 0.16, 14, 36]} /><meshStandardMaterial color={pick === option ? '#a5ffb2' : '#6789d9'} emissive={pick === option ? '#3fbc71' : '#233a86'} emissiveIntensity={0.8} /></mesh>
      <mesh position={[0, 0.95, 0]}><circleGeometry args={[0.64, 32]} /><meshStandardMaterial color="#3b609e" transparent opacity={0.38} side={2} /></mesh>
      <Label text={option} y={2.15} />
    </group>)}
    {kind === 'stack' && <>{Array.from({ length: 4 }, (_, i) => <Plinth key={i} x={(i - 1.5) * 1.9} z={0} width={1.65} height={0.25 + i * 0.12} label={picks[i] ?? `slot ${i + 1}`} color={picks[i] ? '#ff9264' : '#4b648e'} />)}</>}
    {kind === 'landmarks' && <>{['top', 'content', 'bottom'].map((part, i) => <Plinth key={part} x={0} z={(i - 1) * 1.55} width={4.5} height={0.44} label={`${part}: ${picks[i] ?? '?'}`} color={picks[i] ? '#ff9264' : '#46577c'} />)}</>}
    {kind === 'form' && <><Plinth x={-1.7} width={2.2} height={0.8} label={pick ? 'label connected' : 'label ?'} color={pick === level.answer[0] ? '#70d6a8' : '#e2a575'} /><Plinth x={1.7} width={2.2} height={0.8} label='input id="email"' color="#8dbfea" /><mesh position={[0, 0.54, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.045, 0.045, 1.2]} /><meshStandardMaterial color={pick === level.answer[0] ? '#65ffa7' : '#7288b2'} /></mesh></>}
    {kind === 'selector' && <>{['class="beacon"', 'id="other"', '<beacon>'].map((text, i) => <Plinth key={text} x={(i - 1) * 2.3} width={2.05} height={0.8} label={text} color={i === 0 && pick ? '#78e9be' : '#6984b8'} />)}</>}
    {kind === 'float' && <Suspense fallback={null}><Physics gravity={[0, -9.81, 0]}><CuboidCollider position={[0, -0.26, 0]} args={[5, 0.15, 3]} /><FloatingCrate pick={pick} /></Physics><group position={[pick === 'float: left' ? 0.9 : pick === 'float: right' ? -0.9 : 0, 0, -1.4]}>{[0, 1, 2].map((i) => <mesh key={i} position={[0, 0.22 + i * 0.18, 0]}><boxGeometry args={[pick === 'float: none' || !pick ? 4 : 2.6, 0.08, 0.14]} /><meshStandardMaterial color="#9dd5e7" /></mesh>)}<Label text="wrapping text" y={0.94} /></group></Suspense>}
    {kind === 'cascade' && <><Plinth x={0} width={2.4} height={1.25} label={pick ? `${pick} wins?` : 'which color wins?'} color={pick === 'orange' ? '#f7a24c' : pick === 'blue' ? '#5591df' : '#7589ad'} /><Plinth x={-2.8} width={1.4} label='.card' color="#5591df" /><Plinth x={2.8} width={1.4} label='#hero' color="#f7a24c" /></>}
    {(kind === 'direction' || kind === 'justify' || kind === 'align') && <FlexDisplay level={level} pick={pick} />}
    {solved && <Sparkles count={90} scale={[8, 5, 5]} color="#b8ffae" />}
    <OrbitControls enablePan={false} minDistance={6} maxDistance={15} maxPolarAngle={1.35} />
  </Canvas>
}

export function CodeQuestLevels({ onReplay, onMilestone }: { onReplay: () => void; onMilestone?: (level: number) => void }) {
  const [unlocked, setUnlocked] = useState(() => { try { return Math.max(3, Math.min(13, Number(localStorage.getItem(progressKey)) || 3)) } catch { return 3 } })
  const [number, setNumber] = useState(() => Math.min(unlocked, 12))
  const [picks, setPicks] = useState<string[]>([])
  const [solved, setSolved] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [hint, setHint] = useState(false)
  const level = questLevels.find((item) => item.number === number) ?? questLevels[0]
  const sequence = level.kind === 'stack' || level.kind === 'landmarks'
  const choose = (option: string) => { if (solved) return; setPicks((before) => sequence ? [...before, option].slice(0, level.answer.length) : [option]); setFeedback('') }
  const visit = (next: number) => { if (next > unlocked) return; setNumber(next); setPicks([]); setSolved(false); setFeedback(''); setHint(false) }
  const check = () => {
    if (isQuestAnswer(level, picks)) {
      setSolved(true); setFeedback(level.success)
      const next = Math.max(unlocked, level.number + 1)
      setUnlocked(next)
      try { localStorage.setItem(progressKey, String(next)) } catch { /* storage unavailable */ }
      if (level.number >= unlocked) onMilestone?.(level.number)
    } else setFeedback(sequence ? 'Those pieces are out of order. Undo or reset and try again.' : 'That choice does not match the goal. Try another one.')
  }
  const finished = unlocked === 13
  return <div className="cql-wrap">
    <header className="cql-head"><div><small>3D CODE QUEST · LEVELS 3–12</small><h2>{finished ? 'All worlds unlocked' : 'Choose your next challenge'}</h2><p>Build, experiment, and run each idea in a small 3D world.</p></div><button className="studio-btn" onClick={onReplay}>Replay levels 1–2</button></header>
    <nav className="cql-map" aria-label="Code Quest levels">{(['JavaScript', 'HTML', 'CSS', 'Flexbox'] as const).map((group) => <div className="cql-group" key={group} style={{ ['--cql-accent' as string]: groupColors[group] }}><strong>{group}</strong><div>{questLevels.filter((item) => item.group === group).map((item) => <button key={item.number} type="button" className={number === item.number ? 'active' : ''} disabled={item.number > unlocked} onClick={() => visit(item.number)} aria-label={`Level ${item.number}: ${item.title}${item.number > unlocked ? ', locked' : ''}`}><span>{item.number < unlocked ? '✓' : item.number}</span>{item.title}</button>)}</div></div>)}</nav>
    <div className="cql-challenge" style={{ ['--cql-accent' as string]: groupColors[level.group] }}>
      <div className="cql-intro"><div><small>{level.group.toUpperCase()} · LEVEL {level.number} OF 12</small><h3>{level.title}</h3><p>{level.lesson}</p></div><div className="cql-progress">{Math.min(unlocked - 1, 12)} / 12 cleared</div></div>
      <div className="cql-stage"><QuestScene level={level} picks={picks} choose={choose} solved={solved} /></div>
      <div className="cql-task"><strong>Mission</strong><p>{level.task}</p></div>
      <div className="cql-options bloom-wrap" role="group" aria-label="Choose code or layout">{level.options.map((option) => <button key={option} type="button" onClick={() => choose(option)} disabled={solved || (sequence && (picks.includes(option) || picks.length === level.answer.length))} className={picks.includes(option) ? 'picked' : ''}><code>{option}</code></button>)}</div>
      {sequence && <div className="cql-sequence bloom-controls"><strong>Build order:</strong> {picks.length ? picks.map((item, i) => <code key={`${item}-${i}`}>{i + 1}. {item}</code>) : <span>Pick the first piece above.</span>}<button className="studio-btn" onClick={() => { setPicks((list) => list.slice(0, -1)); setFeedback('') }} disabled={!picks.length || solved}>Undo</button><button className="studio-btn" onClick={() => { setPicks([]); setFeedback('') }} disabled={!picks.length || solved}>Reset</button></div>}
      {feedback && <p className={`cql-feedback ${solved ? 'success' : 'error'}`} role="status">{feedback}</p>}
      <div className="cql-actions bloom-controls"><button className="studio-btn" onClick={() => setHint((value) => !value)}>{hint ? 'Hide hint' : 'Hint'}</button>{hint && <span className="cql-hint">{level.hint}</span>}<button className="cd-run" disabled={!picks.length || solved} onClick={check}>Run level</button>{solved && (level.number < 12 ? <button className="cd-run" onClick={() => visit(level.number + 1)}>Next level →</button> : <span className="cql-finale">🏆 Quest complete! Revisit any unlocked level above.</span>)}</div>
    </div>
  </div>
}
