import { featureLinks } from '../components/ui/Flow'

/**
 * Bloom's guided chat: what Bloom says on each page and the choices it offers.
 * A choice can reply, take you to a page, or run one of the page's own
 * actions (the same ones as its right-click menu).
 */
export type Choice = {
  label: string
  /** Bloom's reply when chosen. */
  reply?: string
  /** Navigate to this page. */
  go?: string
  /** Run a registered page action by id. */
  action?: string
  /** Show another node's options next. */
  next?: string
}
export type GuideNode = { say: string; choices: Choice[] }

export const pageGuides: Record<string, GuideNode> = {
  overview: {
    say: 'Hi! This is your home. Want to plan the day, check in, or jump somewhere?',
    choices: [
      { label: 'Plan my day', reply: 'Let’s start with your to-dos — pick one thing that matters most.', go: 'todos' },
      { label: 'I feel off today', reply: 'Thanks for telling me. A quick mood check-in helps me help you.', go: 'mood' },
      { label: 'Start focusing', reply: 'Opening Focus. Grow a scene while you work!', go: 'focus' },
      { label: 'Take a walk around town', reply: 'Bloom Street has a building for every feature.', go: 'street' },
    ],
  },
  games: {
    say: 'Welcome to the brain gym! Train reasoning, memory, focus or empathy — or test yourself.',
    choices: [
      { label: 'Take the IQ-style test', reply: 'Open the “IQ & EQ” tab and press Start under Reasoning. About 8 minutes — no pressure!' },
      { label: 'Measure my EQ', reply: 'In “IQ & EQ”, the emotional intelligence check takes about 6 minutes: statements, faces and real situations.' },
      { label: 'Which game should I play?', next: 'games-pick' },
      { label: 'Show my leaderboard', reply: 'The Leaderboard tab lists your top 10 runs and personal bests — only you compete with you.' },
      { label: 'How do levels work?', reply: 'Games adapt: score 80%+ and the level goes up, under 50% it eases down. You always play at your edge.' },
    ],
  },
  'games-pick': {
    say: 'What would you like to get better at?',
    choices: [
      { label: 'Memory', reply: 'Try N-back or Pattern echo — both stretch working memory.' },
      { label: 'Reasoning (IQ)', reply: 'Matrix puzzles and Quick analogies train the same skills as the IQ-style test.' },
      { label: 'Empathy (EQ)', reply: 'Face reader and Kind reply train reading emotions and choosing wise responses.' },
      { label: 'Focus & attention', reply: 'Colour clash and Focus tracker are great warm-ups before deep work.' },
      { label: 'Speed & maths', reply: 'Reaction, Speed maths and Number stream will get you sharp and quick.' },
    ],
  },
  todos: {
    say: 'Your to-do list. I can help you add, triage or focus.',
    choices: [
      { label: 'How do I add tasks fast?', reply: 'Type in Quick plan like “call mum tomorrow !1 #family” — I read the date, priority and tag.' },
      { label: 'Too much to do', reply: 'Swipe your overdue tasks: right keeps them today, left moves them on. Then focus on just one.' },
      { label: 'Focus on a task', reply: 'Taking you to Focus — pick the task there.', go: 'focus' },
      { label: 'Put tasks on my calendar', reply: 'Drag tasks from the tray onto the calendar to block time.', go: 'calendar' },
    ],
  },
  focus: {
    say: 'Ready to focus? Pick your energy and I’ll size the session.',
    choices: [
      { label: 'Start 25 minutes', reply: 'Set to 25 minutes. Press start when you’re ready.', action: 'focus-25' },
      { label: 'Go deep: 50 minutes', reply: 'Set to 50 minutes. Put your phone face-down!', action: 'focus-50' },
      { label: 'Change my grow scene', reply: 'Pick a tree, flowers, a city, treasure, a reef or a space station in “Set up in two taps”.' },
      { label: 'Add focus music', reply: 'Focus sounds can help you settle in.', go: 'sounds' },
    ],
  },
  habits: {
    say: 'Your habits. Every check-in waters your seedling.',
    choices: [
      { label: 'Check in quickly', reply: 'Use the swipe deck at the top — right for done, left for not yet.' },
      { label: 'Check in everything', reply: 'All done? Marking every habit for today.', action: 'stickers-all' },
      { label: 'I’m tired today', reply: 'Tap “Tired” in the mood row — I’ll shrink your habits to 2-minute versions.' },
      { label: 'See my seedling', reply: 'Your living seedling grows from habits, focus and journaling.', go: 'growth' },
    ],
  },
  daybook: {
    say: 'Your Daybook. Not sure what to write? I can pick a page for you.',
    choices: [
      { label: 'Suggest a page', reply: 'Tap how you feel in “Not sure what to write?” and swipe through pages that fit.' },
      { label: 'Continue my last page', reply: 'Opening your latest page.', action: 'daybook-continue' },
      { label: 'Read my books', reply: 'Your journal types are books on the shelf — tap one to flip through your entries.' },
      { label: 'Save an insight', reply: 'Highlight a sentence, right-click and choose “Save as epiphany”.' },
    ],
  },
  journal: {
    say: 'Let’s reflect. Start from a mood or a topic — no blank page needed.',
    choices: [
      { label: 'Start from my mood', reply: 'Tap a mood in “Start without a blank page” and I’ll set the session.' },
      { label: 'Read past reflections', reply: 'Swipe through “Your story so far” and tap a card to read it.' },
      { label: 'Write something longer', reply: 'The Daybook has 27 kinds of pages.', go: 'daybook' },
    ],
  },
  mood: {
    say: 'How are you, really? One tap is enough.',
    choices: [
      { label: 'Log my mood', reply: 'Tap a mood in One-tap check-in — then swipe what’s behind it.' },
      { label: 'I feel anxious', reply: 'Let’s breathe together for a minute.', go: 'breathe' },
      { label: 'I feel low', reply: 'Writing three good things can lift you a little.', go: 'gratitude' },
      { label: 'Shake my marble jar', reply: 'Every check-in is a marble. Shake it!', action: 'jar-shake' },
    ],
  },
  sleep: {
    say: 'Good sleep makes everything easier. How did you wake up?',
    choices: [
      { label: 'Log last night', reply: 'Tap how you woke in Morning check-in, then swipe last night’s factors.' },
      { label: 'Help me wind down', reply: 'A sleep meditation might help.', go: 'meditate' },
      { label: 'Morning light', reply: 'Getting daylight early sets your body clock.', go: 'daylight' },
    ],
  },
  exercises: {
    say: 'Let’s move! Filter by body area, or follow a goal program.',
    choices: [
      { label: 'Short on time', reply: 'Try the Desk relief program in the Programs tab — about 6 minutes.' },
      { label: 'I use a wheelchair', reply: 'Tick “Wheelchair / seated-only mode” and every move shown is seated.' },
      { label: 'Tone my arms', reply: 'The Toned arms program combines curls, presses and punches.' },
      { label: 'Try martial arts', reply: 'The Dojo has karate, kung fu, taekwondo, boxing and Muay Thai.', go: 'dojo' },
    ],
  },
  dojo: {
    say: 'Welcome to the dojo! Bow in — what shall we train?',
    choices: [
      { label: 'Teach me a kick', reply: 'Filter by Kicks, pick one, and the Coach tab shows the move.' },
      { label: 'Call combos at me', reply: 'Open the Combo caller tab and press Start — react to each call!' },
      { label: 'How do belts work?', reply: 'Every technique you practise counts. 100 for yellow, all the way to 3,000 for black.' },
    ],
  },
  shop: {
    say: 'The Petal shop! Spend petals from your daily visits.',
    choices: [
      { label: 'Buy the best I can afford', reply: 'Let’s treat you.', action: 'shop-best' },
      { label: 'How do I earn petals?', reply: 'Visit daily and check in — every day you show up adds petals.' },
      { label: 'Build a wishlist', reply: 'Swipe right on items in Wishlist and watch the savings rings fill.' },
    ],
  },
  street: {
    say: 'Welcome to Bloom Street! Every building is a part of Bloom.',
    choices: [
      { label: 'Walk to the next building', reply: 'Off we go!', action: 'street-next' },
      { label: 'Go inside', reply: 'Opening the door…', action: 'street-enter' },
    ],
  },
  calendar: {
    say: 'Your calendar. The ring shows how full today is.',
    choices: [
      { label: 'Add a time block', reply: 'Adding a block at the next half hour.', action: 'cal-new' },
      { label: 'Show the week', reply: 'Switching view.', action: 'cal-week' },
    ],
  },
  meditate: {
    say: 'Let’s find a little stillness. How are you feeling?',
    choices: [
      { label: 'Calm me down fast', reply: 'The 3-minute SOS session is made for that — tap Anxious in the mood row.' },
      { label: 'Help me sleep', reply: 'Try “Drifting off” — 15 minutes of gentle guidance.' },
    ],
  },
  settings: {
    say: 'Settings. Search any feature or option, or set Bloom up again with me.',
    choices: [
      { label: 'Set Bloom up again', reply: 'Let’s redo the welcome questions.', action: 'c-welcome' },
      { label: 'Change my pointer', reply: 'Pick a shape, colour and effect.', go: 'pointer' },
      { label: 'Find an option', reply: 'Type in “Find a feature…” — matching options open and highlight.' },
    ],
  },
}

/** A page's guide, falling back to its linked features. */
export function guideFor(page: string, names: (p: string) => string): GuideNode {
  if (pageGuides[page]) return pageGuides[page]
  const links = featureLinks[page] ?? []
  return {
    say: `You’re on ${names(page)}. Here’s what works well with it.`,
    choices: links.map((l) => ({ label: `${l.why} → ${names(l.page)}`, reply: `Taking you to ${names(l.page)}.`, go: l.page })),
  }
}
