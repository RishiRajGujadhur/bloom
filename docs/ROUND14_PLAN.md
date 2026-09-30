# Bloom expansion — Round 14

Created: 2026-09-26. Status: implementation underway; Decision studio validated.

## Scope and delivery contract

- Introduce **25 genuinely new features**, each with **at least 20 functional options or subfeatures**. Existing-feature improvements are additional and do not count toward 25.
- Add **one new open-source dependency per feature**, used in its actual behavior. Verify license, browser suitability, API, bundle impact, and overlap before installing. Candidates below are not installation claims.
- Use **GSAP and SVG in every new feature**, following the app's sleep/tai chi visual language. Provide equivalent information without animation, obey reduced motion, clean up animations on unmount, and expose animation settings.
- Update Settings with feature visibility and relevant behavior controls. Controls must affect functionality; twenty decorative toggles do not meet the requirement.
- Finish, test, commit, and **push each feature individually** before marking it shipped. Record the commit and push outcome below. Do not combine all 25 into one delivery commit.
- Enhance existing brain games, exercise guides with wheelchair mode, and memory palace alongside the new work.
- Remain local-first and inclusive. No account, paid service, hidden network calls, health diagnosis, or assumed physical ability.

## Repository findings

Existing tools already include: tasks/projects/calendar, daily flow, habits, focus, urges, sleep, tai chi, exercise guides, workouts, intervals, yoga, mobility, runs, body tracking, food/recipes, fasting, soundscapes, meditation, breathwork, mala, journals, mood, gratitude, flashcards, mind maps, memory palace, daylight, eye care, affirmations, routines, goals, and five brain games.

Key integration points: `src/App.tsx`, `src/SettingsPage.tsx`, `src/settings/featureCatalog.ts`, `src/features/subFeatures.ts`, `src/components/layout/Sidebar.tsx`, `src/components/layout/FeatureGuide.tsx`, and the existing activity log. Existing app data and exports must remain compatible.

The current memory palace displays an annual journal ring; a user-authored loci route and recall workflow are missing. Existing games are N-back, memory grid, Stroop, reaction, and speed maths. Existing exercise guides do not provide a wheelchair-only library.

## Architecture and quality gates

1. Add a discoverable **Life tools** area with focused workspaces; avoid placing 25 more top-level navigation items in the sidebar.
2. Use a typed registry for labels, descriptions, settings, library attribution, and feature-specific options. Share presentation and persistence infrastructure while keeping each tool's domain logic explicit.
3. Shared records carry stable IDs, feature origin, timestamps, selected option, notes, and completion state. An explicit user action can send a next step to today's intentions. Prevent duplicate transfers.
4. Connect tools through a shared daily queue and activity history, with links back to the originating workspace and existing relevant tools. Do not silently copy private notes into unrelated areas.
5. Persist feature preferences and drafts. Validate restored data, report save failures, preserve malformed storage, and provide export/recovery. Disabled features retain their data.
6. Provide keyboard operation, labeled inputs, comfortable touch targets, responsive layouts, clear empty/error states, and reduced-motion behavior. No forced timers or speed scoring in accessible modes.
7. Test domain calculations, settings behavior, reload persistence, queue handoff, deletion, malformed storage, and important user journeys. Run build/lint and relevant tests before each push; finish with regression and desktop/mobile browser checks.
8. Each tool below needs 20 implemented options, not merely a list of promises. Record any scope adjustment here before implementation.

## 25 new features and acceptance scope

Each numbered list below contains exactly 20 planned functional options. Libraries are candidates pending verification.

### 01. Decision studio — candidate: `decimal.js`

Purpose: make small personal decisions with explicit criteria and tradeoffs.

Options: 1) create decision; 2) alternatives; 3) weighted criteria; 4) criterion scores; 5) must-have filter; 6) cost criterion; 7) time criterion; 8) energy criterion; 9) accessibility criterion; 10) reversibility; 11) uncertainty notes; 12) pros; 13) cons; 14) ranked comparison; 15) sensitivity adjustment; 16) tie handling; 17) decision deadline; 18) decision journal; 19) review outcome; 20) send next action to daily plan.

### 02. Personal boundaries — candidate: `mustache`

Purpose: prepare clear requests and boundaries using locally rendered message templates.

