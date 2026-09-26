import { PersonalInsights } from './features/PersonalInsights'
import { BloomHeading, Disclosure } from './components/BloomExperience'
import { BloomCompanion } from './companion/BloomCompanion'
import {
  CustomizeMenu,
  FocusCard,
  ReflectionCard,
  useOverviewModules,
  WorldTeaser,
  RecentMemories,
  SoundscapeCard,
  StatsRow,
} from './components/dashboard/Overview'
import { lazy, Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from './i18n'
import { useFormik } from 'formik'
import { motion, MotionConfig, useReducedMotion } from 'framer-motion'
import {
  ArrowDownToLine,
  ArrowRight,
  MessageCircle,
  Check,
  ChevronRight,
  Leaf,
  ListChecks,
  Moon,
  Plus,
  Sun,
  X,
  BookOpen,
  Pencil,
} from 'lucide-react'
import { dayKey, id, STORAGE_KEY, toggleHabit } from './model'
import type { Session } from './model'
import { useCoach } from './useCoach'
import { Modal } from './components/Modal'
import { ChatJournalContainer } from './components/journal/ChatJournalContainer'
import { JournalContainer } from './components/daybook/JournalContainer'
import { SummaryContent } from './components/journal/SessionSummaryModal'
import { ChallengesPage, TodoPage } from './features/ProductivityPages'
import { FocusPage, useFocusLifecycle } from './features/FocusPage'
import { UrgePage } from './features/UrgePage'
import { LanguageSelector } from './components/LanguageSelector'
import './App.css'
import {
  FeatureGuide,
  pageDetails,
  readPage,
} from './components/layout/FeatureGuide'
import { GrowthRewards } from './rpg/GrowthRewards'
import { RpgDashboard } from './rpg/RpgDashboard'
import { inferStat, statNames } from './rpg/schema'
import type { Stat } from './rpg/schema'
import { SettingsPage, useAppSettings } from './SettingsPage'
import { HabitsPage } from './features/HabitsPage'
import {
  CollectiblesPage,
  DailySpin,
} from './features/collectibles/Collectibles'
import { Sidebar } from './components/layout/Sidebar'
import { Carousel } from './components/ui/Carousel'
import { LottieIcon } from './components/ui/LottieIcon'
import { QuickAdd, SearchTrigger } from './components/layout/TopbarExtras'
import { StreakRewards } from './features/rewards/StreakRewards'
import { ReminderCenter } from './features/reminders/ReminderCenter'
import {
  CommandPalette,
  rememberPage,
} from './components/layout/CommandPalette'
import type { NavKey } from './components/layout/Sidebar'
import {
  applyTheme,
  getStoredTheme,
  getThemeMode,
  toggleThemeMode,
} from './utils/themeEngine'
import type { ThemeSettings } from './utils/themeEngine'

import './features/features.css'
import './styles/shared-ui.css'

const VisionBoard = lazy(() => import('./components/VisionBoard/VisionBoard'))
const WorldPage = lazy(() =>
  import('./features/world/WorldPage').then((module) => ({
    default: module.WorldPage,
  })),
)
const wellbeing = () => import('./features/wellbeing/WellbeingPages')
const BreathePage = lazy(() =>
  wellbeing().then((m) => ({ default: m.BreathePage })),
)
const MoodPage = lazy(() => wellbeing().then((m) => ({ default: m.MoodPage })))
const GratitudePage = lazy(() =>
  wellbeing().then((m) => ({ default: m.GratitudePage })),
)
const SleepPage = lazy(() =>
  import('./features/sleep/SleepPage').then((m) => ({ default: m.SleepPage })),
)
const ShopPage = lazy(() =>
  import('./features/rewards/ShopPage').then((m) => ({ default: m.ShopPage })),
)
const CalendarPage = lazy(() =>
  import('./features/CalendarPage').then((module) => ({
    default: module.CalendarPage,
  })),
)

function Checkmark({ checked }: { checked: boolean }) {
  const reduced = useReducedMotion()
  return (
    <span className={`checkmark ${checked ? 'checked' : ''}`}>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <motion.path
          d="m6 12 4 4 8-8"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0 }}
          transition={{ duration: reduced ? 0 : 0.3 }}
        />
      </svg>
    </span>
  )
}
function TextForm({
  label,
  initial = '',
  max = 100,
  onSave,
}: {
  label: string
  initial?: string
  max?: number
  onSave: (value: string) => void
}) {
  const { t } = useTranslation(undefined, { i18n })
  const form = useFormik({
    initialValues: { value: initial },
    validate: (v) =>
      !v.value.trim()
        ? { value: t('forms.required') }
        : v.value.trim().length > max
          ? { value: t('forms.maxLength', { max }) }
          : {},
    onSubmit: (values) => onSave(values.value.trim()),
  })
  return (
    <form onSubmit={form.handleSubmit} className="text-form">
      <label htmlFor="new-value">{label}</label>
      <textarea
        autoFocus
        id="new-value"
        name="value"
        rows={3}
        value={form.values.value}
        onChange={form.handleChange}
        maxLength={max}
        aria-describedby="value-error"
      />
      <p id="value-error" className="error-text">
        {form.errors.value && form.submitCount > 0 ? form.errors.value : ''}
      </p>
      <button type="submit" className="primary full">
        {t('ui.save')} <Check size={16} />
      </button>
    </form>
  )
}
function App() {
  const { t } = useTranslation(undefined, { i18n })
  const { data, setData, error, blocked, resumeSaving } = useCoach()
  useFocusLifecycle(data, setData)
  const [overviewPanel, setOverviewPanel] = useState<
    'today' | 'insights' | 'memories'
  >('today')
  const [settings, setSettings] = useAppSettings()
  const [today, setToday] = useState(dayKey)
  const [modal, setModal] = useState<
    'habit' | 'plan' | 'affirmation' | 'history' | null
  >(null)
  const [editPlan, setEditPlan] = useState<string | null>(null)
  const [viewSession, setViewSession] = useState<Session | null>(null)
  const [active, setActive] = useState<NavKey>(readPage)
  const [companionOpen, setCompanionOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [showDoneHabits, setShowDoneHabits] = useState(false)
  // Habits ticked during this visit stay in place; earlier ones fold away.
  const [justChecked, setJustChecked] = useState<Set<string>>(() => new Set())
  const [modules, setModules] = useOverviewModules()
  useEffect(() => {
    const sync = () => setActive(readPage())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  useEffect(() => {
    document.getElementById('page-heading')?.focus({ preventScroll: true })
  }, [active])
  const [themeSettings, setThemeSettings] =
    useState<ThemeSettings>(getStoredTheme)
  const isDark = getThemeMode(themeSettings.themeId) === 'dark'
  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? 'en'
    document.title = t('ui.documentTitle')
    const description = document.querySelector('meta[name="description"]')
    if (description)
      description.setAttribute('content', t('ui.metaDescription'))
  }, [t])
  useEffect(() => {
    const timer = setInterval(() => setToday(dayKey()), 30000)
    const refresh = () => setToday(dayKey())
    window.addEventListener('focus', refresh)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [])
  // applyTheme() is the only writer of <html>'s theme attributes, so a theme
  // change repaints the page without re-rendering the tree.
  useEffect(() => {
    applyTheme(themeSettings)
  }, [themeSettings])
  useEffect(() => {
    document.documentElement.dataset.density = settings.features.compactMode
      ? 'compact'
      : 'comfortable'
  }, [settings.features.compactMode])
  const completed = data.habits.filter((h) => h.dates.includes(today)).length
  const justCheckedDone = data.habits.filter(
    (h) => justChecked.has(h.id) && h.dates.includes(today),
  ).length
  const progress = data.habits.length
    ? Math.round((completed / data.habits.length) * 100)
    : 0
  const plans = data.plans.filter((p) => p.date === today)
  const lastWeek = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - 6 + i)
    const key = dayKey(date)
    return {
      key,
      label: date.toLocaleDateString(i18n.resolvedLanguage ?? 'en', {
        weekday: 'narrow',
      }),
      count: data.habits.filter((h) => h.dates.includes(key)).length,
    }
  })
  const exportData = (original = false) => {
    let content: string
    try {
      content = original
        ? (localStorage.getItem(STORAGE_KEY) ?? '{}')
        : JSON.stringify(data, null, 2)
    } catch {
      return
    }
    const url = URL.createObjectURL(
      new Blob([content], { type: 'application/json' }),
    )
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `mindfulness-${original ? 'original-' : ''}${today}.json`
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const jump = (target: NavKey) => {
    rememberPage(target)
    setActive(target)
    window.location.hash = target
    window.scrollTo?.({ top: 0, behavior: 'instant' })
  }
  return (
    <MotionConfig reducedMotion="user">
      <div
        className="app-shell min-h-dvh bg-page font-app text-foreground"
        data-palette={data.rpg.palette}
      >
        <a
          className="skip-link"
          href="#overview"
          onClick={(event) => {
            event.preventDefault()
            document.getElementById('page-heading')?.focus()
          }}
        >
          {t('ui.skipToDashboard')}
        </a>
        <Sidebar active={active} onNavigate={jump} flags={settings.features} />
        <main id="overview" className="min-w-0 flex-1">
          <header className="topbar flex flex-wrap items-center justify-between gap-3">
            <SearchTrigger onOpen={() => setPaletteOpen(true)} />
            <div className="topbar-actions flex flex-wrap items-center gap-3">
              <QuickAdd
                onHabit={() => setModal('habit')}
                onIntention={() => setModal('plan')}
                onNavigate={jump}
              />
              <StreakRewards data={data} today={today} />
              {settings.features.languageSelector && <LanguageSelector />}
              <button
                className="theme-toggle"
                type="button"
                aria-label={
                  isDark ? t('ui.switchToLight') : t('ui.switchToDark')
                }
                aria-pressed={isDark}
                onClick={() => setThemeSettings(toggleThemeMode)}
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
                <span>
                  {isDark ? t('actions.lightMode') : t('actions.darkMode')}
                </span>
              </button>
              <button className="quiet-button" onClick={() => exportData()}>
                <ArrowDownToLine size={16} aria-hidden="true" />{' '}
                <span className="topbar-label">{t('actions.exportData')}</span>
              </button>
            </div>
          </header>
          <div
            className={`page-content feature-page page-${active} mx-auto w-full max-w-[1600px] px-4 pb-10 sm:px-6 lg:px-8`}
          >
            {active === 'overview' && (
              <div className="overview-bar">
                <nav className="overview-switch" aria-label="Overview sections">
                  {(['today', 'insights', 'memories'] as const).map((panel) => (
                    <button
                      key={panel}
                      aria-pressed={overviewPanel === panel}
                      onClick={() => setOverviewPanel(panel)}
                    >
                      {panel === 'today'
                        ? 'Today'
                        : panel === 'insights'
                          ? 'Personal Insights'
                          : 'Memory Timeline'}
                    </button>
                  ))}
                </nav>
                <span className="overview-date">
                  {new Date(`${today}T12:00:00`).toLocaleDateString(
                    i18n.resolvedLanguage ?? 'en',
                    { dateStyle: 'full' },
                  )}
                  <CustomizeMenu modules={modules} setModules={setModules} />
                </span>
              </div>
            )}
            <BloomHeading
              title={pageDetails[active].title}
              page={active}
              actions={
                active === 'overview' ? (
                  <>
                    <button
                      className="ov-primary"
                      onClick={() => setCompanionOpen(true)}
                    >
                      <LottieIcon name="sparkle" size={18} /> Plan with
                      Bloom
                    </button>
                    <button
                      className="ov-secondary"
                      onClick={() => setCompanionOpen(true)}
                    >
                      <MessageCircle size={17} aria-hidden="true" /> Talk to
                      Bloom
                    </button>
                  </>
                ) : undefined
              }
            >
              <FeatureGuide page={active} />
            </BloomHeading>
            {settings.features.rpgSkillTree && active !== 'overview' && (
              <GrowthRewards
                data={data}
                setData={setData}
                today={today}
                active={active}
                flags={settings.features}
                onNavigate={jump}
              />
            )}
            {error && (
              <div className="storage-error" role="alert">
                <strong>{t('ui.savingAttention')}</strong>
                <p>{error}</p>
                {blocked && (
                  <>
                    <button onClick={() => exportData(true)}>
                      {t('ui.exportOriginal')}
                    </button>
                    <button onClick={resumeSaving}>
                      {t('ui.useFreshData')}
                    </button>
                  </>
                )}
              </div>
            )}

            {settings.features.habitTracker && (
              <div hidden={active !== 'habits'}>
                <HabitsPage
                  data={data}
                  setData={setData}
                  today={today}
                  reminders={settings.features.reminders}
                />
              </div>
            )}
            {settings.features.daybookModes && (
              <div hidden={active !== 'daybook'}>
                <JournalContainer />
              </div>
            )}
            {(active === 'growth' && !settings.features.rpgSkillTree) ||
            (active === 'collectibles' && !settings.features.collectibles) ||
            (active === 'habits' && !settings.features.habitTracker) ||
            (active === 'journal' && !settings.features.chatJournal) ||
            (active === 'daybook' && !settings.features.daybookModes) ||
            (active === 'urges' && !settings.features.urgeTracker) ||
            (active === 'calendar' && !settings.features.fullCalendar) ||
            (active === 'vision-board' && !settings.features.visionBoard) ||
            (active === 'world' && !settings.features.bloomWorld) ||
            (active === 'breathe' && !settings.features.breathe) ||
            (active === 'mood' && !settings.features.moodCheckin) ||
            (active === 'gratitude' && !settings.features.gratitude) ||
            (active === 'sleep' && !settings.features.sleepTracker) ||
            (active === 'shop' && !settings.features.petalShop) ? (
              <section className="card rounded-ui-lg border border-ui-border bg-surface p-5 sm:p-6">
                <h2>This feature is turned off</h2>
                <p>You can enable it in Settings.</p>
                <button className="primary" onClick={() => jump('settings')}>
                  Open settings
                </button>
              </section>
            ) : active === 'breathe' ? (
              <Suspense fallback={null}>
                <BreathePage />
              </Suspense>
            ) : active === 'mood' ? (
              <Suspense fallback={null}>
                <MoodPage />
              </Suspense>
            ) : active === 'gratitude' ? (
              <Suspense fallback={null}>
                <GratitudePage />
              </Suspense>
            ) : active === 'sleep' ? (
              <Suspense fallback={null}>
                <SleepPage />
              </Suspense>
            ) : active === 'shop' ? (
              <Suspense fallback={null}>
                <ShopPage
                  onVisitWorld={
                    settings.features.bloomWorld ? () => jump('world') : undefined
                  }
                />
              </Suspense>
            ) : active === 'world' ? (
              <Suspense fallback={<p role="status">Growing your world…</p>}>
                <WorldPage
                  data={data}
                  today={today}
                  onNavigate={jump}
                />
              </Suspense>
            ) : active === 'collectibles' ? (
              <CollectiblesPage />
            ) : active === 'habits' ? null : active === 'calendar' ? (
              <Suspense fallback={<p role="status">Loading calendar...</p>}>
                <CalendarPage data={data} setData={setData} />
              </Suspense>
            ) : active === 'todos' ? (
              <TodoPage data={data} setData={setData} />
            ) : active === 'urges' ? (
              <UrgePage data={data} setData={setData} />
            ) : active === 'challenges' ? (
              <ChallengesPage
                data={data}
                setData={setData}
                onTasks={() => jump('todos')}
              />
            ) : active === 'focus' ? (
              <FocusPage
                data={data}
                setData={setData}
                showCollectibles={settings.features.collectibles}
              />
            ) : active === 'growth' ? (
              <RpgDashboard
                compact
                externalFeedback
                data={data}
                setData={setData}
                onReflect={() => jump('journal')}
                showWeeklyRaid={settings.features.weeklyRaidBoss}
                showWalkthroughTour={false}
              />
            ) : active === 'settings' ? (
              <SettingsPage
                settings={settings}
                setSettings={setSettings}
                theme={themeSettings}
                setTheme={setThemeSettings}
              />
            ) : active === 'daybook' &&
              settings.features.daybookModes ? null : active === 'journal' &&
              settings.features.chatJournal ? (
              <ChatJournalContainer data={data} setData={setData} />
            ) : active === 'vision-board' && settings.features.visionBoard ? (
              <Suspense
                fallback={<p role="status">Opening your Vision Board…</p>}
              >
                <VisionBoard badges={data.rpg.badges} />
              </Suspense>
            ) : (
              <>
                {active === 'overview' && overviewPanel !== 'today' && (
                  <PersonalInsights
                    key={overviewPanel}
                    data={data}
                    setData={setData}
                    initialView={overviewPanel}
                  />
                )}
                <div
                  hidden={active === 'overview' && overviewPanel !== 'today'}
                >
                  {active === 'overview' && settings.features.dailySpin && (
                    <Disclosure title="Your daily discovery · Free spin">
                      <DailySpin
                        onCollection={
                          settings.features.collectibles
                            ? () => jump('collectibles')
                            : undefined
                        }
                      />
                    </Disclosure>
                  )}
                  {active === 'overview' && modules.stats && (
                    <StatsRow data={data} today={today} onNavigate={jump} />
                  )}
                  <div
                    className={
                      active === 'overview'
                        ? 'overview-grid'
                        : 'dashboard-grid grid grid-cols-1 gap-5'
                    }
                  >
                    <div className="left-column">
                      {active === 'overview' &&
                        settings.features.habitTracker && (
                          <section className="card" id="habits">
                            <div className="card-heading">
                              <div className="section-title">
                                <span className="icon-tile purple">
                                  <ListChecks size={19} />
                                </span>
                                <div>
                                  <h2>{t('dashboard.quests')}</h2>
                                  <p>{t('ui.habitsSubtitle')}</p>
                                </div>
                              </div>
                              <button
                                className="icon-button"
                                aria-label={t('ui.addHabit')}
                                onClick={() => setModal('habit')}
                              >
                                <Plus size={20} />
                              </button>
                            </div>
                            <div className="progress-label">
                              <span>{t('ui.todaysProgress')}</span>
                              <strong>{progress}%</strong>
                            </div>
                            <div className="progress-track">
                              <motion.div
                                initial={false}
                                animate={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="habit-list" id="habit-grid">
                              {data.habits
                                .filter(
                                  (h) =>
                                    showDoneHabits ||
                                    justChecked.has(h.id) ||
                                    !h.dates.includes(today),
                                )
                                .slice(0, 3)
                                .map((h) => (
                                <div className="habit-with-stat" key={h.id}>
                                  <button
                                    className={`habit ${h.dates.includes(today) ? 'done' : ''}`}
                                    aria-pressed={h.dates.includes(today)}
                                    onClick={() => {
                                      setJustChecked((set) =>
                                        new Set(set).add(h.id),
                                      )
                                      setData((d) =>
                                        toggleHabit(d, h.id, dayKey()),
                                      )
                                    }}
                                  >
                                    <Checkmark
                                      checked={h.dates.includes(today)}
                                    />
                                    <span>
                                      <strong>{h.title}</strong>
                                      <small>
                                        {h.detail || t('ui.habitDetailDefault')}
                                      </small>
                                    </span>
                                    <span className="habit-spark">
                                      {h.dates.includes(today) ? '✦' : '＋'}
                                    </span>
                                  </button>
                                  <label className="habit-stat-select">
                                    +5
                                    <select
                                      aria-label={t('ui.statFor', {
                                        title: h.title,
                                      })}
                                      value={h.stat}
                                      onChange={(e) => {
                                        const stat = e.target.value as Stat
                                        setData((d) => ({
                                          ...d,
                                          habits: d.habits.map((item) =>
                                            item.id === h.id
                                              ? { ...item, stat }
                                              : item,
                                          ),
                                        }))
                                      }}
                                    >
                                      {(Object.keys(statNames) as Stat[]).map(
                                        (stat) => (
                                          <option key={stat} value={stat}>
                                            {statNames[stat]}
                                          </option>
                                        ),
                                      )}
                                    </select>
                                    <small>{t('ui.comboExp')}</small>
                                  </label>
                                </div>
                              ))}
                            </div>
                            {completed > justCheckedDone && (
                              <button
                                className="add-line done-toggle"
                                aria-expanded={showDoneHabits}
                                onClick={() => setShowDoneHabits((v) => !v)}
                              >
                                <Check size={16} aria-hidden="true" />{' '}
                                {showDoneHabits
                                  ? 'Hide completed'
                                  : `${completed - justCheckedDone} completed earlier · show`}
                              </button>
                            )}
                            {data.habits.length > 3 && (
                              <button
                                className="add-line"
                                onClick={() => jump('habits')}
                              >
                                View all {data.habits.length} habits →
                              </button>
                            )}
                            <button
                              className="add-line"
                              onClick={() => setModal('habit')}
                            >
                              <Plus size={16} /> {t('ui.addSmallHabit')}
                            </button>
                            <div className="week-strip">
                              <span>{t('ui.lastSevenDays')}</span>
                              <div>
                                {lastWeek.map((d) => (
                                  <div
                                    key={d.key}
                                    title={`${d.key}: ${t('ui.habitsCompleted', { count: d.count })}`}
                                    className={d.key === today ? 'today' : ''}
                                  >
                                    <span>{d.label}</span>
                                    <i
                                      className={d.count ? 'has-progress' : ''}
                                    >
                                      {d.count ? <Check size={12} /> : '·'}
                                    </i>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </section>
                        )}
                    </div>
                    <div className="middle-column">
                      {(active === 'overview' || active === 'planning') && (
                        <section className="card" id="planning">
                          <div className="card-heading">
                            <div className="section-title">
                              <span className="icon-tile orange">
                                <Sun size={19} />
                              </span>
                              <div>
                                <h2>{t('ui.intentionHeading')}</h2>
                                <p>{t('ui.intentionDescription')}</p>
                              </div>
                            </div>
                            <button
                              className="icon-button"
                              aria-label={t('ui.addIntention')}
                              onClick={() => setModal('plan')}
                            >
                              <Plus size={20} />
                            </button>
                          </div>
                          {active === 'overview' && (
                            <div className="ov-affirmation">
                              <blockquote>“{data.affirmation}”</blockquote>
                              <button
                                className="icon-button"
                                aria-label={t('ui.editAffirmation')}
                                onClick={() => setModal('affirmation')}
                              >
                                <Pencil size={16} />
                              </button>
                            </div>
                          )}
                          {plans.length === 0 ? (
                            active === 'overview' ? null : <div className="empty-plans">
                              <Sun size={26} />
                              <p>{t('ui.freshPage')}</p>
                              <small>{t('ui.chooseMeaningful')}</small>
                            </div>
                          ) : (
                            <div className="plan-list">
                              {(active === 'overview'
                                ? plans.slice(0, 3)
                                : plans
                              ).map((p, i) => (
                                <div className="plan" key={p.id}>
                                  <button
                                    className={
                                      p.done
                                        ? 'plan-toggle done'
                                        : 'plan-toggle'
                                    }
                                    aria-pressed={p.done}
                                    onClick={() =>
                                      setData((d) => ({
                                        ...d,
                                        plans: d.plans.map((item) =>
                                          item.id === p.id
                                            ? { ...item, done: !item.done }
                                            : item,
                                        ),
                                      }))
                                    }
                                  >
                                    <span>
                                      {p.done ? (
                                        <Check size={15} />
                                      ) : (
                                        String(i + 1).padStart(2, '0')
                                      )}
                                    </span>
                                    <strong>{p.title}</strong>
                                  </button>
                                  <button
                                    className="icon-button"
                                    aria-label={t('ui.edit', {
                                      title: p.title,
                                    })}
                                    onClick={() => setEditPlan(p.id)}
                                  >
                                    <Pencil size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          {active === 'overview' && plans.length > 3 && (
                            <button
                              className="add-line"
                              onClick={() => jump('planning')}
                            >
                              View all {plans.length} intentions →
                            </button>
                          )}
                          <button
                            className="add-line"
                            onClick={() => setModal('plan')}
                          >
                            <Plus size={16} /> {t('ui.setIntention')}
                          </button>
                        </section>
                      )}
                    </div>
                    {active === 'overview' && (
                      <div className="right-column">
                        {modules.focus && (
                          <FocusCard
                            data={data}
                            setData={setData}
                            onNavigate={jump}
                          />
                        )}
                      </div>
                    )}
                  </div>
                  {active === 'overview' && (
                    <Carousel
                      label="More for you"
                      title="More for you"
                    >
                      {modules.reflection && (
                        <ReflectionCard
                          onNavigate={jump}
                          showJournal={settings.features.chatJournal}
                          showDaybook={settings.features.daybookModes}
                        />
                      )}
                      {modules.memories && (
                        <RecentMemories
                          data={data}
                          onViewAll={() => setOverviewPanel('memories')}
                        />
                      )}
                      {modules.soundscape && <SoundscapeCard />}
                      {modules.world && settings.features.bloomWorld && (
                        <WorldTeaser onOpen={() => jump('world')} />
                      )}
                    </Carousel>
                  )}
                  {active === 'overview' &&
                    modules.growth &&
                    settings.features.rpgSkillTree && (
                      <GrowthRewards
                        data={data}
                        setData={setData}
                        today={today}
                        active={active}
                        flags={settings.features}
                        onNavigate={jump}
                      />
                    )}
                  <button
                    className="history-card"
                    onClick={() => setModal('history')}
                  >
                    <span className="icon-tile purple">
                      <BookOpen size={20} />
                    </span>
                    <span>
                      <strong>{t('ui.storyUnfolding')}</strong>
                      <small>{t('ui.revisit')}</small>
                    </span>
                    <span className="history-count">
                      {t('ui.reflectionCount', { count: data.sessions.length })}
                    </span>
                    <ChevronRight size={19} />
                  </button>
                  <footer>
                    <span>
                      <Leaf size={14} /> {t('ui.madeForGrowth')}
                    </span>
                    <span>
                      {t('ui.savedBrowser')} ·{' '}
                      <button onClick={() => exportData()}>
                        {t('ui.keepBackup')}
                      </button>
                    </span>
                  </footer>
                </div>
              </>
            )}
          </div>
        </main>
        {settings.features.reminders && (
          <ReminderCenter
            data={data}
            setData={setData}
            today={today}
            onOpen={() => jump('habits')}
          />
        )}
        <CommandPalette
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          data={data}
          flags={settings.features}
          isDark={isDark}
          onNavigate={jump}
          onAddHabit={() => setModal('habit')}
          onAddIntention={() => setModal('plan')}
          onToggleTheme={() => setThemeSettings(toggleThemeMode)}
          onTalk={() => setCompanionOpen(true)}
        />
        <BloomCompanion
          data={data}
          setData={setData}
          blocked={blocked}
          navigate={jump}
          open={companionOpen}
          onOpen={() => setCompanionOpen(true)}
          onClose={() => setCompanionOpen(false)}
        />
      </div>
      {modal === 'habit' && (
        <Modal title={t('ui.plantHabit')} onClose={() => setModal(null)}>
          <TextForm
            label={t('ui.practiceQuestion')}
            onSave={(title) => {
              setData((d) => ({
                ...d,
                habits: [
                  ...d.habits,
                  {
                    id: id(),
                    title,
                    detail: '',
                    dates: [],
                    stat: inferStat(title),
                  },
                ],
              }))
              setModal(null)
            }}
          />
        </Modal>
      )}
      {modal === 'plan' && (
        <Modal title={t('ui.makeRoom')} onClose={() => setModal(null)}>
          <TextForm
            label={t('ui.oneIntention')}
            max={150}
            onSave={(title) => {
              setData((d) => ({
                ...d,
                plans: [
                  ...d.plans,
                  { id: id(), title, date: dayKey(), done: false },
                ],
              }))
              setModal(null)
            }}
          />
        </Modal>
      )}
      {editPlan && (
        <Modal title={t('ui.editIntention')} onClose={() => setEditPlan(null)}>
          <TextForm
            label={t('ui.yourIntention')}
            initial={data.plans.find((p) => p.id === editPlan)?.title}
            max={150}
            onSave={(title) => {
              setData((d) => ({
                ...d,
                plans: d.plans.map((p) =>
                  p.id === editPlan ? { ...p, title } : p,
                ),
              }))
              setEditPlan(null)
            }}
          />
        </Modal>
      )}
      {modal === 'affirmation' && (
        <Modal title={t('ui.wordsLikeYou')} onClose={() => setModal(null)}>
          <TextForm
            label={t('ui.personalAffirmation')}
            initial={data.affirmation}
            max={300}
            onSave={(affirmation) => {
              setData((d) => ({ ...d, affirmation }))
              setModal(null)
            }}
          />
        </Modal>
      )}
      {modal === 'history' && (
        <Modal
          title={t('ui.reflectionJournal')}
          onClose={() => {
            setModal(null)
            setViewSession(null)
          }}
        >
          {viewSession ? (
            <>
              <button
                className="text-button"
                onClick={() => setViewSession(null)}
              >
                <X size={14} /> {t('ui.backToReflections')}
              </button>
              <SummaryContent session={viewSession} />
            </>
          ) : data.sessions.length ? (
            [...data.sessions].reverse().map((s) => (
              <button
                key={s.metadata.id}
                className="history-item"
                onClick={() => setViewSession(s)}
              >
                <strong>
                  {new Date(s.metadata.date).toLocaleDateString(
                    i18n.resolvedLanguage ?? 'en',
                    {
                      dateStyle: 'medium',
                    },
                  )}
                </strong>
                <span>
                  {s.messages.find(
                    (m) => m.sender === 'user' && m.category === 'win',
                  )?.text ?? t('ui.momentForYou')}
                </span>
                <ArrowRight size={16} />
              </button>
            ))
          ) : (
            <p className="empty-message">{t('ui.storyStarts')}</p>
          )}
        </Modal>
      )}
    </MotionConfig>
  )
}
export default App
