import { useState } from 'react'
import { MoodGuide } from '../../components/ui/MoodGuide'
import { lastMood, logMood } from '../../components/ui/QuickPanel'
import { subOn } from '../subFeatures'

/** The deck that meets each mood. */
export const moodDeck: Record<string, string> = {
  anxious: 'calm',
  stressed: 'calm',
  low: 'kindness',
  tired: 'kindness',
  calm: 'gratitude',
  happy: 'gratitude',
  energised: 'growth',
  focused: 'confidence',
}

/** Compact mood row above the cards; a tap switches to the matching deck. */
export function AffirmQuick({ onDeck }: { onDeck: (deck: string) => void }) {
  const [mood, setMood] = useState(() => lastMood('affirm'))
  if (!subOn('affirmations', 'moodDeck')) return null
  return (
    <MoodGuide
      label="How are you? We'll pick the deck."
      value={mood}
      onChange={(m) => {
        setMood(m)
        logMood('affirm', m)
        onDeck(moodDeck[m])
      }}
    />
  )
}
