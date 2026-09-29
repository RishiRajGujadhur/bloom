export type SelectorCase = {
  title: string
  story: string
  lesson: string
  markup: string
  targets: string[]
  example: string
  syntax: RegExp
  syntaxHint: string
}

export const SELECTOR_CASES: SelectorCase[] = [
  {
    title: 'The marked cards',
    story: 'The gallery curator marked two cards as clues. Select only those cards.',
    lesson: 'A dot selects every element with a class.',
    markup: '<div class="gallery"><article data-node="star" class="clue">Star map</article><article data-node="moon">Moon map</article><article data-node="shell" class="clue">Shell map</article></div>',
    targets: ['star', 'shell'], example: '.clue', syntax: /\.[\w-]+/, syntaxHint: 'Use a class selector, such as .clue.',
  },
  {
    title: 'The direct children',
    story: 'The active notes must be direct children of the list. Ignore the active note nested inside another item.',
    lesson: 'The > combinator selects direct children only.',
    markup: '<ul class="notes"><li data-node="first" class="active">First clue</li><li data-node="second">Second clue <ul><li data-node="nested" class="active">Decoy</li></ul></li><li data-node="third" class="active">Third clue</li></ul>',
    targets: ['first', 'third'], example: '.notes > li.active', syntax: />/, syntaxHint: 'Use > between the .notes list and its direct children.',
  },
  {
    title: 'The ready controls',
    story: 'Only ready buttons can open the archive. Find them without selecting the ready link.',
    lesson: 'An attribute selector checks a value inside square brackets.',
    markup: '<div><button data-node="launch" data-state="ready">Launch</button><button data-node="pause" data-state="waiting">Pause</button><a data-node="guide" data-state="ready">Guide</a><button data-node="save" data-state="ready">Save</button></div>',
    targets: ['launch', 'save'], example: 'button[data-state="ready"]', syntax: /\[[^\]]+\]/, syntaxHint: 'Use an attribute selector, such as [data-state="ready"].',
  },
]

export function checkSelector(test: SelectorCase, selector: string) {
  if (!selector.trim()) return { matched: [] as string[], pass: false, feedback: 'Type a CSS selector to inspect the scene.' }
  const doc = new DOMParser().parseFromString(`<div id="scene">${test.markup}</div>`, 'text/html')
  let matched: string[]
  try {
    matched = Array.from((doc.getElementById('scene') as Element).querySelectorAll(selector))
      .map((node) => node.getAttribute('data-node')).filter((value): value is string => !!value)
  } catch {
    return { matched: [], pass: false, feedback: 'That selector is not valid CSS yet. Check brackets, dots, and spaces.' }
  }
  if (!test.syntax.test(selector)) return { matched, pass: false, feedback: test.syntaxHint }
  const correct = test.targets.every((target) => matched.includes(target)) && matched.length === test.targets.length
  if (correct) return { matched, pass: true, feedback: `Case solved. ${test.lesson}` }
  const missed = test.targets.filter((target) => !matched.includes(target))
  const extra = matched.filter((node) => !test.targets.includes(node))
  return { matched, pass: false, feedback: `Matched ${matched.length} element${matched.length === 1 ? '' : 's'}. ${missed.length ? `Still missing: ${missed.join(', ')}. ` : ''}${extra.length ? `Also selected decoys: ${extra.join(', ')}.` : ''}`.trim() }
}

export function sceneNodes(test: SelectorCase) {
  const doc = new DOMParser().parseFromString(test.markup, 'text/html')
  return Array.from(doc.querySelectorAll('[data-node]')).map((node) => ({ id: node.getAttribute('data-node') ?? '', label: node.textContent?.trim().slice(0, 17) ?? '' }))
}
