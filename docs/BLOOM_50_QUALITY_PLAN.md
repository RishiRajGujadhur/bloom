# Bloom: 50 app qualities and delivery plan

This is a prioritized product backlog, not a claim that all 50 are complete. Review each change on desktop and mobile, verify keyboard access and reduced motion, then commit and push that completed improvement separately. Preserve existing user work in the checkout.

Research basis: [Nielsen Norman Group usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/), [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [W3C reduced motion technique](https://www.w3.org/WAI/WCAG22/Techniques/css/C39), [web.dev Core Web Vitals](https://web.dev/articles/vitals), and [GSAP matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia%28%29/). These inform the list; the ordering is Bloom-specific judgment.

## Foundation

1. Persistent Reduce motion switch in Settings. **Implemented in this pass.**
2. Honor device motion preference in every GSAP scene.
3. Pause offscreen and hidden-tab animation work.
4. Prefer SVG shapes and paths for distinctive page art.
5. Give every page a purposeful, lightweight motion signature.
6. Keep animations tied to feedback and meaning.
7. Use transform and opacity for smooth motion.
8. Prevent layout shifts while assets load.
9. Load heavy 3D, AI, and chart libraries only when needed.
10. Measure LCP, INP, and CLS on real devices.

## Navigation and clarity

11. Keep page headings available to screen readers when visually compact.
12. Use icon tooltips with keyboard focus equivalents.
13. Make important actions discoverable without hover.
14. Give icon buttons clear accessible names.
15. Use horizontal rails with arrow controls where a long list is avoidable.
16. Preserve a visible way to reach every rail item by keyboard.
17. Remember a user’s last page and view.
18. Offer fast search across features and content.
19. Provide consistent breadcrumbs or return paths.
20. Make empty states point to one useful action.

## Everyday delight

21. Todo: bubble-pop completion mode with a conventional fallback.
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

- 2026-09-29: Added persistent Reduce motion option and connected shared motion systems. Full page screenshot audit and feature-by-feature work remain open.

## Working order

1. Finish the shared motion preference, test it, and push it.
2. Inventory all pages and capture desktop/mobile screenshots. Record concrete bugs with screenshots.
3. Fix the highest-impact layout and control bugs first.
4. Add one feature-specific playful interaction at a time, with a normal accessible path.
5. Recheck performance after each motion addition; prefer reusing existing GSAP, SVG, carousel, and tooltip tools over new dependencies.
