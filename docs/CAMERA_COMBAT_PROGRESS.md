# Seated camera combat expansion

Sword mode uses empty-hand wrist/forearm gestures; no physical prop is required
or recognized. Projected cues and power values are estimates. Each subfeature is
committed and pushed independently. Demo sessions never award progression.

- [x] 01. Wing Chun chain punches, boxing combinations and seated lateral slips.
- [x] 02. Cloud Hands synchronization, circular travel and slow-flow cues.
- [x] 03. Alternating/double shadow-rope slams and estimated acceleration/power.
- [x] 04. Empty-hand SVG broadsword/katana overlay.
- [x] 05. Overhead strikes, thrusts and high-guard projectile parries.
- [x] 06. Lingering colored sword slash trails.
- [x] 07. Pixel-art camera boss battles with movement-driven damage.
- [x] 08. Classical melody rhythm targets and timing/position grades.
- [x] 09. Seated dodge attacks, guard shields and player HP.
- [x] 10. Retro knuckle/sword hit sparks and critical numbers.
- [x] 11. Idempotent real-camera loot, XP, inventory and battle journal.

## Using the expansion

Open Workouts > Form coach (or the shared Body camera coach), expand **Seated
arcade**, and choose a movement mode. Start the camera and complete its personal
calibration. The sword follows the selected wrist and forearm; it does not detect
or require a held object. Enable hand controls to hold either hand over Pause /
Resume or Restart for 2.5 seconds. Move your hand away before activating again.

Rhythm audio is optional and uses synthesized public-domain Ode to Joy / Für
Elise motifs. Commercial film and game recordings are not bundled. Gentle mode
disables HP loss. Only real-camera victories can award collectible loot and XP;
demo victories cannot. Battle history can be exported as Markdown.

## Validation

- TypeScript check passed.
- 37 tests passed across camera combat, advanced coach, and Body QoL suites.
- Changed workout/RPG files pass lint. Full-project lint reports existing errors
  in `src/fili.d.ts` and five unrelated hook warnings.
- Production build passed, including PWA offline packaging.
- Production browser smoke checks passed: workout entry, mode switching, right-hand
  katana overlay, rhythm options, pause/resume and compact camera layout. Initial
  dev-server dynamic imports failed; a fresh production preview loaded successfully.
  Physical webcam accuracy and hand-hover activation remain unverified.

These are projected movement heuristics. Power is an arm-motion proxy, not a
measurement of rope resistance or calibrated contact force. Cloud Hands feedback
estimates coordination and continuity; it does not certify a traditional lineage.

