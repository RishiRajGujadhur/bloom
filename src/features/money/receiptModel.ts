import * as chrono from 'chrono-node'
import currency from 'currency.js'

/**
 * Receipt Lens parsing: turns OCR'd lines into a shop, a date, line items and
 * the total. Receipts vary wildly, so this is layered heuristics: an explicit
 * TOTAL line wins; otherwise the largest amount that isn't cash tendered.
 */
export type OcrLine = { text: string; bbox?: { x0: number; y0: number; x1: number; y1: number } }
export type Parsed = {
  place: string
  date: string | null
  total: number | null
  items: { name: string; amount: number }[]
  /** Which OCR lines held the shop, date and total, for highlighting. */
  hits: { place: number; date: number; total: number }
}

// A price at the end of a line: 1,234.56 / 12.99 / 3,50 (European comma) with an optional symbol or trailing letter (VAT code).
const PRICE = /(-?[$€£₹¥]?\s?\d{1,4}(?:[.,\s]\d{3})*[.,]\d{2})\s*(?:[A-Z*]|[$€£₹¥]|EUR|GBP|USD)?\s*$/
const TOTAL = /\b(grand\s*total|total\s*(?:due|to\s*pay|amount)?|amount\s*due|balance\s*due|to\s*pay|total)\b/i
const NOT_TOTAL = /\b(sub\s*-?\s*total|subtotal|total\s*(?:items|qty|savings|discount|vat|tax)|tax|vat|cash|change|tendered|card\s*(?:no|number)|tip)\b/i
const SKIP_ITEM = /\b(total|subtotal|tax|vat|cash|change|card|visa|mastercard|amex|debit|credit|balance|tendered|tip|auth|approval|thank)\b/i

export function toAmount(raw: string): number | null {
  let s = raw.replace(/[^\d.,-]/g, '')
  // "3,50" → decimal comma; "1,234.56" → thousands comma.
  if (/,\d{2}$/.test(s) && !/\.\d{2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.')
  else s = s.replace(/,/g, '')
  const n = Number(s)
  return Number.isFinite(n) ? currency(n).value : null
}

const priceOf = (line: string) => {
  const m = line.match(PRICE)
  return m ? toAmount(m[1]) : null
}

export function parseReceipt(lines: OcrLine[], today = new Date()): Parsed {
  const texts = lines.map((l) => l.text.replace(/\s+/g, ' ').trim())
  // Shop: the first line near the top with real letters that isn't an address, phone or date.
  let placeIdx = texts.findIndex((t, i) => i < 6 && /[A-Za-z]{3,}/.test(t) && !/\d{3,}|www\.|@|tel|phone|receipt|invoice|^\d/i.test(t))
  if (placeIdx < 0) placeIdx = texts.findIndex((t) => /[A-Za-z]{3,}/.test(t))
  const place = placeIdx >= 0 ? texts[placeIdx].replace(/[^\p{L}\p{N}&'’ .-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 40) : ''

  // Date: the first line chrono can read as a date, not in the future.
  let date: string | null = null
  let dateIdx = -1
  for (let i = 0; i < texts.length && !date; i++) {
    const r = chrono.parse(texts[i], today, { forwardDate: false }).find((x) => x.start.isCertain('day') && x.start.isCertain('month'))
    if (!r) continue
    const d = r.start.date()
    if (d.getTime() > today.getTime() + 86_400_000) continue
    date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    dateIdx = i
  }

  // Total: the largest amount on a TOTAL-ish line (bottom-most wins ties); fall back to the largest amount.
  let total: number | null = null
  let totalIdx = -1
  texts.forEach((t, i) => {
    if (!TOTAL.test(t) || NOT_TOTAL.test(t)) return
    const p = priceOf(t) ?? priceOf(texts[i + 1] ?? '')
    if (p != null && p > 0 && (total == null || p >= total)) { total = p; totalIdx = i }
  })
  if (total == null) {
    texts.forEach((t, i) => {
      if (NOT_TOTAL.test(t)) return
      const p = priceOf(t)
      if (p != null && p > 0 && (total == null || p > total)) { total = p; totalIdx = i }
    })
  }

  // Items: priced lines above the total that aren't totals, taxes or payment lines.
  const items: Parsed['items'] = []
  const end = totalIdx >= 0 ? totalIdx : texts.length
  for (let i = 0; i < end; i++) {
    const t = texts[i]
    if (i === placeIdx || i === dateIdx || SKIP_ITEM.test(t)) continue
    const m = t.match(PRICE)
    if (!m) continue
    const amount = toAmount(m[1])
    const name = t.slice(0, m.index).replace(/^\d+\s*[xX@]\s*/, '').replace(/[^\p{L}\p{N}&'’ %./-]/gu, '').trim()
    if (amount != null && amount > 0 && /[A-Za-z]{2,}/.test(name)) items.push({ name: name.slice(0, 40), amount })
  }
  return { place, date, total, items, hits: { place: placeIdx, date: dateIdx, total: totalIdx } }
}
