# Round 15 — Flow, consistency and depth

Goals from the brief:

1. **Fold Life tools into the Daybook.** The journal-style life tools become Daybook journal types; the Life hub (and its auto-refresh bug) is removed. Existing life records are migrated into Daybook pages.
2. **Exercise**: seated/wheelchair figure made clearly visible; new neck, mouth/jaw, shoulder, arm, wrist and finger exercises; more postures; filters by body area and position; **goal programs** (combinations of exercises for a body goal: strength, posture, mobility, desk relief, seated strength, toned arms…).
3. **Consistency**: one Settings pattern for turning features and options on/off everywhere; shared GSAP/SVG animation primitives reused across pages.
4. **Reuse libraries across features** (not one library per feature): animejs, simplex-noise, tsParticles, roughjs, Zdog, pixi.js, chart.js, react-countdown-circle-timer, swiper, sentiment… each appears in several pages.
5. **Seedling ↔ skill tree/constellation**: one Growth view with a toggle; seedling linked to real activity.
6. **Enhance ≥ 15 existing features** with ≥ 10 new options each, ≥ 1 new (or newly reused) open-source library, and SVG/GSAP animation.

Options were chosen from what leading apps offer (Forest, Focus Plant, Habitica, Finch, Streaks, Todoist, TickTick, Day One, Headspace, Elevate, Lumosity, Peak, I Am Sober, Fabulous).

## Features and new options

| # | Feature | New library use | 10 new options |
|---|---|---|---|
| 1 | Daybook | tsParticles (ink motes), roughjs (hand-drawn margins) | 6 journal types from Life tools (boundaries, connection, reading notes, clear writing, work shutdown, meeting prep) · migration of old life records · animated page-turn · paper textures · word goal ring · writing streak flame · prompt shuffle · mood tag on save · focus fade · type-in sound |
| 2 | Exercises | animejs + roughjs | Seated mode visibility · neck, jaw/mouth, shoulder, arm, wrist, finger moves · position filter (standing/seated/floor) · body-area filter · goal programs (combos) · program player · rest between moves · sets · difficulty · printable plan |
| 3 | Focus / Pomodoro | pixi.js, simplex-noise | Grow scenes: tree, flower bed, city skyline, treasure (coins & diamonds found), coral reef, space station · scene gallery · strict mode wilt · rain ambience · break stretch suggestion · session tags · daily scene diorama |
| 4 | Growth (skill tree / constellation / seedling) | Zdog | Toggle one view at a time · seedling grows from real activity · seasons · watering from habits · sunlight from focus · leaves per journal · blossoms per streak · gallery of past plants · share card · pot styles |
| 5 | Rewards / Petal shop | canvas-confetti + animejs | Chest opening · rarity tiers · daily deal · wishlist · item previews · bundles · streak insurance · gift a petal · pity counter · inventory |
| 6 | Brain games | pixi.js + three (R3F) | Pattern tapping (Simon) · 3D mental rotation · word scramble · path memory · number stream · focus tracking (moving targets) · game streak · difficulty presets · timed/zen modes · personal bests |
| 7 | Habits | roughjs + animejs | Animated check SVG · hand-drawn heatmap · habit stacking · times per week targets · skip/pause · reminders time · colour & icon picker · notes per check-in · sorting · archive |
| 8 | To-dos | animejs | Swipe-to-complete · animated checkboxes · Eisenhower matrix · energy tags · due-soon glow · subtasks progress ring · quick-add parsing (dates) · focus-now button · someday list · completed feed |
| 9 | Intentions | swiper + GSAP | Morning intention cards · word of the day · intention templates · reflect at night · streak · pin to dashboard · colour themes · carry forward · share · history carousel |
| 10 | Urges | simplex-noise + GSAP | Urge-surfing wave animation · intensity slider · triggers chips · delay timer · alternative actions · money/time saved · craving journal · SOS breathing · milestones · weekly chart |
| 11 | Epiphanies | Zdog / roughjs | Lightbulb SVG glow · tags · sources · review stats · star rating · connect epiphanies · daily review cap · archive · search · export |
| 12 | Guided journal (chat) | sentiment | Mood colour per reply · prompt packs · typing animation · summary card · follow-up questions · save highlights · voice input · word count · theme · streak |
| 13 | Settings | GSAP | Consistent toggle component · animated category rails · per-feature option counts · reset feature · presets preview · import/export animation · dependency hints · search highlight · recently changed · undo |
| 14 | Petal shop | (with Rewards) | — see 5 |
| 15 | Mood check-in | chart.js | Mood calendar · emotion wheel animation · energy/anxiety sliders · triggers · weather tag · notes · trend chart · correlations link · reminder · export |
| 16 | Sleep | chart.js | Sleep score · stages estimate · dream log link · caffeine link to Daylight · smart alarm window · weekly chart · consistency ring · naps · noise link to Soundscapes · bedtime reminder |

## Order

Each item is its own commit and push. Status is tracked below.

| # | Status |
|---|---|
| 1 Daybook + Life migration | ✅ pushed |
| 2 Exercises (moves, filters, programs, visible wheelchair) | ✅ pushed |
