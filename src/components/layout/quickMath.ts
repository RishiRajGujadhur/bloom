/**
 * Ctrl K extras: "=12*7" (or any plain arithmetic) and unit conversions
 * like "5 km", "70kg", "20c". Returns a short answer or null.
 */
export function quickCalc(input: string): string | null {
  const q = input.trim().replace(/^=\s*/, '')
  if (!/^[\d\s+\-*/().%^,]+$/.test(q) || !/[+\-*/%^]/.test(q) || !/\d/.test(q)) return null
  const expr = q.replace(/,/g, '').replace(/\^/g, '**')
  if (/[^\d\s+\-*/().%]/.test(expr.replace(/\*\*/g, '*'))) return null
  try {
    const value = Function(`"use strict"; return (${expr})`)() as unknown
    if (typeof value !== 'number' || !Number.isFinite(value)) return null
    return `${q} = ${Math.round(value * 1e6) / 1e6}`
  } catch {
    return null
  }
}

const units: Record<string, [string, (n: number) => number]> = {
  km: ['mi', (n) => n / 1.609344],
  mi: ['km', (n) => n * 1.609344],
  kg: ['lb', (n) => n * 2.2046226],
  lb: ['kg', (n) => n / 2.2046226],
  cm: ['in', (n) => n / 2.54],
  in: ['cm', (n) => n * 2.54],
  m: ['ft', (n) => n * 3.2808399],
  ft: ['m', (n) => n / 3.2808399],
  c: ['°F', (n) => (n * 9) / 5 + 32],
  f: ['°C', (n) => ((n - 32) * 5) / 9],
  l: ['US gal', (n) => n / 3.785411784],
  ml: ['fl oz', (n) => n / 29.5735296],
}

export function quickConvert(input: string): string | null {
  const m = input.trim().toLowerCase().match(/^(-?\d+(?:\.\d+)?)\s*(km|mi|kg|lb|lbs|cm|in|m|ft|°?c|°?f|l|ml)$/)
  if (!m) return null
  const key = m[2].replace('°', '').replace('lbs', 'lb')
  const conv = units[key]
  if (!conv) return null
  const out = conv[1](Number(m[1]))
  return `${m[1]} ${m[2]} = ${Math.round(out * 100) / 100} ${conv[0]}`
}