Options: 1) work hours; 2) response times; 3) meeting decline; 4) scope change; 5) family visits; 6) personal space; 7) lending possessions; 8) money requests; 9) digital availability; 10) recovery privacy; 11) food preferences; 12) mobility assistance; 13) sensory needs; 14) quiet time; 15) rest time; 16) caregiving limits; 17) unsolicited advice; 18) conflict pause; 19) follow-up boundary; 20) respectful escalation. Each template has editable context, request, and follow-through, with preview/copy/save.

### 03. Connection garden — candidate: `fuse.js`

Purpose: maintain meaningful contact without uploading an address book.

Options: 1) contact cards; 2) fuzzy search; 3) preferred names; 4) relationship circles; 5) preferred channel; 6) contact cadence; 7) last contact; 8) due contacts; 9) conversation notes; 10) important dates; 11) shared interests; 12) accessibility needs; 13) timezones; 14) quiet hours; 15) gratitude prompt; 16) invitation prompt; 17) practical support prompt; 18) follow-up action; 19) archive contact; 20) contact history.

### 04. Skill practice planner — candidate: `ts-fsrs`

Purpose: schedule deliberate practice and reviews beyond existing flashcards.

Options: 1) skill creation; 2) skill decomposition; 3) practice objective; 4) baseline; 5) evidence note; 6) short session; 7) longer session; 8) due review; 9) again rating; 10) hard rating; 11) good rating; 12) easy rating; 13) next review; 14) session history; 15) missed-day recovery; 16) priority; 17) practice context; 18) confidence; 19) reflection; 20) daily-plan handoff.

### 05. Reading companion — candidate: `reading-time`

Purpose: turn reading into manageable sessions and useful recall.

Options: 1) book/article record; 2) author; 3) source link; 4) pasted excerpt; 5) reading-time estimate; 6) reading speed; 7) session budget; 8) page target; 9) current page; 10) total pages; 11) progress; 12) vocabulary; 13) questions; 14) key idea; 15) personal connection; 16) action takeaway; 17) recall prompt; 18) revisit date; 19) finished shelf; 20) reading history.

### 06. Clear writing lab — candidate: `compromise`

Purpose: edit personal writing with explainable local language analysis.

Options: 1) draft; 2) audience; 3) purpose; 4) word count; 5) sentence count; 6) paragraph count; 7) long sentences; 8) verbs; 9) nouns; 10) adjectives; 11) repeated words; 12) question detection; 13) action sentence; 14) opening revision; 15) closing revision; 16) jargon checklist; 17) tone checklist; 18) compare draft; 19) copy result; 20) saved versions.

### 07. Programmer shutdown desk — candidate: `fast-diff`

Purpose: preserve context when stopping coding so returning is easier.

Options: 1) project; 2) branch note; 3) current objective; 4) last working state; 5) reproduction steps; 6) expected behavior; 7) actual behavior; 8) hypothesis; 9) attempted fix; 10) test command; 11) test result; 12) blocker; 13) next smallest step; 14) reference links; 15) before note; 16) after note; 17) change comparison; 18) shutdown checklist; 19) resume card; 20) focus handoff.

### 08. Meeting preparation — candidate: `ics`

Purpose: prepare inclusive meetings and export an explicit calendar invitation file.

Options: 1) title; 2) objective; 3) date; 4) start time; 5) duration; 6) timezone; 7) agenda items; 8) item budgets; 9) attendee notes; 10) access requirements; 11) pre-reading; 12) decisions needed; 13) questions; 14) facilitator; 15) break allocation; 16) notes; 17) action owners; 18) follow-up dates; 19) calendar file export; 20) post-meeting review.

### 09. Timezone bridge — candidate: `luxon`

Purpose: plan humane overlap between Mauritius and other locations.

Options: 1) home timezone; 2) second timezone; 3) third timezone; 4) date selection; 5) local start; 6) converted times; 7) workday start; 8) workday end; 9) quiet start; 10) quiet end; 11) overlap slots; 12) duration; 13) daylight-saving indication; 14) next-day indication; 15) Mauritius preset; 16) UTC preset; 17) preferred slot; 18) copy summary; 19) saved arrangements; 20) calendar handoff.

### 10. Household care — candidate: `cron-parser`

Purpose: maintain a home with adjustable effort and accessible task variants.

