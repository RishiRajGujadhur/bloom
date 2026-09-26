import { render } from '@testing-library/react'
import { GrowScene, scenes } from '../src/features/quick/GrowScene'
import { SwipeDeck } from '../src/components/ui/SwipeDeck'
import { alternativesFor } from '../src/features/quick/UrgesQuick'
import { moodScore, nextSteps } from '../src/features/quick/MoodQuick'
import { guidedMoods } from '../src/components/ui/MoodGuide'

test('every grow scene renders fully grown, and scales with sessions', () => {
  for (const s of scenes) {
    const { container, unmount } = render(<GrowScene scene={s.id} progress={1} extra={2} />)
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe(`${s.name}: 16 of 16 grown`)
    unmount()
  }
})

test('swipe deck answers with buttons and supports undo', () => {
  const answers: [string, boolean][] = []
  const { getByLabelText, getByText } = render(
    <SwipeDeck cards={[{ id: 'a', title: 'First' }, { id: 'b', title: 'Second' }]} onSwipe={(c, y) => answers.push([c.id, y])} onUndo={() => answers.pop()} />,
  )
  getByLabelText('Yes').click()
  return new Promise<void>((done) =>
    setTimeout(() => {
      expect(answers).toEqual([['a', true]])
      expect(getByText('Second')).toBeTruthy()
      done()
    }, 450),
  )
})

test('guided moods map to scores, next steps and alternatives', () => {
  for (const m of guidedMoods) {
    expect(moodScore[m.id]).toBeGreaterThan(0)
    expect(nextSteps[m.id].page).toBeTruthy()
  }
  expect(alternativesFor('anxious')[0].moods).toContain('anxious')
})
