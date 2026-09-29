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
| 15 | **Morning Readiness Scan** | Daily, 60 s | A Bluetooth heart-rate strap, or a fingertip on the camera, drives a holographic heart-rate variability HUD. It gives a **readiness score** against your 30-day baseline and suggests a push day or a recovery day. | BT, SIMD, OPFS | Web Bluetooth `heart_rate`, `fili`, `uplot`, `simple-statistics`, `gsap`, `zod` | [ ] |
| 16 | **Receipt Lens** (extends Money) | Daily | Snap a receipt, or point it at a folder. OCR runs on every core and **Money transactions are created automatically**, with a scanning-laser animation. Images are kept in OPFS. | MT, SIMD, OPFS, FSA | `tesseract.js`, `pdfjs-dist`, `chrono-node`, `currency.js`, `comlink`, `gsap` | [ ] |
| 17 | **Bills Inbox** (extends Money) | Weekly | Scan a bill: the page is flattened, OCR runs, and it becomes an **upcoming bill with a countdown** in Money. Ask "When does my insurance renew?" and the local LLM answers from your scanned bills. Saves a searchable PDF to disk. | SIMD, MT, GPU, OPFS, FSA | `opencv.js`, `tesseract.js`, `pdf-lib`, `@xenova/transformers`, `orama`, existing `@mlc-ai/web-llm` | [ ] |
| 18 | **Morning Briefing Radio** | Daily | A 90-second spoken briefing: calendar, readiness, bills due, weather and your standup notes (22). The local LLM writes it and an on-device voice reads it, with a radio SVG visualiser. | GPU, OPFS | existing `@mlc-ai/web-llm`, `kokoro-js`, Open-Meteo, `date-fns`, `tone`, `gsap` | [ ] |
| 19 | **Study Duel** (extends English) | Weekly, with friends | Race a friend's device, peer to peer, on English vocabulary, grammar and pronunciation rounds, with live score orbs and a shared whiteboard. A dropped connection just re-merges (CRDT). | CRDT, GPU | `yjs`, `y-webrtc`, `qrcode`, `perfect-freehand`, `three`, `gsap` | [ ] |

## New: the work-from-home developer

| # | Feature | How it's used | Sci-fi moment | Caps | Libraries | Status |
|---|---|---|---|---|---|---|
| 20 | **Form Coach** (extends Workout) | Every home workout | Put the laptop on the floor and train. Pose tracking on the GPU **counts your reps** for squats, push-ups, lunges and planks, and scores your **form** (depth, knee tracking, back angle). A glowing skeleton HUD flashes a correction when your form slips. Sets are logged into Workout automatically, hands-free. | GPU, MT, OPFS | `@mediapipe/tasks-vision` (PoseLandmarker, GPU delegate), `one-euro-filter` (smoothing), `ml-matrix`, `tone` (rep beeps), `gsap`, `comlink` | [ ] |
| 23 | **Burnout Radar: Code City** | Weekly | Your repos as a glowing 3D city. Each building is a file: its height is churn and its heat is late-night edits. A radar compares your **commit times, weekend work and meeting-free focus** against your sleep, mood and readiness from the app, and flags drift before burnout. | GPU, MT, FSA, SIMD | `isomorphic-git`, `three` (instanced meshes), `d3-hierarchy`, `simple-statistics`, `comlink`, `gsap` | [ ] |

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
