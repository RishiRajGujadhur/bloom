# Bloom interactive innovation plan

Status: **1 / 25 implemented**. Ship one usable feature, capture its screenshot, commit, and push before starting the next. Each feature needs a meaningful SVG control, responsive and keyboard operation, reduced-motion behavior, useful feedback, and an explicit library audit. Inspiration is directional; use original visuals and copy.

## Research and implementation approach

CSS Design Awards highlights [SVG](https://www.cssdesignawards.com/website-gallery?feature=SVG), animation, and [wellbeing](https://www.cssdesignawards.com/website-gallery?industry=wellbeing) work. [Numa](https://www.cssdesignawards.com/sites/numa/50017/) demonstrates an animated wellbeing story, while [Frequency Breathwork](https://www.cssdesignawards.com/sites/frequency-breathwork/48572/) pairs expressive motion with a breathing practice. These are inspiration for Bloom's visual pacing and direct manipulation, not templates to reproduce.

Each instrument uses at least seven installed open source libraries in its active UI path: **React** for state, **GSAP** for SVG feedback, **Framer Motion** for transitions, **D3 shape** for its SVG guide, **chroma.js** for state color, **Radix Tooltip** for accessible explanation, and **Zod** for persisted setting validation. Individual features may use more libraries where useful. The SVG itself changes the feature state through pointer and keyboard interaction; it is not an illustration beside a separate control.

## Features

| # | Feature | Home | SVG control and useful outcome | Status | Screenshot |
|---|---|---|---|---|---|
| 1 | Energy compass | Insights Lab | Rotate an energy needle to choose a matching next action | [x] | [Screenshot](screenshots/innovation-01-energy-compass.png) |
| 2 | Focus orbit | Focus | Set a focus duration on a circular track; see a time budget | [ ] | — |
| 3 | Mood constellation | Mood | Place a mood star on a two-axis field; get a reflection prompt | [ ] | — |
| 4 | Breath rhythm conductor | Breathe | Stretch an inhale/exhale curve to personalize the cycle | [ ] | — |
| 5 | Sleep horizon | Sleep | Drag bed and wake markers around a night arc | [ ] | — |
| 6 | Habit momentum river | Habits | Shift a goal marker along a flowing streak projection | [ ] | — |
| 7 | Gratitude bloom | Gratitude | Select petals to build a themed reflection bouquet | [ ] | — |
| 8 | Daylight arc planner | Daylight | Move a sun marker to plan a light break | [ ] | — |
| 9 | Soundscape balance map | Mixer | Move sound nodes to balance a personal soundscape | [ ] | — |
| 10 | Recovery budget | Exercise | Adjust effort and rest on an SVG balance scale | [ ] | — |
| 11 | Task priority field | Planning | Place tasks on urgency and meaning axes | [ ] | — |
| 12 | Routine route designer | Routines | Connect activity waypoints into a daily path | [ ] | — |
| 13 | Stress release valve | Release | Turn an SVG valve to select a short release exercise | [ ] | — |
| 14 | Weekly balance rosette | Lab | Tune life-area petals and reveal the least-served area | [ ] | — |
| 15 | Journal prompt galaxy | Journal | Select orbiting themes to compose a writing prompt | [ ] | — |
| 16 | Attention heatmap lens | Focus | Sweep a lens over the day to identify a focus window | [ ] | — |
| 17 | Calm tempo metronome | Meditate | Turn an SVG tempo wheel for a paced session | [ ] | — |
| 18 | Microbreak path | Workouts | Choose a route of short movement breaks | [ ] | — |
| 19 | Mood color lab | Mood | Mix two SVG color stops into a named emotional palette | [ ] | — |
| 20 | Reflection thread weaver | Daybook | Connect SVG themes to find a writing angle | [ ] | — |
| 21 | Streak risk radar | Growth | Tune effort and recovery spokes to show a sustainable target | [ ] | — |
| 22 | Hydration tides | Body | Set a drinking cadence on an SVG tide chart | [ ] | — |
| 23 | Cognitive load board | Planning | Arrange commitments on a capacity dial | [ ] | — |
| 24 | Personal rhythm atlas | Lab | Explore a week of energy with a draggable time marker | [ ] | — |
| 25 | Wellbeing world builder | World | Combine chosen practices into an interactive SVG landscape | [ ] | — |
