import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { Joyride, EVENTS, STATUS, type EventData, type Step } from 'react-joyride'
import { motion } from 'framer-motion'
import {
  Compass,
  Crown,
  Flame,
  Lock,
  Map,
  Shield,
  ShoppingBag,
  Sparkles,
  Sword,
  Zap,
} from 'lucide-react'
import { morphActionIcon } from './morphActionIcon'

const LottiePlayer = lazy(async () => {
  const module = await import('@lottiefiles/react-lottie-player')
  return { default: module.Player }
})

export type SkillNodeState = 'locked' | 'available' | 'unlocked'

export interface SkillNode {
  id: string
  title: string
  subtitle: string
  state: SkillNodeState
  x: number
  y: number
}

export interface LiquidProgressBarProps {
  label: string
  value: number
  max: number
  tone: 'exp' | 'hp' | 'mana'
}

export interface ShopItem {
  id: string
  name: string
  description: string
  cost: number
  icon: 'shield' | 'sparkles'
}

const skillNodes: SkillNode[] = [
  { id: 'mindfulness', title: 'Mindfulness', subtitle: 'Root skill', state: 'unlocked', x: 8, y: 48 },
  { id: 'breathwork', title: '5-Min Breathwork', subtitle: 'Steady the signal', state: 'unlocked', x: 31, y: 25 },
  { id: 'meditation', title: '20-Min Meditation', subtitle: 'Hold your focus', state: 'available', x: 53, y: 67 },
  { id: 'zen', title: 'Zen State', subtitle: 'Legendary calm', state: 'locked', x: 80, y: 38 },
]

const shopItems: ShopItem[] = [
  { id: 'shield', name: 'Streak Shield', description: 'Protect one missed day.', cost: 120, icon: 'shield' },
  { id: 'elixir', name: 'Focus Elixir', description: 'Double your next reflection EXP.', cost: 80, icon: 'sparkles' },
]

const tourSteps: Step[] = [
  { target: '.skill-tree-panel', content: 'Your skill tree turns tiny rituals into a visible path toward Zen State.', placement: 'bottom' },
  { target: '.shop-panel', content: 'Spend mock gold on gentle safety nets and focus boosts.', placement: 'left' },
  { target: '.raid-panel', content: 'Daily actions become attacks against the weekly raid boss.', placement: 'top' },
  { target: '.grace-panel', content: 'Grace Days protect your progress when life needs a pause.', placement: 'top' },
]

function clamp(value: number, max: number) {
  return Math.min(max, Math.max(0, value))
}

