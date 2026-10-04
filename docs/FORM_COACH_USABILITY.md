# Form Coach usability: 20 improvements

- [x] 01. Basic is the default for a fresh profile.
- [x] 02. Basic, Advanced and Game experience buttons.
- [x] 03. Remember the selected experience locally.
- [x] 04. One essential selected-workout dropdown.
- [x] 05. Seated mode filters the dropdown to upper-body exercises.
- [x] 06. Exercise library starts hidden and toggles independently.
- [x] 07. Exercise categories fold independently.
- [x] 08. Pose check category starts closed.
- [x] 09. Settings start closed; Basic exposes only hand controls and skeleton.
- [x] 10. Search advanced settings by name.
- [x] 11. Collapse sections together in Advanced.
- [x] 12. Expand sections together while preserving the closed Pose check category.
- [x] 13. Alignment feedback is optional and hidden initially.
- [x] 14. Independent Show reference toggle, on by default.
- [x] 15. Fullscreen contains the camera and reference side by side.
- [x] 16. Fullscreen hover controls form a left-hand column.
- [x] 17. Selected workout and rep/second count remain visible in fullscreen.
- [x] 18. Set progress bar inside the camera view.
- [x] 19. Remaining amount and a clear Set complete / Log or Finish cue.
- [x] 20. Timed workouts have an essential duration target too.

Basic hides advanced energy, pacing, angle and connection panels. Game explicitly
reveals the existing seated camera arcade. No camera starts when switching modes.
Fullscreen has the same native / fallback exit behaviour and hover controls.
References are illustrative: always follow your own comfortable movement range.

## Validation

- TypeScript, changed-file lint and production build passed (including PWA).
- 37 camera combat / advanced coach / Body QoL tests passed.
- All five desktop Form Coach browser scenarios passed against the production
  preview across the initial run and focused rechecks: accessible library and
  guided fullscreen, camera-denial recovery, either-hand set logging/exercise
  switching/fullscreen finish, calibration/preference persistence, and the new
  Basic/fullscreen/Game layout check.
- Fullscreen geometry checks wait for the native browser resize to settle before
  measuring the camera and reference or positioning simulated hands.
- In-app browser checks confirmed the closed Pose check category, advanced setting
  search, section collapse, mode switching and persistent completion cue.
- Physical webcam accuracy remains a separate hardware check; hover tests use
  simulated landmarks. The initial dev-preview navigation timed out; production
  preview tests completed successfully.

The completion cue stays visible until the set resets or is logged; it does not
silently stop counting or save a set on your behalf. Reference visibility remains
under your control. Basic and Game hide the advanced panels without erasing your
saved advanced preferences.

