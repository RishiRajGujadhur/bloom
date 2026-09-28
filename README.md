# Bloom — Mindfulness Dashboard

A personal React 19 health-coaching dashboard with a Habitica-inspired purple palette. No account or external AI service is required. Coaching uses a four-step reflection script.


## Screenshots

| Bloom Light | Matrix |
|---|---|
| ![Home, Bloom Light theme](docs/screenshots/home-light.png) | ![Home, Matrix theme](docs/screenshots/home-matrix.png) |
| ![English course, Bloom Light theme](docs/screenshots/english-light.png) | ![English course, Matrix theme](docs/screenshots/english-matrix.png) |
| ![Money, Bloom Light theme](docs/screenshots/money-light.png) | ![Money, Matrix theme](docs/screenshots/money-matrix.png) |
| ![Little Joys, Bloom Light theme](docs/screenshots/little-joys-light.png) | ![Little Joys, Matrix theme](docs/screenshots/little-joys-matrix.png) |
| ![Tai Chi, Bloom Light theme](docs/screenshots/tai-chi-light.png) | ![Tai Chi, Matrix theme](docs/screenshots/tai-chi-matrix.png) |
| ![Talk to Bloom — chat with typed commands, Bloom Light theme](docs/screenshots/chat-light.png) | ![Talk to Bloom — chat with typed commands, Matrix theme](docs/screenshots/chat-matrix.png) |
| ![Brain games, Bloom Light theme](docs/screenshots/games-light.png) | ![Brain games, Matrix theme](docs/screenshots/games-matrix.png) |
| ![English lesson, Bloom Light theme](docs/screenshots/english-lesson-light.png) | ![English lesson, Matrix theme](docs/screenshots/english-lesson-matrix.png) |
| ![English story mode, Bloom Light theme](docs/screenshots/english-story-light.png) | ![English story mode, Matrix theme](docs/screenshots/english-story-matrix.png) |
| ![English league, shop and badges, Bloom Light theme](docs/screenshots/english-league-light.png) | ![English league, shop and badges, Matrix theme](docs/screenshots/english-league-matrix.png) |

To regenerate them, start the dev server (`npm run dev`) and run `node scripts/screenshots.mjs`. It uses Playwright with your installed Chrome.

## Highlights

