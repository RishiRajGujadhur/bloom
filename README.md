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
| ![Code Cup intro video](docs/screenshots/codecup-intro.png) | ![Code Cup duel against UNIT-7](docs/screenshots/codecup-duel.png) |
| ![Code Cup versus screen](docs/screenshots/codecup-versus.png) | ![Code Cup finale video](docs/screenshots/codecup-finale.png) |
| ![Learn to code, Bloom Light theme](docs/screenshots/code-light.png) | ![Learn to code, Matrix theme](docs/screenshots/code-matrix.png) |
| ![Code quiz, Bloom Light theme](docs/screenshots/code-quiz-light.png) | ![Code quiz, Matrix theme](docs/screenshots/code-quiz-matrix.png) |
| ![English speak lab, Bloom Light theme](docs/screenshots/english-speak-light.png) | ![English speak lab, Matrix theme](docs/screenshots/english-speak-matrix.png) |
| ![English writing coach, Bloom Light theme](docs/screenshots/english-write-light.png) | ![English writing coach, Matrix theme](docs/screenshots/english-write-matrix.png) |
| ![Money charts, Bloom Light theme](docs/screenshots/money-charts-light.png) | ![Money charts, Matrix theme](docs/screenshots/money-charts-matrix.png) |
| ![Little Joys — sky, Bloom Light theme](docs/screenshots/little-joys-sky-light.png) | ![Little Joys — sky, Matrix theme](docs/screenshots/little-joys-sky-matrix.png) |
| ![Little Joys — postcard, Bloom Light theme](docs/screenshots/little-joys-postcard-light.png) | ![Little Joys — postcard, Matrix theme](docs/screenshots/little-joys-postcard-matrix.png) |
| ![To-dos, Bloom Light theme](docs/screenshots/todos-light.png) | ![To-dos, Matrix theme](docs/screenshots/todos-matrix.png) |
| ![Calendar, Bloom Light theme](docs/screenshots/calendar-light.png) | ![Calendar, Matrix theme](docs/screenshots/calendar-matrix.png) |
| ![Focus, Bloom Light theme](docs/screenshots/focus-light.png) | ![Focus, Matrix theme](docs/screenshots/focus-matrix.png) |
| ![Daybook, Bloom Light theme](docs/screenshots/daybook-light.png) | ![Daybook, Matrix theme](docs/screenshots/daybook-matrix.png) |
| ![Meditate, Bloom Light theme](docs/screenshots/meditate-light.png) | ![Meditate, Matrix theme](docs/screenshots/meditate-matrix.png) |
| ![Sleep, Bloom Light theme](docs/screenshots/sleep-light.png) | ![Sleep, Matrix theme](docs/screenshots/sleep-matrix.png) |
| ![Let it go, Bloom Light theme](docs/screenshots/let-it-go-light.png) | ![Let it go, Matrix theme](docs/screenshots/let-it-go-matrix.png) |
| ![Workouts, Bloom Light theme](docs/screenshots/workouts-light.png) | ![Workouts, Matrix theme](docs/screenshots/workouts-matrix.png) |
| ![Yoga, Bloom Light theme](docs/screenshots/yoga-light.png) | ![Yoga, Matrix theme](docs/screenshots/yoga-matrix.png) |
| ![Dojo, Bloom Light theme](docs/screenshots/dojo-light.png) | ![Dojo, Matrix theme](docs/screenshots/dojo-matrix.png) |
| ![Bloom World (3D), Bloom Light theme](docs/screenshots/bloom-world-light.png) | ![Bloom World (3D), Matrix theme](docs/screenshots/bloom-world-matrix.png) |
| ![Settings — avatar picker, Bloom Light theme](docs/screenshots/settings-avatars-light.png) | ![Settings — avatar picker, Matrix theme](docs/screenshots/settings-avatars-matrix.png) |

### Advanced features

Built on Web Bluetooth, WebGPU, WebAssembly SIMD, multi-core workers, the Origin Private File System and File System Access (see [docs/WOW_ADVANCED_PLAN.md](docs/WOW_ADVANCED_PLAN.md)).

