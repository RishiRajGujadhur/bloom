import {
  BookOpen,
  CheckSquare,
  ChevronDown,
  ListChecks,
  Search,
  Sun,
  Timer,
} from 'lucide-react'
import { Menu, type MenuItem } from '../ui/Menu'
import { LottieIcon } from '../ui/LottieIcon'
import type { NavKey } from './Sidebar'

type Navigate = (key: NavKey) => void

/** Looks like a search field; opens the command palette (autocomplete). */
export function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  const mac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  return (
    <button type="button" className="topbar-search" onClick={onOpen}>
      <Search size={18} aria-hidden="true" />
      <span>Search your space…</span>
      <kbd className="kbd" aria-hidden="true">
        {mac ? '⌘' : 'Ctrl'} K
      </kbd>
    </button>
  )
}

export function QuickAdd({
  onHabit,
  onIntention,
  onNavigate,
}: {
  onHabit: () => void
  onIntention: () => void
  onNavigate: Navigate
}) {
  const items: MenuItem[] = [
    { label: 'A small habit', icon: <ListChecks size={17} />, onSelect: onHabit },
    { label: 'An intention for today', icon: <Sun size={17} />, onSelect: onIntention },
    { label: 'A to-do', icon: <CheckSquare size={17} />, onSelect: () => onNavigate('todos') },
    { kind: 'separator' },
    { label: 'A journal entry', icon: <BookOpen size={17} />, onSelect: () => onNavigate('journal') },
    { label: 'A focus session', icon: <Timer size={17} />, onSelect: () => onNavigate('focus') },
  ]
  return (
    <Menu
      label="Quick add"
      items={items}
      trigger={
        <button type="button" className="quick-add">
          <LottieIcon name="plus" size={18} /> Quick add
          <ChevronDown className="quick-add-chevron" size={16} aria-hidden="true" />
        </button>
      }
    />
  )
}
