import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import {
  BookOpen,
  CarFront,
  CalendarDays,
  Flower2,
  Timer,
  Trophy,
  Sprout,
  CheckSquare,
  LayoutDashboard,
  Map,
  Castle,
  Lightbulb,
  PersonStanding,
  Armchair,
  BookMarked,
  Boxes,
  Filter,
  Flame,
  MapPinned,
  Route,
  BedDouble,
  ShoppingBag,
  Heart,
  Smile,
  Wind,
  ListChecks,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Settings,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react'
import { Waves as WavesNav } from 'lucide-react'
import { Gamepad2 as Gamepad2F_brainGames } from 'lucide-react'
import { Layers as LayersF_flashcards } from 'lucide-react'
import { Network as NetworkF_mindMaps } from 'lucide-react'
import { ScanFace as ScanFaceF_moodMirror } from 'lucide-react'
import { PenLine as PenLineF_inkJournal } from 'lucide-react'
import { CircleDot as CircleDotF_mala } from 'lucide-react'
import { Wind as WindF_breathwork } from 'lucide-react'
import { Sparkles as SparklesF_meditation } from 'lucide-react'
import { CloudRain as CloudRainF_soundMixer } from 'lucide-react'
import { AudioLines as AudioLinesF_focusSounds } from 'lucide-react'
import { Hourglass as HourglassF_fasting } from 'lucide-react'
import { ScanBarcode as ScanBarcodeF_foodScanner } from 'lucide-react'
import { Ruler as RulerF_bodyProgress } from 'lucide-react'
import { Footprints as FootprintsF_runTracker } from 'lucide-react'
import { PersonStanding as PersonStandingF_mobility } from 'lucide-react'
import { Flower2 as Flower2F_yogaFlow } from 'lucide-react'
import { TimerReset as TimerResetF_intervalCoach } from 'lucide-react'
import { BicepsFlexed as BicepsFlexedF_workoutLog } from 'lucide-react'
import { Dumbbell as DumbbellF_exerciseGuides } from 'lucide-react'
import { Apple as AppleNav, Feather as FeatherNav, Mic as MicNav, Zap as ZapNav, FlaskConical as FlaskConicalNav } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import type { FeatureFlags } from '../../SettingsPage'
import styles from './Sidebar.module.css'
import sidebarPlant from '../../assets/bloom/sidebar-plant.webp'

/** Destinations the app knows how to reach; `settings` swaps the page. */
export type NavKey =
  | 'collectibles'
  | 'calendar'
  | 'todos'
  | 'challenges'
  | 'focus'
  | 'growth'
  | 'overview'
  | 'habits'
  | 'journal'
  | 'daybook'
  | 'planning'
  | 'settings'
  | 'vision-board'
  | 'urges'
  | 'world'
  | 'breathe'
  | 'mood'
  | 'gratitude'
  | 'sleep'
  | 'shop'
  | 'release'
  | 'focus-room'
  | 'explore'
  | 'yearbook'
  | 'palace'
  | 'journey'
  | 'places'
  | 'posture'
  | 'epiphanies'
  | 'diet'
  | 'monk'
  | 'voice'
  | 'energy'
  | 'lab'
  | 'taichi'
  | 'games'
  | 'cards'
  | 'mindmaps'
  | 'mirror'
  | 'ink'
  | 'mala'
  | 'breathwork'
  | 'meditate'
  | 'mixer'
  | 'sounds'
  | 'fasting'
  | 'scan'
  | 'body'
  | 'run'
  | 'stretch'
  | 'yoga'
  | 'intervals'
  | 'workouts'
  | 'exercises'

interface SidebarProps {
  /** Currently highlighted destination. */
  active: string
  /** Called with the target destination; the shell scrolls to it (or swaps page). */
  onNavigate: (key: NavKey) => void
  /** Feature flags: a disabled feature drops out of the navigation entirely. */
  flags: FeatureFlags
}

/** Sidebar sections, in display order. Unlisted keys (settings) come last. */
const navSections: { label: string; keys: NavKey[] }[] = [
  { label: 'Today', keys: ['overview', 'planning', 'todos', 'calendar', 'focus', 'focus-room'] },
  { label: 'Grow', keys: ['habits', 'challenges', 'growth', 'journey', 'urges', 'world', 'shop', 'collectibles', 'diet', 'scan', 'fasting', 'cards', 'games'] },
  { label: 'Mind', keys: ['journal', 'daybook', 'breathe', 'mood', 'gratitude', 'sleep', 'release', 'posture', 'epiphanies', 'monk', 'voice', 'taichi', 'sounds', 'mixer', 'meditate', 'breathwork', 'mala', 'ink', 'mirror'] },
  { label: 'Body', keys: ['exercises', 'workouts', 'intervals', 'yoga', 'stretch', 'run', 'body'] },
  { label: 'Explore', keys: ['vision-board', 'palace', 'explore', 'places', 'yearbook', 'energy', 'lab', 'mindmaps'] },
]

/** Below this width the sidebar becomes an off-canvas drawer. */
const DRAWER_MEDIA_QUERY = '(max-width: 900px)'

const isDrawerWidth = () =>
  typeof window !== 'undefined' && window.matchMedia(DRAWER_MEDIA_QUERY).matches

/**
 * Collapsible navigation.
 *
 * One piece of state, `isOpen`, drives both presentations:
 *   - wide screens  → expanded column vs. icon rail (`--sidebar-collapsed-width`)
 *   - small screens → off-canvas drawer + backdrop, animated with translateX
 *
 * CSS keys off `html[data-sidebar]`, which this component publishes in an
 * effect, so the layout shift costs no re-render of the page content.
 */
export function Sidebar({ active, onNavigate, flags }: SidebarProps) {
  const { t } = useTranslation(undefined, { i18n })
  const [isNarrow, setIsNarrow] = useState(isDrawerWidth)
  const [isOpen, setIsOpen] = useState(() => {
    try {
      return (
        !isDrawerWidth() &&
        localStorage.getItem('bloom-sidebar') !== 'collapsed'
      )
    } catch {
      return !isDrawerWidth()
    }
  })
  const sidebarRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!isNarrow) {
      try {
        localStorage.setItem('bloom-sidebar', isOpen ? 'open' : 'collapsed')
      } catch {
        /* Navigation still works without storage. */
      }
    }
  }, [isOpen, isNarrow])

  const drawerOpen = isNarrow && isOpen

  // "[" toggles the sidebar, like many productivity apps (ignored while typing).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        event.key !== '[' ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        target?.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')
      )
        return
      setIsOpen((open) => !open)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Publish the state for the global layout rules in App.css.
  useEffect(() => {
    document.documentElement.dataset.sidebar = isOpen ? 'open' : 'collapsed'
    return () => {
      delete document.documentElement.dataset.sidebar
    }
  }, [isOpen])

  // Crossing a breakpoint must not strand the wrong presentation: arriving at
  // drawer widths closes the drawer, leaving them re-expands the column.
  useEffect(() => {
    const query = window.matchMedia(DRAWER_MEDIA_QUERY)
    const onChange = (event: MediaQueryListEvent) => {
      setIsNarrow(event.matches)
      try {
        setIsOpen(
          !event.matches &&
            localStorage.getItem('bloom-sidebar') !== 'collapsed',
        )
      } catch {
        setIsOpen(!event.matches)
      }
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  // Escape closes the drawer while it is open.
  useEffect(() => {
    if (!drawerOpen) return
    const menuButton = menuRef.current
    const main = document.querySelector('main')
    if (main) main.inert = true
    sidebarRef.current?.querySelector<HTMLElement>('a, button')?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
      if (event.key === 'Tab') {
        const controls = Array.from(
          sidebarRef.current?.querySelectorAll<HTMLElement>(
            'a, button:not([tabindex="-1"])',
          ) ?? [],
        ).filter((el) => el.getClientRects().length)
        const first = controls[0],
          last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      if (main) main.inert = false
      menuButton?.focus()
    }
  }, [drawerOpen])

  // Keep the page behind an open drawer from scrolling under it.
  useEffect(() => {
    if (!drawerOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [drawerOpen])

  const closeIfDrawer = useCallback(() => {
    if (isDrawerWidth()) setIsOpen(false)
  }, [])

  const items: {
    key: NavKey
    title: string
    Icon: LucideIcon
    /** Feature that must be on for this destination to be reachable. */
    requires?: keyof FeatureFlags
  }[] = [
    {
      key: 'overview',
      title: t('navigation.dashboard'),
      Icon: LayoutDashboard,
    },
    {
      key: 'habits',
      title: t('navigation.habits'),
      Icon: ListChecks,
      requires: 'habitTracker',
    },
    {
      key: 'journal',
      title: t('navigation.journal'),
      Icon: BookOpen,
      requires: 'chatJournal',
    },
    {
      key: 'daybook',
      title: t('ui.daybookNav'),
      Icon: Pencil,
      requires: 'daybookModes',
    },
    { key: 'todos', title: 'To-dos', Icon: CheckSquare },
    {
      key: 'calendar',
      title: 'Full calendar',
      Icon: CalendarDays,
      requires: 'fullCalendar',
    },
    {
      key: 'urges',
      title: 'Urges',
      Icon: ShieldCheck,
      requires: 'urgeTracker',
    },
    { key: 'challenges', title: 'Challenges', Icon: Trophy },
    { key: 'focus', title: 'Focus', Icon: Timer },
    {
      key: 'collectibles',
      title: 'My Collectibles',
      Icon: CarFront,
      requires: 'collectibles',
    },
    { key: 'growth', title: 'Growth', Icon: Sprout, requires: 'rpgSkillTree' },
    { key: 'planning', title: t('navigation.intentions'), Icon: Sun },
    {
      key: 'vision-board',
      title: t('settings.feature.visionBoard.title'),
      Icon: Map,
      requires: 'visionBoard',
    },
    {
      key: 'world',
      title: t('settings.feature.bloomWorld.title'),
      Icon: Castle,
      requires: 'bloomWorld',
    },
    { key: 'breathe', title: 'Breathe', Icon: Wind, requires: 'breathe' },
    { key: 'mood', title: 'Mood check-in', Icon: Smile, requires: 'moodCheckin' },
    {
      key: 'gratitude',
      title: 'Gratitude jar',
      Icon: Heart,
      requires: 'gratitude',
    },
    { key: 'sleep', title: 'Sleep', Icon: BedDouble, requires: 'sleepTracker' },
    { key: 'shop', title: 'Petal shop', Icon: ShoppingBag, requires: 'petalShop' },
    { key: 'release', title: 'Let it go', Icon: Flame, requires: 'burnRelease' },
    { key: 'focus-room', title: 'Focus room', Icon: Armchair, requires: 'focusRoom' },
    { key: 'explore', title: 'Explore data', Icon: Filter, requires: 'queryBuilder' },
    { key: 'yearbook', title: 'Year book', Icon: BookMarked, requires: 'yearbook' },
    { key: 'palace', title: 'Memory palace', Icon: Boxes, requires: 'memoryPalace' },
    { key: 'journey', title: 'Streak journey', Icon: Route, requires: 'streakJourney' },
    { key: 'places', title: 'Places', Icon: MapPinned, requires: 'placesMap' },
    { key: 'posture', title: 'Posture guard', Icon: PersonStanding, requires: 'postureGuard' },
    { key: 'epiphanies', title: 'Epiphanies', Icon: Lightbulb, requires: 'epiphanies' },
    { key: 'diet', title: 'Nourish', Icon: AppleNav, requires: 'dietTracker' },
    { key: 'monk', title: 'Monk mode', Icon: FeatherNav, requires: 'monkMode' },
    { key: 'voice', title: 'Voice memos', Icon: MicNav, requires: 'voiceMemos' },
    { key: 'energy', title: 'Energy flow', Icon: ZapNav, requires: 'energySankey' },
    { key: 'lab', title: 'Correlations', Icon: FlaskConicalNav, requires: 'insightsLab' },
    { key: 'taichi', title: 'Tai Chi', Icon: WavesNav, requires: 'wuXing' },
    { key: 'games', title: "Brain games", Icon: Gamepad2F_brainGames, requires: 'brainGames' },
    { key: 'cards', title: "Flashcards", Icon: LayersF_flashcards, requires: 'flashcards' },
    { key: 'mindmaps', title: "Mind maps", Icon: NetworkF_mindMaps, requires: 'mindMaps' },
    { key: 'mirror', title: "Mood mirror", Icon: ScanFaceF_moodMirror, requires: 'moodMirror' },
    { key: 'ink', title: "Ink journal", Icon: PenLineF_inkJournal, requires: 'inkJournal' },
    { key: 'mala', title: "Mala", Icon: CircleDotF_mala, requires: 'mala' },
    { key: 'breathwork', title: "Breathwork", Icon: WindF_breathwork, requires: 'breathwork' },
    { key: 'meditate', title: "Meditate", Icon: SparklesF_meditation, requires: 'meditation' },
    { key: 'mixer', title: "Soundscapes", Icon: CloudRainF_soundMixer, requires: 'soundMixer' },
    { key: 'sounds', title: "Focus sounds", Icon: AudioLinesF_focusSounds, requires: 'focusSounds' },
    { key: 'fasting', title: "Fasting", Icon: HourglassF_fasting, requires: 'fasting' },
    { key: 'scan', title: "Food scanner", Icon: ScanBarcodeF_foodScanner, requires: 'foodScanner' },
    { key: 'body', title: "Body progress", Icon: RulerF_bodyProgress, requires: 'bodyProgress' },
    { key: 'run', title: "Run & walk", Icon: FootprintsF_runTracker, requires: 'runTracker' },
    { key: 'stretch', title: "Stretch", Icon: PersonStandingF_mobility, requires: 'mobility' },
    { key: 'yoga', title: "Yoga", Icon: Flower2F_yogaFlow, requires: 'yogaFlow' },
    { key: 'intervals', title: "Intervals", Icon: TimerResetF_intervalCoach, requires: 'intervalCoach' },
    { key: 'workouts', title: "Workouts", Icon: BicepsFlexedF_workoutLog, requires: 'workoutLog' },
    { key: 'exercises', title: "Exercises", Icon: DumbbellF_exerciseGuides, requires: 'exerciseGuides' },
    // Settings is always reachable: it is where features get switched back on.
    { key: 'settings', title: t('dashboard.settings'), Icon: Settings },
  ]

  // Group the (long) list into sections so it stays scannable.
  const sectionOf = (key: NavKey) => {
    const index = navSections.findIndex((section) => section.keys.includes(key))
    // Unsectioned destinations (Settings) stay at the end.
    return index < 0 ? navSections.length : index
  }
  const visibleItems = items
    .filter((item) => !item.requires || flags[item.requires])
    .map((item, order) => ({ ...item, order, section: sectionOf(item.key) }))
    .sort((a, b) => a.section - b.section || a.order - b.order)

  const toggleLabel = isOpen ? t('sidebar.collapse') : t('sidebar.expand')

  const handleNavigate = (key: NavKey) => {
    onNavigate(key)
    closeIfDrawer()
  }

  return (
    <>
      <button
        type="button"
        ref={menuRef}
        className={styles.hamburger}
        aria-label={isOpen ? t('sidebar.closeMenu') : t('sidebar.openMenu')}
        aria-expanded={isOpen}
        aria-controls="app-sidebar"
        tabIndex={isNarrow ? undefined : -1}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div
        className={styles.backdrop}
        data-visible={drawerOpen ? 'true' : 'false'}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <aside
        ref={sidebarRef}
        inert={isNarrow && !isOpen}
        className="sidebar fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-foreground"
        id="app-sidebar"
        data-state={isOpen ? 'open' : 'collapsed'}
      >
        <a
          className="brand"
          href="#overview"
          onClick={(event) => {
            event.preventDefault()
            handleNavigate('overview')
          }}
        >
          <span className="brand-icon">
            <Flower2 size={27} />
          </span>
          <span className={styles.brandText}>
            bloom
            <small>{t('welcome.eyebrow')}</small>
          </span>
        </a>

        {drawerOpen && (
          <button
            className={styles.drawerClose}
            onClick={() => setIsOpen(false)}
            aria-label={t('sidebar.closeMenu')}
          >
            <X size={20} />
          </button>
        )}
        <button
          type="button"
          className={styles.collapseToggle}
          aria-label={toggleLabel}
          title={`${toggleLabel} ([)`}
          aria-expanded={isOpen}
          aria-controls="app-sidebar"
          tabIndex={isNarrow ? -1 : undefined}
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? (
            <PanelLeftClose size={19} aria-hidden="true" />
          ) : (
            <PanelLeftOpen size={19} aria-hidden="true" />
          )}
        </button>
        <nav aria-label={t('navigation.main')}>
          {visibleItems.map(({ key, title, Icon, section }, index) => (
            <Fragment key={key}>
            {(index === 0 || visibleItems[index - 1].section !== section) &&
              section < navSections.length && (
                <div className="nav-caption nav-section" aria-hidden="true">
                  {index === 0 ? t('navigation.space') : navSections[section].label}
                </div>
              )}
            <button
              key={key}
              type="button"
              className={active === key ? 'active' : ''}
              aria-current={active === key ? 'page' : undefined}
              // Without the visible label the icon needs its own name.
              {...(isOpen ? {} : { 'aria-label': title, title })}
              onClick={() => handleNavigate(key)}
            >
              <Icon size={19} aria-hidden="true" />
              <span className={styles.navLabel}>{title}</span>
              {active === key && <span className="nav-indicator" />}
            </button>
            </Fragment>
          ))}
        </nav>
        <div className="sidebar-encourage" aria-hidden={!isOpen}>
          <p>
            You’re doing better than you think.{' '}
            <span aria-hidden="true">🌱</span>
          </p>
          <img src={sidebarPlant} alt="" />
        </div>
      </aside>
    </>
  )
}
