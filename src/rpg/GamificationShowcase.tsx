import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
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
import type { AppData } from '../model'
import {
  buyShopItem,
  raidAttack,
  statsAfterDecay,
  toggleGraceDay,
  unlockSkill,
} from './engine'
import { totals } from './engine'

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
  prerequisites: string[]
  attribute: 'strength' | 'intelligence' | 'spirit' | null
  threshold: number
  expCost: number
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

const skillSeeds: ReadonlyArray<Omit<SkillNode, 'title' | 'subtitle'>> = [
  {
    id: 'mindfulness',
    state: 'unlocked',
    prerequisites: [],
    attribute: null,
    threshold: 0,
    expCost: 0,
    x: 8,
    y: 48,
  },
  {
    id: 'breathwork',
    state: 'available',
    prerequisites: ['mindfulness'],
    attribute: 'spirit',
    threshold: 10,
    expCost: 40,
    x: 31,
    y: 25,
  },
  {
    id: 'meditation',
    state: 'locked',
    prerequisites: ['breathwork'],
    attribute: 'spirit',
    threshold: 25,
    expCost: 100,
    x: 53,
    y: 67,
  },
  {
    id: 'zen',
    state: 'locked',
    prerequisites: ['meditation'],
    attribute: 'spirit',
    threshold: 50,
    expCost: 250,
    x: 80,
    y: 38,
  },
]

const shopSeeds: ReadonlyArray<{
  id: 'shield' | 'elixir'
  cost: number
  icon: ShopItem['icon']
}> = [
  { id: 'shield', cost: 120, icon: 'shield' },
  { id: 'elixir', cost: 80, icon: 'sparkles' },
]

function clamp(value: number, max: number) {
  return Math.min(max, Math.max(0, value))
}

