import type { AppData } from '../../model'
import { THEMES } from '../../utils/themeEngine'

/**
 * Raycast-style commands with arguments, typed after ">" in the palette:
 *   > log habit: read      > add task: call mum     > water 2
 *   > meal: pasta 550      > mood 4                 > theme: dracula
 */
export type OmniAction =
  | { type: 'logHabit'; habitId: string; title: string }
  | { type: 'addTask'; title: string }
  | { type: 'water'; glasses: number }
  | { type: 'meal'; name: string; kcal: number }
  | { type: 'mood'; value: number }
  | { type: 'theme'; themeId: string; name: string }
  | { type: 'focus'; minutes: number }

export type OmniSuggestion = { id: string; label: string; hint: string; action: OmniAction | null }

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

export const isCommand = (q: string) => q.trimStart().startsWith('>')

export function parseCommand(input: string, data: AppData, today: string): OmniSuggestion[] {
  const q = input.trim().replace(/^>\s*/, '')
  const lower = q.toLowerCase()
  const arg = (re: RegExp) => q.replace(re, '').replace(/^[:\s]+/, '').trim()
  const out: OmniSuggestion[] = []

  if (/^(log )?habit\b/.test(lower) || !q) {
    const term = norm(arg(/^(log )?habit/i))
    const habits = data.habits.filter((h) => !term || norm(h.title).includes(term))
    for (const h of habits.slice(0, 6))
      out.push({
        id: `habit-${h.id}`,
        label: `Log habit: ${h.title}`,
        hint: h.dates.includes(today) ? 'Already done today' : 'Mark done for today',
        action: h.dates.includes(today) ? null : { type: 'logHabit', habitId: h.id, title: h.title },
      })
    if (q && !habits.length) out.push({ id: 'habit-none', label: `No habit matches “${term}”`, hint: 'Try another word', action: null })
  }
  if (/^(add )?(task|todo)\b/.test(lower) || !q) {
    const title = arg(/^(add )?(task|todo)/i)
    out.push({ id: 'task', label: title ? `Add task: ${title}` : 'Add task: …', hint: 'Type a title after the colon', action: title ? { type: 'addTask', title: title.slice(0, 150) } : null })
  }
  if (/^(log )?water\b/.test(lower) || !q) {
    const n = Math.min(12, Math.max(1, parseInt(arg(/^(log )?water/i)) || 1))
    out.push({ id: 'water', label: `Log water: +${n} ${n === 1 ? 'glass' : 'glasses'}`, hint: 'Nourish', action: { type: 'water', glasses: n } })
  }
  if (/^(log )?(meal|ate|food)\b/.test(lower) || !q) {
    const rest = arg(/^(log )?(meal|ate|food)/i)
    const kcal = Number(rest.match(/(\d{2,4})\s*(kcal|cal)?\s*$/i)?.[1] ?? 0)
    const name = rest.replace(/(\d{2,4})\s*(kcal|cal)?\s*$/i, '').trim()
    out.push({ id: 'meal', label: name ? `Log meal: ${name}${kcal ? ` · ${kcal} kcal` : ''}` : 'Log meal: …', hint: 'e.g. “meal: pasta 550”', action: name ? { type: 'meal', name, kcal } : null })
  }
  if (/^mood\b/.test(lower) || !q) {
    const v = parseInt(arg(/^mood/i))
    out.push({ id: 'mood', label: v >= 1 && v <= 5 ? `Log mood: ${v}/5` : 'Log mood: 1–5', hint: 'Quick check-in', action: v >= 1 && v <= 5 ? { type: 'mood', value: v } : null })
  }
  if (/^(start )?focus\b/.test(lower) || !q) {
    const m = Math.min(180, Math.max(5, parseInt(arg(/^(start )?focus/i)) || 25))
    out.push({ id: 'focus', label: `Start focus: ${m} min`, hint: 'e.g. “focus 50”', action: { type: 'focus', minutes: m } })
  }
  if (/^(set )?theme\b/.test(lower) || !q) {
    const term = norm(arg(/^(set )?theme/i))
    for (const t of THEMES.filter((t) => !term || norm(t.name).includes(term) || t.id.includes(term.replace(/ /g, '-'))).slice(0, q ? 8 : 3))
      out.push({ id: `theme-${t.id}`, label: `Set theme: ${t.name}`, hint: t.mode, action: { type: 'theme', themeId: t.id, name: t.name } })
  }
  return out
}

/** Which Settings option (omnibox.<id>) governs a suggestion. */
export const commandGroup = (id: string) =>
  id.startsWith('habit') ? 'habits' : id === 'task' ? 'tasks' : id === 'water' || id === 'meal' ? 'nourish' : id === 'focus' ? 'tasks' : 'themes'
