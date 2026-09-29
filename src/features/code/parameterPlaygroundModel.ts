export type ParameterTask = { id: string; title: string; story: string; code: string; labels: [string, string]; defaults: [string, string]; expected: [string, string]; target: string; note: string }

export const PARAMETER_TASKS: ParameterTask[] = [
  { id: 'order', title: 'Put arguments in order', story: 'Label a plot by its place and crop. The current arguments are reversed.', code: 'function label(plot, crop) {\n  return `${plot}: ${crop}`;\n}', labels: ['plot', 'crop'], defaults: ['kale', 'North'], expected: ['North', 'kale'], target: 'North: kale', note: 'Arguments are matched to parameters by position.' },
  { id: 'default', title: 'Use a default parameter', story: 'The function already supplies ! when punctuation is omitted. Clear the second argument.', code: "function greet(name, mark = '!') {\n  return `Hello, ${name}${mark}`;\n}", labels: ['name', 'mark'], defaults: ['Mira', '?'], expected: ['Mira', ''], target: 'Hello, Mira!', note: 'An omitted argument uses the default value. An explicit mark replaces it.' },
  { id: 'numbers', title: 'Pass the quantity', story: 'The farm box costs 4 credits each. Set quantity to 3 to total 12.', code: 'function total(price, quantity = 1) {\n  return price * quantity;\n}', labels: ['price', 'quantity'], defaults: ['4', '2'], expected: ['4', '3'], target: '12', note: 'The second argument binds to quantity. The function multiplies the two values.' },
]

export function runParameterTask(task: ParameterTask, args: [string, string]) {
  const first = args[0].trim(), second = args[1].trim()
  if (task.id === 'order') return { bindings: [first, second], output: `${first}: ${second}` }
  if (task.id === 'default') return { bindings: [first, second || '! (default)'], output: `Hello, ${first}${second || '!'}` }
  const quantity = second === '' ? 1 : Number(second)
  const price = Number(first)
  return { bindings: [first, second || '1 (default)'], output: Number.isFinite(price * quantity) ? String(price * quantity) : 'Invalid number' }
}

export function checkParameterTask(task: ParameterTask, args: [string, string]) {
  const run = runParameterTask(task, args)
  const bindingChecks = args.map((arg, index) => arg.trim() === task.expected[index])
  return { ...run, bindingChecks, outputPass: run.output === task.target, pass: bindingChecks.every(Boolean) && run.output === task.target }
}
