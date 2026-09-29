import * as chrono from 'chrono-node'
import { toAmount } from './receiptModel'

/**
 * Bills Inbox parsing: from the OCR text of a letter or bill, find who it's
 * from, how much is due, when, and any renewal date. Plus a small
 * question-answering layer that picks the right fact from the right bill.
 */
export type Bill = {
  id: string
  biller: string
  amount: number | null
  due: string | null
  renews: string | null
  reference: string | null
  kind: 'bill' | 'renewal' | 'letter'
  text: string
  scannedAt: number
  image: string
  paid?: boolean
  embedding?: number[]
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const MONEY = /([$€£₹¥]\s?\d{1,3}(?:[,\s]\d{3})*(?:[.,]\d{2})?|\d{1,3}(?:,\d{3})*[.,]\d{2})/

function dateNear(lines: string[], re: RegExp, ref: Date): string | null {
  for (let i = 0; i < lines.length; i++) {
    if (!re.test(lines[i])) continue
    for (const text of [lines[i], `${lines[i]} ${lines[i + 1] ?? ''}`]) {
      const r = chrono.parse(text, ref).find((x) => x.start.isCertain('day') && x.start.isCertain('month'))
      if (r) return iso(r.start.date())
    }
  }
  return null
}

export function parseBill(text: string, ref = new Date()): Omit<Bill, 'id' | 'scannedAt' | 'image'> {
  const lines = text.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean)
  const biller = (lines.find((l, i) => i < 5 && /[A-Za-z]{3,}/.test(l) && !/^(dear|date|account|invoice|statement|page|ref)/i.test(l) && !/\d{4,}/.test(l)) ?? 'Unknown sender').replace(/[^\p{L}\p{N}&'’ .-]/gu, '').trim().slice(0, 40)
  let amount: number | null = null
  for (const l of lines) {
    if (!/amount due|total due|balance due|to pay|please pay|amount payable|premium|total amount|new balance|direct debit of/i.test(l)) continue
    const m = l.match(MONEY)
    if (m) { amount = toAmount(m[1]); break }
  }
  const due = dateNear(lines, /due|pay by|payment date|payable by|will be collected|debit on|by\s+\d/i, ref)
  const renews = dateNear(lines, /renew|expires|expiry|policy end|ends on|until/i, ref)
  const refLine = lines.find((l) => /(account|policy|customer|reference|ref)\s*(no|number|#)?[:.]?\s*[A-Z0-9-]{5,}/i.test(l))
  const reference = refLine?.match(/(?:no|number|#|ref|:)\.?:?\s*([A-Z0-9][A-Z0-9-]{4,})\s*$/i)?.[1] ?? refLine?.match(/[A-Z]*\d[A-Z0-9-]{4,}/i)?.[0] ?? null
  const kind: Bill['kind'] = renews && !due ? 'renewal' : amount != null || due ? 'bill' : 'letter'
  return { biller, amount, due, renews, reference, kind, text }
}

export const daysUntil = (date: string, today = new Date()) => Math.round((new Date(`${date}T12:00:00`).getTime() - new Date(iso(today) + 'T12:00:00').getTime()) / 864e5)

/** Picks what the question asks for (when / how much / which reference) from the best-matching bill. */
export function answer(q: string, b: Bill, currency: (n: number) => string): string {
  const when = /when|date|renew|due|expire|deadline/i.test(q)
  const much = /how much|cost|amount|price|pay|owe/i.test(q)
  const refQ = /reference|account|policy (no|number)|number/i.test(q)
  const parts: string[] = []
  if (refQ && b.reference) parts.push(`Your reference with ${b.biller} is ${b.reference}.`)
  if (when) {
    if (/renew|expire/i.test(q) && b.renews) parts.push(`${b.biller} renews on ${fmtDate(b.renews)} (${rel(b.renews)}).`)
    else if (b.due) parts.push(`${b.biller} is due on ${fmtDate(b.due)} (${rel(b.due)}).`)
    else if (b.renews) parts.push(`${b.biller} renews on ${fmtDate(b.renews)} (${rel(b.renews)}).`)
  }
  if (much && b.amount != null) parts.push(`The amount is ${currency(b.amount)}.`)
  if (!parts.length) {
    const facts = [b.amount != null && `${currency(b.amount)}`, b.due && `due ${fmtDate(b.due)}`, b.renews && `renews ${fmtDate(b.renews)}`].filter(Boolean)
    parts.push(`Best match: ${b.biller}${facts.length ? ` — ${facts.join(', ')}` : ''}.`)
  }
  return parts.join(' ')
}
const fmtDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
const rel = (d: string) => { const n = daysUntil(d); return n === 0 ? 'today' : n > 0 ? `in ${n} day${n === 1 ? '' : 's'}` : `${-n} day${n === -1 ? '' : 's'} ago` }

/** Keyword score as a fallback (and a tie-breaker) for semantic search. */
export function keywordScore(q: string, b: Bill) {
  const words = q.toLowerCase().match(/[a-z]{3,}/g) ?? []
  const hay = `${b.biller} ${b.text}`.toLowerCase()
  return words.reduce((s, w) => s + (hay.includes(w) ? (b.biller.toLowerCase().includes(w) ? 3 : 1) : 0), 0)
}
