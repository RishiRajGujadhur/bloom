export type Breakpoints = { twoColumns: number; threeColumns: number }
export const BREAKPOINT_START: Breakpoints = { twoColumns: 700, threeColumns: 900 }
export const BREAKPOINT_CASES = [
  { width: 390, name: 'Phone', expected: 1 },
  { width: 620, name: 'Tablet', expected: 2 },
  { width: 1024, name: 'Desktop', expected: 3 },
] as const

export function columnsAt(width: number, points: Breakpoints) {
  return width < points.twoColumns ? 1 : width < points.threeColumns ? 2 : 3
}

export function checkBreakpoints(points: Breakpoints) {
  return [
    { label: 'Breakpoints stay in order', pass: points.twoColumns < points.threeColumns, hint: 'The three-column breakpoint must be wider than the two-column breakpoint.' },
    { label: 'Cards have enough room', pass: points.twoColumns >= 412 && points.threeColumns >= 604, hint: 'Two 180 px cards need 412 px with gap and padding; three need 604 px.' },
    ...BREAKPOINT_CASES.map((item) => ({ label: `${item.name}: ${item.expected} column${item.expected > 1 ? 's' : ''}`, pass: columnsAt(item.width, points) === item.expected, hint: `At ${item.width} px, the page should show ${item.expected} column${item.expected > 1 ? 's' : ''}. Move a breakpoint past this width if needed.` })),
  ]
}

export function previewCards(viewport: number, points: Breakpoints) {
  const columns = columnsAt(viewport, points)
  const screenWidth = Math.max(140, Math.min(500, viewport * 500 / 1200))
  const left = (560 - screenWidth) / 2
  const padding = 20, gap = 8
  const cardWidth = (screenWidth - 2 * padding - (columns - 1) * gap) / columns
  return Array.from({ length: 6 }, (_, index) => ({ x: left + padding + (index % columns) * (cardWidth + gap), y: 62 + Math.floor(index / columns) * 48, width: cardWidth, height: 40 }))
}
