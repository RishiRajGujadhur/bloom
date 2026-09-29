import type { CodePath } from './learningPaths'

export type SkillQuestion = { prompt: string; options: string[]; answer: number; why: string }

export const skillQuestions: Record<string, SkillQuestion[]> = {
  frontend: [
    { prompt: 'Which element identifies the main content of a page?', options: ['<main>', '<div>', '<bold>'], answer: 0, why: '<main> is the landmark for a page’s primary content.' },
    { prompt: 'Which rule lays items along a flex row?', options: ['font-weight: flex', 'display: flex', 'position: row'], answer: 1, why: 'display: flex creates a flex container; row is its default direction.' },
    { prompt: 'Which browser event is useful for reacting to a button press?', options: ['resize', 'load', 'click'], answer: 2, why: 'A click event can trigger the button’s action.' },
    { prompt: 'What should an icon-only button have?', options: ['A bigger shadow', 'An accessible name', 'No text anywhere'], answer: 1, why: 'An accessible name tells assistive technology what the button does.' },
  ],
  react: [
    { prompt: 'What lets a component receive data from its parent?', options: ['Props', 'CSS', 'A console log'], answer: 0, why: 'Props pass values into a component.' },
    { prompt: 'What should update when a counter button is pressed?', options: ['The component’s source file', 'State', 'The browser URL'], answer: 1, why: 'State represents changing UI data.' },
    { prompt: 'What can an effect return to stop a subscription?', options: ['A JSX heading', 'A new prop', 'A cleanup function'], answer: 2, why: 'A cleanup function releases the subscription when it changes or unmounts.' },
    { prompt: 'What keeps a React form input controlled?', options: ['A CSS class', 'A value and onChange handler', 'A random key'], answer: 1, why: 'The value comes from state, and onChange updates that state.' },
  ],
  python: [
    { prompt: 'Which Python value is a list?', options: ['[1, 2]', '{"x": 1}', '(1 + 2)'], answer: 0, why: 'Square brackets create a list.' },
    { prompt: 'Which keyword begins a Python function?', options: ['func', 'def', 'function'], answer: 1, why: 'Python uses def to define a function.' },
    { prompt: 'Which object stores values by key?', options: ['list', 'str', 'dict'], answer: 2, why: 'A dictionary maps keys to values.' },
    { prompt: 'What catches a file-reading error?', options: ['if / loop', 'try / except', 'print / return'], answer: 1, why: 'try / except handles errors such as a missing file.' },
  ],
  algorithms: [
    { prompt: 'Where does an array keep its first item?', options: ['Index 0', 'Index 1', 'The last index'], answer: 0, why: 'In JavaScript arrays, the first item is at index 0.' },
    { prompt: 'Which structure finds a value quickly by a known key?', options: ['Queue', 'Map', 'Stack'], answer: 1, why: 'A map looks up values by key.' },
    { prompt: 'What must a recursive function have to stop?', options: ['A longer name', 'A global variable', 'A base case'], answer: 2, why: 'The base case ends recursion.' },
    { prompt: 'When is binary search useful?', options: ['On any shuffled list', 'On sorted data', 'Only on strings'], answer: 1, why: 'Binary search relies on an ordering so it can discard half the remaining range.' },
  ],
}

export function recommendChapter(path: CodePath, answers: Array<number | null>) {
  const questions = skillQuestions[path.id]
  const gap = questions.findIndex((question, index) => answers[index] !== question.answer)
  return Math.min(gap < 0 ? questions.length : gap, path.chapters.length - 1)
}
