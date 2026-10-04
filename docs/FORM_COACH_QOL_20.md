# Camera coach: 20 further usability improvements

- [x] 01. Quiet Basic overlays
- [x] 02. Advanced-only ghost replay
- [x] 03. Game reference stays side by side
- [x] 04. Arcade movement reference guides
- [x] 05. One-click air boxing
- [x] 06. Visible air punch tally
- [x] 07. Red skeleton form feedback
- [x] 08. Optional visual correction cues
- [x] 09. Black or dim camera background
- [x] 10. Background availability feedback
- [x] 11. Remember camera background choice
- [x] 12. Three two one start countdown
- [x] 13. Optional countdown and skip control
- [x] 14. Fullscreen encouragement
- [x] 15. Hands-free workout pause and resume
- [x] 16. Fold camera setup options
- [x] 17. Camera-first responsive layout
- [x] 18. Compact essential toolbar
- [x] 19. Jump directly to the camera
- [x] 20. Short-screen left control layout

Each of the 20 improvements was committed and pushed separately.

## Using the controls

- Basic suppresses optional target/cursor circles and ghost replay, even when
  those advanced preferences were previously enabled.
- Air boxing selects Boxing and shows the detected air-punch count and strike
  breakdown. Both arms are supported; classification is a camera heuristic.
- Game always retains the side-by-side movement reference. Sword and rope modes
  have dedicated illustrative upper-body animations rather than a static pose
  observation card. The selected game activity appears in the camera heading.
- Camera background offers Original, Dim room and Black background. Effects use
  the local person mask; if a mask is unavailable, the original video stays visible
  and the status says so. The choice is remembered. Background effects require
  segmentation, so selecting one switches off the incompatible battery-saver mode.
- The 3–2–1 countdown holds counting until ready, can be skipped or disabled,
  and holds its progress during pause or frame exit. Standing workouts show all
  three numbers too. Pause / Resume support the existing hand-hover controls.
- Visual correction cues turn the live skeleton red when a form warning is
  detected. Encouragement is shown in fullscreen; both can be toggled in settings.
- Camera setup starts folded, the camera comes before the expanded library on
  small screens, and Jump to camera avoids hunting through the page.

## Verification

- TypeScript, changed-file lint and production/PWA builds passed.
- 41 tests passed across reference motion, combat, advanced coach and Body QoL.
- All eight desktop Form Coach browser scenarios passed across the main run and
  focused rechecks: library/demo/fullscreen, permission recovery, either-hand
  hovering, calibration/preferences, Basic fullscreen layout, air boxing/countdown/
  pause/encouragement/background persistence, Game references, and standing countdown.
- Synthetic camera tests also checked black versus dim mask opacity and red
  skeleton pixels after an alignment fault. Test setup now preserves preferences
  on reload instead of overwriting them.

Camera test landmarks and masks are simulated. Physical webcam accuracy and
real-room segmentation quality remain unverified. References and correction cues
are movement guides, not a certification of martial-arts technique.