Options: 1) kitchen surfaces; 2) fridge review; 3) pantry review; 4) laundry; 5) bedding; 6) bathroom; 7) floors; 8) desk; 9) doorway clearance; 10) charging station; 11) waste sorting; 12) plants; 13) water filters; 14) smoke-alarm reminder; 15) appliance care; 16) wheelchair route clearance; 17) seated cleaning variant; 18) shared responsibility; 19) repeat schedule; 20) completion history.

### 11. Pantry use-first — candidate: `match-sorter`

Purpose: reduce waste by tracking what to use soon, without replacing food logging.

Options: 1) item name; 2) fuzzy lookup; 3) quantity; 4) unit; 5) storage location; 6) purchased date; 7) opened date; 8) label date; 9) date type; 10) use-first order; 11) consumed amount; 12) waste amount; 13) reason discarded; 14) freezer marker; 15) shopping flag; 16) meal idea; 17) dietary notes; 18) accessibility note; 19) archived stock; 20) recipe handoff. Do not infer food safety from dates.

### 12. Shopping intention list — candidate: `currency.js`

Purpose: prepare deliberate purchases with transparent totals, including MUR.

Options: 1) item; 2) category; 3) quantity; 4) unit price; 5) currency; 6) exact subtotal; 7) budget; 8) remaining budget; 9) need/want; 10) wait-until date; 11) alternative; 12) borrow option; 13) repair option; 14) shop/location; 15) accessible delivery; 16) purchased state; 17) recurring item; 18) notes; 19) saved lists; 20) export. No exchange rates or financial advice.

### 13. Repair and reuse notebook — candidate: `file-saver`

Purpose: make repair attempts and maintenance information retrievable.

Options: 1) object; 2) model; 3) issue; 4) purchase date; 5) warranty note; 6) manual link; 7) repairability check; 8) safety stop; 9) tools; 10) parts; 11) estimate; 12) attempt log; 13) outcome; 14) professional-help note; 15) next check; 16) borrow/lend note; 17) donation plan; 18) recycling plan; 19) download repair card; 20) history.

### 14. Accessible outing planner — candidate: `geolib`

Purpose: prepare an outing using user-confirmed accessibility details.

Options: 1) destination; 2) coordinates; 3) approximate straight-line distance; 4) transport; 5) step-free confirmation; 6) entrance width note; 7) lift note; 8) accessible toilet; 9) seating; 10) shade; 11) quiet space; 12) surface note; 13) companion; 14) contact note; 15) opening-hours note; 16) weather-check link; 17) packing; 18) return plan; 19) backup destination; 20) post-visit observations. Never label a route accessible based on distance alone.

### 15. Mauritius day planner — candidate: `@internationalized/date`

Purpose: organize everyday island life with explicit local date/time handling.

Options: 1) Indian/Mauritius date; 2) appointment; 3) errand area; 4) travel buffer; 5) bus note; 6) parking note; 7) accessibility verification; 8) shade break; 9) rain backup; 10) water packing; 11) document checklist; 12) market list; 13) payment note; 14) phone charging; 15) contact details; 16) family pickup; 17) quiet destination; 18) opening-hours verification; 19) return check-in; 20) daily-plan handoff. No invented live schedules or conditions.

### 16. Sensory comfort map — candidate: `culori`

Purpose: record and design comfortable environments.

Options: 1) place; 2) light level; 3) sound level; 4) crowding; 5) temperature preference; 6) texture note; 7) scent note; 8) seating; 9) movement space; 10) escape route; 11) comfort palette; 12) contrast preview; 13) quiet kit; 14) headphones preference; 15) break signal; 16) trusted companion; 17) communication preference; 18) recovery time; 19) before/after comfort; 20) saved environment profiles.

### 17. Energy envelope — candidate: `d3-array`

Purpose: budget user-defined effort without prescribing activity or treatment.

Options: 1) daily capacity; 2) task effort; 3) rest allocation; 4) reserve; 5) remaining capacity; 6) physical effort; 7) cognitive effort; 8) social effort; 9) low-energy variant; 10) postpone; 11) split task; 12) delegate note; 13) actual effort; 14) morning check-in; 15) midday check-in; 16) evening check-in; 17) rolling median; 18) pattern chart; 19) capacity override; 20) plan handoff.

### 18. Support preparation cards — candidate: `qrcode`

Purpose: prepare a user-authored support plan without automating contact or treatment.

