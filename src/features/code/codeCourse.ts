/**
 * Bloom Code — a Codecademy-style JavaScript course. Each lesson has
 * instructions, starter code, checks (run against your code's console output,
 * probe expressions evaluated after it, and the syntax tree), hints and a
 * solution. Quizzes and challenges reuse the same runner.
 */
export type Check = {
  label: string
  /** Pass if console output includes this text. */
  logs?: string
  /** A JS expression evaluated after the learner's code; compared as JSON. */
  probe?: string
  equals?: unknown
  /** The code must contain this kind of syntax (acorn node type). */
  uses?: string
}
export type Lesson = { id: string; module: string; title: string; body: string; starter: string; solution: string; checks: Check[]; hint: string }
export type QuizQ = { id: string; module: string; q: string; code?: string; options: string[]; answer: number; why: string }
export type Challenge = { id: string; title: string; body: string; starter: string; solution: string; checks: Check[]; level: 'easy' | 'medium' | 'hard' }

export const modules = [
  { id: 'basics', title: 'Basics', emoji: '👋', color: '#f7df1e' },
  { id: 'data', title: 'Variables & types', emoji: '📦', color: '#58cc02' },
  { id: 'logic', title: 'Conditionals', emoji: '🔀', color: '#1cb0f6' },
  { id: 'loops', title: 'Loops', emoji: '🔁', color: '#ce82ff' },
  { id: 'functions', title: 'Functions', emoji: '🧩', color: '#ff9600' },
  { id: 'arrays', title: 'Arrays', emoji: '📚', color: '#ff4b4b' },
  { id: 'objects', title: 'Objects', emoji: '🗂️', color: '#2ec4b6' },
]

export const lessons: Lesson[] = [
  {
    id: 'hello', module: 'basics', title: 'Hello, console',
    body: '`console.log()` prints to the console. Everything inside the brackets is shown.\n\n**Task:** print `Hello, Bloom!`',
    starter: '// Print a greeting\n', solution: "console.log('Hello, Bloom!')",
    checks: [{ label: 'Print "Hello, Bloom!"', logs: 'Hello, Bloom!' }], hint: "Text goes in quotes: console.log('...')",
  },
  {
    id: 'math', module: 'basics', title: 'Arithmetic',
    body: 'JavaScript can do maths: `+ - * /` and `%` (remainder).\n\n**Task:** print the result of `7 * 6`, then the remainder of `17 % 5`.',
    starter: '', solution: 'console.log(7 * 6)\nconsole.log(17 % 5)',
    checks: [{ label: 'Print 42', logs: '42' }, { label: 'Print 2', logs: '2' }], hint: 'console.log(7 * 6) prints 42.',
  },
  {
    id: 'vars', module: 'data', title: 'let and const',
    body: '`const` names a value that won’t be reassigned; `let` can change.\n\n**Task:** make a `const name` with your name, a `let age` set to any number, then add 1 to `age`.',
    starter: '', solution: "const name = 'Ana'\nlet age = 30\nage = age + 1",
    checks: [{ label: 'name is a string', probe: 'typeof name', equals: 'string' }, { label: 'age is a number', probe: 'typeof age', equals: 'number' }, { label: 'Uses const', uses: 'VariableDeclaration' }],
    hint: "const name = 'Sam'",
  },
  {
    id: 'strings', module: 'data', title: 'Template strings',
    body: 'Back-ticks let you put values inside text: `` `Hi ${name}` ``.\n\n**Task:** with `const city = "Paris"`, print `I love Paris` using a template string.',
    starter: "const city = 'Paris'\n", solution: "const city = 'Paris'\nconsole.log(`I love ${city}`)",
    checks: [{ label: 'Print "I love Paris"', logs: 'I love Paris' }, { label: 'Use a template string', uses: 'TemplateLiteral' }], hint: 'console.log(`I love ${city}`)',
  },
  {
    id: 'if', module: 'logic', title: 'if / else',
    body: 'Run code only when a condition is true.\n\n**Task:** given `const temp = 28`, print `Hot` if `temp > 25`, otherwise print `Mild`.',
    starter: 'const temp = 28\n', solution: "const temp = 28\nif (temp > 25) {\n  console.log('Hot')\n} else {\n  console.log('Mild')\n}",
    checks: [{ label: 'Print "Hot"', logs: 'Hot' }, { label: 'Use an if statement', uses: 'IfStatement' }], hint: "if (temp > 25) { console.log('Hot') } else { ... }",
  },
  {
    id: 'for', module: 'loops', title: 'for loops',
    body: 'A `for` loop repeats code.\n\n**Task:** print the numbers 1 to 5, one per line.',
    starter: '', solution: 'for (let i = 1; i <= 5; i++) {\n  console.log(i)\n}',
    checks: [{ label: 'Print 1', logs: '1' }, { label: 'Print 5', logs: '5' }, { label: 'Use a for loop', uses: 'ForStatement' }], hint: 'for (let i = 1; i <= 5; i++) { ... }',
  },
  {
    id: 'fn', module: 'functions', title: 'Your first function',
    body: 'Functions package code you can reuse. `return` sends a value back.\n\n**Task:** write `function add(a, b)` that returns their sum.',
    starter: 'function add(a, b) {\n  \n}\n', solution: 'function add(a, b) {\n  return a + b\n}',
    checks: [{ label: 'add(2, 3) is 5', probe: 'add(2, 3)', equals: 5 }, { label: 'add(-1, 1) is 0', probe: 'add(-1, 1)', equals: 0 }, { label: 'Uses return', uses: 'ReturnStatement' }], hint: 'return a + b',
  },
  {
    id: 'arrow', module: 'functions', title: 'Arrow functions',
    body: 'A shorter way to write functions: `const double = (n) => n * 2`.\n\n**Task:** write an arrow function `square` that returns `n * n`.',
    starter: '', solution: 'const square = (n) => n * n',
    checks: [{ label: 'square(4) is 16', probe: 'square(4)', equals: 16 }, { label: 'Use an arrow function', uses: 'ArrowFunctionExpression' }], hint: 'const square = (n) => n * n',
  },
  {
    id: 'arrays', module: 'arrays', title: 'Arrays and map',
    body: 'Arrays hold lists. `.map()` makes a new array by changing each item.\n\n**Task:** from `const nums = [1, 2, 3]` make `doubled` = `[2, 4, 6]` using `map`.',
    starter: 'const nums = [1, 2, 3]\n', solution: 'const nums = [1, 2, 3]\nconst doubled = nums.map((n) => n * 2)',
    checks: [{ label: 'doubled is [2,4,6]', probe: 'doubled', equals: [2, 4, 6] }, { label: 'Use map', probe: "/\\.map\\(/.test(__code)", equals: true }], hint: 'nums.map((n) => n * 2)',
  },
  {
    id: 'filter', module: 'arrays', title: 'filter and reduce',
    body: '`.filter()` keeps items that pass a test; `.reduce()` combines them.\n\n**Task:** from `const scores = [4, 9, 2, 8]` make `high` (scores above 5) and `total` (sum of all).',
    starter: 'const scores = [4, 9, 2, 8]\n', solution: 'const scores = [4, 9, 2, 8]\nconst high = scores.filter((s) => s > 5)\nconst total = scores.reduce((a, b) => a + b, 0)',
    checks: [{ label: 'high is [9,8]', probe: 'high', equals: [9, 8] }, { label: 'total is 23', probe: 'total', equals: 23 }], hint: 'scores.reduce((a, b) => a + b, 0)',
  },
  {
    id: 'objects', module: 'objects', title: 'Objects',
    body: 'Objects group values under keys: `{ name: "Mochi", colour: "lilac" }`.\n\n**Task:** make `const pet` with `name` and `age`, then print the name using `pet.name`.',
    starter: '', solution: "const pet = { name: 'Mochi', age: 2 }\nconsole.log(pet.name)",
    checks: [{ label: 'pet has a name', probe: 'typeof pet.name', equals: 'string' }, { label: 'pet has an age', probe: 'typeof pet.age', equals: 'number' }, { label: 'Print the name', probe: '__logs.includes(pet.name)', equals: true }], hint: "const pet = { name: 'Rex', age: 3 }",
  },
]

