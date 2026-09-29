export type ScopeToken = { name: string; value: string }
export type ScopeScene = {
  id: string
  title: string
  story: string
  code: string
  question: string
  choices: string[]
  answer: string
  explanation: string
  outer: ScopeToken[]
  inner: ScopeToken[]
  scopeNote: string
}

export const SCOPE_SCENES: ScopeScene[] = [
  {
    id: 'shadow', title: 'Two seed boxes',
    story: 'Mira counts seeds in the garden, then opens a small plot with its own seed box.',
    code: 'let seeds = 2;\n{\n  let seeds = 5;\n}\nconsole.log(seeds);',
    question: 'What does the console show after Mira leaves the plot?', choices: ['2', '5', '7', 'ReferenceError'], answer: '2',
    explanation: 'The inner let creates a separate seeds binding. Outside the block, the outer seeds is still 2.',
    outer: [{ name: 'seeds', value: '2' }], inner: [{ name: 'seeds', value: '5' }], scopeNote: 'Same name, two different bindings.',
  },
  {
    id: 'update', title: 'One shared basket',
    story: 'Mira enters the plot with a basket from the garden and changes its count.',
    code: 'let baskets = 1;\n{\n  baskets = 4;\n}\nconsole.log(baskets);',
    question: 'What count remains when Mira returns?', choices: ['1', '4', 'undefined', 'ReferenceError'], answer: '4',
    explanation: 'There is no new let inside the block. The assignment updates the outer baskets binding.',
    outer: [{ name: 'baskets', value: '4' }], inner: [], scopeNote: 'The block uses the outer binding.',
  },
  {
    id: 'hidden', title: 'A secret in the plot',
    story: 'Mira names a new sprout inside the plot, then tries to read that name back in the garden.',
    code: "{\n  const sprout = 'Fern';\n}\nconsole.log(sprout);",
    question: 'What happens outside the plot?', choices: ['Fern', 'undefined', 'null', 'ReferenceError'], answer: 'ReferenceError',
    explanation: 'sprout exists only inside the block. Reading it outside cannot find that binding.',
    outer: [], inner: [{ name: 'sprout', value: 'Fern' }], scopeNote: 'The inner binding cannot be read outside.',
  },
  {
    id: 'constant', title: 'A fixed garden sign',
    story: 'Mira writes a fixed plot number, then tries to replace it.',
    code: 'const plot = 3;\nplot = 4;',
    question: 'What happens when she assigns 4?', choices: ['plot becomes 4', 'plot stays 3 silently', 'TypeError', 'ReferenceError'], answer: 'TypeError',
    explanation: 'const creates a binding that cannot be reassigned. The attempted assignment throws a TypeError.',
    outer: [{ name: 'plot', value: '3' }], inner: [], scopeNote: 'The binding is visible but cannot be reassigned.',
  },
]

export function checkScopeScene(scene: ScopeScene, choice: string) {
  return { correct: choice === scene.answer, explanation: scene.explanation }
}