Options: 1) early signals; 2) grounding preference; 3) safe place; 4) supportive person; 5) preferred contact method; 6) contact link; 7) optional QR for contact link only; 8) helpful words; 9) unhelpful words; 10) practical support; 11) privacy boundary; 12) accessibility need; 13) recovery reason; 14) next ten minutes; 15) food/rest check; 16) urge-tool link; 17) professional contact supplied by user; 18) offline card; 19) review date; 20) rehearsal. No embedded private notes in QR codes by default.

### 19. Kindness projects — candidate: `nanoid`

Purpose: turn small acts of service into manageable, private projects.

Options: 1) listening; 2) appreciation; 3) practical help; 4) knowledge sharing; 5) accessible invitation; 6) checking in; 7) community cleanup; 8) donation preparation; 9) mentoring; 10) translation help; 11) meal sharing; 12) repair help; 13) digital assistance; 14) advocacy preparation; 15) kindness to self; 16) anonymity preference; 17) time budget; 18) consent note; 19) outcome reflection; 20) follow-up. Do not contact anyone automatically.

### 20. Values compass — candidate: `d3-scale`

Purpose: compare chosen values with how time was actually spent.

Options: 1) care; 2) learning; 3) creativity; 4) integrity; 5) spirituality; 6) community; 7) autonomy; 8) rest; 9) curiosity; 10) stewardship; 11) courage; 12) simplicity; 13) belonging; 14) fairness; 15) play; 16) choose priorities; 17) importance rating; 18) lived-alignment rating; 19) visual comparison; 20) next aligned action.

### 21. Personal experiment notebook — candidate: `jstat`

Purpose: explore low-risk everyday changes with honest descriptive summaries.

Options: 1) question; 2) hypothesis; 3) single change; 4) baseline period; 5) trial period; 6) outcome definition; 7) unit; 8) daily observation; 9) missing-day marker; 10) context note; 11) baseline mean; 12) trial mean; 13) median; 14) variability; 15) sample counts; 16) visual comparison; 17) stop rule; 18) interpretation; 19) next experiment; 20) export. No causal or clinical claims from small personal samples.

### 22. Declutter pathways — candidate: `@dagrejs/dagre`

Purpose: break an overwhelming space into a small dependency-aware path.

Options: 1) space; 2) zone; 3) photo-free description; 4) keep; 5) relocate; 6) repair; 7) donate; 8) recycle; 9) discard; 10) unsure box; 11) review date; 12) seated reach note; 13) route clearance; 14) five-minute task; 15) energy estimate; 16) dependencies; 17) SVG layout; 18) completion; 19) reusable checklist; 20) daily-plan handoff.

### 23. Communication rehearsal — candidate: `string-similarity-js`

Purpose: practice expressing a request clearly, with private local comparison.

Options: 1) situation; 2) observation; 3) feeling; 4) need; 5) request; 6) listener perspective; 7) desired outcome; 8) boundary; 9) opening line; 10) clarification question; 11) pause phrase; 12) repair phrase; 13) disagreement phrase; 14) closing line; 15) reference script; 16) recalled script; 17) text-similarity feedback; 18) self-rating; 19) practice history; 20) next conversation plan. Similarity is a text comparison, not a communication-quality score.

### 24. Digital document checklist — candidate: `papaparse`

Purpose: organize document metadata and preparation lists without storing identity documents.

Options: 1) title; 2) category; 3) storage-location note; 4) owner nickname; 5) issue date; 6) expiry date; 7) review date; 8) renewal checklist; 9) appointment note; 10) fee note; 11) copy-needed flag; 12) translation-needed flag; 13) accessibility arrangement; 14) status; 15) priority; 16) search; 17) CSV export; 18) validated CSV import; 19) duplicate preview; 20) daily-plan handoff.

### 25. Life review and next chapter — candidate: `@observablehq/plot`

Purpose: connect completed activity across the new tools into an intentional next week.

Options: 1) date range; 2) activity totals; 3) completion timeline; 4) effort distribution; 5) tool distribution; 6) unfinished steps; 7) carried-forward steps; 8) connection reflection; 9) learning reflection; 10) access reflection; 11) rest reflection; 12) values reflection; 13) highlight; 14) challenge; 15) what to stop; 16) what to continue; 17) what to start; 18) next-week priorities; 19) review archive; 20) shared-plan handoff.

