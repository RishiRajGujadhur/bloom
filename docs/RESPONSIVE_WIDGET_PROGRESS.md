# Responsive sections and reusable widgets

## Implementation

- [x] Shared size preferences, mobile preset, keyboard/pointer resizing and content-height reset.
- [x] Shared collapse controls that keep drafts and feature state mounted.
- [x] Central page section discovery without moving React-owned DOM nodes.
- [x] Compact spacing, flexible grouping and width-based container queries.
- [x] Focus selector for viewing one section at a time.
- [x] Existing home widgets use the same sizing system and paginate long collections.
- [x] Home Todo widget supports adding and completing tasks against existing app data.
- [ ] Finish desktop/mobile layout and accessibility verification.

Use **Arrange layout** to expose section controls, or **Customize widgets** for home widgets. Choose **Mobile size**, **Comfortable**, **Fill available space**, or drag the bottom corner. Arrow keys resize the focused corner; Shift uses smaller steps; Home resets. Custom dimensions and collapse state persist locally per widget.

Content uses its natural height by default. Explicitly short widgets retain a reachable internal scroll area instead of clipping content. Wide desktops place related sections together; narrow widgets switch shared grids and forms into compact layouts. The View selector focuses one section without unmounting the others.

## Verification

Pending final build, interaction tests, responsive route audits and automated WCAG checks. Automated accessibility checks do not certify full WCAG conformance.
