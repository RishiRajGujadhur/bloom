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

Pull requests now run six accessibility combinations: desktop, mobile and 320px reflow, each in Basic and Advanced mode. Browser cases include chat, keyboard, scaling, page modes, direct widget resizing, saved drafts and inline Todo data sharing. ECMAScript parsing, startup budgets and Jest remain enforced. Reports are retained as CI artifacts. The PR template also asks for manual keyboard, zoom/reflow, content-alternative and announcement review. Making these checks mandatory for merging still depends on repository branch-protection settings.

## Standards and limits

The target is [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/). Automated axe checks are a regression gate, not a full conformance certification. Manual checks must cover keyboard workflows, focus management, zoom/reflow, meaningful alternatives, assistive technology, and dynamically generated content.

JavaScript targets the standardized ES2023 subset of [ECMA-262](https://ecma-international.org/publications-and-standards/standards/ecma-262/). Parsing validates emitted syntax; runtime behavior still needs browser tests. [MDN performance guidance](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance) informs lazy optional content and bounded loading.

The earlier desktop baseline remains in [standards-desktop.json](standards-desktop.json). Final mode-specific reports are linked above. Automated route audits inspect the initial workspace in each mode; every alternate tab, custom theme, screen reader and generated-content state is not covered by these results.

## Shared React dropdown migration — 2026-10-07

- Reused the installed Radix Select and Dropdown Menu libraries.
- Migrated all 118 native JSX pickers in 59 source files to one shared Radix picker.
- Preserved empty choices, numeric values, defaults, disabled options, labels, and real change events through a hidden form bridge.
- Updated common and feature selectors so existing layouts continue styling the visible controls.
- Bounded popup height and width; added long-label truncation, disabled styling, and forced-colors focus treatment.
- Updated integration tests to select through visible menus instead of native select APIs.
- Validation: TypeScript passed; all five picker regression tests and two learning-page integration tests passed. Shared-control lint passed.

## Shared Radix checkboxes and control guard — 2026-10-07

- Added the official Radix Checkbox package and migrated all 62 native JSX checkboxes across 30 files.
- Centralized checked, unchecked, mixed, disabled, focus, and forced-colors styling; provided a 44px pointer target around a compact indicator.
- Retained controlled state, initial defaults, keyboard Space, existing settings persistence, and checkbox form submission.
- Added a source audit and CI steps that reject new native JSX dropdowns and checkboxes outside the select's hidden form bridge. HTML examples inside coding lessons remain native HTML by design.
- Converted the pure nested-project option renderer to an option array so every project remains selectable.
- Kept dropdown portals inside native dialogs and preserved uncontrolled form resets.
- Fixed a test-only JSDOM selector recursion for unsupported fullscreen matching.
- Validation: 36 targeted tests passed on the rerun; the other four affected suites passed previously. TypeScript and shared-control lint passed. Production performance budgets and all 636 emitted JavaScript files passed ECMAScript 2023 validation.
- Browser verification: all 83 feature choices appear in the Radix menu; keyboard Space hides and restores the Soundscape button.

## Complete library control audit — 2026-10-07

- Replaced Nourish's final native datalist with the installed Radix Popover and cmdk libraries; no additional autocomplete dependency.
- Preserved free-text food entries, known-food nutrition autofill, keyboard suggestions, Escape dismissal, pointer focus, and normal form submission.
- Added three autocomplete regression tests and extended the CI guard to reject native datalists.
- Shared source audit now reports 119 picker uses, 62 checkboxes, and one autocomplete. Coding lesson HTML examples are intentionally excluded.
- Validation: all 60 unique targeted tests passed across the migration; shared-control lint and whitespace checks passed. Desktop and 375px mobile picker previews, settings persistence, and native-dialog portals were checked.
- Final production build and TypeScript passed; JavaScript 2,572,109 bytes and CSS 384,641 bytes remain within the configured budgets.
- Final ECMAScript scan passed for all 637 emitted JavaScript files.
