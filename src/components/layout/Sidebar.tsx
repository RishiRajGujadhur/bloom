import { useCallback, useEffect, useRef, useState } from 'react'
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
  ListChecks,
  Menu,
  Pencil,
  Settings,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import type { FeatureFlags } from '../../SettingsPage'
import styles from './Sidebar.module.css'

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

interface SidebarProps {
  /** Currently highlighted destination. */
  active: string
  /** Called with the target destination; the shell scrolls to it (or swaps page). */
  onNavigate: (key: NavKey) => void
  /** Feature flags: a disabled feature drops out of the navigation entirely. */
  flags: FeatureFlags
}

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
    // Settings is always reachable: it is where features get switched back on.
    { key: 'settings', title: t('dashboard.settings'), Icon: Settings },
  ]

  const visibleItems = items.filter(
    (item) => !item.requires || flags[item.requires],
  )

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
            <small>{t('ui.everydaySpace')}</small>
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
          role="switch"
          aria-label="Icon-only sidebar"
          title={toggleLabel}
          aria-checked={!isOpen}
          aria-controls="app-sidebar"
          tabIndex={isNarrow ? -1 : undefined}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span className={styles.switchTrack} data-checked={!isOpen}>
            <span />
          </span>
          <span className={styles.toggleLabel}>Icons only</span>
        </button>
        <div className="nav-caption">{t('navigation.space')}</div>

        <nav aria-label={t('navigation.main')}>
          {visibleItems.map(({ key, title, Icon }) => (
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
          ))}
        </nav>
      </aside>
    </>
  )
}
