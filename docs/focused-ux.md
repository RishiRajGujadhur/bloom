# Focused UX and progression

## Research used

- [Forest](https://forestapp.cc/): configurable focus sessions, visible tree growth, a persistent collection, and focus history. Bloom now uses a pixel garden, selectable durations, optional task association, session history, and an opt-in strict browser-tab rule.
- [Habitica challenge implementation](https://github.com/HabitRPG/habitica/blob/develop/website/server/controllers/api-v3/challenges.js): joining a challenge associates challenge tasks with the user. Bloom accepts a local challenge once, adds dated to-dos, and displays its goal and completion progress.
- [Habitica task overview](https://tools.habitica.com/): separate habits, daily activities, and one-time to-dos. Bloom preserves daily intentions and adds a persistent To-dos page.

These are adapted interaction patterns; no competitor art or proprietary assets were copied. Bloom reuses its existing pixel sprite library, Lucide, TipTap, and Driver.js. The new pixel tree is an original inline SVG.

## Resulting flows

- Dashboard: daily counts, habits, intentions, and reflection shortcuts. RPG panels move to Growth.
- Daybook: direction → one of five formats → writing. Guided and two-column formats show one prompt at a time; extra explanation is behind “About this page.” Unsaved changes need an explicit discard when leaving the editor. Switching feature pages retains the open editor.
- Sidebar: a named switch below the brand enables icon mode, with a persistent preference and labels in tooltips. Mobile keeps the drawer.
- Growth: Seedling, Skill tree, and Rewards are separate views. Evolution milestones show the actual attribute thresholds. Locked skills can be inspected; prerequisites and progress explain what remains.
- Focus: 5/15/25/50-minute sessions, optional task linking, automatic settlement, a persistent tree collection, XP, gold, and history. Finishing a linked session offers a separate task-completion action.
- Challenges: preview steps → accept → complete dated tasks in To-dos. Each accepted challenge provides a goal. Task and challenge rewards are granted only once, even after undo/redo.
- To-dos: add, edit title/date, complete/uncomplete, and filter open, due today (including overdue), or completed tasks.

## Progression rules

A completed to-do grants 10 XP and 2 gold. A finished challenge grants its listed XP and 10 gold. Each focus session grants its duration in XP, 5 gold, and 5 intelligence points. Completed tasks contribute 2 spirit points. Breathwork adds 5 XP to reflections, Meditation adds 5 XP to focus sessions, and Zen adds 5 XP to to-dos. Skills unlock at XP milestones; XP is not spent.

## Boundaries

Challenges are local curated challenges, not an online community or leaderboard. Strict focus responds to this browser tab becoming hidden; a web page cannot block other applications. Existing saves migrate to the new collections with empty defaults and retain their intentions and RPG progress. Journal entries still require saving; an open draft is retained during in-app page navigation, but not after reloading the browser. New feature copy currently uses English alongside the existing localized content.

## Verification

Automated coverage includes challenge acceptance, duplicate prevention, goal progress, rewards after undo/redo, old-save migration, focus duration/failure/idempotency, cross-page focus completion, skill prerequisites, wizard navigation, and persistence. Browser automation is failing during initial navigation in this environment, so responsive visual verification remains outstanding.
