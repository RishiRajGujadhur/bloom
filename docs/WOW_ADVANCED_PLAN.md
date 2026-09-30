# Wow Advanced — features 13–21 (final)

Features 1–12 of `WOW_25_PLAN.md` are shipped. This list replaces the earlier advanced lists.

**Who it's for:** someone in their 30s, a software developer working from home, who exercises and cooks at home and doesn't go out much.

The bar for every feature:
1. It's useful daily or weekly for that person.
2. It does real work for you. There is no data entry, and no checklists, notebooks or planners.
3. It's built on the platform capabilities below.

## Capabilities

| Tag | Capability |
|---|---|
| **BT** | Web Bluetooth |
| **OPFS** | Origin Private File System |
| **GPU** | WebGPU (rendering, compute and on-device ML) |
| **CRDT** | Local-first plus CRDT sync (peer to peer) |
| **SIMD** | WebAssembly SIMD128 |
| **MT** | SharedArrayBuffer plus Atomics (true multi-core) |
| **FSA** | File System Access API plus PWA file handlers |
| **CP** | Compute Pressure API: CPU stress states (nominal, fair, serious, critical) |
| **OC** | OffscreenCanvas: canvas rendering moved to a worker thread |
| **MAP** | Joined to the map (Leaflet, as in Places and Run) |

## What's already in the app

I checked these before planning, so nothing here duplicates them:

- The on-device LLM chatbot.
- Whisper voice memos.
- Leaflet maps (Run, Places).
- Money.
- English (pronunciation lab).
- Cards (FSRS).
- Workout (logging, no camera).
- Exercise figures.
- Posture (camera).
- Eyes, Screen time, Diet (recipes, cook-along), Body (progress photos), Focus and Focus room (solo), People garden.

Features marked **(extends …)** upgrade an existing page.

## Groundwork (before the first feature)

- **Cross-origin isolation.** Add COOP/COEP headers in the Vite dev and preview config and in the deploy headers.
- **Shared layer** in `src/platform/`:
  - `caps.ts`: capability detection plus a "superpowers" badge.
  - `workerPool.ts`: an Atomics worker pool.
  - `opfs.ts`: OPFS helpers.
  - `gpu.ts`: WebGPU with a fallback.
  - `fileHandlers.ts`: `launchQueue` handling.
  - `ble.ts`: a Bluetooth helper with a **simulated device** mode.
- **Manifest** `file_handlers` entries for `.gpx`, `.wav`, `.m4a` and `.pdf`.

## Kept

| # | Feature | How it's used | Sci-fi moment | Caps | Libraries | Status |
|---|---|---|---|---|---|---|
| 13 | **Sound Lab** (extends Voice memos) | Daily | **One-tap noise removal**: spectral gating in a SIMD Wasm worker, with a before/after A/B toggle. A GPU 3D spectrogram "mountain", voice levelling and silence trimming. Save the cleaned file back to disk, and Whisper transcribes the clean audio. | SIMD, MT, FSA, GPU | `essentia.js`, existing `wavesurfer.js`, `three`, `lamejs`, `comlink`, existing `@xenova/transformers` | [x] [shot](screenshots/wow-13-soundlab.png) |
| 14 | **Terrain Replay** (extends Run) | Weekly | A `.gpx` file (dropped in or opened from the OS) becomes a speed-heat route on the existing **Leaflet** map. A 3D ribbon built from the route's elevation lets a drone camera fly along it, with splits and an elevation profile. | FSA, GPU, SIMD | existing `leaflet`, `@tmcw/togeojson`, `@turf/turf`, `simplify-js`, `three`, `chroma-js` | [x] [shot](screenshots/wow-14-terrain.png) |
| 15 | **Morning Readiness Scan** | Daily, 60 s | A Bluetooth heart-rate strap, or a fingertip on the camera, drives a holographic heart-rate variability HUD. It gives a **readiness score** against your 30-day baseline and suggests a push day or a recovery day. | BT, SIMD, OPFS | Web Bluetooth `heart_rate`, `fili`, `uplot`, `simple-statistics`, `gsap`, `zod` | [x] [shot](screenshots/wow-15-readiness.png) |
| 16 | **Receipt Lens** (extends Money) | Daily | Snap a receipt, or point it at a folder. OCR runs on every core and **Money transactions are created automatically**, with a scanning-laser animation. Images are kept in OPFS. | MT, SIMD, OPFS, FSA | `tesseract.js`, `pdfjs-dist`, `chrono-node`, `currency.js`, `comlink`, `gsap` | [x] [shot](screenshots/wow-16-receipts.png) |
| 17 | **Bills Inbox** (extends Money) | Weekly | Scan a bill: the page is flattened, OCR runs, and it becomes an **upcoming bill with a countdown** in Money. Ask "When does my insurance renew?" and the local LLM answers from your scanned bills. Saves a searchable PDF to disk. | SIMD, MT, GPU, OPFS, FSA | `opencv.js`, `tesseract.js`, `pdf-lib`, `@xenova/transformers`, `orama`, existing `@mlc-ai/web-llm` | [x] [shot](screenshots/wow-17-bills.png) |
| 18 | **Morning Briefing Radio** | Daily | A 90-second spoken briefing: calendar, readiness, bills due, weather and your standup notes (22). The local LLM writes it and an on-device voice reads it, with a radio SVG visualiser. | GPU, OPFS | existing `@mlc-ai/web-llm`, `kokoro-js`, Open-Meteo, `date-fns`, `tone`, `gsap` | [x] [shot](screenshots/wow-18-briefing-hd.png) |
| 19 | **Study Duel** (extends English) | Weekly, with friends | Race a friend's device, peer to peer, on English vocabulary, grammar and pronunciation rounds, with live score orbs and a shared whiteboard. A dropped connection just re-merges (CRDT). | CRDT, GPU | `yjs`, `y-webrtc`, `qrcode`, `perfect-freehand`, `three`, `gsap` | [x] [shot](screenshots/wow-19-duel.png) |

