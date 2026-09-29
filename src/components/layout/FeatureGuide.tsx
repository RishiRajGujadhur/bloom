import { prefersReducedMotion } from '../../utils/motion'
import { subOn } from '../../features/subFeatures'
import { useEffect, useRef } from 'react'
import { driver } from 'driver.js'
import type { DriveStep, Driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { revealText, wizardSvg } from './guideWizard'
import './guide.css'
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
    title: 'A little intention. A lot of good ahead.',
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
  breathe: { title: 'Breathe', description: 'Slow down, one breath at a time.' },
  sleep: { title: 'Sleep', description: 'Rest is part of the work.' },
  posture: { title: 'Posture guard', description: 'Sit tall, level up.' },
  epiphanies: { title: 'Epiphanies', description: 'Your wisdom, remembered.' },
  diet: { title: 'Nourish', description: 'Eat with attention.' },
  monk: { title: 'Monk mode', description: 'Write it. Let it go.' },
  voice: { title: 'Voice memos', description: 'Think out loud.' },
  energy: { title: 'Energy flow', description: 'Debug your week.' },
  lab: { title: 'Correlations', description: 'What moves together.' },
  taichi: { title: 'Tai Chi', description: 'Root down. Breathe low.' },
  'weeks': { title: "Life in weeks", description: "Every square is a week you can shape." },
  'chess': { title: "Chess", description: "Every grandmaster was once a beginner." },
  'code': { title: "Code", description: "Write real JavaScript, one small step at a time." },
  'joys': { title: "Little Joys", description: "Small things, done with delight." },
  'english': { title: "English", description: "A little English every day." },
  'money': { title: "Money", description: "Know where it goes." },
  'street': { title: "Bloom Street", description: "Take a walk through your town." },
  'pointer': { title: "Pointer", description: "Make the pointer yours." },
  'dojo': { title: "Dojo", description: "Discipline, one technique at a time." },
  'affirm': { title: "Affirmations", description: "Words to grow into." },
  'daylight': { title: "Daylight", description: "Live with the light." },
  'eyes': { title: "Eye care", description: "Give your eyes a horizon." },
  'screen': { title: "Screen time", description: "Use tech, don’t let it use you." },
  'routines': { title: "Routines", description: "Small steps, same time, every time." },
  'roadmap': { title: "Goal roadmap", description: "See the road, take the next step." },
  'games': { title: "Brain games", description: "Play your mind awake." },
  'cards': { title: "Flashcards", description: "Remember what matters." },
  'mindmaps': { title: "Mind maps", description: "Untangle your thoughts." },
  'mirror': { title: "Mood mirror", description: "What your words say about you." },
  'ink': { title: "Ink journal", description: "Some thoughts need a pen." },
  'mala': { title: "Mala", description: "One bead, one breath." },
  'breathwork': { title: "Breathwork", description: "Breathe big. Then be still." },
  'meditate': { title: "Meditate", description: "Sit. Breathe. Arrive." },
  'mixer': { title: "Soundscapes", description: "Build your own weather." },
  'sounds': { title: "Focus sounds", description: "Music made for your mind." },
  'fasting': { title: "Fasting", description: "Rest for your digestion, too." },
  'scan': { title: "Food scanner", description: "Know what’s inside." },
  'body': { title: "Body progress", description: "Trends, not single days." },
  'run': { title: "Run & walk", description: "One step, then the next." },
  'stretch': { title: "Stretch", description: "Loosen what the day tightened." },
  'yoga': { title: "Yoga", description: "Breathe, then move." },
  'intervals': { title: "Intervals", description: "Work hard, rest well." },
  'workouts': { title: "Workouts", description: "Stronger than last week." },
  'exercises': { title: "Exercises", description: "Move well, not just more." },
  'release': { title: 'Let it go', description: 'Write it, then let it burn.' },
  'focus-room': { title: 'Focus room', description: 'One task. Soft strings. Deep work.' },
  'explore': { title: 'Explore data', description: 'Ask your own questions.' },
  'yearbook': { title: 'Year book', description: 'Your year, bound.' },
  'palace': { title: 'Memory palace', description: 'Walk through your year.' },
  'journey': { title: 'Streak journey', description: 'Every day is a step on the path.' },
  'places': { title: 'Places', description: 'Where you feel your best.' },
  shop: { title: 'Petal shop', description: 'Treat your world.' },
  mood: { title: 'Mood check-in', description: 'Two taps. No judgement.' },
  gratitude: { title: 'Gratitude jar', description: 'Collect the good things.' },
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
  'exercises': [
    step(".ex-library", "Pick a move", "Filter by muscle or kit, then open it."),
    step(".ex-stage", "Watch the form", "Mirror it, slow it down, follow the tempo."),
    step(".ex-ring", "Count your reps", "Set a target and let the coach count."),
  ],
  'workouts': [
    step(".wo-start", "Start a session", "Pick a template to begin."),
    step(".wo-lift", "Log with sliders", "Set weight, reps and effort, then log."),
    step(".wo-rest-box", "Rest", "The timer starts after each set."),
  ],
  'intervals': [
    step(".iv-stage", "Follow the ring", "Colours show work, rest and warm-up."),
    step(".iv-side", "Start, skip, reset", "The coach cues each change."),
  ],
  'yoga': [
    step(".yg-stage", "Follow the figure", "It flows into each pose with your breath."),
    step(".yg-breath", "Breathe with the orb", "Inhale as it grows, exhale as it settles."),
  ],
  'stretch': [
    step(".st-stage", "Follow along", "The figure and glowing area show where to feel it."),
    step(".st-timer", "Hold", "The ring counts down each stretch."),
  ],
  'run': [
    step(".run-map", "Your route", "Drawn live while you move."),
    step(".run-side", "Start", "Or try the demo route."),
  ],
  'body': [
    step(".bd-sliders", "Check in", "Pick what to measure and slide."),
    step(".bd-side", "Ratios", "BMI and waist-to-height at a glance."),
  ],
  'scan': [
    step(".sc-scanner", "Scan", "Use the camera or type the code."),
    step(".sc-result", "See inside", "Scores, traffic lights and sugar cubes."),
  ],
  'fasting': [
    step(".fs-ring", "Your fast", "Stage markers light up as you pass them."),
    step(".fs-side", "Start or end", "Pick a protocol and begin."),
  ],
  'sounds': [
    step(".fm-stage", "Press play", "Music keeps playing while you use other pages."),
    step(".fm-modes", "Pick a mode", "Each targets a different state of mind."),
  ],
  'mixer': [
    step(".mx-layers", "Mix", "Slide any layer in or out."),
    step(".mx-play", "Play", "Your scene comes alive behind the sliders."),
  ],
  'meditate': [
    step(".md-sos", "Need calm now?", "Three minutes to steady yourself."),
    step(".studio-rail", "Pick a session", "Each has its own scene."),
  ],
  'breathwork': [
    step(".bw-stage", "Follow the lungs", "Tap anywhere during the hold when you need to breathe."),
    step(".bw-side", "Set your rounds", "Start gently."),
  ],
  'mala': [
    step(".ml-stage", "Tap to count", "Or press space. The ring turns bead by bead."),
    step(".ml-side", "Choose a mantra", "Or let it count for you."),
  ],
  'ink': [
    step(".ink-sheet", "Write or draw", "Use a stylus, finger or mouse."),
    step(".ink-tools", "Tools", "Pen, highlighter, eraser and paper."),
  ],
  'mirror': [
    step(".mr-face", "This week", "How your recent writing reads."),
    step(".mr-trend", "Over time", "Above the line is brighter, below is heavier."),
  ],
  'mindmaps': [
    step(".mm-editor", "Write an outline", "# centre, ## branches, - leaves."),
    step(".mm-canvas", "Explore", "Click a node to fold it; scroll to zoom."),
  ],
  'cards': [
    step(".fc-scene", "Tap to flip", "Or press space."),
    step(".fc-grades", "Grade honestly", "1–4 on the keyboard."),
  ],
  'games': [
    step(".bg-daily", "Today’s workout", "Three games, a few minutes."),
    step(".studio-rail", "Pick any game", "Each adapts to your level."),
  ],
  'roadmap': [
    step(".rm-chart", "Your roadmap", "Drag bars to reschedule."),
    step(".rm-legend", "Goals", "Open one to edit key results."),
  ],
  'routines': [
    step(".rt-card", "Start a routine", "Tap to play it step by step."),
    step(".rt-week", "Your week", "Every routine you’ve scheduled."),
  ],
  'screen': [
    step(".sw-ring", "Today", "Your active time against your limit."),
    step(".rm-side", "Modes", "Detox, wind-down, focus-only and more."),
  ],
  'eyes': [
    step(".ey-stage", "Follow along", "Keep your head still; move only your eyes."),
    step(".rm-side", "Start the routine", "Two minutes, five exercises."),
  ],
  'daylight': [
    step(".dl-sky", "The sky now", "The sun moves as the day does."),
    step(".dl-light", "Morning light", "Log minutes outside."),
  ],
  'affirm': [
    step(".af-stage", "Swipe", "Drag a card aside to see the next."),
    step(".af-actions", "Make it stick", "Save it, say it again, or hear it."),
  ],
  'dojo': [
    step(".dojo-belt", "Your belt", "Every technique you practise brings the next belt closer."),
    step(".dojo-filters", "Choose a style", "Filter by martial art, type of technique, or train seated."),
  ],
  'pointer': [
    step(".pt-grid", "Your pointer", "Pick a shape, colour, size and effect."),
    step(".pt-try", "Try it", "Right-click here to see this page's menu."),
  ],
  'street': [
    step(".st-viewport", "Your street", "Drag the street or click a building; the sprout walks there."),
    step(".st-panel", "Go in", "Open the building's feature."),
  ],
  'money': [
    step(".mn-report", "Your report", "This month and year, with the change since last time."),
    step(".mn-add", "Add spending", "Amount, place and a category in two taps."),
  ],
  'english': [
    step(".en-path", "Your path", "Tap the glowing lesson to start. Finish four to unlock the next unit."),
    step(".en-goal", "Daily goal", "Pick how much XP you want each day."),
  ],
  'joys': [
    step(".hy-glass", "Your glass", "Tap + Glass each time you drink."),
    step(".kd-scene", "Kindness card", "Tap to flip today's card."),
  ],
  'code': [
    step(".cd-map", "Course map", "Pick any lesson; rings fill as you finish."),
    step(".cd-run", "Run", "Run your code, or press Ctrl+Enter."),
  ],
  'chess': [
    step(".cb-board", "The board", "Tap a piece, then a glowing dot — or drag it."),
    step(".ch-lessons", "Lessons", "Pick a piece to learn."),
  ],
  'weeks': [
    step(".lw-grid", "Your weeks", "Hover any square to see that week."),
    step(".lw-add", "Chapters", "Add chapters and milestones."),
  ],
  taichi: [
    step('.tc-elements', 'Five Elements', 'Each element has its own scale and timbre.'),
    step('.tc-ground', 'Grounding', 'Sink into your stance and the bass deepens.'),
  ],
  diet: [
    step('.diet-hero', 'Your plate', 'Calories fill the ring; macros and water sit beside it.'),
    step('.diet-library', 'Quick add', 'Tap a common meal, or type your own below.'),
  ],
  monk: [step('.monk-intro', 'Let it go', 'Words crumble after a few seconds. Nothing is saved.')],
  voice: [
    step('.voice-rec', 'Record', 'Ramble freely; it stays on this device.'),
    step('.voice-list', 'Transcribe', 'Whisper turns speech into text, key points and ideas.'),
  ],
  energy: [
    step('.energy-sankey', 'Your week as a flow', 'Hours on the left flow into stats, recovery and burnout.'),
    step('.energy-form', 'Add hours', 'Log scrolling, leisure or exercise to complete the picture.'),
  ],
  lab: [
    step('.lab-heat', 'Every metric vs every other', 'Warm cells rise together; blue ones move opposite.'),
    step('.lab-export', 'Export', 'A PDF report or a full backup zip.'),
  ],
  epiphanies: [
    step('.epiphany-add', 'Add an insight', 'Or extract one from a Daybook page.'),
    step('.epiphany-list', 'Spaced reviews', 'Each returns right before you would forget it.'),
  ],
  posture: [
    step('.posture-stage', 'Your posture', 'Green when upright, red when slouching.'),
    step('.posture-side', 'Calibrate and play', 'Sit tall, calibrate, then earn stamina.'),
  ],
  'release': [
    step('.release-input', 'Name it', 'Write what is weighing on you.'),
    step('.release-fire', 'Let it burn', 'Drag the card into the fire.'),
  ],
  'focus-room': [
    step('.room-scene', 'Your study', 'Your avatar works alongside you.'),
    step('.room-controls', 'Start a session', 'Pick a length and a soundtrack.'),
  ],
  'explore': [
    step('.explore-builder', 'Build a question', 'Add rules and groups with AND / OR.'),
    step('.explore-results', 'See matches', 'Entries that fit every rule.'),
  ],
  'yearbook': [
    step('.yearbook-options', 'Choose chapters', 'Pick what goes in your book.'),
    step('.yearbook-generate', 'Publish', 'Download a print-ready PDF.'),
  ],
  'palace': [
    step('.palace-stage', 'Your year', 'Drag or scroll to spin; click a day.'),
    step('.palace-detail', 'Read the day', 'Everything you recorded that day.'),
  ],
  'journey': [
    step('.journey-stage', 'Your path', 'Scroll to walk your streak.'),
    step('.journey-steps', 'Milestones', 'A monument every 7 days.'),
  ],
  'places': [
    step('.places-consent', 'Private by default', 'Location is only saved if you turn it on.'),
    step('.places-map', 'Your map', 'Markers are coloured by mood.'),
  ],
  sleep: [
    step('.sleep-stats', 'Your week of sleep', 'Average, quality, consistency and debt.'),
    step('.sleep-page .filter-chips', 'Three modes', 'Log a night, wind down, or read your insights.'),
  ],
  shop: [
    step('.shop-hero', 'Your petals', 'Earned by visiting each day.'),
    step('.shop-grid', 'Treat yourself', 'Decor shows up in Bloom World; outfits dress your avatar.'),
  ],
  breathe: [
    step('.wb-chips', 'Pick a rhythm', 'Box, 4-7-8 or Calm.'),
    step('.wb-orb-stage', 'Follow the orb', 'Breathe in as it grows, out as it shrinks.'),
  ],
  mood: [
    step('.wb-moods', 'Tap a mood', 'Add a word if you like.'),
    step('.wb-week', 'See your week', 'Patterns appear over time.'),
  ],
  gratitude: [
    step('.wb-inline-form', 'Add one good thing', 'Small counts.'),
    step('.wb-jar', 'Watch the jar fill', 'Revisit notes any time.'),
  ],
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
    const reduced = prefersReducedMotion()
    let talkTimer: ReturnType<typeof setTimeout> | undefined
    tour.current = driver({
      animate: !reduced,
      popoverClass: 'bloom-guide',
      stagePadding: 8,
      stageRadius: 14,
      overlayOpacity: subOn('walkthroughTour', 'dim', { ignoreParent: true }) ? 0.55 : 0,
      showProgress: true,
      progressText: '{{current}} / {{total}}',
      // Each step: the pixel wizard "speaks" the tip while its words reveal.
      onPopoverRender: (popover) => {
        clearTimeout(talkTimer)
        const wrapper = popover.wrapper
        wrapper.querySelector('.wz-avatar')?.remove()
        const avatar = document.createElement('div')
        avatar.className = 'wz-avatar is-talking'
        avatar.innerHTML = wizardSvg()
        const wizard = subOn('walkthroughTour', 'wizard', { ignoreParent: true })
        const reveal = subOn('walkthroughTour', 'reveal', { ignoreParent: true }) && !reduced
        wrapper.classList.toggle('no-wizard', !wizard)
        if (wizard) wrapper.prepend(avatar)
        revealText(popover.title, !reveal)
        const talking = revealText(popover.description, !reveal)
        talkTimer = setTimeout(
          () => avatar.classList.remove('is-talking'),
          reduced ? 0 : talking + 400,
        )
      },
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
  // The page tour now starts from Bloom's chat ("Show me around this page").
  const startRef = useRef(start)
  startRef.current = start
  useEffect(() => {
    const go = () => startRef.current()
    window.addEventListener('bloom:tour', go)
    return () => window.removeEventListener('bloom:tour', go)
  }, [])
  return <button ref={trigger} className="guide-button sr-only" onClick={start} tabIndex={-1} aria-hidden="true" />
}
