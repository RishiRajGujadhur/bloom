import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls, Sparkles } from '@react-three/drei'
import { CuboidCollider, Physics, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import gsap from 'gsap'
import type { Group } from 'three'
import './codeGame.css'
import { CodeQuestLevels } from './CodeQuestLevels'

type Stage = 'raft' | 'awaken' | 'maze' | 'done' | 'expanded'
type Command = 'forward' | 'left' | 'right'
const correctOrder = ['const spark = 3;', 'const glow = spark * 2;', 'console.log(glow);']
const initialOrder = [correctOrder[2], correctOrder[0], correctOrder[1]]
const maze = [
  'S..##',
  '##.##',
  '##...',
  '####.',
  '####G',
]
const solution: Command[] = ['forward', 'forward', 'right', 'forward', 'forward', 'left', 'forward', 'forward', 'right', 'forward', 'forward']
const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]]
const key = 'bloom-code-quest-v1'

function FloatingBlock({ code, index, selected, alive, onClick, sink, failed }: { code: string; index: number; selected: boolean; alive: boolean; onClick: () => void; sink: number; failed: boolean }) {
  const body = useRef<RapierRigidBody>(null)
  useFrame(({ clock }, delta) => {
    const rigid = body.current
    if (!rigid || failed) return
    const position = rigid.translation(), velocity = rigid.linvel()
    const targetY = (alive ? 0.9 : 0.48 - sink * 0.012) + Math.sin(clock.elapsedTime * 2 + index) * 0.045
    const mass = rigid.mass()
    const dt = Math.min(delta, 0.05)
    rigid.applyImpulse({
      x: ((index - 1) * 2.8 - position.x) * 18 * mass * dt - velocity.x * 6 * mass * dt,
      y: (9.81 + (targetY - position.y) * 22 - velocity.y * 8) * mass * dt,
      z: (-position.z * 18 - velocity.z * 6) * mass * dt,
    }, true)
  })
  return <RigidBody ref={body} colliders={false} position={[(index - 1) * 2.8, 0.48, 0]} linearDamping={0.4} angularDamping={3} restitution={0.25}>
    <CuboidCollider args={[1.25, 0.275, 0.525]} />
    <group onClick={(e) => { e.stopPropagation(); onClick() }}>
    <mesh castShadow>
      <boxGeometry args={[2.5, 0.55, 1.05]} />
      <meshStandardMaterial color={alive ? '#48e3a2' : selected ? '#ffe17a' : '#557bdf'} emissive={alive ? '#138c5c' : selected ? '#8b6110' : '#1a2e74'} emissiveIntensity={0.42} roughness={0.3} metalness={0.22} />
    </mesh>
    {alive && <mesh position={[0, 0.42, 0]}><sphereGeometry args={[0.13, 12, 12]} /><meshStandardMaterial color="#fff4b0" emissive="#ffcf40" emissiveIntensity={2} /></mesh>}
    <Html center position={[0, 0.32, 0.55]} distanceFactor={9} style={{ pointerEvents: 'none' }}><span className="cq-block-label">{code}</span></Html>
    </group>
  </RigidBody>
}

function WaterScene({ order, selected, alive, sink, failed, pick }: { order: string[]; selected: number | null; alive: boolean; sink: number; failed: boolean; pick: (i: number) => void }) {
  return <Canvas shadows camera={{ position: [0, 4.7, 8.5], fov: 43 }}>
    <color attach="background" args={['#091c38']} />
    <ambientLight intensity={1.4} />
    <directionalLight position={[4, 8, 5]} intensity={2.5} castShadow />
    <pointLight position={[0, 1, -2]} color="#54c9ff" intensity={8} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}><planeGeometry args={[80, 80]} /><meshStandardMaterial color="#076998" transparent opacity={0.82} metalness={0.55} roughness={0.18} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.31, 0]}><planeGeometry args={[10, 3]} /><meshStandardMaterial color="#51d5ff" transparent opacity={0.18} /></mesh>
    <Suspense fallback={null}><Physics gravity={[0, -9.81, 0]}>
      <CuboidCollider position={[0, -3.5, 0]} args={[8, 0.3, 5]} />
      {order.map((code, i) => <FloatingBlock key={code} code={code} index={i} selected={selected === i} alive={alive} sink={sink} failed={failed} onClick={() => pick(i)} />)}
    </Physics></Suspense>
    {alive && <Sparkles count={70} scale={[9, 3, 4]} size={4} color="#a2ffad" />}
    <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={0.55} maxPolarAngle={1.3} />
  </Canvas>
}

