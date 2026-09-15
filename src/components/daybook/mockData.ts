import type { JournalMode, JournalCategory } from './types'
import i18n from '../../i18n'

type Translate = (key: string, options?: Record<string, unknown>) => unknown

type ModeSeed = {
  id: string
  category: JournalCategory
  icon: string
  editorType: JournalMode['editorType']
}

const seeds: ModeSeed[] = [
  { id: 'morning-intentionality', category: 'planning', icon: '☀', editorType: 'focus' },
  { id: 'bullet-journal', category: 'planning', icon: '•', editorType: 'bujo' },
  { id: 'weekly-review', category: 'planning', icon: '↗', editorType: 'split-pane' },
  { id: 'done-list', category: 'planning', icon: '✓', editorType: 'freeform' },
  { id: 'energy-audit', category: 'planning', icon: '◒', editorType: 'guided' },
  { id: 'nightly-reflection', category: 'reflection', icon: '☾', editorType: 'guided' },
  { id: 'mental-health-check-in', category: 'reflection', icon: '♡', editorType: 'guided' },
  { id: 'gratitude-log', category: 'reflection', icon: '✦', editorType: 'guided' },
  { id: 'unsent-letter', category: 'reflection', icon: '✉', editorType: 'freeform' },
  { id: 'shadow-work', category: 'reflection', icon: '◐', editorType: 'guided' },
  { id: 'future-self-vision', category: 'vision', icon: '◎', editorType: 'split-pane' },
  { id: 'future-self-letter', category: 'vision', icon: '⌁', editorType: 'freeform' },
  { id: 'fear-setting', category: 'vision', icon: '△', editorType: 'split-pane' },
  { id: 'stoic-visualization', category: 'vision', icon: '◇', editorType: 'guided' },
  { id: 'dream-journal', category: 'vision', icon: '☁', editorType: 'freeform' },
  { id: 'rpg-quest-log', category: 'gamified', icon: '⚔', editorType: 'guided' },
  { id: 'peak-experience', category: 'gamified', icon: '★', editorType: 'guided' },
  { id: 'habit-autopsy', category: 'gamified', icon: '⌁', editorType: 'split-pane' },
  { id: 'five-minute-morning', category: 'gamified', icon: '5', editorType: 'guided' },
  { id: 'decision-matrix', category: 'gamified', icon: '⊞', editorType: 'split-pane' },
]

const timeKey = (editorType: JournalMode['editorType']) =>
  editorType === 'focus' ? 'five' : editorType === 'guided' ? 'ten' : 'fifteen'

const build = (tt: Translate): JournalMode[] =>
  seeds.map((seed) => {
    const prompts = tt(`daybook.mode.${seed.id}.prompts`, { returnObjects: true })
    return {
      id: seed.id,
      title: String(tt(`daybook.mode.${seed.id}.title`)),
      category: seed.category,
      description: String(tt(`daybook.mode.${seed.id}.description`)),
      icon: seed.icon,
      editorType: seed.editorType,
      prompts: Array.isArray(prompts) ? (prompts as string[]) : undefined,
      metadata: {
        time: String(tt(`daybook.time.${timeKey(seed.editorType)}`)),
        bestFor: String(
          tt(
            seed.category === 'planning'
              ? 'daybook.bestFor.planning'
              : 'daybook.bestFor.reflection',
          ),
        ),
      },
    }
  })

/** English baseline (stable for tests and SSR); use localizedJournalModes for the active language. */
export const journalModes: JournalMode[] = build(
  i18n.getFixedT('en') as unknown as Translate,
)

export const localizedJournalModes = (language: string): JournalMode[] =>
  build(i18n.getFixedT(language) as unknown as Translate)