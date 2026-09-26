import { Disclosure } from '../components/BloomExperience'
import { useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowUpRight,
  Check,
  Sparkles,
  Sprout,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import type { AppData } from '../model'
import type { NavKey } from '../components/layout/Sidebar'
import type { FeatureFlags } from '../SettingsPage'
import { totals } from './engine'
import { enableAudio, victoryChord } from './audio'
import { earnedFeedback, weeklyGoals } from './rewards'
import './rewards.css'
import { Carousel } from '../components/ui/Carousel'

export function GrowthRewards({
  data,
  setData,
  today,
  active,
  flags,
  onNavigate,
}: {
  data: AppData
  setData: Dispatch<SetStateAction<AppData>>
  today: string
  active: NavKey
  flags: FeatureFlags
  onNavigate: (page: NavKey) => void
}) {
  const reduced = useReducedMotion()
  const previous = useRef(data.rpg)
  const previousData = useRef(data)
  const celebratedGoals = useRef(new Set<string>())
  const [notice, setNotice] = useState<{
    title: string
    detail: string
    celebrate: boolean
    id: number
  } | null>(null)
  const [soundError, setSoundError] = useState('')
  const stats = totals(data.rpg)
  const goals = weeklyGoals(data, today, flags.adaptiveGoals).filter((goal) =>
    goal.id === 'journal'
      ? flags.chatJournal
      : goal.id === 'habits'
        ? flags.habitTracker
        : true,
  )
  useEffect(() => {
    const result = earnedFeedback(previous.current, data.rpg)
    const oldGoals = weeklyGoals(previousData.current, today, flags.adaptiveGoals)
    const completedGoals = weeklyGoals(data, today, flags.adaptiveGoals).filter((goal, index) => {
      const week = new Date(`${today}T12:00:00`)
      week.setDate(week.getDate() - ((week.getDay() + 6) % 7))
      const key = `${week.getFullYear()}-${week.getMonth()}-${week.getDate()}:${goal.id}`
      const visible =
        goal.id === 'journal'
          ? flags.chatJournal
          : goal.id === 'habits'
            ? flags.habitTracker
            : true
      if (
        !visible ||
        goal.current < goal.target ||
        oldGoals[index].current >= goal.target ||
        celebratedGoals.current.has(key)
      )
        return false
      celebratedGoals.current.add(key)
      return true
    })
    previous.current = data.rpg
    previousData.current = data
    if (!result.xp && !result.badges.length && !completedGoals.length) return
    setNotice({
      title: result.leveledUp
        ? `Level ${result.level} reached!`
        : result.badges.length
          ? 'Achievement unlocked!'
          : completedGoals.length
            ? 'Weekly goal complete!'
            : `+${result.xp} XP · A little more growth`,
      detail: completedGoals.length
        ? `${completedGoals.map((goal) => goal.title).join(' · ')}. Nicely done!${result.xp ? ` +${result.xp} XP` : ''}`
        : result.badges.length
          ? result.badges.join(', ').replaceAll('-', ' ')
          : result.leveledUp
            ? `+${result.xp} XP. Your small steps are adding up.`
            : `${totals(data.rpg).nextLevel} XP to your next level. Keep your own pace.`,
      celebrate: result.celebrate || completedGoals.length > 0,
      id: Date.now(),
    })
    if (data.rpg.sound) victoryChord()
  }, [data, today, flags.chatJournal, flags.habitTracker, flags.adaptiveGoals])
  useEffect(() => {
    if (!data.rpg.sound) return
    const resume = () => {
      void enableAudio()
    }
    document.addEventListener('pointerdown', resume)
    document.addEventListener('keydown', resume)
    return () => {
      document.removeEventListener('pointerdown', resume)
      document.removeEventListener('keydown', resume)
    }
  }, [data.rpg.sound])
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 5000)
    return () => window.clearTimeout(timer)
  }, [notice])
  const toggleSound = async () => {
    if (data.rpg.sound) {
      setData((d) => ({ ...d, rpg: { ...d.rpg, sound: false } }))
      return
    }
    const ready = await enableAudio()
    setSoundError(
      ready
        ? ''
        : 'Sound is unavailable in this browser. Visual rewards are still on.',
    )
    if (ready) {
      setData((d) => ({ ...d, rpg: { ...d.rpg, sound: true } }))
      victoryChord()
    }
  }
  return (
    <>
      {['overview', 'growth', 'challenges'].includes(active) && (
        <section className="growth-rewards" aria-label="Your growth this week">
          <div className="growth-rewards-heading">
            <div>
              <span className="growth-eyebrow">
                <Sprout size={15} /> YOUR GROWTH
              </span>
              <h2>Small steps. Real progress.</h2>
              <p>A fresh week to grow, at your own pace. Monday–Sunday.</p>
            </div>
            <button
              className="growth-sound"
              onClick={toggleSound}
              aria-pressed={data.rpg.sound}
              aria-label="Reward sounds"
            >
              {data.rpg.sound ? <Volume2 size={17} /> : <VolumeX size={17} />}{' '}
              Sound {data.rpg.sound ? 'on' : 'off'}
            </button>
          </div>
          {soundError && <p role="status">{soundError}</p>}
          <div className="growth-level">
            <span className="growth-level-icon">
              <Sprout size={25} />
            </span>
            <div>
              <div className="growth-level-label">
                <strong>Level {stats.level}</strong>
                <span>
                  {stats.exp} XP earned · {stats.nextLevel} XP to level{' '}
                  {stats.level + 1}
                </span>
              </div>
              <div
                className="growth-track"
                role="progressbar"
                aria-label="Next level"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={stats.exp % 100}
              >
                <motion.span
                  initial={false}
                  animate={{ width: `${stats.exp % 100}%` }}
                  transition={{ duration: reduced ? 0 : 0.5 }}
                />
              </div>
            </div>
            <button
              onClick={() => onNavigate('growth')}
              className="growth-skill-link"
            >
              Explore skills <ArrowUpRight size={16} />
            </button>
          </div>
          <Disclosure title="Weekly goals · See your progress" open={active === 'growth'}>
          <Carousel label="Weekly goals" perView={3}>
            {goals.map((goal) => {
              const complete = goal.current >= goal.target
              const percent = Math.min(
                100,
                Math.round((goal.current / goal.target) * 100),
              )
              return (
                <motion.button
                  key={goal.id}
                  className={`growth-goal ${complete ? 'is-complete' : ''}`}
                  whileHover={reduced ? undefined : { y: -3 }}
                  whileTap={reduced ? undefined : { scale: 0.98 }}
                  onClick={() => onNavigate(goal.page)}
                >
                  <span className="growth-goal-top">
                    <span>
                      {complete ? <Check size={18} /> : <Sparkles size={18} />}
                    </span>
                    <strong>{percent}%</strong>
                  </span>
                  <h3>{goal.title}</h3>
                  {goal.adapted && (
                    <span className="growth-adapted" title={`Default target ${goal.baseTarget}`}>
                      Adapted to your pace
                    </span>
                  )}
                  <p>
                    {complete
                      ? 'Weekly goal complete. Nicely done.'
                      : `${goal.target - goal.current} more ${goal.unit} this week`}
                  </p>
                  <div
                    className="growth-track"
                    role="progressbar"
                    aria-label={goal.title}
                    aria-valuemin={0}
                    aria-valuemax={goal.target}
                    aria-valuenow={Math.min(goal.current, goal.target)}
                  >
                    <motion.span
                      initial={false}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: reduced ? 0 : 0.5 }}
                    />
                  </div>
                  <span className="growth-goal-bottom">
                    {Math.min(goal.current, goal.target)} / {goal.target}{' '}
                    {goal.unit}
                    <ArrowUpRight size={16} />
                  </span>
                </motion.button>
              )
            })}
          </Carousel>
          </Disclosure>
        </section>
      )}
      <div
        className="growth-notices"
        aria-label="Growth rewards"
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence>
          {notice && (
            <motion.div
              key={notice.id}
              className="growth-notice"
              initial={{ opacity: 0, y: reduced ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <span className="growth-notice-icon">
                {notice.celebrate ? <Trophy /> : <Sprout />}
              </span>
              <div>
                <strong>{notice.title}</strong>
                <p>{notice.detail}</p>
              </div>
              <button
                aria-label="Dismiss reward"
                onClick={() => setNotice(null)}
              >
                <X size={17} />
              </button>
              {notice.celebrate && !reduced && (
                <span className="growth-confetti" aria-hidden="true">
                  {Array.from({ length: 16 }, (_, i) => (
                    <motion.i
                      key={i}
                      initial={{ x: 0, y: 0, opacity: 1 }}
                      animate={{
                        x: Math.cos((i * Math.PI) / 8) * 150,
                        y: Math.sin((i * Math.PI) / 8) * 100 - 45,
                        rotate: i * 65,
                        opacity: 0,
                      }}
                      transition={{ duration: 1.4 }}
                      style={{
                        background: ['#64b99b', '#e9ba66', '#c69be6'][i % 3],
                      }}
                    />
                  ))}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

