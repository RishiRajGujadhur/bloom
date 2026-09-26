import { subOn } from './features/subFeatures'
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
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
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
import { burst, streakMilestone } from './components/ui/celebrate'
import { AchievementHost } from './features/achievements/DrawnAchievement'
import { ImpactLayer } from './features/impact/ImpactLayer'
import { JuiceLayer, juice, pointer } from './features/juice/PixelJuice'
import { CoreEngine } from './features/core/CoreEngine'
import { MomentHost } from './features/core/MomentReveal'
import { NudgeHost } from './components/studio/Nudges'
import { GrowthGarden, NowCard, Onboarding, WelcomeBack } from './features/core/CoreHome'
import type { OmniAction } from './components/layout/omnibox'
import { kindFor, readDiet, saveDiet } from './features/diet/dietModel'
import { MOOD_KEY } from './features/wellbeing/store'
import { DailyFlowCard } from './features/dailyFlow/DailyFlow'
import { EpiphaniesPage, EpiphanyGate } from './features/epiphany/EpiphanyUI'
import { habitStats } from './features/habits'
import { TimeCapsuleCard } from './features/timeCapsule'
import { TimeSinceCard } from './features/timeSince/TimeSinceCard'
import { hasWebGL } from './components/ui/Scene3D'
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
import './styles/subFeatureGates.css'

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
const DietPage = lazy(() =>
  import('./features/diet/DietPage').then((m) => ({ default: m.DietPage })),
)
const MonkModePage = lazy(() =>
  import('./features/monk/MonkMode').then((m) => ({ default: m.MonkModePage })),
)
const VoicePage = lazy(() =>
  import('./features/voice/VoicePage').then((m) => ({ default: m.VoicePage })),
)
const EnergyPage = lazy(() =>
  import('./features/energy/EnergyPage').then((m) => ({ default: m.EnergyPage })),
)
const LabPage = lazy(() =>
  import('./features/lab/LabPage').then((m) => ({ default: m.LabPage })),
)
const ExercisePage = lazy(() =>
  import('./features/exercise/ExercisePage').then((m) => ({ default: m.ExercisePage })),
)
const WorkoutPage = lazy(() =>
  import('./features/workout/WorkoutPage').then((m) => ({ default: m.WorkoutPage })),
)
const IntervalPage = lazy(() =>
  import('./features/interval/IntervalPage').then((m) => ({ default: m.IntervalPage })),
)
const YogaPage = lazy(() =>
  import('./features/yoga/YogaPage').then((m) => ({ default: m.YogaPage })),
)
const StretchPage = lazy(() =>
  import('./features/stretch/StretchPage').then((m) => ({ default: m.StretchPage })),
)
const RunPage = lazy(() =>
  import('./features/run/RunPage').then((m) => ({ default: m.RunPage })),
)
const BodyPage = lazy(() =>
  import('./features/body/BodyPage').then((m) => ({ default: m.BodyPage })),
)
const ScanPage = lazy(() =>
  import('./features/scan/ScanPage').then((m) => ({ default: m.ScanPage })),
)
const FastingPage = lazy(() =>
  import('./features/fasting/FastingPage').then((m) => ({ default: m.FastingPage })),
)
const SoundsPage = lazy(() =>
  import('./features/sounds/SoundsPage').then((m) => ({ default: m.SoundsPage })),
)
const MixerPage = lazy(() =>
  import('./features/mixer/MixerPage').then((m) => ({ default: m.MixerPage })),
)
const MeditatePage = lazy(() =>
  import('./features/meditate/MeditatePage').then((m) => ({ default: m.MeditatePage })),
)
const BreathworkPage = lazy(() =>
  import('./features/breathwork/BreathworkPage').then((m) => ({ default: m.BreathworkPage })),
)
const MalaPage = lazy(() =>
  import('./features/mala/MalaPage').then((m) => ({ default: m.MalaPage })),
)
const InkPage = lazy(() =>
  import('./features/ink/InkPage').then((m) => ({ default: m.InkPage })),
)
const MirrorPage = lazy(() =>
  import('./features/mirror/MirrorPage').then((m) => ({ default: m.MirrorPage })),
)
const MindMapPage = lazy(() =>
  import('./features/mindmap/MindMapPage').then((m) => ({ default: m.MindMapPage })),
)
const CardsPage = lazy(() =>
  import('./features/cards/CardsPage').then((m) => ({ default: m.CardsPage })),
)
const GamesPage = lazy(() =>
  import('./features/games/GamesPage').then((m) => ({ default: m.GamesPage })),
)
const RoadmapPage = lazy(() =>
  import('./features/roadmap/RoadmapPage').then((m) => ({ default: m.RoadmapPage })),
)
const RoutinesPage = lazy(() =>
  import('./features/routines/RoutinesPage').then((m) => ({ default: m.RoutinesPage })),
)
const TaiChiPage = lazy(() =>
  import('./features/taichi/TaiChiPage').then((m) => ({ default: m.TaiChiPage })),
)
const ReleasePage = lazy(() =>
  import('./features/release/ReleasePage').then((m) => ({ default: m.ReleasePage })),
)
const FocusRoomPage = lazy(() =>
  import('./features/focusRoom/FocusRoomPage').then((m) => ({ default: m.FocusRoomPage })),
)
const ExplorePage = lazy(() =>
  import('./features/explore/ExplorePage').then((m) => ({ default: m.ExplorePage })),
)
const YearbookPage = lazy(() =>
  import('./features/yearbook/YearbookPage').then((m) => ({ default: m.YearbookPage })),
)
const MemoryPalacePage = lazy(() =>
  import('./features/palace/MemoryPalacePage').then((m) => ({ default: m.MemoryPalacePage })),
)
const StreakJourneyPage = lazy(() =>
  import('./features/journey/StreakJourneyPage').then((m) => ({ default: m.StreakJourneyPage })),
)
const PlacesPage = lazy(() =>
  import('./features/places/PlacesPage').then((m) => ({ default: m.PlacesPage })),
)
const SkillConstellation = lazy(() =>
  import('./rpg/SkillConstellation').then((m) => ({ default: m.SkillConstellation })),
)
const PosturePage = lazy(() =>
  import('./features/posture/PosturePage').then((m) => ({ default: m.PosturePage })),
)
const PostureGuardian = lazy(() =>
  import('./features/posture/PosturePage').then((m) => ({ default: m.PostureGuardian })),
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
  // The posture runtime only loads once the Posture page has been opened.
  const [postureTouched, setPostureTouched] = useState(active === 'posture')
  useEffect(() => {
    if (active === 'posture') setPostureTouched(true)
  }, [active])
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
  // Page entrance: the new page's blocks settle in with a soft stagger.
  useLayoutEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const blocks = document.querySelectorAll(
      '.page-content > :not(.bloom-heading):not([hidden]), .overview-grid > div > *, .ov-stats > *',
    )
    if (!blocks.length) return
    const tween = gsap.from(blocks, {
      y: 14,
      opacity: 0,
      duration: 0.45,
      stagger: 0.04,
      ease: 'power2.out',
      clearProps: 'transform,opacity',
    })
    return () => {
      tween.progress(1).kill()
    }
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
    // Switched-off sub-features, for CSS-level gates (see subFeatureGates.css).
    document.documentElement.dataset.off = Object.entries(settings.sub ?? {})
      .filter(([, on]) => on === false)
      .map(([key]) => key)
      .join(' ')
    document.documentElement.dataset.compactSidebar = String(
      settings.features.compactMode && subOn('compactMode', 'sidebar'),
    )
    document.documentElement.dataset.compactCards = String(
      settings.features.compactMode && subOn('compactMode', 'cards'),
    )
  }, [settings])
  const completed = data.habits.filter((h) => h.dates.includes(today)).length
  // Hick's law: the simple home shows fewer, stronger choices; the rest is one tap away.
  const simpleHome = settings.features.bloomCore && subOn('bloomCore', 'simpleHome')
  // Pixel juice: any new habit tick today (from any page) pops loot.
  const prevCompleted = useRef(completed)
  useEffect(() => {
    if (completed > prevCompleted.current && settings.features.pixelJuice) {
      const at = pointer()
      const milestone = data.habits.some((h) => h.dates.includes(today) && habitStats(h.dates, today).current % 7 === 0)
      juice({ ...at, big: milestone, label: milestone ? 'Loot!' : '+EXP', seed: completed })
    }
    prevCompleted.current = completed
  }, [completed, data.habits, today, settings.features.pixelJuice])
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
  /** Omnibox ("> …" in Ctrl K) commands. */
  const runCommand = (action: OmniAction) => {
    if (action.type === 'logHabit') {
      setData((d) => (d.habits.find((h) => h.id === action.habitId)?.dates.includes(today) ? d : toggleHabit(d, action.habitId, today)))
    } else if (action.type === 'addTask') {
      setData((d) => ({
        ...d,
        todos: [
          ...d.todos,
          { id: id(), title: action.title, done: false, due: today, completedAt: null, challengeId: null, rewarded: false, priority: 'P3', tags: [], recurrence: 'none', seriesId: null, subtasks: [] },
        ],
      }))
    } else if (action.type === 'water' || action.type === 'meal') {
      const diet = readDiet()
      saveDiet(
        action.type === 'water'
          ? { ...diet, water: { ...diet.water, [today]: (diet.water[today] ?? 0) + action.glasses } }
          : { ...diet, meals: [...diet.meals, { id: id(), at: Date.now(), date: today, name: action.name, kind: kindFor(new Date().getHours()), kcal: action.kcal, protein: 0, carbs: 0, fat: 0 }] },
      )
    } else if (action.type === 'mood') {
      try {
        const list: unknown = JSON.parse(localStorage.getItem(MOOD_KEY) ?? '[]')
        localStorage.setItem(MOOD_KEY, JSON.stringify([...(Array.isArray(list) ? list : []), { id: id(), at: Date.now(), mood: action.value, note: '' }]))
      } catch {
        /* Mood still shows next time the page loads. */
      }
    } else if (action.type === 'theme') {
      setThemeSettings((s) => ({ ...s, themeId: action.themeId }))
    }
    burst(null, 'stars')
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
            className={`page-content feature-page page-${active}${simpleHome ? ' is-simple-home' : ''} mx-auto w-full max-w-[1600px] px-4 pb-10 sm:px-6 lg:px-8`}
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
                <EpiphanyGate today={today} enabled={settings.features.epiphanies}>
                <HabitsPage
                  data={data}
                  setData={setData}
                  today={today}
                  reminders={settings.features.reminders}
                />
                </EpiphanyGate>
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
            (active === 'posture' && !settings.features.postureGuard) ||
            (active === 'epiphanies' && !settings.features.epiphanies) ||
            (active === 'diet' && !settings.features.dietTracker) ||
            (active === 'monk' && !settings.features.monkMode) ||
            (active === 'voice' && !settings.features.voiceMemos) ||
            (active === 'energy' && !settings.features.energySankey) ||
            (active === 'lab' && !settings.features.insightsLab) ||
            (active === 'taichi' && !settings.features.wuXing) ||
            (active === 'routines' && !settings.features.routineScheduler) ||
            (active === 'roadmap' && !settings.features.goalRoadmap) ||
            (active === 'games' && !settings.features.brainGames) ||
            (active === 'cards' && !settings.features.flashcards) ||
            (active === 'mindmaps' && !settings.features.mindMaps) ||
            (active === 'mirror' && !settings.features.moodMirror) ||
            (active === 'ink' && !settings.features.inkJournal) ||
            (active === 'mala' && !settings.features.mala) ||
            (active === 'breathwork' && !settings.features.breathwork) ||
            (active === 'meditate' && !settings.features.meditation) ||
            (active === 'mixer' && !settings.features.soundMixer) ||
            (active === 'sounds' && !settings.features.focusSounds) ||
            (active === 'fasting' && !settings.features.fasting) ||
            (active === 'scan' && !settings.features.foodScanner) ||
            (active === 'body' && !settings.features.bodyProgress) ||
            (active === 'run' && !settings.features.runTracker) ||
            (active === 'stretch' && !settings.features.mobility) ||
            (active === 'yoga' && !settings.features.yogaFlow) ||
            (active === 'intervals' && !settings.features.intervalCoach) ||
            (active === 'workouts' && !settings.features.workoutLog) ||
            (active === 'exercises' && !settings.features.exerciseGuides) ||
            (active === 'shop' && !settings.features.petalShop) ||
            (active === 'release' && !settings.features.burnRelease) ||
            (active === 'focus-room' && !settings.features.focusRoom) ||
            (active === 'explore' && !settings.features.queryBuilder) ||
            (active === 'yearbook' && !settings.features.yearbook) ||
            (active === 'palace' && !settings.features.memoryPalace) ||
            (active === 'journey' && !settings.features.streakJourney) ||
            (active === 'places' && !settings.features.placesMap) ? (
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
            ) : active === 'release' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <ReleasePage />
              </Suspense>
            ) : active === 'focus-room' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <FocusRoomPage data={data} setData={setData} today={today} onNavigate={jump} />
              </Suspense>
            ) : active === 'explore' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <ExplorePage data={data} setData={setData} today={today} onNavigate={jump} />
              </Suspense>
            ) : active === 'yearbook' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <YearbookPage data={data} setData={setData} today={today} onNavigate={jump} />
              </Suspense>
            ) : active === 'palace' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <MemoryPalacePage data={data} setData={setData} today={today} onNavigate={jump} />
              </Suspense>
            ) : active === 'journey' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <StreakJourneyPage data={data} setData={setData} today={today} onNavigate={jump} />
              </Suspense>
            ) : active === 'places' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <PlacesPage />
              </Suspense>
            ) : active === 'diet' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <DietPage data={data} setData={setData} today={today} onNavigate={jump} />
              </Suspense>
            ) : active === 'monk' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <MonkModePage />
              </Suspense>
            ) : active === 'voice' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <VoicePage data={data} setData={setData} today={today} onNavigate={jump} />
              </Suspense>
            ) : active === 'energy' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <EnergyPage data={data} setData={setData} today={today} onNavigate={jump} />
              </Suspense>
            ) : active === 'lab' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <LabPage data={data} setData={setData} today={today} onNavigate={jump} />
              </Suspense>
            ) : active === 'exercises' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <ExercisePage />
              </Suspense>
            ) : active === 'workouts' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <WorkoutPage />
              </Suspense>
            ) : active === 'intervals' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <IntervalPage />
              </Suspense>
            ) : active === 'yoga' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <YogaPage />
              </Suspense>
            ) : active === 'stretch' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <StretchPage />
              </Suspense>
            ) : active === 'run' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <RunPage />
              </Suspense>
            ) : active === 'body' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <BodyPage />
              </Suspense>
            ) : active === 'scan' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <ScanPage />
              </Suspense>
            ) : active === 'fasting' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <FastingPage />
              </Suspense>
            ) : active === 'sounds' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <SoundsPage data={data} setData={setData} today={today} onNavigate={jump} />
              </Suspense>
            ) : active === 'mixer' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <MixerPage />
              </Suspense>
            ) : active === 'meditate' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <MeditatePage />
              </Suspense>
            ) : active === 'breathwork' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <BreathworkPage />
              </Suspense>
            ) : active === 'mala' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <MalaPage />
              </Suspense>
            ) : active === 'ink' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <InkPage />
              </Suspense>
            ) : active === 'mirror' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <MirrorPage data={data} setData={setData} today={today} onNavigate={jump} />
              </Suspense>
            ) : active === 'mindmaps' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <MindMapPage />
              </Suspense>
            ) : active === 'cards' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <CardsPage />
              </Suspense>
            ) : active === 'games' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <GamesPage />
              </Suspense>
            ) : active === 'roadmap' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <RoadmapPage data={data} setData={setData} today={today} onNavigate={jump} />
              </Suspense>
            ) : active === 'routines' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <RoutinesPage />
              </Suspense>
            ) : active === 'taichi' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <TaiChiPage />
              </Suspense>
            ) : active === 'epiphanies' ? (
              <EpiphaniesPage today={today} />
            ) : active === 'posture' ? (
              <Suspense fallback={<p role="status">Loading…</p>}>
                <PosturePage data={data} setData={setData} today={today} onNavigate={jump} />
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
                showCollectibles={
                  settings.features.collectibles &&
                  subOn('collectibles', 'focusCompanion')
                }
              />
            ) : active === 'growth' ? (
              <>
              {settings.features.skillConstellation && hasWebGL() && (
                <Suspense fallback={null}>
                  <SkillConstellation rpg={data.rpg} />
                </Suspense>
              )}
              <RpgDashboard
                compact
                externalFeedback
                data={data}
                setData={setData}
                onReflect={() => jump('journal')}
                showWeeklyRaid={settings.features.weeklyRaidBoss}
                showWalkthroughTour={false}
              />
              </>
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
                <VisionBoard
                  badges={subOn('visionBoard', 'badgeNodes') ? data.rpg.badges : []}
                  habits={data.habits}
                />
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
                  {active === 'overview' && settings.features.bloomCore && (
                    <>
                      {subOn('bloomCore', 'onboarding') && <Onboarding data={data} setData={setData} today={today} />}
                      {subOn('bloomCore', 'welcomeBack') && <WelcomeBack data={data} today={today} onNavigate={jump} />}
                      {subOn('bloomCore', 'nowCard') && (
                        <NowCard data={data} setData={setData} today={today} flags={settings.features} onNavigate={jump} onPlan={() => setModal('plan')} />
                      )}
                      {subOn('bloomCore', 'growth') && <GrowthGarden data={data} today={today} />}
                    </>
                  )}
                  {active === 'overview' && !simpleHome && settings.features.dailySpin && subOn('dailySpin', 'dashboard') && (
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
                  {active === 'overview' && settings.features.dailyFlow && (
                    <DailyFlowCard
                      data={data}
                      today={today}
                      flags={settings.features}
                      onNavigate={jump}
                    />
                  )}
                  {active === 'overview' && modules.stats && !simpleHome && (
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
<EpiphanyGate today={today} enabled={settings.features.epiphanies}>
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
                                    onClick={(event) => {
                                      if (!h.dates.includes(today)) {
                                        burst(event.currentTarget)
                                        streakMilestone(
                                          habitStats(h.dates, today).current + 1,
                                          h.title,
                                        )
                                      }
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
                          </EpiphanyGate>
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
                    <MaybeCollapsed collapsed={simpleHome} title="More for today">
                    <Carousel
                      label="More for you"
                      title="More for you"
                    >
                      {settings.features.timeSince && <TimeSinceCard data={data} />}
                      {settings.features.timeCapsule && (
                        <TimeCapsuleCard data={data} today={today} />
                      )}
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
                    </MaybeCollapsed>
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
        {settings.features.drawnAchievements && <AchievementHost />}
        {settings.features.impactTasks && <ImpactLayer setData={setData} />}
        {settings.features.pixelJuice && <JuiceLayer />}
        {settings.features.bloomCore && <CoreEngine data={data} today={today} />}
        {settings.features.bloomCore && <MomentHost />}
        <NudgeHost onNavigate={jump} />
        {settings.features.postureGuard && postureTouched && (
          <Suspense fallback={null}>
            <PostureGuardian setData={setData} />
          </Suspense>
        )}
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
          today={today}
          onCommand={runCommand}
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

/** Progressive disclosure: wraps secondary content in a collapsed section. */
function MaybeCollapsed({ collapsed, title, children }: { collapsed: boolean; title: string; children: React.ReactNode }) {
  return collapsed ? <Disclosure title={title}>{children}</Disclosure> : <>{children}</>
}
