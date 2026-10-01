import { useEffect, useState } from 'react'

const mb = (b: number) => `${(b / 1048576).toFixed(b < 10485760 ? 1 : 0)} MB`

/** How much this browser is holding for Bloom, the biggest local stores, and whether it's protected from eviction. */
export function StorageMeter() {
  const [usage, setUsage] = useState<{ used: number; quota: number } | null>(null)
  const [persisted, setPersisted] = useState<boolean | null>(null)
  useEffect(() => {
    void navigator.storage?.estimate?.().then((e) => setUsage({ used: e.usage ?? 0, quota: e.quota ?? 0 }))
    void navigator.storage?.persisted?.().then(setPersisted)
  }, [])
  const top = (() => {
    try {
      return Object.keys(localStorage)
        .map((k) => [k, (localStorage.getItem(k) ?? '').length * 2] as const)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    } catch {
      return []
    }
  })()
  if (!usage) return null
  const share = usage.quota ? usage.used / usage.quota : 0
  return (
    <div className="storage-meter">
      <strong>Storage</strong>
      <span className="storage-bar" aria-hidden="true">
        <i style={{ width: `${Math.max(1, Math.min(100, share * 100))}%` }} />
      </span>
      <small>
        {mb(usage.used)} used{usage.quota ? ` of about ${mb(usage.quota)}` : ''}
        {persisted === true && ' · protected from automatic clean-up ✓'}
      </small>
      {persisted === false && (
        <button type="button" className="quiet-button" onClick={() => void navigator.storage.persist().then(setPersisted)}>
          Keep my data safe from browser clean-up
        </button>
      )}
      {top.length > 0 && (
        <details>
          <summary>Largest local stores</summary>
          <ul>
            {top.map(([k, b]) => (
              <li key={k}>
                <code>{k}</code> · {b < 1024 ? `${b} B` : `${(b / 1024).toFixed(0)} KB`}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
