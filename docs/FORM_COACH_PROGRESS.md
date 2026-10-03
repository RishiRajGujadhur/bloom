# Form Coach implementation progress

Existing Bloom Vision and accessible Form Coach changes pushed in `25e248c`.
Each new feature is committed separately with its tracker update. Camera scores,
angles, energy and fatigue are estimates; the reference is an illustrative guide,
not a medical prescription or a validated martial-arts master.

## Requested features

- [x] Personal seated range-of-motion calibration and adaptive rep thresholds
- [x] Dynamic side-by-side reference view
- [x] Detailed wireframe with live joint-angle callouts
- [x] Seated press, chest fly and chair squat exercise presets
- [x] Granular persistent Form Coach settings
- [x] Adaptive seated calorie estimates, kinetic joules and average power
- [x] Strike trajectory SVG trails
- [x] Impact deceleration grading
- [x] Combo rhythm consistency
- [x] Tai Chi flow grading and Yang/Chen reference selection
- [x] Boxing strike classification and guard feedback
- [x] Kung Fu hand/wrist and Karate block guidance
- [x] Reaction-time visual drills
- [x] Energy-to-RPG damage
- [x] Independent limb workload/fatigue gauges
- [x] Breathing sync visualizer
- [x] Personal-best ghost replay
- [ ] Perfect-form XP and local journal
- [ ] Fatigue-aware routine suggestions
- [ ] Secondary camera connection and depth calibration
- [ ] Custom high-contrast skeletal colors
- [ ] Offline tracking asset preparation
- [ ] Lowest-scoring rep replay and compensation review
- [ ] Frame-exit auto-pause and metronome hold
- [ ] Focus-mode background dimming
- [ ] Markdown session export
- [ ] Battery saver
- [ ] Silent wearable feedback and heart-rate connection
- [x] Performance history and range-of-motion trends
- [ ] Custom routine chaining

## Maintained

- [x] Hands-free rep counting, skeletal overlay and upper-body landmark isolation
- [x] Both-hand dwell controls, log/finish/change exercise and camera fullscreen
- [x] Neutral-position calibration and silent asymmetry feedback
- [x] Timed movement storage and demo isolation from real workout history

## Verification

Baseline: production build, 13 coach model tests, 6 desktop/mobile coach browser
checks passed before the baseline push. New checks and device-dependent limits
will be recorded here as implementation proceeds.

Angle labels are camera-plane projections, not clinical goniometry. Hidden joints
are not assigned invented knee or spine measurements.
