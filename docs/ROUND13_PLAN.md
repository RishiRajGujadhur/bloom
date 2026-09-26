# Round 13 — 25 features for body, mind and focus

Goal: bring Bloom to the level of the best wellbeing apps — **Headspace / Calm**
(meditation, sleep sounds), **Brain.fm** (functional focus music), **Better Body /
Freeletics / Strong** (guided exercise, workout logging), **Down Dog** (yoga
flows), **Zero** (fasting), **Elevate** (brain training), **Day One / GoodNotes**
(journaling, handwriting), **Anki** (spaced repetition) and **Opal / One Sec**
(digital wellbeing) — while keeping Bloom's one core loop
(see [`BLOOM_UX_PRINCIPLES.md`](BLOOM_UX_PRINCIPLES.md)).

## Rules for every feature

1. **At least one new open-source library** (MIT/BSD), lazy-loaded with the page.
2. **At least 10 sub-features**, each a real behaviour with its own Settings switch.
3. **Studio layout**: fits the viewport (almost no page scrollbar); tabs slide
   between panels with GSAP; inputs are **sliders** wherever a number is chosen;
   short labels, little prose.
4. **A living scene**: every page has an animated SVG/GSAP backdrop in the
   spirit of Monk mode, Tai Chi and the Sleep sky.
5. Connects to the loop: finishing a session counts toward Bloom Growth, the
   Now card and the Memory Timeline where it makes sense.
6. Accessible (keyboard, labels, reduced motion), on-device data only.
7. **Commit and push after each feature.**

## Settings

- **Categories**: every feature belongs to one of *Today & planning · Productivity
  · Mind & calm · Body & movement · Nutrition · Journal & reflection · Growth &
  play · Insights · Look & feel*. Each category is a horizontal slider of cards
  with "all on / all off".
- **Configurations dropdown**: *Everything · Balanced · Minimal · Calm mind ·
  Body & fitness · Deep work · Nourish · Journaling · Gamified*. Picking one
  switches many features at once; changing a switch afterwards shows *Custom*.
- Search box to filter features by name.

## The 25 features

