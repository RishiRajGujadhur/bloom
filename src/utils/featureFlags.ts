/* ==========================================================================
   featureFlags.ts — enable/disable parts of the dashboard, plus small
   behaviour preferences. Every flag actually does something: one writer
   (this module) owns the storage key, and each flag maps either to a
   conditionally rendered section (features) or to an attribute on <html>
   that the CSS reacts to (preferences).
   ========================================================================== */

export type FeatureFlagId =
  | 'habitTracker'
  | 'chatJournal'
  | 'rpgDashboard'
  | 'intentions'
  | 'languageSelector'
  | 'reduceMotion'
  | 'compactCards'

/** `features` switch whole sections on and off; `preferences` tune behaviour. */
export type FeatureFlagGroup = 'features' | 'preferences'

export interface FeatureFlagDefinition {
  id: FeatureFlagId
  group: FeatureFlagGroup
  defaultOn: boolean
}

export type FeatureFlagState = Record<FeatureFlagId, boolean>

export const FEATURE_FLAG_STORAGE_KEY = 'mindfulness-dashboard-feature-flags'

export const FEATURE_FLAGS: FeatureFlagDefinition[] = [
  { id: 'habitTracker', group: 'features', defaultOn: true },
  { id: 'chatJournal', group: 'features', defaultOn: true },
  { id: 'rpgDashboard', group: 'features', defaultOn: true },
  { id: 'intentions', group: 'features', defaultOn: true },
  { id: 'languageSelector', group: 'features', defaultOn: true },
  { id: 'reduceMotion', group: 'preferences', defaultOn: false },
  { id: 'compactCards', group: 'preferences', defaultOn: false },
]

export const DEFAULT_FLAGS: FeatureFlagState = FEATURE_FLAGS.reduce(
  (flags, flag) => ({ ...flags, [flag.id]: flag.defaultOn }),
  {} as FeatureFlagState,
)

export const flagsInGroup = (group: FeatureFlagGroup) =>
  FEATURE_FLAGS.filter((flag) => flag.group === group)

const isFlagId = (value: string): value is FeatureFlagId =>
  FEATURE_FLAGS.some((flag) => flag.id === value)

/** Never throws: a corrupt or unavailable store yields the defaults. */
export function getFeatureFlags(): FeatureFlagState {
  try {
    const raw = localStorage.getItem(FEATURE_FLAG_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_FLAGS }
    const parsed = JSON.parse(raw) as Record<string, unknown>
    // Merge rather than trust: unknown keys are dropped and missing ones fall
    // back to their default, so a flag added later is never left undefined.
    const merged = { ...DEFAULT_FLAGS }
    for (const [key, value] of Object.entries(parsed)) {
      if (isFlagId(key) && typeof value === 'boolean') merged[key] = value
    }
    return merged
  } catch {
    return { ...DEFAULT_FLAGS }
  }
}

export function setFeatureFlag(
  id: FeatureFlagId,
  value: boolean,
): FeatureFlagState {
  const next = { ...getFeatureFlags(), [id]: value }
  return persist(next)
}

export function setFeatureFlags(state: FeatureFlagState): FeatureFlagState {
  return persist({ ...DEFAULT_FLAGS, ...state })
}

function persist(state: FeatureFlagState): FeatureFlagState {
  try {
    localStorage.setItem(FEATURE_FLAG_STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* the preference still applies for this session */
  }
  return state
}

/**
 * Push the behaviour preferences onto <html>; the CSS in App.css reacts to
 * `data-motion` and `data-density`. Called on every change so it stays cheap
 * and idempotent.
 */
export function applyFeatureFlags(flags: FeatureFlagState): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.motion = flags.reduceMotion ? 'reduced' : 'full'
  root.dataset.density = flags.compactCards ? 'compact' : 'comfortable'
}
