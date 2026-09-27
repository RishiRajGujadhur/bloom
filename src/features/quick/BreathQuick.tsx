import { useState } from 'react'
import { MoodGuide, moodById } from '../../components/ui/MoodGuide'
import { QuickPanel, lastMood, logMood } from '../../components/ui/QuickPanel'
import type { Settings } from '../breathwork/breathworkModel'
import { subOn } from '../subFeatures'

const on = (id: string) => subOn('breathwork', id)

/** Gentler sessions for heavy moods, fuller ones when energised. */
export const moodPresets: Record<string, Partial<Settings> & { note: string }> = {
  anxious: { rounds: 1, breaths: 15, pace: 2.2, note: 'One slow, short round. Stop any time.' },
  stressed: { rounds: 2, breaths: 20, pace: 2, note: 'Two unhurried rounds to settle.' },
  low: { rounds: 2, breaths: 25, pace: 1.8, note: 'Two rounds to lift your energy gently.' },
  tired: { rounds: 2, breaths: 30, pace: 1.6, note: 'A wake-up: two classic rounds.' },
  calm: { rounds: 3, breaths: 30, pace: 1.8, note: 'Three steady rounds.' },
  happy: { rounds: 3, breaths: 30, pace: 1.6, note: 'The classic three rounds.' },
  focused: { rounds: 3, breaths: 30, pace: 1.6, note: 'Three rounds before deep work.' },
  energised: { rounds: 4, breaths: 35, pace: 1.4, note: 'Four fuller rounds.' },
}

export function BreathQuick({ onPreset }: { onPreset: (p: Partial<Settings>) => void }) {
  const [mood, setMood] = useState(() => lastMood('breathwork'))
  if (!on('moodPreset')) return null
  const preset = mood ? moodPresets[mood] : null
  return (
    <QuickPanel id="breathwork" title="Size the session to your mood">
      <MoodGuide
        value={mood}
        onChange={(m) => {
          setMood(m)
          logMood('breathwork', m)
          const { note, ...cfg } = moodPresets[m]
          void note
          onPreset(cfg)
        }}
      />
      {preset && (
        <p className="quick-note">
          {moodById(mood)?.emoji} Set to {preset.rounds} round{preset.rounds === 1 ? '' : 's'} × {preset.breaths} breaths. {preset.note}
        </p>
      )}
    </QuickPanel>
  )
}
