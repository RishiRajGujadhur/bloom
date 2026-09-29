import { checkSelector, sceneNodes, SELECTOR_CASES } from '../src/features/code/selectorDetectiveModel'

describe('CSS selector detective', () => {
  it('solves each original case with the taught selector', () => {
    for (const scene of SELECTOR_CASES) {
      expect(checkSelector(scene, scene.example)).toMatchObject({ pass: true, matched: scene.targets })
      expect(sceneNodes(scene).length).toBeGreaterThan(scene.targets.length)
    }
  })

  it('explains invalid syntax, missing clues, and decoys', () => {
    expect(checkSelector(SELECTOR_CASES[0], '[').feedback).toMatch(/not valid CSS/)
    expect(checkSelector(SELECTOR_CASES[0], '.gallery').feedback).toMatch(/Still missing/)
    expect(checkSelector(SELECTOR_CASES[1], 'ul > li.active').feedback).toMatch(/decoys: nested/)
    expect(checkSelector(SELECTOR_CASES[2], '[data-state="ready"]').feedback).toMatch(/decoys: guide/)
  })
})