function Robot({ cell, facing, won }: { cell: [number, number]; facing: number; won: boolean }) {
  const ref = useRef<Group>(null)
  useEffect(() => {
    if (!ref.current) return
    gsap.to(ref.current.position, { x: cell[0] - 2, z: cell[1] - 2, duration: 0.3, ease: 'power2.inOut' })
    gsap.to(ref.current.rotation, { y: -facing * Math.PI / 2, duration: 0.25 })
  }, [cell, facing])
  useFrame(({ clock }) => { if (ref.current) ref.current.position.y = 0.38 + Math.sin(clock.elapsedTime * (won ? 8 : 3)) * (won ? 0.14 : 0.04) })
  return <group ref={ref} position={[cell[0] - 2, 0.38, cell[1] - 2]}>
    <mesh castShadow><boxGeometry args={[0.55, 0.65, 0.5]} /><meshStandardMaterial color={won ? '#58ffab' : '#ffc557'} metalness={0.45} roughness={0.3} /></mesh>
    <mesh position={[0, 0.08, 0.27]}><boxGeometry args={[0.3, 0.16, 0.04]} /><meshStandardMaterial color="#10223a" /></mesh>
    <mesh position={[0.1, 0.08, 0.3]}><boxGeometry args={[0.055, 0.055, 0.02]} /><meshBasicMaterial color="#62f9ff" /></mesh>
    <mesh position={[-0.1, 0.08, 0.3]}><boxGeometry args={[0.055, 0.055, 0.02]} /><meshBasicMaterial color="#62f9ff" /></mesh>
    <mesh position={[0, 0.43, 0]}><sphereGeometry args={[0.085, 12, 12]} /><meshStandardMaterial color="#fff" emissive="#ffb52e" emissiveIntensity={2} /></mesh>
  </group>
}

function MazeScene({ cell, facing, won }: { cell: [number, number]; facing: number; won: boolean }) {
  return <Canvas shadows camera={{ position: [5.4, 8, 7], fov: 43 }}>
    <color attach="background" args={['#10172e']} />
    <ambientLight intensity={1.3} />
    <directionalLight position={[3, 8, 4]} intensity={2.6} castShadow />
    <pointLight position={[2, 2, 2]} color="#47eec0" intensity={6} />
    {maze.flatMap((row, z) => [...row].map((tile, x) => <group key={`${x}-${z}`} position={[x - 2, 0, z - 2]}>
      <mesh receiveShadow position={[0, -0.16, 0]}><boxGeometry args={[0.96, 0.3, 0.96]} /><meshStandardMaterial color={tile === '#' ? '#303a62' : tile === 'G' ? '#14865e' : '#26385d'} /></mesh>
      {tile === '#' && <mesh castShadow position={[0, 0.34, 0]}><boxGeometry args={[0.94, 0.7, 0.94]} /><meshStandardMaterial color="#4b5b91" roughness={0.42} /></mesh>}
      {tile === 'G' && <mesh position={[0, 0.22, 0]}><torusGeometry args={[0.25, 0.07, 12, 30]} /><meshStandardMaterial color="#7bffb3" emissive="#1bcb69" emissiveIntensity={1.3} /></mesh>}
    </group>))}
    <Robot cell={cell} facing={facing} won={won} />
    {won && <Sparkles count={80} scale={6} color="#a4ffcc" />}
    <OrbitControls enablePan={false} minDistance={7} maxDistance={15} maxPolarAngle={1.3} />
  </Canvas>
}

