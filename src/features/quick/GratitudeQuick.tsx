import { useRef, useState, type Dispatch, type SetStateAction } from 'react'
import gsap from 'gsap'
import { SwipeDeck } from '../../components/ui/SwipeDeck'
import { MoodGuide } from '../../components/ui/MoodGuide'
import { QuickPanel, lastMood, logMood } from '../../components/ui/QuickPanel'
import type { GratitudeEntry } from '../wellbeing/store'
import { subOn } from '../subFeatures'

const on = (id: string) => subOn('gratitude', id)

/** Prompts, each with a sentence starter and the jar it belongs in. */
export const gratitudePrompts = [
  { id: 'helped', emoji: '🤝', title: 'Did someone help you today?', starter: 'Thank you to ', jar: 'people' },
  { id: 'laughed', emoji: '😂', title: 'Did anything make you laugh?', starter: 'I laughed when ', jar: 'moments' },
  { id: 'body', emoji: '💪', title: 'Did your body carry you through something?', starter: 'Grateful my body ', jar: 'moments' },
  { id: 'food', emoji: '🍲', title: 'Enjoy something you ate or drank?', starter: 'I enjoyed ', jar: 'moments' },
  { id: 'nature', emoji: '🌳', title: 'Notice something in nature?', starter: 'I noticed ', jar: 'moments' },
  { id: 'progress', emoji: '📈', title: 'Make progress on anything?', starter: 'I made progress on ', jar: 'moments' },
  { id: 'comfort', emoji: '🛋️', title: 'Have a moment of comfort?', starter: 'I felt cosy when ', jar: 'moments' },
  { id: 'friend', emoji: '💌', title: 'Think of a friend fondly?', starter: 'I’m glad I know ', jar: 'people' },
]
/** Low moods get the gentlest prompts first. */
const gentle = ['comfort', 'food', 'nature', 'body']

export function GratitudeQuick({ setEntries, jarIds }: { setEntries: Dispatch<SetStateAction<GratitudeEntry[]>>; jarIds: string[] }) {
  const [mood, setMood] = useState(() => lastMood('gratitude'))
  const [draft, setDraft] = useState<{ text: string; jar: string } | null>(null)
  const [saved, setSaved] = useState(0)
  const drop = useRef<HTMLSpanElement>(null)
  const low = mood === 'low' || mood === 'anxious' || mood === 'stressed'
  const prompts = low && on('moodPrompts') ? [...gratitudePrompts].sort((a, b) => Number(gentle.includes(b.id)) - Number(gentle.includes(a.id))) : gratitudePrompts
  const save = () => {
    if (!draft?.text.trim()) return
    setEntries((list) => [{ id: crypto.randomUUID(), at: Date.now(), text: draft.text.trim(), jarId: jarIds.includes(draft.jar) ? draft.jar : jarIds[0] }, ...list])
    setDraft(null)
    setSaved((n) => n + 1)
    if (drop.current && on('noteDrop')) gsap.fromTo(drop.current, { y: -30, opacity: 1, rotate: -20 }, { y: 30, opacity: 0, rotate: 20, duration: 0.9, ease: 'bounce.out' })
  }
  return (
    <QuickPanel id="gratitude" title="Gratitude prompts">
      {on('moodPrompts') && <MoodGuide value={mood} onChange={(m) => { setMood(m); logMood('gratitude', m) }} />}
      {on('promptSwipe') && !draft && (
        <SwipeDeck
          label="Swipe right on a prompt to answer it"
          yes="Yes"
          no="Skip"
          cards={prompts}
          empty={saved ? `${saved} note${saved === 1 ? '' : 's'} added today 💛` : 'That’s all the prompts for now.'}
          onSwipe={(card, yes) => yes && setDraft({ text: card.starter, jar: card.jar })}
        />
      )}
      {draft && (
        <form className="quick-add bloom-wrap" onSubmit={(e) => { e.preventDefault(); save() }}>
          <input autoFocus aria-label="Gratitude note" value={draft.text} maxLength={200} onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
          <button type="submit" className="primary">Into the jar</button>
          <button type="button" className="quiet-button" onClick={() => setDraft(null)}>Cancel</button>
        </form>
      )}
      <span ref={drop} className="gratitude-drop" aria-hidden="true">💌</span>
    </QuickPanel>
  )
}
