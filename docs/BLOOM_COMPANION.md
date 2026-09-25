# Bloom enhancement review

This pass connects existing features without replacing their records or interfaces.

| Recommendation | Existing Bloom foundation | Change in this pass |
| --- | --- | --- |
| Character and companion | RPG avatar, fox/spirit companions, equipment | The global companion uses the selected companion sprite. |
| Local intelligence | Transformers.js semantic journal search; scripted guided journal | Optional WebLLM/Qwen 0.5B conversation in a disposable worker. Existing search and guided journaling remain intact. |
| AI that operates the app | Tasks, project dependencies, calendar, daily intentions | Time/energy-based session proposals, reviewed before adding existing tasks to daily intentions. |
| Memories and personal story | Journal archive, habit history, focus history | A rolling seven-day activity memory on the home screen, linked to journaling. |
| Collections and progression | Collectibles, rewards, badges, RPG progression | Preserved; the companion cannot invent or award rewards. |
| Creative space | Tiptap journal and React Flow vision board | Preserved rather than introducing duplicate editors. |
| Motion and personality | Motion, animated sprites, soundscape | Reuses the existing companion art and theme colors. |

## Deliberate limits

- The lightweight planner is deterministic, not generative AI. It remains usable when no model is enabled or no compatible GPU is available.
- Plans currently concern today's intentions. They do not reschedule deadlines, split tasks, or modify calendar blocks.
- The weekly memory is derived from existing records, not a saved AI narrative or a new memory collection.
- A garden/world editor, correlation analytics, and a new Life Map are not introduced in this pass.
- The new companion copy is English; existing localized feature screens remain available.

## Validation

Unit tests cover availability, energy, duration, duplicate prevention, stale plans, schema round trips, and local-date activity boundaries. UI tests cover opt-in, model interpretation through a mock, generation failure and cancellation. Desktop/mobile browser tests cover real interface operation, persistence, no automatic model download, layout, and setup failure recovery.

`e2e/local-ai.spec.ts` is a separate opt-in hardware check. Run with `BLOOM_AI_SMOKE=1` on a WebGPU-capable browser/device. The automated Chromium environment used during implementation reported “Unable to find a compatible GPU”; successful real inference and device performance remain unverified. Fallback behavior was verified.

References: [WebLLM basic usage](https://webllm.mlc.ai/docs/user/basic_usage.html), [WebLLM worker integration](https://webllm.mlc.ai/docs/user/advanced_usage.html), [Transformers.js](https://huggingface.co/docs/transformers.js/).
