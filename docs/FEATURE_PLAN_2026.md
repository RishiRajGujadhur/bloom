# Bloom — Feature Plan (Round 6)

Every item below is **switchable in Settings → Choose your tools** (a feature
flag with an icon, English + French copy), follows the existing theme tokens,
respects `prefers-reduced-motion`, and stores its data locally
(localStorage/Dexie) unless noted. No item duplicates an existing feature;
where one overlaps, it **extends** the existing screen instead.

Status legend: ✅ done · 🔁 changed from original idea (reason noted)

| ✅ | # | Feature | Flag | Where it lives | Library |
|---|---|---------|------|----------------|---------|
| ✅ | 1 | Juicy completions — pixel coin/star bursts on habit check-ins, routine finishes, milestone streaks (big fountain at 30/100 days) | `celebrations` | Global helper, called from habit/routine/challenge/login flows | `canvas-confetti` (custom pixel shapes) |
| ✅ | 2 | Burn & Release — type a worry, it becomes a physical card; drag it into an animated campfire where it shrinks into smoke | `burnRelease` | New page **Let it go**, plus a shortcut from the Fear Setting / Shadow Work Daybook pages | `@use-gesture/react` + `@react-spring/web` |
| ✅ | 3 | Interactive Garage — isometric garage for collectible cars; park/arrange cars on pads; buy garage upgrades (charging station, display pad, neon sign, plants) with petals | `garage` | New **Garage** tab inside My Collectibles | CSS isometric + existing `CarSprite`, petal shop balance |
| ✅ | 4 | Precision Urge Clock — live days/hours/minutes/seconds since the last slip per urge, personal best as a high score | `urgeClock` | Urges page (extends it) | — |
| ✅ | 5 | Classical Focus Room — pixel room with your avatar at a desk, Pomodoro timer, one-tap classical/cinematic soundscape | `focusRoom` | New page **Focus room** | Existing Howler mixer (+ new "Classical" preset) |
| ✅ | 6 | Time Capsule — morning card surfacing "on this day" journal/Daybook entries from a month / a year ago, or a random gratitude note | `timeCapsule` | Dashboard card (customisable module) | — |
| ✅ | 7 | Thought Diffing — compare a Daybook page with your previous page of the same mode; strike-through red for what faded, green for what's new | `thoughtDiff` | Daybook editor ("Compare with last time") | `diff` |
| ✅ | 8 | Query builder — visual AND/OR rules over mood, mode, weekday, date, habit completion, tags and words; results list | `queryBuilder` | New page **Explore data** | `react-querybuilder` |
| ✅ | 9 | Year in Review book — typeset PDF of the year (cover, stats, Daybook pages, journal entries, gratitude), page numbers | `yearbook` | New page **Year book** | `@react-pdf/renderer` (lazy-loaded) |
| ✅ | 10 | 3D Memory Palace — 365 glowing blocks in a ring (InstancedMesh); drag/wheel with inertia, snap to nearest day, click to zoom and read | `memoryPalace` | New page **Memory palace** | Three.js InstancedMesh + GSAP `Observer` |
| ✅ | 11 | Skill Constellation — RPG skills and stat milestones as 3D stars; click flies the camera there while HTML details stagger in | `skillConstellation` | Growth page (toggle "Constellation") | R3F + GSAP |
| ✅ | 12 | Streak Journey — scroll the page and the camera travels a 3D path of your longest habit streak, with a monument every 7 days | `streakJourney` | New page **Streak journey** | Three.js `CatmullRomCurve3` + GSAP `ScrollTrigger` |
| ✅ | 13 | Mood Orb — liquid-glass shader sphere; the Anxious→Calm slider tweens noise, colour and roughness | `moodOrb` | Mood check-in (new "Orb" mode) | R3F custom shader + GSAP |
| ✅ | 14 | Places map — opt-in location on mood check-ins and Daybook pages; dark map with mood-coloured markers and a heat layer; tiles cached for offline | `placesMap` | New page **Places** | `leaflet` + `react-leaflet`, Cache Storage |

## Cross-cutting

- **Navigation** — with ~30 destinations the sidebar gets **grouped sections**
  (Today, Mind, Growth, Explore) so it stays scannable.
- **Search** — every new page is reachable from the Ctrl/⌘ K palette.
- **Guides** — each new page gets 2 wizard tour steps.
- **Tests** — pure logic (urge clock maths, query evaluation, diffing,
  time-capsule selection, garage layout, journey milestones) is unit-tested.

## Findings & changes while building

- 🔁 **Juicy completions** — bursts use two custom pixel shapes (an 8-bit coin
  and a plus-star) via `confetti.shapeFromPath`; a gold *fountain* fires for
  7/30/60/100/365-day streaks and login milestones. Also used for routine
  completion, shop purchases, releasing a worry and publishing the year book.
- 🔁 **Burn & release** — only a *count* of released thoughts is stored; the
  words are never saved (it is a letting-go ritual). A flick with momentum
  towards the fire also releases, and a **Release** button is the keyboard /
  no-drag alternative (UX rule 25).
- 🔁 **Garage** — upgrades are sold in the existing Petal shop (new *Garage*
  tab) instead of a second shop, so there's one currency and one store.
- 🔁 **Focus room** — reuses the existing focus session engine (so sessions
  still plant World trees and count toward goals) rather than a second timer;
  added *Classical Study* and *Cinematic Score* presets to the audio mixer
  built from the existing piano/strings/cello tracks.
