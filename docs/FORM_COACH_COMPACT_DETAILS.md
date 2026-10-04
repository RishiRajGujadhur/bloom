# Compact workout details and Auto

- Movement instructions and saved-set history are hidden initially. Left/right arrows below the persistent count switch between the compact overview, movement guide and last saved set.
- The reference and smaller rep count remain above the bounded detail panel in fullscreen. Longer help text scrolls inside its panel.
- Auto is a local, conservative pose heuristic for seated bicep curls, lateral raises and overhead presses. It requires visible arms and a complete excursion/return after calibration; the identification movement is not counted.
- The identified exercise stays locked until Auto is selected again. Other movements require manual selection. Demo does not auto-identify; camera images remain on device.
- Synthetic tests cover all three movements, stillness/ambiguity, visibility loss and locking. Recognition accuracy still depends on camera placement and individual movement; this is not a trained universal exercise classifier.

Validation: production build and TypeScript pass; 61 unit tests pass. All 15 browser scenarios have passed, with the final fullscreen CSS checked again at desktop and 390px widths. Camera checks use simulated input; real-world Auto accuracy has not been physically validated.
