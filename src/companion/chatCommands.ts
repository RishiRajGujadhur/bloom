import type { Dispatch, SetStateAction } from 'react'
import nlp from 'compromise'
import Fuse from 'fuse.js'
import { readStore, writeStore } from '../components/studio/Studio'
import { dayKey } from '../dates'
import type { AppData } from '../model'
import { MONEY_KEY, categoryOf, emptyMoney, formatMoney, guessCategory, toMinor, totals, byCategory, type MoneyStore } from '../features/money/moneyModel'
import { allWords } from '../features/english/englishCourse'
import { explain, nextHint, reveal } from './quizContext'

/**
 * Things you can type to Bloom instead of clicking around:
 *   “spent 12.50 on lunch”, “how much did I spend?”, “add todo call mum”,
 *   “done meditation”, “hint”, “explain”, “answer”, “define grateful”, “clear chat”, “help”.
 */
export type CommandCtx = { data?: AppData; setData?: Dispatch<SetStateAction<AppData>>; navigate: (p: string) => void; clear: () => void }
export type CommandResult = { reply: string; mood?: 'cheer' | 'think' | 'happy' } | null

export const commandExamples = ['spent 12 on lunch', 'add todo call mum', 'how much did I spend?', 'hint', 'define grateful', 'help']

const money = () => ({ ...emptyMoney, ...readStore<MoneyStore>(MONEY_KEY, emptyMoney) })

export function runCommand(raw: string, ctx: CommandCtx): CommandResult {
  const text = raw.trim()
  const low = text.toLowerCase()
  if (!text) return null

  if (/^(help|what can you do\??|commands)$/.test(low))
    return { reply: 'You can type things like: “spent 12 on lunch”, “how much did I spend?”, “add todo call mum”, “done meditation”, “hint” or “answer” during a quiz, “define grateful”, or a page name to go there.' }

  if (/^(clear|clear chat|reset chat)$/.test(low)) {
    ctx.clear()
    return { reply: 'Fresh start! What can I do for you?' }
  }

  // Quiz help
  if (/^(hint|give me a hint|help me|clue)\b/.test(low)) return { reply: `💡 ${nextHint()}`, mood: 'think' }
  if (/^(explain|why)\b/.test(low)) return { reply: `📘 ${explain()}`, mood: 'think' }
  if (/^(answer|show (me )?the answer|reveal|i give up)\b/.test(low)) return { reply: reveal() }

  // Expenses: “spent 12.50 on lunch”, “paid $30 for gas at shell”, “coffee 4.20”
  const lead = low.match(/^(?:i\s+)?(?:spent|spend|paid|pay|bought|expense|add expense)\s*(?:[$€£₹]|rs\.?)?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:on|for|at)?\s*(.*)$/)
  const tail = low.match(/^(?:spent\s+)?([a-z][a-z '&-]{1,40}?)\s+(?:[$€£₹])?(\d+(?:[.,]\d{1,2})?)$/)
  const spent = lead ? { amountRaw: lead[1], placeRaw: lead[2] } : tail && !/^(add|done|did|define|hint)/.test(tail[1]) ? { amountRaw: tail[2], placeRaw: tail[1] } : null
  if (spent) {
    const { amountRaw, placeRaw } = spent
    const amount = toMinor(amountRaw.replace(',', '.'))
    if (amount > 0) {
      const place = (placeRaw || 'Something').trim().replace(/^(a|an|the)\s+/, '')
      const store = money()
      const category = guessCategory(place)
      const txn = { id: crypto.randomUUID(), date: dayKey(), amount, category, place: place[0].toUpperCase() + place.slice(1) }
      const next = { ...store, txns: [txn, ...store.txns] }
      writeStore(MONEY_KEY, next)
      window.dispatchEvent(new Event('bloom:money'))
      const c = categoryOf(category)
      return { reply: `Added ${formatMoney(amount, store.currency)} for ${txn.place} (${c.emoji} ${c.name}). This month: ${formatMoney(totals(next.txns, dayKey()).month, store.currency)}.`, mood: 'cheer' }
    }
  }
  if (/how much.*(spen|spend)|my spending|spent this month/.test(low)) {
    const store = money()
    const t = totals(store.txns, dayKey())
    const top = byCategory(store.txns, dayKey().slice(0, 7))[0]
    return { reply: `This month you’ve spent ${formatMoney(t.month, store.currency)}${t.monthChange !== null ? ` (${t.monthChange > 0 ? '+' : ''}${Math.round(t.monthChange)}% vs last month)` : ''}.${top ? ` Most went on ${categoryOf(top.category).emoji} ${categoryOf(top.category).name}.` : ''}` }
  }

  // Todos
  const todo = text.match(/^(?:add\s+(?:a\s+)?)?(?:todo|to-do|task)\s*:?\s+(.+)$/i) ?? text.match(/^remind me to\s+(.+)$/i)
  if (todo && ctx.setData) {
    const title = todo[1].trim().slice(0, 150)
    ctx.setData((d) => ({ ...d, todos: [...d.todos, { id: crypto.randomUUID(), title, due: dayKey(), done: false, completedAt: null, challengeId: null, rewarded: false, priority: 'P3', tags: [], recurrence: 'none', seriesId: null, subtasks: [] }] }))
    return { reply: `Added “${title}” to today’s to-dos. ✅`, mood: 'cheer' }
  }

  // Habit check-in: “done meditation”, “I did my run”
  const did = low.match(/^(?:done|did|i did|finished|check(?:ed)? off)\s+(?:my\s+)?(.+)$/)
  if (did && ctx.data && ctx.setData) {
    const hit = new Fuse(ctx.data.habits, { keys: ['title'], threshold: 0.4 }).search(did[1])[0]?.item
    if (hit) {
      const today = dayKey()
      if (!hit.dates.includes(today)) ctx.setData((d) => ({ ...d, habits: d.habits.map((h) => (h.id === hit.id ? { ...h, dates: [...h.dates, today] } : h)) }))
      return { reply: `Nice! “${hit.title}” is checked off for today. 🌱`, mood: 'cheer' }
    }
  }

  // Dictionary
  const def = low.match(/^(?:define|meaning of|what does)\s+([a-z' -]+?)(?:\s+mean)?\??$/)
  if (def) {
    const w = def[1].trim()
    const hit = allWords.find((x) => x.en === w)
    if (hit) return { reply: `${hit.emoji} “${hit.en}” — ${hit.meaning}. e.g. “${hit.example}”` }
    const doc = nlp(w)
    const kind = doc.has('#Verb') ? 'a verb' : doc.has('#Adjective') ? 'an adjective' : doc.has('#Noun') ? 'a noun' : 'a word'
    return { reply: `“${w}” looks like ${kind}. I don’t have its meaning yet — try the English page’s word list.` }
  }
  return null
}
