import { useEffect, useMemo, useState } from 'react'
import * as HoverCard from '@radix-ui/react-hover-card'
import { AnimatePresence, motion } from 'framer-motion'
import { Flame, Snowflake, Sparkles } from 'lucide-react'
import type { AppData } from '../../model'
import { activityDays } from '../insights'
import { activityStreak } from '../world/worldModel'
import {
  loginMilestones,
  loginStreak,
  MAX_FREEZES,
  readLogin,
  recordLogin,
  saveLogin,
  yearWeeks,
  type LoginResult,
} from './loginRewards'
import './rewards.css'
import { SHOP_EVENT, useShop } from './shop'
import { fountain } from '../../components/ui/celebrate'

/**
 * Topbar streak counter. Opening Bloom each day earns petals; hovering (or
 * tapping / focusing) the counter shows the year of visits, milestones and
 * streak freezes.
 */
export function StreakRewards({ data, today }: { data: AppData; today: string }) {
  const [login, setLogin] = useState(readLogin)
  const [reward, setReward] = useState<LoginResult['reward']>(null)
  const [open, setOpen] = useState(false)

  // Record today's visit once per day (also when the date rolls over).
  useEffect(() => {
    const result = recordLogin(readLogin(), today)
    if (!result.reward) return
    saveLogin(result.state)
    setLogin(result.state)
    window.dispatchEvent(new Event(SHOP_EVENT))
    setReward(result.reward)
    if (result.reward.milestone) fountain()
  }, [today])
  // Dismiss the reward toast on its own timer (independent of re-renders).
  useEffect(() => {
    if (!reward) return
    const timer = setTimeout(() => setReward(null), 5200)
    return () => clearTimeout(timer)
  }, [reward])

  const { balance } = useShop()
  const streak = loginStreak(login, today)
  const activeStreak = useMemo(() => {
    const active = new Set(
      activityDays(data)
        .filter((d) => d.tasks || d.focus || d.journals || d.habits)
        .map((d) => d.date),
    )
    return activityStreak(active, today)
  }, [data, today])
  const weeks = useMemo(() => yearWeeks(today), [today])
  const visited = new Set(login.days)
  const frozen = new Set(login.frozen)
  const yearCount = login.days.filter((d) => d.startsWith(today.slice(0, 4))).length
  const next = loginMilestones.find((m) => streak < m.days)

  return (
    <>
      <HoverCard.Root open={open} onOpenChange={setOpen} openDelay={120} closeDelay={160}>
        <HoverCard.Trigger asChild>
          <button
            type="button"
            className="streak-pill"
            aria-expanded={open}
            aria-haspopup="dialog"
            onClick={() => setOpen((value) => !value)}
          >
            <Flame size={18} className="streak-flame" aria-hidden="true" />
            <span>{streak ? `${streak} day streak` : 'Welcome back'}</span>
            <span className="streak-petals" aria-label={`${balance} petals`}>
              🌸 {balance}
            </span>
          </button>
        </HoverCard.Trigger>
        <HoverCard.Portal>
          <HoverCard.Content
            className="streak-card"
            sideOffset={10}
            align="end"
            collisionPadding={12}
            role="dialog"
            aria-label="Daily rewards"
          >
            <header className="streak-card-head">
              <div>
                <strong>{streak}</strong>
                <span>day streak</span>
              </div>
              <div>
                <strong>🌸 {balance}</strong>
                <span>petals · {login.petals} earned</span>
              </div>
              <div>
                <strong>
                  <Snowflake size={16} aria-hidden="true" /> {login.freezes}/{MAX_FREEZES}
                </strong>
                <span>freezes</span>
              </div>
            </header>
            <p className="streak-card-note">
              {next
                ? `${next.days - streak} more ${next.days - streak === 1 ? 'day' : 'days'} to ${next.emoji} ${next.label} (+${next.bonus})`
                : 'Every milestone reached. Legendary.'}
            </p>
            <ol className="streak-milestones" aria-label="Milestones">
              {loginMilestones.map((m) => (
                <li key={m.days} data-done={login.milestones.includes(m.days)}>
                  <span aria-hidden="true">{m.emoji}</span>
                  <small>{m.days}d</small>
                </li>
              ))}
            </ol>
            <div className="streak-year">
              <div className="streak-year-head">
                <span>{today.slice(0, 4)}</span>
                <span>{yearCount} days visited</span>
              </div>
              <div className="streak-grid" role="img" aria-label={`${yearCount} days visited this year`}>
                {weeks.map((week, w) => (
                  <span key={w} className="streak-week">
                    {week.map((day) => (
                      <i
                        key={day.key}
                        data-out={!day.inYear}
                        data-state={
                          visited.has(day.key)
                            ? 'visit'
                            : frozen.has(day.key)
                              ? 'frozen'
                              : day.key > today
                                ? 'future'
                                : 'empty'
                        }
                        data-today={day.key === today}
                        title={day.key}
                      />
                    ))}
                  </span>
                ))}
              </div>
              <div className="streak-legend" aria-hidden="true">
                <i data-state="visit" /> Visit <i data-state="frozen" /> Freeze
              </div>
            </div>
            <p className="streak-card-foot">
              <Sparkles size={14} aria-hidden="true" /> Active streak (tasks, focus, journal,
              habits): {activeStreak.current} · best {activeStreak.best}
            </p>
          </HoverCard.Content>
        </HoverCard.Portal>
      </HoverCard.Root>
      <AnimatePresence>
        {reward && (
          <motion.div
            className="streak-toast"
            aria-live="polite"
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <span aria-hidden="true">{reward.milestone?.emoji ?? '🌸'}</span>
            <span>
              <strong>
                Day {reward.streak} · +{reward.petals} petals
              </strong>
              <small>
                {reward.milestone
                  ? `${reward.milestone.label} milestone reached!`
                  : reward.usedFreeze
                    ? 'A streak freeze kept your streak safe.'
                    : reward.earnedFreeze
                      ? 'You earned a streak freeze.'
                      : 'Welcome back.'}
              </small>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
