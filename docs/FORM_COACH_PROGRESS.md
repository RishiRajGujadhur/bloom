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
- [x] Perfect-form XP and local journal
- [x] Fatigue-aware routine suggestions
- [x] Secondary camera connection and depth calibration
- [x] Custom high-contrast skeletal colors
- [x] Offline tracking asset preparation
- [x] Lowest-scoring rep replay and compensation review
- [x] Frame-exit auto-pause and metronome hold
- [x] Focus-mode background dimming
- [x] Markdown session export
- [x] Battery saver
- [x] Silent wearable feedback and heart-rate connection
- [x] Performance history and range-of-motion trends
- [x] Custom routine chaining

- [x] Persistent personal profiles and configurable rep triggers

- [x] Upper-body muscle group guide

- [x] Work/rest efficiency, power consistency and output-decline feedback
- [x] Upper-body stability proxy (not measured centre of gravity)

- [x] Wrist callouts, visible standing knee callouts and reference torso wireframe

- [x] Optional digital auto-framing with consistent hover coordinates

- [x] Radial gesture dwell progress and optional floating fullscreen metrics

- [x] Post-set torso alignment and elbow excursion diagram

- [x] Projected extension and rapid slowdown visual cue (not joint stress measurement)

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

Secondary-camera pairing exchanges WebRTC offers/answers manually on the same LAN;
requires secure camera access on both devices. Depth fusion assumes fixed 90° cameras,
uses synchronized visible landmarks, and falls back on occlusion. Hardware validation
is still required. [WebRTC connectivity](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity).

Offline preparation caches versioned pose/hand models and all WASM variants.
It requires the production service worker and retained browser storage. GPU
tracking is the SDK delegate; neither WebGPU nor zero latency is guaranteed.

Wearable alerts require a user-configured companion BLE vibration service; no generic
watch compatibility is implied. Standard Bluetooth heart-rate notifications are supported.
Real device testing remains required. [Web Bluetooth](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API).

Digital framing crops within the original camera feed; it cannot recover limbs
that are outside the physical camera view. It is optional and off by default.

## Accuracy and device boundaries

Energy, calories, fatigue, stability, strike classification and deceleration are
camera-based estimates or movement proxies. They do not measure impact force,
joint stress, muscle activation or clinical balance. Wheelchair mode uses a
personal upper-body range and a seated activity estimate; it does not classify
wheelchair hardware or infer hidden pelvis/leg motion.

The reference models and Yang/Chen variations are illustrative movement guides,
not certified lineage instruction or a guarantee of perfect form. Reaction and
deceleration timing are limited by camera sampling and device performance.

Watch vibration requires a compatible companion exposing a writable Bluetooth
characteristic. A second camera requires manual local pairing and calibration;
its depth estimate cannot guarantee flawless 3D reconstruction. Both integrations
remain pending physical-device validation.

Final automated validation (2026-10-04): production build and all 27 movement,
metric, history, reward and integration-helper tests passed. All eight desktop
and mobile Form Coach browser checks passed, covering both-hand dwell controls,
logging, fullscreen, tracking loss, camera denial, personal calibration and
preference persistence. Demo workouts do not enter real session history.

The real model/WASM offline test also passed: prepare online, verify cached
page dependencies, disconnect networking, reload, initialize pose tracking and
finish the camera session. It uses a blank synthetic camera stream, so it
verifies offline initialization and frame handling rather than human accuracy.
This test exposed and fixed first-visit dependency caching and preload-header
cache matching. The duplicate mobile download test is intentionally skipped.

Targeted workout lint checks passed. Desktop and mobile screenshots are saved
under `docs/screenshots/form-coach-expanded-*.png`. Feature implementation and
follow-up fixes are recorded in separate Git commits.

Screenshot review exposed narrow-screen overflow inherited from the workout
navigation grid. The shared workout column and coach controls now shrink to the
viewport; desktop/mobile calibration tests passed again with a camera-button
viewport assertion after this fix.
