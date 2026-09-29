import { checkScopeScene, SCOPE_SCENES } from '../src/features/code/scopeStoryModel'

test('scope scenes distinguish shadowing, assignment, visibility, and const', () => {
  expect(SCOPE_SCENES.map((item) => item.answer)).toEqual(['2', '4', 'ReferenceError', 'TypeError'])
  for (const scene of SCOPE_SCENES) {
    expect(scene.choices.filter((choice) => checkScopeScene(scene, choice).correct)).toEqual([scene.answer])
    expect(scene.explanation.length).toBeGreaterThan(30)
  }
})
