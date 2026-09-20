import type { AppData } from '../model'
import { dayKey } from '../dates'

export const challenges = [
  {
    id: 'small-start',
    title: 'Small beginnings',
    goal: 'Build a three-day rhythm',
    days: 3,
    sprite: 'hero-0',
    reward: 30,
    tasks: [
      'Choose one small habit',
      'Make time for it again',
      'Reflect on what helped',
    ],
  },
  {
    id: 'focus-path',
    title: 'Find your focus',
    goal: 'Make space for deep work',
    days: 3,
    sprite: 'spirit',
    reward: 40,
    tasks: [
      'Clear one distraction',
      'Complete a focus session',
      'Plan your next focus block',
    ],
  },
  {
    id: 'kind-week',
    title: 'A kinder week',
    goal: 'Practice one small act of care each day',
    days: 5,
    sprite: 'fox',
    reward: 50,
    tasks: [
      'Take a screen-free break',
      'Write down one good thing',
      'Make time to move',
      'Reach out to someone',
      'Reflect on your week',
    ],
  },
] as const
export function acceptChallenge(
  data: AppData,
  challengeId: string,
  now = Date.now(),
): AppData {
  const challenge = challenges.find((item) => item.id === challengeId)
  if (!challenge || data.challenges.some((item) => item.id === challengeId))
    return data
  const tasks = challenge.tasks.map((title, index) => {
    const date = new Date(now)
    date.setDate(date.getDate() + index)
    return {
      id: `challenge:${challengeId}:${index}`,
      title,
      done: false,
      due: dayKey(date),
      challengeId,
      rewarded: false,
    }
  })
  return {
    ...data,
    todos: [...data.todos, ...tasks],
    challenges: [
      ...data.challenges,
      { id: challengeId, acceptedAt: now, rewarded: false },
    ],
  }
}
export function toggleTodo(
  data: AppData,
  id: string,
  now = Date.now(),
): AppData {
  const task = data.todos.find((item) => item.id === id)
  if (!task) return data
  const earn = !task.done && !task.rewarded
  let next: AppData = {
    ...data,
    todos: data.todos.map((item) =>
      item.id === id
        ? { ...item, done: !item.done, rewarded: item.rewarded || earn }
        : item,
    ),
  }
  const reward = (key: string, exp: number, gold: number) => {
    next = {
      ...next,
      rpg: {
        ...next.rpg,
        gold: next.rpg.gold + gold,
        ledger: {
          ...next.rpg.ledger,
          [key]: {
            day: dayKey(new Date(now)),
            at: now,
            exp,
            gold,
            stat: 'spirit',
            points: 2,
            active: true,
            kind: 'priority',
            sourceId: key,
          },
        },
      },
    }
  }
  if (earn)
    reward(
      `todo:${id}`,
      10 + (data.rpg.skills.zen?.state === 'unlocked' ? 5 : 0),
      2,
    )
  for (const accepted of next.challenges) {
    const definition = challenges.find((item) => item.id === accepted.id)
    const tasks = next.todos.filter((item) => item.challengeId === accepted.id)
    if (
      definition &&
      !accepted.rewarded &&
      tasks.length === definition.tasks.length &&
      tasks.every((item) => item.done)
    ) {
      reward(`challenge:${accepted.id}`, definition.reward, 10)
      next = {
        ...next,
        challenges: next.challenges.map((item) =>
          item.id === accepted.id ? { ...item, rewarded: true } : item,
        ),
      }
    }
  }
  return next
}
