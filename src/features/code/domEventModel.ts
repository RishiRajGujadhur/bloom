export type EventChoice = { target: string; event: string; handler: string }

export const EVENT_TASKS = [
  { id: 'button', title: 'Join button', objective: 'Click Join to reveal a welcome message.', target: '#join', event: 'click', handler: 'showWelcome', trigger: 'Click the Join button', starter: { target: '#join', event: 'input', handler: 'showWelcome' } },
  { id: 'input', title: 'Name preview', objective: 'As the visitor types, show the number of characters.', target: '#name', event: 'input', handler: 'showCount', trigger: 'Type in the name field', starter: { target: '#name', event: 'click', handler: 'showCount' } },
  { id: 'form', title: 'Signup form', objective: 'Submit the form to reveal a confirmation without reloading.', target: '#signup', event: 'submit', handler: 'showConfirmation', trigger: 'Submit the form', starter: { target: '#signup', event: 'click', handler: 'showConfirmation' } },
] as const

export type EventTask = typeof EVENT_TASKS[number]

export function checkEventWiring(task: EventTask, choice: EventChoice) {
  const errors: string[] = []
  if (choice.target !== task.target) errors.push(`The event listener must attach to ${task.target}.`)
  if (choice.event !== task.event) errors.push(`Listen for ${task.event} on that element.`)
  if (choice.handler !== task.handler) errors.push(`Use ${task.handler} to produce the requested result.`)
  return { pass: errors.length === 0, feedback: errors.length ? errors.join(' ') : `Wiring is ready. ${task.trigger} in the preview to test it.` }
}