| Feature | Bloom Light | Matrix |
|---|---|---|
| **Sound Lab**: one-tap noise removal for voice memos (RNNoise and a SIMD spectral gate, all cores, WebGPU spectrogram) | ![Sound Lab](docs/screenshots/wow-13-soundlab.png) | ![Sound Lab, Matrix](docs/screenshots/wow-13-soundlab-matrix.png) |
| **Terrain Replay**: fly a drone along a GPX route over its own elevation, in sync with the map | ![Terrain Replay](docs/screenshots/wow-14-terrain.png) | ![Terrain Replay, Matrix](docs/screenshots/wow-14-terrain-matrix.png) |
| **Morning Readiness Scan**: 60-second HRV from a Bluetooth strap, the fingertip camera or a simulator | ![Readiness](docs/screenshots/wow-15-readiness.png) | ![Readiness, Matrix](docs/screenshots/wow-15-readiness-matrix.png) |
| **Receipt Lens**: on-device OCR on every core turns receipts into Money transactions | ![Receipt Lens](docs/screenshots/wow-16-receipts.png) | ![Receipt Lens, Matrix](docs/screenshots/wow-16-receipts-matrix.png) |
| **Bills Inbox**: photograph a letter; OpenCV flattens it, OCR reads it, deadlines get countdowns, and you can ask your paperwork questions | ![Bills Inbox](docs/screenshots/wow-17-bills.png) | ![Bills Inbox, Matrix](docs/screenshots/wow-17-bills-matrix.png) |
| **Morning Briefing Radio**: a spoken summary of your day (calendar, tasks, readiness, bills, weather) in an on-device neural voice on WebGPU, with a live spectrum dial | ![Morning Briefing Radio](docs/screenshots/wow-18-briefing-hd.png) | ![Morning Briefing Radio, Matrix](docs/screenshots/wow-18-briefing-matrix.png) |
| **Study Duel**: race a friend through the same English round peer to peer (Yjs CRDT over encrypted WebRTC), with racing score orbs and a shared whiteboard | ![Study Duel](docs/screenshots/wow-19-duel.png) | ![Study Duel, Matrix](docs/screenshots/wow-19-duel-matrix.png) |
| **Form Coach**: camera rep counting with GPU pose tracking, live form faults (depth, chest, hips) and hands-free set logging in Workout | ![Form Coach](docs/screenshots/wow-20-formcoach.png) | ![Form Coach, Matrix](docs/screenshots/wow-20-formcoach-matrix.png) |
| **Code City & Burnout Radar**: your local git repo walked on every core (isomorphic-git over File System Access) becomes a WebGPU 3D city; a radar blends commit rhythm with sleep, mood and readiness | ![Code City & Burnout Radar](docs/screenshots/wow-21-codecity.png) | ![Code City & Burnout Radar, Matrix](docs/screenshots/wow-21-codecity-matrix.png) |
| **Render thread (A2)**: 3D scenes render inside a worker on an OffscreenCanvas (three.js WebGPU), so page work never stutters them; first used by the Sound Lab mountain | ![Render thread (A2)](docs/screenshots/a2-offscreen-soundlab.png) | ![Render thread (A2), Matrix](docs/screenshots/a2-offscreen-soundlab-matrix.png) |
| **Render thread everywhere (A3)**: Code City, Terrain Replay and the Matrix rain also render in workers; orbit and hover work through forwarded pointer events | ![Render thread everywhere (A3)](docs/screenshots/a3-codecity.png) | ![Render thread everywhere (A3), Matrix](docs/screenshots/a3-codecity-matrix.png) |
| **Life Map (M2, M3, M4, M7)**: Places becomes a layered map: mood geography on H3 hexagons, spending by shop with receipts, memory pins with “On this spot…”, and habits tied to places that offer a check-in when you arrive | ![Life Map (M2, M3, M4, M7)](docs/screenshots/m2-life-map.png) | ![Life Map (M2, M3, M4, M7), Matrix](docs/screenshots/m2-life-map-matrix.png) |
| **People on the globe (M5)**: friends placed on the Globe quiz globe with a live day/night terminator, their local time, a good-time-to-call glow and birthday rings | ![People on the globe (M5)](docs/screenshots/m5-people-globe.png) | ![People on the globe (M5), Matrix](docs/screenshots/m5-people-globe-matrix.png) |
| **Soundscape engine (C5)**: the Mixer's noise is generated live on the audio thread by a hand-written WebAssembly SIMD kernel (4 voices per instruction), plus binaural beats and a render-thread aurora that calms down under CPU pressure | ![Soundscape engine (C5)](docs/screenshots/c5-mixer.png) | ![Soundscape engine (C5), Matrix](docs/screenshots/c5-mixer-matrix.png) |
| **Vision board files (C7)**: save, open and share boards as .bloomboard files (a zip with images, via File System Access and the OS file handler); Ctrl+S saves; every replaced board is backed up in OPFS | ![Vision board files (C7)](docs/screenshots/c7-vision-board.png) | ![Vision board files (C7), Matrix](docs/screenshots/c7-vision-board-matrix.png) |
| **Your desktop fonts (P1)**: Settings lists the fonts installed on your computer (Local Font Access), each previewed in its own face and searchable; pick one and it becomes Bloom's font, even over a theme's own face | ![Your desktop fonts (P1)](docs/screenshots/p1-local-fonts.png) | ![Your desktop fonts (P1), Matrix](docs/screenshots/p1-local-fonts-matrix.png) |
| **Away detection & screen on (P2, P3)**: Focus pauses when you step away (Idle Detection: OS idle and screen lock, page-activity fallback) and resumes where you left off; guided sessions hold a Screen Wake Lock | ![Away detection & screen on (P2, P3)](docs/screenshots/p2-focus-away.png) | ![Away detection & screen on (P2, P3), Matrix](docs/screenshots/p2-focus-back-matrix.png) |
| **Themed title bar (P4)**: installed on desktop, Bloom draws its own title bar (Window Controls Overlay): page name, search and streak beside the window buttons, draggable, in every theme; the window frame colour follows the theme (preview) | ![Themed title bar (P4)](docs/screenshots/p4-titlebar.png) | ![Themed title bar (P4), Matrix](docs/screenshots/p4-titlebar-matrix.png) |
| **Houdini page scenes (P5)**: every page header paints its own animated generative scene with a CSS Houdini paint worklet — 12 styles (rays, leaves, notes, rain, waves, stars, pulse, topo, hex, grid, petals, bubbles) seeded by the page, with a seeded SVG fallback | ![Houdini page scenes (P5)](docs/screenshots/p5-houdini-headers.png) | ![Houdini page scenes (P5), Matrix](docs/screenshots/p5-houdini-headers-matrix.png) |
| **Morphing navigation (P6)**: moving between pages uses the View Transitions API: the page cross-fades with a soft blur, the title glides into place and the sidebar highlight slides between items (mid-transition capture) | ![Morphing navigation (P6)](docs/screenshots/p6-view-transition.png) | ![Morphing navigation (P6), Matrix](docs/screenshots/p6-view-transition-matrix.png) |
| **Sidebar page menu (QoL)**: right-click any page in the sidebar: open, pin to the top, or disable it with a confirm prompt and an Undo toast | ![Sidebar page menu (QoL)](docs/screenshots/qol-nav-menu.png) | ![Sidebar page menu (QoL), Matrix](docs/screenshots/qol-nav-disable-matrix.png) |
| **Keyboard layer (QoL)**: g+letter jumps to pages, ? shows every shortcut, n adds, Space plays/pauses, t flips the theme, 1–9 switch tabs, and each page remembers its last tab | ![Keyboard layer (QoL)](docs/screenshots/qol-shortcuts.png) | ![Keyboard layer (QoL), Matrix](docs/screenshots/qol-shortcuts-matrix.png) |
| **Page-specific studio scenes (QoL)**: every Studio page has its own animated motif — coins fall on Money, brackets rise on Code, pieces march on Chess, notes sway on Sounds — plus its own line | ![Page-specific studio scenes (QoL)](docs/screenshots/qol-studio-scenes.png) | ![Page-specific studio scenes (QoL), Matrix](docs/screenshots/qol-studio-scenes-matrix.png) |
| **Comfort settings & settings search (QoL)**: text size, reading line height, density, page width, scene/transition/wake-lock/away toggles with a live Saved tick; type to filter Settings | ![Comfort settings & settings search (QoL)](docs/screenshots/qol-comfort.png) | ![Comfort settings & settings search (QoL), Matrix](docs/screenshots/qol-comfort-matrix.png) |
| **Trash, undo & cross-tab sync (QoL)**: deleting a habit, to-do, calendar block or project shows an Undo toast and keeps it in a 30-day Trash (restorable in Settings); open tabs stay in sync | ![Trash, undo & cross-tab sync (QoL)](docs/screenshots/qol-trash-undo.png) | ![Trash, undo & cross-tab sync (QoL), Matrix](docs/screenshots/qol-trash-undo.png) |
| **Today at a glance (QoL)**: one row on the dashboard pulls readiness, bills due, people to reach out to, streaks at risk, tomorrow's first block, wind-down and the briefing — each one tap away | ![Today at a glance (QoL)](docs/screenshots/qol-today-glance.png) | ![Today at a glance (QoL), Matrix](docs/screenshots/qol-today-glance-matrix.png) |
| **Quick-add to-dos**: Type a to-do the way you'd say it and Bloom picks out the date, priority, repeat and tags, with a live preview. Paste a list to add many at once. Overdue items come first, and every row has one-tap Tomorrow and +1 week snooze. | ![Quick-add to-dos](qol-quick-task.png) | ![Quick-add to-dos, Matrix](qol-quick-task-matrix.png) |
| **Habit archive, notes and strength**: Filter habits by left today or done, archive the ones on pause, reorder them, jot a note per day, see a 60-day strength bar and mark yesterday done in one tap. | ![Habit archive, notes and strength](qol-habits-extras.png) | ![Habit archive, notes and strength, Matrix](qol-habits-extras-matrix.png) |
| **Arcade #1 · Pantry Tetris**: The new Games section opens the Arcade. First game: drop the shopping into a physics fridge, turn items to fit, and make sure the door shuts — bonus for keeping soon-to-expire food up front. | ![Arcade #1 · Pantry Tetris](arcade-hub.png) | ![Arcade #1 · Pantry Tetris, Matrix](arcade-pantry.png) |
| **Arcade #2 · Coin Cascade**: Drop a month of coins through a peg board into Home, Food, Fun and Later jars. Bills come due partway through, and the Later jar quietly grows every week. | ![Arcade #2 · Coin Cascade](arcade-coins.png) | ![Arcade #2 · Coin Cascade, Matrix](arcade-coins-matrix.png) |
| **Arcade #3 · Knot Garden**: Watch a firefly trace a path through the pegs, then guide a real verlet rope along it. Each path cinches into a knot and lights a lantern before dusk. | ![Arcade #3 · Knot Garden](arcade-knots.png) | ![Arcade #3 · Knot Garden, Matrix](arcade-knots-matrix.png) |
| **Arcade #4 · Burner Juggle**: Run four burners through a 90-second service. Each dish cooks only at its own heat, some need stirring, and too much flame scorches the pan. | ![Arcade #4 · Burner Juggle](arcade-burners.png) | ![Arcade #4 · Burner Juggle, Matrix](arcade-burners-matrix.png) |
| **Arcade #5 · Laundry Sorter**: Grab and fling tumbling clothes into Whites, Colours, Darks or Hand wash before the pile hits ten. Read the colour and the little care tag, and watch out for the red sock. | ![Arcade #5 · Laundry Sorter](arcade-laundry.png) | ![Arcade #5 · Laundry Sorter, Matrix](arcade-laundry-matrix.png) |
| **Arcade #6 · Compound Orchard**: A 3D floating island in Babylon.js. Plant saplings, let them grow on their own growth, and harvest before they turn gold and wither. Twenty seasons to fill the basket. | ![Arcade #6 · Compound Orchard](arcade-orchard.png) | ![Arcade #6 · Compound Orchard, Matrix](arcade-orchard-matrix.png) |
| **Arcade #7 · Scam Bubbles**: Messages float up to your phone inside soap bubbles. Pop the sketchy ones before they land and let the real ones through, while the bubbles keep getting faster. | ![Arcade #7 · Scam Bubbles](arcade-scam.png) | ![Arcade #7 · Scam Bubbles, Matrix](arcade-scam-matrix.png) |
| **Arcade #8 · Focus Lighthouse**: A Three.js night sea. Steer the lighthouse beam with your pointer and hold it on each ship until it turns for harbour, while fireworks over the town try to pull your eye away. | ![Arcade #8 · Focus Lighthouse](arcade-lighthouse.png) | ![Arcade #8 · Focus Lighthouse, Matrix](arcade-lighthouse-matrix.png) |
| **Arcade #9 · Breath Kite**: Hold to climb, let go to glide. Rings ride a slow wave of wind (about four seconds up, six seconds down), and threading them in a row builds your streak. | ![Arcade #9 · Breath Kite](arcade-kite.png) | ![Arcade #9 · Breath Kite, Matrix](arcade-kite-matrix.png) |
| **Arcade #10 · Traffic Light Crossing**: A PlayCanvas voxel street. Hop lane by lane across four lanes of traffic to run errands; cars queue at the crossing light, and waiting for the green man pays a bonus. | ![Arcade #10 · Traffic Light Crossing](arcade-crossing.png) | ![Arcade #10 · Traffic Light Crossing, Matrix](arcade-crossing-matrix.png) |
| **Arcade #11 · Sleep Tide**: Gadgets keep buzzing awake in a night-time bedroom. Tap each glowing thing off, and the moon-tide of sleep only rises while the room stays dark and quiet. | ![Arcade #11 · Sleep Tide](arcade-sleep.png) | ![Arcade #11 · Sleep Tide, Matrix](arcade-sleep-matrix.png) |
| **Arcade #12 · Recycling Rush**: Rubbish rides a speeding conveyor over five bins. Tap each item as it passes the right bin and it tumbles in with real physics; anything missed goes to landfill. | ![Arcade #12 · Recycling Rush](arcade-recycle.png) | ![Arcade #12 · Recycling Rush, Matrix](arcade-recycle-matrix.png) |
| **Arcade #13 · Listening Pond**: A generative koi pond in p5.js. The koi only rise once the water is still; tap one right as it surfaces, because a careless splash sends every fish diving. | ![Arcade #13 · Listening Pond](arcade-pond.png) | ![Arcade #13 · Listening Pond, Matrix](arcade-pond-matrix.png) |
| **Arcade #14 · Delay Dessert**: A cake keeps growing layers, each worth more than the last. Serve it now, or wait for a taller one while a cat creeps along the counter toward it. | ![Arcade #14 · Delay Dessert](arcade-dessert.png) | ![Arcade #14 · Delay Dessert, Matrix](arcade-dessert-matrix.png) |
| **Arcade #15 · Camp Fire**: Drop tinder, kindling and logs into a stone ring and strike one of three matches. Flames jump from piece to piece; build it in the right order and don't smother it. | ![Arcade #15 · Camp Fire](arcade-campfire.png) | ![Arcade #15 · Camp Fire, Matrix](arcade-campfire-matrix.png) |
| **Arcade #16 · Germ Wash**: Press and scrub to foam wiggly germs off two soapy hands before the 20-second song runs out. They hide on fingertips, thumbs, between fingers and round the wrists. | ![Arcade #16 · Germ Wash](arcade-germs.png) | ![Arcade #16 · Germ Wash, Matrix](arcade-germs-matrix.png) |
| **Arcade #17 · Star Compass**: Stand under a real northern sky in Three.js. Drag to look around and find the Pole Star; each night the sky has turned and you're somewhere new. Find it and north lights up on the horizon. | ![Arcade #17 · Star Compass](arcade-stars.png) | ![Arcade #17 · Star Compass, Matrix](arcade-stars-matrix.png) |
| **Arcade #18 · Pack the Suitcase**: Drag and turn belongings to fit one carry-on before the taxi comes. The gold-edged essentials matter most, and the big pillow probably doesn't make the cut. | ![Arcade #18 · Pack the Suitcase](arcade-suitcase.png) | ![Arcade #18 · Pack the Suitcase, Matrix](arcade-suitcase-matrix.png) |
| **Arcade #19 · Debt Dragon**: A Babylon.js dragon curls round a borrowed hoard and grows every moon. Mine the glowing crystals, then choose: feed the dragon to shrink it, or buy a better pick. | ![Arcade #19 · Debt Dragon](arcade-dragon.png) | ![Arcade #19 · Debt Dragon, Matrix](arcade-dragon-matrix.png) |
| **Arcade #20 · Pomodoro Forge**: Strike while the iron's hot. Hammering glowing metal shapes it fast, cold metal cracks, and the forge needs time to bring the bar back to a glow. | ![Arcade #20 · Pomodoro Forge](arcade-forge.png) | ![Arcade #20 · Pomodoro Forge, Matrix](arcade-forge-matrix.png) |
<!-- advanced-features-end -->

