import { useEffect, useRef } from 'react'
import { Compass } from 'lucide-react'
import { driver } from 'driver.js'
import type { DriveStep, Driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import type { NavKey } from './Sidebar'

export const pageDetails: Record<
  NavKey,
  { title: string; description: string }
> = {
  collectibles: {
    title: 'My Collectibles',
    description: 'A small fleet, one lucky day at a time.',
  },
  calendar: {
    title: 'Full calendar',
    description: 'Make time for what matters.',
  },
  todos: { title: 'To-dos', description: 'One thing at a time.' },
  urges: {
    title: 'Urges',
    description: 'Notice the chain before it takes over.',
  },
  challenges: {
    title: 'Challenges',
    description: 'Choose your next adventure.',
  },
  focus: { title: 'Focus', description: 'Grow your attention.' },
  growth: { title: 'Growth', description: 'Your small steps add up.' },
  overview: {
    title: 'Your daily space',
    description: 'Small steps. A little reflection. Room to grow.',
  },
  habits: {
    title: 'Habits',
    description: 'Build a rhythm that works for you, one small step at a time.',
  },
  planning: {
    title: 'Intentions',
    description: 'Make room for what matters today.',
  },
  journal: {
    title: 'Guided journal',
    description: 'Pause, check in, and find your next gentle step.',
  },
  daybook: {
    title: 'Daybook',
    description: 'A quiet space for your thoughts, plans, and possibilities.',
  },
  'vision-board': {
    title: 'Vision Board',
    description: 'Bring your ideas together and give your future some space.',
  },
  world: {
    title: 'Bloom World',
    description: 'Every small step builds your little world.',
  },
  settings: {
    title: 'Make it yours',
    description: 'Choose the appearance and tools that support your practice.',
  },
}
export function readPage(): NavKey {
  const key = window.location.hash.slice(1)
  return Object.prototype.hasOwnProperty.call(pageDetails, key)
    ? (key as NavKey)
    : 'overview'
}
const step = (
  element: string,
  title: string,
  description: string,
): DriveStep => ({ element, popover: { title, description } })
const guides: Record<NavKey, DriveStep[]> = {
  world: [
    step(
      '.world-canvas',
      'Your living island',
      'Drag to orbit, scroll to zoom. Every district grows from real activity.',
    ),
    step(
      '.world-districts',
      'Districts',
      'See what each district needs next and fly the camera there.',
    ),
  ],
  collectibles: [
    step(
      '.collection-page .bloom-rail',
      'Your garage',
      'Daily jackpots unlock cars. Select an unlocked car to bring it to your focus timer. Select it again to remove it.',
    ),
  ],
  calendar: [
    step(
      '.calendar-tray',
      'Time blocking',
      'Drag a task into a time slot, or use its schedule button. Resize a block to adjust its duration.',
    ),
    step(
      '.calendar-capacity',
      'Daily capacity',
      'Review booked hours, available time, and deep work for the selected day.',
    ),
  ],
  urges: [
    step(
      '.urge-logger',
      'Interrupt autopilot',
      'Choose an urge or slip, its intensity, and the strongest context. The third tap saves your log.',
    ),
    step(
      '.urge-tabs',
      'Find the pattern',
      'Open Patterns to see trigger probabilities, time windows, and your urge-to-action ratio.',
    ),
    step(
      '.urge-privacy',
      'Passive, private context',
      'Bloom adds the time window, day type, session length, and tab-change count locally when you save.',
    ),
  ],
  todos: [
    step(
      '.task-add',
      'Add a task',
      'Give it a name and due date. Tasks stay here until completed.',
    ),
    step(
      '.goal-list',
      'Challenge goals',
      'Accepted challenges add a goal and dated tasks. Complete those tasks to fill the goal’s progress bar.',
    ),
    step(
      '.segmented',
      'Keep it manageable',
      'Switch between open, due today, and completed tasks.',
    ),
  ],
  challenges: [
    step(
      '.quest-card',
      'Choose a challenge',
      'Preview its steps, then accept to add its goal and dated tasks to To-dos.',
    ),
    step(
      '#challenges-page',
      'Earn your reward',
      'Check off the linked tasks in To-dos. Finishing every step earns the challenge reward once.',
    ),
  ],
  focus: [
    step(
      '.focus-setup',
      'Choose your session',
      'Pick a duration and optionally link a task. Strict mode ends the session when this browser tab is hidden; it does not block other apps.',
    ),
    step(
      '.focus-room',
      'Plant some focus',
      'Start the timer. Finishing earns XP, gold, and a tree. It keeps running when you visit another page in Bloom.',
    ),
    step(
      '.focus-garden',
      'Watch your garden grow',
      'Each completed session adds a permanent tree and a history entry.',
    ),
  ],
  growth: [
    step(
      '.growth-tabs',
      'Explore your growth',
      'Choose your avatar, skills, or rewards. Only one area opens at a time.',
    ),
    step(
      '.rpg-zone',
      'Make progress',
      'Habits, to-dos, reflections, and focus sessions grow your experience and attributes.',
    ),
  ],
  overview: [
    step(
      '.stats',
      'Your day at a glance',
      'See today’s habits, intentions, and saved reflections.',
    ),
    step(
      '.reflection-shortcuts',
      'Choose your reflection space',
      'Begin a guided check-in or open Daybook for independent writing.',
    ),
    step(
      '.history-card',
      'Revisit your reflections',
      'Open your saved check-ins whenever you want to look back.',
    ),
  ],
  habits: [
    step(
      '.habits-toolbar',
      'Start small',
      'Use the plus button to add a habit you want to practice.',
    ),
    step(
      '.habit-contribution-grid',
      'Celebrate showing up',
      'Check in today or select a past day to update your history.',
    ),
    step(
      '.habit-summary',
      'Notice your rhythm',
      'Follow your streaks, or open Routines for a timed daily ritual.',
    ),
  ],
  planning: [
    step(
      '#planning .card-heading',
      'Set an intention',
      'Use the plus button to name something meaningful for today.',
    ),
    step(
      '#planning .add-line',
      'Make room for one thing',
      'Add an intention, then mark it complete when you are ready. The pencil lets you edit it.',
    ),
  ],
  journal: [
    step(
      '#chat-journal .card-heading',
      'A guided check-in',
      'This space helps you reflect on your mood, energy, wins, and challenges.',
    ),
    step(
      '#chat-journal',
      'Follow the conversation',
      'Begin a check-in, then choose a suggested reply or write your own. At the end, save and review your reflection.',
    ),
  ],
  daybook: [
    step(
      '.journal-direction',
      'Start with one choice',
      'Choose Plan, Reflect, Imagine, or Explore. You will then pick a writing format.',
    ),
    step(
      '.wizard-steps',
      'One step at a time',
      'Choose a direction, pick a page, then write. Guided pages show one prompt at a time.',
    ),
    step(
      '.daybook-editor-header',
      'Your writing space',
      'Use All modes to return to the library. Complete journal saves this page.',
    ),
    step(
      '.daybook-editor .tiptap',
      'Make it your own',
      'Write freely or follow the prompts. The toolbar offers formatting and lists.',
    ),
    step(
      '.daybook-save',
      'Save your writing',
      'Select Complete journal to save this entry in your browser. Switching feature pages keeps this draft open.',
    ),
    step(
      '.daybook-search',
      'Find a writing format',
      'Search by name or topic to find a page that fits your day.',
    ),
    step(
      '.daybook-category',
      'Choose a page',
      'Select a format to open its editor. Write at your own pace and use Save to keep the entry.',
    ),
    step(
      '#daybook',
      'Your personal library',
      'Return here to reopen an entry. Your saved writing stays in this browser; use the editor’s save action before leaving.',
    ),
  ],
  'vision-board': [
    step(
      '[aria-label="Vision Board"]',
      'Create your vision',
      'Use the board’s tools to add notes and journal cards. Drag them into an arrangement that feels right.',
    ),
    step(
      '.react-flow',
      'Explore your board',
      'Pan across the canvas and use the zoom controls to see the details or the whole picture.',
    ),
  ],
  settings: [
    step(
      '[aria-labelledby="appearance-heading"]',
      'Find your atmosphere',
      'Choose a palette that feels comfortable to read.',
    ),
    step(
      '[aria-labelledby="features-heading"]',
      'Choose your tools',
      'Enable the features you use. Disabled tools disappear from navigation.',
    ),
    step(
      '[aria-labelledby="json-heading"]',
      'Keep your preferences',
      'Copy or import your configuration to reuse these settings.',
    ),
  ],
}
export function FeatureGuide({ page }: { page: NavKey }) {
  const tour = useRef<Driver | null>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  useEffect(
    () => () => {
      tour.current?.destroy()
    },
    [page],
  )
  const start = () => {
    tour.current?.destroy()
    const steps = guides[page].filter(
      (item) =>
        typeof item.element === 'string' &&
        document.querySelector(item.element),
    )
    tour.current = driver({
      animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      showProgress: true,
      allowClose: true,
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Done',
      onDestroyed: () => trigger.current?.focus(),
      steps: steps.length
        ? steps
        : [
            step(
              '#page-heading',
              pageDetails[page].title,
              pageDetails[page].description,
            ),
          ],
    })
    tour.current.drive()
  }
  return (
    <button ref={trigger} className="guide-button" onClick={start}>
      <Compass size={18} /> Guide me
    </button>
  )
}
