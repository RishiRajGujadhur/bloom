import { useTabTitle } from '../../utils/useTabTitle'
import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { setQuiz } from '../../companion/quizContext'
import { BarChart3, Brain, Layers, Plus, Repeat, Trash2, Upload } from 'lucide-react'
import { Rail, Slider, Stat, Studio, StudioScene, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { dayKey } from '../../dates'
import { CARDS_KEY, clozeBack, clozeFront, dueCards, grades, hasCloze, newCard, parseImport, render, review, starterDeck, stats, type Card, type CardStore } from './cardsModel'
import { CardPiles, type PilesHandle } from '../showcase/CardPiles'
import { usePageActions } from '../../components/ui/PageMenu'
import './cards.css'

const on = (id: string) => subOn('flashcards', id)

function Md({ text }: { text: string }) {
  return <div className="fc-md" dangerouslySetInnerHTML={{ __html: on('markdown') ? render(text) : text.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!) }} />
}

/** 3D flip card. */
function FlipCard({ card, flipped, reversed, onFlip }: { card: Card; flipped: boolean; reversed: boolean; onFlip: () => void }) {
  const el = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!el.current) return
    gsap.to(el.current, { rotationY: flipped ? 180 : 0, duration: prefersReducedMotion() ? 0 : 0.6, ease: 'back.out(1.4)' })
  }, [flipped])
  useLayoutEffect(() => {
    if (!el.current || prefersReducedMotion()) return
    gsap.fromTo(el.current.parentElement, { x: 80, opacity: 0, rotation: 4 }, { x: 0, opacity: 1, rotation: 0, duration: 0.5, ease: 'power3.out' })
  }, [card.id])
  const cloze = on('cloze') && hasCloze(card.front)
  const front = cloze ? clozeFront(card.front) : reversed ? card.back : card.front
  const back = cloze ? clozeBack(card.front) + (card.back ? `\n\n${card.back}` : '') : reversed ? card.front : card.back
  return (
    <div className="fc-scene" onClick={onFlip} role="button" aria-label={flipped ? 'Show question' : 'Show answer'} tabIndex={0}>
      <div className="fc-card" ref={el}>
        <div className="fc-face fc-front">
          <Md text={front} />
        </div>
        <div className="fc-face fc-back">
          <Md text={back} />
        </div>
      </div>
    </div>
  )
}

