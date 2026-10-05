export const calmJournalPalette = [
  '#637d70',
  '#737b96',
  '#947d87',
  '#8d8068',
  '#5e7e84',
  '#817496',
  '#8e7563',
  '#758264',
] as const

/** Assign once per journal, so its cover stays familiar across visits. */
export function journalColor(id: string): string {
  try {
    const key = `bloom-journal-color:${id}`
    const saved = localStorage.getItem(key)
    if (calmJournalPalette.some((color) => color === saved)) return saved!
    const color =
      calmJournalPalette[Math.floor(Math.random() * calmJournalPalette.length)]
    localStorage.setItem(key, color)
    return color
  } catch {
    const hash = Array.from(id).reduce(
      (value, letter) => (value * 31 + letter.charCodeAt(0)) >>> 0,
      0,
    )
    return calmJournalPalette[hash % calmJournalPalette.length]
  }
}
