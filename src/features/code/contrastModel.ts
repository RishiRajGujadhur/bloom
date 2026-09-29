export type ColorPair = { foreground: string; background: string }
export type ContrastTask = { id: string; title: string; sample: string; threshold: number; size: 'normal' | 'large'; start: ColorPair }
export const CONTRAST_TASKS: ContrastTask[] = [
  { id: 'paragraph', title: 'Garden paragraph', sample: 'Every seed needs room to grow.', threshold: 4.5, size: 'normal', start: { foreground: '#86a59a', background: '#f5f1e8' } },
  { id: 'heading', title: 'Welcome heading', sample: 'Welcome to the garden', threshold: 3, size: 'large', start: { foreground: '#c9a1a0', background: '#fff0e8' } },
]

export function relativeLuminance(hex: string) {
  const value = hex.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(value)) return 0
  const channels = [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16) / 255)
  const linear = channels.map((channel) => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4)
  return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2]
}

export function contrastRatio(first: string, second: string) {
  const one = relativeLuminance(first), two = relativeLuminance(second)
  return (Math.max(one, two) + .05) / (Math.min(one, two) + .05)
}

export function checkContrast(task: ContrastTask, pair: ColorPair) {
  const ratio = contrastRatio(pair.foreground, pair.background)
  return { ratio, pass: ratio >= task.threshold, needed: Math.max(0, task.threshold - ratio) }
}