export function CodeGame({ onMilestone }: { onMilestone?: (level: number) => void }) {
  const [stage, setStage] = useState<Stage>(() => { try { return localStorage.getItem(key) === 'done' ? 'expanded' : 'raft' } catch { return 'raft' } })
  const [order, setOrder] = useState(initialOrder)
  const [selected, setSelected] = useState<number | null>(null)
  const [time, setTime] = useState(40)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('Select two blocks to swap them before they sink.')
  const [commands, setCommands] = useState<Command[]>([])
  const [cell, setCell] = useState<[number, number]>([0, 0])
  const [facing, setFacing] = useState(0)
  const [executing, setExecuting] = useState(false)
  const cancel = useRef(false)
  useEffect(() => {
    if (!running || stage !== 'raft') return
    const id = window.setInterval(() => setTime((t) => Math.max(0, t - 1)), 1000)
    return () => window.clearInterval(id)
  }, [running, stage])
  useEffect(() => { if (time === 0 && running) { setRunning(false); setSelected(null); setMessage('The blocks sank! Reset the raft and try again.') } }, [time, running])
  useEffect(() => () => { cancel.current = true }, [])
  const alive = stage === 'awaken'
  const pick = (i: number) => {
    if (stage !== 'raft' || time === 0) return
    if (!running) setRunning(true)
    if (selected === null) return setSelected(i)
    if (selected === i) return setSelected(null)
    const next = [...order]
    ;[next[selected], next[i]] = [next[i], next[selected]]
    setOrder(next)
    setSelected(null)
    if (next.every((item, at) => item === correctOrder[at])) {
      setRunning(false)
      setMessage('Your code came alive! The spark bot has opened the maze.')
      setStage('awaken')
      onMilestone?.(1)
    } else setMessage('Keep the program in the order it runs: declare, calculate, print.')
  }
  const resetRaft = () => { setOrder(initialOrder); setSelected(null); setTime(40); setRunning(false); setMessage('Select two blocks to swap them before they sink.') }
  const add = (command: Command) => { if (!executing) setCommands((list) => [...list, command]) }
  const play = async () => {
    if (executing || !commands.length) return
    setExecuting(true)
    setMessage('Robot is running your command sequence…')
    let x = 0, z = 0, direction = 0, crashed = false
    setCell([0, 0]); setFacing(0)
    for (const command of commands) {
      if (cancel.current) return
      await new Promise((resolve) => window.setTimeout(resolve, 430))
      if (cancel.current) return
      if (command === 'left') direction = (direction + 3) % 4
      else if (command === 'right') direction = (direction + 1) % 4
      else {
        const nx = x + dirs[direction][0], nz = z + dirs[direction][1]
        if (!maze[nz]?.[nx] || maze[nz][nx] === '#') { crashed = true; break }
        x = nx; z = nz
      }
      setCell([x, z]); setFacing(direction)
    }
    if (cancel.current) return
    setExecuting(false)
    if (crashed) setMessage('The robot hit a wall. Edit the commands and run again.')
    else if (maze[z][x] === 'G') { setStage('expanded'); setMessage('Maze complete! Your robot reached the portal.'); try { localStorage.setItem(key, 'done') } catch { /* storage unavailable */ }; onMilestone?.(2) }
    else setMessage('The robot stopped before the portal. Add more commands.')
  }
  const progress = useMemo(() => Math.round((time / 40) * 100), [time])
  if (stage === 'expanded') return <CodeQuestLevels onMilestone={onMilestone} onReplay={() => { setStage('raft'); resetRaft(); setCommands([]); setCell([0, 0]); setFacing(0) }} />
  return <div className="cq-game">
    <div className="cq-header"><div><small>PROGRAMMER TRAINING · 3D QUEST</small><h3>{stage === 'raft' ? 'Level 1 · The sinking syntax' : stage === 'awaken' ? 'The blocks are alive!' : stage === 'maze' ? 'Level 2 · Program the robot' : 'Quest complete!'}</h3><p>{stage === 'raft' ? 'Put the JavaScript lines in execution order before the water takes them.' : stage === 'awaken' ? 'Your program woke the blocks and opened a path to the next challenge.' : 'Build a command sequence to guide the robot through the maze to the green portal.'}</p></div><span className="cq-level">{stage === 'raft' || stage === 'awaken' ? '01 / 02' : '02 / 02'}</span></div>
    <div className="cq-scene" role="img" aria-label={stage === 'raft' || stage === 'awaken' ? 'Three floating code blocks above water' : 'Three-dimensional robot maze'}>{stage === 'raft' || stage === 'awaken' ? <WaterScene order={order} selected={selected} alive={alive} sink={40 - time} failed={time === 0} pick={pick} /> : <MazeScene cell={cell} facing={facing} won={stage === 'done'} />}</div>
    <p className="cq-message" role="status">{message}</p>
    {stage === 'raft' ? <div className="cq-controls"><div className="cq-timer"><span>Water rising · {time}s</span><div><i style={{ width: `${progress}%` }} /></div></div><div className="cq-blocks">{order.map((code, i) => <button key={code} type="button" className={selected === i ? 'selected' : ''} onClick={() => pick(i)} disabled={time === 0}><b>{i + 1}</b><code>{code}</code></button>)}</div><button className="studio-btn" onClick={resetRaft}>Reset raft</button></div> : stage === 'awaken' ? <button className="cd-run" onClick={() => { setStage('maze'); setMessage('Build a program to reach the green portal.') }}>Enter level 2 →</button> : <div className="cq-controls"><div className="cq-command-bar"><button onClick={() => add('forward')} disabled={executing || stage === 'done'}>↑ Forward</button><button onClick={() => add('left')} disabled={executing || stage === 'done'}>↶ Turn left</button><button onClick={() => add('right')} disabled={executing || stage === 'done'}>↷ Turn right</button><button className="studio-btn" onClick={() => setCommands([])} disabled={executing || stage === 'done'}>Clear</button><button className="cd-run" onClick={play} disabled={executing || stage === 'done' || !commands.length}>{executing ? 'Running…' : 'Run program'}</button></div><div className="cq-program"><strong>Program</strong>{commands.length ? commands.map((command, i) => <button key={i} title="Remove command" disabled={executing || stage === 'done'} onClick={() => setCommands((list) => list.filter((_, j) => j !== i))}>{i + 1}. {command} ×</button>) : <span>Add commands above. Tip: move across, down, across, then down.</span>}</div>{stage === 'maze' && <button className="cq-hint" onClick={() => setCommands(solution)}>Show solution sequence</button>}{stage === 'done' && <button className="cd-run" onClick={() => { setStage('raft'); resetRaft(); setCommands([]); setCell([0, 0]); setFacing(0) }}>Play again</button>}</div>}
  </div>
}
