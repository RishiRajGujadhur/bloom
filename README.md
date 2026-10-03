# Bloom — Mindfulness Dashboard

Bloom is a personal React 19 wellness dashboard for habits, planning, focus, journaling, money, and learning. It runs locally, keeps data in the browser, and does not require an account or external AI service.

## Highlights

- Habit tracking, calendar planning, and focus sessions
- Journaling, money, learning, and reflection tools
- Light and Matrix themes with a calm purple design
- Optional local WebLLM support for privacy-friendly AI assistance

## Screenshots

| Overview | Workspace |
|---|---|
| ![Home](docs/screenshots/home-light.png) | ![Focus](docs/screenshots/focus-light.png) |
| ![Money](docs/screenshots/money-light.png) | ![Talk to Bloom](docs/screenshots/chat-light.png) |

## Advanced features

Built on Web Bluetooth, WebGPU, WebAssembly SIMD, multi-core workers, OPFS, and File System Access.

| Feature | Image |
|---|---|
| Sound Lab | ![Sound Lab](docs/screenshots/wow-13-soundlab.png) |
| Terrain Replay | ![Terrain Replay](docs/screenshots/wow-14-terrain.png) |
| Morning Readiness Scan | ![Readiness](docs/screenshots/wow-15-readiness.png) |
| Receipt Lens | ![Receipt Lens](docs/screenshots/wow-16-receipts.png) |
| Bills Inbox | ![Bills Inbox](docs/screenshots/wow-17-bills.png) |
| Morning Briefing Radio | ![Morning Briefing Radio](docs/screenshots/wow-18-briefing-hd.png) |
| Study Duel | ![Study Duel](docs/screenshots/wow-19-duel.png) |
| Form Coach | ![Form Coach](docs/screenshots/wow-20-formcoach.png) |
| Code City & Burnout Radar | ![Code City](docs/screenshots/wow-21-codecity.png) |
| Render thread (A2) | ![Render thread](docs/screenshots/a2-offscreen-soundlab.png) |

## Development

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

Typical project layout:

- `src/`: app logic, features, views, and styling
- `tests/`: unit and persistence tests
- `e2e/`: Playwright end-to-end checks
- `docs/`: feature docs and screenshots

## Open-source libraries

Bloom uses the following libraries in the app:

| Library | Purpose |
|---|---|
| React / React DOM | UI framework |
| TypeScript | Type safety |
| Framer Motion | Motion and transitions |
| Formik | Form handling |
| FullCalendar | Calendar and scheduling |
| @react-three/fiber + drei | 3D scenes and interaction |
| Nivo | Charts and data visualization |
| Tiptap | Rich text editing |
| Radix UI | Accessible menus, popovers, selects |
| @mlc-ai/web-llm | Optional local AI model support |
| CodeMirror | Code editing and review experiences |
| DnD Kit | Drag-and-drop interactions |
| @react-pdf/renderer | PDF generation |
| @fontsource/* | App typography |

This keeps the project lightweight while covering planning, journaling, focus, money, and learning workflows.
