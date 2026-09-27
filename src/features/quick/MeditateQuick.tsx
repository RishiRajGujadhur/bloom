import { useState } from 'react'
import { SwipeDeck } from '../../components/ui/SwipeDeck'
import { MoodGuide } from '../../components/ui/MoodGuide'
import { QuickPanel, lastMood, logMood } from '../../components/ui/QuickPanel'
import { sessionById, type Session } from '../meditate/meditateModel'
import { subOn } from '../subFeatures'

const on = (id: string) => subOn('meditation', id)

/** Sessions that meet each mood, best first. */
export const moodSessions: Record<string, string[]> = {
  anxious: ['sos', 'breath1', 'body'],
  stressed: ['breath1', 'sos', 'body'],
  low: ['kindness', 'breath1', 'body'],
  tired: ['sleep', 'body', 'breath1'],
  happy: ['kindness', 'breath2', 'focus'],
  calm: ['body', 'breath2', 'kindness'],
  energised: ['breath2', 'focus', 'body'],
  focused: ['focus', 'breath2', 'breath1'],
}

export function MeditateQuick({ onStart }: { onStart: (s: Session) => void }) {
  const [mood, setMood] = useState(() => lastMood('meditate'))
  if (!on('moodMatch')) return null
  const picks = mood ? moodSessions[mood].map(sessionById) : []
  return (
    <QuickPanel id="meditate" title="Meet yourself where you are">
      <MoodGuide value={mood} onChange={(m) => { setMood(m); logMood('meditate', m) }} />
      {picks.length > 0 &&
        (on('swipePick') ? (
          <SwipeDeck
            label="Swipe right to begin"
            yes="Begin"
            no="Another"
            cards={picks.map((s) => ({ id: s.id, emoji: s.kind === 'sos' ? '🛟' : s.kind === 'sleep' ? '🌙' : s.kind === 'kindness' ? '💗' : s.kind === 'body' ? '🫧' : '🌬️', title: s.title, detail: `${s.minutes} min` }))}
            empty="Pick any session below."
            onSwipe={(card, yes) => yes && onStart(sessionById(card.id))}
          />
        ) : (
          <button type="button" className="primary" onClick={() => onStart(picks[0])}>
            Begin {picks[0].title} · {picks[0].minutes} min
          </button>
        ))}
    </QuickPanel>
  )
}
