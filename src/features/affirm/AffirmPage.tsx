import { useEffect, useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectCards, Keyboard } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-cards'
import { Heart, Layers, Pause, Play, Plus, Repeat2, Sparkles, Sun, Trash2, Volume2 } from 'lucide-react'
import { Segmented, Slider, Studio, StudioScene, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { AFFIRM_KEY, cardsFor, dailyCard, deckOf, decks, shuffle, type AffirmStore } from './affirmModel'
import { AffirmQuick } from '../quick/AffirmQuick'
import './affirm.css'

const on = (id: string) => subOn('affirmations', id)
const say = (t: string) => {
  try {
    speechSynthesis.cancel()
    speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(t), { rate: 0.9 }))
  } catch {
    /* optional */
  }
}

export function AffirmPage() {
  const [store, setStoreState] = useState<AffirmStore>(() => readStore(AFFIRM_KEY, { favourites: [], custom: [], repeats: {}, theme: 'gradient', autoplay: 0 }))
  const setStore = (fn: (s: AffirmStore) => AffirmStore) =>
    setStoreState((c) => {
      const n = fn(c)
      writeStore(AFFIRM_KEY, n)
      return n
    })
  const [tab, setTab] = useState('swipe')
  const [deck, setDeckState] = useState(() => {
    try {
      const saved = localStorage.getItem('bloom-affirm-deck')
      if (saved) return saved
    } catch { /* optional */ }
    return on('daily') ? 'daily' : decks[0].id
  })
  const setDeck = (d: string) => {
    setDeckState(d)
    try { localStorage.setItem('bloom-affirm-deck', d) } catch { /* optional */ }
  }
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [draft, setDraft] = useState('')
  const [shuffled, setShuffled] = useState(0)
  const base = deck === 'daily' ? [dailyCard(), ...cardsFor('mix', store).filter((c) => c !== dailyCard())] : cardsFor(deck, store)
  const cards = shuffled && deck !== 'daily' ? shuffle(base, shuffled) : base
  const current = cards[Math.min(index, cards.length - 1)]
  // F saves the card in view.
  const favRef = useRef(() => {})
  favRef.current = () => { if (current && on('favourites')) fav(current) }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'f' || e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement | null)?.closest?.('input, textarea')) return
      favRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const theme = on('themes') ? store.theme : 'gradient'

  const repeat = (card: string, e: React.MouseEvent<HTMLElement>) => {
    setStore((s) => ({ ...s, repeats: { ...s.repeats, [card]: (s.repeats[card] ?? 0) + 1 } }))
    if (((store.repeats[card] ?? 0) + 1) % 3 === 0) burst(e.currentTarget, 'stars')
    if ((store.repeats[card] ?? 0) === 0) logActivity('affirmation')
  }
  const fav = (card: string) => setStore((s) => ({ ...s, favourites: s.favourites.includes(card) ? s.favourites.filter((x) => x !== card) : [...s.favourites, card] }))
  const deckOptions = [
    ...(on('daily') ? [{ id: 'daily', label: '☀️ Today' }] : []),
    ...(on('decks') ? decks.map((d) => ({ id: d.id, label: `${d.emoji} ${d.name}` })) : []),
    ...(on('mix') ? [{ id: 'mix', label: '🔀 Mix' }] : []),
    ...(on('favourites') && store.favourites.length ? [{ id: 'favourites', label: '❤️ Saved' }] : []),
    ...(on('custom') && store.custom.length ? [{ id: 'mine', label: '✍️ Mine' }] : []),
  ]

  const swipe = () => (
    <div className="af-layout">
      <AffirmQuick onDeck={(d) => { setDeck(d); setIndex(0) }} />
      <div className="studio-chip-row">
        {deck !== 'daily' && (
          <button type="button" className="studio-chip" aria-pressed={shuffled > 0} title="Shuffle this deck" onClick={() => { setShuffled(shuffled ? 0 : Math.floor(Math.random() * 1e6) + 1); setIndex(0) }}>
            🔀
          </button>
        )}
        {deckOptions.map((o) => (
          <button key={o.id} type="button" className="studio-chip" aria-pressed={deck === o.id} onClick={() => (setDeck(o.id), setIndex(0))}>
            {o.label}
          </button>
        ))}
      </div>
      {cards.length ? (
        <div className="af-stage" data-theme={theme}>
          <Swiper
            key={`${deck}-${playing}-${store.autoplay}`}
            modules={[EffectCards, Keyboard, Autoplay]}
            effect="cards"
            grabCursor
            keyboard={{ enabled: true }}
            autoplay={on('autoplay') && playing ? { delay: store.autoplay * 1000 || 6000, disableOnInteraction: true } : false}
            onSlideChange={(s) => {
              setIndex(s.activeIndex)
              if (on('speak') && playing) say(cards[s.activeIndex])
            }}
            className="af-swiper"
          >
            {cards.map((c, i) => {
              const d = deckOf(c)
              return (
                <SwiperSlide key={`${c}-${i}`} className="af-card" style={{ ['--g1' as string]: d?.gradient[0] ?? '#8f7ae5', ['--g2' as string]: d?.gradient[1] ?? '#f4c7d8' }}>
                  <span className="af-deck">
                    {d?.emoji} {deck === 'daily' && i === 0 ? 'Today’s card' : (d?.name ?? 'Yours')}
                  </span>
                  <p>{c}</p>
                  {on('repeat') && (store.repeats[c] ?? 0) > 0 && <span className="af-count">×{store.repeats[c]}</span>}
                </SwiperSlide>
              )
            })}
          </Swiper>
        </div>
      ) : (
        <p className="studio-empty">This deck is empty.</p>
      )}
      {current && (
        <div className="af-actions">
          {on('favourites') && (
            <button type="button" className="af-btn" aria-pressed={store.favourites.includes(current)} aria-label="Save to favourites" title="Save (F)" onClick={() => fav(current)}>
              <Heart size={20} />
            </button>
          )}
          {on('repeat') && (
            <button type="button" className="af-btn af-say" onClick={(e) => repeat(current, e)}>
              <Repeat2 size={18} /> Say it again
            </button>
          )}
          <button type="button" className="af-btn" aria-label="Copy this affirmation" title="Copy" onClick={(e) => { void navigator.clipboard?.writeText(current); e.currentTarget.textContent = '✓' }}>
            📋
          </button>
          {on('speak') && (
            <button type="button" className="af-btn" aria-label="Read aloud" onClick={() => say(current)}>
              <Volume2 size={20} />
            </button>
          )}
          {on('autoplay') && (
            <button type="button" className="af-btn" aria-label={playing ? 'Stop slideshow' : 'Play slideshow'} onClick={() => setPlaying(!playing)}>
              {playing ? <Pause size={20} /> : <Play size={20} />}
            </button>
          )}
        </div>
      )}
      <small className="studio-empty">
        {index + 1} / {cards.length} · swipe, drag or use arrow keys
      </small>
    </div>
  )

  const settings = () => (
    <div className="studio-split">
      {on('custom') && (
        <div className="studio-card rm-side">
          <h3>Write your own</h3>
          <form
            className="sc-manual"
            onSubmit={(e) => {
              e.preventDefault()
              if (!draft.trim()) return
              setStore((s) => ({ ...s, custom: [...s.custom, draft.trim()] }))
              setDraft('')
            }}
          >
            <input className="studio-input" aria-label="Your affirmation" placeholder="I am…" value={draft} onChange={(e) => setDraft(e.target.value)} />
            <button type="submit" className="studio-go" data-variant="quiet" aria-label="Add">
              <Plus size={16} />
            </button>
          </form>
          <ul className="rm-ms">
            {store.custom.map((c) => (
              <li key={c}>
                <span>{c}</span>
                <button type="button" className="icon-button" aria-label={`Delete ${c}`} onClick={() => setStore((s) => ({ ...s, custom: s.custom.filter((x) => x !== c) }))}>
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="studio-card rm-side">
        {on('themes') && <Segmented label="Card style" value={store.theme} onChange={(t) => setStore((s) => ({ ...s, theme: t }))} options={[{ id: 'gradient', label: 'Gradient' }, { id: 'paper', label: 'Paper' }, { id: 'night', label: 'Night' }]} />}
        {on('autoplay') && <Slider label="Slideshow pace" value={store.autoplay || 6} min={3} max={20} unit="s" onChange={(v) => setStore((s) => ({ ...s, autoplay: v }))} />}
        {on('repeat') && <p className="studio-empty">{Object.values(store.repeats).reduce((a, b) => a + b, 0)} affirmations spoken so far.</p>}
      </div>
    </div>
  )

  return (
    <Studio
      name="affirm"
      accent="#e27396"
      tab={tab}
      onTab={(t) => (setPlaying(false), setTab(t))}
      scene={<StudioScene colors={['#f4c7d8', '#c9b8ff', '#ffd89b']} line="wave" />}
      tabs={[
        { id: 'swipe', label: 'Cards', icon: deck === 'daily' ? <Sun size={15} /> : <Sparkles size={15} />, render: swipe },
        { id: 'settings', label: 'Make it yours', icon: <Layers size={15} />, render: settings },
      ]}
    />
  )
}
