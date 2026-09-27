import currency from 'currency.js'
import Papa from 'papaparse'

/**
 * Money: a private spending tracker. Amounts are stored as integer minor
 * units (cents) and summed with currency.js so totals never drift.
 */
export type Category = { id: string; name: string; emoji: string; color: string; bucket: 'fixed' | 'flexible' | 'non-monthly' }
export type Txn = { id: string; date: string; amount: number; category: string; place: string; note?: string; income?: boolean }
export type Budget = { category: string; limit: number }
export type Holding = { id: string; name: string; kind: 'asset' | 'debt'; value: number }
export type Goal = { id: string; name: string; target: number; saved: number; emoji: string }
export type MoneyStore = {
  currency: string
  txns: Txn[]
  budgets: Budget[]
  holdings: Holding[]
  worthLog: { date: string; value: number }[]
  goals: Goal[]
  subscriptionsOff: string[]
}
export const MONEY_KEY = 'bloom-money-v1'
export const emptyMoney: MoneyStore = { currency: 'USD', txns: [], budgets: [], holdings: [], worthLog: [], goals: [], subscriptionsOff: [] }

export const categories: Category[] = [
  { id: 'groceries', name: 'Groceries', emoji: '🛒', color: '#5b8def', bucket: 'flexible' },
  { id: 'dining', name: 'Eating out', emoji: '🍜', color: '#9ef04a', bucket: 'flexible' },
  { id: 'transport', name: 'Transport', emoji: '🚌', color: '#35d0a0', bucket: 'flexible' },
  { id: 'home', name: 'Rent & bills', emoji: '🏠', color: '#7a5cf5', bucket: 'fixed' },
  { id: 'subscriptions', name: 'Subscriptions', emoji: '🔁', color: '#f5c542', bucket: 'fixed' },
  { id: 'health', name: 'Health', emoji: '💊', color: '#ff7a8a', bucket: 'flexible' },
  { id: 'fun', name: 'Fun', emoji: '🎟️', color: '#f58a42', bucket: 'flexible' },
  { id: 'shopping', name: 'Shopping', emoji: '🛍️', color: '#c86af5', bucket: 'flexible' },
  { id: 'gifts', name: 'Gifts & holidays', emoji: '🎁', color: '#42c5f5', bucket: 'non-monthly' },
  { id: 'other', name: 'Other', emoji: '•', color: '#9aa3ad', bucket: 'flexible' },
]
export const categoryOf = (id: string) => categories.find((c) => c.id === id) ?? categories[categories.length - 1]

export const currencies = ['USD', 'EUR', 'GBP', 'MUR', 'INR', 'JPY', 'CAD', 'AUD', 'ZAR', 'SGD', 'CHF', 'CNY', 'BRL', 'MXN', 'NGN', 'KES']

/** Minor units ↔ major units via currency.js (no float drift). */
export const toMinor = (major: number | string) => currency(major).intValue
export const toMajor = (minor: number) => currency(minor, { fromCents: true }).value
export const sumMinor = (xs: number[]) => xs.reduce((a, b) => currency(a, { fromCents: true }).add(currency(b, { fromCents: true })).intValue, 0)

export function formatMoney(minor: number, code: string, opts: { compact?: boolean } = {}) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: code, notation: opts.compact ? 'compact' : 'standard', maximumFractionDigits: opts.compact ? 1 : 2 }).format(toMajor(minor))
  } catch {
    return `${toMajor(minor).toFixed(2)} ${code}`
  }
}

const monthOf = (d: string) => d.slice(0, 7)
export const spend = (txns: Txn[]) => txns.filter((t) => !t.income)

/** This month / year with change against the previous period. */
export function totals(txns: Txn[], today: string) {
  const m = monthOf(today)
  const prevDate = new Date(`${today}T12:00:00`)
  prevDate.setMonth(prevDate.getMonth() - 1)
  const pm = prevDate.toISOString().slice(0, 7)
  const y = today.slice(0, 4)
  const py = String(Number(y) - 1)
  const s = spend(txns)
  const sum = (f: (t: Txn) => boolean) => sumMinor(s.filter(f).map((t) => t.amount))
  const month = sum((t) => monthOf(t.date) === m)
  const prevMonth = sum((t) => monthOf(t.date) === pm)
  const year = sum((t) => t.date.startsWith(y))
  const prevYear = sum((t) => t.date.startsWith(py))
  const change = (a: number, b: number) => (b ? ((a - b) / b) * 100 : null)
  return { month, prevMonth, monthChange: change(month, prevMonth), year, prevYear, yearChange: change(year, prevYear) }
}

export function byCategory(txns: Txn[], month?: string) {
  const out = new Map<string, number>()
  for (const t of spend(txns)) if (!month || t.date.startsWith(month)) out.set(t.category, (out.get(t.category) ?? 0) + t.amount)
  return [...out.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount)
}

