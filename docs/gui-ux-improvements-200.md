# Bloom: 200 GUI and UX improvements

Each numbered row corresponds to one independently committed and pushed improvement. Existing theme and motion preferences remain supported.

| # | Improvement | Source |
| --- | --- | --- |
| 1 | Make the skip-navigation link legible in light and dark themes | `src/index.css` |
| 2 | Give all native form fields a visible keyboard focus ring | `src/index.css` |
| 3 | Make explicitly invalid fields visibly identifiable | `src/index.css` |
| 4 | Keep invalid-field feedback visible while correcting an entry | `src/index.css` |
| 5 | Allow grouped forms to shrink inside narrow cards | `src/index.css` |
| 6 | Wrap long form section labels without horizontal overflow | `src/index.css` |
| 7 | Make native select text follow the chosen app font | `src/index.css` |
| 8 | Communicate disabled form controls consistently | `src/index.css` |
| 9 | Connect native choice controls to the selected accent theme | `src/index.css` |
| 10 | Expose keyboard focus on expandable sections | `src/index.css` |
| 11 | Prevent scrolling a menu from moving the page underneath | `src/components/ui/ui.css` |
| 12 | Keep popup menus within narrow viewport edges | `src/components/ui/ui.css` |
| 13 | Keep long menu group labels within their popup | `src/components/ui/ui.css` |
| 14 | Wrap search keyboard hints on narrow screens | `src/components/ui/ui.css` |
| 15 | Let semantic-search status and its action wrap cleanly | `src/components/ui/ui.css` |
| 16 | Wrap long unbroken journal content in search previews | `src/components/ui/ui.css` |
| 17 | Fit dialogs inside the visible viewport, including mobile keyboards | `src/App.css` |
| 18 | Keep long dialogs scrollable without scrolling the background | `src/App.css` |
| 19 | Separate dialog titles and close actions when titles wrap | `src/App.css` |
| 20 | Keep long dialog titles from displacing the close button | `src/App.css` |
| 21 | Prevent narrow-screen card grid overflow in App (.pending-media, .journal-media-grid) | `src/App.css` |
| 22 | Prevent narrow-screen card grid overflow in settings.module (.featureGrid) | `src/settings.module.css` |
| 23 | Prevent narrow-screen card grid overflow in features (.page-growth .showcase-grid) | `src/features/features.css` |
| 24 | Prevent narrow-screen card grid overflow in library (.adopt-grid) | `src/features/library.css` |
