import { useState, type Dispatch, type SetStateAction } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { SwipeDeck } from '../../components/ui/SwipeDeck'
import { MoodGuide, guidedMoods, moodById } from '../../components/ui/MoodGuide'
import { QuickPanel, logMood, readMoodLog } from '../../components/ui/QuickPanel'
import type { MoodEntry } from '../wellbeing/store'
import { subOn } from '../subFeatures'

const on = (id: string) => subOn('moodCheckin', id)

/** Guided mood → 1–5 score used by the mood history and charts. */
export const moodScore: Record<string, number> = { happy: 5, energised: 5, calm: 4, focused: 4, tired: 3, anxious: 2, stressed: 2, low: 1 }

export const factors = [
  { id: 'slept', emoji: '🛌', title: 'Did you sleep well?' },
  { id: 'ate', emoji: '🥗', title: 'Have you eaten properly?' },
  { id: 'moved', emoji: '🚶', title: 'Did you move your body today?' },
  { id: 'talked', emoji: '💬', title: 'Talked to someone you like?' },
  { id: 'outside', emoji: '☀️', title: 'Been outside today?' },
  { id: 'screens', emoji: '📱', title: 'Kept screens in check?' },
]

/** A next step in another Bloom feature, matched to the mood. */
export const nextSteps: Record<string, { label: string; page: string }> = {
  anxious: { label: 'Breathe for a minute', page: 'breathe' },
  stressed: { label: 'Release it in the burn jar', page: 'release' },
  low: { label: 'Write three good things', page: 'gratitude' },
  tired: { label: 'Check your sleep', page: 'sleep' },
  energised: { label: 'Start a focus session', page: 'focus' },
  focused: { label: 'Start a focus session', page: 'focus' },
  happy: { label: 'Capture it in the Daybook', page: 'daybook' },
  calm: { label: 'Set an intention', page: 'overview' },
}

export function MoodQuick({ setEntries }: { setEntries: Dispatch<SetStateAction<MoodEntry[]>> }) {
  const [mood, setMood] = useState<string | null>(null)
  const [entryId, setEntryId] = useState<string | null>(null)
  const [timeline] = useAutoAnimate()
  const since = new Date().setHours(0, 0, 0, 0)
  const today = readMoodLog().filter((e) => e.at >= since)
  const addFactor = (text: string) =>
    setEntries((list) => list.map((e) => (e.id === entryId ? { ...e, note: [e.note, text].filter(Boolean).join(' · ') } : e)))

  return (
    <QuickPanel id="mood" title="One-tap check-in">
      <MoodGuide
        value={mood}
        onChange={(m) => {
          setMood(m)
          logMood('mood', m)
          if (!on('oneTapLog')) return
          const id = crypto.randomUUID()
          setEntryId(id)
          setEntries((list) => [{ id, at: Date.now(), mood: moodScore[m] ?? 3, note: '', emotions: [moodById(m)!.label.toLowerCase()] }, ...list])
        }}
      />
      {mood && on('nextStep') && (
        <a className="quick-next" href={`#${nextSteps[mood].page}`}>
          {moodById(mood)?.emoji} Next: {nextSteps[mood].label} →
        </a>
      )}
      {mood && entryId && on('factorSwipe') && (
        <SwipeDeck
          label="What's behind this mood? Swipe yes or no"
          cards={factors}
          empty="Saved. Patterns show up in Insights."
          onSwipe={(card, yes) => addFactor(`${yes ? '✓' : '✗'} ${card.id}`)}
        />
      )}
      {on('crossFeature') && today.length > 0 && (
        <div>
          <small className="quick-note">Moods you tagged across Bloom today</small>
          <ol ref={timeline} className="mood-timeline">
            {today.map((e) => {
              const g = guidedMoods.find((x) => x.id === e.mood)
              return (
                <li key={e.at} style={{ ['--mood' as string]: g?.color }} title={`${g?.label} · ${e.feature} · ${new Date(e.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}>
                  <span>{g?.emoji}</span>
                  <small>{e.feature}</small>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </QuickPanel>
  )
}
