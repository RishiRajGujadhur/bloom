import { useState } from 'react'
import { SwipeDeck } from '../../components/ui/SwipeDeck'
import { MoodGuide, type GuidedMood } from '../../components/ui/MoodGuide'
import { QuickPanel, logMood } from '../../components/ui/QuickPanel'
import { foodLibrary, type Food, type Meal, type MealKind } from '../diet/dietModel'
import { subOn } from '../subFeatures'

const on = (id: string) => subOn('dietTracker', id)

/** Which quick foods fit each meal slot. */
export const slotFoods: Record<MealKind, string[]> = {
  breakfast: ['Oats with berries', 'Two eggs on toast', 'Avocado toast', 'Greek yoghurt', 'Banana', 'Latte'],
  lunch: ['Chicken salad', 'Wrap', 'Lentil soup', 'Pasta bowl', 'Rice and curry', 'Apple'],
  dinner: ['Salmon and greens', 'Rice and curry', 'Pasta bowl', 'Lentil soup', 'Pizza slices', 'Chicken salad'],
  snack: ['Apple', 'Banana', 'Handful of nuts', 'Greek yoghurt', 'Chocolate', 'Latte'],
}
export const foodsFor = (kind: MealKind) => slotFoods[kind].map((n) => foodLibrary.find((f) => f.name === n)).filter((f): f is Food => !!f)

const afterMoods: (GuidedMood & { feeling: NonNullable<Meal['feeling']> })[] = [
  { id: 'energised', emoji: '⚡', label: 'Energised', color: '#f08a4b', hint: 'Note what gave you energy.', feeling: 'energised' },
  { id: 'steady', emoji: '🙂', label: 'Steady', color: '#7fc8a9', hint: 'Balanced — nice.', feeling: 'steady' },
  { id: 'sluggish', emoji: '😴', label: 'Sluggish', color: '#8e9aaf', hint: 'Insights will spot foods that do this.', feeling: 'sluggish' },
]

export function DietQuick({ kind, water, target, onAdd, onWater, onFeeling, hasMeal }: {
  kind: MealKind
  water: number
  target: number
  onAdd: (food: Food) => void
  onWater: (n: number) => void
  onFeeling: (f: NonNullable<Meal['feeling']>) => void
  hasMeal: boolean
}) {
  const [after, setAfter] = useState<string | null>(null)
  if (!on('swipeFoods') && !on('quickWater') && !on('afterFeeling')) return null
  return (
    <QuickPanel id="diet" title={`Log ${kind} in a swipe`}>
      {on('swipeFoods') && (
        <SwipeDeck
          label={`Swipe right on what you had for ${kind}`}
          yes="Had it"
          no="No"
          cards={foodsFor(kind).map((f) => ({ id: f.name, emoji: f.emoji, title: f.name, detail: `${f.kcal} kcal · ${f.protein} g protein` }))}
          empty="Anything else? Use the form below."
          onSwipe={(card, yes) => {
            const f = foodLibrary.find((x) => x.name === card.id)
            if (yes && f) onAdd(f)
          }}
        />
      )}
      {on('quickWater') && (
        <div className="studio-chip-row">
          <button type="button" className="primary" onClick={() => onWater(water + 1)}>💧 +1 glass</button>
          <small className="quick-note">{water}/{target} glasses today</small>
        </div>
      )}
      {on('afterFeeling') && hasMeal && (
        <MoodGuide
          label="How do you feel after your last meal?"
          moods={afterMoods}
          value={after}
          onChange={(m) => {
            setAfter(m)
            logMood('diet', m)
            onFeeling(afterMoods.find((x) => x.id === m)!.feeling)
          }}
        />
      )}
    </QuickPanel>
  )
}
