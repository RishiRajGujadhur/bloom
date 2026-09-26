/**
 * Turns a rambling transcript into structure without any cloud model:
 * cleaned bullet points, habit/intention ideas and mood tags.
 */
const fillers = /\b(um+|uh+|erm|you know|i mean|kind of|sort of|basically|like,)\s*/gi

export function cleanSentence(s: string) {
  const t = s.replace(fillers, '').replace(/\s{2,}/g, ' ').trim()
  return t ? t[0].toUpperCase() + t.slice(1) : t
}

export function sentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map(cleanSentence)
    .filter((s) => s.split(' ').length >= 3)
}

const intent = /\b(?:i (?:should|need to|want to|have to|must|will|'ll|am going to|'m going to)|let me|remember to|i'd like to|going to try to|try to)\s+(.+?)(?:[.!?]|$)/i

export function habitIdeas(text: string) {
  const out: string[] = []
  for (const s of sentences(text)) {
    const m = s.match(intent)
    if (!m) continue
    const idea = m[1].replace(/\b(more|again|today|tomorrow)$/i, '').trim()
    if (idea.split(' ').length <= 10) out.push(idea[0].toUpperCase() + idea.slice(1))
  }
  return [...new Set(out)].slice(0, 5)
}

const lexicon: Record<string, RegExp> = {
  grateful: /\b(grateful|thankful|lucky|appreciate)\b/i,
  anxious: /\b(anxious|worried|nervous|panic|overwhelm\w*)\b/i,
  tired: /\b(tired|exhausted|drained|sleepy|burn(t|ed)? out|burnout)\b/i,
  happy: /\b(happy|glad|joy\w*|great|excited|good day)\b/i,
  sad: /\b(sad|down|lonely|cry\w*|hurt)\b/i,
  frustrated: /\b(frustrat\w*|angry|annoyed|irritat\w*|stuck)\b/i,
  calm: /\b(calm|peaceful|relaxed|at ease|centred|centered)\b/i,
  motivated: /\b(motivat\w*|focused|productive|determined|energi[sz]ed)\b/i,
}

export function moodTags(text: string) {
  return Object.entries(lexicon)
    .filter(([, re]) => re.test(text))
    .map(([tag]) => tag)
}

export function extract(text: string) {
  const all = sentences(text)
  return {
    bullets: all.slice(0, 8),
    habits: habitIdeas(text),
    moods: moodTags(text),
  }
}

/** A TipTap document for the Daybook: summary bullets, ideas, then the full transcript. */
export function toTipTap(title: string, text: string, chunks: { text: string; start: number }[] = []) {
  const { bullets, habits, moods } = extract(text)
  const para = (t: string) => ({ type: 'paragraph', content: t ? [{ type: 'text', text: t }] : [] })
  const heading = (t: string) => ({ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: t }] })
  const list = (items: string[]) => ({ type: 'bulletList', content: items.map((i) => ({ type: 'listItem', content: [para(i)] })) })
  const time = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  const content: unknown[] = [heading(title)]
  if (moods.length) content.push(para(`Mood: ${moods.map((m) => `#${m}`).join(' ')}`))
  if (bullets.length) content.push(heading('Key points'), list(bullets))
  if (habits.length) content.push(heading('Ideas to act on'), { type: 'taskList', content: habits.map((h) => ({ type: 'taskItem', attrs: { checked: false }, content: [para(h)] })) })
  content.push(heading('Transcript'))
  if (chunks.length) for (const c of chunks) content.push(para(`[${time(c.start)}] ${c.text}`))
  else content.push(para(text))
  return { type: 'doc', content }
}
