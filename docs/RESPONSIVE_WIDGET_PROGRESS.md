# Responsive sections and reusable widgets

## Implementation

- [x] Shared size preferences, direct edge/corner dragging, keyboard resizing and size reset.
- [x] Shared collapse controls that keep drafts and feature state mounted.
- [x] Central page section discovery without moving React-owned DOM nodes.
- [x] Compact spacing, flexible grouping and width-based container queries.
- [x] Focus selector for viewing one section at a time.
- [x] Existing home widgets use the same sizing system and paginate long collections.
- [x] Home Todo widget supports adding and completing tasks against existing app data.
- [x] Use feature here opens the existing full feature inside a widget on demand, with shared cross-document data synchronization.
- [x] Finish desktop/mobile layout and accessibility verification.

Drag any section's edges or corners directly, like resizing a desktop window. No size menu or arrange mode is needed. The bottom corner is also keyboard accessible: arrow keys resize it, Shift uses smaller steps, and Home resets. Open **Bloom → Arrange layout** for section focus, collapse and reset controls; **Customize widgets** also exposes home widget order and removal. Custom dimensions and collapse state persist locally per widget.

Content uses its natural height by default. Explicitly short widgets retain a reachable internal scroll area instead of clipping content. Wide desktops place related sections together; narrow widgets switch shared grids and forms into compact layouts. The View selector focuses one section without unmounting the others.

## Verification

### Interval countdown styling

- [x] Match the [Pinterest reference](https://www.pinterest.com/pin/750060512983502539/) with a flat blue progress ring, neutral track and lighter centered digits.
- [x] Keep Work, Rest, Warm up, round labels and timer behavior unchanged.
- [x] Visually check the local interval page; verify the 240px ring fits a 320px viewport without horizontal overflow.
- [x] Add the reference's falling-number transition: the outgoing value drops below the readout while the new value enters from above over 450ms. Reduced-motion preferences disable movement; outgoing text is hidden from screen readers.
- [x] Ring and countdown digits follow the existing phase-label color. Verify matching computed colors for Work and Rest, live number transitions and resetting the timer.

### Follow-up: Settings and chat layout controls

- [x] Every feature's Basic/Advanced preference is edited in Settings → Feature modes, including Todo and Settings itself.
- [x] Feature pages no longer show mode controls; existing preferences remain compatible.
- [x] Bloom launcher uses a 52px tap target at the bottom-left; section navigation moves toward the right edge.
- [x] Arrange layout, section focus, collapse and reset controls move into Bloom.
- [x] Resize limits measure intrinsic overflow and visible media after reflow, and recheck saved dimensions when content or the viewport changes.
- [x] Code illustration and stack children no longer shrink into overlapping text.
- [x] Shared bottom padding no longer creates empty scroll destinations; navigation measures visible content and clamps jumps to its end.
- [x] Mind-map tools wrap in a separate row instead of covering diagram labels.
- [x] Soundscape moves beside Search; an essential Settings switch persists its visibility.
- [x] Conversation examples, restart and export move to a right-click menu, with keyboard and touch overflow access.
- [x] Escape dismisses a conversation menu without closing Bloom; portaled menu keys bypass the panel focus trap.
- [x] Complete follow-up production/browser/accessibility checks.

Follow-up page audits passed for Settings, Code, Mind maps, Todo, Overview, Mala and Vision board in desktop Basic, 320px Basic and 320px Advanced modes (21 checks). They report no runtime errors, automated WCAG violations, duplicate IDs, nested controls or horizontal page overflow:

- [Desktop Basic](layout-controls-desktop-basic.json)
- [320px Basic](layout-controls-reflow-basic.json)
- [320px Advanced](layout-controls-reflow-advanced.json)

These audits cover the shared layout and header changes. The subsequent menu Escape fix is covered by the interaction tests. Automated checks do not certify full WCAG conformance. PR CI includes the new layout-control and chat interaction suites alongside the existing full-route audits.

Final TypeScript, focused lint and production build passed. Shared layout, page-mode, theme and navigation regression suites passed. All 634 emitted JavaScript files passed ECMAScript 2023 syntax validation. Startup assets remain within budget: 2,556,163 JavaScript bytes and 379,119 CSS bytes.

All 44 applicable production browser cases passed across desktop, 320px reflow and 390px mobile; four dedicated-mobile cases are intentionally skipped on other profiles. The first run passed 42 cases; two focused reruns passed after allowing slower transcript cleanup and updating the focus-order assertion for the new overflow button. Checks cover the three-button slider, transcript download, drafts, mobile full-screen/focus behavior, menu Escape, Soundscape visibility, Settings modes, mind-map scroll bounds, drag/keyboard resizing and embedded Todo widgets. New menus and the open sound mixer also pass automated WCAG checks.

### Original widget rollout

TypeScript, production build and focused lint passed. All 17 regression tests passed across the shared layout, page modes and Todo interactions. All 21 production browser cases passed at desktop, 390px mobile and 320px reflow widths, covering direct dragging, keyboard resizing, collapse/draft preservation, saved dimensions, focus view and inline full-feature Todo data sharing.

Route audits cover 83 pages in each of desktop Basic, 320px Basic and 320px Advanced modes (249 checks). Shared fixes and initially delayed routes were rechecked against the final production build. Reports record those rechecks:

- [Desktop Basic](widgets-desktop-basic.json)
- [320px Basic](widgets-reflow-basic.json)
- [320px Advanced](widgets-reflow-advanced.json)

All reports contain zero runtime errors, automated WCAG violations, duplicate IDs, nested links/buttons or page horizontal overflow. CI now checks desktop/mobile/reflow in both modes and includes widget interaction tests. Automated accessibility checks do not certify full WCAG conformance.

All 634 emitted JavaScript files passed ECMAScript 2023 syntax validation. Startup assets remain within the existing budgets: 2,545,340 JavaScript bytes and 371,795 CSS bytes. Multiple full features can stay open independently inside home widgets; full apps load only when requested.
