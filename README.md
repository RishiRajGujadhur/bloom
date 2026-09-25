# Bloom — Mindfulness Dashboard

A personal React 19 health-coaching dashboard with a Habitica-inspired purple palette. No account or external AI service is required. Coaching uses a four-step reflection script.

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