## Existing-feature enhancements (additional scope)

### Wheelchair exercise mode

- Add a clearly labeled seated/wheelchair filter and supported figure; do not merely rename standing exercises.
- Include gentle upper-body options with individual cues, range adjustments, rest, and an explicit no-standing/no-floor-transfer workflow.
- Provide left/right/both-arm variants where meaningful, supported-trunk alternatives, optional manual progression, and pain/discomfort stop cues.
- Keep settings persistent; existing exercise selections remain available outside wheelchair mode.
- Reference: https://www.nhs.uk/live-well/exercise/wheelchair-users-fitness-advice/ — emphasizes that suitability depends on ability and that repeated pushing can strain shoulders. Avoid promises of universal suitability.

### Brain-training modes

- Add sequence recall, reverse sequence, digit span, letter span, number ordering, and rule-switching modes.
- Offer untimed practice and optional timed challenges, adjustable length/difficulty, keyboard input, explanatory feedback, restart, and separate result histories.
- Do not claim game scores diagnose or improve general intelligence.

### Memory palace

- Preserve the existing annual journal visualization.
- Add named palaces, ordered loci, location cues, memorable associations, forward/reverse traversal, answer-hidden recall, user-rated recall, and due-review scheduling.
- Allow reorder/edit/delete, multiple routes, progress summaries, and export.
- Research consulted: https://pmc.ncbi.nlm.nih.gov/articles/PMC7929507/ and https://pubmed.ncbi.nlm.nih.gov/23098905/ — ordered navigation and item/location associations inform the design, without claiming guaranteed outcomes.

## Shipping ledger

Use: `planned → implementing → validated → committed → pushed`. A commit hash alone does not prove a push succeeded.

| # | Feature | Status | Tests / visual QA | Commit | Push |
|---|---|---|---|---|---|
| 01 | Decision studio | Pushed | 9 Jest tests; build/lint; browser save/reload/task handoff | e1fe55c | Confirmed |
| 02 | Personal boundaries | Pushed | TypeScript, lint, 11 tests; browser template preview | 3bd94f9 | Confirmed |
| 03 | Connection garden | Pushed | TypeScript, lint, 13 tests; seated-only library verified in browser | 28eb7b7 | Confirmed |
| 04 | Skill practice planner | Validated | 14 tests, TypeScript, lint; memory route enhancement | See feature commit | Pending |
| 05 | Reading companion | Pushed | TypeScript, lint, domain tests | 5b3b1ca | Confirmed |
| 06 | Clear writing lab | Pushed | TypeScript, lint, domain tests | 76c4bfc | Confirmed |
| 07 | Programmer shutdown desk | Pushed | TypeScript, lint, domain tests | fa66033 | Confirmed |
| 08 | Meeting preparation | Pushed | TypeScript, lint, domain tests | 706d07d | Confirmed |
| 09 | Timezone bridge | Planned | — | — | — |
| 10 | Household care | Planned | — | — | — |
| 11 | Pantry use-first | Planned | — | — | — |
| 12 | Shopping intention list | Planned | — | — | — |
| 13 | Repair and reuse notebook | Planned | — | — | — |
| 14 | Accessible outing planner | Planned | — | — | — |
| 15 | Mauritius day planner | Planned | — | — | — |
| 16 | Sensory comfort map | Planned | — | — | — |
| 17 | Energy envelope | Planned | — | — | — |
| 18 | Support preparation cards | Planned | — | — | — |
| 19 | Kindness projects | Planned | — | — | — |
| 20 | Values compass | Planned | — | — | — |
| 21 | Personal experiment notebook | Planned | — | — | — |
| 22 | Declutter pathways | Planned | — | — | — |
| 23 | Communication rehearsal | Planned | — | — | — |
| 24 | Digital document checklist | Planned | — | — | — |
| 25 | Life review and next chapter | Planned | — | — | — |

## Immediate next steps

1. Verify candidate libraries and replace unsuitable choices before coding.
2. Implement the shared data/settings/navigation foundation with Decision studio.
3. Validate the first vertical slice (create → edit → compare → save → reload → daily-plan handoff) before replicating infrastructure.
4. Ship each feature separately and update this ledger with evidence.
5. Complete the three existing-feature enhancements and final cross-feature regression review.

