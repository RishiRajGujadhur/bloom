# Form Coach reachability improvements

Each improvement is committed and pushed separately.

- [x] 1. page camera actions in groups of three with SVG arrows

- [x] 2. lower hand controls into a comfortable reach zone

- [x] 3. separate large hand targets with generous safety gaps

- [x] 4. require hands inside target borders instead of overlapping hit halos

- [x] 5. use confident wrist positions to avoid finger jitter activations

- [x] 6. ignore ambiguous two-hand selections instead of choosing the wrong action

- [x] 7. allow comfortable hand hold durations from two to five seconds

- [x] 8. offer left or right reach zones without moving the camera subject

- [x] 9. move workout name and rep progress beneath the side reference

- [x] 10. keep fullscreen coaching information beside the camera instead of covering it

- [x] 11. replace the stick reference with an articulated 3D person and optional skeleton

- [x] 12. offer front and side reference views to make movement direction clearer

- [x] 13. resize the 3D reference sharply for fullscreen and changing window sizes

- [x] 14. provide a slow-motion reference for learning a movement at your own pace

- [x] 15. light the reference person clearly for readable arm and torso depth

- [x] 16. confirm finishing while pausing the workout to prevent accidental exits

- [x] 17. keep the optional countdown skip beside the start prompt

- [x] 18. remember preferred hand reach and hold time across visits

- [x] 19. fold secondary workout options to reduce page buttons and scrolling

- [x] 20. adapt reachable controls and side guidance to small screens with clear focus states

## Using the camera controls

The Set page contains Pause/Resume, Log set and Finish. Use the SVG arrows for the Workout page: Previous, Next workout and Fullscreen/Exit fullscreen. Narrow previews show one large action per page. Finish asks you to confirm and pauses counting while you decide. Moving your hand away for half a second rearms the controls, including after changing pages.

Coach settings contains the preferred reach side and hold time; both persist locally. Reference options contains the person/skeleton view, viewing angle and slow-motion toggle. Progress, workout name and encouragement are beneath the reference in both regular and fullscreen views.

## Verification

- Production build, TypeScript and targeted lint passed.
- 47 tracking, scoring and gesture unit tests passed.
- All 10 browser scenarios passed across the main run and targeted reruns, including both-hand hover actions, duplicate-log protection, finish confirmation, desktop spacing, and the 390px phone layout.
- Webcam checks used simulated landmarks and a generated camera stream; physical-camera tracking accuracy was not measured.
- Updated desktop and mobile screenshots are in `docs/screenshots/form-coach-reachable-*.png`.
