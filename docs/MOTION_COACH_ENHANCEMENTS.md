# Motion Coach inspired workout enhancements

Reviewed on 2026-10-04. Implementations use Bloom’s local pose pipeline, original guidance and existing personal range calibration. Basic mode remains the default, and camera actions remain paged with at most three visible actions.

Inspiration sources:
- [Exercise library](https://motion-coach.com/)
- [Exercise guidance](https://motion-coach.com/check-squat-form)
- [Curl technique](https://motion-coach.com/bicep-curl-counter)
- [Tempo practice](https://motion-coach.com/tempo-side-raise-analysis)
- [Camera setup](https://motion-coach.com/guides/camera-setup-ai-tracking-guide)
- [Training progress](https://motion-coach.com/guides/progressive-overload-workout-guide)

These sources informed the choices of features; Bloom’s camera scores remain estimates and its guidance adapts to personal movement range.


- [x] 1. add compact exercise-specific movement and camera guides

- [x] 2. track seated bicep curls with either arm and elbow drift feedback

- [x] 3. add camera-counted seated lateral raises and matching 3D guidance

- [x] 4. add optional tempo grading and a reference that follows lift-return timing

- [x] 5. gate camera scoring on visible joints and provide specific framing feedback

- [x] 6. show a compact saved-set recap and export optional tempo results

- [x] 7. make the growing movement library searchable and integrate new lifts with history

## Verification

- Production build and TypeScript passed.
- Targeted source lint passed.
- 56 unit tests passed, covering seated curl and lateral-raise cycles, single-arm curls, elbow drift, tempo phase allocation and interruption handling, camera framing, recaps, lift catalog integration and Markdown export.
- All 12 browser scenarios passed against the production preview. They include the existing hand-hover/fullscreen regressions, edge-of-frame scoring suspension, new movement search, both new demo counters, tempo preferences, and saved-set recap visibility.
- The preview used generated video and simulated landmarks; physical webcam accuracy was not measured.
- Visual verification: `docs/screenshots/form-coach-motion-practice.png` and the updated desktop/mobile reachability screenshots.

The default remains Basic. Find the new movements in Selected workout or the searchable Exercise library. Choose optional tempo under Workout options. Exercise guidance and saved-set details are folded beside the camera. New exercises share personal range calibration and log into the existing workout history.
