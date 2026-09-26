import { useState } from 'react'
import { SwipeDeck } from '../../components/ui/SwipeDeck'
import { MoodGuide } from '../../components/ui/MoodGuide'
import { QuickPanel, lastMood, logMood } from '../../components/ui/QuickPanel'
import { writeStore } from '../../components/studio/Studio'
import type { AppData } from '../../model'
import { subOn } from '../subFeatures'
import { scenes, type SceneId } from './GrowScene'

export const focusOn = (id: string) => subOn('focusRoom', id, { ignoreParent: true })
export const SCENE_KEY = 'bloom-focus-scene-v1'

/** Session length that suits a mood. */
export const moodMinutes: Record<string, number> = { energised: 50, focused: 50, happy: 25, calm: 25, tired: 15, stressed: 15, anxious: 5, low: 5 }

export function FocusQuick({
  data,
  scene,
  setScene,
  onPlan,
}: {
  data: AppData
  scene: SceneId | 'pixel'
  setScene: (s: SceneId | 'pixel') => void
  onPlan: (patch: { durationMinutes?: number; taskId?: string | null }) => void
}) {
  const [mood, setMood] = useState(() => lastMood('focus'))
  const open = data.todos.filter((t) => !t.done)
  return (
    <QuickPanel id="focus" title="Set up in two taps">
      {focusOn('moodLength') && (
        <MoodGuide
          label="Energy right now? We'll size the session."
          value={mood}
          onChange={(m) => {
            setMood(m)
            logMood('focus', m)
            onPlan({ durationMinutes: moodMinutes[m] ?? 25 })
          }}
        />
      )}
      {focusOn('taskSwipe') && open.length > 0 && (
        <SwipeDeck
          label="Swipe right on the task to focus on"
          yes="This one"
          no="Not now"
          cards={open.slice(0, 12).map((t) => ({ id: t.id, emoji: t.priority === 'P1' ? '🔥' : '🎯', title: t.title, detail: `${t.priority} · due ${t.due}` }))}
          empty="Open focus it is."
          onSwipe={(card, yes) => yes && onPlan({ taskId: card.id })}
        />
      )}
      {focusOn('growScenes') && (
        <div className="studio-chip-row" role="group" aria-label="Grow scene">
          {[{ id: 'pixel', name: 'Pixel plant', emoji: '🪴' }, ...scenes].map((s) => (
            <button
              key={s.id}
              type="button"
              className="studio-chip"
              aria-pressed={scene === s.id}
              onClick={() => {
                setScene(s.id as SceneId | 'pixel')
                writeStore(SCENE_KEY, s.id)
              }}
            >
              {s.emoji} {s.name}
            </button>
          ))}
        </div>
      )}
    </QuickPanel>
  )
}
