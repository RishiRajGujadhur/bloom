import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const common = {
  welcome: {
    eyebrow: 'A little better, every day',
    title: 'A little space to grow.',
    subtitle: 'Welcome back. Let’s make today feel a little more like you.',
    private: 'Just for you',
  },
  navigation: {
    main: 'Main navigation',
    space: 'My space',
    dashboard: 'My dashboard',
    habits: 'Daily habits',
    journal: 'Reflection journal',
    intentions: 'My intentions',
  },
  actions: {
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    exportData: 'Export my data',
    language: 'Language',
  },
  dashboard: {
    stats: 'Your Stats',
    quests: 'Daily Quests',
    settings: 'Settings',
    startJournaling: 'Start Journaling',
  },
  ui: {
    everydaySpace: 'Your everyday space',
    mySpace: 'My space',
    growAtYourOwnPace: 'Grow at your own pace.',
    progressMessage: 'You don’t need a perfect day to make a little progress.',
    oneSmallStep: 'One small step at a time',
    personalSpace: 'Your personal space',
    noAccount: 'No account needed',
    skipToDashboard: 'Skip to dashboard',
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',
    savingAttention: 'Saving needs your attention',
    exportOriginal: 'Export original data',
    useFreshData: 'Use fresh data & enable saving',
    habitsToday: 'Habits nurtured today',
    intentionsToday: 'Intentions followed through',
    reflections: 'Moments of reflection',
    addHabit: 'Add habit',
    addSmallHabit: 'Add a small habit',
    statFor: 'Stat for {{title}}',
    comboExp: '+10 EXP × combo',
    todaysProgress: 'Today’s progress',
    lastSevenDays: 'Your last 7 days',
    habitsCompleted: '{{count}} habits completed',
    addIntention: 'Add intention',
    setIntention: 'Set an intention',
    intentionHeading: 'A little intention',
    intentionDescription: 'What deserves your energy today?',
    freshPage: 'A fresh page for your day.',
    chooseMeaningful: 'Choose something meaningful, however small.',
    edit: 'Edit {{title}}',
    editAffirmation: 'Edit affirmation',
    reminder: 'A reminder, just for you.',
    storyUnfolding: 'Your story is unfolding',
    revisit: 'Revisit your reflections and see how far you’ve come.',
    reflectionCount: '{{count}} reflections',
    madeForGrowth: 'Made for your own kind of growth.',
    savedBrowser: 'Saved in this browser',
    keepBackup: 'Keep a backup',
    plantHabit: 'Plant a small habit',
    practiceQuestion: 'What would you like to practice?',
    makeRoom: 'Make room for what matters',
    oneIntention: 'One intention for today',
    editIntention: 'Edit your intention',
    yourIntention: 'Your intention',
    wordsLikeYou: 'Words that feel like you',
    personalAffirmation: 'Your personal affirmation',
    reflectionJournal: 'Your reflection journal',
    backToReflections: 'Back to reflections',
    momentForYou: 'A moment for yourself',
    storyStarts:
      'Your story starts with one check-in. Saved reflections will appear here.',
    save: 'Save',
    habitsSubtitle: 'Show up for yourself, in small ways.',
    wordsToGrowWith: 'WORDS TO GROW WITH',
    habitDetailDefault: 'A small promise to yourself',
    stepCounter: '{{step}} / 4',
    fiveMin: '5 MIN FOR YOU',
    welcomeLine1: 'Notice how you feel, celebrate a small win,',
    welcomeLine2: 'and find your next gentle step.',
    closeDialog: 'Close dialog',
    daybookNav: 'Daybook modes',
    documentTitle: 'Bloom — Your Mindfulness Dashboard',
    metaDescription:
      'Bloom: your personal space for daily habits, gentle intentions and guided reflection.',
  },
  forms: {
    required: 'Please add a little text.',
    maxLength: 'Use {{max}} characters or fewer.',
  },
  journal: {
    daybook: 'The daybook',
    choosePage: 'Choose a page for this moment.',
    differentDays:
      'Different days need different kinds of attention. Pick a mode and make it yours.',
    searchModes: 'Search modes',
    searchLabel: 'Search journal modes',
    noPages: 'No pages match “{{query}}”. Try a gentler search.',
    allModes: 'All modes',
    saved: 'Saved',
    savePage: 'Save page',
    savedPrivately: 'Saved privately on this device',
    unsaved: 'Unsaved changes',
    closePage: 'Close page',
    oneThing: 'My one thing today is…',
    rapidToolbar: 'Rapid logging toolbar',
    startRapid: 'Start rapid logging here…',
    whatsInHead: 'What’s in my head',
    whatToDo: 'What I want to do with it',
    journalPage: 'Journal page',
    holdThought: 'Let the page hold the first thought…',
    reflectionSpace: 'Your reflection space',
    clarity: 'A little check-in. A little clarity.',
    makeRoom: 'Make a little room for yourself.',
    checkIn: 'Begin a check-in',
    guidedPrivate: 'Guided prompts · Private to this browser',
    showedUp: 'You showed up for yourself. That matters.',
    tags: 'Tags, separated by commas',
    tagsPlaceholder: 'Gratitude, rest, growth',
    viewSaved: 'View saved reflection',
    saveReview: 'Save & review reflection',
    anotherCheckIn: 'Start another check-in',
    sendReflection: 'Send reflection',
    journalConversation: 'Journal conversation',
    suggestedReplies: 'Suggested replies',
    preparing: 'Preparing next reflection',
    mood: 'How’s your mood?',
    energy: 'Your energy level',
    lowGreat: 'Low → Great',
    drainedEnergized: 'Drained → Energized',
    guideName: 'YOUR REFLECTION GUIDE',
    youName: 'YOU',
    ratingAria: '{{field}} {{n}} of 5',
    moodField: 'mood',
    energyField: 'energy',
    reflectionLabel: 'Your reflection',
    inputPlaceholder: 'There’s no right answer. Start wherever you are…',
    honesty: 'A little honesty goes a long way.',
    characters: '{{count}}/2000',
    summaryReflection: 'Your check-in',
    summaryWin: 'A win to remember',
    summaryObstacle: 'What you worked through',
    summaryActionStep: 'Your next small step',
    summaryTitle: 'A moment worth keeping',
    summaryMeta: 'Mood {{mood}}/5 · Energy {{energy}}/5',
    summaryBack: 'Back to my day',
    inputTooLong: 'Keep your reply under 2,000 characters.',
    quickEntry: 'Quick entry',
    guided: 'Guided',
    quickEntryLabel: 'Quick journal entry',
    quickPlaceholder: 'Capture what’s here…',
    quickTags: 'Quick tags',
    customTag: 'Custom tag',
    addCustomTag: 'Add custom tag',
    photo: 'Photo',
    addPhotos: 'Add photos',
    voice: 'Voice',
    stopRecording: 'Stop · {{seconds}}s',
    saveEntry: 'Save entry',
    saving: 'Saving…',
    savedEntry: 'Saved to your journal.',
    recentMoments: 'Recent moments',
    mediaMoment: 'Media moment',
    attachmentCount_one: '{{count}} attachment',
    attachmentCount_other: '{{count}} attachments',
    preferGuided: 'Prefer a guided reflection?',
    mediaReady: 'Media ready to save',
    photoLabel: 'Photo',
    voiceNote: 'Voice note',
    voiceUnavailable: 'Voice recording is not available in this browser.',
    microphoneDenied:
      'Microphone access was not granted. You can still write or add a photo.',
    photoLimit: 'Use images under 10 MB. You can add up to four photos.',
    mediaSaveError: 'The media could not be saved. Your entry is still open.',
    removeMedia: 'Remove {{name}}',
    feeling: 'How are you feeling?',
    moodVeryLow: 'Very low',
    moodLow: 'Low',
    moodOkay: 'Okay',
    moodGood: 'Good',
    moodGreat: 'Great',
    quickTag: {
      grateful: 'grateful',
      calm: 'calm',
      heavy: 'heavy',
      proud: 'proud',
      idea: 'idea',
      memory: 'memory',
    },
  },
  prompts: {
    reflection: {
      prompt: 'Let’s take a breath. How are you feeling today?',
      chips: [
        'Feeling grounded',
        'A little overwhelmed',
        'Ready for a fresh start',
      ],
    },
    win: {
      prompt: 'What’s one small win you want to give yourself credit for?',
      chips: ['I made time for myself', 'I showed up', 'I took a small step'],
    },
    obstacle: {
      prompt: 'What felt challenging, and what helped you get through it?',
      chips: [
        'I paused and tried again',
        'I asked for help',
        'I’m still working through it',
      ],
    },
    action_step: {
      prompt: 'What’s one gentle, doable action you’ll take tomorrow?',
      chips: [
        'Take a 10-minute walk',
        'Start with a glass of water',
        'Make space to rest',
      ],
    },
  },
  defaults: {
    move: 'Move with intention',
    moveDetail: 'A walk, a stretch, a little movement',
    hydrate: 'Stay hydrated',
    hydrateDetail: 'Make time for a glass of water',
    mindful: 'Take a mindful moment',
    mindfulDetail: 'Pause. Breathe. Come back to yourself.',
    affirmation:
      'I don’t have to do it all. Small steps are still steps forward.',
  },
  errors: {
    load: 'Your saved data could not be read. It has not been overwritten. Export the original data before enabling saving again.',
    storage:
      'Changes are in memory only. Browser storage is unavailable or full. Export a backup before closing this page.',
  },
  settings: {
    eyebrow: 'Personalize your space',
    title: 'Settings',
    intro:
      'Choose the tools that support your self-coaching practice. Changes are saved automatically.',
    featuresHeading: 'Features',
    featuresDescription: 'Turn parts of bloom on or off whenever you need.',
    savedLocally: 'Saved locally',
    enableFeature: 'Enable {{title}}',
    appearanceHeading: 'Appearance',
    appearanceDescription:
      'Pick a colour palette and a typeface. Changes apply instantly.',
    colors: 'Colour palette',
    colorsHint: 'Every palette restyles the whole app, not just the dashboard.',
    dark: 'Dark',
    light: 'Light',
    customAccent: 'Accent colour',
    customAccentHint: 'Overrides the palette accent everywhere it is used.',
    resetAccent: 'Reset to palette',
    fonts: 'Typeface',
    fontsHint: 'Each option previews itself below.',
    configurationHeading: 'Configuration',
    configurationDescription:
      'Your current settings are shown as formatted JSON.',
    copyJson: 'Copy JSON to Clipboard',
    copied: 'Copied',
    clipboardError:
      'Clipboard access is unavailable. Copy the JSON manually instead.',
    importJson: 'Import JSON',
    importHint: 'Paste a complete settings object to apply it immediately.',
    importInvalid: 'Enter valid JSON to import settings.',
    importShape:
      'Settings JSON must include a features object with boolean values for every feature.',
    feature: {
      impactTasks: {
        title: 'Destructible tasks',
        description: 'Heavy tasks fall, bounce and shatter for bonus EXP.',
      },
      dietTracker: {
        title: 'Diet tracker',
        description: 'Meals, macros, water and mindful eating.',
      },
      monkMode: {
        title: 'Monk mode',
        description: 'Write it out, watch it crumble to sand. Nothing is saved.',
      },
      energySankey: {
        title: 'Energy flow',
        description: 'A Sankey diagram of where your hours and energy went.',
      },
      voiceMemos: {
        title: 'Voice memos',
        description: 'Record, transcribe on-device and extract key points.',
      },
      insightsLab: {
        title: 'Correlations lab',
        description: 'Statistics across your habits, sleep, mood and diet, plus exports.',
      },
      smartSearch: {
        title: 'Smart search',
        description: 'Hybrid keyword and meaning search, auto-tags, related pages.',
      },
      omnibox: {
        title: 'Omnibox commands',
        description: 'Type > in Ctrl K to log habits, meals, water, mood or change theme.',
      },
      pixelJuice: {
        title: 'Pixel juice',
        description: 'Pixel-art loot, chiptune sounds and sparks when you complete habits.',
      },
      microNutrients: {
        title: 'Micronutrients',
        description: 'Vitamins, minerals, gut diversity and the Hydrated buff.',
      },
      recipeBuilder: {
        title: 'Recipe builder',
        description: 'Drag ingredients onto a kitchen scale; cook loss and servings handled.',
      },
      breathSilk: {
        title: 'Breath silk',
        description: 'A WebGL silk surface that rises and falls with your breathing.',
      },
      wuXing: {
        title: 'Tai Chi soundscape',
        description: 'Five-element generative sound that deepens as your stance grounds.',
      },
      exerciseGuides: {
        title: "Exercise guides",
        description: "Animated form guides, muscle maps, tempo and a rep coach.",
      },
      workoutLog: {
        title: "Workout log",
        description: "Log sets with sliders, rest timer, PRs, charts and a plate calculator.",
      },
      intervalCoach: {
        title: "Interval coach",
        description: "HIIT, Tabata, EMOM and Couch-to-5K with voice and beeps.",
      },
      yogaFlow: {
        title: "Yoga flow",
        description: "Build flows by drag and drop and practise with a morphing guide and breath cue.",
      },
      mobility: {
        title: "Stretch & mobility",
        description: "Guided stretches with circle timers, a body map and desk-break reminders.",
      },
      runTracker: {
        title: "Run & walk",
        description: "GPS tracking on a live map with splits, pace, bests and a weekly goal.",
      },
      bodyProgress: {
        title: "Body progress",
        description: "Measurements, trend lines, private progress photos and a before/after slider.",
      },
      foodScanner: {
        title: "Food scanner",
        description: "Scan barcodes for Nutri-Score, additives, allergens and sugar, then log a portion.",
      },
      fasting: {
        title: "Fasting",
        description: "Intermittent fasting with a live ring, body stages and a history heatmap.",
      },
      focusSounds: {
        title: "Focus sounds",
        description: "Generative music tuned for focus, relaxation, meditation and sleep.",
      },
      soundMixer: {
        title: "Soundscape mixer",
        description: "Mix rain, ocean, fire, birds and noise into your own living soundscape.",
      },
      meditation: {
        title: "Guided meditation",
        description: "Spoken sessions with captions, courses, SOS calm and particle scenes.",
      },
      breathwork: {
        title: "Breathwork",
        description: "Power-breathing rounds, breath holds and recovery with animated lungs.",
      },
      mala: {
        title: "Mala & mantra",
        description: "A 3D 108-bead mala you tap through, with mantras, bells and rounds.",
      },
      inkJournal: {
        title: "Ink journal",
        description: "Handwrite and sketch with a pressure-sensitive pen on paper you choose.",
      },
      moodMirror: {
        title: "Mood mirror",
        description: "See the emotional tone of your writing over time, analysed on your device.",
      },
      mindMaps: {
        title: "Mind maps",
        description: "Type an outline and watch it become a living mind map.",
      },
      flashcards: {
        title: "Flashcards",
        description: "Spaced-repetition cards in Markdown with 3D flips, cloze and decks.",
      },
      brainGames: {
        title: "Brain games",
        description: "N-back, memory, colour clash, reaction and maths that adapt to you.",
      },
      goalRoadmap: {
        title: "Goal roadmap",
        description: "Long-term goals on a Gantt timeline with key results and weekly reviews.",
      },
      routineScheduler: {
        title: "Routine builder",
        description: "Step-by-step routines on flexible schedules with a guided player.",
      },
      digitalWellbeing: {
        title: "Digital wellbeing",
        description: "Active time, break reminders, detox and wind-down modes, phone-free challenges.",
      },
      eyeCare: {
        title: "Eye care",
        description: "20-20-20 reminders and hand-drawn eye exercises to follow.",
      },
      daylight: {
        title: "Daylight & circadian",
        description: "Your sun, your body clock: morning light, caffeine curfew, wind-down and moon.",
      },
      affirmations: {
        title: "Affirmation deck",
        description: "Swipeable affirmation cards with decks, favourites, your own words and a slideshow.",
      },
      dojo: {
        title: "Dojo",
        description: "Martial arts training: karate, kung fu, taekwondo, boxing and Muay Thai techniques, forms, a combo caller and belts.",
      },
      pointerFx: {
        title: "Pointer & right-click menu",
        description: "Custom pointer shapes, colours and trails, and a right-click menu that changes with each page.",
      },
      bloomStreet: {
        title: "Bloom Street",
        description: "An illustrated street where every feature is a building; a little sprout walks you there.",
      },
      moneyTracker: {
        title: "Money & spending",
        description: "Track spending in any currency: budgets, charts, subscriptions, net worth, savings goals and CSV import.",
      },
      bloomCore: {
        title: 'Bloom Core',
        description: 'What to do now, one meaningful growth path, discoveries and moments that matter.',
      },
      epiphanies: {
        title: 'Epiphanies',
        description: 'Spaced repetition brings your insights back before you forget them.',
      },
      dailyFlow: {
        title: 'Daily flow',
        description: 'Morning setup and evening wind-down that connect your tools.',
      },
      flowTopography: {
        title: 'Flow topography',
        description: 'Your typing rhythm drawn as a mountain range under each page.',
      },
      postureGuard: {
        title: 'Posture guard',
        description: 'On-device webcam posture check: stamina for sitting tall, poison for slouching.',
      },
      timeSince: {
        title: 'Time since',
        description: 'Split-flap counters for streaks and countdowns.',
      },
      drawnAchievements: {
        title: 'Drawn achievements',
        description: 'Illustrations that draw themselves when you level up.',
      },
      celebrations: {
        title: 'Celebrations',
        description: 'Pixel coin and star bursts when you complete things.',
      },
      burnRelease: {
        title: 'Burn & release',
        description: 'Drag a worry into the campfire and let it go.',
      },
      garage: {
        title: 'Garage',
        description: 'Park your collectible cars and upgrade the garage.',
      },
      urgeClock: {
        title: 'Urge clock',
        description: 'Live time since your last slip, with a best-streak high score.',
      },
      focusRoom: {
        title: 'Focus room',
        description: 'A pixel study with a timer and classical soundtrack.',
      },
      timeCapsule: {
        title: 'Time capsule',
        description: 'On-this-day memories and gratitude notes each morning.',
      },
      thoughtDiff: {
        title: 'Thought diffing',
        description: 'Compare a Daybook page with your last one of the same kind.',
      },
      queryBuilder: {
        title: 'Explore data',
        description: 'Build AND/OR filters across moods, journals and habits.',
      },
      yearbook: {
        title: 'Year book',
        description: 'Export your year as a beautifully typeset PDF book.',
      },
      memoryPalace: {
        title: 'Memory palace',
        description: 'Your year as a 3D ring of glowing days.',
      },
      skillConstellation: {
        title: 'Skill constellation',
        description: 'See skills and milestones as a 3D star map.',
      },
      streakJourney: {
        title: 'Streak journey',
        description: 'Scroll along a 3D path of your longest streak.',
      },
      moodOrb: {
        title: 'Mood orb',
        description: 'Log mood with a liquid 3D orb.',
      },
      placesMap: {
        title: 'Places',
        description: 'Opt-in map of where you feel and write best.',
      },
      sleepTracker: {
        title: 'Sleep & wind-down',
        description: 'Log nights, see patterns and follow a bedtime routine.',
      },
      petalShop: {
        title: 'Petal shop',
        description: 'Spend daily petals on world decor and avatar items.',
      },
      reminders: {
        title: 'Reminders',
        description: 'Gentle nudges for habits and routines at times you choose.',
      },
      adaptiveGoals: {
        title: 'Adaptive goals',
        description: 'Weekly targets that scale to your recent pace.',
      },
      breathe: {
        title: 'Breathe',
        description: 'Guided box and 4-7-8 breathing with a calming animation.',
      },
      moodCheckin: {
        title: 'Mood check-in',
        description: 'Log how you feel in two taps and see your week.',
      },
      gratitude: {
        title: 'Gratitude jar',
        description: 'Drop in one good thing a day and revisit them later.',
      },
      compactMode: {
        title: 'Compact layout',
        description: 'Tighter spacing so more fits on screen.',
      },
      bloomWorld: {
        title: 'Bloom World',
        description:
          'A living 3D island that grows from your tasks, focus, journals and habits.',
      },
      visionBoard: {
        title: 'Vision Board',
        description:
          'Arrange notes, reflections and badges on an infinite canvas. Turning this off keeps your board saved.',
      },
      urgeTracker: {
        title: 'Urge & trigger tracker',
        description:
          'Log urges and slips quickly, then reveal the contexts that make them more likely.',
      },
      habitTracker: {
        title: 'Habit tracker',
        description: 'Track daily habits, contribution grids and streaks, and follow timed routines.',
      },
      chatJournal: {
        title: 'Chat journal',
        description: 'Reflect through a gentle, guided conversation.',
      },
      rpgSkillTree: {
        title: 'RPG skill tree',
        description: 'Turn your growth into visible skills and momentum.',
      },
      weeklyRaidBoss: {
        title: 'Weekly raid boss',
        description: 'Add a playful weekly challenge to your self-coaching.',
      },
      daybookModes: {
        title: 'Daybook modes',
        description: 'Choose a writing mode that fits the moment.',
      },
      languageSelector: {
        title: 'Language selector',
        description: 'Switch the app language from the dashboard.',
      },
      walkthroughTour: {
        title: 'Walkthrough tour',
        description: 'Show the guided introduction for new features.',
      },
    },
  },
  sidebar: {
    collapse: 'Collapse menu',
    expand: 'Expand menu',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },
  daybook: {
    storageError:
      'Daybook changes are currently in memory only. Export your dashboard data or free browser storage to keep new pages.',
    category: {
      planning: 'Daily Planning & Productivity',
      reflection: 'Mental Health & Reflection',
      vision: 'Vision & Future Self',
      gamified: 'Gamified & Habit Analysis',
    },
    time: { five: '5 min', ten: '10 min', fifteen: '15 min' },
    bestFor: {
      planning: 'Starting with intention',
      reflection: 'Making sense of your inner world',
    },
    tool: {
      task: 'Task [•]',
      completed: 'Completed [X]',
      event: 'Event [O]',
      note: 'Note [-]',
    },
    rapidLogAria: 'Bullet journal rapid log',
    rapidToolbarAria: 'Rapid logging toolbar',
    focusAria: 'My one thing today',
    freeformAria: '{{title}} journal page',
    mode: {
      'morning-intentionality': {
        title: 'Morning Intentionality (The One Thing)',
        description:
          'Choose the one thing that would make today feel meaningful.',
      },
      'bullet-journal': {
        title: 'Bullet Journal (BuJo) Rapid Logging',
        description:
          'Rapid-log tasks, events, notes, and completions without breaking your rhythm.',
      },
      'weekly-review': {
        title: 'Weekly Review & Brain Dump',
        description:
          'Clear the mental tabs and decide what deserves your attention next.',
      },
      'done-list': {
        title: 'The Done List (Reverse To-Do list)',
        description:
          'Notice what you finished, carried, and quietly made progress on.',
      },
      'energy-audit': {
        title: 'End of Day Energy Audit',
        description:
          'Trace what restored your energy and what asked too much of it.',
        prompts: [
          'What gave you energy today?',
          'What drained or scattered you?',
          'What will you protect tomorrow?',
        ],
      },
      'nightly-reflection': {
        title: 'Nightly Reflection',
        description: 'Close the day with a softer, more honest look back.',
        prompts: [
          'What moment stays with you?',
          'What did you learn about yourself?',
          'What can you release before sleep?',
        ],
      },
      'mental-health-check-in': {
        title: 'Mental Health Check-in',
        description:
          'Name your current state without needing to fix it immediately.',
        prompts: [
          'What are you feeling?',
          'Where do you feel it in your body?',
          'What kind of support would help?',
        ],
      },
      'gratitude-log': {
        title: 'Gratitude Log',
        description:
          'Collect three specific things that made today a little brighter.',
        prompts: [
          'Something small I noticed',
          'Someone or something I appreciate',
          'A way I showed up for myself',
        ],
      },
      'unsent-letter': {
        title: 'Unsent Letter',
        description: 'Give the words somewhere private to land.',
      },
      'shadow-work': {
        title: 'Shadow Work Prompts',
        description:
          'Meet the patterns you usually edit out with curiosity instead of judgment.',
        prompts: [
          'What reaction surprised you recently?',
          'What might this part of you be protecting?',
          'What would compassion sound like here?',
        ],
      },
      'future-self-vision': {
        title: 'Future Self (1-Year Vision)',
        description:
          'Describe a year that feels aligned, vivid, and recognizably yours.',
      },
      'future-self-letter': {
        title: 'Future Self (Letter from the Future)',
        description:
          'Write from the perspective of a future you who kept going.',
      },
      'fear-setting': {
        title: 'Fear Setting',
        description:
          'Make fear concrete, then give yourself a path through it.',
      },
      'stoic-visualization': {
        title: 'Stoic Negative Visualization',
        description:
          'Imagine absence briefly so presence becomes easier to appreciate.',
        prompts: [
          'What are you taking for granted?',
          'What would you miss?',
          'How can you meet this moment fully?',
        ],
      },
      'boundary-setting': {
        title: "Boundary setting",
        description: "Name what you need and practise saying it kindly.",
        prompts: ["What happened, in plain facts?", "What do I need or value here?", "What will I say? (one or two sentences)", "What will I do if it continues?"],
      },
      'connection-check-in': {
        title: "Connection check-in",
        description: "Tend the relationships that matter to you.",
        prompts: ["Who is on my mind?", "What do I appreciate about them?", "When did we last really connect?", "One small gesture I can make this week"],
      },
      'reading-notes': {
        title: "Reading notes",
        description: "Turn what you read into something you keep.",
        prompts: ["What did I read? (title, pages)", "The key idea, in my own words", "How does it connect to my life?", "Something I will try", "Recall it without looking"],
      },
      'clear-writing': {
        title: "Clear writing",
        description: "Plan a message so it lands: audience, point, action.",
        prompts: ["Who is this for, and what do they need?", "My main point in one sentence", "The draft", "What can I cut?", "What should the reader do next?"],
      },
      'work-shutdown': {
        title: "Work shutdown",
        description: "Close the workday on purpose and leave a trail for tomorrow.",
        prompts: ["Where did I leave off?", "What is blocking me, if anything?", "The smallest next step for tomorrow", "What can I let go of tonight?"],
      },
      'meeting-prep': {
        title: "Meeting prep",
        description: "Walk in with a purpose, walk out with decisions.",
        prompts: ["What is this meeting for?", "Agenda (item · minutes)", "Decisions we need", "Questions I will ask", "Actions and owners afterwards"],
      },
      'voice-note': {
        title: 'Voice note',
        description: 'A transcribed voice memo with key points and ideas.',
      },
      'dream-journal': {
        title: 'Dream Journal',
        description:
          'Capture the texture of a dream before the details dissolve.',
      },
      'rpg-quest-log': {
        title: 'RPG Quest Log (Epic framing for daily tasks)',
        description:
          'Frame today’s tasks as quests with a clear next action and reward.',
        prompts: [
          'What is today’s main quest?',
          'What is the smallest next attack?',
          'What loot will completion unlock?',
        ],
      },
      'peak-experience': {
        title: 'Peak Experience Log (Logging a major win/loot drop)',
        description: 'Record a major win while the glow is still present.',
        prompts: [
          'What happened?',
          'What strengths did you use?',
          'How will you remember this win?',
        ],
      },
      'habit-autopsy': {
        title: 'Habit Autopsy (Why did a habit fail?)',
        description:
          'Study a missed habit without turning the evidence into shame.',
      },
      'five-minute-morning': {
        title: '5-Minute Morning Journal',
        description: 'A quick check-in for momentum before the day gets loud.',
        prompts: [
          'How do I want to feel?',
          'What is one doable move?',
          'What would make today a win?',
        ],
      },
      'decision-matrix': {
        title: 'Decision Matrix Journal',
        description:
          'Lay out the trade-offs so your next choice can feel grounded.',
      },
    },
  },
  rpg: {
    zoneAria: 'Your RPG adventure',
    eyebrow: 'YOUR EVERYDAY ADVENTURE',
    howToPlay: 'How to play',
    level: 'LV. {{level}}',
    tier0: 'The Seedling',
    tier1: 'The Grove Guardian',
    tier2: 'The Sunlit Champion',
    tagline: 'Your small steps are becoming superpowers.',
    inventory: 'Inventory',
    pixelAvatar: '{{name}} pixel avatar',
    companionSprite: '{{name}} companion',
    stage0: 'APPRENTICE GEAR',
    stage1: 'GROVE ARMOR',
    stage2: 'GOLDEN ARMOR + AURA',
    vitality: 'Vitality',
    hp: '{{hp}} / 100 HP',
    avatarHealth: 'Avatar health',
    statStrength: 'Strength',
    statIntelligence: 'Intelligence',
    statSpirit: 'Spirit',
    meterAria: '{{label}}: {{value}} of {{max}}',
    experience: 'Experience',
    expValue: '{{exp}} EXP',
    expUnit: 'EXP',
    progressToNextLevel: 'Progress to next level',
    expToLevel: '{{exp}} EXP to level {{level}}',
    statMove: 'MOVE',
    statFocus: 'FOCUS',
    statReflect: 'REFLECT',
    auraAwake: 'Your champion aura is awake.',
    statPointsUntil: '{{count}} stat points until your next evolution',
    streakCombo: 'STREAK COMBO',
    streakTime: 'Continuous streak time',
    streakDays_one: '{{count}} consecutive logging day',
    streakDays_other: '{{count}} consecutive logging days',
    streakStart: 'Your next action starts the clock.',
    days3: '3 DAYS',
    days14: '14 DAYS',
    comboProtected: 'Today’s combo is protected',
    comboKeep: 'Log once before midnight to keep it',
    comboStart: 'Log a habit, intention or reflection',
    reflect: 'Reflect for +5 Spirit',
    bossEyebrow: 'DAILY BOSS',
    bossName: 'The Procrastination Golem',
    bossDefeated: 'DEFEATED',
    bossReward: '50 EXP × combo',
    bossVictory: 'Victory! You kept your promises.',
    bossAttack: 'Every completed habit is an attack.',
    bossHp: '{{remaining}} / {{max}} HP',
    bossHealth: 'Daily boss health',
    committedIntention: 'Committed intention',
    bossSummary:
      '{{habitHits}}/{{habitTotal}} habits · {{priorityHits}}/{{priorityTotal}} critical intentions · Defeat restores 5 HP',
    bossIntro:
      'Choose 1–3 non-negotiable intentions. Your habits and priorities become today’s attacks.',
    commitBoss: 'Commit today’s boss ({{count}}/3)',
    bossPenalty:
      'Missed critical intentions cost 5 HP at midnight. The lineup locks when you commit.',
    addIntention: 'Add an intention below to summon your boss →',
    lootEyebrow: 'CONSISTENCY HAS ITS TREASURES',
    chest: '{{count}}-day chest',
    chestCollected: 'Collected',
    chestReady: 'Ready to open!',
    chest7: 'Forest palette + fox',
    chest30: 'Amber + spirit + chiptune',
    chestOpen: 'OPEN',
    chestLocked: '⌑',
    lootNotice: 'A milestone chest has dropped. Open it below your boss!',
    feedbackExp: '+{{earned}} EXP',
    feedbackBoss: ' · BOSS DEFEATED!',
    lootModalTitle: '{{count}}-day treasure',
    treasureAria: 'Milestone treasure chest',
    treasuresUnlocked: 'New treasures unlocked!',
    treasures7: 'Forest color palette and a rare fox companion.',
    treasures30:
      'Amber color palette, a spirit companion and an 8-bit victory cadence.',
    equipInventory: 'Equip in inventory',
    chestYours: 'You kept your combo alive. This one’s yours.',
    openChest: 'Open chest',
    inventoryTitle: 'Your adventurer’s inventory',
    worldPalette: 'World palette',
    paletteBloom: 'bloom',
    paletteForest: 'forest',
    paletteAmber: 'amber',
    travelCompanion: 'Travel companion',
    companionNone: 'none',
    companionFox: 'fox',
    companionSpirit: 'spirit',
    victorySound: 'Victory sound',
    soundOn: 'Sound on — click to mute',
    soundEnable: 'Enable 8-bit victory cadence',
    soundLocked: 'Unlock with the 30-day chest',
    soundNote:
      'Sound starts only after you enable it in this visit. Quiet by default.',
    audioUnavailable:
      'Audio is unavailable in this browser. You can keep playing without sound.',
    rulesTitle: 'A gentler kind of RPG',
    rulesGrowTitle: 'Grow your character',
    rulesGrow:
      'Each habit gives 10 base EXP and +5 to its assigned stat. Intentions give 10 base EXP; your first saved journal each day gives 20 EXP and +5 Spirit. Every 100 EXP is a level. At 100 total stat points you equip grove armor; at 300 you unlock golden armor and an aura.',
    rulesComboTitle: 'Keep your combo alive',
    rulesCombo:
      'Complete at least one activity each local calendar day. Today stays open until midnight. The clock starts with your first rewarded log in the current run. EXP compounds with exact elapsed hours: 72 hours gives 1.5×, 14 full days gives 3× (the cap). A missed whole day resets the combo. Device time is used.',
    rulesBossTitle: 'Fight the daily boss',
    rulesBoss:
      'Commit 1–3 intentions. The current habit list is locked into that boss: habits deal 20 damage each and priorities 30. Finish all of them to win 50 base EXP and restore 5 HP. Missing committed critical intentions costs 5 HP once when the day closes. No committed boss means no HP penalty. Health never drops below 1.',
    rulesUnlocksTitle: 'Earn real unlocks',
    rulesUnlocks:
      'A new log after 7 or 30 full elapsed days drops a one-time chest. Open it to equip palettes and companions. The 30-day chest adds a quiet, synthesized classical V–I victory cadence. Cosmetics stay unlocked.',
    rulesHonestTitle: 'Your progress stays honest',
    rulesHonest:
      'Undoing a completion reverses its EXP, stat points and boss damage. Rechecking restores the original award, never a larger one. Journals earn rewards once per day. Previous Bloom entries stay saved without retroactive rewards. No purchases, no punishment spiral.',
    showcaseAria: 'RPG progression tools',
    pathOfPractice: 'PATH OF PRACTICE',
    skillTreeTitle: 'Your skill tree',
    skillTreeAria: 'Mindfulness skill tree',
    skillTreeUnlocked: '{{unlocked}} / {{total}} unlocked',
    unlockCost: 'Unlock · {{cost}} EXP',
    skillTreeNote:
      'Complete the available practice to illuminate the next branch.',
    shopKicker: 'THE WAYFARER’S SHOP',
    shopTitle: 'Useful magic',
    gold: '✦ {{gold}} gold',
    owned: 'Owned',
    skills: {
      mindfulness: { title: 'Mindfulness', subtitle: 'Root skill · 0 EXP' },
      breathwork: { title: '5-Min Breathwork', subtitle: 'Spirit 10 · 40 EXP' },
      meditation: {
        title: '20-Min Meditation',
        subtitle: 'Spirit 25 · 100 EXP',
      },
      zen: { title: 'Zen State', subtitle: 'All stats 50 · 250 EXP' },
    },
    shopItem: {
      shield: { name: 'Streak Shield', description: 'Protect one missed day.' },
      elixir: {
        name: 'Focus Elixir',
        description: 'Double your next reflection EXP.',
      },
    },
    raidKicker: 'WEEKLY RAID',
    raidName: 'The Fog of Almost',
    raidMeta: 'Ends in 3 days · party of one',
    raidLevel: 'LV. {{level}}',
    bossVitality: 'Boss vitality',
    raidHabit: 'Complete a habit',
    raidReflect: 'Reflect for 5 minutes',
    raidHit: 'Direct hit. Keep the chain gentle.',
    recoveryLedger: 'RECOVERY LEDGER',
    graceDays: 'Grace Days',
    graceRemaining: '{{count}} remaining',
    graceNote:
      'Pause decay without losing your place. Rest is part of the run.',
    graceWeekAria: 'Weekly grace day overview',
    graceActiveDays: 'active days',
    graceDaysStat: 'grace days',
    graceCombo: 'current combo',
    orientationKicker: 'THE HERO’S ORIENTATION',
    orientationTitle: 'Make the invisible progress visible.',
    orientationSubtitle:
      'Mock progression tools for the days you’re building quietly.',
    guideMe: 'Guide me',
    expLabel: 'EXP',
    manaLabel: 'Mana',
    morphAction: 'Morph action',
    morphAria: 'Toggle action icon',
    dismissReward: 'Dismiss tutorial reward',
    orientationComplete: 'Orientation complete',
    tutorialExp: '+50 Tutorial EXP',
    tour: {
      skillTreeTitle: 'The Hero’s Orientation',
      skillTreeBody: 'Your skill tree turns tiny rituals into a visible path.',
      journalTitle: 'Reflect',
      journalBody: 'Your journal becomes spirit EXP.',
      habitsTitle: 'Daily quests',
      habitsBody: 'Non-negotiables earn gold and raid damage.',
      avatarTitle: 'Your avatar',
      avatarBody: 'Watch stats, buffs, and grace protect your run.',
    },
    momentumKicker: 'MOMENTUM ENGINE',
    momentumTitle: 'Keep the thread, gently.',
    momentumSubtitle:
      'Exact time since this run began. No streak math hidden behind a badge.',
    momentumRunning: 'RUNNING',
    momentumIdle: 'IDLE',
    momentumShattered: 'SHATTERED',
    unitDays: 'days',
    unitHours: 'hours',
    unitMinutes: 'minutes',
    startRun: 'Start a new run',
    resetClock: 'Reset clock',
    markShattered: 'Mark as shattered',
    shatteredNote:
      'The run is shattered, not you. Start again when it feels useful.',
    focusKicker: 'FOCUS QUEST',
    focusTitle: '25 minutes of protected attention.',
    focusSubtitle:
      'Choose a quiet loop. Leaving this tab before completion costs one armor point.',
    soundscapeAria: 'Soundscape',
    soundRain: 'Soft rain',
    soundForest: 'Night forest',
    soundBrown: 'Brown noise',
    soundOnLabel: 'Sound on',
    previewLoop: 'Preview loop',
    questComplete: 'COMPLETE',
    questDamaged: 'DAMAGED',
    questReady: '25:00',
    questState: {
      idle: 'idle',
      active: 'active',
      completed: 'completed',
      failed: 'failed',
    },
    beginQuest: 'Begin survival quest',
    runAgain: 'Run it again',
    claimCompletion: 'Claim completion',
    damageTaken: '{{count}} damage taken from leaving early.',
    damageNote:
      'Damage is recorded locally and never affects your journal data.',
    loreKicker: 'SCIENTIFIC LORE',
    loreTitle: 'Why small repetitions work.',
    loreUnlockAt: 'Unlock at {{unlock}}',
    contractsKicker: 'ACTION CONTRACTS',
    contractsTitle: 'Make the next step executable.',
    contractsSubtitle: 'Given / When / Then, signed to this device.',
    newContract: 'New contract',
    closeContract: 'Close',
    signContract: 'Sign contract',
    given: 'GIVEN',
    when: 'WHEN',
    then: 'THEN',
    placeholderGiven: 'I have ten quiet minutes',
    placeholderWhen: 'The kettle finishes boiling',
    placeholderThen: 'I will take three breaths',
    sign: 'SIGN',
    reopenContract: 'Reopen contract',
    completeContract: 'Complete contract',
    noContracts: 'No contracts yet. Write one small promise you can keep.',
    archiveKicker: 'INVENTORY ARCHIVE',
    archiveTitle: 'Journal entries, carried forward.',
    archiveSubtitle:
      'Search your completed reflections as key items and status notes.',
    searchArchive: 'Search your archive',
    searchArchiveAria: 'Search journal archive',
    filterTagsAria: 'Filter archive tags',
    allTags: 'All tags',
    noMatch: 'No entries match that search.',
    emptyArchive: 'Complete a reflection to place your first entry here.',
    quietReflection: 'A quiet reflection',
    lore: {
      attentionTitle: 'Attention is trainable',
      attentionBody:
        'Repeatedly returning to one cue strengthens the brain’s ability to notice and redirect attention.',
      alwaysAvailable: 'Always available',
      momentumTitle: 'Momentum lowers friction',
      momentumBody:
        'A visible starting point makes the next action easier to choose, especially on low-energy days.',
      momentumUnlock: '3-day momentum',
      recoveryTitle: 'Recovery is part of learning',
      recoveryBody:
        'Rest and reset protect consistency by making the practice resilient instead of brittle.',
      recoveryUnlock: '7-day momentum',
    },
  },
} as const

