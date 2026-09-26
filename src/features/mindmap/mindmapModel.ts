export type MindMap = { id: string; title: string; md: string; updatedAt: number }
export type MapStore = { maps: MindMap[]; current: string; colorful: boolean; maxWidth: number }
export const MAP_KEY = 'bloom-mindmaps-v1'

export const templates: { id: string; name: string; emoji: string; md: string }[] = [
  { id: 'goal', name: 'Goal breakdown', emoji: '🎯', md: '# My goal\n## Why it matters\n- Who benefits\n- How I’ll feel\n## Milestones\n- First step\n- Halfway\n- Done\n## Obstacles\n- What could stop me\n- How I’ll handle it\n## Support\n- People\n- Tools' },
  { id: 'week', name: 'Week plan', emoji: '🗓️', md: '# This week\n## Work\n- Main project\n- Meetings\n## Health\n- Movement\n- Sleep\n## People\n- Call someone\n## Me\n- Rest\n- Fun' },
  { id: 'decision', name: 'Decision', emoji: '⚖️', md: '# Should I…?\n## Option A\n- Pros\n- Cons\n## Option B\n- Pros\n- Cons\n## What matters most\n- Values\n- Timing' },
  { id: 'values', name: 'Life areas', emoji: '🌳', md: '# My life\n## Health\n## Relationships\n## Work\n## Growth\n## Fun\n## Home\n## Money' },
  { id: 'brain', name: 'Brain dump', emoji: '🧠', md: '# On my mind\n## Worries\n## Ideas\n## To do\n## Let go' },
]

/** Plain text (e.g. a journal page) → outline: sentences under "#" heading, grouped by paragraph. */
export function fromText(title: string, text: string) {
  const paras = text.split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean)
  const lines = [`# ${title}`]
  paras.slice(0, 12).forEach((p, i) => {
    const sentences = p.split(/(?<=[.!?])\s+/).filter((s) => s.length > 2)
    lines.push(`## ${sentences[0]?.slice(0, 60) ?? `Thought ${i + 1}`}`)
    for (const s of sentences.slice(1, 6)) lines.push(`- ${s.slice(0, 80)}`)
  })
  return lines.join('\n')
}

/** Count branches (headings and bullets) for the status line. */
export const branches = (md: string) => md.split('\n').filter((l) => /^\s*(#{2,}|[-*])\s/.test(l)).length

export const titleOf = (md: string) => md.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? 'Untitled map'
