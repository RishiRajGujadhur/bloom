import { useCallback, useEffect, useState } from 'react'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Flower2,
  Heart,
  LayoutDashboard,
  Leaf,
  ListChecks,
  Menu,
  Settings,
  Sun,
  Sword,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageSelector } from '../../i18n/LanguageSelector'
import type { FeatureFlagId, FeatureFlagState } from '../../utils/featureFlags'
import styles from './Sidebar.module.css'

export type NavKey =
  'overview' | 'habits' | 'journal' | 'rpg' | 'planning' | 'settings'

interface SidebarProps {
  /** Currently highlighted section. */
  active: string
  /** Called with the target section id; the shell scrolls to it (or swaps page). */
  onNavigate: (key: NavKey) => void
  /** Feature flags: disabled features drop out of the navigation entirely. */
  flags: FeatureFlagState
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
  const { t } = useTranslation()
  const [isNarrow, setIsNarrow] = useState(isDrawerWidth)
  const [isOpen, setIsOpen] = useState(() => !isDrawerWidth())

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
      setIsOpen(!event.matches)
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  // Escape closes the drawer while it is open.
  useEffect(() => {
    if (!drawerOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
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
    requires?: FeatureFlagId
  }[] = [
    { key: 'overview', title: t('nav.dashboard'), Icon: LayoutDashboard },
    {
      key: 'habits',
      title: t('nav.habits'),
      Icon: ListChecks,
      requires: 'habitTracker',
    },
    {
      key: 'journal',
      title: t('nav.journal'),
      Icon: BookOpen,
      requires: 'chatJournal',
    },
    { key: 'rpg', title: t('nav.rpg'), Icon: Sword, requires: 'rpgDashboard' },
    {
      key: 'planning',
      title: t('nav.planning'),
      Icon: Sun,
      requires: 'intentions',
    },
    // Settings is always reachable: it is where features get switched back on.
    { key: 'settings', title: t('nav.settings'), Icon: Settings },
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
        className={styles.hamburger}
        aria-label={isOpen ? t('common.closeMenu') : t('common.openMenu')}
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
        className="sidebar"
        id="app-sidebar"
        data-state={isOpen ? 'open' : 'collapsed'}
      >
        <a className="brand" href="#overview" onClick={closeIfDrawer}>
          <span className="brand-icon">
            <Flower2 size={27} />
          </span>
          <span className={styles.brandText}>
            bloom
            <small>{t('sidebar.brandTagline')}</small>
          </span>
        </a>

        <div className="nav-caption">{t('sidebar.mySpace')}</div>

        <nav aria-label={t('common.mainNav')}>
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

        <div className="sidebar-note">
          <Leaf size={24} aria-hidden="true" />
          <h3>{t('sidebar.greet')}</h3>
          <p>
            {t('sidebar.message1')}
            <br />
            {t('sidebar.message2')}
          </p>
          <span>{t('sidebar.message3')}</span>
        </div>

        <div className="sidebar-bottom">
          <span className="avatar">{t('sidebar.avatar')}</span>
          <div className={styles.bottomText}>
            <strong>{t('sidebar.personalSpace')}</strong>
            <small>{t('sidebar.noAccount')}</small>
          </div>
          {flags.languageSelector && <LanguageSelector />}
          <Heart size={16} aria-hidden="true" />
        </div>

        <button
          type="button"
          className={styles.collapseToggle}
          aria-label={toggleLabel}
          aria-expanded={isOpen}
          aria-controls="app-sidebar"
          tabIndex={isNarrow ? -1 : undefined}
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          <span className={styles.toggleLabel}>{toggleLabel}</span>
        </button>
      </aside>
    </>
  )
}
