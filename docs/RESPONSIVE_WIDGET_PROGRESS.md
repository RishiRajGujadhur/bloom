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
- [ ] Finish desktop/mobile layout and accessibility verification.

Drag any section's edges or corners directly, like resizing a desktop window. No size menu or arrange mode is needed. The bottom corner is also keyboard accessible: arrow keys resize it, Shift uses smaller steps, and Home resets. **Arrange layout** exposes collapse and reset controls; **Customize widgets** also exposes home widget order and removal. Custom dimensions and collapse state persist locally per widget.

Content uses its natural height by default. Explicitly short widgets retain a reachable internal scroll area instead of clipping content. Wide desktops place related sections together; narrow widgets switch shared grids and forms into compact layouts. The View selector focuses one section without unmounting the others.

## Verification

Pending final build, interaction tests, responsive route audits and automated WCAG checks. Automated accessibility checks do not certify full WCAG conformance.
