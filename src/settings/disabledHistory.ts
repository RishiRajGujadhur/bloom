import type { FeatureFlags } from '../settings/appSettings'

const KEY = 'bloom-feature-disabled-at-v1'

export function readDisabledHistory(): Partial<Record<keyof FeatureFlags, number>> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) || '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(Object.entries(parsed).filter(([, value]) => typeof value === 'number' && Number.isFinite(value) && value > 0))
  } catch { return {} }
}

export function rememberFeatureChanges(before: FeatureFlags, after: FeatureFlags) {
  const history = readDisabledHistory()
  let changed = false
  for (const key of Object.keys(after) as (keyof FeatureFlags)[]) {
    if (before[key] && !after[key]) { history[key] = Date.now(); changed = true }
    else if (!before[key] && after[key] && history[key]) { delete history[key]; changed = true }
  }
  if (changed) try { localStorage.setItem(KEY, JSON.stringify(history)) } catch { /* optional */ }
}
