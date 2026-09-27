import { useState, type Dispatch, type SetStateAction } from 'react'
import { SwipeDeck } from '../../components/ui/SwipeDeck'
import { MoodGuide } from '../../components/ui/MoodGuide'
import { lastMood, logMood } from '../../components/ui/QuickPanel'
import { id, type AppData } from '../../model'
import { pageOn } from '../subFeatures'

/** Intention templates, each tagged with the moods it suits. */
export const intentionTemplates = [
  { title: 'Do one thing at a time', emoji: '🎯', moods: ['stressed', 'anxious', 'focused'] },
  { title: 'Drink water before coffee', emoji: '💧', moods: ['tired', 'calm'] },
  { title: 'Be kind to myself today', emoji: '💗', moods: ['low', 'anxious', 'stressed'] },
  { title: 'Finish my hardest task first', emoji: '🔥', moods: ['energised', 'focused'] },
  { title: 'Take a walk outside', emoji: '🚶', moods: ['low', 'tired', 'stressed'] },
  { title: 'Say thank you to someone', emoji: '🙏', moods: ['happy', 'calm'] },
  { title: 'Protect an hour of deep work', emoji: '🛡️', moods: ['focused', 'energised'] },
  { title: 'Stop work on time', emoji: '🌙', moods: ['stressed', 'tired'] },
  { title: 'Notice three good moments', emoji: '✨', moods: ['low', 'happy', 'calm'] },
  { title: 'Rest without guilt', emoji: '🛋️', moods: ['tired', 'low'] },
]
export const templatesFor = (mood: string | null) =>
  [...intentionTemplates].sort((a, b) => Number(!!mood && b.moods.includes(mood)) - Number(!!mood && a.moods.includes(mood)))

export function IntentionsQuick({ data, setData, today }: { data: AppData; setData: Dispatch<SetStateAction<AppData>>; today: string }) {
  const [mood, setMood] = useState(() => lastMood())
  const mine = new Set(data.plans.filter((p) => p.date === today).map((p) => p.title.toLowerCase()))
  if (!pageOn('intentions', 'templateSwipe') || mine.size >= 3) return null
  return (
    <div className="intention-quick">
      {pageOn('intentions', 'moodTemplates') && (
        <MoodGuide label="Pick a mood for ideas" value={mood} onChange={(m) => { setMood(m); logMood('intentions', m) }} />
      )}
      <SwipeDeck
        label="Swipe right to make it today's intention"
        yes="Intend"
        no="Skip"
        cards={templatesFor(mood)
          .filter((t) => !mine.has(t.title.toLowerCase()))
          .map((t) => ({ id: t.title, emoji: t.emoji, title: t.title }))}
        empty="Write your own with the + button."
        onSwipe={(card, yes) => yes && setData((d) => ({ ...d, plans: [...d.plans, { id: id(), title: card.id, date: today, done: false }] }))}
      />
    </div>
  )
}
