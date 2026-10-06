/** Choose black or white using WCAG relative luminance for an opaque hex color. */
export function textOnColor(color: string): string {
  const hex = color.replace(/^#/, '')
  if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex)) return 'var(--text-on-accent)'
  const full = hex.length === 3 ? [...hex].map(value => value + value).join('') : hex
  const values = [0, 2, 4].map(offset => {
    const value = parseInt(full.slice(offset, offset + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  const luminance = values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? '#000000' : '#ffffff'
}