## New: the work-from-home developer

| # | Feature | How it's used | Sci-fi moment | Caps | Libraries | Status |
|---|---|---|---|---|---|---|
| 20 | **Form Coach** (extends Workout) | Every home workout | Put the laptop on the floor and train. Pose tracking on the GPU **counts your reps** for squats, push-ups, lunges and planks, and scores your **form** (depth, knee tracking, back angle). A glowing skeleton HUD flashes a correction when your form slips. Sets are logged into Workout automatically, hands-free. | GPU, MT, OPFS | `@mediapipe/tasks-vision` (PoseLandmarker, GPU delegate), `one-euro-filter` (smoothing), `ml-matrix`, `tone` (rep beeps), `gsap`, `comlink` | [x] [shot](screenshots/wow-20-formcoach.png) |
| 23 | **Burnout Radar: Code City** | Weekly | Your repos as a glowing 3D city. Each building is a file: its height is churn and its heat is late-night edits. A radar compares your **commit times, weekend work and meeting-free focus** against your sleep, mood and readiness from the app, and flags drift before burnout. | GPU, MT, FSA, SIMD | `isomorphic-git`, `three` (instanced meshes), `d3-hierarchy`, `simple-statistics`, `comlink`, `gsap` | [x] [shot](screenshots/wow-21-codecity.png) |

## Numbering

In build order, the kept features are numbered **Wow 13–21**:

| Wow # | Plan # | Feature |
|---|---|---|
| 13 | 13 | Sound Lab |
| 14 | 14 | Terrain Replay |
| 15 | 15 | Morning Readiness Scan |
| 16 | 16 | Receipt Lens |
| 17 | 17 | Bills Inbox |
| 18 | 18 | Morning Briefing Radio |
| 19 | 19 | Study Duel |
| 20 | 20 | Form Coach |
| 21 | 23 | Code City |

Coverage: BT (15), OPFS (15–18, 20), GPU (13, 14, 17–20, 23), CRDT (19), SIMD (13–17, 23), MT (13, 16, 17, 20, 23), FSA (13, 14, 16, 17, 23).

## Caveats

- WebGPU and Web Bluetooth work in Chrome and Edge only. Other browsers get the fallbacks.
- **Bluetooth hardware (15)** runs in simulated-device mode for the demo and screenshots. Real devices work when paired.
- Models are opt-in downloads with visible progress.
- The Git features read local repositories only, and read-only.

---

# Phase 2: upgrading the existing features

Money, Voice memos and Run have already been upgraded (13, 14, 16). This phase does the same for the rest of Bloom. There are three threads:

1. **A calmer, smoother app:** Compute Pressure and OffscreenCanvas.
2. **Everything on the map.**
3. **Hardware and on-device compute** for pages that don't use them yet.

Every idea below upgrades a page that already exists. None is a new standalone page, apart from Life Map (M1), which grows out of Places.

## A. Platform: adaptive and off the main thread

These are built once in `src/platform/`, then used by every heavy page.

