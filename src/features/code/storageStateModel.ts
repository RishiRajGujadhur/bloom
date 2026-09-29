export type StorageRules = { saveOnAdd: boolean; restoreOnMount: boolean; syncOnRemove: boolean }
export const STARTER_STORAGE_RULES: StorageRules = { saveOnAdd: false, restoreOnMount: true, syncOnRemove: false }

export const STORAGE_CASES = [
  { id: 'add', title: 'Add a story', expected: true, key: 'saveOnAdd', reason: 'Write the updated list to localStorage after adding an item.' },
  { id: 'mount', title: 'Reopen the app', expected: true, key: 'restoreOnMount', reason: 'Read and parse the stored list when the preview mounts.' },
  { id: 'remove', title: 'Remove a story', expected: true, key: 'syncOnRemove', reason: 'Write the updated list after removal so deleted items stay gone.' },
] as const

export function checkStorageRules(rules: StorageRules) {
  const cases = STORAGE_CASES.map((item) => ({ ...item, pass: rules[item.key] === item.expected }))
  return { pass: cases.every((item) => item.pass), cases }
}

export function parseStoredStories(raw: string | null): string[] {
  if (!raw) return []
  try {
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, 20) : []
  } catch { return [] }
}