export function LiquidProgressBar({ label, value, max, tone }: LiquidProgressBarProps) {
  const percent = (clamp(value, max) / max) * 100
  const gradientId = `liquid-${tone}`
  return (
    <div className={`liquid-meter liquid-${tone}`} aria-label={`${label}: ${value} of ${max}`}>
      <div className="liquid-meter-heading"><span>{label}</span><strong>{value} / {max}</strong></div>
      <svg className="liquid-svg" viewBox="0 0 320 28" role="img" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity=".55" />
            <stop offset="100%" stopColor="currentColor" />
          </linearGradient>
          <clipPath id={`${gradientId}-clip`}><rect width="320" height="28" rx="14" /></clipPath>
        </defs>
        <rect className="liquid-track" width="320" height="28" rx="14" />
        <g clipPath={`url(#${gradientId}-clip)`}>
          <motion.path
            className="liquid-wave"
            d={`M ${percent * 3.2 - 320} 15 Q ${percent * 3.2 - 280} 4 ${percent * 3.2 - 240} 15 T ${percent * 3.2 - 160} 15 T ${percent * 3.2 - 80} 15 T ${percent * 3.2} 15 V 28 H ${percent * 3.2 - 320} Z`}
            fill={`url(#${gradientId})`}
            animate={{ x: [0, 18, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </g>
      </svg>
    </div>
  )
}

function SkillTree() {
  return (
    <section className="gamify-panel skill-tree-panel" aria-labelledby="skill-tree-title">
      <div className="gamify-panel-heading"><div><span className="gamify-kicker"><Map size={13} /> PATH OF PRACTICE</span><h3 id="skill-tree-title">Your skill tree</h3></div><span className="tree-progress">2 / 4 unlocked</span></div>
      <div className="skill-tree" role="list" aria-label="Mindfulness skill tree">
        <svg className="skill-connectors" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <motion.path d="M 13 53 C 21 53 22 31 36 31" />
          <motion.path d="M 36 31 C 44 31 44 72 58 72" />
          <motion.path d="M 58 72 C 67 72 69 44 85 44" />
        </svg>
        {skillNodes.map((node) => (
          <div key={node.id} className={`skill-node skill-${node.state}`} style={{ left: `${node.x}%`, top: `${node.y}%` }} role="listitem">
            <div className="skill-node-orb">{node.state === 'locked' ? <Lock size={15} /> : <Sparkles size={15} />}</div>
            <strong>{node.title}</strong><small>{node.subtitle}</small>
          </div>
        ))}
      </div>
      <p className="gamify-note">Complete the available practice to illuminate the next branch.</p>
    </section>
  )
}

function ShopPanel() {
  const [gold, setGold] = useState(240)
  const [owned, setOwned] = useState<string[]>([])
  return (
    <section className="gamify-panel shop-panel" aria-labelledby="shop-title">
      <div className="gamify-panel-heading"><div><span className="gamify-kicker"><ShoppingBag size={13} /> THE WAYFARER&apos;S SHOP</span><h3 id="shop-title">Useful magic</h3></div><strong className="gold-balance">✦ {gold} gold</strong></div>
      <div className="shop-list">
        {shopItems.map((item) => {
          const bought = owned.includes(item.id)
          return <div className="shop-item" key={item.id}><span className="shop-icon">{item.icon === 'shield' ? <Shield size={18} /> : <Sparkles size={18} />}</span><div><strong>{item.name}</strong><p>{item.description}</p></div><button disabled={bought || gold < item.cost} onClick={() => { setGold((current) => current - item.cost); setOwned((current) => [...current, item.id]) }}>{bought ? 'Owned' : `${item.cost} ✦`}</button></div>
        })}
      </div>
    </section>
  )
}

function RaidPanel() {
  const [hp, setHp] = useState(68)
  const [attacked, setAttacked] = useState(false)
  return (
    <section className="gamify-panel raid-panel" aria-labelledby="raid-title">
      <div className="raid-head"><div className="raid-boss-mark"><Crown size={22} /></div><div><span className="gamify-kicker">WEEKLY RAID</span><h3 id="raid-title">The Fog of Almost</h3><p>Ends in 3 days · party of one</p></div><span className="raid-level">LV. 07</span></div>
      <LiquidProgressBar label="Boss vitality" value={hp} max={100} tone="hp" />
      <div className="raid-tasks"><button onClick={() => { setHp((current) => Math.max(0, current - 12)); setAttacked(true) }}><Sword size={14} /> Complete a habit <span>-12 HP</span></button><button onClick={() => { setHp((current) => Math.max(0, current - 20)); setAttacked(true) }}><Zap size={14} /> Reflect for 5 minutes <span>-20 HP</span></button></div>
      {attacked && <p className="attack-feedback" role="status"><Flame size={13} /> Direct hit. Keep the chain gentle.</p>}
    </section>
  )
}

function GracePanel() {
  const graceDays = useMemo(() => ['M', 'T', 'W', 'T', 'F', 'S', 'S'], [])
  return (
    <section className="gamify-panel grace-panel" aria-labelledby="grace-title">
      <div className="gamify-panel-heading"><div><span className="gamify-kicker"><HeartIcon /> RECOVERY LEDGER</span><h3 id="grace-title">Grace Days</h3></div><span className="grace-count">2 remaining</span></div>
      <p>Pause decay without losing your place. Rest is part of the run.</p>
      <div className="grace-week" aria-label="Weekly grace day overview">{graceDays.map((day, index) => <span key={`${day}-${index}`} className={index === 2 || index === 5 ? 'grace-active' : ''}>{day}</span>)}</div>
      <div className="grace-stats"><span><strong>14</strong> active days</span><span><strong>02</strong> grace days</span><span><strong>×1.8</strong> current combo</span></div>
    </section>
  )
}

function HeartIcon() { return <span aria-hidden="true">♡</span> }

export function GamificationShowcase() {
  const [runTour, setRunTour] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const morphRef = useRef<SVGPathElement>(null)
  const onTourEvent = (data: EventData) => {
    if (data.type === EVENTS.TOUR_END) {
      setRunTour(false)
      if (data.status === STATUS.FINISHED) setShowCelebration(true)
    }
  }
  const morph = () => morphActionIcon(morphRef.current, 'M12 2 L19 9 L16 12 L21 17 L12 22 L3 17 L8 12 L5 9 Z')
  return (
    <section className="gamification-showcase" aria-label="RPG progression tools">
      <Joyride steps={tourSteps} run={runTour} onEvent={onTourEvent} continuous options={{ buttons: ['back', 'skip', 'primary'], showProgress: true, spotlightPadding: 10, primaryColor: '#7653a8', zIndex: 1000 }} />
      <div className="showcase-heading"><div><span className="gamify-kicker"><Compass size={14} /> THE HERO&apos;S ORIENTATION</span><h2>Make the invisible progress visible.</h2><p>Mock progression tools for the days you&apos;re building quietly.</p></div><button className="orientation-button" onClick={() => setRunTour(true)}><Compass size={16} /> Guide me</button></div>
      <div className="resource-strip"><LiquidProgressBar label="EXP" value={72} max={100} tone="exp" /><LiquidProgressBar label="Mana" value={44} max={100} tone="mana" /><button className="morph-button" onClick={morph} aria-label="Toggle action icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path ref={morphRef} d="M4 5 L20 5 L12 21 Z" /></svg><span>Morph action</span></button></div>
      <div className="showcase-grid"><SkillTree /><ShopPanel /><RaidPanel /><GracePanel /></div>
      {showCelebration && <div className="tutorial-reward" role="status"><button aria-label="Dismiss tutorial reward" onClick={() => setShowCelebration(false)}>×</button><Suspense fallback={<Sparkles size={28} />}><LottiePlayer autoplay loop src="https://assets10.lottiefiles.com/packages/lf20_touohxv0.json" style={{ height: 48, width: 48 }} /></Suspense><div><strong>Orientation complete</strong><span>+50 Tutorial EXP</span></div></div>}
    </section>
  )
}