| # | Upgrade | What you'd notice | Caps | Libraries |
|---|---|---|---|---|
| A1 | **Thermal governor** (`platform/pressure.ts`) | Bloom watches CPU pressure through a `PressureObserver`. When your laptop heats up (**serious**), every 3D or particle scene steps down together: fewer particles, lower pixel ratio, 30 fps instead of 60. The worker pools shrink. At **critical**, heavy scenes pause behind a "cooling down" frost overlay. When pressure eases, quality returns. A header chip (calm, warm, hot) with a live SVG thermometer shows the state. | CP, MT | Compute Pressure API, `gsap`, `zustand` (shared quality store) |
| A2 ✅ | **Off-thread rendering** (`platform/offscreen.ts`) | Canvas animations (WebGPU scenes, Matrix rain, visualisers, the mood orb) render in a worker through `transferControlToOffscreen()`, so typing, scrolling and heavy work never make them stutter. A debug overlay compares main-thread and render-thread frame times. | OC, GPU, CP | OffscreenCanvas, `three` (WebGPURenderer in a worker), `comlink` |
| A3 ✅ | **Apply A1 and A2 to what we’ve built** | Sound Lab's mountain, Terrain Replay, Readiness HUD, 3D World, Memory Palace, Tai Chi silk shader, Decision coin, Globe quiz and Matrix rain all move off the main thread and adapt to heat. | OC, CP, GPU | the same |
| A4 | **Build-break coach** (extends Screen time and Stretch) | Long stretches of **serious** CPU pressure usually mean compiles, test runs or Docker builds. Bloom notices and offers a 90-second stretch while you wait. Screen time learns your "machine busy" hours. | CP | Compute Pressure API, `date-fns`, `gsap` |

## B. Everything on the map

The map already lives in Places (with offline tile caching) and Run. The idea is to make it the thread that joins your features together.

| # | Upgrade | What you'd notice | Caps | Libraries |
|---|---|---|---|---|
| M1 | **Life Map** (extends Places) | One map with a layer for each feature: runs (speed heat), moods, spending, journal and voice notes, people and habits. A **time slider** replays a week, month or year. A density heatmap is drawn in an OffscreenCanvas worker, so the map stays at 60 fps with thousands of points. | MAP, OC, CP, OPFS | existing `leaflet`, `deck.gl` (heatmap layer), `h3-js` (hex bins), `@turf/turf`, `gsap` |
| M2 ✅ | **Mood geography** (extends Mood and Journal) | Check-ins can carry a coarse location (a hexagon, never exact). The map shows **where you feel best**, such as the park, the café or home, as coloured hexagons, with insights like "You log calmer moods near water." | MAP | `h3-js`, `chroma-js`, `simple-statistics`, existing `leaflet` |
| M3 ✅ | **Money map** (extends Money and Receipt Lens) | Transactions and receipts remember where they were added. Circles are sized by spend. Tapping a shop shows every receipt image from it (stored in OPFS). You'll see things like "Your coffee radius is 400 m." | MAP, OPFS | existing `leaflet`, `@turf/turf`, `d3-scale`, `gsap` |
| M4 ✅ | **Memory pins** (extends Daybook, Voice memos and Epiphanies) | Notes and memos remember where they were made. **"On this spot…"**: when you're near somewhere you wrote something before, Bloom offers to show it (a geofence while the app is open). | MAP, OPFS | Geolocation, `@turf/turf`, existing `leaflet` |
| M5 ✅ | **People on the globe** (extends People garden and Globe quiz) | Friends and family on the Globe quiz's 3D globe, with a live **day/night terminator** and their local times. "Good time to call" glows for anyone awake. Birthdays show as pins. | MAP, OC | existing `d3-geo` and `topojson-client`, `suncalc`, `gsap` |
| M6 | **Run explorer** (extends Run and Terrain Replay) | A **"streets you've run" coverage map**: street segments light up as you run them, with a percentage of your neighbourhood explored. "Suggest a new loop" builds a route of a chosen distance through streets you haven't run yet. | MAP, SIMD, MT | Overpass API (OpenStreetMap streets), `@turf/turf`, existing `leaflet`, worker pool for route matching |
| M7 ✅ | **Place habits** (extends Habits) | Habits can have a place: gym, library or park. When you arrive (while Bloom is open), a check-in prompt appears. A habit map shows where you actually keep your habits. | MAP | Geolocation, `@turf/turf`, existing `leaflet` |
| M8 | **Daylight map** (extends Daylight and Sleep) | Your location with the sun's position and today's light window. It logs outdoor-light minutes by place, and links to Sleep: "More morning light on days you walk to the park." | MAP | `suncalc`, existing `leaflet`, `simple-statistics` |
| M9 | **Dark-sky finder** (extends Night sky) | A map of the nearest dark-sky spots, from light-pollution tiles and the moon phase, with tonight's best time. It opens Night sky already set to that spot. | MAP | light-pollution tile layer, existing `astronomy-engine`, `leaflet` |
| M10 | **Year in places** (extends Yearbook) | An animated flight across every place in your year, using the Terrain Replay renderer: runs, trips and moods in order, ending on your "home base" stats. | MAP, GPU, OC | `three` (WebGPU), existing `leaflet`, `gsap` |

## C. Hardware and compute upgrades for other pages

