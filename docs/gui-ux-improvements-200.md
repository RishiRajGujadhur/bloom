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
| 86 | Enlarge controls to a 44px touch target in ui (.ui-menu-item) | `src/components/ui/ui.css` |
| 87 | Enlarge controls to a 44px touch target in ui (.ui-select) | `src/components/ui/ui.css` |
| 88 | Enlarge controls to a 44px touch target in ui (.ui-carousel-nav button) | `src/components/ui/ui.css` |
| 89 | Enlarge controls to a 44px touch target in collectibles (.collectible-card > button) | `src/features/collectibles/collectibles.css` |
| 90 | Enlarge controls to a 44px touch target in diet (.diet-kinds button, .diet-feel button, .diet-library button) | `src/features/diet/diet.css` |
| 91 | Enlarge controls to a 44px touch target in diet (.diet-tabs button) | `src/features/diet/diet.css` |
| 92 | Enlarge controls to a 44px touch target in diet (.rb-servings button) | `src/features/diet/diet.css` |
| 93 | Enlarge controls to a 44px touch target in energy (.energy-range button) | `src/features/energy/energy.css` |
| 94 | Enlarge controls to a 44px touch target in energy (.energy-empty-actions button) | `src/features/energy/energy.css` |
| 95 | Enlarge controls to a 44px touch target in epiphany (.epiphany-grades button) | `src/features/epiphany/epiphany.css` |
| 96 | Enlarge controls to a 44px touch target in explore (.explore-builder button) | `src/features/explore/explore.css` |
| 97 | Enlarge controls to a 44px touch target in boardLessons (.bl-progress button) | `src/features/games/boardLessons.css` |
| 98 | Enlarge controls to a 44px touch target in habitCalendar (.habit-calendar-toolbar .icon-button) | `src/features/habits/habitCalendar.css` |
| 99 | Enlarge controls to a 44px touch target in ink (.ink-colors button) | `src/features/ink/ink.css` |
| 100 | Enlarge controls to a 44px touch target in energyCompass (.energy-compass-head button) | `src/features/innovation/energyCompass.css` |
| 101 | Enlarge controls to a 44px touch target in lab (.lab-range button) | `src/features/lab/lab.css` |
| 102 | Enlarge controls to a 44px touch target in mindmap (.mm-tools button) | `src/features/mindmap/mindmap.css` |
| 103 | Enlarge controls to a 44px touch target in money (.mn-cat) | `src/features/money/money.css` |
| 104 | Enlarge controls to a 44px touch target in money (.mn-month-head button) | `src/features/money/money.css` |
| 105 | Enlarge controls to a 44px touch target in money (html[data-theme='galaxy'] .studio[data-studio='money'] .mn-month-head button) | `src/features/money/money.css` |
| 106 | Enlarge controls to a 44px touch target in reminders (.reminder-pop-actions button) | `src/features/reminders/reminders.css` |
| 107 | Enlarge controls to a 44px touch target in shop (.shop-card button) | `src/features/rewards/shop.css` |
| 108 | Enlarge controls to a 44px touch target in showcase (.sc-search button) | `src/features/showcase/showcase.css` |
| 109 | Enlarge controls to a 44px touch target in taichi (.tc-elements button, .tc-btn) | `src/features/taichi/taichi.css` |
| 110 | Enlarge controls to a 44px touch target in timeSince (.ts-label .icon-button) | `src/features/timeSince/timeSince.css` |
| 111 | Enlarge controls to a 44px touch target in workspace (#todo-page .todo-mode button) | `src/features/todos/workspace.css` |
| 112 | Enlarge controls to a 44px touch target in workspace (#todo-page .overdue-bar button) | `src/features/todos/workspace.css` |
| 113 | Enlarge controls to a 44px touch target in wellbeing (.wb-chips button) | `src/features/wellbeing/wellbeing.css` |
| 114 | Enlarge controls to a 44px touch target in coachBattle (.cb-menu select,.cb-menu button) | `src/features/workout/coachBattle.css` |
| 115 | Enlarge controls to a 44px touch target in coachBattle (.cb-journal button) | `src/features/workout/coachBattle.css` |
| 116 | Enlarge controls to a 44px touch target in formcoach (.fc-workout-focused .fc-camera-controls button) | `src/features/workout/formcoach.css` |
| 117 | Enlarge controls to a 44px touch target in formcoach (.fc-view-modes button) | `src/features/workout/formcoach.css` |
| 118 | Enlarge controls to a 44px touch target in formcoach (.fc-workout-focused .cb-actions button) | `src/features/workout/formcoach.css` |
| 119 | Enlarge controls to a 44px touch target in formcoach (.fc-info-slider nav button) | `src/features/workout/formcoach.css` |
| 120 | Improve small text readability in settings.module (.eyebrow) | `src/settings.module.css` |
| 121 | Improve small text readability in choiceSlider (.choice-slider-control) | `src/companion/choiceSlider.css` |
| 122 | Improve small text readability in companion (.bloom-story p) | `src/companion/companion.css` |
| 123 | Improve small text readability in qol (.choice-slider-items small) | `src/companion/qol.css` |
| 124 | Improve small text readability in bloom-experience (.bloom-heading.feature-heading p) | `src/components/bloom-experience.css` |
| 125 | Improve small text readability in features (.todo-overview span) | `src/features/features.css` |
| 126 | Improve small text readability in habits (.habits-page-toolbar .segmented button small) | `src/features/habits.css` |
| 127 | Improve small text readability in insights (.insight-stat small, .insight-note, .heatmap-legend) | `src/features/insights.css` |
| 128 | Improve small text readability in library (.adopt-detail) | `src/features/library.css` |
| 129 | Improve small text readability in planning (.planning-fields label, .planning-form label, .perspective-picker, .calendar-capacity label) | `src/features/planning.css` |
| 130 | Improve small text readability in urge (.urge-progress li) | `src/features/urge.css` |
| 131 | Improve small text readability in urgeClock (.urge-record) | `src/features/urgeClock.css` |
| 132 | Improve small text readability in constellation (.constellation-head span) | `src/rpg/constellation.css` |
| 133 | Improve small text readability in rewards (.growth-eyebrow) | `src/rpg/rewards.css` |
| 134 | Improve small text readability in rpg (.rpg-heading>.eyebrow) | `src/rpg/rpg.css` |
| 135 | Improve small text readability in shared-ui (.app-shell .topbar .theme-toggle, .app-shell .topbar .quiet-button) | `src/styles/shared-ui.css` |
| 136 | Improve small text readability in overview (.is-hero .bloom-kicker) | `src/components/dashboard/overview.css` |
| 137 | Improve small text readability in bookshelf (.journal-shelf > header p) | `src/components/daybook/bookshelf.css` |
| 138 | Improve small text readability in daybook (.daybook-crumbs) | `src/components/daybook/daybook.css` |
| 139 | Improve small text readability in selection (.daybook .direction-copy small) | `src/components/daybook/selection.css` |
| 140 | Improve small text readability in guide (.bloom-guide .driver-popover-progress-text) | `src/components/layout/guide.css` |
| 141 | Improve small text readability in navContext (.nav-recent::before) | `src/components/layout/navContext.css` |
| 142 | Improve small text readability in Sidebar.module (.collapseToggle) | `src/components/layout/Sidebar.module.css` |
| 143 | Improve small text readability in writingAssist (.offline-pill) | `src/components/layout/writingAssist.css` |
| 144 | Improve small text readability in ThemePicker.module (.block h3) | `src/components/settings/ThemePicker.module.css` |
| 145 | Improve small text readability in shared (.ex-aside) | `src/components/studio/shared.css` |
| 146 | Adapt Money totals to narrow screens and enlarged text | `src/features/money/money.css` |
| 147 | Improve small text readability in shared menus (.app-shell .sidebar .nav-section) | `src/styles/shared-ui.css` |
| 148 | Improve small text readability in ui (.ui-menu-hint) | `src/components/ui/ui.css` |
| 149 | Improve small text readability in DrawingPractice.module (.prompt) | `src/components/VisionBoard/DrawingPractice.module.css` |
| 150 | Improve small text readability in VisionBoard.module (.heading > div > span) | `src/components/VisionBoard/VisionBoard.module.css` |
| 151 | Improve small text readability in affirm (.af-deck) | `src/features/affirm/affirm.css` |
| 152 | Improve small text readability in arcade (.sb-card b) | `src/features/arcade/arcade.css` |
| 153 | Improve small text readability in body (.bd-goal-text, .bd-axis) | `src/features/body/body.css` |
| 154 | Improve small text readability in bodyTools (.body-tool-preference) | `src/features/body/bodyTools.css` |
| 155 | Improve small text readability in collectibles (.collectible-eyebrow) | `src/features/collectibles/collectibles.css` |
| 156 | Improve small text readability in garage (.garage-pad-label) | `src/features/collectibles/garage.css` |
| 157 | Improve small text readability in core (.now-kicker) | `src/features/core/core.css` |
| 158 | Improve small text readability in dailyFlow (.df-ring > span) | `src/features/dailyFlow/dailyFlow.css` |
| 159 | Improve small text readability in diet (.diet-plate-label) | `src/features/diet/diet.css` |
| 160 | Improve small text readability in energy (.energy-note) | `src/features/energy/energy.css` |
| 161 | Improve small text readability in english (.en-motion-setting) | `src/features/english/english.css` |
| 162 | Improve small text readability in learningMap (.en-topic) | `src/features/english/learningMap.css` |
| 163 | Improve small text readability in epiphany (.fc-label) | `src/features/epiphany/epiphany.css` |
| 164 | Improve small text readability in exercise (.ex-ring .ex-ring-sub) | `src/features/exercise/exercise.css` |
| 165 | Improve small text readability in explore (.explore-builder button) | `src/features/explore/explore.css` |
| 166 | Improve small text readability in flow (.flow-mountain figcaption) | `src/features/flow/flow.css` |
| 167 | Improve small text readability in gameCards (.gc-number,.gc-mark) | `src/features/games/gameCards.css` |
| 168 | Improve small text readability in globe (.gq-missed) | `src/features/globe/globe.css` |
| 169 | Improve small text readability in habitCalendar (.habit-calendar-view) | `src/features/habits/habitCalendar.css` |
| 170 | Improve small text readability in impact (.impact-hint) | `src/features/impact/impact.css` |
| 171 | Improve small text readability in ink (.ink-prompt) | `src/features/ink/ink.css` |
| 172 | Improve small text readability in interval (.iv-weeks span) | `src/features/interval/interval.css` |
| 173 | Improve small text readability in journey (.journey-day) | `src/features/journey/journey.css` |
| 174 | Improve small text readability in lab (.lab-heat) | `src/features/lab/lab.css` |
| 175 | Improve small text readability in meditate (.md-kicker) | `src/features/meditate/meditate.css` |
| 176 | Improve small text readability in mindmap (.mm-save-status) | `src/features/mindmap/mindmap.css` |
| 177 | Improve small text readability in money (.mn-csv) | `src/features/money/money.css` |
| 178 | Improve small text readability in monk (.monk-foot) | `src/features/monk/monk.css` |
| 179 | Improve small text readability in palace (.palace-hud .ov-secondary) | `src/features/palace/palace.css` |
| 180 | Improve small text readability in shared menus (.app-shell .sidebar nav button.nav-group) | `src/styles/shared-ui.css` |
| 181 | Improve small text readability in piano (.pn-midi) | `src/features/piano/piano.css` |
| 182 | Improve small text readability in places (.places-list input) | `src/features/places/places.css` |
| 183 | Improve small text readability in posture (.posture-stats dt) | `src/features/posture/posture.css` |
| 184 | Improve small text readability in release (.release-card small) | `src/features/release/release.css` |
| 185 | Improve small text readability in reminders (.reminder-pop-actions button) | `src/features/reminders/reminders.css` |
| 186 | Improve small text readability in rewards (.streak-petals) | `src/features/rewards/rewards.css` |
| 187 | Improve small text readability in shop (.shop-price) | `src/features/rewards/shop.css` |
| 188 | Improve small text readability in run (.run-goal .run-goal-sub) | `src/features/run/run.css` |
| 189 | Improve small text readability in scan (.sc-grade small) | `src/features/scan/scan.css` |
