# Mindfulness dashboard feature plan

This implementation extends the existing React/Vite dashboard and its local `AppData`/`localStorage` architecture. Existing habit, journal, RPG, theme, and onboarding behavior remains the source of truth.

## 1. Elapsed Time Momentum Engine

- Add a persisted `momentum` record to the RPG model with `startedAt`, `resetAt`, and `shatteredAt` timestamps.
- Derive exact elapsed days/hours/minutes from the current clock and update the dashboard once per second.
- Treat the first rewarded activity as the start of a run; expose reset/shatter actions as explicit state transitions with a visible recovery path.
- Add pure engine tests for formatting, live elapsed values, and reset/shatter transitions.

## 2. Focus Quests with Adaptive Soundscapes

- Add a local-only focus quest state with a 25-minute duration, selected soundscape, started/completed/failed timestamps, and damage count.
- Build an accessible quest panel with a custom looping Web Audio oscillator/noise player (no remote audio dependency), mute/error states, and pause/complete controls.
- Detect page visibility changes while a quest is active; leaving before completion fails the quest and applies one damage point. Persist the result locally.
- Add pure engine tests for quest lifecycle and visibility-failure rules.

## 3. Scientific Lore Cards

- Add milestone definitions tied to existing XP/elapsed momentum thresholds.
- Render unlocked lore as animated, reduced-motion-safe SVG cards with plain-language evidence and a source link label; keep locked cards visibly discoverable.
- Add tests for deterministic unlock selection.

## 4. Behavior-Driven Action Contracts

- Add a local contract model with Given/When/Then text, creation timestamp, completion status, and a deterministic signature.
- Render contracts in the existing RPG visual language as terminal/parchment panels with a signed/unsigned state and keyboard-accessible completion controls.
- Add tests for contract normalization and signature stability.

## 5. Inventory Archive

- Project completed journal sessions into searchable, tag-filterable archive entries.
- Render entries as an icon grid with key-item/status-ailment semantics, readable labels, empty states, and detail disclosure.
- Keep archive derived from existing sessions so there is no unsupported backend behavior; search and tags remain local UI state.
- Add focused UI and model tests for filtering and accessibility labels.

## Validation and delivery

- Implement each feature in the order above, running the smallest relevant Jest test selection plus TypeScript/build checks after each increment.
- Preserve the incumbent lavender/forest/amber RPG palette, typography, pixel-art accents, dark mode, responsive breakpoints, and reduced-motion behavior.
- Run the Impeccable detector once after UI work, then run the final lint/build/test commands.
- Commit each coherent feature increment with the required Copilot co-author trailer and push the completed branch when the remote permits it.
