export type GridPlacement = { column: number; row: number; columnSpan: number; rowSpan: number }
export type GridLayout = Record<'hero' | 'notes' | 'gallery' | 'footer', GridPlacement>
export const GRID_TILES = [
  { id: 'hero', name: 'Hero', color: '#7bb9dc' },
  { id: 'notes', name: 'Notes', color: '#e7b76f' },
  { id: 'gallery', name: 'Gallery', color: '#a7d39a' },
  { id: 'footer', name: 'Footer', color: '#c5a2d9' },
] as const
export const GRID_START: GridLayout = {
  hero: { column: 1, row: 1, columnSpan: 1, rowSpan: 1 },
  notes: { column: 2, row: 1, columnSpan: 1, rowSpan: 1 },
  gallery: { column: 3, row: 1, columnSpan: 1, rowSpan: 1 },
  footer: { column: 1, row: 2, columnSpan: 1, rowSpan: 1 },
}
export const GRID_TARGET: GridLayout = {
  hero: { column: 1, row: 1, columnSpan: 2, rowSpan: 1 },
  notes: { column: 3, row: 1, columnSpan: 1, rowSpan: 2 },
  gallery: { column: 1, row: 2, columnSpan: 2, rowSpan: 2 },
  footer: { column: 3, row: 3, columnSpan: 1, rowSpan: 1 },
}

export function gridRect(place: GridPlacement) {
  const cell = 100, gap = 8
  return { x: 58 + (place.column - 1) * (cell + gap), y: 36 + (place.row - 1) * (cell + gap), width: place.columnSpan * cell + (place.columnSpan - 1) * gap, height: place.rowSpan * cell + (place.rowSpan - 1) * gap }
}

export function checkGridLayout(layout: GridLayout) {
  const entries = GRID_TILES.map((tile) => [tile.id, layout[tile.id]] as const)
  const inBounds = entries.every(([, place]) => place.column >= 1 && place.row >= 1 && place.column + place.columnSpan <= 4 && place.row + place.rowSpan <= 4)
  const cells = entries.flatMap(([id, place]) => Array.from({ length: place.columnSpan * place.rowSpan }, (_, index) => ({ id, cell: `${place.column + index % place.columnSpan},${place.row + Math.floor(index / place.columnSpan)}` })))
  const noOverlap = new Set(cells.map((item) => item.cell)).size === cells.length
  const tileChecks = GRID_TILES.map((tile) => {
    const actual = layout[tile.id], target = GRID_TARGET[tile.id]
    return { label: `${tile.name} position and span`, pass: Object.keys(target).every((key) => actual[key as keyof GridPlacement] === target[key as keyof GridPlacement]), hint: `${tile.name}: column ${target.column}, row ${target.row}, span ${target.columnSpan} column${target.columnSpan > 1 ? 's' : ''} and ${target.rowSpan} row${target.rowSpan > 1 ? 's' : ''}.` }
  })
  return [
    { label: 'All tiles stay inside the 3 × 3 grid', pass: inBounds, hint: 'A start line plus span must fit within three tracks.' },
    { label: 'Tiles do not overlap', pass: noOverlap, hint: 'Each cell can contain only one tile.' },
    ...tileChecks,
  ]
}
