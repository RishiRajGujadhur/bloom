import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useRef, useState } from 'react'
import Typed from 'typed.js'
import { SwipeDeck } from '../../components/ui/SwipeDeck'
import { MoodGuide } from '../../components/ui/MoodGuide'
import { QuickPanel, lastMood, logMood } from '../../components/ui/QuickPanel'
import type { JournalMode } from '../../components/daybook/types'
import { subOn } from '../subFeatures'

const on = (id: string) => subOn('daybookModes', id)

/** Journals that suit each mood, best first. */
export const moodJournals: Record<string, string[]> = {
  anxious: [
    'mental-health-check-in',
    'fear-setting',
    'unsent-letter',
    'stoic-visualization',
  ],
  stressed: ['work-shutdown', 'energy-audit', 'boundary-setting', 'done-list'],
  low: [
    'gratitude-log',
    'done-list',
    'connection-check-in',
    'mental-health-check-in',
  ],
  tired: ['done-list', 'nightly-reflection', 'energy-audit', 'dream-journal'],
  happy: [
    'peak-experience',
    'gratitude-log',
    'future-self-letter',
    'connection-check-in',
  ],
  calm: [
    'stoic-visualization',
    'future-self-vision',
    'reading-notes',
    'shadow-work',
  ],
  energised: [
    'morning-intentionality',
    'rpg-quest-log',
    'decision-matrix',
    'future-self-vision',
  ],
  focused: ['clear-writing', 'weekly-review', 'meeting-prep', 'bullet-journal'],
}
/** Morning, afternoon and evening journals, for "by time of day". */
export const timeJournals = (hour: number) =>
  hour < 11
    ? ['five-minute-morning', 'morning-intentionality', 'bullet-journal']
    : hour < 17
      ? ['clear-writing', 'decision-matrix', 'meeting-prep']
      : ['nightly-reflection', 'gratitude-log', 'work-shutdown']

/** A question typed out letter by letter (typed.js) to break the blank page. */
function TypedPrompt({ lines }: { lines: string[] }) {
  const el = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!el.current) return
    if (prefersReducedMotion()) {
      el.current.textContent = lines[0]
      return
    }
    const t = new Typed(el.current, {
      strings: lines,
      typeSpeed: 32,
      backSpeed: 14,
      backDelay: 2200,
      loop: true,
      smartBackspace: true,
    })
    return () => t.destroy()
  }, [lines])
  return (
    <p className="daybook-typed" aria-label={lines[0]}>
      <span ref={el} />
    </p>
  )
}

const sparks = [
  'What took more energy than it should have today?',
  'What would make tomorrow 1% better?',
  'What are you pretending not to know?',
  'Who deserves a thank-you this week?',
  'What did you learn the hard way recently?',
]

export function DaybookQuick({
  modes,
  onSelect,
  initialOpen,
}: {
  modes: JournalMode[]
  onSelect: (mode: JournalMode) => void
  initialOpen?: boolean
}) {
  const [mood, setMood] = useState(() => lastMood('daybook'))
  const byId = (id: string) => modes.find((m) => m.id === id)
  const picks = (
    mood && on('moodPicks')
      ? moodJournals[mood]
      : on('timePicks')
        ? timeJournals(new Date().getHours())
        : []
  )
    .map(byId)
    .filter((m): m is JournalMode => !!m)
  if (!on('moodPicks') && !on('timePicks') && !on('typedSpark')) return null
  return (
    <QuickPanel
      id="daybook"
      title="Not sure what to write?"
      initialOpen={initialOpen}
    >
      {on('typedSpark') && <TypedPrompt lines={sparks} />}
      {on('moodPicks') && (
        <MoodGuide
          value={mood}
          onChange={(m) => {
            setMood(m)
            logMood('daybook', m)
          }}
          label="How are you? We'll suggest a page."
        />
      )}
      {picks.length > 0 && (
        <SwipeDeck
          label="Swipe right to open a journal"
          yes="Write"
          no="Next"
          cards={picks.map((m) => ({
            id: m.id,
            emoji: m.icon,
            title: m.title,
            detail: m.description,
          }))}
          empty="Browse every page type below."
          onSwipe={(card, yes) => {
            const m = byId(card.id)
            if (yes && m) onSelect(m)
          }}
        />
      )}
    </QuickPanel>
  )
}