export function CardsPage() {
  const today = dayKey()
  const [store, setStoreState] = useState<CardStore>(() => {
    const s = readStore<CardStore>(CARDS_KEY, { decks: [], cards: [], dailyLimit: 30, log: [] })
    if (!s.decks.length) {
      const d = { id: 'mind', name: 'Mind & calm', emoji: '🧠' }
      return { ...s, decks: [d], cards: starterDeck.map((c) => newCard(d.id, c.front, c.back, today)) }
    }
    return s
  })
  const setStore = (fn: (s: CardStore) => CardStore) =>
    setStoreState((c) => {
      const n = fn(c)
      writeStore(CARDS_KEY, n)
      return n
    })
  const [tab, setTab] = useState('review')
  const [deck, setDeck] = useState<string>('')
  const [flipped, setFlipped] = useState(false)
  const [reversed, setReversed] = useState(false)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [tags, setTags] = useState('')
  const [bulk, setBulk] = useState('')
  const [newDeck, setNewDeck] = useState('')
  const [addDeck, setAddDeck] = useState(store.decks[0]?.id ?? '')
  const reviewedToday = store.log.find((l) => l.date === today)?.count ?? 0
  // Shuffle: a stable random order for this visit, so a graded card doesn't jump back.
  const [shuffle, setShuffle] = useState(() => localStorage.getItem('bloom-cards-shuffle') === '1')
  const [seed] = useState(() => Math.random().toString(36).slice(2))
  const mix = (id: string) => [...(id + seed)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
  const due = dueCards(store.cards, today, on('dailyLimit') ? Math.max(0, store.dailyLimit - reviewedToday) : Infinity, deck || undefined)
  const queue = shuffle ? [...due].sort((a, b) => mix(a.id) - mix(b.id)) : due
  const card = queue[0]
  useTabTitle(queue.length ? `${queue.length} cards due` : '', 'Flashcards', 'cards')
  const stage = useRef<HTMLDivElement>(null)
  // Bloom's chat can hint at the card being studied.
  useEffect(() => {
    setQuiz(card ? { source: 'Flashcards', question: card.front.replace(/\{\{c\d+::(.*?)\}\}/g, '___'), answer: (card.back || card.front.match(/\{\{c\d+::(.*?)\}\}/)?.[1] || '').slice(0, 200) } : null)
  }, [card])
  useEffect(() => () => setQuiz(null), [])

  const piles = useRef<PilesHandle>(null)
  const gradeHints: Record<string, string> = { Again: 'Forgot: see it again today', Hard: 'Remembered with effort: back soon', Good: 'Remembered: spaced further apart', Easy: 'Instant: a long gap before next time' }
  const grade = (g: (typeof grades)[number]) => {
    if (!card) return
    piles.current?.fly(g.grade < 3 ? 'again' : g.grade === 5 || card.interval >= 21 ? 'known' : 'learning')
    setStore((s) => {
      const log = s.log.find((l) => l.date === today) ?? { date: today, count: 0, correct: 0 }
      return {
        ...s,
        cards: s.cards.map((c) => (c.id === card.id ? review(c, g.grade, today) : c)),
        log: [...s.log.filter((l) => l.date !== today), { ...log, count: log.count + 1, correct: log.correct + (g.grade >= 3 ? 1 : 0) }].slice(-365),
      }
    })
    setFlipped(false)
    setReversed(on('reverse') && Math.random() < 0.3)
    if (queue.length === 1) {
      burst(stage.current, 'stars')
      logActivity('flashcards')
    }
  }
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (tab !== 'review' || ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return
      if (e.code === 'Space') {
        e.preventDefault()
        setFlipped((f) => !f)
      }
      const g = grades.find((x) => x.key === e.key)
      if (g && flipped) grade(g)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  })

  const inDeck = store.cards.filter((c) => !deck || c.deck === deck)
  usePageActions(card ? [{ id: 'fc-flip', label: flipped ? 'Hide answer' : 'Show answer', icon: '🔄', run: () => setFlipped(!flipped) }, ...(flipped ? [{ id: 'fc-good', label: 'Grade: Good', icon: '✅', run: () => grade(grades[2]) }] : [])] : [])
  const reviewTab = () => (
    <div className="fc-review" ref={stage}>
      {on('piles') && <CardPiles ref={piles} due={queue.length} learning={inDeck.filter((c) => c.reviews > 0 && c.interval < 21).length} known={inDeck.filter((c) => c.interval >= 21).length} />}
      {on('decks') && (
        <div className="studio-chip-row">
          <button type="button" className="studio-chip" aria-pressed={shuffle} title="Study due cards in a random order" onClick={() => setShuffle((v) => { try { localStorage.setItem('bloom-cards-shuffle', v ? '0' : '1') } catch { /* optional */ } return !v })}>
            🔀 Shuffle
          </button>
          <button type="button" className="studio-chip" aria-pressed={!deck} onClick={() => setDeck('')}>
            All decks
          </button>
          {store.decks.map((d) => (
            <button key={d.id} type="button" className="studio-chip" aria-pressed={deck === d.id} onClick={() => setDeck(d.id)}>
              {d.emoji} {d.name}
            </button>
          ))}
        </div>
      )}
      {card ? (
        <>
          <FlipCard card={card} flipped={flipped} reversed={reversed} onFlip={() => setFlipped(!flipped)} />
          <div className="fc-grades">
            {flipped ? (
              grades.map((g) => (
                <button key={g.label} type="button" className="fc-grade" data-grade={g.label} onClick={() => grade(g)} data-hint={`${gradeHints[g.label]} (key ${g.key})`}>
                  {g.label}
                  <small>{g.key}</small>
                </button>
              ))
            ) : (
              <button type="button" className="studio-go" onClick={() => setFlipped(true)}>
                Show answer <small>space</small>
              </button>
            )}
          </div>
          <p className="studio-empty">{queue.length} left today</p>
        </>
      ) : (
        <div className="studio-center">
          <Brain size={44} />
          <h3>All caught up</h3>
          <p className="studio-empty">Come back tomorrow; the next cards will be waiting.</p>
        </div>
      )}
    </div>
  )

  const addTab = () => (
    <div className="studio-split">
      <div className="studio-card fc-add">
        <select className="studio-input" aria-label="Deck" value={addDeck} onChange={(e) => setAddDeck(e.target.value)}>
          {store.decks.map((d) => (
            <option key={d.id} value={d.id}>
              {d.emoji} {d.name}
            </option>
          ))}
        </select>
        <textarea className="studio-input fc-area" aria-label="Front" placeholder={on('cloze') ? 'Front (Markdown). Cloze: The {{c1::heart}} pumps blood' : 'Front'} value={front} onChange={(e) => setFront(e.target.value)} />
        <textarea className="studio-input fc-area" aria-label="Back" placeholder="Back" value={back} onChange={(e) => setBack(e.target.value)} />
        {on('tags') && <input className="studio-input" aria-label="Tags" placeholder="tags, comma separated" value={tags} onChange={(e) => setTags(e.target.value)} />}
        <button
          type="button"
          className="studio-go"
          disabled={!front.trim() || (!back.trim() && !hasCloze(front))}
          onClick={() => {
            setStore((s) => ({ ...s, cards: [...s.cards, newCard(addDeck, front, back, today, tags.split(',').map((t) => t.trim()).filter(Boolean))] }))
            setFront('')
            setBack('')
          }}
        >
          <Plus size={16} /> Add card
        </button>
      </div>
      <div className="studio-card fc-add">
        <h3>Preview</h3>
        <div className="fc-preview">
          <Md text={on('cloze') && hasCloze(front) ? clozeFront(front) : front || '*Front*'} />
          <hr />
          <Md text={on('cloze') && hasCloze(front) ? clozeBack(front) : back || '*Back*'} />
        </div>
        {on('import') && (
          <>
            <h3>
              <Upload size={16} /> Import
            </h3>
            <textarea className="studio-input fc-area" aria-label="Import lines" placeholder="question;answer — one per line (tab or comma also work)" value={bulk} onChange={(e) => setBulk(e.target.value)} />
            <button
              type="button"
              className="studio-go"
              data-variant="quiet"
              disabled={!parseImport(bulk).length}
              onClick={() => {
                setStore((s) => ({ ...s, cards: [...s.cards, ...parseImport(bulk).map((x) => newCard(addDeck, x.front, x.back, today))] }))
                setBulk('')
              }}
            >
              Import {parseImport(bulk).length} cards
            </button>
          </>
        )}
      </div>
    </div>
  )

  const decksTab = () => (
    <div className="iv-programs">
      <Rail label="Decks">
        {store.decks.map((d) => {
          const list = store.cards.filter((c) => c.deck === d.id)
          return (
            <div key={d.id} role="listitem" className="yg-saved">
              <button type="button" className="iv-card" onClick={() => (setDeck(d.id), setTab('review'))}>
                <span aria-hidden="true">{d.emoji}</span>
                <strong>{d.name}</strong>
                <small>
                  {list.length} cards · {dueCards(list, today).length} due
                </small>
              </button>
              {list.length > 0 && (
                <button
                  type="button"
                  className="yg-remove fc-export"
                  aria-label={`Export ${d.name} as CSV`}
                  title="Export as CSV (front, back, tags)"
                  onClick={() => {
                    const q = (v: string) => `"${v.replace(/"/g, '""')}"`
                    const csv = ['front,back,tags', ...list.map((c) => [q(c.front), q(c.back), q((c.tags ?? []).join(' '))].join(','))].join('\n') + '\n'
                    const a = document.createElement('a')
                    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
                    a.download = `${d.name.replace(/[^\w-]+/g, '-')}.csv`
                    a.click()
                    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
                  }}
                >
                  ⬇
                </button>
              )}
              {store.decks.length > 1 && (
                <button type="button" className="yg-remove" aria-label={`Delete ${d.name}`} onClick={() => setStore((s) => ({ ...s, decks: s.decks.filter((x) => x.id !== d.id), cards: s.cards.filter((c) => c.deck !== d.id) }))}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          )
        })}
      </Rail>
      <form
        className="sc-manual"
        onSubmit={(e) => {
          e.preventDefault()
          if (!newDeck.trim()) return
          const d = { id: crypto.randomUUID(), name: newDeck.trim(), emoji: '📚' }
          setStore((s) => ({ ...s, decks: [...s.decks, d] }))
          setAddDeck(d.id)
          setNewDeck('')
        }}
      >
        <input className="studio-input" aria-label="New deck name" placeholder="New deck" value={newDeck} onChange={(e) => setNewDeck(e.target.value)} />
        <button type="submit" className="studio-go" data-variant="quiet" aria-label="Add deck">
          <Plus size={16} />
        </button>
      </form>
      {on('dailyLimit') && (
        <div className="st-scale">
          <Slider label="Reviews per day" value={store.dailyLimit} min={5} max={200} step={5} onChange={(v) => setStore((s) => ({ ...s, dailyLimit: v }))} />
        </div>
      )}
    </div>
  )

  const st = stats(store.cards, today)
  const max = Math.max(1, ...st.next7)
  const statsTab = () => (
    <div className="studio-split">
      <div className="studio-card">
        <div className="studio-stats">
          <Stat value={st.total} label="cards" />
          <Stat value={st.fresh} label="new" />
          <Stat value={st.young} label="learning" />
          <Stat value={st.mature} label="mature (21+ days)" />
        <Stat
          value={(() => {
            const recent = store.log.slice(-30)
            const n = recent.reduce((a, l) => a + l.count, 0)
            return n ? `${Math.round((recent.reduce((a, l) => a + l.correct, 0) / n) * 100)}%` : '—'
          })()}
          label="recalled (30 days)"
        />
        </div>
        <p className="studio-empty">
          Accuracy today: {reviewedToday ? `${Math.round(((store.log.find((l) => l.date === today)?.correct ?? 0) / reviewedToday) * 100)}%` : '—'}
        </p>
      </div>
      <div className="studio-card">
        <h3>Due in the next 7 days</h3>
        <div className="run-weeks">
          {st.next7.map((n, i) => (
            <span key={i} style={{ height: `${Math.max(4, (n / max) * 100)}%`, background: i === 0 ? '#8f7ae5' : '#c9b8ff' }} title={`${n} cards`} />
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <Studio
      name="cards"
      accent="#6b5bd6"
      tab={tab}
      onTab={setTab}
      scene={<StudioScene colors={['#c9b8ff', '#9fd3ff', '#ffe29a']} line="none" />}
      aside={
        <span className="ex-aside">
          <Repeat size={15} /> {dueCards(store.cards, today).length} due
        </span>
      }
      tabs={[
        { id: 'review', label: 'Review', icon: <Repeat size={15} />, render: reviewTab },
        { id: 'add', label: 'Add', icon: <Plus size={15} />, render: addTab },
        ...(on('decks') ? [{ id: 'decks', label: 'Decks', icon: <Layers size={15} />, render: decksTab }] : []),
        ...(on('stats') ? [{ id: 'stats', label: 'Stats', icon: <BarChart3 size={15} />, render: statsTab }] : []),
      ]}
    />
  )
}
