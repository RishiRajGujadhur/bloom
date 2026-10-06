# Bloom page reliability, accessibility and progressive disclosure

Date: 2026-10-06

## Completed repair work

- [x] Reproduced Growth's failed lazy import: competing Vite servers replaced a shared optimized dependency cache.
- [x] Isolated development caches by port and made import failures recover through a fresh document.
- [x] Reduced chat body text to a scalable 14px default; kept form inputs at 16px to avoid mobile zoom.
- [x] Fixed common theme contrast, decorative image semantics and carousel/habit target sizes.
- [x] Fixed legacy page ARIA, progress indicators, chess keyboard navigation and timeline scrolling.
- [x] Audited all 83 desktop routes: zero runtime errors, automated WCAG violations, duplicate IDs, nested controls or page overflow.
- [x] Passed four desktop/mobile browser cases for Growth, chat scaling, three-choice paging and chess keyboard navigation.
- [x] Added emitted JavaScript parsing: 636 production JavaScript files passed ECMAScript 2023 syntax validation.
- [x] Installed the requested [caveman skill](https://github.com/JuliusBrussee/caveman/tree/main/skills/caveman).

## Follow-up requested during the repair

- [x] Complete mobile accessibility and layout audit in Basic and Advanced modes.
- [x] Add WCAG 2.2 A/AA, semantic HTML and ECMAScript checks to pull-request CI.
- [x] Default pages to Basic mode and move secondary/bulk tools into Advanced mode.
- [x] Validate both modes and avoid mounting optional heavy content in Basic mode.

## Final verification

All 83 routes passed in each desktop/mobile and Basic/Advanced combination: 332 route checks with no runtime errors, automated WCAG violations, duplicate IDs, nested controls or horizontal page overflow. Desktop reports include successful targeted rechecks for the corrected affirmation button and a transient Piano loading timeout. The open chatbot also passed automated WCAG checks on both profiles.

| Profile | Basic | Advanced |
| --- | --- | --- |
| Desktop | [83 routes](standards-desktop-basic.json) | [83 routes](standards-desktop-advanced.json) |
| Mobile | [83 routes](standards-mobile-basic.json) | [83 routes](standards-mobile-advanced.json) |

Browser checks passed for Growth loading, chat text at 200% root font size, three-choice paging, chess arrow/selection controls, and per-page mode persistence. The full Jest run passed 602 of 610 tests; all eight initially failing cases passed after mode-aware test corrections and focused reruns. Two slow full-app cases required longer local timeouts while builds and browser audits competed for resources.

The final production build and TypeScript check passed. The final browser run passed all six desktop/mobile cases. Code and Mood were rechecked in all four combinations after correcting the accessible name of Basic workspaces.

Production JavaScript passed ES2023 parsing (636 files). The startup dependency graph passed its existing performance budgets: 2,535,576 bytes of JavaScript and 362,783 bytes of CSS, below 3 MiB and 450 KiB. The standards workflow now enforces these budgets alongside its build and syntax checks.

Basic mode retains essential workflows. Advanced reveals extra Studio workspaces, bulk habit controls/history/calendar, Growth rewards and skills, detailed wellbeing controls, feature configuration, marketplaces and maintenance. Preferences persist independently per page; existing Todo Pro preferences migrate to Advanced. Optional scenes and advanced sections do not mount in Basic mode.

Pull requests run the standards workflow's four accessibility combinations, open-chat/keyboard/scaling/mode browser cases, ECMAScript parsing, startup budgets and Jest. Reports are retained as CI artifacts. The PR template also asks for manual keyboard, zoom/reflow, content-alternative and announcement review. Making these checks mandatory for merging still depends on repository branch-protection settings.

## Standards and limits

The target is [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/). Automated axe checks are a regression gate, not a full conformance certification. Manual checks must cover keyboard workflows, focus management, zoom/reflow, meaningful alternatives, assistive technology, and dynamically generated content.

JavaScript targets the standardized ES2023 subset of [ECMA-262](https://ecma-international.org/publications-and-standards/standards/ecma-262/). Parsing validates emitted syntax; runtime behavior still needs browser tests. [MDN performance guidance](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance) informs lazy optional content and bounded loading.

The earlier desktop baseline remains in [standards-desktop.json](standards-desktop.json). Final mode-specific reports are linked above. Automated route audits inspect the initial workspace in each mode; every alternate tab, custom theme, screen reader and generated-content state is not covered by these results.