export const resources = {
  en: { translation: common },
  fr: {
    translation: {
      welcome: {
        eyebrow: 'Un peu mieux, chaque jour',
        title: 'Un espace pour grandir.',
        subtitle: 'Bon retour. Faisons de cette journée un peu plus la vôtre.',
        private: 'Rien que pour vous',
      },
      navigation: {
        main: 'Navigation principale',
        space: 'Mon espace',
        dashboard: 'Mon tableau de bord',
        habits: 'Habitudes quotidiennes',
        journal: 'Journal de réflexion',
        intentions: 'Mes intentions',
      },
      actions: {
        lightMode: 'Mode clair',
        darkMode: 'Mode sombre',
        exportData: 'Exporter mes données',
        language: 'Langue',
      },
      dashboard: {
        stats: 'Vos statistiques',
        quests: 'Quêtes du jour',
        settings: 'Paramètres',
        startJournaling: 'Commencer à écrire',
      },
      ui: {
        everydaySpace: 'Votre espace quotidien',
        mySpace: 'Mon espace',
        growAtYourOwnPace: 'Grandissez à votre rythme.',
        progressMessage:
          'Vous n’avez pas besoin d’une journée parfaite pour avancer un peu.',
        oneSmallStep: 'Un petit pas à la fois',
        personalSpace: 'Votre espace personnel',
        noAccount: 'Aucun compte requis',
        skipToDashboard: 'Aller au tableau de bord',
        switchToLight: 'Passer au mode clair',
        switchToDark: 'Passer au mode sombre',
        savingAttention: 'L’enregistrement nécessite votre attention',
        exportOriginal: 'Exporter les données originales',
        useFreshData:
          'Utiliser de nouvelles données et activer l’enregistrement',
        habitsToday: 'Habitudes cultivées aujourd’hui',
        intentionsToday: 'Intentions réalisées',
        reflections: 'Moments de réflexion',
        addHabit: 'Ajouter une habitude',
        addSmallHabit: 'Ajouter une petite habitude',
        statFor: 'Statistique pour {{title}}',
        comboExp: '+10 EXP × combo',
        todaysProgress: 'Progrès du jour',
        lastSevenDays: 'Vos 7 derniers jours',
        habitsCompleted: '{{count}} habitudes terminées',
        addIntention: 'Ajouter une intention',
        setIntention: 'Définir une intention',
        intentionHeading: 'Une petite intention',
        intentionDescription:
          'Qu’est-ce qui mérite votre énergie aujourd’hui ?',
        freshPage: 'Une page blanche pour votre journée.',
        chooseMeaningful:
          'Choisissez quelque chose de significatif, aussi petit soit-il.',
        edit: 'Modifier {{title}}',
        editAffirmation: 'Modifier l’affirmation',
        reminder: 'Un rappel, rien que pour vous.',
        storyUnfolding: 'Votre histoire se construit',
        revisit: 'Revoyez vos réflexions et mesurez le chemin parcouru.',
        reflectionCount: '{{count}} réflexions',
        madeForGrowth: 'Créé pour votre propre façon de grandir.',
        savedBrowser: 'Enregistré dans ce navigateur',
        keepBackup: 'Garder une sauvegarde',
        plantHabit: 'Planter une petite habitude',
        practiceQuestion: 'Que souhaitez-vous pratiquer ?',
        makeRoom: 'Faire de la place à l’essentiel',
        oneIntention: 'Une intention pour aujourd’hui',
        editIntention: 'Modifier votre intention',
        yourIntention: 'Votre intention',
        wordsLikeYou: 'Des mots qui vous ressemblent',
        personalAffirmation: 'Votre affirmation personnelle',
        reflectionJournal: 'Votre journal de réflexion',
        backToReflections: 'Retour aux réflexions',
        momentForYou: 'Un moment pour vous',
        storyStarts:
          'Votre histoire commence par un moment. Vos réflexions enregistrées apparaîtront ici.',
        save: 'Enregistrer',
        habitsSubtitle: 'Soyez présent pour vous, par petits gestes.',
        wordsToGrowWith: 'DES MOTS POUR GRANDIR',
        habitDetailDefault: 'Une petite promesse envers vous-même',
        stepCounter: '{{step}} / 4',
        fiveMin: '5 MIN POUR VOUS',
        welcomeLine1:
          'Remarquez ce que vous ressentez, célébrez une petite victoire,',
        welcomeLine2: 'et trouvez votre prochain pas tout en douceur.',
        closeDialog: 'Fermer la boîte de dialogue',
        daybookNav: 'Modes de carnet',
        documentTitle: 'Bloom — Ton tableau de bord de pleine conscience',
        metaDescription:
          'Bloom : votre espace personnel pour des habitudes quotidiennes, des intentions douces et une réflexion guidée.',
      },
      forms: {
        required: 'Ajoutez un peu de texte.',
        maxLength: 'Utilisez {{max}} caractères ou moins.',
      },
      journal: {
        daybook: 'Le carnet',
        choosePage: 'Choisissez une page pour ce moment.',
        differentDays:
          'Chaque jour demande une attention différente. Choisissez un mode et faites-le vôtre.',
        searchModes: 'Rechercher des modes',
        searchLabel: 'Rechercher des modes de journal',
        noPages:
          'Aucune page ne correspond à « {{query}} ». Essayez une recherche plus douce.',
        allModes: 'Tous les modes',
        saved: 'Enregistré',
        savePage: 'Enregistrer la page',
        savedPrivately: 'Enregistré en privé sur cet appareil',
        unsaved: 'Modifications non enregistrées',
        closePage: 'Fermer la page',
        oneThing: 'La seule chose que je veux faire aujourd’hui…',
        rapidToolbar: 'Barre de journal rapide',
        startRapid: 'Commencez votre journal rapide ici…',
        whatsInHead: 'Ce que j’ai en tête',
        whatToDo: 'Ce que je veux en faire',
        journalPage: 'Page de journal',
        holdThought: 'Laissez la page accueillir votre première pensée…',
        reflectionSpace: 'Votre espace de réflexion',
        clarity: 'Un petit bilan. Un peu de clarté.',
        makeRoom: 'Faites un peu de place pour vous.',
        checkIn: 'Commencer un bilan',
        guidedPrivate: 'Questions guidées · Privé sur ce navigateur',
        showedUp: 'Vous avez été présent pour vous-même. Cela compte.',
        tags: 'Tags, séparés par des virgules',
        tagsPlaceholder: 'Gratitude, repos, croissance',
        viewSaved: 'Voir la réflexion enregistrée',
        saveReview: 'Enregistrer et revoir la réflexion',
        anotherCheckIn: 'Commencer un autre bilan',
        sendReflection: 'Envoyer la réflexion',
        journalConversation: 'Conversation du journal',
        suggestedReplies: 'Réponses suggérées',
        preparing: 'Préparation de la prochaine réflexion',
        mood: 'Comment vous sentez-vous ?',
        energy: 'Votre niveau d’énergie',
        lowGreat: 'Bas → Excellent',
        drainedEnergized: 'Épuisé → Énergique',
        guideName: 'VOTRE GUIDE DE RÉFLEXION',
        youName: 'VOUS',
        ratingAria: '{{field}} {{n}} sur 5',
        moodField: 'humeur',
        energyField: 'énergie',
        reflectionLabel: 'Votre réflexion',
        inputPlaceholder:
          'Il n’y a pas de bonne réponse. Commencez où vous êtes…',
        honesty: 'Un peu d’honnêteté va loin.',
        characters: '{{count}}/2000',
        summaryReflection: 'Votre bilan',
        summaryWin: 'Une victoire à retenir',
        summaryObstacle: 'Ce que vous avez traversé',
        summaryActionStep: 'Votre prochain petit pas',
        summaryTitle: 'Un moment à garder',
        summaryMeta: 'Humeur {{mood}}/5 · Énergie {{energy}}/5',
        summaryBack: 'Retour à ma journée',
        inputTooLong: 'Gardez votre réponse sous 2 000 caractères.',
        quickEntry: 'Note rapide',
        guided: 'Guidé',
        quickEntryLabel: 'Note rapide du journal',
        quickPlaceholder: 'Capturez ce qui est là…',
        quickTags: 'Tags rapides',
        customTag: 'Tag personnalisé',
        addCustomTag: 'Ajouter le tag',
        photo: 'Photo',
        addPhotos: 'Ajouter des photos',
        voice: 'Voix',
        stopRecording: 'Arrêter · {{seconds}} s',
        saveEntry: 'Enregistrer',
        saving: 'Enregistrement…',
        savedEntry: 'Enregistré dans votre journal.',
        recentMoments: 'Moments récents',
        mediaMoment: 'Moment multimédia',
        attachmentCount_one: '{{count}} pièce jointe',
        attachmentCount_other: '{{count}} pièces jointes',
        preferGuided: 'Vous préférez une réflexion guidée ?',
        mediaReady: 'Médias prêts à enregistrer',
        photoLabel: 'Photo',
        voiceNote: 'Note vocale',
        voiceUnavailable:
          'L’enregistrement vocal n’est pas disponible dans ce navigateur.',
        microphoneDenied:
          'L’accès au microphone n’a pas été autorisé. Vous pouvez toujours écrire ou ajouter une photo.',
        photoLimit:
          'Utilisez des images de moins de 10 Mo. Vous pouvez ajouter jusqu’à quatre photos.',
        mediaSaveError:
          'Le média n’a pas pu être enregistré. Votre note reste ouverte.',
        removeMedia: 'Supprimer {{name}}',
        feeling: 'Comment vous sentez-vous ?',
        moodVeryLow: 'Très bas',
        moodLow: 'Bas',
        moodOkay: 'Correct',
        moodGood: 'Bien',
        moodGreat: 'Très bien',
        quickTag: {
          grateful: 'reconnaissant',
          calm: 'calme',
          heavy: 'lourd',
          proud: 'fier',
          idea: 'idée',
          memory: 'souvenir',
        },
      },
      prompts: {
        reflection: {
          prompt: 'Prenons un souffle. Comment vous sentez-vous aujourd’hui ?',
          chips: ['Ancré', 'Un peu submergé', 'Prêt pour un nouveau départ'],
        },
        win: {
          prompt: 'Quelle petite victoire voulez-vous vous accorder ?',
          chips: [
            'J’ai pris du temps pour moi',
            'J’étais présent',
            'J’ai fait un petit pas',
          ],
        },
        obstacle: {
          prompt:
            'Qu’est-ce qui a été difficile, et qu’est-ce qui vous a aidé à traverser ?',
          chips: [
            'J’ai fait une pause et j’ai réessayé',
            'J’ai demandé de l’aide',
            'J’y travaille encore',
          ],
        },
        action_step: {
          prompt: 'Quelle action douce et réaliste ferez-vous demain ?',
          chips: [
            'Faire une marche de 10 minutes',
            'Commencer par un verre d’eau',
            'Me ménager du repos',
          ],
        },
      },
      defaults: {
        move: 'Bouger avec intention',
        moveDetail: 'Une marche, un étirement, un peu de mouvement',
        hydrate: 'Rester hydraté',
        hydrateDetail: 'Prendre le temps d’un verre d’eau',
        mindful: 'Prendre un moment conscient',
        mindfulDetail: 'Pause. Respirez. Revenez à vous.',
        affirmation:
          'Je n’ai pas à tout faire. Les petits pas restent des pas en avant.',
      },
      errors: {
        load: 'Vos données enregistrées n’ont pas pu être lues. Elles n’ont pas été écrasées. Exportez les données originales avant de réactiver l’enregistrement.',
        storage:
          'Les changements sont seulement en mémoire. Le stockage du navigateur est indisponible ou plein. Exportez une sauvegarde avant de fermer cette page.',
      },
      settings: {
        eyebrow: 'Personnalisez votre espace',
        title: 'Paramètres',
        intro:
          'Choisissez les outils qui soutiennent votre pratique. Les changements sont enregistrés automatiquement.',
        featuresHeading: 'Fonctionnalités',
        featuresDescription:
          'Activez ou désactivez des parties de bloom selon vos besoins.',
        savedLocally: 'Enregistré localement',
        enableFeature: 'Activer {{title}}',
        appearanceHeading: 'Apparence',
        appearanceDescription:
          'Choisissez une palette de couleurs et une police. Les changements s’appliquent instantanément.',
        colors: 'Palette de couleurs',
        colorsHint:
          'Chaque palette restyle toute l’application, pas seulement le tableau de bord.',
        dark: 'Sombre',
        light: 'Clair',
        customAccent: 'Couleur d’accent',
        customAccentHint:
          'Remplace l’accent de la palette partout où il est utilisé.',
        resetAccent: 'Revenir à la palette',
        fonts: 'Police',
        fontsHint: 'Chaque option s’affiche dans sa propre police ci-dessous.',
        configurationHeading: 'Configuration',
        configurationDescription:
          'Vos paramètres actuels sont affichés en JSON formaté.',
        copyJson: 'Copier le JSON',
        copied: 'Copié',
        clipboardError:
          'L’accès au presse-papiers est indisponible. Copiez le JSON manuellement.',
        importJson: 'Importer du JSON',
        importHint:
          'Collez un objet de paramètres complet pour l’appliquer immédiatement.',
        importInvalid: 'Saisissez un JSON valide pour importer les paramètres.',
        importShape:
          'Le JSON des paramètres doit inclure un objet features avec une valeur booléenne pour chaque fonctionnalité.',
        feature: {
          impactTasks: {
            title: 'Tâches destructibles',
            description: 'Les tâches lourdes tombent, rebondissent et éclatent pour de l’EXP bonus.',
          },
          dietTracker: {
            title: 'Suivi alimentaire',
            description: 'Repas, macros, eau et alimentation consciente.',
          },
          monkMode: {
            title: 'Mode moine',
            description: 'Écrivez, regardez les mots s’effriter en sable. Rien n’est enregistré.',
          },
          energySankey: {
            title: 'Flux d’énergie',
            description: 'Un diagramme de Sankey de vos heures et de votre énergie.',
          },
          voiceMemos: {
            title: 'Mémos vocaux',
            description: 'Enregistrez, transcrivez sur l’appareil et extrayez l’essentiel.',
          },
          insightsLab: {
            title: 'Labo des corrélations',
            description: 'Statistiques entre habitudes, sommeil, humeur et alimentation, plus exports.',
          },
          smartSearch: {
            title: 'Recherche intelligente',
            description: 'Recherche hybride mots et sens, étiquettes automatiques, pages liées.',
          },
          omnibox: {
            title: 'Commandes Omnibox',
            description: 'Tapez > dans Ctrl K pour noter habitudes, repas, eau, humeur ou thème.',
          },
          pixelJuice: {
            title: 'Effets pixel',
            description: 'Butin en pixel art, sons chiptune et étincelles quand vous accomplissez une habitude.',
          },
          microNutrients: {
            title: 'Micronutriments',
            description: 'Vitamines, minéraux, diversité intestinale et bonus Hydraté.',
          },
          recipeBuilder: {
            title: 'Créateur de recettes',
            description: 'Glissez les ingrédients sur une balance ; cuisson et portions calculées.',
          },
          breathSilk: {
            title: 'Soie du souffle',
            description: 'Une soie WebGL qui monte et descend avec votre respiration.',
          },
          wuXing: {
            title: 'Paysage sonore Tai Chi',
            description: 'Son génératif des cinq éléments qui s’approfondit avec votre posture.',
          },
          exerciseGuides: {
            title: "Guides d’exercices",
            description: "Guides animés, carte musculaire, tempo et coach de répétitions.",
          },
          workoutLog: {
            title: "Journal d’entraînement",
            description: "Séries aux curseurs, repos, records, graphiques et calculateur de disques.",
          },
          intervalCoach: {
            title: "Coach d’intervalles",
            description: "HIIT, Tabata, EMOM et Couch-to-5K avec voix et bips.",
          },
          yogaFlow: {
            title: "Flow de yoga",
            description: "Composez des enchaînements en glisser-déposer et pratiquez avec guide et souffle.",
          },
          mobility: {
            title: "Étirements & mobilité",
            description: "Étirements guidés, minuteurs circulaires, carte du corps et pauses bureau.",
          },
          runTracker: {
            title: "Course & marche",
            description: "Suivi GPS sur carte avec temps intermédiaires, allure, records et objectif.",
          },
          bodyProgress: {
            title: "Progrès corporels",
            description: "Mensurations, tendances, photos privées et comparaison avant/après.",
          },
          foodScanner: {
            title: "Scanner alimentaire",
            description: "Scannez les codes-barres : Nutri-Score, additifs, allergènes et sucre, puis ajoutez une portion.",
          },
          fasting: {
            title: "Jeûne",
            description: "Jeûne intermittent : anneau en direct, étapes du corps et carte de chaleur.",
          },
          focusSounds: {
            title: "Sons de concentration",
            description: "Musique générative pour se concentrer, se détendre, méditer et dormir.",
          },
          soundMixer: {
            title: "Mixeur d’ambiances",
            description: "Mélangez pluie, océan, feu, oiseaux et bruit en une ambiance vivante.",
          },
          meditation: {
            title: "Méditation guidée",
            description: "Séances guidées avec sous-titres, parcours, SOS et scènes de particules.",
          },
          breathwork: {
            title: "Respiration intense",
            description: "Séries de respiration, apnées et récupération avec poumons animés.",
          },
          mala: {
            title: "Mala & mantra",
            description: "Un mala 3D de 108 perles à égrener, avec mantras, cloches et tours.",
          },
          inkJournal: {
            title: "Journal à l’encre",
            description: "Écrivez et dessinez à la main avec un stylo sensible à la pression.",
          },
          moodMirror: {
            title: "Miroir d’humeur",
            description: "Le ton émotionnel de vos écrits au fil du temps, analysé sur l’appareil.",
          },
          mindMaps: {
            title: "Cartes mentales",
            description: "Écrivez un plan et regardez-le devenir une carte mentale.",
          },
          flashcards: {
            title: "Cartes mémoire",
            description: "Cartes à répétition espacée en Markdown, retournement 3D, texte à trous et paquets.",
          },
          brainGames: {
            title: "Jeux cérébraux",
            description: "N-back, mémoire, couleurs, réflexes et calcul qui s’adaptent à vous.",
          },
          goalRoadmap: {
            title: "Feuille de route",
            description: "Objectifs à long terme sur une frise, résultats clés et revues hebdomadaires.",
          },
          routineScheduler: {
            title: "Créateur de routines",
            description: "Routines pas à pas, horaires flexibles et lecteur guidé.",
          },
          digitalWellbeing: {
            title: "Bien-être numérique",
            description: "Temps actif, pauses, modes détox et soirée, défis sans téléphone.",
          },
          eyeCare: {
            title: "Soin des yeux",
            description: "Rappels 20-20-20 et exercices des yeux dessinés à la main.",
          },
          daylight: {
            title: "Lumière & rythme",
            description: "Votre soleil et votre horloge : lumière du matin, café, coucher et lune.",
          },
          affirmations: {
            title: "Cartes d’affirmation",
            description: "Cartes à faire glisser : paquets, favoris, vos propres mots et diaporama.",
          },
          dojo: {
            title: "Dojo",
            description: "Arts martiaux : techniques de karaté, kung-fu, taekwondo, boxe et boxe thaï, formes, appel de combinaisons et ceintures.",
          },
          pointerFx: {
            title: "Pointeur et menu contextuel",
            description: "Formes, couleurs et traînées de pointeur, et un clic droit qui change selon la page.",
          },
          bloomStreet: {
            title: "Rue Bloom",
            description: "Une rue illustrée où chaque fonction est un bâtiment ; une petite pousse vous y conduit.",
          },
          moneyTracker: {
            title: "Argent et dépenses",
            description: "Suivez vos dépenses dans n’importe quelle devise : budgets, graphiques, abonnements, patrimoine, objectifs et import CSV.",
          },
          bloomCore: {
            title: 'Cœur de Bloom',
            description: 'Quoi faire maintenant, un seul chemin de croissance, des découvertes et des moments qui comptent.',
          },
          epiphanies: {
            title: 'Épiphanies',
            description: 'La répétition espacée ramène vos idées avant que vous ne les oubliiez.',
          },
          dailyFlow: {
            title: 'Flux quotidien',
            description: 'Rituel du matin et du soir qui relient vos outils.',
          },
          flowTopography: {
            title: 'Topographie du flow',
            description: 'Votre rythme de frappe dessiné en chaîne de montagnes sous chaque page.',
          },
          postureGuard: {
            title: 'Gardien de posture',
            description: 'Posture vérifiée par webcam, sur l’appareil : endurance si droit, poison si avachi.',
          },
          timeSince: {
            title: 'Compteurs',
            description: 'Compteurs à palettes pour séries et comptes à rebours.',
          },
          drawnAchievements: {
            title: 'Succès dessinés',
            description: 'Des illustrations qui se dessinent à chaque niveau.',
          },
          celebrations: {
            title: 'Célébrations',
            description: 'Des pluies de pièces et d’étoiles quand vous accomplissez quelque chose.',
          },
          burnRelease: {
            title: 'Brûler et lâcher prise',
            description: 'Faites glisser un souci dans le feu de camp et laissez-le partir.',
          },
          garage: {
            title: 'Garage',
            description: 'Garez vos voitures de collection et améliorez le garage.',
          },
          urgeClock: {
            title: 'Chrono des envies',
            description: 'Le temps écoulé depuis le dernier écart, avec votre record.',
          },
          focusRoom: {
            title: 'Salle de concentration',
            description: 'Un bureau pixel avec minuteur et musique classique.',
          },
          timeCapsule: {
            title: 'Capsule temporelle',
            description: 'Des souvenirs « ce jour-là » et des notes de gratitude chaque matin.',
          },
          thoughtDiff: {
            title: 'Comparaison de pensées',
            description: 'Comparez une page avec la précédente du même type.',
          },
          queryBuilder: {
            title: 'Explorer les données',
            description: 'Filtres ET/OU sur humeurs, journaux et habitudes.',
          },
          yearbook: {
            title: 'Livre de l’année',
            description: 'Exportez votre année en livre PDF soigné.',
          },
          memoryPalace: {
            title: 'Palais de mémoire',
            description: 'Votre année en anneau 3D de jours lumineux.',
          },
          skillConstellation: {
            title: 'Constellation de compétences',
            description: 'Compétences et étapes en carte d’étoiles 3D.',
          },
          streakJourney: {
            title: 'Voyage de série',
            description: 'Parcourez en 3D le chemin de votre plus longue série.',
          },
          moodOrb: {
            title: 'Orbe d’humeur',
            description: 'Notez votre humeur avec un orbe 3D liquide.',
          },
          placesMap: {
            title: 'Lieux',
            description: 'Carte (facultative) des lieux où vous vous sentez le mieux.',
          },
          sleepTracker: {
            title: 'Sommeil et détente',
            description: 'Notez vos nuits, voyez les tendances, suivez un rituel du soir.',
          },
          petalShop: {
            title: 'Boutique de pétales',
            description: 'Dépensez vos pétales en décor et accessoires d’avatar.',
          },
          reminders: {
            title: 'Rappels',
            description: 'Des rappels doux pour vos habitudes et routines.',
          },
          adaptiveGoals: {
            title: 'Objectifs adaptatifs',
            description: 'Des objectifs hebdomadaires ajustés à votre rythme.',
          },
          breathe: {
            title: 'Respirer',
            description: 'Respiration carrée et 4-7-8 guidées, avec une animation apaisante.',
          },
          moodCheckin: {
            title: 'Humeur du jour',
            description: 'Notez votre humeur en deux gestes et voyez votre semaine.',
          },
          gratitude: {
            title: 'Bocal de gratitude',
            description: 'Une bonne chose par jour, à relire plus tard.',
          },
          compactMode: {
            title: 'Affichage compact',
            description: 'Des espacements plus serrés pour voir davantage.',
          },
          bloomWorld: {
            title: 'Monde Bloom',
            description:
              'Une île 3D vivante qui grandit avec vos tâches, votre concentration, votre journal et vos habitudes.',
          },
          visionBoard: {
            title: 'Tableau de vision',
            description:
              'Disposez notes, réflexions et badges sur un espace infini. Désactiver conserve votre tableau.',
          },
          urgeTracker: {
            title: 'Suivi des envies et déclencheurs',
            description:
              'Notez rapidement les envies et écarts, puis révélez les contextes qui les rendent plus probables.',
          },
          habitTracker: {
            title: 'Suivi des habitudes',
            description:
              'Tenez de petites promesses envers vous-même et suivez vos progrès.',
          },
          chatJournal: {
            title: 'Journal de discussion',
            description: 'Réfléchissez par une conversation douce et guidée.',
          },
          rpgSkillTree: {
            title: 'Arbre de compétences RPG',
            description:
              'Transformez votre progression en compétences visibles et en élan.',
          },
          weeklyRaidBoss: {
            title: 'Boss de raid hebdomadaire',
            description:
              'Ajoutez un défi hebdomadaire ludique à votre pratique.',
          },
          daybookModes: {
            title: 'Modes de carnet',
            description: 'Choisissez un mode d’écriture adapté au moment.',
          },
          languageSelector: {
            title: 'Sélecteur de langue',
            description:
              'Changez la langue de l’application depuis le tableau de bord.',
          },
          walkthroughTour: {
            title: 'Visite guidée',
            description:
              'Affichez l’introduction guidée des nouvelles fonctionnalités.',
          },
        },
      },
      sidebar: {
        collapse: 'Replier le menu',
        expand: 'Déplier le menu',
        openMenu: 'Ouvrir le menu',
        closeMenu: 'Fermer le menu',
      },
      daybook: {
        storageError:
          'Les changements du carnet sont seulement en mémoire. Exportez vos données ou libérez le stockage du navigateur pour conserver les nouvelles pages.',
        category: {
          planning: 'Planification quotidienne et productivité',
          reflection: 'Santé mentale et réflexion',
          vision: 'Vision et futur soi',
          gamified: 'Ludique et analyse des habitudes',
        },
        time: { five: '5 min', ten: '10 min', fifteen: '15 min' },
        bestFor: {
          planning: 'Commencer avec intention',
          reflection: 'Donner du sens à son monde intérieur',
        },
        tool: {
          task: 'Tâche [•]',
          completed: 'Terminé [X]',
          event: 'Événement [O]',
          note: 'Note [-]',
        },
        rapidLogAria: 'Journal rapide à puces',
        rapidToolbarAria: 'Barre de journal rapide',
        focusAria: 'Ma seule chose aujourd’hui',
        freeformAria: 'Page de journal {{title}}',
        mode: {
          'morning-intentionality': {
            title: 'Intention du matin (la seule chose)',
            description:
              'Choisissez la seule chose qui rendrait cette journée importante.',
          },
          'bullet-journal': {
            title: 'Journal à puces (BuJo)',
            description:
              'Notez rapidement tâches, événements et notes sans casser votre rythme.',
          },
          'weekly-review': {
            title: 'Bilan hebdomadaire et vidage mental',
            description:
              'Fermez les onglets mentaux et décidez ce qui mérite votre attention.',
          },
          'done-list': {
            title: 'La liste du fait (anti-todo)',
            description:
              'Remarquez ce que vous avez terminé, porté et fait avancer en silence.',
          },
          'energy-audit': {
            title: 'Bilan d’énergie de fin de journée',
            description:
              'Repérez ce qui a restauré votre énergie et ce qui en a trop demandé.',
            prompts: [
              'Qu’est-ce qui vous a donné de l’énergie aujourd’hui ?',
              'Qu’est-ce qui vous a drainé ou dispersé ?',
              'Que protégerez-vous demain ?',
            ],
          },
          'nightly-reflection': {
            title: 'Réflexion du soir',
            description:
              'Clôturez la journée avec un regard plus doux et plus honnête.',
            prompts: [
              'Quel moment vous reste en mémoire ?',
              'Qu’avez-vous appris sur vous-même ?',
              'Que pouvez-vous relâcher avant de dormir ?',
            ],
          },
          'mental-health-check-in': {
            title: 'Bilan de santé mentale',
            description:
              'Nommez votre état actuel sans avoir à le réparer tout de suite.',
            prompts: [
              'Que ressentez-vous ?',
              'Où le ressentez-vous dans votre corps ?',
              'Quel soutien vous aiderait ?',
            ],
          },
          'gratitude-log': {
            title: 'Journal de gratitude',
            description:
              'Rassemblez trois choses précises qui ont éclairé cette journée.',
            prompts: [
              'Une petite chose que j’ai remarquée',
              'Quelqu’un ou quelque chose que j’apprécie',
              'Une façon dont j’ai été là pour moi',
            ],
          },
          'unsent-letter': {
            title: 'Lettre non envoyée',
            description: 'Donnez aux mots un endroit privé où se poser.',
          },
          'shadow-work': {
            title: 'Questions d’ombre',
            description:
              'Rencontrez avec curiosité les schémas que vous effacez d’habitude.',
            prompts: [
              'Quelle réaction vous a surpris récemment ?',
              'Que protège peut-être cette part de vous ?',
              'À quoi ressemblerait la compassion ici ?',
            ],
          },
          'future-self-vision': {
            title: 'Futur soi (vision à un an)',
            description:
              'Décrivez une année alignée, vivante et reconnaissablement vôtre.',
          },
          'future-self-letter': {
            title: 'Futur soi (lettre du futur)',
            description:
              'Écrivez du point de vue d’un futur vous qui a continué.',
          },
          'fear-setting': {
            title: 'Mise à plat de la peur',
            description:
              'Rendez la peur concrète, puis ouvrez-vous un chemin à travers elle.',
          },
          'stoic-visualization': {
            title: 'Visualisation négative stoïcienne',
            description:
              'Imaginez brièvement l’absence pour mieux apprécier la présence.',
            prompts: [
              'Que tenez-vous pour acquis ?',
              'Que regretteriez-vous ?',
              'Comment accueillir pleinement ce moment ?',
            ],
          },
          'boundary-setting': {
            title: "Poser une limite",
            description: "Nommez ce dont vous avez besoin et entraînez-vous à le dire avec douceur.",
            prompts: ["Que s’est-il passé, factuellement ?", "De quoi ai-je besoin ici ?", "Que vais-je dire ?", "Que ferai-je si cela continue ?"],
          },
          'connection-check-in': {
            title: "Lien avec les autres",
            description: "Prenez soin des relations qui comptent.",
            prompts: ["À qui est-ce que je pense ?", "Qu’est-ce que j’apprécie chez cette personne ?", "Quand avons-nous vraiment échangé ?", "Un petit geste cette semaine"],
          },
          'reading-notes': {
            title: "Notes de lecture",
            description: "Transformez ce que vous lisez en quelque chose qui reste.",
            prompts: ["Qu’ai-je lu ?", "L’idée clé, avec mes mots", "Quel lien avec ma vie ?", "Ce que je vais essayer", "Me le rappeler sans regarder"],
          },
          'clear-writing': {
            title: "Écrire clairement",
            description: "Préparez un message qui porte : public, idée, action.",
            prompts: ["Pour qui, et de quoi ont-ils besoin ?", "Mon idée en une phrase", "Le brouillon", "Que puis-je couper ?", "Que doit faire le lecteur ensuite ?"],
          },
          'work-shutdown': {
            title: "Fin de journée de travail",
            description: "Terminez la journée consciemment et laissez une piste pour demain.",
            prompts: ["Où en suis-je resté ?", "Qu’est-ce qui me bloque ?", "La plus petite prochaine étape", "Que puis-je lâcher ce soir ?"],
          },
          'meeting-prep': {
            title: "Préparer une réunion",
            description: "Arrivez avec un objectif, repartez avec des décisions.",
            prompts: ["À quoi sert cette réunion ?", "Ordre du jour", "Décisions à prendre", "Mes questions", "Actions et responsables"],
          },
          'voice-note': {
            title: 'Note vocale',
            description: 'Un mémo vocal transcrit avec points clés et idées.',
          },
          'dream-journal': {
            title: 'Journal de rêves',
            description:
              'Capturez la texture d’un rêve avant que les détails ne se dissolvent.',
          },
          'rpg-quest-log': {
            title: 'Journal de quêtes RPG',
            description:
              'Présentez les tâches du jour comme des quêtes avec une action et une récompense.',
            prompts: [
              'Quelle est la quête principale du jour ?',
              'Quelle est la plus petite prochaine attaque ?',
              'Quel butin la réussite débloquera-t-elle ?',
            ],
          },
          'peak-experience': {
            title: 'Journal des sommets (grande victoire)',
            description:
              'Notez une grande victoire pendant que l’élan est encore là.',
            prompts: [
              'Que s’est-il passé ?',
              'Quelles forces avez-vous utilisées ?',
              'Comment vous souviendrez-vous de cette victoire ?',
            ],
          },
          'habit-autopsy': {
            title: 'Autopsie d’habitude',
            description:
              'Étudiez une habitude manquée sans transformer les faits en honte.',
          },
          'five-minute-morning': {
            title: 'Journal matinal en 5 minutes',
            description:
              'Un bilan rapide pour l’élan avant que la journée ne devienne bruyante.',
            prompts: [
              'Comment voulez-vous vous sentir ?',
              'Quel geste réalisable ?',
              'Qu’est-ce qui ferait de cette journée une réussite ?',
            ],
          },
          'decision-matrix': {
            title: 'Matrice de décision',
            description:
              'Posez les compromis pour que votre prochain choix soit ancré.',
          },
        },
      },
      rpg: {
        zoneAria: 'Votre aventure RPG',
        eyebrow: 'VOTRE AVENTURE QUOTIDIENNE',
        howToPlay: 'Comment jouer',
        level: 'NIV. {{level}}',
        tier0: 'La Pousse',
        tier1: 'Le Gardien du Bosquet',
        tier2: 'Le Champion Ensoleillé',
        tagline: 'Vos petits pas deviennent des superpouvoirs.',
        inventory: 'Inventaire',
        pixelAvatar: 'avatar pixel de {{name}}',
        companionSprite: 'compagnon {{name}}',
        stage0: 'ÉQUIPEMENT D’APPRENTI',
        stage1: 'ARMURE DU BOSQUET',
        stage2: 'ARMURE DORÉE + AURA',
        vitality: 'Vitalité',
        hp: '{{hp}} / 100 PV',
        avatarHealth: 'Santé de l’avatar',
        statStrength: 'Force',
        statIntelligence: 'Intelligence',
        statSpirit: 'Esprit',
        meterAria: '{{label}} : {{value}} sur {{max}}',
        experience: 'Expérience',
        expValue: '{{exp}} EXP',
        expUnit: 'EXP',
        progressToNextLevel: 'Progression vers le niveau suivant',
        expToLevel: '{{exp}} EXP pour le niveau {{level}}',
        statMove: 'BOUGER',
        statFocus: 'FOCUS',
        statReflect: 'RÉFLÉCHIR',
        auraAwake: 'Votre aura de champion est éveillée.',
        statPointsUntil:
          '{{count}} points de statistiques avant votre prochaine évolution',
        streakCombo: 'COMBO DE SÉRIE',
        streakTime: 'Durée de la série continue',
        streakDays_one: '{{count}} jour de journal consécutif',
        streakDays_other: '{{count}} jours de journal consécutifs',
        streakStart: 'Votre prochaine action lance le chrono.',
        days3: '3 JOURS',
        days14: '14 JOURS',
        comboProtected: 'Le combo d’aujourd’hui est protégé',
        comboKeep: 'Enregistrez une fois avant minuit pour le garder',
        comboStart: 'Enregistrez une habitude, une intention ou une réflexion',
        reflect: 'Réfléchir pour +5 Esprit',
        bossEyebrow: 'BOSS QUOTIDIEN',
        bossName: 'Le Golem de la Procrastination',
        bossDefeated: 'VAINCU',
        bossReward: '50 EXP × combo',
        bossVictory: 'Victoire ! Vous avez tenu vos promesses.',
        bossAttack: 'Chaque habitude terminée est une attaque.',
        bossHp: '{{remaining}} / {{max}} PV',
        bossHealth: 'Santé du boss quotidien',
        committedIntention: 'Intention engagée',
        bossSummary:
          '{{habitHits}}/{{habitTotal}} habitudes · {{priorityHits}}/{{priorityTotal}} intentions critiques · Vaincre restaure 5 PV',
        bossIntro:
          'Engagez 1 à 3 intentions non négociables. Vos habitudes et vos priorités deviennent les attaques du jour.',
        commitBoss: 'Engager le boss du jour ({{count}}/3)',
        bossPenalty:
          'Les intentions critiques manquées coûtent 5 PV à minuit. La sélection se verrouille au moment de l’engagement.',
        addIntention:
          'Ajoutez une intention ci-dessous pour invoquer votre boss →',
        lootEyebrow: 'LA RÉGULARITÉ A SES TRÉSORS',
        chest: 'coffre de {{count}} jours',
        chestCollected: 'Récupéré',
        chestReady: 'Prêt à ouvrir !',
        chest7: 'Palette forêt + renard',
        chest30: 'Ambre + esprit + chiptune',
        chestOpen: 'OUVRIR',
        chestLocked: '⌑',
        lootNotice: 'Un coffre d’étape est apparu. Ouvrez-le sous votre boss !',
        feedbackExp: '+{{earned}} EXP',
        feedbackBoss: ' · BOSS VAINCU !',
        lootModalTitle: 'trésor de {{count}} jours',
        treasureAria: 'Coffre au trésor d’étape',
        treasuresUnlocked: 'Nouveaux trésors débloqués !',
        treasures7: 'Palette de couleurs forêt et un renard rare en compagnon.',
        treasures30:
          'Palette ambre, un compagnon esprit et une cadence de victoire 8 bits.',
        equipInventory: 'Équiper dans l’inventaire',
        chestYours: 'Vous avez gardé votre combo en vie. Celui-ci est à vous.',
        openChest: 'Ouvrir le coffre',
        inventoryTitle: 'L’inventaire de votre aventurier',
        worldPalette: 'Palette du monde',
        paletteBloom: 'floraison',
        paletteForest: 'forêt',
        paletteAmber: 'ambre',
        travelCompanion: 'Compagnon de voyage',
        companionNone: 'aucun',
        companionFox: 'renard',
        companionSpirit: 'esprit',
        victorySound: 'Son de victoire',
        soundOn: 'Son activé — cliquez pour couper',
        soundEnable: 'Activer la cadence de victoire 8 bits',
        soundLocked: 'Débloquer avec le coffre de 30 jours',
        soundNote:
          'Le son ne démarre qu’après l’avoir activé lors de cette visite. Silencieux par défaut.',
        audioUnavailable:
          'L’audio n’est pas disponible dans ce navigateur. Vous pouvez continuer à jouer sans son.',
        rulesTitle: 'Un RPG plus doux',
        rulesGrowTitle: 'Faites grandir votre personnage',
        rulesGrow:
          'Chaque habitude donne 10 EXP de base et +5 à sa statistique assignée. Les intentions donnent 10 EXP de base ; votre premier journal enregistré chaque jour donne 20 EXP et +5 Esprit. Chaque 100 EXP correspond à un niveau. À 100 points de statistiques au total, vous équipez l’armure du bosquet ; à 300, vous débloquez l’armure dorée et une aura.',
        rulesComboTitle: 'Gardez votre combo en vie',
        rulesCombo:
          'Complétez au moins une activité chaque jour calendaire local. Aujourd’hui reste ouvert jusqu’à minuit. Le chrono démarre avec votre premier enregistrement récompensé de la série en cours. L’EXP se cumule selon les heures écoulées exactes : 72 heures donnent 1,5×, 14 jours complets donnent 3× (le maximum). Un jour entier manqué réinitialise le combo. L’heure de l’appareil est utilisée.',
        rulesBossTitle: 'Affrontez le boss quotidien',
        rulesBoss:
          'Engagez 1 à 3 intentions. La liste d’habitudes actuelle est verrouillée dans ce boss : chaque habitude inflige 20 dégâts et chaque priorité 30. Terminez-les toutes pour gagner 50 EXP de base et restaurer 5 PV. Manquer des intentions critiques engagées coûte 5 PV une fois à la fin de la journée. Aucun boss engagé signifie aucune pénalité de PV. La santé ne descend jamais sous 1.',
        rulesUnlocksTitle: 'Gagnez de vrais déblocages',
        rulesUnlocks:
          'Un nouvel enregistrement après 7 ou 30 jours complets fait apparaître un coffre unique. Ouvrez-le pour équiper des palettes et des compagnons. Le coffre de 30 jours ajoute une cadence de victoire classique V–I, discrète et synthétisée. Les cosmétiques restent débloqués.',
        rulesHonestTitle: 'Votre progression reste honnête',
        rulesHonest:
          'Annuler une réussite retire son EXP, ses points de statistiques et les dégâts au boss. Recocher restaure la récompense d’origine, jamais une plus grande. Les journaux rapportent des récompenses une fois par jour. Les entrées Bloom précédentes restent enregistrées sans récompenses rétroactives. Aucun achat, aucune spirale de punition.',
        showcaseAria: 'Outils de progression RPG',
        pathOfPractice: 'CHEMIN DE PRATIQUE',
        skillTreeTitle: 'Votre arbre de compétences',
        skillTreeAria: 'Arbre de compétences de pleine conscience',
        skillTreeUnlocked: '{{unlocked}} / {{total}} débloqués',
        unlockCost: 'Débloquer · {{cost}} EXP',
        skillTreeNote:
          'Complétez la pratique disponible pour éclairer la branche suivante.',
        shopKicker: 'LA BOUTIQUE DU VOYAGEUR',
        shopTitle: 'Magie utile',
        gold: '✦ {{gold}} pièces d’or',
        owned: 'Acquis',
        skills: {
          mindfulness: {
            title: 'Pleine conscience',
            subtitle: 'Compétence racine · 0 EXP',
          },
          breathwork: {
            title: 'Respiration en 5 min',
            subtitle: 'Esprit 10 · 40 EXP',
          },
          meditation: {
            title: 'Méditation de 20 min',
            subtitle: 'Esprit 25 · 100 EXP',
          },
          zen: { title: 'État zen', subtitle: 'Toutes stats 50 · 250 EXP' },
        },
        shopItem: {
          shield: {
            name: 'Bouclier de série',
            description: 'Protège un jour manqué.',
          },
          elixir: {
            name: 'Élixir de concentration',
            description: 'Double l’EXP de votre prochaine réflexion.',
          },
        },
        raidKicker: 'RAID HEBDOMADAIRE',
        raidName: 'Le Brouillard du Presque',
        raidMeta: 'Se termine dans 3 jours · groupe d’une personne',
        raidLevel: 'NIV. {{level}}',
        bossVitality: 'Vitalité du boss',
        raidHabit: 'Terminer une habitude',
        raidReflect: 'Réfléchir 5 minutes',
        raidHit: 'Coup direct. Gardez la chaîne douce.',
        recoveryLedger: 'REGISTRE DE RÉCUPÉRATION',
        graceDays: 'Jours de grâce',
        graceRemaining: '{{count}} restants',
        graceNote:
          'Mettez la décroissance en pause sans perdre votre place. Le repos fait partie de la série.',
        graceWeekAria: 'Aperçu hebdomadaire des jours de grâce',
        graceActiveDays: 'jours actifs',
        graceDaysStat: 'jours de grâce',
        graceCombo: 'combo actuel',
        orientationKicker: 'L’ORIENTATION DU HÉROS',
        orientationTitle: 'Rendez les progrès invisibles visibles.',
        orientationSubtitle:
          'Des outils de progression pour les jours où vous construisez en silence.',
        guideMe: 'Guidez-moi',
        expLabel: 'EXP',
        manaLabel: 'Mana',
        morphAction: 'Action morphique',
        morphAria: 'Basculer l’icône d’action',
        dismissReward: 'Fermer la récompense du tutoriel',
        orientationComplete: 'Orientation terminée',
        tutorialExp: '+50 EXP de tutoriel',
        tour: {
          skillTreeTitle: 'L’orientation du héros',
          skillTreeBody:
            'Votre arbre de compétences transforme de petits rituels en chemin visible.',
          journalTitle: 'Réfléchir',
          journalBody: 'Votre journal devient de l’EXP d’esprit.',
          habitsTitle: 'Quêtes quotidiennes',
          habitsBody:
            'Les non-négociables rapportent de l’or et des dégâts de raid.',
          avatarTitle: 'Votre avatar',
          avatarBody:
            'Suivez les statistiques, les bonus et la grâce qui protègent votre série.',
        },
        momentumKicker: 'MOTEUR D’ÉLAN',
        momentumTitle: 'Gardez le fil, en douceur.',
        momentumSubtitle:
          'Temps exact depuis le début de cette série. Aucun calcul caché derrière un badge.',
        momentumRunning: 'EN COURS',
        momentumIdle: 'À L’ARRÊT',
        momentumShattered: 'BRISÉ',
        unitDays: 'jours',
        unitHours: 'heures',
        unitMinutes: 'minutes',
        startRun: 'Commencer une nouvelle série',
        resetClock: 'Réinitialiser le chrono',
        markShattered: 'Marquer comme brisé',
        shatteredNote:
          'La série est brisée, pas vous. Recommencez quand cela vous sera utile.',
        focusKicker: 'QUÊTE DE CONCENTRATION',
        focusTitle: '25 minutes d’attention protégée.',
        focusSubtitle:
          'Choisissez une boucle calme. Quitter cet onglet avant la fin coûte un point d’armure.',
        soundscapeAria: 'Ambiance sonore',
        soundRain: 'Pluie douce',
        soundForest: 'Forêt nocturne',
        soundBrown: 'Bruit brun',
        soundOnLabel: 'Son activé',
        previewLoop: 'Écouter un extrait',
        questComplete: 'TERMINÉ',
        questDamaged: 'ENDOMMAGÉ',
        questReady: '25:00',
        questState: {
          idle: 'à l’arrêt',
          active: 'en cours',
          completed: 'terminé',
          failed: 'échoué',
        },
        beginQuest: 'Commencer la quête de survie',
        runAgain: 'Recommencer',
        claimCompletion: 'Valider la réussite',
        damageTaken: '{{count}} dégâts subis pour avoir quitté trop tôt.',
        damageNote:
          'Les dégâts sont enregistrés localement et n’affectent jamais vos données de journal.',
        loreKicker: 'SAVOIR SCIENTIFIQUE',
        loreTitle: 'Pourquoi les petites répétitions fonctionnent.',
        loreUnlockAt: 'Débloqué à {{unlock}}',
        contractsKicker: 'CONTRATS D’ACTION',
        contractsTitle: 'Rendez la prochaine étape exécutable.',
        contractsSubtitle: 'Si / Quand / Alors, signé sur cet appareil.',
        newContract: 'Nouveau contrat',
        closeContract: 'Fermer',
        signContract: 'Signer le contrat',
        given: 'SI',
        when: 'QUAND',
        then: 'ALORS',
        placeholderGiven: 'J’ai dix minutes calmes',
        placeholderWhen: 'La bouilloire finit de chauffer',
        placeholderThen: 'Je prendrai trois respirations',
        sign: 'SIGNER',
        reopenContract: 'Rouvrir le contrat',
        completeContract: 'Terminer le contrat',
        noContracts:
          'Aucun contrat pour l’instant. Écrivez une petite promesse que vous pouvez tenir.',
        archiveKicker: 'ARCHIVE D’INVENTAIRE',
        archiveTitle: 'Entrées de journal, conservées.',
        archiveSubtitle:
          'Recherchez vos réflexions terminées comme des objets clés et des notes de statut.',
        searchArchive: 'Rechercher dans vos archives',
        searchArchiveAria: 'Rechercher dans l’archive du journal',
        filterTagsAria: 'Filtrer les étiquettes d’archive',
        allTags: 'Toutes les étiquettes',
        noMatch: 'Aucune entrée ne correspond à cette recherche.',
        emptyArchive:
          'Terminez une réflexion pour placer votre première entrée ici.',
        quietReflection: 'Une réflexion tranquille',
        lore: {
          attentionTitle: 'L’attention s’entraîne',
          attentionBody:
            'Revenir sans cesse à un même repère renforce la capacité du cerveau à remarquer et à rediriger son attention.',
          alwaysAvailable: 'Toujours disponible',
          momentumTitle: 'L’élan réduit la friction',
          momentumBody:
            'Un point de départ visible rend l’action suivante plus facile à choisir, surtout les jours de faible énergie.',
          momentumUnlock: 'élan de 3 jours',
          recoveryTitle: 'Récupérer fait partie de l’apprentissage',
          recoveryBody:
            'Le repos et la remise à zéro protègent la régularité en rendant la pratique résiliente plutôt que fragile.',
          recoveryUnlock: 'élan de 7 jours',
        },
      },
    },
  },
  'en-pirate': {
    translation: {
      welcome: {
        eyebrow: 'A wee bit better, every day',
        title: 'A cozy cove to grow in.',
        subtitle:
          'Ahoy, welcome back. Let’s make today feel like your own treasure.',
        private: 'Just for ye',
      },
      navigation: {
        main: 'Main deck',
        space: 'Me own space',
        dashboard: 'Captain’s dashboard',
        habits: 'Daily deck duties',
        journal: 'Reflection log',
        intentions: 'Me intentions',
      },
      actions: {
        lightMode: 'Bright seas',
        darkMode: 'Dark seas',
        exportData: 'Stow me data',
        language: 'Tongue',
      },
      dashboard: {
        stats: 'Yer Stats',
        quests: 'Daily Quests',
        settings: 'Ship Settings',
        startJournaling: 'Start the Log',
      },
      ui: common.ui,
      forms: common.forms,
      journal: common.journal,
      prompts: common.prompts,
      defaults: common.defaults,
      errors: common.errors,
      settings: common.settings,
      sidebar: common.sidebar,
      daybook: common.daybook,
      rpg: common.rpg,
    },
  },
  'en-slang': {
    translation: {
      welcome: {
        eyebrow: 'Level up a little, every day',
        title: 'Your low-key growth zone.',
        subtitle:
          'Yo, welcome back. Let’s make today feel more like your vibe.',
        private: 'Just for you, fr',
      },
      navigation: {
        main: 'Main nav',
        space: 'My zone',
        dashboard: 'My dashboard',
        habits: 'Daily habits',
        journal: 'Reflection journal',
        intentions: 'My goals',
      },
      actions: {
        lightMode: 'Light mode',
        darkMode: 'Dark mode',
        exportData: 'Grab my data',
        language: 'Language',
      },
      dashboard: {
        stats: 'Your Stats',
        quests: 'Daily Quests',
        settings: 'Settings',
        startJournaling: 'Start Journaling',
      },
      ui: common.ui,
      forms: common.forms,
      journal: common.journal,
      prompts: common.prompts,
      defaults: common.defaults,
      errors: common.errors,
      settings: common.settings,
      sidebar: common.sidebar,
      daybook: common.daybook,
      rpg: common.rpg,
    },
  },
} as const

export const LANGUAGE_STORAGE_KEY = 'bloom-language'
const supportedLanguages = Object.keys(resources)
const storedLanguage =
  typeof window === 'undefined'
    ? null
    : window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
const initialLanguage =
  storedLanguage && supportedLanguages.includes(storedLanguage)
    ? storedLanguage
    : 'en'

void i18n.use(initReactI18next).init({
  resources,
  fallbackLng: 'en',
  lng: initialLanguage,
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
})

i18n.on('languageChanged', (language) => {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Storage can be unavailable; the language still applies for this visit.
  }
})

export default i18n
