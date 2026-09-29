# Bloom: 50 app qualities and delivery plan

This is a prioritized product backlog, not a claim that all 50 are complete. Review each change on desktop and mobile, verify keyboard access and reduced motion, then commit and push that completed improvement separately. Preserve existing user work in the checkout.

Research basis: [Nielsen Norman Group usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/), [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [W3C reduced motion technique](https://www.w3.org/WAI/WCAG22/Techniques/css/C39), [web.dev Core Web Vitals](https://web.dev/articles/vitals), and [GSAP matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia%28%29/). These inform the list; the ordering is Bloom-specific judgment.

## Foundation

1. Persistent Reduce motion switch in Settings. **Implemented in this pass.**
2. Honor the app and device motion preferences in every GSAP scene. **In progress: 90 source files connected to the shared preference; remaining scenes need an audit.**
3. Pause hidden-tab GSAP work. **Implemented.** Pause offscreen scenes individually in a later pass.
4. Prefer SVG shapes and paths for distinctive page art.
5. Give every page a purposeful, lightweight motion signature.
6. Keep animations tied to feedback and meaning.
7. Use transform and opacity for smooth motion.
8. Prevent layout shifts while assets load.
9. Load heavy 3D, AI, and chart libraries only when needed.
10. Measure LCP, INP, and CLS on real devices.

## Navigation and clarity

11. Keep page headings available to screen readers when visually compact. **Implemented for page headings.**
12. Use icon tooltips with keyboard focus equivalents. **Implemented for page emblems; audit other icons.**
13. Make important actions discoverable without hover.
14. Give icon buttons clear accessible names.
15. Use horizontal rails with arrow controls where a long list is avoidable. **Implemented for related features and existing card rails; review other lists.**
16. Preserve a visible way to reach every rail item by keyboard. **Implemented for related features; audit other rails.**
17. Remember a user’s last page and view.
18. Offer fast search across features and content.
19. Provide consistent breadcrumbs or return paths.
20. Make empty states point to one useful action.

## Everyday delight

21. Todo: bubble-pop completion mode with a conventional fallback. **Implemented in this pass.**
22. Todo: small surprise for finishing a whole list.
23. Habits: growing SVG garden for sustained streaks.
24. Focus: visual progress that blooms during a session.
25. Journal: subtle ink flourish after saving an entry.
26. Mood: responsive SVG orb with labeled mood choices.
27. Gratitude: jar that visibly fills with saved moments.
28. Sleep: moon phase illustration reflecting logged rest.
29. Breathing: SVG guide paced by the chosen pattern.
30. Meditation: calmer scene and silent milestone feedback.
31. Calendar: joyful, clear completion marks.
32. Routines: playful chain animation for a finished sequence.
33. Goals: route map showing meaningful milestones.
34. Workout: easy set logging with a satisfying completion state.
35. Nutrition: playful but readable hydration feedback.
36. Games: immediate explanation after each answer.
37. Flashcards: clear progress and spaced review feedback.
38. Money: approachable visual progress without obscuring numbers.
39. World: earned decor that reflects real activity.
40. Yearbook: memorable recap with export-ready layout.

## Trust, access, and resilience

41. Save locally and show clear save status.
42. Make destructive actions reversible where possible.
43. Give forms inline validation and useful errors.
44. Support complete keyboard navigation.
45. Keep color contrast and focus indicators strong.
46. Respect touch target sizes on phones.
47. Make offline and failed-load states understandable.
48. Let people export and restore their data.
49. Test every page at desktop and mobile widths with screenshots.
50. Fix console errors, clipping, overflow, and broken controls found in review.

## Review log

- 2026-09-29: Added persistent Reduce motion option and connected shared motion systems.
- 2026-09-29: Captured 67 navigation pages at desktop and phone widths (134 screenshots). Automated checks found no page errors or document-level horizontal overflow. Visual spot checks covered Overview, To-dos, and mobile Settings; deeper visual review remains open.
- 2026-09-29: Added WaterDo bubble completion mode for tasks and verified task completion in a browser.
- 2026-09-29: Connected 90 clean source files to one motion preference check. Verified setting persistence across pages and three utility cases. Two files with concurrent edits remain untouched, and GSAP scenes without any preference guard still need review.
- 2026-09-29: Added optional preparation steps to saved recipes and a cook-along view with SVG progress and a kitchen timer. Verified desktop and mobile flows in a browser.
- 2026-09-29: Corrected the screenshot audit to detect Bloom's own error screen and pages stuck loading. Re-ran all 134 captures on a fresh local server; no page errors or document-level overflow were reported.
- 2026-09-29: Paused the global GSAP timeline while the tab is hidden, restoring its prior state when visible. TypeScript and lifecycle tests passed.
- 2026-09-29: Replaced compact page heading text with the existing animated SVG emblems. Page names remain as semantic headings and appear on hover or keyboard focus. Checked desktop and mobile screenshots.
- 2026-09-29: Added visible previous/next controls and arrow-key scrolling to the related-feature rail. Verified on a phone-sized viewport.
- 2026-09-29: Added Rhythm lab to Focus sounds: a metronome, SVG beat guide, keyboard tapping, early/late feedback, and a saved best score. Verified timing logic and desktop/mobile flows.
- 2026-09-29: Added Pitch lab to Focus sounds: ten higher/lower listening questions, two difficulty levels, note-name explanations, SVG staff feedback, and a saved best score. Corrected the Sounds studio width on phones and verified desktop/mobile flows.
- 2026-09-29: Added guided line, circle, and triangle tracing to Vision Board, with touch/mouse/pen input, SVG guide animation, stroke replay, gentle score feedback, and saved best scores. Verified a scored stroke, TypeScript, and desktop/mobile screenshots; mobile had no document-level horizontal overflow.
- 2026-09-29: Added a paired sleep and mood SVG view to Sleep Insights, joining nights to check-ins on wake-up date and labeling each recorded value. Verified empty and paired states plus desktop/mobile screenshots without horizontal overflow; centered the single-day plot and corrected the singular night label.

## New feature areas

- Cooking: deepen cook-along with technique lessons and safe, clear guidance. The first cook-along version is complete.
- Music: Rhythm lab and Pitch lab are available under Focus sounds. Add short guided sessions next.
- Drawing: add guided exercises with a simple canvas and replayable strokes.
- Health tracking: connect existing sleep, movement, food, mood, and focus data in understandable trends.

## Working order

1. Finish the shared motion preference, test it, and push it.
2. Inventory all pages and capture desktop/mobile screenshots. Record concrete bugs with screenshots.
3. Fix the highest-impact layout and control bugs first.
4. Add one feature-specific playful interaction at a time, with a normal accessible path.
5. Recheck performance after each motion addition; prefer reusing existing GSAP, SVG, carousel, and tooltip tools over new dependencies.