| ✅ | Feature (flag · page) | Inspired by | New library | 10 sub-features |
|---|---|---|---|---|
| ✅ 1 | **Exercise guides** `exerciseGuides` · Exercises | Better Body, Freeletics | `animejs` | animated form figure · muscle map · form cues · common mistakes · tempo metronome · slow motion · mirror view · filters (muscle/equipment/level) · favourites · voice coach |
| ✅ 2 | **Workout log** `workoutLog` · Workouts | Strong, Hevy | `chart.js` + `react-chartjs-2` | templates (push/pull/legs…) · set sliders · rest timer · RPE · PR detection · e1RM · volume chart · exercise progress chart · plate calculator · weekly muscle volume |
| ✅ 3 | **Interval coach** `intervalCoach` · Intervals | Seconds, C25K | `easytimer.js` | presets (Tabata, HIIT, EMOM) · custom builder · voice cues · beeps · progress ring · warm-up/cool-down · rounds · Couch-to-5K plan · calorie estimate · log to workouts |
| ✅ 4 | **Yoga flow** `yogaFlow` · Yoga | Down Dog | `@dnd-kit/core` + `sortable` | pose library · drag-and-drop flow builder · hold sliders · animated pose-to-pose player · breath cue · Sanskrit names · preset flows · saved flows · voice · flow timeline |
| ✅ 5 | **Stretch & mobility** `mobility` · Stretch | Bend, Pliability | `react-countdown-circle-timer` | body map · routines by area · circular hold timer · switch-sides prompt · desk-break mode · auto-advance · voice · chime · stiffness check-in · history |
| ✅ 6 | **Run & walk** `runTracker` · Run | Strava, Nike Run Club | `@turf/turf` | GPS tracking · live map route · km/mile splits · pace chart · manual entry · personal bests · units · voice splits · route replay · weekly distance goal |
| ✅ 7 | **Body progress** `bodyProgress` · Body | Happy Scale, MacroFactor | `react-compare-slider` | measurement sliders · trend lines · progress photos · before/after compare · BMI & waist-to-height · goal lines · privacy blur · weekly check-in · units · smoothing (trend weight) |
| ✅ 8 | **Food scanner** `foodScanner` · Scan | Yuka, Open Food Facts | `@zxing/browser` | camera barcode scan · manual code · product card · Nutri-Score/NOVA/Eco-Score · additives · allergen alerts · sugar-cube view · portion slider → meal · history · compare two products |
| ✅ 9 | **Fasting** `fasting` · Fasting | Zero | `react-calendar-heatmap` | protocols (16:8, 18:6, 20:4, OMAD) · live ring · body-stage timeline · adjust start slider · history heatmap · weekly average · hydration nudges · end-early without guilt · notes & feelings · eating-window reminder |
| ✅ 10 | **Focus sounds** `focusSounds` · Sounds | Brain.fm, Endel | `tunajs` | Focus / Relax / Sleep / Meditate modes · generative music · neural-phase amplitude modulation · intensity slider · genres · binaural beats · session timer · visualiser · fade in/out · pairs with focus sessions |
| ✅ 11 | **Soundscape mixer** `soundMixer` · Mixer | Noisli, Calm | `simplex-noise` | rain · wind · ocean · fire · birds · stream · coloured noise · per-layer volume sliders · organic noise modulation · presets & saved mixes · sleep timer fade |
| ✅ 12 | **Guided meditation** `meditation` · Meditate | Headspace, Calm | `@tsparticles/react` + `slim` | courses · body scan · loving-kindness · SOS for anxiety · spoken guidance + captions · particle scenes · duration slider · interval bells · unguided timer · mood before/after |
| ✅ 13 | **Breathwork** `breathwork` · Breathwork | Wim Hof, Othership | `nosleep.js` | power-breathing rounds · retention stopwatch · recovery breath · rounds & pace sliders · animated lungs · voice & tones · round records chart · keep screen awake · safety check · history |
| ✅ 14 | **Mala & mantra** `mala` · Mala | Mala counters | `zdog` | 3D 108-bead mala · tap/space to count · mantra library · custom mantras · bells at quarters · haptics · rounds · colour themes · auto-chant pace · session log |
| ✅ 15 | **Ink journal** `inkJournal` · Ink | GoodNotes, Day One | `perfect-freehand` | pressure-sensitive pen · colours & thickness slider · highlighter · eraser · undo/redo · paper styles · pages saved on device · stroke replay · prompt of the day · export PNG |
| ✅ 16 | **Mood mirror** `moodMirror` · Mirror | Reflectly, Daylio | `sentiment` | per-entry sentiment · trend line · positive/negative words · word cloud · weekday pattern · compare with logged mood · gentle reframes · gratitude words · sources filter · on-device only |
| ✅ 17 | **Mind maps** `mindMaps` · Mind maps | Xmind, Whimsical | `markmap-lib` + `markmap-view` | outline → live map · templates · from a journal page · collapse nodes · zoom & pan · colours · saved maps · export SVG · fullscreen · goal breakdown helper |
| ✅ 18 | **Flashcards** `flashcards` · Cards | Anki | `marked` | decks · Markdown cards · SM-2 reviews · 3D flip · cloze deletions · reverse cards · import text/CSV · daily limit slider · tags · stats |
| ✅ 19 | **Brain games** `brainGames` · Games | Elevate, Lumosity | `pixi.js` | n-back · memory grid · Stroop · reaction time · speed maths · adaptive difficulty · daily brain workout · scores history · skill radar · sounds |
| ✅ 20 | **Goal roadmap** `goalRoadmap` · Roadmap | Linear, OKR tools | `frappe-gantt` | goals & milestones · Gantt timeline · drag dates · progress · key-result sliders · confidence slider · quarter / month view · dependencies · review prompts · link to tasks |
| ✅ 21 | **Routine builder** `routineScheduler` · Routines | Fabulous, Structured | `rrule` | steps with durations · recurring schedules · plain-language repeat preview · next occurrences · routine player · habit-stack anchors · skip/pause days · templates (morning, evening, workout) · week calendar · completion log |
| ✅ 22 | **Digital wellbeing** `digitalWellbeing` · Screen time | Opal, One Sec | `react-idle-timer` | active vs idle time · continuous-use break nudges · daily limit · detox mode (greyscale, quiet) · wind-down hours · session histogram · pause-before-open · phone-free challenge · focus-only mode · weekly trend |
| ✅ 23 | **Eye care** `eyeCare` · Eyes | EyeLeo, Time Out | `roughjs` | 20-20-20 reminders · follow-the-dot exercises · figure-eight · near/far focus · blink training · palming timer · interval slider · hand-drawn paths · sounds · history |
| ✅ 24 | **Daylight & circadian** `daylight` · Daylight | Rise, Timeshifter | `suncalc` | sun arc with live position · sunrise/sunset/golden hour · morning-light goal · caffeine curfew · wind-down window · light log · moon phase · day-length chart · best walk time · location by GPS or city |
| ✅ 25 | **Affirmation deck** `affirmations` · Affirm | I am, ThinkUp | `swiper` | themed decks · swipe cards · favourites · write your own · speak aloud · autoplay slideshow · repeat counter · card themes · daily card · mix mode |

## Order of work

0. Settings: categories, configurations dropdown, search, category sliders; the shared Studio shell and Slider — push.
1–25. One feature per commit, in the table order — push after each.
26. Update this plan with ✅ and findings.

## Status: all 25 shipped (one commit each)

Findings:
- 🔁 Shared plumbing: `Studio` shell (viewport-fitting panel, GSAP tab slide, living `StudioScene`), `Slider`, `Rail`, `Segmented`, a shared `NudgeHost` for recurring reminders (quiet hours, background notifications), and `logActivity` so every session counts toward Bloom Growth.
- 🔁 Settings: 9 categories as slider rails, a configuration dropdown (Recommended, Everything, Balanced, Minimal, Calm mind, Body & fitness, Deep work, Nourish, Journaling, Gamified — shows "Custom" once you diverge), search, all-on/all-off per category.
- 🐛 Library quirks handled: `easytimer.js` and `suncalc` need namespace/named imports under Vite; `tunajs` and `@tsparticles/react` ship types their `exports` can't reach (local `.d.ts`); `frappe-gantt` has no types; `marked` is ESM-only (Jest transform); `rrule.toText()` drops minutes (own formatter); suncalc returns invalid dates in polar day/night (fallbacks).
- 🐛 Sun times are shown in the chosen city's timezone, and the default city follows your own timezone.
- 🔒 Flashcard Markdown is sanitised (scripts, handlers and `javascript:` URLs stripped).
- Sub-features: every new feature has 10–11 switches.
