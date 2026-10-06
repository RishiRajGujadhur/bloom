import { useState, type Dispatch, type SetStateAction } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { toggleHabit, type AppData } from '../../model'
import { SwipeDeck } from '../../components/ui/SwipeDeck'
import { MoodGuide, moodById } from '../../components/ui/MoodGuide'
import { QuickPanel, lastMood, logMood } from '../../components/ui/QuickPanel'
import { readStore, writeStore } from '../../components/studio/Studio'
import { burst } from '../../components/ui/celebrate'
import { subOn } from '../subFeatures'

const on = (id: string) => subOn('habitTracker', id)
const SKIP_KEY = 'bloom-habit-skips-v1'
/** Moods that suggest going easy: habits are offered as the smallest version. */
const lowEnergy = new Set(['tired', 'low', 'anxious', 'stressed'])

export function HabitsQuick({ data, setData, today }: { data: AppData; setData: Dispatch<SetStateAction<AppData>>; today: string }) {
  const [mood, setMood] = useState(() => lastMood('habits'))
  const [skips, setSkips] = useState(() => readStore<Record<string, string[]>>(SKIP_KEY, {}))
  const [list] = useAutoAnimate()
  const skippedToday = new Set(skips[today] ?? [])
  const pending = data.habits.filter((h) => !h.dates.includes(today) && !skippedToday.has(h.id))
  const done = data.habits.filter((h) => h.dates.includes(today))
  const easy = mood && lowEnergy.has(mood) && on('gentleMode')
  if (!on('swipeCheckin') && !on('moodTag')) return null
  return (
    <QuickPanel id="habits" title="Quick check-in">
      {on('moodTag') && (
        <MoodGuide
          value={mood}
          onChange={(m) => {
            setMood(m)
            logMood('habits', m)
          }}
        />
      )}
      {on('swipeCheckin') && (
        <SwipeDeck
          label="Swipe right if you did it today"
          yes="Done"
          no={on('skipDay') ? 'Skip' : 'Not yet'}
          cards={pending.map((h) => ({
            id: h.id,
            emoji: '🌱',
            title: easy ? `Even 2 minutes of ${h.title}?` : `Did you ${h.title.toLowerCase()} today?`,
            detail: easy ? 'Tiny counts. Swipe right when done.' : `${h.dates.length} check-ins so far`,
          }))}
          empty={done.length ? `All ${done.length} habits done today 🎉` : 'No habits yet — adopt one from the library.'}
          onUndo={(card, yes) => {
            if (yes) setData((d) => toggleHabit(d, card.id, today))
            else {
              const next = { ...skips, [today]: (skips[today] ?? []).filter((x) => x !== card.id) }
              setSkips(next)
              writeStore(SKIP_KEY, next)
            }
          }}
          onSwipe={(card, yes) => {
            if (yes) {
              setData((d) => toggleHabit(d, card.id, today))
              if (on('allDoneBurst') && pending.length === 1) burst(null, 'stars', 'checkins')
            } else if (on('skipDay')) {
              const next = { ...skips, [today]: [...(skips[today] ?? []), card.id] }
              setSkips(next)
              writeStore(SKIP_KEY, next)
            }
          }}
        />
      )}
      {on('doneList') && done.length > 0 && (
        <ul ref={list} className="quick-done bloom-list">
          {done.map((h) => (
            <li key={h.id}>
              ✅ {h.title}
              <button type="button" className="quiet-button" onClick={() => setData((d) => toggleHabit(d, h.id, today))}>
                Undo
              </button>
            </li>
          ))}
        </ul>
      )}
      {easy && <p className="quick-note">Feeling {moodById(mood)?.label.toLowerCase()} — habits are shown as their tiniest version.</p>}
    </QuickPanel>
  )
}
