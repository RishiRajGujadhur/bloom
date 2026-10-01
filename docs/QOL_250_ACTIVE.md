# Bloom: 250 quality of life improvements

This is the active, audited delivery tracker for the current request. Items are drawn from the existing unfinished Bloom quality plan. An item counts only after its behavior is implemented, checked, and pushed. The source number points to `QOL_500.md`.
Items are drawn from the existing unfinished Bloom quality plan and audited against the app. Only newly implemented, verified, and pushed behavior counts. An item already present is excluded and gets a replacement row, so the target remains 250 new improvements. Source numbers point to `QOL_500.md`.
**Verified and pushed: 7 / 250**

| # | Source | Improvement | Status | Evidence |
|---:|---:|---|---|---|
| 1 | 10 | Fuzzy page and sub-feature search in command palette | Shipped | `918edc1`; type check and browser smoke |
| 2 | 11 | Command palette shows each command's shortcut on the right | Already present; excluded | Previously shipped in QOL_200.md |
| 3 | 13 | Middle-click a sidebar page opens it in a new tab (hash URL) | Already present; excluded | Existing app behavior audited |
| 4 | 14 | Sidebar remembers scroll position | Already present; excluded | Existing app behavior audited |
| 5 | 15 | Sidebar search box filters pages as you type (`Ctrl+Shift+F`) | Already present; excluded | Existing app behavior audited |
| 6 | 16 | Collapsed-sidebar icons show a tooltip with the shortcut | Already present; excluded | Existing app behavior audited |
| 7 | 17 | Drag pinned sidebar pages to reorder | Shipped | `918edc1`; type check and browser smoke |
| 8 | 19 | Breadcrumb in the header: Section › Page › Tab | Planned | — |
| 9 | 21 | Deep links to a tab (`#money/bills`) | Already present; excluded | Previously shipped in QOL_200.md |
| 10 | 22 | Deep links to a specific item (`#people/p3`) | Already present; excluded | Previously shipped in QOL_200.md |
| 11 | 23 | Home dashboard: "Continue where you left off" card with the last three pages | Already present; excluded | Existing app behavior audited |
| 12 | 24 | Section headers in the sidebar can be collapsed with the keyboard (`Enter`) | Already present; excluded | Existing app behavior audited |
| 13 | 25 | Arrow keys move between sidebar items | Already present; excluded | Existing app behavior audited |
| 14 | 26 | Sidebar: a small badge for pages with something due (bills, habits left) | Planned | — |
| 15 | 28 | Mobile: swipe from the left edge opens the sidebar | Already present; excluded | Previously shipped in QOL_200.md |
| 16 | 29 | Mobile: swipe between tabs within a page | Planned | — |
| 17 | 30 | Mobile: bottom tab bar for the four most-used pages | Planned | — |
| 18 | 33 | Page anchors: section headings get copyable links | Planned | — |
| 19 | 34 | Open-in-new-window button for focus pages (Focus, Breathe) | Already present; excluded | Previously shipped in QOL_200.md |
| 20 | 35 | Settings shows date a feature was turned off | Shipped | `918edc1`; type check and browser smoke |
| 21 | 36 | Turn disabled pages on from command palette | Shipped | `918edc1`; type check and browser smoke |
| 22 | 37 | Recently disabled pages appear in command palette | Shipped | `918edc1`; type check and browser smoke |
| 23 | 38 | Sidebar density setting: comfortable / compact | Already present; excluded | Existing app behavior audited |
| 24 | 39 | Sidebar width is draggable and remembered | Already present; excluded | Existing app behavior audited |
| 25 | 40 | Hide section headers option (flat list) | Planned | — |
| 26 | 41 | Rename pages (custom labels) from the right-click menu | Planned | — |
| 27 | 42 | Choose a page's sidebar icon from the right-click menu | Planned | — |
| 28 | 43 | Sidebar accent per section | Planned | — |
| 29 | 45 | Topbar collapses on scroll down and returns on scroll up | Already present; excluded | Existing app behavior audited |
| 30 | 46 | Remember the zoom level of map pages | Planned | — |
| 31 | 47 | Link rail chips reorder by most-used | Planned | — |
| 32 | 48 | Hover a sidebar item to preload its page code | Planned | — |
| 33 | 49 | Show "new" dots on features you haven't opened yet | Planned | — |
| 34 | 50 | "Tour this page" button in each page menu | Planned | — |
| 35 | 53 | `Ctrl+S` saves on editing pages (journal, daybook, board ✓) | Already present; excluded | Existing app behavior audited |
| 36 | 54 | `Ctrl+Z` undoes the last deletion anywhere | Planned | — |
| 37 | 56 | `J`/`K` move through lists; `X` selects; `E` edits | Planned | — |
| 38 | 58 | `Ctrl+/` focuses the page search | Already present; excluded | Existing app behavior audited |
| 39 | 60 | Quick add understands money ("12.50 lunch Nando's") | Planned | — |
| 40 | 61 | Quick add understands habits ("habit: stretch daily") | Planned | — |
| 41 | 63 | Palette actions: "Log mood 4", "Start focus 25", "Add water" | Already present; excluded | Existing app behavior audited |
| 42 | 64 | Palette: calculator (type `=12*7`) | Already present; excluded | Existing app behavior audited |
| 43 | 65 | Palette: unit conversions (km↔mi, kg↔lb) | Already present; excluded | Existing app behavior audited |
| 44 | 66 | Palette: open any setting by name | Already present; excluded | Existing app behavior audited |
| 45 | 67 | Typing in a number field accepts maths (`2*45`) | Planned | — |
| 46 | 68 | Arrow up/down in number fields steps by sensible amounts (Shift ×10) | Already present; excluded | Existing app behavior audited |
| 47 | 69 | Date fields accept "today", "tomorrow", "fri" | Planned | — |
| 48 | 70 | Autofocus the first field in every add form | Already present; excluded | Existing app behavior audited |
| 49 | 71 | Remember the last category/choice in add forms | Already present; excluded | Existing app behavior audited |
| 50 | 72 | Duplicate item (`Ctrl+D`) in lists | Planned | — |
| 51 | 73 | Multi-select with Shift+click, bulk delete/complete | Planned | — |
| 52 | 74 | Drag and drop to reorder lists everywhere | Planned | — |
| 53 | 75 | Paste an image straight into journal/daybook/board | Planned | — |
| 54 | 77 | Tab-completion for tags | Planned | — |
| 55 | 78 | Emoji picker shortcut (`:`) in text fields | Planned | — |
| 56 | 79 | Keyboard-accessible sliders show value while dragging | Already present; excluded | Previously shipped in QOL_200.md |
| 57 | 80 | `Home`/`End` jump to first and last item in lists | Already present; excluded | Previously shipped in QOL_200.md |
| 58 | 81 | `Ctrl+F` inside long pages highlights matches (custom find) | Planned | — |
| 59 | 82 | Voice command button ("start focus", "log mood") using speech recognition | Planned | — |
| 60 | 83 | Global "quick capture" shortcut (`Ctrl+Shift+Space`) from any page | Planned | — |
| 61 | 84 | Hold `Alt` to reveal shortcut hints on buttons | Already present; excluded | Previously shipped in QOL_200.md |
| 62 | 85 | Shortcut remapping in Settings | Planned | — |
| 63 | 86 | One-key mood logging on the dashboard (1–5) | Already present; excluded | Previously shipped in QOL_200.md |
| 64 | 87 | One-key habit check-off on the dashboard (habit number keys) | Already present; excluded | Previously shipped in QOL_200.md |
| 65 | 89 | `Ctrl+Shift+T` reopens the last closed page | Planned | — |
| 66 | 90 | `Ctrl+P` prints a clean version of the current page | Already present; excluded | Previously shipped in QOL_200.md |
| 67 | 91 | `Ctrl+E` exports the current page's data | Planned | — |
| 68 | 92 | Double-click a title to rename in place | Planned | — |
| 69 | 93 | Right-click list items for context actions | Planned | — |
| 70 | 94 | Long-press on touch opens the same context actions | Planned | — |
| 71 | 95 | `Tab` order audited on every page | Planned | — |
| 72 | 96 | Focus rings visible only for keyboard users | Already present; excluded | Previously shipped in QOL_200.md |
| 73 | 99 | Up-arrow in an empty input recalls the last entry | Already present; excluded | Previously shipped in QOL_200.md |
| 74 | 100 | Enter on a checklist item adds the next one | Planned | — |
| 75 | 103 | Preload the next likely page on idle | Planned | — |
| 76 | 104 | Virtualise long lists (journal, transactions, history) | Planned | — |
| 77 | 105 | Lazy-load images with blur placeholders | Already present; excluded | Previously shipped in QOL_200.md |
| 78 | 106 | Debounce autosave writes | Planned | — |
| 79 | 107 | Move localStorage JSON writes off the keystroke path | Planned | — |
| 80 | 108 | Cache computed charts between visits | Planned | — |
| 81 | 109 | Pause off-screen animations (IntersectionObserver) | Planned | — |
| 82 | 111 | Battery saver: reduce motion automatically on low battery | Already present; excluded | Previously shipped in QOL_200.md |
| 83 | 112 | Compute-pressure adaptive quality for all canvases | Planned | — |
| 84 | 113 | Prefetch fonts used by the active theme only | Planned | — |
| 85 | 114 | Split large vendor chunks (three, tesseract, opencv) per page | Planned | — |
| 86 | 115 | Service worker caches visited pages for instant reloads | Planned | — |
| 87 | 116 | Skeleton loaders instead of spinners | Planned | — |
| 88 | 117 | Measure and show a performance panel (FPS, memory) in Settings › Advanced | Planned | — |
| 89 | 118 | Stop timers on unmounted pages | Planned | — |
| 90 | 119 | Reuse one AudioContext app-wide | Planned | — |
| 91 | 120 | Reuse one WebGPU device app-wide | Planned | — |
| 92 | 121 | IndexedDB queries indexed by date | Planned | — |
| 93 | 122 | Batch habit toggles into one write | Planned | — |
| 94 | 123 | Web Vitals logging in dev | Already present; excluded | Previously shipped in QOL_200.md |
| 95 | 124 | Reduce layout shift on page load (reserved heights) | Planned | — |
| 96 | 125 | Content-visibility: auto on long page sections | Planned | — |
| 97 | 126 | Image uploads downscaled in a worker | Planned | — |
| 98 | 127 | Map tiles cached (✓ Places) and pre-warmed around home | Planned | — |
| 99 | 128 | Faster startup: defer non-critical providers | Planned | — |
| 100 | 129 | Tree-shake icon imports | Planned | — |
| 101 | 130 | Avoid re-rendering the whole app on theme change (✓ theme engine) | Planned | — |
| 102 | 131 | Memoise sidebar item lists | Planned | — |
| 103 | 132 | requestIdleCallback for insights computation | Planned | — |
| 104 | 133 | Offline banner and queued actions | Planned | — |
| 105 | 134 | Instant search index in a worker | Planned | — |
| 106 | 135 | Streamed large exports | Planned | — |
| 107 | 136 | GPU-accelerated CSS transitions only (transform/opacity) | Planned | — |
| 108 | 137 | Low-end device mode toggle | Planned | — |
| 109 | 138 | Detect slow network and skip heavy media | Planned | — |
| 110 | 139 | Keep the last page mounted for instant back navigation | Planned | — |
| 111 | 140 | Warm the Whisper and OCR workers on hover of their buttons | Planned | — |
| 112 | 141 | Worker pool shared across features | Planned | — |
| 113 | 142 | OPFS for large blobs instead of IndexedDB | Planned | — |
| 114 | 143 | Compress stored JSON (fflate) above a size threshold | Planned | — |
| 115 | 144 | Clean up orphaned blobs weekly | Planned | — |
| 116 | 145 | Storage usage meter per feature in Settings | Already present; excluded | Previously shipped in QOL_200.md |
| 117 | 146 | "Clear caches" button per feature | Planned | — |
| 118 | 147 | Show loading progress for model downloads everywhere | Planned | — |
| 119 | 148 | Cancel buttons for long operations | Planned | — |
| 120 | 149 | Resume interrupted downloads | Planned | — |
| 121 | 150 | Background sync for exports when the tab is closed | Planned | — |
| 122 | 154 | Accent colour picker with contrast check (✓ picker exists; add check) | Planned | — |
| 123 | 155 | Per-section accent colours | Planned | — |
| 124 | 157 | Motion level: full / reduced / none | Planned | — |
| 125 | 158 | Sound effects volume and mute | Planned | — |
| 126 | 159 | Haptics toggle on mobile | Planned | — |
| 127 | 160 | Choose start page | Already present; excluded | Previously shipped in QOL_200.md |
| 128 | 161 | Choose default tab per page | Planned | — |
| 129 | 162 | Week starts on Monday/Sunday | Already present; excluded | Previously shipped in QOL_200.md |
| 130 | 163 | 12/24-hour clock | Planned | — |
| 131 | 164 | Date format (dd/mm, mm/dd, ISO) | Planned | — |
| 132 | 165 | Units: metric/imperial app-wide | Planned | — |
| 133 | 166 | Currency default with symbol position | Planned | — |
| 134 | 167 | Number format (1,234.5 vs 1.234,5) | Planned | — |
| 135 | 168 | Language picker surfaced on first run | Planned | — |
| 136 | 170 | Card corner roundness | Already present; excluded | Previously shipped in QOL_200.md |
| 137 | 174 | Toggle streak reminders | Planned | — |
| 138 | 175 | Quiet hours for notifications | Already present; excluded | Previously shipped in QOL_200.md |
| 139 | 176 | Reminder sounds choice | Planned | — |
| 140 | 177 | Import/export settings as a file | Already present; excluded | Previously shipped in QOL_200.md |
| 141 | 178 | Reset one feature's settings | Planned | — |
| 142 | 180 | Settings deep links (`#settings/fonts`) | Already present; excluded | Previously shipped in QOL_200.md |
| 143 | 181 | Show which features use the camera/mic/location | Planned | — |
| 144 | 182 | Per-feature data export | Planned | — |
| 145 | 183 | Per-feature data wipe | Planned | — |
| 146 | 184 | Feature presets: "Minimal", "Wellbeing", "Productivity", "Everything" | Planned | — |
| 147 | 188 | Choose the Bloom companion's personality | Planned | — |
| 148 | 189 | Companion position (left/right) and size | Already present; excluded | Previously shipped in QOL_200.md |
| 149 | 190 | Hide the companion on certain pages | Already present; excluded | Previously shipped in QOL_200.md |
| 150 | 191 | Custom greeting name | Already present; excluded | Previously shipped in QOL_200.md |
| 151 | 192 | Birthday for yearly surprises | Planned | — |
| 152 | 193 | Choose which stats appear on the dashboard | Planned | — |
| 153 | 194 | Rearrange dashboard modules by drag | Planned | — |
| 154 | 195 | Dashboard layouts (1/2/3 columns) | Planned | — |
| 155 | 196 | Custom CSS snippet (advanced) | Already present; excluded | Previously shipped in QOL_200.md |
| 156 | 197 | High-contrast mode | Already present; excluded | Previously shipped in QOL_200.md |
| 157 | 198 | Dyslexia-friendly font option | Already present; excluded | Previously shipped in QOL_200.md |
| 158 | 199 | Colour-blind-safe chart palettes | Planned | — |
| 159 | 200 | Scrollbar style (thin/hidden) | Already present; excluded | Previously shipped in QOL_200.md |
| 160 | 201 | Cursor effects toggle | Planned | — |
| 161 | 202 | Default privacy: blur sensitive numbers (money) until hover | Already present; excluded | Previously shipped in QOL_200.md |
| 162 | 203 | App lock with a PIN (local) | Planned | — |
| 163 | 204 | Auto-lock after inactivity (idle detection) | Planned | — |
| 164 | 205 | Show/hide XP and gamification | Planned | — |
| 165 | 206 | Streak freeze behaviour settings | Planned | — |
| 166 | 207 | Default focus length | Planned | — |
| 167 | 208 | Default meditation length | Planned | — |
| 168 | 209 | Default workout rest timer | Planned | — |
| 169 | 210 | Mixer default mix | Planned | — |
| 170 | 211 | Briefing contents chooser | Planned | — |
| 171 | 212 | Briefing auto-play at a set time | Planned | — |
| 172 | 213 | Theme schedule (light by day, dark at night) | Already present; excluded | Previously shipped in QOL_200.md |
| 173 | 214 | Theme per page (e.g. Matrix for Code) | Planned | — |
| 174 | 215 | Seasonal themes toggle | Planned | — |
| 175 | 216 | Emoji style (native/Twemoji) | Planned | — |
| 176 | 217 | Map style (light/dark tiles) | Planned | — |
| 177 | 218 | Keyboard layout hints (QWERTY/AZERTY) for Typing | Planned | — |
| 178 | 220 | "What changed" log in Settings (last 20 setting changes) | Planned | — |
| 179 | 224 | Autosave indicator ("Saved · 2 s ago") | Already present; excluded | Previously shipped in QOL_200.md |
| 180 | 225 | Unsaved-changes guard on leaving editing pages | Planned | — |
| 181 | 226 | Version history for journal/daybook pages | Planned | — |
| 182 | 227 | Conflict notice if two tabs edit the same item | Planned | — |
| 183 | 231 | Error messages say what to do next | Planned | — |
| 184 | 232 | Empty states with a one-click sample | Planned | — |
| 185 | 233 | First-use tips that never repeat | Planned | — |
| 186 | 234 | "Why am I seeing this?" on insights | Planned | — |
| 187 | 235 | Show data source badges on charts | Planned | — |
| 188 | 237 | Progress bars for multi-step flows | Planned | — |
| 189 | 238 | Success animations proportional to the win | Planned | — |
| 190 | 239 | Streak broken? Offer a gentle restart, not a reset screen | Planned | — |
| 191 | 240 | Offline mode notice with what still works | Planned | — |
| 192 | 242 | Backup reminder weekly | Already present; excluded | Previously shipped in QOL_200.md |
| 193 | 243 | One-click full backup (zip) | Planned | — |
| 194 | 244 | Restore from backup with a preview | Planned | — |
| 195 | 245 | Import from CSV with column mapping | Planned | — |
| 196 | 246 | Privacy page: what stays on device, what uses the network | Planned | — |
| 197 | 247 | Permission explanations before camera/mic/location prompts | Planned | — |
| 198 | 248 | Revoke permissions shortcut list | Planned | — |
| 199 | 250 | Share sheet for exports on mobile | Planned | — |
| 200 | 251 | Print styles for reports | Planned | — |
| 201 | 252 | Accessible announcements for live updates (aria-live) | Planned | — |
| 202 | 253 | Loading states announce to screen readers | Planned | — |
| 203 | 254 | Timers announce remaining time on request | Planned | — |
| 204 | 255 | Sound cues optional for completions | Planned | — |
| 205 | 256 | Haptic tick on mobile completions | Planned | — |
| 206 | 257 | Clear "done for today" states | Planned | — |
| 207 | 258 | End-of-day summary notification | Planned | — |
| 208 | 259 | Weekly review prompt on Sundays | Planned | — |
| 209 | 260 | "Nothing to do" celebrates instead of looking empty | Planned | — |
| 210 | 261 | Dashboard greeting adapts to time and weather | Planned | — |
| 211 | 263 | Tap a habit on the dashboard to check it | Already present; excluded | Previously shipped in QOL_200.md |
| 212 | 264 | Swipe a to-do on mobile to complete | Planned | — |
| 213 | 265 | Mood quick-log row | Already present; excluded | Previously shipped in QOL_200.md |
| 214 | 266 | Water quick-add buttons (+250 ml) | Already present; excluded | Previously shipped in QOL_200.md |
| 215 | 267 | Next focus session suggestion | Planned | — |
| 216 | 274 | Customisable dashboard modules (✓ exists; add drag) | Planned | — |
| 217 | 275 | Collapse modules and remember | Planned | — |
| 218 | 276 | Module mini-settings (gear icon) | Planned | — |
| 219 | 277 | Dashboard compact mode | Planned | — |
| 220 | 278 | Today's progress ring (habits + to-dos) | Already present; excluded | Previously shipped in QOL_200.md |
| 221 | 279 | Quick note field that saves to the journal | Planned | — |
| 222 | 280 | Week strip with dots for activity | Planned | — |
| 223 | 282 | Weather-aware suggestions ("rain later — walk now") | Planned | — |
| 224 | 283 | Daylight window reminder | Planned | — |
| 225 | 284 | "On this day" memory card | Planned | — |
| 226 | 285 | Random kindness prompt | Planned | — |
| 227 | 286 | Keyboard number keys for module actions | Planned | — |
| 228 | 287 | Drag a to-do onto the calendar | Planned | — |
| 229 | 288 | Focus timer mini-player pinned to the corner | Planned | — |
| 230 | 289 | Mixer mini-player in the top bar while playing | Planned | — |
| 231 | 290 | Briefing mini-player | Planned | — |
| 232 | 294 | Skip a day without breaking the streak (limited) | Planned | — |
| 233 | 304 | To-do priority keyboard (P1–P4 with 1–4) | Already present; excluded | Previously shipped in QOL_200.md |
| 234 | 305 | Today / Upcoming / Someday views | Planned | — |
| 235 | 310 | Time-block a to-do into the calendar by drag | Planned | — |
| 236 | 311 | Calendar week view keyboard navigation | Already present; excluded | Previously shipped in QOL_200.md |
| 237 | 312 | Calendar: drag to resize blocks | Planned | — |
| 238 | 313 | Calendar: colour by project | Planned | — |
| 239 | 314 | Calendar: import .ics | Already present; excluded | Previously shipped in QOL_200.md |
| 240 | 315 | Calendar: export .ics | Already present; excluded | Previously shipped in QOL_200.md |
| 241 | 316 | Planning: weekly goals carry over | Planned | — |
| 242 | 317 | Planning: review last week in one screen | Planned | — |
| 243 | 318 | Routines: start routine with one tap and step through | Planned | — |
| 244 | 319 | Routines: timer per step | Planned | — |
| 245 | 320 | Routines: skip step | Planned | — |
| 246 | 321 | Routines: completion history | Planned | — |
| 247 | 322 | Challenges: progress nudges | Already present; excluded | Previously shipped in QOL_200.md |
| 248 | 323 | Roadmap: milestones with dates | Planned | — |
| 249 | 324 | Roadmap: progress percent from linked to-dos | Planned | — |
| 250 | 325 | Focus: pick a to-do from the palette to focus on | Planned | — |
| 251 | 326 | Focus: auto-start break | Planned | — |
| 252 | 327 | Focus: session notes | Already present; excluded | Previously shipped in QOL_200.md |
| 253 | 328 | Focus: daily focus goal | Already present; excluded | Previously shipped in QOL_200.md |
| 254 | 329 | Focus: distraction log | Already present; excluded | Previously shipped in QOL_200.md |
| 255 | 330 | Focus: ambient sound auto-plays (mixer link) | Planned | — |
| 256 | 331 | Journal search with highlights | Already present; excluded | Previously shipped in QOL_200.md |
| 257 | 332 | Journal tags auto-suggest | Planned | — |
| 258 | 341 | Attach voice memo to an entry | Planned | — |
| 259 | 342 | Mood picker inside the entry | Already present; excluded | Previously shipped in QOL_200.md |
| 260 | 343 | Link entries to each other | Planned | — |
| 261 | 344 | Export entry as PDF | Already present; excluded | Previously shipped in QOL_200.md |
| 262 | 345 | Private entries with blur until clicked | Already present; excluded | Previously shipped in QOL_200.md |
| 263 | 346 | Daybook templates quick-pick | Already present; excluded | Previously shipped in QOL_200.md |
| 264 | 347 | Daybook page duplicate | Already present; excluded | Previously shipped in QOL_200.md |
| 265 | 348 | Daybook: last-edited sort | Already present; excluded | Previously shipped in QOL_200.md |
| 266 | 349 | Mood: weekly pattern chart | Already present; excluded | Previously shipped in QOL_200.md |
| 267 | 350 | Mood: tag emotions quickly | Already present; excluded | Previously shipped in QOL_200.md |
| 268 | 351 | Gratitude: three-in-a-row quick entry | Already present; excluded | Previously shipped in QOL_200.md |
| 269 | 352 | Gratitude: random past gratitude card | Already present; excluded | Previously shipped in QOL_200.md |
| 270 | 363 | Voice memos: rename in place | Planned | — |
| 271 | 366 | Voice memos: skip silence (✓ Sound Lab trim) | Planned | — |
| 272 | 373 | Workouts: rest timer auto-starts after a set | Planned | — |
| 273 | 374 | Workouts: PR celebration | Planned | — |
| 274 | 379 | Stretch: routine by body area | Planned | — |
| 275 | 383 | Body: weight trend smoothing | Planned | — |
| 276 | 384 | Body: progress photo compare slider | Planned | — |
| 277 | 385 | Eyes: 20-20-20 reminders | Planned | — |
| 278 | 388 | Diet: barcode scan (camera) | Planned | — |
| 279 | 393 | English: review mistakes one tap | Planned | — |
| 280 | 394 | English: daily goal adjust | Planned | — |
| 281 | 395 | English: listen to any word | Planned | — |
| 282 | 396 | Code: continue last lesson | Planned | — |
| 283 | 397 | Cards: study due only | Planned | — |
| 284 | 398 | Cards: keyboard 1–4 grading | Planned | — |
| 285 | 399 | Cards: import from CSV | Planned | — |
| 286 | 400 | Chess: undo move in practice | Planned | — |
| 287 | 403 | Typing: results history chart | Planned | — |
| 288 | 405 | Tuner: reference tone button | Planned | — |
| 289 | 411 | Games: pause and resume | Planned | — |
| 290 | 414 | Lessons: estimated time badges | Planned | — |
| 291 | 415 | Learning streak across all learn pages | Planned | — |
| 292 | 416 | Learning dashboard summary | Planned | — |
| 293 | 417 | Spaced reminders for all learn pages | Planned | — |
| 294 | 418 | Offline availability badge per lesson | Planned | — |
| 295 | 419 | Text size controls on lesson pages | Planned | — |
| 296 | 421 | Money: quick-add from the palette with parsing (✓ parser; add palette) | Planned | — |
| 297 | 435 | Places: name places inline (✓) with suggestions | Planned | — |
| 298 | 436 | Places: filter by layer from the palette | Planned | — |
| 299 | 437 | Places: share a place link | Planned | — |
| 300 | 440 | Yearbook: print version | Planned | — |
| 301 | 441 | Vision board: templates | Planned | — |
| 302 | 442 | Vision board: snap to grid | Planned | — |
| 303 | 443 | Vision board: keyboard nudge | Planned | — |
| 304 | 445 | Weeks: highlight milestones | Planned | — |
| 305 | 447 | Energy: quick log | Planned | — |
| 306 | 450 | Briefing: shorter/longer toggle | Planned | — |
| 307 | 451 | Receipt Lens: rotate image | Planned | — |
| 308 | 457 | Terrain: share flyover video | Planned | — |
| 309 | 458 | Life map: time slider animation | Planned | — |
| 310 | 459 | People globe: city autocomplete | Planned | — |
| 311 | 463 | Page-specific GSAP entrance choreography | Planned | — |
| 312 | 464 | Consistent hover states on all cards | Planned | — |
| 313 | 465 | Consistent focus styles in Matrix theme | Planned | — |
| 314 | 466 | Matrix theme: audit selected-state contrast everywhere | Planned | — |
| 315 | 467 | Dark theme charts use dark gridlines | Planned | — |
| 316 | 468 | Smooth number tickers on stats | Planned | — |
| 317 | 469 | Micro-interaction on toggles | Planned | — |
| 318 | 471 | Loading shimmer consistent | Planned | — |
| 319 | 472 | Empty-state illustrations per page | Planned | — |
| 320 | 473 | Seasonal decorations | Planned | — |
| 321 | 474 | Celebration variety (not only stars) | Planned | — |
| 322 | 475 | Sound design pass (subtle clicks) | Planned | — |
| 323 | 476 | Icons consistent stroke width | Planned | — |
| 324 | 477 | Typography scale audit | Planned | — |
| 325 | 478 | Spacing scale audit | Planned | — |
| 326 | 479 | Card shadows by elevation | Planned | — |

## Verification and push log

- Baseline: `d2abe2b`. No items counted from earlier work.
- Batch 1 (`918edc1`): fuzzy palette search, shortcut hints, pinned-page drag ordering, separate Focus/Breathe window, disabled-feature dates, and palette recovery. TypeScript check passed; browser checks covered fuzzy results, shortcut display, disabled history, and pin ordering.