export function topPlaces(txns: Txn[], limit = 5) {
  const out = new Map<string, number>()
  for (const t of spend(txns)) out.set(t.place || 'Unknown', (out.get(t.place || 'Unknown') ?? 0) + t.amount)
  return [...out.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
}

/** Spending per day for the heatmap / tiles. */
export function perDay(txns: Txn[]) {
  const out = new Map<string, number>()
  for (const t of spend(txns)) out.set(t.date, (out.get(t.date) ?? 0) + t.amount)
  return out
}

/** Daily candles of the running balance (open, high, low, close) for the trading-style chart. */
export function balanceCandles(txns: Txn[], start = 0) {
  const days = [...new Set(txns.map((t) => t.date))].sort()
  let bal = start
  return days.map((d) => {
    const open = bal
    let hi = bal
    let lo = bal
    for (const t of txns.filter((x) => x.date === d)) {
      bal += t.income ? t.amount : -t.amount
      hi = Math.max(hi, bal)
      lo = Math.min(lo, bal)
    }
    return { time: d, open: toMajor(open), high: toMajor(hi), low: toMajor(lo), close: toMajor(bal) }
  })
}

/** Recurring payments: the same place charged in 2+ different months with similar amounts. */
export function detectSubscriptions(txns: Txn[]) {
  const byPlace = new Map<string, Txn[]>()
  for (const t of spend(txns)) if (t.place) byPlace.set(t.place.toLowerCase(), [...(byPlace.get(t.place.toLowerCase()) ?? []), t])
  const subs: { place: string; amount: number; months: number; yearly: number; last: string }[] = []
  for (const list of byPlace.values()) {
    const months = new Set(list.map((t) => monthOf(t.date)))
    if (months.size < 2) continue
    const amounts = list.map((t) => t.amount)
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length
    if (amounts.every((a) => Math.abs(a - avg) <= avg * 0.15)) {
      const last = list.map((t) => t.date).sort().at(-1)!
      subs.push({ place: list[0].place, amount: Math.round(avg), months: months.size, yearly: Math.round(avg * 12), last })
    }
  }
  return subs.sort((a, b) => b.yearly - a.yearly)
}

export const netWorth = (holdings: Holding[]) => sumMinor(holdings.map((h) => (h.kind === 'asset' ? h.value : -h.value)))

/** Budget use this month, per category. */
export function budgetUse(store: MoneyStore, month: string) {
  const spent = new Map(byCategory(store.txns, month).map((c) => [c.category, c.amount]))
  return store.budgets.map((b) => ({ ...b, spent: spent.get(b.category) ?? 0, share: b.limit ? (spent.get(b.category) ?? 0) / b.limit : 0 }))
}

/** Parse a bank CSV (date, description/place, amount) with papaparse. */
export function parseCsv(text: string): Txn[] {
  const res = Papa.parse<Record<string, string>>(text.trim(), { header: true, skipEmptyLines: true })
  const pick = (row: Record<string, string>, keys: string[]) => {
    const k = Object.keys(row).find((x) => keys.includes(x.trim().toLowerCase()))
    return k ? row[k] : ''
  }
  return res.data
    .map((row, i) => {
      const raw = pick(row, ['amount', 'value', 'debit', 'sum'])
      const n = Number(String(raw).replace(/[^0-9.-]/g, ''))
      const date = new Date(pick(row, ['date', 'posted', 'transaction date']))
      if (!raw || Number.isNaN(n) || Number.isNaN(date.getTime())) return null
      const place = pick(row, ['description', 'merchant', 'payee', 'name', 'place'])
      return { id: `csv-${Date.now()}-${i}`, date: date.toISOString().slice(0, 10), amount: toMinor(Math.abs(n)), category: guessCategory(place), place, income: n > 0 && /income|salary|refund|deposit/i.test(place) } as Txn
    })
    .filter((t): t is Txn => !!t)
}

const hints: [RegExp, string][] = [
  [/super|market|grocer|aldi|lidl|tesco|walmart|costco/i, 'groceries'],
  [/cafe|coffee|restaurant|pizza|burger|uber eats|deliveroo|kfc|mcdonald/i, 'dining'],
  [/uber|lyft|bus|train|metro|fuel|petrol|shell|parking/i, 'transport'],
  [/rent|electric|water|gas bill|internet|phone/i, 'home'],
  [/netflix|spotify|prime|disney|icloud|youtube|subscription|patreon/i, 'subscriptions'],
  [/pharma|clinic|doctor|gym|dental/i, 'health'],
  [/cinema|concert|steam|game|ticket/i, 'fun'],
  [/amazon|store|shop|zara|h&m|ikea/i, 'shopping'],
]
export const guessCategory = (place: string) => hints.find(([r]) => r.test(place))?.[1] ?? 'other'