export const quiz: QuizQ[] = [
  { id: 'q1', module: 'basics', q: 'What does this print?', code: 'console.log(2 + "2")', options: ['4', '22', 'NaN', 'Error'], answer: 1, why: 'A number plus a string joins them as text: "22".' },
  { id: 'q2', module: 'data', q: 'Which keyword makes a variable that cannot be reassigned?', options: ['let', 'var', 'const', 'fixed'], answer: 2, why: '`const` bindings cannot be reassigned.' },
  { id: 'q3', module: 'logic', q: 'What does this print?', code: 'console.log(5 === "5")', options: ['true', 'false', 'undefined', 'Error'], answer: 1, why: '`===` also compares types: number vs string is false.' },
  { id: 'q4', module: 'loops', q: 'How many times does this log?', code: 'for (let i = 0; i < 3; i++) console.log(i)', options: ['2', '3', '4', 'Forever'], answer: 1, why: 'i takes 0, 1 and 2 — three times.' },
  { id: 'q5', module: 'functions', q: 'What is returned?', code: 'const f = (x) => { x * 2 }\nf(4)', options: ['8', 'undefined', '4', 'Error'], answer: 1, why: 'With braces an arrow function needs `return`; without it returns undefined.' },
  { id: 'q6', module: 'arrays', q: 'What is [1, 2, 3].length?', options: ['2', '3', '4', 'undefined'], answer: 1, why: 'length counts items: 3.' },
  { id: 'q7', module: 'arrays', q: 'What does this print?', code: 'console.log([1, 2, 3].map(n => n + 1))', options: ['[1,2,3]', '[2,3,4]', '6', '[0,1,2]'], answer: 1, why: 'map adds 1 to every item.' },
  { id: 'q8', module: 'objects', q: 'How do you read the key "age" from `user`?', options: ['user->age', 'user[age]', 'user.age', 'user::age'], answer: 2, why: 'Dot notation: user.age (or user["age"]).' },
  { id: 'q9', module: 'logic', q: 'Which value is falsy?', options: ['"0"', '[]', '0', '{}'], answer: 2, why: 'The number 0 is falsy; "0", [] and {} are truthy.' },
  { id: 'q10', module: 'basics', q: 'What does this print?', code: 'console.log(typeof null)', options: ['"null"', '"object"', '"undefined"', '"number"'], answer: 1, why: 'A famous JavaScript quirk: typeof null is "object".' },
]

