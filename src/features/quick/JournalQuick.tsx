import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Sentiment from 'sentiment'
import { SwipeDeck } from '../../components/ui/SwipeDeck'
import { MoodGuide } from '../../components/ui/MoodGuide'
import { QuickPanel, lastMood, logMood } from '../../components/ui/QuickPanel'
import { moodScore } from './MoodQuick'
import { subOn } from '../subFeatures'

const on = (id: string) => subOn('chatJournal', id)
const sentiment = new Sentiment()

export const journalTopics = [
  { id: 'work', emoji: '💼', title: 'Work or study' },
  { id: 'people', emoji: '🤝', title: 'People in my life' },
  { id: 'health', emoji: '🌿', title: 'Body and health' },
  { id: 'money', emoji: '💰', title: 'Money' },
  { id: 'creativity', emoji: '🎨', title: 'Something I’m making' },
  { id: 'future', emoji: '🧭', title: 'Where I’m heading' },
  { id: 'worry', emoji: '🌧️', title: 'A worry' },
  { id: 'win', emoji: '🏆', title: 'A small win' },
]

/** Tone of the latest reply as −1 … 1, shown as a coloured SVG meter. */
export const toneOf = (text: string) => Math.max(-1, Math.min(1, sentiment.analyze(text).comparative))

function ToneMeter({ tone }: { tone: number }) {
  const dot = useRef<SVGCircleElement>(null)
  useLayoutEffect(() => {
    if (!dot.current) return
    const tw = gsap.to(dot.current, { attr: { cx: 10 + (tone + 1) * 90 }, duration: 0.6, ease: 'power2.out' })
    return () => void tw.kill()
  }, [tone])
  return (
    <svg className="tone-meter" viewBox="0 0 200 24" role="img" aria-label={`Tone ${tone > 0.1 ? 'positive' : tone < -0.1 ? 'heavy' : 'neutral'}`}>
      <defs>
        <linearGradient id="tone" x1="0" x2="1">
          <stop offset="0" stopColor="#6c8ebf" />
          <stop offset="0.5" stopColor="#c5cae9" />
          <stop offset="1" stopColor="#f7c948" />
        </linearGradient>
      </defs>
      <rect x="10" y="9" width="180" height="6" rx="3" fill="url(#tone)" />
      <circle ref={dot} cx="100" cy="12" r="7" fill="#fff" stroke="#555" strokeWidth="1.5" />
    </svg>
  )
}

export function JournalQuick({
  lastReply,
  onMood,
  onTopics,
}: {
  lastReply: string
  onMood: (score: number) => void
  onTopics: (topics: string[]) => void
}) {
  const [mood, setMood] = useState(() => lastMood('journal'))
  const [topics, setTopics] = useState<string[]>([])
  return (
    <QuickPanel id="journal" title="Start without a blank page">
      {on('moodStart') && (
        <MoodGuide
          value={mood}
          onChange={(m) => {
            setMood(m)
            logMood('journal', m)
            onMood(moodScore[m] ?? 3)
          }}
        />
      )}
      {on('topicSwipe') && (
        <SwipeDeck
          label="What's on your mind? Swipe right on topics"
          yes="Yes"
          no="No"
          cards={journalTopics}
          empty={topics.length ? `Tagged: ${topics.join(', ')}` : 'No topics — free writing it is.'}
          onSwipe={(card, yes) => {
            if (!yes) return
            const next = [...topics, card.id]
            setTopics(next)
            onTopics(next)
          }}
          onUndo={(card) => {
            const next = topics.filter((t) => t !== card.id)
            setTopics(next)
            onTopics(next)
          }}
        />
      )}
      {on('toneMeter') && lastReply && (
        <div>
          <small className="quick-note">Tone of your last reply</small>
          <ToneMeter tone={toneOf(lastReply)} />
        </div>
      )}
    </QuickPanel>
  )
}
