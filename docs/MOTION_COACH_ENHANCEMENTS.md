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