- **Bloom, your companion:** nine switchable avatars (Bloom, Robot, Mood orb, Sparky, Beacon, Tinker, Pixel Bloom, Globe and more), animated with GSAP and SVG. Bloom acts out each page (lifting a dumbbell on Exercise, burning a note on Let it go…). In the chat you can type commands: log expenses, add to-dos, check off habits, log mood and gratitude, and get quiz hints.
- **Bloom English:** a Duolingo-style course with a lesson path, XP, streaks, hearts, leagues, quests, stories, speaking and pronunciation, a writing coach, themed weather scenes for every unit, and **Story mode**: a tournament side quest with a Remotion intro video.
- **Money:** spending in any currency, with budgets, charts (circle packing, candlesticks, calendar heatmap, glowing radar), a plan tab and CSV import.
- **Little Joys:** hydration, sky (moon phase and the sun's arc), a kindness deck, mood colours and a QR postcard.
- **Themes:** Bloom Light and Dark, **Matrix** (phosphor green, CRT scanlines, glyph rain), five **Glow** gradient themes, and more. Cards light up under the pointer.
- **Quality:** installable, works offline, per-page error recovery, DOMPurify sanitising, an accessibility audit, a Clear my data option and 300+ tests. See [docs/QUALITY.md](docs/QUALITY.md).

## Start

Double-click **Start Bloom.cmd**, or run:

```powershell
cd path\to\bloom
node launch.mjs
```

Open **http://127.0.0.1:5173/**. The launcher runs the built app in the background and opens your browser. Starting it again reuses the running app. No GitHub setup is required. Use that exact address: browser storage belongs to an origin, so `localhost` and `127.0.0.1` have separate data. The server listens only on this computer. To run in a visible terminal instead, use `node server.mjs` and press Ctrl+C to stop it. The background app stops when Windows restarts; double-click the launcher to start it again.

## Features

- Daily habits with animated SVG checkmarks, per-day completion and seven-day history.
- Guided journal: check-in, win, challenge and tomorrow’s micro-action.
- Separate typed flow, transcript and metadata; mood/energy, suggested replies, Formik validation, typing feedback and scrollable conversation.
- Draft recovery after refresh, including an interrupted prompt delay. Completed sessions save once, with tags and a review card.
- Add, edit and complete daily intentions; customize your affirmation.
- To-dos with nested projects, reorderable parallel or sequential actions, inherited deferred dates, and saved perspectives for context, energy, time of day, and availability.
- Full calendar with day/week/month/agenda views, drag-to-schedule tasks, movable and resizable time blocks, deep-work totals, and daily capacity. Enable or disable it in Settings without deleting schedules.
- Reflection history and JSON backup export.
- Responsive layout, labeled controls, native focus-trapping dialogs and reduced-motion support.

## Data and recovery

Data is stored in this browser’s localStorage under `mindfulness-dashboard-v1`. It is not sent to a server or synced across browsers or devices. Clearing site data or using a private window can lose it. Use **Export my data** regularly. Export contains your records; there is currently no in-app import feature. Prior-day intentions remain in exports, while the dashboard shows today's intentions.

Malformed data is preserved: saving is disabled and you can export the original before choosing a fresh start. Storage failures display an alert and leave current edits in memory for export. Use one active editing tab; simultaneous edits in multiple tabs are not merged.

Fonts are bundled locally. The companion makes no model requests until you choose **Download & enable local AI**. Extensions such as Dark Reader may recolor the UI.

## Bloom companion

Use **Plan with Bloom** on the home screen or **Talk to Bloom** from any page. The lightweight planner works without a model download. Ask for a session such as “I have 40 minutes and I’m tired”, adjust time and energy, then review and add the selected tasks to today's intentions. It respects task dependencies, deferral, estimates, and existing future calendar bookings. It does not move deadlines or book calendar time. Acceptance is idempotent and refuses changed or outdated proposals. Intentions use the existing save and export system.

The optional open-source [WebLLM](https://webllm.mlc.ai/docs/) integration runs Qwen2.5 0.5B Instruct (4-bit) in a dedicated browser worker. It needs compatible WebGPU hardware and downloads several hundred MB from Hugging Face and WebLLM's model host on first use. Cached files may be reused by the browser. No API key or inference server is required. Enable it per app session; cancellation and **Turn off & free memory** terminate the worker. A failed or slow model falls back to the lightweight planner. Small-model understanding is experimental, and performance varies by device.

Conversation text and a small summary of activity totals are processed locally. Journal bodies are not included. The conversation is kept in memory until refresh and is not part of the backup. Model output is validated against a limited intent schema; the model cannot write app data, award rewards, or call arbitrary tools. Every proposed change requires the user's Apply action.

The home screen's weekly memory summarizes seven local calendar days of recorded habit check-ins, completed journal sessions, and focus minutes. It is a rolling view of existing records, not a newly stored journal entry or a mental-health assessment.

Projects, perspectives, task estimates, and time blocks use the same local backup as other records. The calendar uses the browser's local timezone. Daily capacity counts occupied time within the availability hours you set; standalone events reserve time alongside tasks. Overlapping blocks are rejected. Sequential projects unlock actions after preceding sibling tasks or subprojects are completed; empty subprojects do not block progress. Project deletion keeps its actions under the parent project (or Inbox). Deferral is separate from a due date. Calendar integration is local to Bloom; there is no Google or Outlook synchronization.

## Development

Node 24.18.0 and npm 11.17.0 were already installed. Libraries include React/React DOM 19, TypeScript 6, Formik 2 and Framer Motion 13. The lockfile records exact installed versions.

```powershell
npm.cmd ci
npm.cmd run dev
npm.cmd test
npx.cmd playwright install chromium
npm.cmd run test:e2e
npm.cmd run lint
npm.cmd run build
npm.cmd run preview
```

VS Code ESLint (`dbaeumer.vscode-eslint`) and Prettier (`esbenp.prettier-vscode`) are installed. Workspace settings enable formatting and ESLint fixes on save. `npm run format` formats source/tests/configuration.

- `src/model.ts`: types, schema validation, prompt transitions, day-based habits.
- `src/useCoach.ts`: guarded persistence.
- `src/components/journal/`: journal presentation and flow container.
- `src/App.tsx` and styles: dashboard and forms.
- `tests/`: Jest progression, persistence, recovery and rendered-flow tests.
- `e2e/`: isolated Playwright desktop/mobile planning tests, including task dragging and reload persistence. The test server uses port 5175.
- `src/features/planning.ts`: project hierarchy, action availability, perspectives, and scheduling validation. The calendar uses FullCalendar's MIT-licensed standard React, time-grid, day-grid, list, and interaction plugins.

This repository contains the complete Bloom dashboard application and its tests.

## Open-source libraries

Bloom is built on these open-source packages (runtime dependencies from `package.json`). The table is generated from the imports in `src/`, and "Where it is used" names the feature folder or area that imports each package.

| Library | Where it is used |
|---|---|
| [`@chatscope/chat-ui-kit-react`](https://www.npmjs.com/package/@chatscope/chat-ui-kit-react) | companion |
| [`@chatscope/chat-ui-kit-styles`](https://www.npmjs.com/package/@chatscope/chat-ui-kit-styles) | companion |
| [`@dnd-kit/core`](https://www.npmjs.com/package/@dnd-kit/core) | english, yoga |
| [`@dnd-kit/sortable`](https://www.npmjs.com/package/@dnd-kit/sortable) | english, yoga |
| [`@dnd-kit/utilities`](https://www.npmjs.com/package/@dnd-kit/utilities) | english, yoga |
| [`@fontsource/caveat`](https://www.npmjs.com/package/@fontsource/caveat) | global styles |
| [`@fontsource/dm-sans`](https://www.npmjs.com/package/@fontsource/dm-sans) | global styles |
| [`@fontsource/fira-code`](https://www.npmjs.com/package/@fontsource/fira-code) | global styles |
| [`@fontsource/manrope`](https://www.npmjs.com/package/@fontsource/manrope) | global styles |
| [`@fontsource/press-start-2p`](https://www.npmjs.com/package/@fontsource/press-start-2p) | global styles |
| [`@fontsource/vt323`](https://www.npmjs.com/package/@fontsource/vt323) | global styles |
| [`@formkit/auto-animate`](https://www.npmjs.com/package/@formkit/auto-animate) | quick |
| [`@fullcalendar/daygrid`](https://www.npmjs.com/package/@fullcalendar/daygrid) | CalendarPage.tsx |
| [`@fullcalendar/interaction`](https://www.npmjs.com/package/@fullcalendar/interaction) | CalendarPage.tsx |
| [`@fullcalendar/list`](https://www.npmjs.com/package/@fullcalendar/list) | CalendarPage.tsx |
| [`@fullcalendar/react`](https://www.npmjs.com/package/@fullcalendar/react) | CalendarPage.tsx |
| [`@fullcalendar/timegrid`](https://www.npmjs.com/package/@fullcalendar/timegrid) | CalendarPage.tsx |
| [`@hello-pangea/dnd`](https://www.npmjs.com/package/@hello-pangea/dnd) | diet |
| [`@lottiefiles/react-lottie-player`](https://www.npmjs.com/package/@lottiefiles/react-lottie-player) | daybook, rpg |
| [`@mediapipe/tasks-vision`](https://www.npmjs.com/package/@mediapipe/tasks-vision) | posture, taichi |
| [`@mlc-ai/web-llm`](https://www.npmjs.com/package/@mlc-ai/web-llm) | companion |
| [`@nivo/calendar`](https://www.npmjs.com/package/@nivo/calendar) | money |
| [`@nivo/radar`](https://www.npmjs.com/package/@nivo/radar) | diet |
| [`@nivo/sankey`](https://www.npmjs.com/package/@nivo/sankey) | energy |
| [`@radix-ui/react-context-menu`](https://www.npmjs.com/package/@radix-ui/react-context-menu) | ui |
| [`@radix-ui/react-dropdown-menu`](https://www.npmjs.com/package/@radix-ui/react-dropdown-menu) | ui |
| [`@radix-ui/react-hover-card`](https://www.npmjs.com/package/@radix-ui/react-hover-card) | rewards |
| [`@radix-ui/react-popover`](https://www.npmjs.com/package/@radix-ui/react-popover) | reminders |
| [`@radix-ui/react-select`](https://www.npmjs.com/package/@radix-ui/react-select) | ui |
| [`@react-pdf/renderer`](https://www.npmjs.com/package/@react-pdf/renderer) | lab, yearbook |
| [`@react-spring/web`](https://www.npmjs.com/package/@react-spring/web) | release |
| [`@react-three/drei`](https://www.npmjs.com/package/@react-three/drei) | rpg, wellbeing, world |
| [`@react-three/fiber`](https://www.npmjs.com/package/@react-three/fiber) | games, journey, palace, rpg, taichi, wellbeing, world |
| [`@remotion/player`](https://www.npmjs.com/package/@remotion/player) | english |
| [`@tiptap/extension-highlight`](https://www.npmjs.com/package/@tiptap/extension-highlight) | daybook |
| [`@tiptap/extension-placeholder`](https://www.npmjs.com/package/@tiptap/extension-placeholder) | daybook |
| [`@tiptap/extension-task-item`](https://www.npmjs.com/package/@tiptap/extension-task-item) | daybook |
| [`@tiptap/extension-task-list`](https://www.npmjs.com/package/@tiptap/extension-task-list) | daybook |
| [`@tiptap/react`](https://www.npmjs.com/package/@tiptap/react) | daybook |
| [`@tiptap/starter-kit`](https://www.npmjs.com/package/@tiptap/starter-kit) | daybook |
| [`@tsparticles/react`](https://www.npmjs.com/package/@tsparticles/react) | meditate |
| [`@tsparticles/slim`](https://www.npmjs.com/package/@tsparticles/slim) | meditate |
| [`@turf/turf`](https://www.npmjs.com/package/@turf/turf) | run |
| [`@use-gesture/react`](https://www.npmjs.com/package/@use-gesture/react) | release, ui |
| [`@xenova/transformers`](https://www.npmjs.com/package/@xenova/transformers) | search, voice |
| [`@xyflow/react`](https://www.npmjs.com/package/@xyflow/react) | VisionBoard |
| [`@zxing/browser`](https://www.npmjs.com/package/@zxing/browser) | scan |
| [`an-array-of-english-words`](https://www.npmjs.com/package/an-array-of-english-words) | english |
| [`animejs`](https://www.npmjs.com/package/animejs) | exercise |
| [`automated-readability`](https://www.npmjs.com/package/automated-readability) | english |
| [`canvas-confetti`](https://www.npmjs.com/package/canvas-confetti) | core, juice, ui |
| [`chart.js`](https://www.npmjs.com/package/chart.js) | english, ui, workout |
| [`chroma-js`](https://www.npmjs.com/package/chroma-js) | rpg |
| [`chrono-node`](https://www.npmjs.com/package/chrono-node) | quick |
| [`cmdk`](https://www.npmjs.com/package/cmdk) | layout |
| [`cmu-pronouncing-dictionary`](https://www.npmjs.com/package/cmu-pronouncing-dictionary) | english |
| [`compromise`](https://www.npmjs.com/package/compromise) | companion, daybook, english |
| [`compromise-speech`](https://www.npmjs.com/package/compromise-speech) | english |
| [`currency.js`](https://www.npmjs.com/package/currency.js) | money |
| [`cursor-effects`](https://www.npmjs.com/package/cursor-effects) | ui |
| [`d3-hierarchy`](https://www.npmjs.com/package/d3-hierarchy) | money |
| [`d3-shape`](https://www.npmjs.com/package/d3-shape) | flow |
| [`date-fns`](https://www.npmjs.com/package/date-fns) | quick, timeSince |
| [`dexie`](https://www.npmjs.com/package/dexie) | search |
| [`diff`](https://www.npmjs.com/package/diff) | daybook |
| [`dompurify`](https://www.npmjs.com/package/dompurify) | cards |
| [`double-metaphone`](https://www.npmjs.com/package/double-metaphone) | english |
| [`driver.js`](https://www.npmjs.com/package/driver.js) | layout, rpg |
| [`easytimer.js`](https://www.npmjs.com/package/easytimer.js) | interval |
| [`embla-carousel-react`](https://www.npmjs.com/package/embla-carousel-react) | ui |
| [`fastest-levenshtein`](https://www.npmjs.com/package/fastest-levenshtein) | english |
| [`fireworks-js`](https://www.npmjs.com/package/fireworks-js) | games |
| [`flesch`](https://www.npmjs.com/package/flesch) | english |
| [`formik`](https://www.npmjs.com/package/formik) | app shell, journal |
| [`framer-motion`](https://www.npmjs.com/package/framer-motion) | achievements, app shell, collectibles, daybook, journal, posture, reminders, rewards, rpg, sleep, urgeClock.tsx, wellbeing, world |
| [`franc-min`](https://www.npmjs.com/package/franc-min) | english |
| [`frappe-gantt`](https://www.npmjs.com/package/frappe-gantt) | roadmap |
| [`fuse.js`](https://www.npmjs.com/package/fuse.js) | companion, english, exercise |
| [`gsap`](https://www.npmjs.com/package/gsap) | VisionBoard, app shell, body, cards, companion, core, dailyFlow, daybook, daylight, diet, dojo, english, epiphany, exercise, fasting, games, interval, journey, joys, juice, lab, meditate, mindmap, mirror, mixer, money, monk, palace, quick, release, routines, rpg, scan, showcase, sleep, sounds, street, studio, ui, welcome, wellbeing, workout, world, yoga |
| [`howler`](https://www.npmjs.com/package/howler) | AudioMixerContext |
| [`i18next`](https://www.npmjs.com/package/i18next) | translations |
| [`ics`](https://www.npmjs.com/package/ics) | daybook |
| [`jszip`](https://www.npmjs.com/package/jszip) | lab |
| [`leaflet`](https://www.npmjs.com/package/leaflet) | places, run |
| [`lightweight-charts`](https://www.npmjs.com/package/lightweight-charts) | money |
| [`lottie-web`](https://www.npmjs.com/package/lottie-web) | ui |
| [`lucide-react`](https://www.npmjs.com/package/lucide-react) | AdoptLibrary.tsx, AudioMixer.tsx, BloomExperience.tsx, CalendarPage.tsx, FocusPage.tsx, HabitsPage.tsx, LanguageSelector.tsx, Modal.tsx, PlanningTools.tsx, ProductivityPages.tsx, SettingsPage, UrgePage.tsx, achievements, affirm, app shell, body, breathwork, cards, collectibles, companion, core, dailyFlow, dashboard, daybook, daylight, diet, dojo, energy, english, epiphany, exercise, explore, eyes, fasting, focusRoom, games, icons, ink, interval, journal, joys, lab, layout, mala, meditate, mindmap, mirror, mixer, money, monk, palace, places, pointer, posture, release, reminders, rewards, roadmap, routines, rpg, run, scan, screen, settings, showcase, sleep, sounds, street, stretch, studio, taichi, timeCapsule.tsx, timeSince, ui, urgeClock.tsx, voice, welcome, wellbeing, workout, yearbook, yoga |
| [`lunarphase-js`](https://www.npmjs.com/package/lunarphase-js) | joys |
| [`marked`](https://www.npmjs.com/package/marked) | cards |
| [`markmap-lib`](https://www.npmjs.com/package/markmap-lib) | mindmap |
| [`markmap-view`](https://www.npmjs.com/package/markmap-view) | mindmap |
| [`mathjs`](https://www.npmjs.com/package/mathjs) | diet |
| [`matter-js`](https://www.npmjs.com/package/matter-js) | impact, showcase |
| [`meyda`](https://www.npmjs.com/package/meyda) | taichi |
| [`minisearch`](https://www.npmjs.com/package/minisearch) | search |
| [`mouse-follower`](https://www.npmjs.com/package/mouse-follower) | ui |
| [`nosleep.js`](https://www.npmjs.com/package/nosleep.js) | breathwork |
| [`number-to-words`](https://www.npmjs.com/package/number-to-words) | english |
| [`page-flip`](https://www.npmjs.com/package/page-flip) | daybook |
| [`papaparse`](https://www.npmjs.com/package/papaparse) | money |
| [`perfect-freehand`](https://www.npmjs.com/package/perfect-freehand) | ink |
| [`pixelarticons`](https://www.npmjs.com/package/pixelarticons) | icons |
| [`pixi.js`](https://www.npmjs.com/package/pixi.js) | games |
| [`pluralize`](https://www.npmjs.com/package/pluralize) | english |
| [`qrcode`](https://www.npmjs.com/package/qrcode) | joys |
| [`react`](https://www.npmjs.com/package/react) | AdoptLibrary.tsx, AudioMixer.tsx, AudioMixerContext, BloomExperience.tsx, CalendarPage.tsx, FocusPage.tsx, HabitsPage.tsx, Modal.tsx, PersonalInsights.tsx, PlanningTools.tsx, ProductivityPages.tsx, SettingsPage, UrgePage.tsx, VisionBoard, achievements, affirm, app shell, app start-up, body, breathwork, cards, collectibles, companion, core, dailyFlow, dashboard, daybook, daylight, diet, dojo, energy, english, epiphany, exercise, explore, eyes, fasting, flow, focusRoom, games, icons, impact, ink, interval, journal, journey, joys, juice, lab, layout, mala, meditate, mindmap, mirror, mixer, money, monk, palace, places, pointer, posture, quick, release, reminders, rewards, roadmap, routines, rpg, run, scan, screen, search, settings, shared, showcase, sleep, sounds, street, stretch, studio, taichi, timeCapsule.tsx, timeSince, tsparticles react.d, ui, urgeClock.tsx, useCoach, voice, welcome, wellbeing, workout, world, yearbook, yoga |
| [`react-calendar-heatmap`](https://www.npmjs.com/package/react-calendar-heatmap) | fasting |
| [`react-chartjs-2`](https://www.npmjs.com/package/react-chartjs-2) | english, workout |
| [`react-compare-slider`](https://www.npmjs.com/package/react-compare-slider) | body |
| [`react-countdown-circle-timer`](https://www.npmjs.com/package/react-countdown-circle-timer) | stretch |
| [`react-dom`](https://www.npmjs.com/package/react-dom) | BloomExperience.tsx, app start-up, daybook, monk, showcase, welcome |
| [`react-flip-numbers`](https://www.npmjs.com/package/react-flip-numbers) | quick, timeSince |
| [`react-i18next`](https://www.npmjs.com/package/react-i18next) | DashboardWelcome.tsx, LanguageSelector.tsx, Modal.tsx, SettingsPage, app shell, daybook, journal, layout, rpg, settings, translations, useCoach |
| [`react-idle-timer`](https://www.npmjs.com/package/react-idle-timer) | screen |
| [`react-leaflet`](https://www.npmjs.com/package/react-leaflet) | places |
| [`react-querybuilder`](https://www.npmjs.com/package/react-querybuilder) | explore |
| [`reading-time`](https://www.npmjs.com/package/reading-time) | daybook, reading time.d |
| [`remotion`](https://www.npmjs.com/package/remotion) | english |
| [`rough-notation`](https://www.npmjs.com/package/rough-notation) | dojo |
| [`roughjs`](https://www.npmjs.com/package/roughjs) | daybook, exercise, eyes |
| [`rrule`](https://www.npmjs.com/package/rrule) | routines |
| [`seedrandom`](https://www.npmjs.com/package/seedrandom) | english, joys |
| [`sentiment`](https://www.npmjs.com/package/sentiment) | companion, english, mirror, quick |
| [`simple-statistics`](https://www.npmjs.com/package/simple-statistics) | lab |
| [`simplex-noise`](https://www.npmjs.com/package/simplex-noise) | mixer, quick |
| [`stopword`](https://www.npmjs.com/package/stopword) | english |
| [`suncalc`](https://www.npmjs.com/package/suncalc) | daylight, joys, quick |
| [`supermemo`](https://www.npmjs.com/package/supermemo) | cards, epiphany |
| [`swiper`](https://www.npmjs.com/package/swiper) | affirm, showcase |
| [`syllable`](https://www.npmjs.com/package/syllable) | english |
| [`tailwindcss`](https://www.npmjs.com/package/tailwindcss) | global styles |
| [`three`](https://www.npmjs.com/package/three) | games, journey, palace, rpg, taichi, wellbeing, world |
| [`tinycolor2`](https://www.npmjs.com/package/tinycolor2) | joys |
| [`tone`](https://www.npmjs.com/package/tone) | taichi |
| [`ts-fsrs`](https://www.npmjs.com/package/ts-fsrs) | english |
| [`tunajs`](https://www.npmjs.com/package/tunajs) | sounds |
| [`typed.js`](https://www.npmjs.com/package/typed.js) | quick |
| [`vivus`](https://www.npmjs.com/package/vivus) | achievements |
| [`wavesurfer.js`](https://www.npmjs.com/package/wavesurfer.js) | voice |
| [`wink-lemmatizer`](https://www.npmjs.com/package/wink-lemmatizer) | english |
| [`write-good`](https://www.npmjs.com/package/write-good) | english |
| [`zdog`](https://www.npmjs.com/package/zdog) | mala |
| [`zod`](https://www.npmjs.com/package/zod) | collectibles, companion, model, rpg |

Supporting packages (types, build plugins and peer packages of the above): `@fullcalendar/core`, `@gsap/react`, `@radix-ui/react-tooltip`, `@tailwindcss/vite`, `@tiptap/extensions`, `@types/chroma-js`, `@types/react-calendar-heatmap`, `@zxing/library`, `decimal.js`, `fast-diff`, `mustache`, `react-joyride`.

Dev tooling includes Vite, vite-plugin-pwa (Workbox), TypeScript, ESLint, Jest with Testing Library, Playwright (screenshots) and axe-core (accessibility audit).

Remotion is used under the [Remotion licence](https://www.remotion.dev/license), which is free for individuals and small teams.

