# Body features: 50 quality-of-life improvements

Scope: all eleven Body navigation pages, plus the existing Tai Chi and Posture
camera activities. Each numbered improvement is committed independently.
Existing camera functionality is reused; unsupported movements receive an
explicit observation view rather than an invented form score.

## Shared body and camera experience

- [x] 01. Open the pose coach within each body page, without navigating away.
- [x] 02. Select the matching supported exercise from the current activity.
- [x] 03. Offer an honest observation-only pose view for unsupported activities.
- [x] 04. Share seated-mode preferences between body guides and camera coaching.
- [x] 05. Provide one silent-feedback switch for body audio and speech.
- [x] 06. Pause activities and release competing cameras before camera coaching.
- [x] 07. Trap keyboard focus in the coach, support Escape and restore focus.
- [ ] 08. Include the source activity in camera history and Markdown exports.
- [ ] 09. Keep a private, persistent practice note for each body page.
- [ ] 10. Export the current page's practice note as Markdown.

## Exercises

- [ ] 11. Remember exercise search and filters across visits.
- [ ] 12. Clear search and reset filters without leaving seated-only mode.
- [ ] 13. Show the matching exercise count and an actionable empty state.
- [ ] 14. Distinguish animated demonstration counts from measured camera reps.
- [ ] 15. Cancel queued exercise speech when pausing or leaving.
- [ ] 16. Enter an exact rep or hold-duration target alongside the slider.

## Workouts

- [ ] 17. Undo a removed workout set.
- [ ] 18. Enter exact weight and rep/duration values.
- [ ] 19. Prevent duplicate set logs from held keys and rapid repeat clicks.
- [ ] 20. Store plank sets as duration rather than repetition count.

## Intervals

- [ ] 21. Return to the beginning of the previous timer segment.
- [ ] 22. Offer a cancellable visual preparation countdown.
- [ ] 23. Keep skipped intervals distinct from fully completed training.
- [ ] 24. Restore the last selected valid interval program.
- [ ] 25. Validate and bound custom interval settings before use.

## Yoga

- [ ] 26. Search the pose library by name and Sanskrit name.
- [ ] 27. Favourite poses and filter the library to favourites.
- [ ] 28. Navigate directly to the previous or next pose in a flow.
- [ ] 29. Undo removal of a custom-flow step.
- [ ] 30. Keep inhale/exhale text useful with reduced motion enabled.

## Stretch

- [ ] 31. Operate body-map regions with keyboard Enter/Space.
- [ ] 32. Clear all selected body-map areas with one action.
- [ ] 33. Return to the previous stretch while preserving the routine.
- [ ] 34. Restart the current stretch without restarting the routine.
- [ ] 35. Save an after-session stiffness check-in only once.

## Run & walk

- [ ] 36. Toggle automatic map following so the route can be inspected.
- [ ] 37. Show GPS accuracy and stop failed location tracking cleanly.
- [ ] 38. Cancel demo/replay timers on restart, finish and page exit.
- [ ] 39. Keep demonstration routes out of real activity history.
- [ ] 40. Confirm and undo a manually logged run or walk.

## Body progress

- [ ] 41. Enter precise measurements in the selected display units.
- [ ] 42. Confirm saved check-ins and prevent an empty check-in.
- [ ] 43. Validate photo files and report failed photo storage.
- [ ] 44. Undo progress-photo deletion without losing the original image.
- [ ] 45. Review dated measurement entries and undo entry deletion.

## Eyes, daylight, dojo and readiness

- [ ] 46. Restart a finished eye-care routine without logging it twice.
- [ ] 47. Choose a high-contrast eye-guide target color.
- [ ] 48. Undo the most recent daylight-minute entry.
- [ ] 49. Search dojo techniques and clear a search with no matches.
- [ ] 50. Exclude simulated readiness scans from personal baselines/history.

## Validation

Pending: production build, meaningful model tests, desktop/mobile body-page
coverage and camera lifecycle/gesture checks. Physical metrics remain estimates;
the camera does not measure eye health, body dimensions, daylight exposure or HRV.
