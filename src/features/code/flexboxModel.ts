export type FlexSettings = { direction: 'row' | 'column'; justify: 'flex-start' | 'center' | 'flex-end' | 'space-between'; align: 'flex-start' | 'center' | 'flex-end'; gap: number }
export type FlexTask = { id: string; title: string; objective: string; target: FlexSettings; explain: string }

export const FLEX_START: FlexSettings = { direction: 'row', justify: 'flex-start', align: 'flex-start', gap: 12 }
export const FLEX_TASKS: FlexTask[] = [
  { id: 'ends', title: 'Spread the cards', objective: 'Put the first and last cards at opposite ends of the row, with all cards vertically centered.', target: { direction: 'row', justify: 'space-between', align: 'center', gap: 12 }, explain: 'space-between distributes spare room along the main axis; align-items centers the cards across the row.' },
  { id: 'stack', title: 'Center the stack', objective: 'Stack the cards in a column and center the stack in both directions.', target: { direction: 'column', justify: 'center', align: 'center', gap: 12 }, explain: 'In a column, the main axis runs vertically. justify-content centers vertically and align-items centers horizontally.' },
  { id: 'right', title: 'Dock the cards', objective: 'Keep a row of cards together at the right edge, vertically centered.', target: { direction: 'row', justify: 'flex-end', align: 'center', gap: 12 }, explain: 'flex-end places the group at the end of the row. A fixed gap keeps space between the cards.' },
]

export function flexPositions(settings: FlexSettings) {
  const width = 440, height = 220, padding = 16, count = 3, itemWidth = 56, itemHeight = 42
  const isRow = settings.direction === 'row'
  const mainSize = (isRow ? width : height) - 2 * padding
  const crossSize = (isRow ? height : width) - 2 * padding
  const itemMain = isRow ? itemWidth : itemHeight
  const itemCross = isRow ? itemHeight : itemWidth
  const used = count * itemMain + (count - 1) * settings.gap
  const remaining = Math.max(0, mainSize - used)
  const mainStart = settings.justify === 'center' ? remaining / 2 : settings.justify === 'flex-end' ? remaining : 0
  const space = settings.justify === 'space-between' ? remaining / (count - 1) : 0
  const crossStart = settings.align === 'center' ? (crossSize - itemCross) / 2 : settings.align === 'flex-end' ? crossSize - itemCross : 0
  return Array.from({ length: count }, (_, index) => {
    const main = padding + mainStart + index * (itemMain + settings.gap + space)
    const cross = padding + crossStart
    return isRow ? { x: main, y: cross } : { x: cross, y: main }
  })
}

export function checkFlexTask(task: FlexTask, settings: FlexSettings) {
  return [
    { label: `Direction: ${task.target.direction}`, pass: settings.direction === task.target.direction, hint: 'The direction sets the main axis.' },
    { label: `Main-axis distribution: ${task.target.justify}`, pass: settings.justify === task.target.justify, hint: 'justify-content distributes items along the main axis.' },
    { label: `Cross-axis alignment: ${task.target.align}`, pass: settings.align === task.target.align, hint: 'align-items positions items across the main axis.' },
  ]
}