export function LiquidProgressBar({
  label,
  value,
  max,
  tone,
}: LiquidProgressBarProps) {
  const { t } = useTranslation(undefined, { i18n })
  const percent = (clamp(value, max) / max) * 100
  const gradientId = `liquid-${tone}`
  return (
    <div
      className={`liquid-meter liquid-${tone}`}
      aria-label={t('rpg.meterAria', { label, value, max })}
    >
      <div className="liquid-meter-heading">
        <span>{label}</span>
        <strong>
          {value} / {max}
        </strong>
      </div>
      <svg
        className="liquid-svg"
        viewBox="0 0 320 28"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity=".55" />
            <stop offset="100%" stopColor="currentColor" />
          </linearGradient>
          <clipPath id={`${gradientId}-clip`}>
            <rect width="320" height="28" rx="14" />
          </clipPath>
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

function SkillTree({
  data,
  setData,
}: {
  data: AppData
  setData: Dispatch<SetStateAction<AppData>>
}) {
  const { t } = useTranslation(undefined, { i18n })
  const [selectedSkill, setSelectedSkill] = useState('breathwork')
  const perks: Record<string, string> = {
    mindfulness: 'Your starting point',
    breathwork: '+5 XP for saved reflections',
    meditation: '+5 XP for completed focus sessions',
    zen: '+5 XP for completed to-dos',
  }
  const stats = { ...totals(data.rpg), stats: statsAfterDecay(data.rpg) }
  const definitions = Object.fromEntries(
    skillSeeds.map(({ id, prerequisites, attribute, threshold, expCost }) => [
      id,
      { prerequisites, attribute, threshold, expCost },
    ]),
  )
  const nodes = skillSeeds.map((node) => {
    const saved = data.rpg.skills[node.id]
    const prerequisitesMet = node.prerequisites.every(
      (id) => id === 'mindfulness' || data.rpg.skills[id]?.state === 'unlocked',
    )
    const attributeMet =
      !node.attribute || stats.stats[node.attribute] >= node.threshold
    return {
      ...node,
      title: t(`rpg.skills.${node.id}.title`),
      subtitle: t(`rpg.skills.${node.id}.subtitle`),
      state: (node.id === 'mindfulness' || saved?.state === 'unlocked'
        ? 'unlocked'
        : prerequisitesMet && attributeMet && stats.exp >= node.expCost
          ? 'available'
          : 'locked') as SkillNodeState,
    }
  })
  const unlocked = nodes.filter((node) => node.state === 'unlocked').length
  return (
    <section
      className="gamify-panel skill-tree-panel"
      id="skill-tree"
      aria-labelledby="skill-tree-title"
    >
      <div className="gamify-panel-heading">
        <div>
          <span className="gamify-kicker">
            <Map size={13} /> {t('rpg.pathOfPractice')}
          </span>
          <h3 id="skill-tree-title">{t('rpg.skillTreeTitle')}</h3>
        </div>
        <span className="tree-progress">
          {t('rpg.skillTreeUnlocked', { unlocked, total: nodes.length })}
        </span>
      </div>
      <div
        className="skill-tree"
        role="group"
        aria-label={t('rpg.skillTreeAria')}
      >
        <svg
          className="skill-connectors"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <motion.path d="M 13 53 C 21 53 22 31 36 31" />
          <motion.path d="M 36 31 C 44 31 44 72 58 72" />
          <motion.path d="M 58 72 C 67 72 69 44 85 44" />
        </svg>
        {nodes.map((node) => (
          <button
            key={node.id}
            className={`skill-node skill-${node.state}`}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            aria-pressed={selectedSkill === node.id}
            onClick={() => setSelectedSkill(node.id)}
          >
            <div className="skill-node-orb">
              {node.state === 'locked' ? (
                <Lock size={15} />
              ) : (
                <Sparkles size={15} />
              )}
            </div>
            <strong>{node.title}</strong>
            <small>
              {node.state === 'available' ? 'Ready to unlock' : node.subtitle}
            </small>
          </button>
        ))}
      </div>
      {nodes
        .filter((node) => node.id === selectedSkill)
        .map((node) => (
          <div className="skill-detail" key={node.id}>
            <h3>{node.title}</h3>
            <p>{perks[node.id]}</p>
            {node.state !== 'unlocked' && (
              <>
                <span>
                  {Math.min(stats.exp, node.expCost)}/{node.expCost} XP
                  {node.attribute
                    ? ` · ${Math.min(stats.stats[node.attribute], node.threshold)}/${node.threshold} ${node.attribute}`
                    : ''}
                </span>
                <progress
                  aria-label="Skill experience requirement"
                  value={stats.exp}
                  max={node.expCost || 1}
                />
                {node.prerequisites
                  .filter(
                    (id) =>
                      id !== 'mindfulness' &&
                      data.rpg.skills[id]?.state !== 'unlocked',
                  )
                  .map((id) => (
                    <small key={id}>
                      Unlock {t(`rpg.skills.${id}.title`)} first
                    </small>
                  ))}
                <button
                  className="primary"
                  disabled={node.state !== 'available'}
                  onClick={() =>
                    setData((current) =>
                      unlockSkill(
                        current,
                        node.id,
                        totals(current.rpg).exp,
                        statsAfterDecay(current.rpg),
                        definitions,
                      ),
                    )
                  }
                >
                  Unlock skill
                </button>
              </>
            )}
            {node.state === 'unlocked' && <strong>Unlocked</strong>}
          </div>
        ))}
    </section>
  )
}

function ShopPanel({
  data,
  setData,
}: {
  data: AppData
  setData: Dispatch<SetStateAction<AppData>>
}) {
  const { t } = useTranslation(undefined, { i18n })
  const items: ShopItem[] = shopSeeds.map((seed) => ({
    id: seed.id,
    name: t(`rpg.shopItem.${seed.id}.name`),
    description: t(`rpg.shopItem.${seed.id}.description`),
    cost: seed.cost,
    icon: seed.icon,
  }))
  return (
    <section className="gamify-panel shop-panel" aria-labelledby="shop-title">
      <div className="gamify-panel-heading">
        <div>
          <span className="gamify-kicker">
            <ShoppingBag size={13} /> {t('rpg.shopKicker')}
          </span>
          <h3 id="shop-title">{t('rpg.shopTitle')}</h3>
        </div>
        <strong className="gold-balance">
          {t('rpg.gold', { gold: data.rpg.gold })}
        </strong>
      </div>
      <div className="shop-list">
        {items.map((item) => {
          const bought = data.rpg.buffs.some((buff) => buff.kind === item.id)
          return (
            <div className="shop-item" key={item.id}>
              <span className="shop-icon">
                {item.icon === 'shield' ? (
                  <Shield size={18} />
                ) : (
                  <Sparkles size={18} />
                )}
              </span>
              <div>
                <strong>{item.name}</strong>
                <p>{item.description}</p>
              </div>
              <button
                disabled={bought || data.rpg.gold < item.cost}
                onClick={() =>
                  setData((current) =>
                    buyShopItem(
                      current,
                      item.id === 'shield' ? 'streak-shield' : 'focus-elixir',
                    ),
                  )
                }
              >
                {bought ? t('rpg.owned') : `${item.cost} ✦`}
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function RaidPanel({
  data,
  setData,
}: {
  data: AppData
  setData: Dispatch<SetStateAction<AppData>>
}) {
  const { t } = useTranslation(undefined, { i18n })
  const [attacked, setAttacked] = useState(false)
  const hp = data.rpg.weeklyRaid?.hp ?? 500
  const maxHp = data.rpg.weeklyRaid?.maxHp ?? 500
  return (
    <section className="gamify-panel raid-panel" aria-labelledby="raid-title">
      <div className="raid-head">
        <div className="raid-boss-mark">
          <Crown size={22} />
        </div>
        <div>
          <span className="gamify-kicker">{t('rpg.raidKicker')}</span>
          <h3 id="raid-title">{t('rpg.raidName')}</h3>
          <p>{t('rpg.raidMeta')}</p>
        </div>
        <span className="raid-level">
          {t('rpg.raidLevel', { level: '07' })}
        </span>
      </div>
      <LiquidProgressBar
        label={t('rpg.bossVitality')}
        value={hp}
        max={maxHp}
        tone="hp"
      />
      <div className="raid-tasks">
        <button
          disabled={data.rpg.weeklyRaid?.defeated}
          onClick={() => {
            setData((current) => raidAttack(current, 12))
            setAttacked(true)
          }}
        >
          <Sword size={14} /> {t('rpg.raidHabit')} <span>-12 HP</span>
        </button>
        <button
          disabled={data.rpg.weeklyRaid?.defeated}
          onClick={() => {
            setData((current) => raidAttack(current, 20))
            setAttacked(true)
          }}
        >
          <Zap size={14} /> {t('rpg.raidReflect')} <span>-20 HP</span>
        </button>
      </div>
      {attacked && (
        <p className="attack-feedback" role="status">
          <Flame size={13} /> {t('rpg.raidHit')}
        </p>
      )}
    </section>
  )
}

function GracePanel({
  data,
  setData,
}: {
  data: AppData
  setData: Dispatch<SetStateAction<AppData>>
}) {
  const { t } = useTranslation(undefined, { i18n })
  const graceDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        new Date(2024, 0, 1 + index).toLocaleDateString(i18n.language, {
          weekday: 'narrow',
        }),
      ),
    [],
  )
  return (
    <section className="gamify-panel grace-panel" aria-labelledby="grace-title">
      <div className="gamify-panel-heading">
        <div>
          <span className="gamify-kicker">
            <HeartIcon /> {t('rpg.recoveryLedger')}
          </span>
          <h3 id="grace-title">{t('rpg.graceDays')}</h3>
        </div>
        <span className="grace-count">
          {t('rpg.graceRemaining', {
            count: Math.max(0, 2 - data.rpg.graceDays.length),
          })}
        </span>
      </div>
      <p>{t('rpg.graceNote')}</p>
      <div className="grace-week" aria-label={t('rpg.graceWeekAria')}>
        {graceDays.map((day, index) => {
          const key = `grace-${index}`
          const active = data.rpg.graceDays.includes(key)
          return (
            <button
              key={`${day}-${index}`}
              className={active ? 'grace-active' : ''}
              onClick={() => setData((current) => toggleGraceDay(current, key))}
            >
              {day}
            </button>
          )
        })}
      </div>
      <div className="grace-stats">
        <span>
          <strong>14</strong> {t('rpg.graceActiveDays')}
        </span>
        <span>
          <strong>02</strong> {t('rpg.graceDaysStat')}
        </span>
        <span>
          <strong>×1.8</strong> {t('rpg.graceCombo')}
        </span>
      </div>
    </section>
  )
}

function HeartIcon() {
  return <span aria-hidden="true">♡</span>
}

export function GamificationShowcase({
  data,
  setData,
  showWeeklyRaid,
  showWalkthroughTour,
  view = 'all',
}: {
  data: AppData
  setData: Dispatch<SetStateAction<AppData>>
  showWeeklyRaid: boolean
  showWalkthroughTour: boolean
  view?: 'all' | 'skills' | 'rewards'
}) {
  const { t } = useTranslation(undefined, { i18n })
  const [showCelebration, setShowCelebration] = useState(false)
  const morphRef = useRef<SVGPathElement>(null)
  const startTour = () =>
    driver({
      showProgress: true,
      steps: [
        {
          element: '#skill-tree',
          popover: {
            title: t('rpg.tour.skillTreeTitle'),
            description: t('rpg.tour.skillTreeBody'),
            side: 'bottom',
          },
        },
        {
          element: '#chat-journal',
          popover: {
            title: t('rpg.tour.journalTitle'),
            description: t('rpg.tour.journalBody'),
            side: 'top',
          },
        },
        {
          element: '#habit-grid',
          popover: {
            title: t('rpg.tour.habitsTitle'),
            description: t('rpg.tour.habitsBody'),
            side: 'top',
          },
        },
        {
          element: '#avatar-card',
          popover: {
            title: t('rpg.tour.avatarTitle'),
            description: t('rpg.tour.avatarBody'),
            side: 'bottom',
          },
        },
      ],
      onDestroyed: () => setShowCelebration(true),
    }).drive()
  const morph = () =>
    morphActionIcon(
      morphRef.current,
      'M12 2 L19 9 L16 12 L21 17 L12 22 L3 17 L8 12 L5 9 Z',
    )
  return (
    <section
      className="gamification-showcase"
      aria-label={t('rpg.showcaseAria')}
    >
      {view === 'all' && (
        <>
          <div className="showcase-heading">
            <div>
              <span className="gamify-kicker">
                <Compass size={14} /> {t('rpg.orientationKicker')}
              </span>
              <h2>{t('rpg.orientationTitle')}</h2>
              <p>{t('rpg.orientationSubtitle')}</p>
            </div>
            {showWalkthroughTour && (
              <button
                className="orientation-button orientation-fab"
                onClick={startTour}
              >
                <Compass size={16} /> {t('rpg.guideMe')}
              </button>
            )}
          </div>
          <div className="resource-strip">
            <LiquidProgressBar
              label={t('rpg.expLabel')}
              value={72}
              max={100}
              tone="exp"
            />
            <LiquidProgressBar
              label={t('rpg.manaLabel')}
              value={44}
              max={100}
              tone="mana"
            />
            <button
              className="morph-button"
              onClick={morph}
              aria-label={t('rpg.morphAria')}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path ref={morphRef} d="M4 5 L20 5 L12 21 Z" />
              </svg>
              <span>{t('rpg.morphAction')}</span>
            </button>
          </div>
        </>
      )}
      <div className="showcase-grid">
        {view !== 'rewards' && <SkillTree data={data} setData={setData} />}
        {view !== 'skills' && <ShopPanel data={data} setData={setData} />}
        {view !== 'skills' && showWeeklyRaid && (
          <RaidPanel data={data} setData={setData} />
        )}
        {view !== 'skills' && <GracePanel data={data} setData={setData} />}
      </div>
      {showCelebration && (
        <div className="tutorial-reward" role="status">
          <button
            aria-label={t('rpg.dismissReward')}
            onClick={() => setShowCelebration(false)}
          >
            ×
          </button>
          <Suspense fallback={<Sparkles size={28} />}>
            <LottiePlayer
              autoplay
              loop
              src="https://assets10.lottiefiles.com/packages/lf20_touohxv0.json"
              style={{ height: 48, width: 48 }}
            />
          </Suspense>
          <div>
            <strong>{t('rpg.orientationComplete')}</strong>
            <span>{t('rpg.tutorialExp')}</span>
          </div>
        </div>
      )}
    </section>
  )
}