export const challenges: Challenge[] = [
  {
    id: 'fizz', title: 'FizzBuzz', level: 'easy',
    body: 'Write `fizz(n)` that returns `"Fizz"` for multiples of 3, `"Buzz"` for multiples of 5, `"FizzBuzz"` for both, otherwise the number.',
    starter: 'function fizz(n) {\n  \n}\n', solution: "function fizz(n) {\n  if (n % 15 === 0) return 'FizzBuzz'\n  if (n % 3 === 0) return 'Fizz'\n  if (n % 5 === 0) return 'Buzz'\n  return n\n}",
    checks: [{ label: 'fizz(3)', probe: 'fizz(3)', equals: 'Fizz' }, { label: 'fizz(10)', probe: 'fizz(10)', equals: 'Buzz' }, { label: 'fizz(30)', probe: 'fizz(30)', equals: 'FizzBuzz' }, { label: 'fizz(7)', probe: 'fizz(7)', equals: 7 }],
  },
  {
    id: 'reverse', title: 'Reverse a word', level: 'easy',
    body: 'Write `reverse(word)` that returns the word backwards: `reverse("bloom")` → `"moolb"`.',
    starter: 'function reverse(word) {\n  \n}\n', solution: "function reverse(word) {\n  return word.split('').reverse().join('')\n}",
    checks: [{ label: 'reverse("bloom")', probe: 'reverse("bloom")', equals: 'moolb' }, { label: 'reverse("")', probe: 'reverse("")', equals: '' }],
  },
  {
    id: 'vowels', title: 'Count vowels', level: 'medium',
    body: 'Write `vowels(text)` returning how many a, e, i, o, u it has (any case).',
    starter: 'function vowels(text) {\n  \n}\n', solution: 'function vowels(text) {\n  return (text.match(/[aeiou]/gi) || []).length\n}',
    checks: [{ label: 'vowels("Bloom World")', probe: 'vowels("Bloom World")', equals: 3 }, { label: 'vowels("xyz")', probe: 'vowels("xyz")', equals: 0 }],
  },
  {
    id: 'habits', title: 'Best streak', level: 'hard',
    body: 'Write `bestStreak(days)` for an array of `true/false` check-ins; return the longest run of `true`.',
    starter: 'function bestStreak(days) {\n  \n}\n', solution: 'function bestStreak(days) {\n  let best = 0, run = 0\n  for (const d of days) {\n    run = d ? run + 1 : 0\n    best = Math.max(best, run)\n  }\n  return best\n}',
    checks: [{ label: '[t,t,f,t,t,t]', probe: 'bestStreak([true,true,false,true,true,true])', equals: 3 }, { label: 'all false', probe: 'bestStreak([false,false])', equals: 0 }, { label: 'empty', probe: 'bestStreak([])', equals: 0 }],
  },
]

export const cheatsheets: Record<string, { code: string; note: string }[]> = {
  basics: [{ code: "console.log('hi')", note: 'Print to the console' }, { code: '7 % 3 // 1', note: 'Remainder' }, { code: '// comment', note: 'Ignored by JavaScript' }],
  data: [{ code: "const n = 'Ana'", note: 'Constant binding' }, { code: 'let x = 1; x++', note: 'Changeable variable' }, { code: '`Hi ${n}`', note: 'Template string' }],
  logic: [{ code: 'if (a > b) {} else {}', note: 'Branch' }, { code: 'a === b', note: 'Strict equality' }, { code: 'cond ? x : y', note: 'Ternary' }],
  loops: [{ code: 'for (let i = 0; i < n; i++) {}', note: 'Counting loop' }, { code: 'for (const x of list) {}', note: 'Loop over items' }, { code: 'while (cond) {}', note: 'Loop while true' }],
  functions: [{ code: 'function f(a) { return a }', note: 'Declaration' }, { code: 'const f = (a) => a * 2', note: 'Arrow function' }, { code: 'f(3)', note: 'Call it' }],
  arrays: [{ code: 'list.map(x => x * 2)', note: 'Transform each' }, { code: 'list.filter(x => x > 1)', note: 'Keep some' }, { code: 'list.reduce((a, b) => a + b, 0)', note: 'Combine' }],
  objects: [{ code: "const o = { name: 'Rex' }", note: 'Object literal' }, { code: 'o.name', note: 'Read a key' }, { code: 'Object.keys(o)', note: 'List keys' }],
}
