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

- [ ] Complete mobile accessibility and layout audit.
- [ ] Add WCAG 2.2 A/AA, semantic HTML and ECMAScript checks to pull-request CI.
- [ ] Default pages to Basic mode and move secondary/bulk tools into Advanced mode.
- [ ] Validate both modes and avoid mounting optional heavy content in Basic mode.

## Standards and limits

The target is [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/). Automated axe checks are a regression gate, not a full conformance certification. Manual checks must cover keyboard workflows, focus management, zoom/reflow, meaningful alternatives, assistive technology, and dynamically generated content.

JavaScript targets the standardized ES2023 subset of [ECMA-262](https://ecma-international.org/publications-and-standards/standards/ecma-262/). Parsing validates emitted syntax; runtime behavior still needs browser tests. [MDN performance guidance](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance) informs lazy optional content and bounded loading.

Desktop results: [standards-desktop.json](standards-desktop.json). Further results will record their actual mode, profile and coverage.
