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
| 25 | Prevent narrow-screen card grid overflow in planning (.planning-fields) | `src/features/planning.css` |
| 26 | Prevent narrow-screen card grid overflow in urgeClock (.urge-clocks) | `src/features/urgeClock.css` |
| 27 | Prevent narrow-screen card grid overflow in shortcuts (.kb-cols) | `src/components/layout/shortcuts.css` |
| 28 | Prevent narrow-screen card grid overflow in localFonts (.lf-grid) | `src/components/settings/localFonts.css` |
| 29 | Prevent narrow-screen card grid overflow in ThemePicker.module (.themeGrid) | `src/components/settings/ThemePicker.module.css` |
| 30 | Prevent narrow-screen card grid overflow in ThemePicker.module (.fontList) | `src/components/settings/ThemePicker.module.css` |
| 31 | Keep Studio content inside narrow cards instead of clipping it | `src/components/studio/studio.css` |
| 32 | Give Studio tab labels room and scroll overflowing choices | `src/components/studio/studio.css` |
| 33 | Prevent narrow-screen card grid overflow in avatarPicker (.avatar-options) | `src/components/ui/avatarPicker.css` |
| 34 | Prevent narrow-screen card grid overflow in pointer (.pt-grid) | `src/components/ui/pointer.css` |
| 35 | Prevent narrow-screen card grid overflow in arcade (.ar-grid) | `src/features/arcade/arcade.css` |
| 36 | Prevent narrow-screen card grid overflow in code (.cd-cheat-grid) | `src/features/code/code.css` |
| 37 | Prevent narrow-screen card grid overflow in cpr (.cp-cards) | `src/features/cpr/cpr.css` |
| 38 | Prevent narrow-screen card grid overflow in dailyFlow (.df-steps) | `src/features/dailyFlow/dailyFlow.css` |
| 39 | Prevent narrow-screen card grid overflow in decide (.dc-row) | `src/features/decide/decide.css` |
| 40 | Prevent narrow-screen card grid overflow in diet (.nut-table ul) | `src/features/diet/diet.css` |
| 41 | Prevent narrow-screen card grid overflow in dojo (.dojo-grid) | `src/features/dojo/dojo.css` |
| 42 | Prevent narrow-screen card grid overflow in english (.en-grid) | `src/features/english/english.css` |
| 43 | Prevent narrow-screen card grid overflow in english (.en-pics) | `src/features/english/english.css` |
| 44 | Prevent narrow-screen card grid overflow in english (.en-badges) | `src/features/english/english.css` |
| 45 | Prevent narrow-screen card grid overflow in english (.en-cards) | `src/features/english/english.css` |
| 46 | Prevent narrow-screen card grid overflow in story (.st-nodes) | `src/features/english/story.css` |
| 47 | Prevent narrow-screen card grid overflow in epiphany (.epiphany-list) | `src/features/epiphany/epiphany.css` |
| 48 | Prevent narrow-screen card grid overflow in exercise (.ex-prog-grid) | `src/features/exercise/exercise.css` |
| 49 | Prevent narrow-screen card grid overflow in assess (.as-home) | `src/features/games/assess.css` |
| 50 | Prevent narrow-screen card grid overflow in assess (.lb-wrap) | `src/features/games/assess.css` |
| 51 | Prevent narrow-screen card grid overflow in gameCards (.studio-rail.is-all:has(.game-card)) | `src/features/games/gameCards.css` |
| 52 | Prevent narrow-screen card grid overflow in ink (.ink-pages) | `src/features/ink/ink.css` |
| 53 | Prevent narrow-screen card grid overflow in joys (.jy-grid) | `src/features/joys/joys.css` |
| 54 | Prevent narrow-screen card grid overflow in mixer (.mx-layers) | `src/features/mixer/mixer.css` |
| 55 | Prevent narrow-screen card grid overflow in money (.mn-grid) | `src/features/money/money.css` |
| 56 | Prevent narrow-screen card grid overflow in receipts (.rl-grid) | `src/features/money/receipts.css` |
| 57 | Prevent narrow-screen card grid overflow in shop (.shop-grid) | `src/features/rewards/shop.css` |
| 58 | Prevent narrow-screen card grid overflow in welcome (.wf-opts.cards, .wf-opts.theme) | `src/features/welcome/welcome.css` |
| 59 | Prevent narrow-screen card grid overflow in world (.world-districts) | `src/features/world/world.css` |
| 60 | Prevent narrow-screen card grid overflow in world (.world-decor ul) | `src/features/world/world.css` |
| 61 | Prevent narrow-screen card grid overflow in yearbook (.yearbook-options fieldset) | `src/features/yearbook/yearbook.css` |
| 62 | Enlarge controls to a 44px touch target in App (.rating-row button) | `src/App.css` |
| 63 | Enlarge controls to a 44px touch target in App (.journal-mode-switch button) | `src/App.css` |
| 64 | Enlarge controls to a 44px touch target in App (.micro-mood button) | `src/App.css` |
| 65 | Enlarge controls to a 44px touch target in App (.pending-media > div > button) | `src/App.css` |
| 66 | Enlarge controls to a 44px touch target in index (.icon-button, .studio-chip, .quiet-button) | `src/index.css` |
| 67 | Enlarge controls to a 44px touch target in settings.module (.categoryActions button) | `src/settings.module.css` |
| 68 | Enlarge controls to a 44px touch target in companion (.bc-head-actions button) | `src/companion/companion.css` |
| 69 | Enlarge controls to a 44px touch target in bloom-experience (.bloom-rail-toolbar button) | `src/components/bloom-experience.css` |
| 70 | Enlarge controls to a 44px touch target in features (.sidebar nav button) | `src/features/features.css` |
| 71 | Enlarge controls to a 44px touch target in features (.segmented button) | `src/features/features.css` |
| 72 | Enlarge controls to a 44px touch target in library (.adopt-card > button) | `src/features/library.css` |
| 73 | Enlarge controls to a 44px touch target in urge (.urge-habit-grid button, .context-groups button, .captured-context button) | `src/features/urge.css` |
| 74 | Enlarge controls to a 44px touch target in rpg (.morph-button) | `src/rpg/rpg.css` |
| 75 | Enlarge controls to a 44px touch target in shared-ui (.app-shell .topbar .theme-toggle, .app-shell .topbar .quiet-button) | `src/styles/shared-ui.css` |
| 76 | Enlarge controls to a 44px touch target in shared-ui (.filter-chips button) | `src/styles/shared-ui.css` |
| 77 | Improve small text readability in shared menus (.streak-pill) | `src/styles/shared-ui.css` |
| 78 | Enlarge controls to a 44px touch target in titlebar (.topbar :is(button, [role='button'], .search-trigger, input)) | `src/styles/titlebar.css` |
| 79 | Enlarge controls to a 44px touch target in bookshelf (.journal-reader-controls button) | `src/components/daybook/bookshelf.css` |
| 80 | Enlarge controls to a 44px touch target in editor.module (.toolbar button) | `src/components/daybook/editor.module.css` |
| 81 | Enlarge controls to a 44px touch target in guide (.bloom-guide .driver-popover-footer button) | `src/components/layout/guide.css` |
| 82 | Enlarge controls to a 44px touch target in shortcuts (.kb-sheet header button) | `src/components/layout/shortcuts.css` |
| 83 | Enlarge controls to a 44px touch target in studio (.studio-tabs button) | `src/components/studio/studio.css` |
| 84 | Enlarge controls to a 44px touch target in studio (.studio-seg button, .studio-chip) | `src/components/studio/studio.css` |
| 85 | Enlarge controls to a 44px touch target in studio (.studio-rail-arrows button) | `src/components/studio/studio.css` |