- 🔁 **Thought diffing** — compares with the *previous page of the same
  mode* (not strictly "last year") so it's useful from week two; the
  Daybook now stores every page separately, which made this possible.
- 🔁 **Query builder** — evaluation runs in memory over a joined record set
  (journal + Daybook + mood + habits-done-that-day) instead of Dexie queries,
  because most data lives in localStorage and a join is needed anyway.
- 🔁 **Year book** — the PDF engine (~440 KB gzipped) is lazy-loaded only
  when you press *Download*; uses built-in PDF fonts so it works offline.
- **3D features** share a `Scene3D` wrapper with WebGL detection and an
  error boundary, and are only imported when shown (keeps Three.js out of
  the main bundle and out of unit tests).
- **Mood orb** — a three-stop colour blend (red → amber → teal) reads better
  than a two-colour mix, which turned muddy purple in the middle.
- **Places** — opt-in with an explicit consent screen, coordinates rounded to
  ~10 m, "Turn off and erase" wipes points *and* cached tiles. Tiles come from
  OpenStreetMap and are cached in Cache Storage for offline use.
- **Navigation** — the sidebar is now grouped (Today · Grow · Mind · Explore)
  with ~33 destinations; collapsed rail shows dividers instead of labels.
- **Tests** — `tests/round6.test.ts` covers urge clock maths, garage parking,
  capsule selection, diff counts, AND/OR/NOT evaluation, TipTap → book
  blocks, palace snapping, constellation lighting, journey milestones, orb
  mapping, place clustering and milestone streaks.

---

# Round 7 — Counters, drawn achievements and sub-features

| ✅ | Feature | Flag | Where | Library |
|---|---|---|---|---|
| ✅ | **Time since** — split-flap boards that flip every second: “With Bloom”, time since last slip per urge, and your own counters (count up since / count down until, e.g. an apartment handover) | `timeSince` | Dashboard “More for you” | `react-flip-numbers` + `date-fns` |
| ✅ | **Drawn achievements** — a sword (skill unlock), a medal (level-up) or a tree (7/30/100/365-day streak) is drawn stroke by stroke, then fills with colour | `drawnAchievements` | Global overlay | `vivus` |

## Sub-features

Every feature now has **2–3 sub-features** (74 in total), listed in
`src/features/subFeatures.ts` and switchable under each feature card in
Settings (“N options”). Stored as `settings.sub["feature.option"]`; a missing
entry means *on*, so new options appear without migrating saved settings, and
turning a parent feature off disables its options. Imported/exported with the
settings JSON.

Findings:
- 🔁 Weekly raid “rewards” became **damage labels** — rewards are shared with
  other systems, so hiding them would be misleading.
- 🔁 Guide wizard/reveal options live under *Walkthrough tour* but ignore that
  parent flag (it is off by default and controls the first-run tour, not
  **Guide me**).
- 🔁 Urge *context capture* off records zeros for session length and tab
  switches; time-of-day buckets are still derived from the timestamp.
- `react-flip-numbers` is CommonJS; its default export is unwrapped for Vite.
- Tests: `tests/subFeatures.test.ts` checks every feature has ≥2 unique
  options, default-on/parent semantics, and counter maths.

---

# Round 8 — Flow topography, posture guard, 5+ options per feature

| ✅ | Feature | Flag | Where | Library |
|---|---|---|---|---|
| ✅ | **Flow topography** — keystroke timing (never the keys) becomes a layered mountain range under the Daybook page: steady fast typing raises smooth peaks, pauses make valleys, backspacing carves jagged ravines. Saved with the page as a fingerprint (shown at the top next time, and as a thumbnail on “Your pages”), with WPM and % time in flow | `flowTopography` | Daybook editor | `d3-shape` |
| ✅ | **Posture guard** — webcam pose detection runs on-device; calibrate “sitting tall”, then a 0–100 score updates each second. 5 min of slouching → warning; ignored for 2 more → poison (−HP, repeating); 20 min upright → stamina (+HP). Works in the background across pages | `postureGuard` | New **Posture guard** page + global warning | `@mediapipe/tasks-vision` (PoseLandmarker lite) |

## Sub-features: 209 across 39 features

Every feature now has **≥ 5** options (Language has 4 — there isn't a
meaningful fifth). Visual options are CSS-gated through
`html[data-off~="feature.option"]` (`src/styles/subFeatureGates.css`);
behavioural ones use `subOn()`.

Findings:
- 🔁 `@mediapipe/pose` is deprecated; its successor `@mediapipe/tasks-vision`
  (PoseLandmarker) is used. The ~12 MB WASM runtime loads from jsDelivr and the
  ~6 MB model from Google's MediaPipe bucket **only after opt-in**; inference
  and all data stay on-device. The runtime is lazy-loaded only after the
  Posture page is first opened.
- 🔁 Posture effects are stored as `rpg.posture` events and folded into the
  existing HP calculation, so HP stays derived (never stored directly).
- 🐛 Fixed: the Daybook editor remounted after its first autosave (its key
  used the entry id), which reset keystroke history and could drop focus
  mid-sentence. It now keys on the opening session.
- 🔁 “Extra goals” (adaptive goals) ignores its parent switch so turning off
  adaptive targets doesn’t hide goals.
- Jest now transforms the ESM-only `d3-shape`/`d3-path`.
