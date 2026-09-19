# Insights and journaling activity

Open **Insights** from the sidebar. **Settings → Features → Insights & Analytics**
controls the page and navigation. The default is enabled. Legacy settings gain
this default without losing previous toggles; hiding Insights never deletes data.
Chart code is a separate lazy-loaded bundle using Visx SVG primitives.

## Activity and storage

Daybook pages now store an optional `activity: { day, at }[]` alongside their
existing content. Each nonempty completed page earns at most one activity record
per local calendar day. Saving the page and activity uses the same localStorage
write. If it fails, the editor remains open for retry and no new activity is
committed. Opening or typing into an editor does not earn a streak.

The Daybook store is owned by the app shell and remains available when navigating
or disabling the feature. Unreadable stored content is not overwritten. The search
database remains a separate index and is not used to calculate activity.

Saved chat sessions gain `metadata.completedAt` and `metadata.completedDay`.
The optional fields preserve compatibility with older sessions. The existing
chat persistence/error behavior is unchanged; an Insights warning indicates
when application data could not be saved.

Backfill is conservative: legacy Daybook pages contribute only their latest
saved timestamp, and completed saved chat sessions use their final user-response
timestamp. Historical edits that were overwritten cannot be recovered. New
records retain their original local day when the timezone changes; legacy
timestamps are interpreted using the current device timezone.

## Calculations

- Sources: Daybook and completed saved chat sessions. Empty pages, drafts,
  invalid dates, duplicates and future activity do not earn journal days.
- Current streak ends today if logged, otherwise yesterday. Missing today does
  not break the streak until the next local day. Calendar stepping uses local
  dates, not elapsed 24-hour intervals, to handle daylight-saving boundaries.
- Longest streak covers all recorded history for the selected journal source.
- Month total counts unique active days in the current calendar month.
- Consistency is active days divided by the selected 30/90/365 calendar-day
  range, including today. Days before the first record count as inactive.
- Heatmap intensity means completed entries (0, 1, 2, 3+), not streak length.
- Mood is the daily average of explicit 1–5 ratings in saved chat sessions.
  Missing values remain gaps. Source filters only affect journal statistics.
- Habits use current habits' recorded completion dates, optionally filtered by
  habit. This is a completion count, not an inferred historical adherence rate.
- RPG attributes reuse `totals()` from the RPG dashboard and show all-time
  Strength, Intelligence and Spirit points on a shared axis scale.

## Accessibility and verification

Heatmap cells support focus, tap, Enter/Space and arrow keys. Data tables and a
day selector expose chart values without relying on hover or color. Styles use
theme tokens, responsive layouts, scrollable charts and reduced-motion support.
The app-level audio provider is not remounted by page navigation.

Tests cover migration, deduplication, midnight/leap-year boundaries, missing days,
storage failures, corrupted storage and enabling/disabling Insights. A separate
run with `TZ=America/New_York` checks calendar behavior in a DST timezone. Browser
automation was unavailable during implementation, so visual QA is still needed.