| # | Upgrade (extends) | What you'd notice | Caps | Libraries |
|---|---|---|---|---|
| C1 | **Heart-coherence breathing** (Breathe, Breathwork, Meditate) | Uses the Readiness sources (Bluetooth strap or fingertip camera). The breathing orb expands with your **live heart-rate variability**, and a coherence score climbs as your breathing and heartbeat lock together (about 6 breaths a minute). Rendered off-thread. | BT, SIMD, OC | readiness `sources.ts`, PFFFT (SIMD), `uplot`, `gsap` |
| C2 | **Heart-rate zones** (Intervals, Workouts, Run) | Pair a strap once and every timer shows live heart-rate zones. Intervals can auto-advance when your heart rate recovers. Workouts log average and peak heart rate. | BT, OPFS | Web Bluetooth `heart_rate`, `uplot`, `tone` |
| C3 | **Camera features off the main thread** (Posture, Eyes, Sign alphabet, Mirror) | MediaPipe runs in a worker on an OffscreenCanvas, and drops its frame rate under CPU pressure. The page stays smooth and the laptop stays cool. | OC, CP, GPU | `@mediapipe/tasks-vision` (worker), OffscreenCanvas |
| C4 | **Semantic memory search** (Journal, Daybook, Epiphanies, Voice) | "Find entries that feel like this one": GPU text embeddings with a vector index in OPFS, plus a constellation map of related entries. | GPU, OPFS, MT | existing `@xenova/transformers`, `orama`, `d3-force` |
| C5 ✅ | **Soundscape engine** (Sounds, Mixer) | Noise colours, rain and binaural beats generated live in an **AudioWorklet** with SIMD DSP, so nothing loops. The visualiser renders off-thread and lowers its detail under CPU pressure. | SIMD, OC, CP | AudioWorklet, PFFFT, `tone`, OffscreenCanvas |
| C6 | **Parallel Correlation Lab** (Insights Lab) | Every metric against every other, with bootstrap confidence intervals, computed across all cores in about a second. | MT, SIMD | worker pool, `simple-statistics`, `ml-matrix` |
| C7 ✅ | **Vision board files** (Vision board) | Save and open boards as `.bloomboard` files on disk, with images in OPFS. Send a board file to a friend and it opens straight into Bloom. | FSA, OPFS | File System Access, manifest file_handlers, `fflate` |

## Suggested order

1. **A1** thermal governor and **A2** off-thread rendering. Everything after benefits.
2. **A3**, applying them to the WebGPU scenes already built.
3. **M1 Life Map**, the hub that M2, M3, M4 and M7 plug into as layers.
4. **C1** and **C2**. They reuse the Readiness code, so they're quick.
5. **M5 People on the globe** and **M6 Run explorer**.
6. The rest (A4, C3–C7, M8–M10).

This phase is in addition to the remaining features 17–21 (Bills Inbox, Morning Briefing Radio, Study Duel, Form Coach and Code City).

## Caveats for Phase 2

- **Compute Pressure** works in Chrome and Edge on desktop. Elsewhere Bloom measures frame times instead, and still steps quality down when frames drop.
- **OffscreenCanvas** is widely supported. A scene that can't transfer its canvas stays on the main thread.
- **Location** is always opt-in, stored only on the device, and coarse (moods are rounded to a hexagon). Geofences only run while Bloom is open, with no background tracking.
- **Overpass (M6)** and **light-pollution tiles (M9)** are the only new network data. Both are open-data services.

---

# Phase 3: platform polish across existing features

New capabilities, each applied to features that already exist:

| # | Upgrade | Applies to | Technology |
|---|---|---|---|
| P1 ✅ | **Your own desktop fonts** as the app font, with live preview and search | Settings, every page | Local Font Access (`queryLocalFonts`) |
| P2 ✅ | **Away detection**: timers pause when you step away from the computer, and screen time excludes idle time | Focus, Focus room, Screen time | Idle Detection API |
| P3 ✅ | **Screen stays on** during guided sessions | Meditate, Breathwork, Yoga, Stretch, Diet cook-along, Readiness scan, Form coach, Intervals | Screen Wake Lock API |
| P4 ✅ | **Themed title bar**: the installed app draws its own title bar with search, streak and page title, in every theme | App shell, all themes | Window Controls Overlay + `theme-color` per theme |
| P5 ✅ | **Houdini backgrounds**: generative paint-worklet patterns unique to each section of the app | Page backgrounds | CSS Paint API (Houdini) |
| P6 ✅ | **Morphing navigation**: page changes cross-fade and the page title morphs into place | Sidebar navigation, tabs | View Transitions API |

After Phase 3:

- Page-specific SVG and GSAP backgrounds.
- Right-click → Disable for any page in the sidebar, with a confirm prompt.
- A 500-item quality-of-life list, worked through and pushed every 10 items.
