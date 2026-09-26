export type Deck = { id: string; name: string; emoji: string; gradient: [string, string]; cards: string[] }
export const decks: Deck[] = [
  { id: 'calm', name: 'Calm', emoji: '🌊', gradient: ['#5aa9e6', '#9fdcc8'], cards: ['I am safe in this moment.', 'I can slow down.', 'My breath is always here for me.', 'I let go of what I cannot control.', 'Peace begins with this breath.', 'I am allowed to rest.'] },
  { id: 'confidence', name: 'Confidence', emoji: '🔥', gradient: ['#e2703f', '#f2c14e'], cards: ['I can do hard things.', 'I trust myself.', 'My voice matters.', 'I have done difficult things before.', 'I am ready to begin.', 'I am enough, exactly as I am.'] },
  { id: 'kindness', name: 'Self-kindness', emoji: '💗', gradient: ['#e27396', '#f7c7a8'], cards: ['I speak to myself like a friend.', 'Mistakes help me grow.', 'I deserve care, too.', 'I forgive myself.', 'I am learning, and that is okay.', 'My feelings are welcome.'] },
  { id: 'growth', name: 'Growth', emoji: '🌱', gradient: ['#3f8a5a', '#c8e6a0'], cards: ['Small steps count.', 'Progress, not perfection.', 'Every day I get a little better.', 'I choose the next right thing.', 'I am becoming who I want to be.', 'Effort is never wasted.'] },
  { id: 'gratitude', name: 'Gratitude', emoji: '✨', gradient: ['#8f7ae5', '#f4c7d8'], cards: ['There is good in today.', 'I notice what is going well.', 'I am grateful for my body.', 'Simple things bring me joy.', 'I have people who care.', 'This moment is a gift.'] },
]
export type AffirmStore = { favourites: string[]; custom: string[]; repeats: Record<string, number>; theme: 'gradient' | 'paper' | 'night'; autoplay: number }
export const AFFIRM_KEY = 'bloom-affirm-v1'

export function cardsFor(deckId: string, store: Pick<AffirmStore, 'favourites' | 'custom'>) {
  if (deckId === 'favourites') return store.favourites
  if (deckId === 'mine') return store.custom
  if (deckId === 'mix') return shuffle(decks.flatMap((d) => d.cards), dayNumber())
  return decks.find((d) => d.id === deckId)?.cards ?? []
}

export const dayNumber = (d = new Date()) => Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000)

/** Deterministic shuffle so "mix" is stable for a day. */
export function shuffle<T>(list: T[], seed: number) {
  const out = [...list]
  let s = seed || 1
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** One card for today, from all decks. */
export const dailyCard = (d = new Date()) => {
  const all = decks.flatMap((x) => x.cards)
  return all[dayNumber(d) % all.length]
}
export const deckOf = (card: string) => decks.find((d) => d.cards.includes(card))