To regenerate them, start the dev server (`npm run dev`) and run `node scripts/screenshots.mjs`. It uses Playwright with your installed Chrome, and doubles as a smoke test: it records console errors, uncaught exceptions, crashed pages and blank pages for every shot in `docs/screenshots/report.json`.

## Highlights

- **Bloom, your companion:** nine switchable avatars (Bloom, Robot, Mood orb, Sparky, Beacon, Tinker, Pixel Bloom, Globe and more), animated with GSAP and SVG. Bloom acts out each page (lifting a dumbbell on Exercise, burning a note on Let it go…). In the chat you can type commands: log expenses, add to-dos, check off habits, log mood and gratitude, and get quiz hints.
- **Bloom English:** a Duolingo-style course with a lesson path, XP, streaks, hearts, leagues, quests, stories, speaking and pronunciation, a writing coach, themed weather scenes for every unit, and **Story mode**: a tournament side quest with a Remotion intro video.
- **Learn to code:** a Codecademy-style JavaScript course with a CodeMirror editor, a sandboxed runner (Web Worker with a time limit), instant checklists (console output, probes and acorn syntax-tree checks), hints, Get unstuck, a quiz, challenges, searchable cheat sheets and an animated certificate.
- **The Code Cup (story mode for Learn to code):** a tournament side quest — GLITCH has scrambled the Lighthouse code and Bloom World is going dark. Three code duels (predict the output / spot the bug) against racing rivals Mochi, Sparky and UNIT-7, Persona-style dialogue, a bonus wheel, and two Remotion videos: an intro and a finale that plays when you win the Cup.
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
| [`@codemirror/lang-javascript`](https://www.npmjs.com/package/@codemirror/lang-javascript) | code |
| [`@codemirror/theme-one-dark`](https://www.npmjs.com/package/@codemirror/theme-one-dark) | code |
| [`@codemirror/view`](https://www.npmjs.com/package/@codemirror/view) | code |
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
| [`@uiw/react-codemirror`](https://www.npmjs.com/package/@uiw/react-codemirror) | code |
| [`@use-gesture/react`](https://www.npmjs.com/package/@use-gesture/react) | release, ui |
| [`@xenova/transformers`](https://www.npmjs.com/package/@xenova/transformers) | search, voice |
| [`@xyflow/react`](https://www.npmjs.com/package/@xyflow/react) | VisionBoard |
| [`@zxing/browser`](https://www.npmjs.com/package/@zxing/browser) | scan |
| [`acorn`](https://www.npmjs.com/package/acorn) | code |
| [`acorn-walk`](https://www.npmjs.com/package/acorn-walk) | code |
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
| [`dompurify`](https://www.npmjs.com/package/dompurify) | cards, code |
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
| [`fuse.js`](https://www.npmjs.com/package/fuse.js) | code, companion, english, exercise |
| [`gsap`](https://www.npmjs.com/package/gsap) | VisionBoard, app shell, body, cards, code, companion, core, dailyFlow, daybook, daylight, diet, dojo, english, epiphany, exercise, fasting, games, interval, journey, joys, juice, lab, meditate, mindmap, mirror, mixer, money, monk, palace, quick, release, routines, rpg, scan, showcase, sleep, sounds, street, studio, ui, utils, welcome, wellbeing, workout, world, yoga |
| [`howler`](https://www.npmjs.com/package/howler) | AudioMixerContext |
| [`i18next`](https://www.npmjs.com/package/i18next) | translations |
| [`ics`](https://www.npmjs.com/package/ics) | daybook |
| [`jszip`](https://www.npmjs.com/package/jszip) | lab |
| [`leaflet`](https://www.npmjs.com/package/leaflet) | places, run |
| [`lightweight-charts`](https://www.npmjs.com/package/lightweight-charts) | money |
| [`lottie-web`](https://www.npmjs.com/package/lottie-web) | ui |
| [`lucide-react`](https://www.npmjs.com/package/lucide-react) | AdoptLibrary.tsx, AudioMixer.tsx, BloomExperience.tsx, CalendarPage.tsx, FocusPage.tsx, HabitsPage.tsx, LanguageSelector.tsx, Modal.tsx, PlanningTools.tsx, ProductivityPages.tsx, SettingsPage, UrgePage.tsx, achievements, affirm, app shell, body, breathwork, cards, code, collectibles, companion, core, dailyFlow, dashboard, daybook, daylight, diet, dojo, energy, english, epiphany, exercise, explore, eyes, fasting, focusRoom, games, icons, ink, interval, journal, joys, lab, layout, mala, meditate, mindmap, mirror, mixer, money, monk, palace, places, pointer, posture, release, reminders, rewards, roadmap, routines, rpg, run, scan, screen, settings, showcase, sleep, sounds, street, stretch, studio, taichi, timeCapsule.tsx, timeSince, ui, urgeClock.tsx, voice, welcome, wellbeing, workout, yearbook, yoga |
| [`lunarphase-js`](https://www.npmjs.com/package/lunarphase-js) | joys |
| [`marked`](https://www.npmjs.com/package/marked) | cards, code |
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
| [`react`](https://www.npmjs.com/package/react) | AdoptLibrary.tsx, AudioMixer.tsx, AudioMixerContext, BloomExperience.tsx, CalendarPage.tsx, FocusPage.tsx, HabitsPage.tsx, Modal.tsx, PersonalInsights.tsx, PlanningTools.tsx, ProductivityPages.tsx, SettingsPage, UrgePage.tsx, VisionBoard, achievements, affirm, app shell, app start-up, body, breathwork, cards, code, collectibles, companion, core, dailyFlow, dashboard, daybook, daylight, diet, dojo, energy, english, epiphany, exercise, explore, eyes, fasting, flow, focusRoom, games, icons, impact, ink, interval, journal, journey, joys, juice, lab, layout, mala, meditate, mindmap, mirror, mixer, money, monk, palace, places, pointer, posture, quick, release, reminders, rewards, roadmap, routines, rpg, run, scan, screen, search, settings, shared, showcase, sleep, sounds, street, stretch, studio, taichi, timeCapsule.tsx, timeSince, tsparticles react.d, ui, urgeClock.tsx, useCoach, voice, welcome, wellbeing, workout, world, yearbook, yoga |
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

